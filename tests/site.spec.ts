import { expect, test } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const siteUrl = `file:///${resolve('index.html').replace(/\\/g, '/')}`;
const editorUrl = `file:///${resolve('editor.html').replace(/\\/g, '/')}`;

test('all internal resources work from a nested static-server directory', async ({ page }) => {
  const root = resolve('.');
  const prefix = '/static/sites/schmida/';
  const contentTypes:Record<string,string> = {
    '.html':'text/html; charset=utf-8',
    '.js':'text/javascript; charset=utf-8',
    '.css':'text/css; charset=utf-8',
    '.png':'image/png',
    '.jpg':'image/jpeg',
    '.jpeg':'image/jpeg'
  };
  const server = createServer(async (request,response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url || '/',`http://${request.headers.host}`).pathname);
      if (!pathname.startsWith(prefix)) {
        response.writeHead(404).end('Not found');
        return;
      }
      const relativePath = pathname.slice(prefix.length) || 'index.html';
      const filePath = resolve(root,relativePath);
      if (!filePath.toLowerCase().startsWith(`${root}${sep}`.toLowerCase())) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const body = await readFile(filePath);
      response.writeHead(200,{ 'Content-Type':contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise<void>((resolveListen,reject) => {
    server.once('error',reject);
    server.listen(0,'127.0.0.1',resolveListen);
  });

  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Static test server did not start');
    const origin = `http://127.0.0.1:${address.port}`;
    const baseUrl = `${origin}${prefix}`;
    const badLocalResponses:string[] = [];
    const loadedLocalPaths = new Set<string>();
    page.on('response',(response) => {
      if (!response.url().startsWith(baseUrl)) return;
      loadedLocalPaths.add(new URL(response.url()).pathname.slice(prefix.length));
      if (response.status() >= 400) badLocalResponses.push(`${response.status()} ${response.url()}`);
    });
    await page.route('https://www.google.com/maps/embed**',(route) => route.fulfill({
      status:200,
      contentType:'text/html',
      body:'<!doctype html><title>Map test</title>'
    }));

    await page.goto(baseUrl);
    await expect(page.locator('.hero-image')).toHaveJSProperty('complete',true);
    await expect(page.locator('.brand-mark')).toHaveJSProperty('complete',true);
    expect(await page.locator('.hero-image').evaluate((image:HTMLImageElement) => image.currentSrc)).toMatch(`${baseUrl}assets/`);
    expect(await page.locator('.brand-mark').evaluate((image:HTMLImageElement) => image.currentSrc)).toMatch(`${baseUrl}assets/`);

    await page.getByRole('link',{ name:'Praxis',exact:true }).click();
    const carousel = page.locator('#praxis [data-carousel]');
    const dots = carousel.locator('[data-carousel-dot]');
    for (let index = 0; index < await dots.count(); index += 1) {
      await dots.nth(index).click();
      const image = carousel.locator(`[data-carousel-slide="${index}"] .section-image`);
      await expect.poll(() => image.evaluate((element:HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
      expect(await image.evaluate((element:HTMLImageElement) => element.currentSrc)).toMatch(`${baseUrl}assets/`);
    }

    await page.goto(`${baseUrl}editor.html`);
    await page.getByRole('button',{ name:'Vorschau Desktop' }).click();
    const preview = page.frameLocator('#preview-frame');
    await expect(preview.locator('.hero-image')).toHaveJSProperty('complete',true);
    await expect(preview.locator('.brand-mark')).toHaveJSProperty('complete',true);
    const previewFrame = page.frames().find((frame) => frame !== page.mainFrame() && frame.url().startsWith(`${baseUrl}index.html?`));
    expect(previewFrame).toBeDefined();
    expect(await preview.locator('.hero-image').evaluate((image:HTMLImageElement) => image.currentSrc)).toMatch(`${baseUrl}assets/`);

    expect(badLocalResponses).toEqual([]);
    for (const resource of ['index.html','editor.html','content-model.js','content.js','section-layout.js','editor-enhancements.js','listing-styles.css','timeline-styles.css']) {
      expect(loadedLocalPaths).toContain(resource);
    }
  } finally {
    await new Promise<void>((resolveClose,reject) => server.close((error) => error ? reject(error) : resolveClose()));
  }
});

test('renders the new section schema with dynamic navigation and waves', async ({ page }) => {
  await page.goto(siteUrl);

  await expect(page).toHaveTitle('Carina Schmida, BA.pth.');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href','assets/icon4_tiny.png');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href','assets/icon4_tiny.png');
  await expect(page.locator('.brand-mark')).toHaveAttribute('src','assets/icon4_tiny.png');
  await expect(page.locator('.brand-mark')).toHaveJSProperty('complete',true);
  expect(await page.locator('.brand-mark').evaluate((image:HTMLImageElement) => image.naturalWidth)).toBe(180);
  await expect(page.locator('.header-inner')).toHaveCSS('min-height','74px');
  const savedHeroTitleSize = await page.evaluate(() => window.currentPracticeContent.hero.titleSize);
  await expect(page.locator('.hero')).toHaveAttribute('data-title-size',savedHeroTitleSize);
  const heroColumns = await page.locator('.hero').evaluate((element) => {
    const title = element.querySelector('[data-hero-field="title"]')!.getBoundingClientRect();
    const image = element.querySelector('.hero-image-wrap')!.getBoundingClientRect();
    return { titleRight:title.right,imageLeft:image.left };
  });
  expect(heroColumns.titleRight).toBeLessThanOrEqual(heroColumns.imageLeft);
  await expect(page.getByRole('navigation')).toHaveText(/Startseite[\s\S]*Psychotherapie[\s\S]*Schwerpunkte[\s\S]*Über mich[\s\S]*Praxis[\s\S]*Kontakt/);
  const savedSections = await page.evaluate(() => window.currentPracticeContent.sections);
  await expect(page.locator('.content-section')).toHaveCount(savedSections.length);
  const savedTopics = savedSections.find((section) => section.layout === 'topics')!;
  await expect(page.locator('.content-section[data-layout="topics"] .topics-list li')).toHaveCount(savedTopics.content.items.filter((item) => item.text).length);
  const savedListStyle = savedTopics.appearance.listStyle || 'numbered-grid';
  await expect(page.locator('.content-section[data-layout="topics"] .topics-list')).toHaveAttribute('data-list-style',savedListStyle);
  await expect(page.locator('.content-section[data-layout="timeline"]')).toHaveCount(savedSections.filter((section) => section.layout === 'timeline').length);
  await expect(page.locator('.section-heading-desktop h2')).toHaveCount(savedSections.length);
  await expect(page.locator('.section-heading-mobile h2')).toHaveCount(savedSections.length);
  await expect(page.locator('.section-heading-desktop').first()).toBeVisible();
  await expect(page.locator('.section-heading-mobile').first()).toBeHidden();
  const headingModes = savedSections.map((section) => section.appearance);
  const desktopEyebrows = headingModes.filter((appearance) => appearance.headingModeDesktop === 'eyebrow').length;
  const desktopTitles = headingModes.filter((appearance) => appearance.headingModeDesktop === 'title').length;
  const bothVariants = headingModes.reduce((count,appearance) => count + Number(appearance.headingModeDesktop === 'both') + Number(appearance.headingModeMobile === 'both'),0);
  await expect(page.locator('.dynamic-section .eyebrow')).toHaveCount(bothVariants);
  await expect(page.locator('.dynamic-section[data-heading-desktop="eyebrow"]')).toHaveCount(desktopEyebrows);
  await expect(page.locator('.dynamic-section[data-heading-desktop="title"]')).toHaveCount(desktopTitles);
  await expect(page.locator('#psychotherapie .section-heading-desktop .section-heading-accent')).toHaveCSS('color','rgb(209, 17, 55)');
  await expect(page.locator('#kontakt .section-heading-desktop .section-heading-accent')).toHaveCSS('color','rgb(255, 154, 169)');
  await expect(page.locator('#psychotherapie')).toHaveCSS('padding-top','104px');
  const configuredTextColors = await page.evaluate(() => {
    const bodyProbe = document.createElement('span');
    const introProbe = document.createElement('span');
    bodyProbe.style.color = 'var(--body-text)';
    introProbe.style.color = 'var(--intro-text)';
    document.body.append(bodyProbe,introProbe);
    const body = getComputedStyle(document.querySelector('#psychotherapie .intro-grid > div:last-child > p')!);
    const intro = getComputedStyle(document.querySelector('#schwerpunkte .section-intro-text')!);
    const colors = {
      body:[getComputedStyle(bodyProbe).color,body.color],
      intro:[getComputedStyle(introProbe).color,intro.color]
    };
    bodyProbe.remove();
    introProbe.remove();
    return colors;
  });
  expect(configuredTextColors.body[1]).toBe(configuredTextColors.body[0]);
  expect(configuredTextColors.intro[1]).toBe(configuredTextColors.intro[0]);
  await expect(page.locator('.hero .eyebrow')).toHaveCSS('font-size','11.2px');
  await expect(page.locator('.ribbon-transition')).toHaveCount(savedSections.length);
  await expect(page.locator('.hero-image')).toHaveJSProperty('complete',true);
  const savedContact = savedSections.find((section) => section.layout === 'contact');
  await expect(page.locator('#kontakt')).toContainText(savedContact!.content.email);
  const savedWideImage = savedSections.find((section) => section.layout === 'wideImage');
  const firstWideImage = page.locator('.wide-image-frame .section-image').first();
  await expect(firstWideImage).toHaveAttribute('src',savedWideImage!.content.images[0].imageSrc);
  await expect(firstWideImage).toHaveAttribute('loading','lazy');
  await expect(firstWideImage).toHaveCSS('object-position','50% 0%');

  await page.getByRole('link',{ name:'Praxis',exact:true }).click();
  await expect(page.locator('#praxis')).toBeInViewport();
  await firstWideImage.evaluate((image:HTMLImageElement) => image.decode());
  expect(await firstWideImage.evaluate((image:HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);

  const seamCoverage = await page.locator('.hero-ribbon').evaluate((element) => {
    const style = getComputedStyle(element,'::after');
    return { height:style.height,background:style.backgroundColor };
  });
  expect(seamCoverage.height).toBe('4px');
  expect(seamCoverage.background).not.toBe('rgba(0, 0, 0, 0)');
});

test('card grids draw complete row dividers at desktop and mobile widths', async ({ page }) => {
  await page.goto(editorUrl);
  await page.selectOption('#new-layout','cards');
  await page.getByRole('button',{ name:'Bereich hinzufügen' }).click();

  const editor = page.locator('.section-editor').last();
  for (let index = 0; index < 4; index += 1) {
    await editor.locator('[data-collection-action="add"]').click();
  }
  await expect(editor.locator('[data-collection-action="add"]')).toBeDisabled();
  await editor.getByRole('button',{ name:/Desktopvorschau/ }).click();

  const preview = page.frameLocator('#preview-frame');
  const grid = preview.locator('.focus-grid');
  const cards = grid.locator('.focus-card');
  await expect(cards).toHaveCount(6);
  await expect(grid).toHaveCSS('grid-template-columns',/\d+(?:\.\d+)?px \d+(?:\.\d+)?px \d+(?:\.\d+)?px/);

  await expect(cards.nth(0)).toHaveCSS('padding-left','0px');
  await expect(cards.nth(2)).toHaveCSS('border-right-width','0px');
  await expect(cards.nth(3)).toHaveCSS('padding-left','0px');
  await expect(cards.nth(3)).toHaveCSS('border-right-width','1px');
  await expect(cards.nth(5)).toHaveCSS('border-right-width','0px');

  await page.locator('#preview-frame').evaluate((frame:HTMLIFrameElement) => frame.style.width = '760px');
  await expect(grid).toHaveCSS('grid-template-columns',/\d+(?:\.\d+)?px \d+(?:\.\d+)?px/);
  await expect(cards.nth(2)).toHaveCSS('border-right-width','1px');
  await expect(cards.nth(3)).toHaveCSS('border-right-width','0px');

  await page.locator('#preview-frame').evaluate((frame:HTMLIFrameElement) => frame.style.width = '440px');
  await expect(grid).toHaveCSS('grid-template-columns',/^[\d.]+px$/);
  await expect(cards.nth(2)).toHaveCSS('border-right-width','0px');
  await expect(cards.nth(3)).toHaveCSS('border-right-width','0px');
});

test('title grids stay compact without per-item descriptions', async ({ page }) => {
  await page.goto(editorUrl);
  await page.selectOption('#new-layout','titleCards');
  await page.getByRole('button',{ name:'Bereich hinzufügen' }).click();

  const editor = page.locator('.section-editor').last();
  await expect(editor.locator('[data-path*=".content.items."][data-path$=".title"]')).toHaveCount(2);
  await expect(editor.locator('[data-path*=".content.items."][data-path$=".text"]')).toHaveCount(0);
  const font = editor.locator('[data-path$=".appearance.itemTitleFont"]');
  const size = editor.locator('[data-path$=".appearance.itemTitleSize"]');
  await expect(font).toHaveValue('serif');
  await expect(size).toHaveValue('25');
  await font.selectOption('sans');
  await size.evaluate((input:HTMLInputElement) => {
    input.value = '32';
    input.dispatchEvent(new Event('input',{ bubbles:true }));
  });
  for (let index = 0; index < 6; index += 1) {
    await editor.locator('[data-collection-action="add"]').click();
  }
  await expect(editor.locator('[data-collection-action="add"]')).toBeDisabled();
  await editor.getByRole('button',{ name:/Desktopvorschau/ }).click();

  const preview = page.frameLocator('#preview-frame');
  const grid = preview.locator('.layout-title-cards .focus-grid');
  const cards = grid.locator('.title-card');
  await expect(cards).toHaveCount(8);
  await expect(cards.locator('p')).toHaveCount(0);
  await expect(cards.first()).toHaveCSS('min-height','104px');
  await expect(cards.first().locator('h3')).toHaveCSS('font-family',/Inter|ui-sans-serif|system-ui/);
  await expect(cards.first().locator('h3')).toHaveCSS('font-size','32px');
  await expect(grid).toHaveCSS('grid-template-columns',/\d+(?:\.\d+)?px \d+(?:\.\d+)?px \d+(?:\.\d+)?px \d+(?:\.\d+)?px/);

  await page.locator('#preview-frame').evaluate((frame:HTMLIFrameElement) => frame.style.width = '760px');
  await expect(grid).toHaveCSS('grid-template-columns',/\d+(?:\.\d+)?px \d+(?:\.\d+)?px/);
  await expect(cards.first()).toHaveCSS('min-height','104px');

  await page.locator('#preview-frame').evaluate((frame:HTMLIFrameElement) => frame.style.width = '440px');
  await expect(grid).toHaveCSS('grid-template-columns',/^[\d.]+px$/);
  await expect(cards.first().locator('h3')).toHaveCSS('font-size','32px');
  const mobileFit = await grid.evaluate((element) => ({
    viewport:document.documentElement.clientWidth,
    scrollWidth:document.documentElement.scrollWidth,
    cardHeight:element.querySelector('.title-card')!.getBoundingClientRect().height
  }));
  expect(mobileFit.scrollWidth).toBeLessThanOrEqual(mobileFit.viewport);
  expect(mobileFit.cardHeight).toBeLessThan(110);
});

test('provides a usable compact navigation', async ({ page }) => {
  await page.setViewportSize({ width:390,height:844 });
  await page.goto(siteUrl);
  await expect(page.locator('.header-inner')).toHaveCSS('min-height','65px');

  const menu = page.getByRole('button',{ name:'Menü' });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded','true');
  await expect(page.getByRole('link',{ name:'Kontakt',exact:true })).toBeVisible();
  await page.getByRole('link',{ name:'Kontakt',exact:true }).click();
  await expect(page.locator('#kontakt')).toBeInViewport();
});

test('hero image stays uncropped and all content remains above the ribbon', async ({ page }) => {
  for (const viewport of [
    { width:390,height:844 },
    { width:720,height:900 },
    { width:900,height:650 },
    { width:901,height:650 },
    { width:1280,height:720 },
    { width:1920,height:900 },
    { width:2400,height:1200 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(siteUrl);

    const layout = await page.evaluate(() => {
      const hero = document.querySelector('.hero')!.getBoundingClientRect();
      const imageWrap = document.querySelector('.hero-image-wrap')!.getBoundingClientRect();
      const image = document.querySelector('.hero-image') as HTMLImageElement;
      const imageBox = image.getBoundingClientRect();
      const ribbon = document.querySelector('.hero-ribbon')!.getBoundingClientRect();
      const copy = document.querySelector('.hero-copy')!.getBoundingClientRect();
      const firstText = document.querySelector('.hero .eyebrow')!.getBoundingClientRect();
      const contact = document.querySelector('.hero-contact')!.getBoundingClientRect();
      return {
        heroTop:hero.top,
        heroBottom:hero.bottom,
        imageTop:imageBox.top,
        imageRight:imageBox.right,
        imageBottom:imageBox.bottom,
        imageWidth:imageBox.width,
        imageHeight:imageBox.height,
        imageWrapBottom:imageWrap.bottom,
        naturalRatio:image.naturalWidth / image.naturalHeight,
        ribbonTop:ribbon.top,
        ribbonBottom:ribbon.bottom,
        contentTop:firstText.top,
        copyBottom:copy.bottom,
        contactBottom:contact.bottom,
        viewportWidth:document.documentElement.clientWidth
      };
    });

    expect(layout.imageBottom).toBeCloseTo(layout.imageWrapBottom,0);
    expect(layout.imageWidth / layout.imageHeight).toBeCloseTo(layout.naturalRatio,2);
    expect(layout.copyBottom).toBeLessThanOrEqual(layout.ribbonTop + 1);
    expect(layout.contactBottom).toBeLessThanOrEqual(layout.ribbonTop + 1);

    const expectedTopSpacing = Math.min(32,Math.max(20,viewport.width * .02));
    expect(layout.contentTop - layout.heroTop).toBeCloseTo(expectedTopSpacing,0);

    if (viewport.width <= 900) {
      expect(layout.imageRight).toBeGreaterThanOrEqual(layout.viewportWidth - 1);
      expect(layout.imageBottom).toBeCloseTo(layout.ribbonBottom,0);
      expect(layout.imageBottom).toBeCloseTo(layout.heroBottom,0);
    } else {
      expect(layout.imageRight).toBeGreaterThanOrEqual(layout.viewportWidth - 1);
      expect(layout.imageBottom).toBeCloseTo(layout.ribbonBottom,0);
      expect(layout.imageBottom).toBeCloseTo(layout.heroBottom,0);
    }
  }

  await page.setViewportSize({ width:1280,height:720 });
  await page.goto(siteUrl);
  await page.locator('.hero-image').evaluate((image:HTMLImageElement) => {
    image.src = 'assets/office_horizontal.JPG';
  });
  await page.locator('.hero-image').evaluate((image:HTMLImageElement) => image.decode());
  await page.locator('[data-hero-field="title"]').evaluate((title) => {
    title.innerHTML = Array(8).fill('Eine zusätzliche Textzeile.').join('<br>');
  });

  const changedContentLayout = await page.evaluate(() => {
    const hero = document.querySelector('.hero')!.getBoundingClientRect();
    const image = document.querySelector('.hero-image') as HTMLImageElement;
    const imageBox = image.getBoundingClientRect();
    const ribbon = document.querySelector('.hero-ribbon')!.getBoundingClientRect();
    const copy = document.querySelector('.hero-copy')!.getBoundingClientRect();
    return {
      heroBottom:hero.bottom,
      imageBottom:imageBox.bottom,
      imageRatio:imageBox.width / imageBox.height,
      naturalRatio:image.naturalWidth / image.naturalHeight,
      ribbonTop:ribbon.top,
      ribbonBottom:ribbon.bottom,
      copyBottom:copy.bottom
    };
  });

  expect(changedContentLayout.imageRatio).toBeCloseTo(changedContentLayout.naturalRatio,2);
  expect(changedContentLayout.copyBottom).toBeLessThanOrEqual(changedContentLayout.ribbonTop + 1);
  expect(changedContentLayout.imageBottom).toBeCloseTo(changedContentLayout.ribbonBottom,0);
  expect(changedContentLayout.imageBottom).toBeCloseTo(changedContentLayout.heroBottom,0);
});

test('editor exports normalized schema content', async ({ page }) => {
  await page.goto(editorUrl);

  await expect(page.getByRole('heading',{ name:'Inhalte bearbeiten' })).toBeVisible();
  const storedInternalName = await page.evaluate(() => window.practiceContent.sections[0].internalName);
  await expect(page.locator('.section-editor').first().locator('.section-title')).toHaveText(storedInternalName);
  await expect(page.locator('.section-editor').first().locator('.section-title')).not.toHaveText('Manchmal hilft es, nicht allein weitergehen zu müssen');
  await page.locator('[data-path="sections.0.internalName"]').fill('Hauptbereich Psychotherapie');
  await expect(page.locator('.section-editor').first().locator('.section-title')).toHaveText('Hauptbereich Psychotherapie');
  await expect(page.locator('#new-layout option')).toHaveText([
    /Zweispaltiger Text mit Liste/,
    /Zweispaltiger Text mit Hervorhebung/,
    /Kartenraster/,
    /Titelraster/,
    /Zweispaltiger Text mit Bild/,
    /Text über breitem Bild/,
    /Auflistung/,
    /Zeitleiste/,
    /Zweispaltige Preisliste/,
    /Kontaktblock mit Karte/
  ]);
  await page.locator('[data-path="practiceName"]').fill('Praxis Sonnenweg');
  await expect(page.locator('[data-path="siteIcon"]')).toHaveValue('assets/icon4_tiny.png');
  await page.locator('[data-path="siteIcon"]').fill('assets/wave-mark-128.png');
  await page.getByRole('button',{ name:'Vorschau Desktop' }).click();
  const preview = page.frameLocator('#preview-frame');
  await expect(preview.locator('.brand-mark')).toHaveAttribute('src','assets/wave-mark-128.png');
  await expect(preview.locator('link[rel="icon"]')).toHaveAttribute('href','assets/wave-mark-128.png');
  await page.getByRole('button',{ name:'Vorschau schließen' }).click();
  await page.getByRole('radio',{ name:'Scharlachrot' }).check();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button',{ name:'content.js herunterladen' }).first().click();
  const download = await downloadPromise;
  const output = await download.createReadStream().then(async (stream) => {
    let content = '';
    for await (const chunk of stream) content += chunk;
    return content;
  });

  expect(download.suggestedFilename()).toBe('content.js');
  expect(output).toContain('Praxis Sonnenweg');
  expect(output).toContain('"schemaVersion": 3');
  expect(output).toContain('"internalName": "Hauptbereich Psychotherapie"');
  expect(output).toContain('"siteIcon": "assets/wave-mark-128.png"');
  expect(output).toContain('"sections": [');
  expect(output).toContain('"colorTheme": "scarlet"');
  expect(output).not.toContain('"sectionLayout"');
});

test('adds a section, changes its layout, background, fields and navigation', async ({ page }) => {
  await page.goto(editorUrl);

  const initialSectionCount = await page.locator('.section-editor').count();
  await page.selectOption('#new-layout','note');
  await page.getByRole('button',{ name:'Bereich hinzufügen' }).click();
  await expect(page.locator('.section-editor')).toHaveCount(initialSectionCount + 1);

  const added = page.locator('.section-editor').last();
  await added.locator('[data-path$=".navigationLabel"]').fill('Über mich');
  await added.locator('[data-section-background]').selectOption('custom');
  await added.locator('[data-section-custom-code]').fill('#e5f0ea');
  await added.locator('[data-path$=".appearance.headingModeDesktop"]').selectOption('title');
  await added.locator('[data-path$=".content.title"]').fill('Mein neuer Bereich');
  await added.locator('[data-path$=".content.note"]').fill('Ein persönlicher Hinweis.');

  await page.getByRole('button',{ name:'Vorschau Desktop' }).click();
  const preview = page.frameLocator('#preview-frame');
  await expect(preview.getByRole('link',{ name:'Über mich' }).last()).toBeVisible();
  await expect(preview.locator('.content-section[data-layout="note"]').last().locator('section')).toHaveCSS('background-color','rgb(229, 240, 234)');
  await expect(preview.getByRole('heading',{ name:'Mein neuer Bereich' })).toBeVisible();
});

test('section heading source can be switched independently for desktop and mobile', async ({ page }) => {
  await page.goto(editorUrl);

  const section = page.locator('.section-editor[data-section-id="psychotherapie"]');
  const desktopMode = section.locator('[data-path$=".appearance.headingModeDesktop"]');
  const mobileMode = section.locator('[data-path$=".appearance.headingModeMobile"]');
  const eyebrowField = section.locator('[data-path$=".content.eyebrow"]');
  const titleField = section.locator('[data-path$=".content.title"]');
  const eyebrowText = await eyebrowField.inputValue();
  const titleText = 'Alternative Überschrift';
  await titleField.fill(titleText);

  await expect(desktopMode.locator('option')).toHaveText([
    'Nur Bereichsbezeichnung',
    'Nur Titel',
    'Beides'
  ]);
  await expect(mobileMode.locator('option')).toHaveText([
    'Nur Bereichsbezeichnung',
    'Nur Titel',
    'Beides'
  ]);

  await desktopMode.selectOption('title');
  await mobileMode.selectOption('eyebrow');
  await section.getByRole('button',{ name:/Desktopvorschau/ }).click();
  const preview = page.frameLocator('#preview-frame');
  await expect(preview.locator('body')).toHaveAttribute('data-preview-viewport','desktop');
  await expect(preview.locator('.dynamic-section')).toHaveAttribute('data-heading-desktop','title');
  await expect(preview.locator('.dynamic-section')).toHaveAttribute('data-heading-mobile','eyebrow');
  await expect(preview.locator('.section-heading-desktop')).toBeVisible();
  await expect(preview.locator('.section-heading-mobile')).toBeHidden();
  await expect(preview.locator('.section-heading-desktop h2')).toHaveText(titleText);
  await expect(preview.locator('.section-heading-desktop h2')).toHaveClass(/section-heading-accent/);
  await expect(preview.locator('.dynamic-section .eyebrow')).toHaveCount(0);

  await page.getByRole('button',{ name:'Vorschau schließen' }).click();
  await section.getByRole('button',{ name:/Mobilvorschau/ }).click();
  await expect(preview.locator('body')).toHaveAttribute('data-preview-viewport','mobile');
  await expect(preview.locator('.section-heading-desktop')).toBeHidden();
  await expect(preview.locator('.section-heading-mobile')).toBeVisible();
  await expect(preview.locator('.section-heading-mobile h2')).toHaveText(eyebrowText);
  await expect(preview.locator('.section-heading-mobile h2')).toHaveClass(/section-heading-accent/);

  await page.getByRole('button',{ name:'Vorschau schließen' }).click();
  await desktopMode.selectOption('both');
  await section.getByRole('button',{ name:/Desktopvorschau/ }).click();
  await expect(preview.locator('body')).toHaveAttribute('data-preview-viewport','desktop');
  await expect(preview.locator('.dynamic-section')).toHaveAttribute('data-heading-desktop','both');
  await expect(preview.locator('.section-heading-desktop .eyebrow')).toHaveText(eyebrowText);
  await expect(preview.locator('.section-heading-desktop h2')).toHaveText(titleText);
  await expect(preview.locator('.section-heading-desktop h2')).not.toHaveClass(/section-heading-accent/);

  await expect(eyebrowField).toHaveValue(eyebrowText);
  await expect(titleField).toHaveValue(titleText);
});

test('intro layout supports an optional lead below its heading', async ({ page }) => {
  await page.goto(editorUrl);

  const section = page.locator('.section-editor[data-section-id="psychotherapie"]');
  const intro = section.locator('[data-path$=".content.intro"]');
  await expect(intro).toBeVisible();
  await intro.fill('Ein kurzer **Auftakt** unter der Überschrift.');
  await section.getByRole('button',{ name:/Desktopvorschau/ }).click();

  const preview = page.frameLocator('#preview-frame');
  await expect(preview.locator('.intro-heading .intro-lead')).toContainText('Ein kurzer Auftakt unter der Überschrift.');
  await expect(preview.locator('.intro-heading .intro-lead strong')).toHaveText('Auftakt');
  const headingOrder = await preview.locator('.intro-heading').evaluate((element) => [...element.children].map((child) => child.className));
  expect(headingOrder.at(-1)).toContain('intro-lead');
});

test('text colors and section spacing are globally configurable', async ({ page }) => {
  await page.goto(editorUrl);

  await page.locator('[data-global-color-code="--body-text"]').fill('#33282b');
  await page.locator('[data-global-color-code="--intro-text"]').fill('#511020');
  const desktopSpacing = page.locator('[data-path="sectionSpacing.desktop"]');
  const mobileSpacing = page.locator('[data-path="sectionSpacing.mobile"]');
  await desktopSpacing.evaluate((input:HTMLInputElement) => {
    input.value = '80';
    input.dispatchEvent(new Event('input',{ bubbles:true }));
  });
  await mobileSpacing.evaluate((input:HTMLInputElement) => {
    input.value = '48';
    input.dispatchEvent(new Event('input',{ bubbles:true }));
  });
  await expect(page.locator('output[for="sectionSpacing.desktop"]')).toHaveText('80px');
  await expect(page.locator('output[for="sectionSpacing.mobile"]')).toHaveText('48px');

  await page.getByRole('button',{ name:'Vorschau Desktop' }).click();
  const preview = page.frameLocator('#preview-frame');
  await expect(preview.locator('#psychotherapie')).toHaveCSS('padding-top','80px');
  await expect(preview.locator('#psychotherapie .intro-grid > div:last-child > p').first()).toHaveCSS('color','rgb(51, 40, 43)');
  await expect(preview.locator('#schwerpunkte .section-intro-text')).toHaveCSS('color','rgb(81, 16, 32)');

  await page.getByRole('button',{ name:'Vorschau schließen' }).click();
  await page.getByRole('button',{ name:'Vorschau Mobil' }).click();
  await expect(preview.locator('#psychotherapie')).toHaveCSS('padding-top','48px');
});

test('repeatable bullets, cards and prices use reusable add and remove controls', async ({ page }) => {
  await page.goto(editorUrl);

  const intro = page.locator('.section-editor[data-section-id="psychotherapie"]');
  const initialItemCount = await intro.locator('.collection-item').count();
  await intro.locator('[data-collection-action="add"][data-collection-key="items"]').click();
  await expect(intro.locator('.collection-item')).toHaveCount(initialItemCount + 1);
  await intro.locator('.collection-item').last().locator('[data-path$=".text"]').fill('Dynamischer Aufzählungspunkt');

  await page.selectOption('#new-layout','cards');
  await page.getByRole('button',{ name:'Bereich hinzufügen' }).click();
  const cards = page.locator('.section-editor').last();
  for (let index = 0; index < 4; index += 1) await cards.locator('[data-collection-action="add"]').click();
  await expect(cards.locator('.collection-item')).toHaveCount(6);
  await expect(cards.locator('[data-collection-action="add"]')).toBeDisabled();

  await page.selectOption('#new-layout','pricing');
  await page.getByRole('button',{ name:'Bereich hinzufügen' }).click();
  const prices = page.locator('.section-editor').last();
  await prices.locator('[data-collection-action="add"]').click();
  await prices.locator('[data-path$=".items.1.name"]').fill('Online-Beratung');
  await prices.locator('[data-path$=".items.1.price"]').fill('EUR 90');

  await page.getByRole('button',{ name:'Vorschau Desktop' }).click();
  const preview = page.frameLocator('#preview-frame');
  await expect(preview.locator('.bullet-list')).toContainText('Dynamischer Aufzählungspunkt');
  await expect(preview.locator('.price-list')).toContainText('Online-Beratung');
  await expect(preview.locator('.price-list')).toContainText('EUR 90');
});

test('listing layout offers interchangeable visual treatments', async ({ page }) => {
  await page.goto(editorUrl);

  const listing = page.locator('.section-editor[data-section-id="schwerpunkte"]');
  const style = listing.locator('[data-path$=".appearance.listStyle"]');
  await expect(style.locator('option')).toHaveText([
    'Nummeriert, zweispaltig',
    'Akzentpunkte, zweispaltig',
    'Ruhige Zeilen, einspaltig',
    'Geordnete Verlaufspills',
    'Sanfte Verlaufsbänder',
    'Ruhige Kacheln',
    'Versetzte Akzent-Pills',
    'Lockeres Kartenmosaik'
  ]);
  await style.selectOption('clean-tiles');
  const plainListing = page.locator('.section-editor[data-section-id="schwerpunkte"]');
  await expect(plainListing.locator('[data-path$=".appearance.gradientStart"]')).toHaveCount(0);
  await expect(plainListing.locator('[data-path$=".appearance.gradientEnd"]')).toHaveCount(0);
  await plainListing.locator('[data-path$=".appearance.listStyle"]').selectOption('gradient-pills');
  const refreshedListing = page.locator('.section-editor[data-section-id="schwerpunkte"]');
  const startColor = refreshedListing.locator('[data-path$=".appearance.gradientStart"]');
  const endColor = refreshedListing.locator('[data-path$=".appearance.gradientEnd"]');
  await expect(startColor).toBeVisible();
  await expect(endColor).toBeVisible();
  await startColor.fill('#ff0000');
  await endColor.fill('#0000ff');
  await page.getByRole('button',{ name:'Vorschau Desktop' }).click();

  const previewList = page.frameLocator('#preview-frame').locator('.content-section[data-layout="topics"] .topics-list');
  await expect(previewList).toHaveAttribute('data-list-style','gradient-pills');
  await expect(previewList).toHaveCSS('display','grid');
  await expect(previewList.locator('li').first()).toHaveCSS('border-radius','999px');
  await expect(previewList.locator('li').first()).toHaveCSS('transform','none');
  await expect(previewList.locator('li').first()).toHaveCSS('background-color','rgb(255, 0, 0)');
  await expect(previewList.locator('li').nth(3)).toHaveCSS('background-color','rgb(128, 0, 128)');
  await expect(previewList.locator('li').last()).toHaveCSS('background-color','rgb(0, 0, 255)');
  const pillPositions = await previewList.locator('li').evaluateAll((items) => items.slice(0,2).map((item) => {
    const box = item.getBoundingClientRect();
    return { left:box.left,top:box.top };
  }));
  expect(pillPositions[1].left).toBeCloseTo(pillPositions[0].left,0);
  expect(pillPositions[1].top).toBeGreaterThan(pillPositions[0].top);
});

test('wide image layout stacks its copy and offers designed image treatments', async ({ page }) => {
  await page.goto(editorUrl);

  const wideImage = page.locator('.section-editor[data-section-id="praxis"]');
  const style = wideImage.locator('[data-path$=".appearance.imageStyle"]');
  await expect(style.locator('option')).toHaveText([
    'Breit und randlos',
    'Schwebend mit Schatten',
    'Quadrat mit Akzentfläche',
    'Ruhiger Galerierahmen'
  ]);

  await style.selectOption('offset-shadow');
  await wideImage.getByRole('button',{ name:/Desktopvorschau/ }).click();
  const preview = page.frameLocator('#preview-frame');
  const section = preview.locator('.layout-wide-image');
  const copy = section.locator('.wide-image-copy');
  const heading = copy.locator('.section-heading-desktop');
  const text = copy.locator(':scope > p');

  await expect(section).toHaveAttribute('data-image-style','offset-shadow');
  const stackedCopy = await Promise.all([heading.boundingBox(),text.boundingBox()]);
  expect(stackedCopy[0]).not.toBeNull();
  expect(stackedCopy[1]).not.toBeNull();
  expect(stackedCopy[1]!.y).toBeGreaterThanOrEqual(stackedCopy[0]!.y + stackedCopy[0]!.height - 1);
  const activeFrame = section.locator('[data-carousel-slide][data-active="true"]');
  const shadowTreatment = await activeFrame.evaluate((element) => {
    const image = element.querySelector('.section-image')!;
    const backdrop = getComputedStyle(element,'::before');
    return {
      backdropContent:backdrop.content,
      backdropBackground:backdrop.backgroundColor,
      imageShadow:getComputedStyle(image).boxShadow
    };
  });
  expect(shadowTreatment.backdropContent).toBe('none');
  expect(shadowTreatment.backdropBackground).toBe('rgba(0, 0, 0, 0)');
  expect(shadowTreatment.imageShadow).not.toBe('none');
  const uncroppedShadowImage = await activeFrame.locator('.section-image').evaluate((image:HTMLImageElement) => {
    const box = image.getBoundingClientRect();
    return {
      renderedRatio:box.width / box.height,
      naturalRatio:image.naturalWidth / image.naturalHeight,
      objectFit:getComputedStyle(image).objectFit
    };
  });
  expect(uncroppedShadowImage.objectFit).toBe('contain');
  expect(uncroppedShadowImage.renderedRatio).toBeCloseTo(uncroppedShadowImage.naturalRatio,2);

  await page.getByRole('button',{ name:'Vorschau schließen' }).click();
  await wideImage.locator('[data-path$=".appearance.imageStyle"]').selectOption('square-stage');
  await wideImage.getByRole('button',{ name:/Mobilvorschau/ }).click();
  const mobilePreview = page.frameLocator('#preview-frame');
  await expect(mobilePreview.locator('.layout-wide-image')).toHaveAttribute('data-image-style','square-stage');
  const square = mobilePreview.locator('.layout-wide-image [data-carousel-slide][data-active="true"]');
  await expect(square).toBeVisible();
  const squareBox = await square.boundingBox();
  expect(squareBox).not.toBeNull();
  expect(squareBox!.width).toBeCloseTo(squareBox!.height,0);
  const uncroppedSquareImage = await square.locator('.section-image').evaluate((image:HTMLImageElement) => {
    const box = image.getBoundingClientRect();
    return {
      renderedRatio:box.width / box.height,
      naturalRatio:image.naturalWidth / image.naturalHeight,
      objectFit:getComputedStyle(image).objectFit
    };
  });
  expect(uncroppedSquareImage.objectFit).toBe('contain');
  expect(uncroppedSquareImage.renderedRatio).toBeCloseTo(uncroppedSquareImage.naturalRatio,2);
  const mobileFit = await square.evaluate((element) => ({
    viewport:document.documentElement.clientWidth,
    scrollWidth:document.documentElement.scrollWidth,
    left:element.getBoundingClientRect().left,
    right:element.getBoundingClientRect().right
  }));
  expect(mobileFit.scrollWidth).toBeLessThanOrEqual(mobileFit.viewport);
  expect(mobileFit.left).toBeGreaterThanOrEqual(0);
  expect(mobileFit.right).toBeLessThanOrEqual(mobileFit.viewport);
});

test('wide image layout supports an editor-managed carousel', async ({ page }) => {
  await page.goto(editorUrl);

  const wideImage = page.locator('.section-editor[data-section-id="praxis"]');
  const images = wideImage.locator('.collection:has([data-collection-key="images"])');
  const initialImageCount = await images.locator('.collection-item').count();
  expect(initialImageCount).toBeGreaterThanOrEqual(1);
  await images.locator('[data-collection-action="add"]').click();
  await expect(wideImage.locator('.collection:has([data-collection-key="images"]) .collection-item')).toHaveCount(initialImageCount + 1);

  const secondImage = wideImage.locator('.collection:has([data-collection-key="images"]) .collection-item').last();
  await secondImage.locator('[data-path$=".imageSrc"]').fill('assets/carina_profile.png');
  await secondImage.locator('[data-path$=".imageAlt"]').fill('Zweites Bild im Karussell');
  await wideImage.getByRole('button',{ name:/Desktopvorschau/ }).click();

  const preview = page.frameLocator('#preview-frame');
  const carousel = preview.locator('[data-carousel]');
  const slides = carousel.locator('[data-carousel-slide]');
  await expect(carousel).toHaveAttribute('data-autoplay-delay','5000');
  await expect(slides).toHaveCount(initialImageCount + 1);
  const loadingAttributes = await slides.locator('.section-image').evaluateAll((images:HTMLImageElement[]) => images.map((image) => ({
    loading:image.getAttribute('loading'),
    decoding:image.getAttribute('decoding'),
    priority:image.getAttribute('fetchpriority')
  })));
  expect(loadingAttributes).toHaveLength(initialImageCount + 1);
  loadingAttributes.forEach((attributes) => expect(attributes).toEqual({ loading:'lazy',decoding:'async',priority:'low' }));
  await expect(slides.nth(0)).toHaveAttribute('data-active','true');
  await expect(carousel.locator('[data-carousel-next]')).toBeVisible();
  await expect(carousel.locator('[data-carousel-toggle]')).toHaveCount(0);

  await carousel.locator('[data-carousel-next]').click();
  await expect(slides.nth(1)).toHaveAttribute('data-active','true');
  await expect(carousel).toHaveAttribute('data-autoplay-stopped','true');

  const stage = carousel.locator('.carousel-stage');
  await stage.dispatchEvent('pointerdown',{ pointerId:16,pointerType:'touch',isPrimary:true,clientX:240,clientY:80 });
  await stage.dispatchEvent('pointerup',{ pointerId:16,pointerType:'touch',isPrimary:true,clientX:230,clientY:180 });
  await expect(slides.nth(1)).toHaveAttribute('data-active','true');

  await stage.dispatchEvent('pointerdown',{ pointerId:17,pointerType:'touch',isPrimary:true,clientX:280,clientY:120 });
  await stage.dispatchEvent('pointerup',{ pointerId:17,pointerType:'touch',isPrimary:true,clientX:160,clientY:124 });
  await expect(slides.nth(2 % (initialImageCount + 1))).toHaveAttribute('data-active','true');
  await expect(carousel).toHaveAttribute('data-autoplay-stopped','true');

  await carousel.locator('[data-carousel-dot="0"]').click();
  await expect(slides.nth(0)).toHaveAttribute('data-active','true');
  await expect(carousel).toHaveAttribute('data-autoplay-stopped','true');
  const activeSpacing = await carousel.evaluate((element) => {
    const active = element.querySelector('[data-carousel-slide][data-active="true"]')!.getBoundingClientRect();
    const controls = element.querySelector('.carousel-controls')!.getBoundingClientRect();
    return controls.top - active.bottom;
  });
  expect(activeSpacing).toBeLessThanOrEqual(50);

  const imageRatios = [];
  for (let index = 0; index < initialImageCount + 1; index += 1) {
    await carousel.locator(`[data-carousel-dot="${index}"]`).click();
    const image = slides.nth(index).locator('.section-image');
    await expect.poll(() => image.evaluate((element:HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
    const ratio = await image.evaluate((image:HTMLImageElement) => {
      const box = image.getBoundingClientRect();
      return {
        rendered:box.width / box.height,
        natural:image.naturalWidth / image.naturalHeight
      };
    });
    imageRatios.push(ratio);
  }
  imageRatios.forEach((ratio) => expect(ratio.rendered).toBeCloseTo(ratio.natural,2));

  await page.getByRole('button',{ name:'Vorschau schließen' }).click();
  await wideImage.getByRole('button',{ name:/Mobilvorschau/ }).click();
  const mobileCarousel = page.frameLocator('#preview-frame').locator('[data-carousel]');
  await expect(mobileCarousel.locator('[data-carousel-previous]')).toBeVisible();
  await expect(mobileCarousel.locator('[data-carousel-next]')).toBeVisible();
  const mobileFit = await mobileCarousel.evaluate((element) => ({
    viewport:document.documentElement.clientWidth,
    scrollWidth:document.documentElement.scrollWidth,
    left:element.getBoundingClientRect().left,
    right:element.getBoundingClientRect().right
  }));
  expect(mobileFit.scrollWidth).toBeLessThanOrEqual(mobileFit.viewport);
  expect(mobileFit.left).toBeGreaterThanOrEqual(0);
  expect(mobileFit.right).toBeLessThanOrEqual(mobileFit.viewport);
});

test('contact layout supports a safe embedded map with an external fallback', async ({ page }) => {
  await page.route('https://www.google.com/maps/embed**',(route) => route.fulfill({
    status:200,
    contentType:'text/html',
    body:'<!doctype html><title>Map test</title>'
  }));
  await page.goto(editorUrl);

  const contact = page.locator('.section-editor[data-section-id="kontakt"]');
  const embed = contact.locator('[data-path$=".content.mapEmbed"]');
  await expect(embed).toBeVisible();
  await expect(contact.locator('[data-path$=".content.mapLink"]')).toBeVisible();
  await embed.fill('https://www.google.com/maps/embed?pb=test');
  await contact.getByRole('button',{ name:/Desktopvorschau/ }).click();

  const preview = page.frameLocator('#preview-frame');
  const iframe = preview.locator('.map-embed iframe');
  await expect(iframe).toHaveAttribute('src','https://www.google.com/maps/embed?pb=test');

  await page.getByRole('button',{ name:'Vorschau schließen' }).click();
  await contact.locator('[data-path$=".content.mapEmbed"]').fill('javascript:alert(1)');
  await contact.getByRole('button',{ name:/Desktopvorschau/ }).click();
  await expect(preview.locator('.map-embed iframe')).toHaveCount(0);
});

test('timeline layout offers interchangeable visual treatments', async ({ page }) => {
  await page.goto(editorUrl);
  await page.selectOption('#new-layout','timeline');
  await page.getByRole('button',{ name:'Bereich hinzufügen' }).click();

  const timeline = page.locator('.section-editor').last();
  const style = timeline.locator('[data-path$=".appearance.timelineStyle"]');
  await expect(style.locator('option')).toHaveText([
    'Klassische Linien',
    'Meilenstein-Karten',
    'Große Jahreszahlen',
    'Wechselnder Pfad',
    'Sanfte Etappen'
  ]);

  await style.selectOption('alternating-path');
  await timeline.getByRole('button',{ name:/Desktopvorschau/ }).click();

  const previewTimeline = page.frameLocator('#preview-frame').locator('.timeline-list');
  await expect(previewTimeline).toHaveAttribute('data-timeline-style','alternating-path');
  await expect(previewTimeline.locator('li').first()).toHaveCSS('grid-template-columns',/\d+(?:\.\d+)?px 44px \d+(?:\.\d+)?px/);
  await expect(previewTimeline.locator('.timeline-entry').first()).toHaveCSS('border-radius','14px');

  await page.getByRole('button',{ name:'Vorschau schließen' }).click();
  await timeline.getByRole('button',{ name:/Mobilvorschau/ }).click();
  const mobileTimelineFrame = page.locator('#preview-frame').contentFrame();
  await expect(mobileTimelineFrame.locator('.timeline-list')).toBeVisible();
  for (const timelineStyle of ['classic-lines','milestone-cards','year-focus','alternating-path','soft-steps']) {
    const fit = await mobileTimelineFrame.locator('.timeline-list').evaluate((element,styleName) => {
      element.setAttribute('data-timeline-style',styleName);
      return {
        viewport:document.documentElement.clientWidth,
        scrollWidth:document.documentElement.scrollWidth,
        right:element.getBoundingClientRect().right
      };
    },timelineStyle);
    expect(fit.scrollWidth).toBeLessThanOrEqual(fit.viewport);
    expect(fit.right).toBeLessThanOrEqual(fit.viewport + 1);
  }

  const mobileStyleSignature = async (timelineStyle:string) => mobileTimelineFrame.locator('.timeline-list').evaluate((element,styleName) => {
    element.setAttribute('data-timeline-style',styleName);
    const item = element.querySelector('li')!;
    const period = item.querySelector('.timeline-period')!;
    const listStyle = getComputedStyle(element);
    const itemStyle = getComputedStyle(item);
    const periodStyle = getComputedStyle(period);
    const markerStyle = getComputedStyle(item,'::before');
    return {
      listGap:listStyle.gap,
      listPaddingLeft:listStyle.paddingLeft,
      itemPadding:itemStyle.padding,
      itemRadius:itemStyle.borderRadius,
      itemShadow:itemStyle.boxShadow,
      periodPadding:periodStyle.padding,
      periodRadius:periodStyle.borderRadius,
      markerLeft:markerStyle.left,
      markerGridColumn:markerStyle.gridColumnStart
    };
  },timelineStyle);
  expect(await mobileStyleSignature('alternating-path')).toEqual(await mobileStyleSignature('milestone-cards'));

  await mobileTimelineFrame.locator('.timeline-list').evaluate((element) => element.setAttribute('data-timeline-style','alternating-path'));
  await expect(mobileTimelineFrame.locator('.timeline-list li').first()).toHaveCSS('border-radius','18px');
  await expect(mobileTimelineFrame.locator('.timeline-entry').first()).toHaveCSS('border-top-width','0px');
  await expect(mobileTimelineFrame.locator('.timeline-entry').first()).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
});

test('alternating timeline toggles between two editable views', async ({ page }) => {
  await page.goto(editorUrl);
  await page.selectOption('#new-layout','timeline');
  await page.getByRole('button',{ name:'Bereich hinzufügen' }).click();

  const timeline = page.locator('.section-editor').last();
  await timeline.locator('[data-path$=".appearance.timelineStyle"]').selectOption('alternating-path');
  const primaryLabel = timeline.locator('[data-path$=".content.primaryViewLabel"]');
  const secondaryLabel = timeline.locator('[data-path$=".content.secondaryViewLabel"]');
  await expect(primaryLabel).toBeVisible();
  await expect(secondaryLabel).toBeVisible();
  await primaryLabel.fill('Berufserfahrung');
  await secondaryLabel.fill('Ausbildung');
  await timeline.locator('[data-path$=".content.secondaryTitle"]').fill('Meine Ausbildung');
  await timeline.locator('[data-path$=".content.secondaryIntro"]').fill('Ausbildungen und Abschlüsse.');

  const secondaryItems = timeline.locator('.collection:has([data-collection-key="secondaryItems"])');
  await secondaryItems.locator('[data-collection-action="add"]').click();
  await secondaryItems.locator('[data-path$=".period"]').fill('2026');
  await secondaryItems.locator('[data-path$=".title"]').fill('Beispielausbildung');
  await timeline.getByRole('button',{ name:/Desktopvorschau/ }).click();

  const preview = page.frameLocator('#preview-frame');
  const toggle = preview.getByRole('tablist',{ name:'Werdegang auswählen' });
  const careerTab = toggle.getByRole('tab',{ name:'Berufserfahrung' });
  const educationTab = toggle.getByRole('tab',{ name:'Ausbildung' });
  await expect(careerTab).toHaveAttribute('aria-selected','true');
  await expect(educationTab).toHaveAttribute('aria-selected','false');
  await expect(preview.locator('[data-timeline-view="primary"]')).toBeVisible();
  await expect(preview.locator('[data-timeline-view="secondary"]')).toBeHidden();

  await educationTab.click();
  await expect(educationTab).toHaveAttribute('aria-selected','true');
  await expect(preview.locator('[data-timeline-view="secondary"]')).toBeVisible();
  await expect(preview.locator('[data-timeline-view="secondary"]')).toContainText('Beispielausbildung');
  await educationTab.press('ArrowLeft');
  await expect(careerTab).toBeFocused();
  await expect(careerTab).toHaveAttribute('aria-selected','true');

  await page.getByRole('button',{ name:'Vorschau schließen' }).click();
  await timeline.getByRole('button',{ name:/Mobilvorschau/ }).click();
  const mobilePreview = page.frameLocator('#preview-frame');
  const mobileToggle = mobilePreview.getByRole('tablist',{ name:'Werdegang auswählen' });
  await expect(mobileToggle).toBeVisible();
  const mobileFit = await mobileToggle.evaluate((element) => ({
    viewport:document.documentElement.clientWidth,
    scrollWidth:document.documentElement.scrollWidth,
    left:element.getBoundingClientRect().left,
    right:element.getBoundingClientRect().right
  }));
  expect(mobileFit.scrollWidth).toBeLessThanOrEqual(mobileFit.viewport);
  expect(mobileFit.left).toBeGreaterThanOrEqual(0);
  expect(mobileFit.right).toBeLessThanOrEqual(mobileFit.viewport);
  await mobileToggle.getByRole('tab',{ name:'Ausbildung' }).click();
  await expect(mobilePreview.locator('[data-timeline-view="secondary"]')).toContainText('Beispielausbildung');
});

test('each section can be previewed directly on mobile and desktop', async ({ page }) => {
  await page.goto(editorUrl);

  const section = page.locator('.section-editor[data-section-id="schwerpunkte"]');
  await section.getByRole('button',{ name:'Mobilvorschau für Schwerpunkte' }).click();
  const dialog = page.locator('#preview-modal');
  await expect(dialog).toHaveAttribute('data-viewport','mobile');
  await expect(dialog.getByRole('heading')).toContainText('Schwerpunkte · Mobil');

  const focusedPreview = page.frameLocator('#preview-frame');
  await expect(focusedPreview.locator('body')).toHaveClass(/section-preview/);
  await expect(focusedPreview.locator('.content-section')).toHaveCount(1);
  await expect(focusedPreview.locator('.content-section')).toHaveAttribute('data-section-id','schwerpunkte');
  await expect(focusedPreview.locator('.hero')).toBeHidden();
  await expect(focusedPreview.locator('.ribbons')).toBeHidden();

  await page.getByRole('button',{ name:'Vorschau schließen' }).click();
  await section.getByRole('button',{ name:'Desktopvorschau für Schwerpunkte' }).click();
  await expect(dialog).toHaveAttribute('data-viewport','desktop');
  await expect(dialog.getByRole('heading')).toContainText('Schwerpunkte · Desktop');
  await expect(focusedPreview.locator('.content-section')).toHaveCount(1);
});

test('sections can be reordered, removed and changed to another registered layout', async ({ page }) => {
  await page.goto(editorUrl);

  await page.selectOption('#new-layout','intro');
  await page.getByRole('button',{ name:'Bereich hinzufügen' }).click();
  const added = page.locator('.section-editor').last();
  await added.locator('[data-section-layout]').selectOption('image');
  await expect(page.locator('.section-editor').last().locator('[data-path$=".content.imageSrc"]')).toBeVisible();

  const addedId = await page.locator('.section-editor').last().getAttribute('data-section-id');
  const moved = page.locator(`.section-editor[data-section-id="${addedId}"]`);
  const sectionCount = await page.locator('.section-editor').count();
  for (let index = 0; index < sectionCount - 1; index += 1) {
    await moved.getByRole('button',{ name:'Nach oben' }).click();
  }
  await expect(page.locator('.section-editor').first().locator('[data-section-layout]')).toHaveValue('image');

  page.once('dialog',(dialog) => dialog.accept());
  await page.locator('.section-editor').nth(1).getByRole('button',{ name:'Bereich entfernen' }).click();
  await expect(page.locator('.section-editor')).toHaveCount(sectionCount - 1);

  await page.getByRole('button',{ name:'Vorschau Desktop' }).click();
  await expect(page.frameLocator('#preview-frame').locator('.content-section').first()).toHaveAttribute('data-layout','image');
});

test('rich-text controls and hero presentation remain editable', async ({ page }) => {
  await page.goto(editorUrl);

  const title = page.locator('[data-path="hero.title"]');
  await title.fill('Ein neuer Titel');
  await title.selectText();
  await title.locator('xpath=..').getByRole('button',{ name:'Fett' }).click();
  await expect(title).toHaveValue('**Ein neuer Titel**');

  await page.selectOption('[data-path="heroImage.layout"]','background');
  await page.selectOption('[data-path="heroImage.blend"]','natural');
  await expect(page.locator('[data-path="heroImage.mobileLayout"] option')).toHaveCount(2);
  await page.selectOption('[data-path="heroImage.mobileLayout"]','portrait');
  await expect(page.locator('[data-path="heroImage.position"]')).toHaveCount(0);
  await expect(page.locator('[data-path="heroImage.mobilePosition"]')).toHaveCount(0);
  await page.locator('[data-path="heroImage.blendWidthDesktop"]').evaluate((input:HTMLInputElement) => {
    input.value = '55';
    input.dispatchEvent(new Event('input',{ bubbles:true }));
  });
  await page.locator('[data-path="heroImage.blendWidthMobile"]').evaluate((input:HTMLInputElement) => {
    input.value = '45';
    input.dispatchEvent(new Event('input',{ bubbles:true }));
  });
  await expect(page.locator('output[for="heroImage.blendWidthDesktop"]')).toHaveText('55%');
  await expect(page.locator('output[for="heroImage.blendWidthMobile"]')).toHaveText('45%');
  await expect(page.locator('[data-path="hero.titleSize"] option')).toHaveCount(5);
  await page.selectOption('[data-path="hero.titleSize"]','tiny');
  await page.locator('[data-path="hero.titleWidthDesktop"]').evaluate((input:HTMLInputElement) => {
    input.value = '46';
    input.dispatchEvent(new Event('input',{ bubbles:true }));
  });
  await expect(page.locator('output[for="hero.titleWidthDesktop"]')).toHaveText('46%');
  await page.locator('.section-editor[data-section-id="psychotherapie"] [data-path$=".appearance.titleSize"]').selectOption('small');
  await page.locator('[data-path="hero.contactButton"]').fill('Erstgespräch anfragen');
  await page.getByRole('button',{ name:'Vorschau Desktop' }).click();

  const preview = page.frameLocator('#preview-frame');
  await expect(preview.locator('.hero')).toHaveAttribute('data-image-layout','background');
  await expect(preview.locator('.hero')).toHaveAttribute('data-image-blend','natural');
  await expect(preview.locator('.hero')).toHaveAttribute('data-mobile-image-layout','portrait');
  await expect(preview.locator('.hero')).toHaveAttribute('data-title-size','tiny');
  await expect(preview.locator('.hero')).toHaveCSS('--hero-title-width-desktop','46%');
  await expect(preview.locator('.hero')).toHaveCSS('--hero-blend-desktop','55%');
  await expect(preview.locator('.hero')).toHaveCSS('--hero-blend-mobile','45%');
  await expect(preview.locator('#psychotherapie')).toHaveAttribute('data-title-size','small');
  await expect(preview.getByRole('link',{ name:'Erstgespräch anfragen' })).toHaveAttribute('href','#kontakt');
  await expect(preview.locator('h1 strong')).toHaveText('Ein neuer Titel');

  const backgroundBounds = await preview.locator('.hero-image-wrap').evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { left:box.left,right:box.right,viewportWidth:document.documentElement.clientWidth };
  });
  expect(backgroundBounds.left).toBeLessThanOrEqual(0);
  expect(backgroundBounds.right).toBeGreaterThanOrEqual(backgroundBounds.viewportWidth);
});

test('legacy fixed content is isolated behind the schema migration adapter', async ({ page }) => {
  await page.goto(siteUrl);
  const migrated = await page.evaluate(() => window.practiceContentModel.normalize({
    practiceName:'Legacy Praxis',
    navigation:{ home:'Start',costs:'Preise' },
    sectionLayout:{ order:['costs'],enabled:{ intro:false,therapy:false,focusAreas:false,practice:false,costs:true,contact:false } },
    costs:{ label:'Honorar',title:'Kosten',intro:'Info',entries:[['Termin','50 Minuten','100 EUR']],reimbursement:'Hinweis' }
  }));

  expect(migrated.schemaVersion).toBe(3);
  expect(migrated.sections).toHaveLength(1);
  expect(migrated.sections[0].layout).toBe('pricing');
  expect(migrated.sections[0].navigationLabel).toBe('Preise');
  expect(migrated.sections[0].content.items[0]).toEqual({ name:'Termin',duration:'50 Minuten',price:'100 EUR' });

  const ranged = await page.evaluate(() => window.practiceContentModel.normalize({
    sections:[
      { id:'cards',layout:'cards',content:{ items:Array.from({ length:9 },(_,index) => ({ title:String(index),text:'' })) } },
      { id:'prices',layout:'pricing',content:{ items:[] } }
    ]
  }));
  expect(ranged.sections[0].content.items).toHaveLength(6);
  expect(ranged.sections[1].content.items).toHaveLength(1);

  const flexible = await page.evaluate(() => window.practiceContentModel.normalize({
    sections:[
      { id:'topics',layout:'topics',content:{ items:Array.from({ length:14 },(_,index) => ({ text:String(index) })) } },
      { id:'timeline',layout:'timeline',content:{ items:[] },appearance:{ headingMode:'title',titleSize:'large' } }
    ]
  }));
  expect(flexible.sections[0].content.items).toHaveLength(10);
  expect(flexible.sections[1].content.items).toHaveLength(2);
  expect(flexible.sections[1].appearance.headingModeDesktop).toBe('title');
  expect(flexible.sections[1].appearance.headingModeMobile).toBe('title');
  expect(flexible.sections[1].appearance.headingMode).toBeUndefined();
  expect(flexible.sections[1].appearance.titleSize).toBe('large');

  const spacing = await page.evaluate(() => window.practiceContentModel.normalize({ sectionSpacing:{ desktop:999,mobile:2 } }).sectionSpacing);
  expect(spacing).toEqual({ desktop:180,mobile:36 });
  const heroWidths = await page.evaluate(() => [
    window.practiceContentModel.normalize({ hero:{ titleWidthDesktop:99 } }).hero.titleWidthDesktop,
    window.practiceContentModel.normalize({ hero:{ titleWidthDesktop:2 } }).hero.titleWidthDesktop
  ]);
  expect(heroWidths).toEqual([55,30]);

  const relativeAssets = await page.evaluate(() => window.practiceContentModel.normalize({
    siteIcon:'/assets/icon.png',
    heroImage:{ src:'/assets/hero.jpg' },
    sections:[
      { id:'image',layout:'image',content:{ imageSrc:'/assets/side.jpg' } },
      { id:'wide',layout:'wideImage',content:{ images:[{ imageSrc:'/assets/wide.jpg' }] } }
    ]
  }));
  expect(relativeAssets.siteIcon).toBe('assets/icon.png');
  expect(relativeAssets.heroImage.src).toBe('assets/hero.jpg');
  expect(relativeAssets.sections[0].content.imageSrc).toBe('assets/side.jpg');
  expect(relativeAssets.sections[1].content.images[0].imageSrc).toBe('assets/wide.jpg');
});

test('mobile and desktop previews use distinct viewports and every layout fits mobile', async ({ page }) => {
  await page.goto(editorUrl);

  const registeredLayouts = await page.evaluate(() => Object.keys(window.practiceContentModel.layouts));
  const presentLayouts = await page.locator('[data-section-layout]').evaluateAll((elements) => elements.map((element) => (element as HTMLSelectElement).value));
  for (const layout of registeredLayouts.filter((layout) => !presentLayouts.includes(layout))) {
    await page.selectOption('#new-layout',layout);
    await page.getByRole('button',{ name:'Bereich hinzufügen' }).click();
  }
  await page.getByRole('button',{ name:'Vorschau Mobil' }).click();

  const dialog = page.locator('#preview-modal');
  await expect(dialog).toHaveAttribute('data-viewport','mobile');
  await expect(dialog.getByRole('heading',{ name:'Vorschau Mobil' })).toBeVisible();
  const mobileFrameBox = await page.locator('#preview-frame').boundingBox();
  expect(mobileFrameBox?.width).toBe(390);

  const mobilePreview = page.frameLocator('#preview-frame');
  const expectedSectionCount = presentLayouts.length + registeredLayouts.filter((layout) => !presentLayouts.includes(layout)).length;
  await expect(mobilePreview.locator('.content-section')).toHaveCount(expectedSectionCount);
  for (const layout of registeredLayouts) {
    expect(await mobilePreview.locator(`.content-section[data-layout="${layout}"]`).count()).toBeGreaterThanOrEqual(1);
  }
  const mobileComposition = await page.frames()[1].evaluate(() => {
    const heroImage = document.querySelector('.hero-image') as HTMLImageElement;
    const heroRibbon = document.querySelector('.hero-ribbon') as HTMLElement;
    const divider = document.querySelector('.ribbons') as HTMLElement;
    const dividerArtwork = divider.querySelector('svg:not(.ribbon-transition)') as SVGElement;
    const imageBox = heroImage.getBoundingClientRect();
    const heroRibbonBox = heroRibbon.getBoundingClientRect();
    const heroBox = document.querySelector('.hero')!.getBoundingClientRect();
    return {
      heroImageWidth:heroImage.naturalWidth,
      heroImageRatio:imageBox.width / imageBox.height,
      heroImageNaturalRatio:heroImage.naturalWidth / heroImage.naturalHeight,
      heroImageBottom:imageBox.bottom,
      heroRibbonBottom:heroRibbonBox.bottom,
      heroBottom:heroBox.bottom,
      heroRibbonHeight:heroRibbonBox.height,
      dividerHeight:divider.getBoundingClientRect().height,
      dividerArtworkWidth:dividerArtwork.getBoundingClientRect().width
    };
  });
  expect(mobileComposition.heroImageWidth).toBeGreaterThan(0);
  expect(mobileComposition.heroImageRatio).toBeCloseTo(mobileComposition.heroImageNaturalRatio,2);
  expect(mobileComposition.heroImageBottom).toBeCloseTo(mobileComposition.heroRibbonBottom,0);
  expect(mobileComposition.heroImageBottom).toBeCloseTo(mobileComposition.heroBottom,0);
  expect(mobileComposition.heroRibbonHeight).toBeLessThanOrEqual(118);
  expect(mobileComposition.dividerHeight).toBeLessThanOrEqual(108);
  expect(mobileComposition.dividerArtworkWidth).toBeGreaterThan(780);
  const mobileFit = await page.frames()[1].evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const sectionsFit = [...document.querySelectorAll('.dynamic-section')].every((section) => {
      const box = section.getBoundingClientRect();
      return box.left >= -1 && box.right <= viewportWidth + 1;
    });
    return {
      viewportWidth,
      scrollWidth:document.documentElement.scrollWidth,
      sectionsFit,
      cardColumns:getComputedStyle(document.querySelector('.focus-grid')!).gridTemplateColumns.split(' ').length
    };
  });
  expect(mobileFit.viewportWidth).toBe(390);
  expect(mobileFit.scrollWidth).toBeLessThanOrEqual(390);
  expect(mobileFit.sectionsFit).toBe(true);
  expect(mobileFit.cardColumns).toBe(1);

  await page.getByRole('button',{ name:'Vorschau schließen' }).click();
  await page.getByRole('button',{ name:'Vorschau Desktop' }).click();
  await expect(dialog).toHaveAttribute('data-viewport','desktop');
  const desktopFrameBox = await page.locator('#preview-frame').boundingBox();
  expect(desktopFrameBox?.width).toBeGreaterThan(900);
});
