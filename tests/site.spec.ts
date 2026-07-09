import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';

const siteUrl = `file:///${resolve('index.html').replace(/\\/g, '/')}`;

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
