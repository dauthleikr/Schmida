import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';

const siteUrl = `file:///${resolve('index.html').replace(/\\/g, '/')}`;
const editorUrl = `file:///${resolve('editor.html').replace(/\\/g, '/')}`;

test('renders the new section schema with dynamic navigation and waves', async ({ page }) => {
  await page.goto(siteUrl);

  await expect(page).toHaveTitle('Carina Schmida, BA.pth.');
  await expect(page.locator('.hero')).toHaveAttribute('data-title-size','small');
  await expect(page.getByRole('navigation')).toHaveText(/Startseite[\s\S]*Psychotherapie[\s\S]*Schwerpunkte[\s\S]*Über mich[\s\S]*Praxis[\s\S]*Kontakt/);
  await expect(page.locator('.content-section')).toHaveCount(7);
  await expect(page.locator('.content-section[data-layout="topics"] .topics-list li')).toHaveCount(7);
  await expect(page.locator('.content-section[data-layout="timeline"]')).toHaveCount(2);
  await expect(page.locator('.ribbon-transition')).toHaveCount(7);
  await expect(page.locator('.hero-image')).toHaveJSProperty('complete',true);
  await expect(page.locator('#kontakt')).toContainText('E-Mail-Adresse bitte ergänzen');
  await expect(page.locator('.wide-image-frame .section-image')).toHaveAttribute('src','assets/office_horizontal.JPG');
  expect(await page.locator('.wide-image-frame .section-image').evaluate((image:HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.wide-image-frame .section-image')).toHaveCSS('object-position','50% 0%');

  await page.getByRole('link',{ name:'Praxis',exact:true }).click();
  await expect(page.locator('#praxis')).toBeInViewport();

  const seamCoverage = await page.locator('.hero-ribbon').evaluate((element) => {
    const style = getComputedStyle(element,'::after');
    return { height:style.height,background:style.backgroundColor };
  });
  expect(seamCoverage.height).toBe('4px');
  expect(seamCoverage.background).not.toBe('rgba(0, 0, 0, 0)');
});

test('provides a usable compact navigation', async ({ page }) => {
  await page.setViewportSize({ width:390,height:844 });
  await page.goto(siteUrl);

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
  await page.locator('[data-path="practiceName"]').fill('Praxis Sonnenweg');
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
  expect(output).toContain('"sections": [');
  expect(output).toContain('"colorTheme": "scarlet"');
  expect(output).not.toContain('"sectionLayout"');
});

test('adds a section, changes its layout, background, fields and navigation', async ({ page }) => {
  await page.goto(editorUrl);

  await page.selectOption('#new-layout','note');
  await page.getByRole('button',{ name:'Bereich hinzufügen' }).click();
  await expect(page.locator('.section-editor')).toHaveCount(8);

  const added = page.locator('.section-editor').last();
  await added.locator('[data-path$=".navigationLabel"]').fill('Über mich');
  await added.locator('[data-section-background]').selectOption('custom');
  await added.locator('[data-section-custom-code]').fill('#e5f0ea');
  await added.locator('[data-path$=".content.title"]').fill('Mein neuer Bereich');
  await added.locator('[data-path$=".content.note"]').fill('Ein persönlicher Hinweis.');

  await page.getByRole('button',{ name:'Vorschau Desktop' }).click();
  const preview = page.frameLocator('#preview-frame');
  await expect(preview.getByRole('link',{ name:'Über mich' }).last()).toBeVisible();
  await expect(preview.locator('.content-section[data-layout="note"]').last().locator('section')).toHaveCSS('background-color','rgb(229, 240, 234)');
  await expect(preview.getByRole('heading',{ name:'Mein neuer Bereich' })).toBeVisible();
});

test('repeatable bullets, cards and prices use reusable add and remove controls', async ({ page }) => {
  await page.goto(editorUrl);

  const intro = page.locator('.section-editor[data-section-id="psychotherapie"]');
  await intro.locator('[data-collection-action="add"][data-collection-key="items"]').click();
  await expect(intro.locator('.collection-item')).toHaveCount(3);
  await intro.locator('[data-path$=".items.2.text"]').fill('Dynamischer Aufzählungspunkt');

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

test('sections can be reordered, removed and changed to another registered layout', async ({ page }) => {
  await page.goto(editorUrl);

  await page.selectOption('#new-layout','intro');
  await page.getByRole('button',{ name:'Bereich hinzufügen' }).click();
  const added = page.locator('.section-editor').last();
  await added.locator('[data-section-layout]').selectOption('image');
  await expect(page.locator('.section-editor').last().locator('[data-path$=".content.imageSrc"]')).toBeVisible();

  const addedId = await page.locator('.section-editor').last().getAttribute('data-section-id');
  const moved = page.locator(`.section-editor[data-section-id="${addedId}"]`);
  for (let index = 0; index < 7; index += 1) {
    await moved.getByRole('button',{ name:'Nach oben' }).click();
  }
  await expect(page.locator('.section-editor').first().locator('[data-section-layout]')).toHaveValue('image');

  page.once('dialog',(dialog) => dialog.accept());
  await page.locator('.section-editor').nth(1).getByRole('button',{ name:'Bereich entfernen' }).click();
  await expect(page.locator('.section-editor')).toHaveCount(7);

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
  await page.locator('.section-editor[data-section-id="psychotherapie"] [data-path$=".appearance.titleSize"]').selectOption('small');
  await page.locator('[data-path="hero.contactButton"]').fill('Erstgespräch anfragen');
  await page.getByRole('button',{ name:'Vorschau Desktop' }).click();

  const preview = page.frameLocator('#preview-frame');
  await expect(preview.locator('.hero')).toHaveAttribute('data-image-layout','background');
  await expect(preview.locator('.hero')).toHaveAttribute('data-image-blend','natural');
  await expect(preview.locator('.hero')).toHaveAttribute('data-mobile-image-layout','portrait');
  await expect(preview.locator('.hero')).toHaveAttribute('data-title-size','tiny');
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
      { id:'timeline',layout:'timeline',content:{ items:[] },appearance:{ titleSize:'large' } }
    ]
  }));
  expect(flexible.sections[0].content.items).toHaveLength(10);
  expect(flexible.sections[1].content.items).toHaveLength(2);
  expect(flexible.sections[1].appearance.titleSize).toBe('large');
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
