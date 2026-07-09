import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';

const siteUrl = `file:///${resolve('index.html').replace(/\\/g, '/')}`;
const editorUrl = `file:///${resolve('editor.html').replace(/\\/g, '/')}`;

test('renders editable practice content and section navigation', async ({ page }) => {
  await page.goto(siteUrl);

  await expect(page).toHaveTitle('Praxis fuer Psychotherapie');
  await expect(page.getByRole('navigation')).toHaveText(/Startseite[\s\S]*Psychotherapie[\s\S]*Kosten[\s\S]*Schwerpunkte[\s\S]*Kontakt/);
  await expect(page.locator('.hero-image')).toHaveJSProperty('complete', true);
  await expect(page.locator('#contact')).toContainText('praxis@beispiel.at');

  await page.getByRole('link', { name: 'Kosten' }).click();
  await expect(page.locator('#costs')).toBeInViewport();
});

test('provides a usable compact navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(siteUrl);

  const menu = page.getByRole('button', { name: 'Menue' });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('link', { name: 'Kontakt' })).toBeVisible();
  await page.getByRole('link', { name: 'Kontakt' }).click();
  await expect(page.locator('#contact')).toBeInViewport();
});

test('editor exports the updated content without source editing', async ({ page }) => {
  await page.goto(editorUrl);

  await expect(page.getByRole('heading', { name: 'Inhalte bearbeiten' })).toBeVisible();
  await page.locator('[data-bind="practiceName"]').fill('Praxis Sonnenweg');
  await page.getByRole('radio', { name: 'Scharlachrot' }).check();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'content.js herunterladen' }).first().click();
  const download = await downloadPromise;
  const content = await download.createReadStream().then(async (stream) => {
    let output = '';
    for await (const chunk of stream) output += chunk;
    return output;
  });

  expect(download.suggestedFilename()).toBe('content.js');
  expect(content).toContain('Praxis Sonnenweg');
  expect(content).toContain('"colorTheme": "scarlet"');
});

test('editor previews drafts and bounds focus areas', async ({ page }) => {
  await page.goto(editorUrl);

  await page.locator('[data-bind="practiceName"]').fill('Praxis Sonnenweg');
  const addFocus = page.getByRole('button', { name: 'Schwerpunkt hinzufuegen' });
  await addFocus.click();
  await addFocus.click();
  await expect(addFocus).toBeDisabled();
  await expect(page.locator('[data-focus-index]')).toHaveCount(6);

  await page.getByRole('button', { name: 'Vorschau' }).click();
  await expect(page.frameLocator('#preview-frame').locator('.brand')).toContainText('Praxis Sonnenweg');
});

test('enhanced editor formats text and bounds services', async ({ page }) => {
  await page.goto(editorUrl);

  await expect(page.locator('[name="enhanced-theme"]')).toHaveCount(6);
  const richText = page.locator('.rich-editor').first();
  await richText.click();
  await page.keyboard.press('Control+A');
  await page.getByRole('button', { name: 'Fett' }).first().click();
  await expect(page.locator('textarea').first()).toHaveValue(/^\*\*.+\*\*$/);

  const addService = page.getByRole('button', { name: 'Leistung hinzufuegen' });
  await addService.click();
  await addService.click();
  await expect(addService).toBeDisabled();
  await expect(page.locator('[data-price-index]')).toHaveCount(5);
  await expect(page.locator('[data-focus-index]').first()).toHaveCSS('grid-template-columns', /30px/);
});

test('editor controls section visibility and order', async ({ page }) => {
  await page.goto(editorUrl);

  const intro = page.locator('.section-row', { hasText: 'Psychotherapie Einstieg' });
  const details = page.locator('.section-row', { hasText: 'Psychotherapie Vertiefung (farbig)' });
  await intro.getByRole('checkbox').uncheck();
  await details.getByRole('checkbox').check();
  await details.getByRole('button', { name: 'Nach oben' }).click();

  await page.getByRole('button', { name: 'Vorschau' }).click();
  const preview = page.frameLocator('#preview-frame');
  await expect(preview.locator('section#psychotherapy.therapy')).toHaveCount(1);
  await expect(preview.locator('.content-section[data-section-key="intro"]')).toHaveCount(0);
});

test('editor configures hero image presentation', async ({ page }) => {
  await page.goto(editorUrl);

  await page.selectOption('[data-hero-image="layout"]', 'background');
  await page.selectOption('[data-hero-image="blend"]', 'natural');
  await page.selectOption('[data-hero-image="position"]', 'right center');
  await page.getByRole('button', { name: 'Vorschau' }).click();

  const preview = page.frameLocator('#preview-frame');
  await expect(preview.locator('.hero')).toHaveAttribute('data-image-layout', 'background');
  await expect(preview.locator('.hero')).toHaveAttribute('data-image-blend', 'natural');
  await expect(preview.locator('.hero')).toHaveCSS('--hero-image-position', 'right center');
});
