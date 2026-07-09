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
