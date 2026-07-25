import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';

const siteUrl = `file:///${resolve('index.html').replace(/\\/g, '/')}`;
const editorUrl = `file:///${resolve('editor.html').replace(/\\/g, '/')}`;

test('renders the new section schema with dynamic navigation and waves', async ({ page }) => {
  await page.goto(siteUrl);

  await expect(page).toHaveTitle('Carina Schmida, BA.pth.');
  await expect(page.getByRole('navigation')).toHaveText(/Startseite[\s\S]*Psychotherapie[\s\S]*Schwerpunkte[\s\S]*Kosten[\s\S]*Kontakt/);
  await expect(page.locator('.content-section')).toHaveCount(5);
  await expect(page.locator('.content-section[data-layout="cards"] .focus-card')).toHaveCount(6);
  await expect(page.locator('.ribbon-transition')).toHaveCount(5);
  await expect(page.locator('.hero-image')).toHaveJSProperty('complete',true);
  await expect(page.locator('#contact')).toContainText('praxis@beispiel.at');

  await page.getByRole('link',{ name:'Kosten' }).click();
  await expect(page.locator('#costs')).toBeInViewport();
});

test('provides a usable compact navigation', async ({ page }) => {
  await page.setViewportSize({ width:390,height:844 });
  await page.goto(siteUrl);

  const menu = page.getByRole('button',{ name:'Menü' });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded','true');
  await expect(page.getByRole('link',{ name:'Kontakt',exact:true })).toBeVisible();
  await page.getByRole('link',{ name:'Kontakt',exact:true }).click();
  await expect(page.locator('#contact')).toBeInViewport();
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
  expect(output).toContain('"schemaVersion": 2');
  expect(output).toContain('"sections": [');
  expect(output).toContain('"colorTheme": "scarlet"');
  expect(output).not.toContain('"sectionLayout"');
});

test('adds a section, changes its layout, background, fields and navigation', async ({ page }) => {
  await page.goto(editorUrl);

  await page.selectOption('#new-layout','note');
  await page.getByRole('button',{ name:'Bereich hinzufügen' }).click();
  await expect(page.locator('.section-editor')).toHaveCount(6);

  const added = page.locator('.section-editor').last();
  await added.locator('[data-path$=".navigationLabel"]').fill('Über mich');
  await added.locator('[data-section-background]').selectOption('custom');
  await added.locator('[data-section-custom-code]').fill('#e5f0ea');
  await added.locator('[data-path$=".content.title"]').fill('Mein neuer Bereich');
  await added.locator('[data-path$=".content.note"]').fill('Ein persönlicher Hinweis.');

  await page.getByRole('button',{ name:'Vorschau Desktop' }).click();
  const preview = page.frameLocator('#preview-frame');
  await expect(preview.getByRole('link',{ name:'Über mich' })).toBeVisible();
  await expect(preview.locator('.content-section[data-layout="note"]').last().locator('section')).toHaveCSS('background-color','rgb(229, 240, 234)');
  await expect(preview.getByRole('heading',{ name:'Mein neuer Bereich' })).toBeVisible();
});

test('repeatable bullets, cards and prices use reusable add and remove controls', async ({ page }) => {
  await page.goto(editorUrl);

  const intro = page.locator('.section-editor').nth(0);
  await intro.locator('[data-collection-action="add"][data-collection-key="items"]').click();
  await expect(intro.locator('.collection-item')).toHaveCount(1);
  await intro.locator('[data-path$=".items.0.text"]').fill('Dynamischer Aufzählungspunkt');

  const cards = page.locator('.section-editor').nth(1);
  const removeCard = cards.locator('[data-collection-action="remove"]').first();
  await removeCard.click();
  await expect(cards.locator('.collection-item')).toHaveCount(5);
  await cards.locator('[data-collection-action="add"]').click();
  await expect(cards.locator('.collection-item')).toHaveCount(6);
  await expect(cards.locator('[data-collection-action="add"]')).toBeDisabled();

  const prices = page.locator('.section-editor').nth(3);
  await prices.locator('[data-collection-action="add"]').click();
  await prices.locator('[data-path$=".items.3.name"]').fill('Online-Beratung');
  await prices.locator('[data-path$=".items.3.price"]').fill('EUR 90');

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
  for (let index = 0; index < 5; index += 1) {
    await moved.getByRole('button',{ name:'Nach oben' }).click();
  }
  await expect(page.locator('.section-editor').first().locator('[data-section-layout]')).toHaveValue('image');

  page.once('dialog',(dialog) => dialog.accept());
  await page.locator('.section-editor').nth(1).getByRole('button',{ name:'Bereich entfernen' }).click();
  await expect(page.locator('.section-editor')).toHaveCount(5);

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
  await page.selectOption('[data-path="heroImage.position"]','right center');
  await page.locator('[data-path="hero.contactButton"]').fill('Erstgespräch anfragen');
  await page.getByRole('button',{ name:'Vorschau Desktop' }).click();

  const preview = page.frameLocator('#preview-frame');
  await expect(preview.locator('.hero')).toHaveAttribute('data-image-layout','background');
  await expect(preview.locator('.hero')).toHaveAttribute('data-image-blend','natural');
  await expect(preview.locator('.hero')).toHaveCSS('--hero-image-position','right center');
  await expect(preview.getByRole('link',{ name:'Erstgespräch anfragen' })).toHaveAttribute('href','#contact');
  await expect(preview.locator('h1 strong')).toHaveText('Ein neuer Titel');
});

test('legacy fixed content is isolated behind the schema migration adapter', async ({ page }) => {
  await page.goto(siteUrl);
  const migrated = await page.evaluate(() => window.practiceContentModel.normalize({
    practiceName:'Legacy Praxis',
    navigation:{ home:'Start',costs:'Preise' },
    sectionLayout:{ order:['costs'],enabled:{ intro:false,therapy:false,focusAreas:false,practice:false,costs:true,contact:false } },
    costs:{ label:'Honorar',title:'Kosten',intro:'Info',entries:[['Termin','50 Minuten','100 EUR']],reimbursement:'Hinweis' }
  }));

  expect(migrated.schemaVersion).toBe(2);
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
});

test('mobile and desktop previews use distinct viewports and every layout fits mobile', async ({ page }) => {
  await page.goto(editorUrl);

  await page.selectOption('#new-layout','note');
  await page.getByRole('button',{ name:'Bereich hinzufügen' }).click();
  await page.getByRole('button',{ name:'Vorschau Mobil' }).click();

  const dialog = page.locator('#preview-modal');
  await expect(dialog).toHaveAttribute('data-viewport','mobile');
  await expect(dialog.getByRole('heading',{ name:'Vorschau Mobil' })).toBeVisible();
  const mobileFrameBox = await page.locator('#preview-frame').boundingBox();
  expect(mobileFrameBox?.width).toBe(390);

  const mobilePreview = page.frameLocator('#preview-frame');
  for (const layout of ['intro','note','cards','image','pricing','contact']) {
    await expect(mobilePreview.locator(`.content-section[data-layout="${layout}"]`)).toHaveCount(1);
  }
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
