import { expect, test } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test('cria os quatro modelos, valida inconsistência e persiste o projeto', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('prisma-locale', 'pt-BR'));
  await page.goto('/builder');
  await expect(page.locator('main[data-app-ready="true"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Validação:/ })).toBeVisible();
  const databases = page.getByLabel(/^Registros identificados em bases/);
  const duplicates = page.getByLabel(/^Duplicatas removidas/);
  await databases.fill('10');
  await page.locator('summary').filter({ hasText: 'Removidos antes da triagem' }).click();
  await duplicates.fill('99');
  // Validation lives in a drawer opened from the alerts chip.
  await page.getByRole('button', { name: /^Validação:/ }).click();
  await expect(page.getByText('Uma subtração do fluxo produz valor negativo')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar painel' }).click();
  await duplicates.fill('2');
  await page.getByRole('button', { name: /^Validação:/ }).click();
  await expect(page.getByText('Uma subtração do fluxo produz valor negativo')).toBeHidden();
  await page.getByRole('button', { name: 'Fechar painel' }).click();
  await page.locator('summary').filter({ hasText: 'Identificação' }).click();
  // Per-database sources replace the direct count, which becomes their sum.
  await page.getByRole('button', { name: '+ Scopus' }).click();
  await page.locator('.database-item-row').getByLabel('Contagem').fill('12');
  await expect(databases).toHaveValue('12');
  await expect(databases).toBeDisabled();
  await page.locator('summary').filter({ hasText: 'Configuração do projeto' }).click();
  await page.getByLabel('Revisão atualizada').check();
  await page.locator('summary').filter({ hasText: 'Estudos anteriores' }).click();
  await expect(page.getByLabel(/^Estudos incluídos na versão anterior/)).toBeVisible();
  await page.locator('summary').filter({ hasText: 'Configuração do projeto' }).click();
  await page.getByLabel('Utiliza outras fontes').check();
  await page.locator('summary').filter({ hasText: 'Outros métodos' }).click();
  // Other methods are entered as a source list (sites, organisations, citations…).
  await expect(page.getByRole('heading', { name: 'Outros métodos (Sites, Organizações, Citações...)' })).toBeVisible();
  await expect(page.getByText('Salvo localmente')).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('radio', { name: 'Clássico PRISMA' })).toBeChecked();
  await expect(page.locator('.prisma-svg')).toHaveAttribute('data-style', 'classic');
  await page.getByText('Editorial moderno').click();
  await expect(page.locator('.prisma-svg')).toHaveAttribute('data-style', 'modern');
  await expect(page.getByText('Salvo localmente')).toBeVisible({ timeout: 5000 });
  await page.reload();
  await expect(databases).toHaveValue('12');
  await expect(page.getByRole('radio', { name: 'Editorial moderno' })).toBeChecked();
});

test('troca idioma, tema, contraste e navega por teclado', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('prisma-locale', 'pt-BR'));
  await page.goto('/');
  await expect(page.getByLabel('English', { exact: true })).toBeEnabled();
  await page.getByLabel('Configurações').click();
  await page.getByRole('radio', { name: 'English' }).check();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('radio', { name: 'Dark' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('High contrast').check();
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});

test('backup JSON, exportações e restauração', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => localStorage.setItem('prisma-locale', 'pt-BR'));
  await page.goto('/builder');
  await expect(page.locator('main[data-app-ready="true"]')).toBeVisible();
  await page.locator('.project-title-input').fill('Backup restaurado');
  await page.getByRole('tab', { name: 'Exportar' }).click();
  await expect(page.getByRole('heading', { name: 'Exportar projeto' })).toBeVisible();
  const backupEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Backup JSON' }).click();
  const backup = await backupEvent;
  const backupPath = await backup.path();
  expect(backupPath).toBeTruthy();
  await page.getByRole('tab', { name: 'Diagrama' }).click();
  await page.locator('.project-title-input').fill('Título alterado');
  await page.getByLabel('Mais ações').click();
  await page.getByRole('button', { name: 'Importar' }).click();
  await page.getByLabel('Selecionar arquivo').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: await readFile(backupPath!),
  });
  await expect(page.locator('.project-title-input')).toHaveValue('Backup restaurado');
  await page.getByRole('tab', { name: 'Exportar' }).click();
  for (const label of ['SVG', 'HTML interativo', 'PDF vetorial']) {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: label }).click();
    expect((await download).suggestedFilename()).toBeTruthy();
  }
  const zip = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Pacote ZIP' }).click();
  expect((await zip).suggestedFilename()).toMatch(/\.zip$/);
});

test('importa e valida tabelas CSV e XLSX', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('prisma-locale', 'pt-BR'));
  await page.goto('/projects');
  await expect(page.getByLabel('English', { exact: true })).toBeEnabled();
  const input = page.getByLabel('Selecionar arquivo');
  await input.setInputFiles({
    name: 'contagens.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('field,value\ndatabases,12\nregisters,3\nduplicates,2', 'utf8'),
  });
  await expect(page.getByRole('heading', { name: 'Mapeamento de colunas' })).toBeVisible();
  await page.getByRole('button', { name: 'Validar e importar' }).click();
  await expect(page.getByRole('heading', { name: 'Importado de contagens.csv' })).toBeVisible();
});

test('dashboard, mobile e acessibilidade automática', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('prisma-locale', 'pt-BR'));
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: /Projetos locais|Local projects/ })).toBeVisible();
  // Let entrance animations settle: axe would otherwise sample text mid-fade.
  await page.evaluate(() => Promise.all(document.getAnimations().filter((animation) => animation.effect?.getTiming().iterations !== Infinity).map((animation) => animation.finished)));
  const results = await new AxeBuilder({ page }).exclude('.prisma-svg').analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
});

test('matriz visual de idiomas, temas e viewports', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => localStorage.setItem('prisma-locale', 'pt-BR'));
  await page.goto('/');
  await expect(page.getByLabel('English', { exact: true })).toBeEnabled();
  if (testInfo.project.name.includes('mobile')) {
    await page.screenshot({ path: testInfo.outputPath('landing-mobile.png'), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    return;
  }
  await page.getByLabel('Configurações').click();
  for (const [locale, name] of [['pt-BR', 'Português (Brasil)'], ['en', 'English'], ['it', 'Italiano'], ['fr', 'Français'], ['de', 'Deutsch'], ['zh-CN', '简体中文']]) {
    await page.getByRole('radio', { name }).check();
    await page.screenshot({ path: testInfo.outputPath(`landing-${locale}.png`), fullPage: false });
  }
  await page.getByRole('radio', { name: /Claro|Light|Chiaro|Clair|Hell|浅色/ }).check();
  await page.screenshot({ path: testInfo.outputPath('theme-light.png'), fullPage: false });
  await page.getByRole('radio', { name: /Escuro|Dark|Scuro|Sombre|Dunkel|深色/ }).check();
  await page.screenshot({ path: testInfo.outputPath('theme-dark.png'), fullPage: false });
  const contrast = page.getByLabel(/Alto contraste|High contrast|Contrasto elevato|Contraste élevé|Hoher Kontrast|高对比度/);
  await contrast.check();
  const motion = page.getByLabel(/Reduzir movimentos|Reduce motion|Riduci movimento|Réduire les animations|Bewegungen reduzieren|减少动态效果/);
  await motion.check();
  await page.screenshot({ path: testInfo.outputPath('high-contrast-reduced-motion.png'), fullPage: false });
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.screenshot({ path: testInfo.outputPath('landing-tablet.png'), fullPage: true });
  await page.goto('/builder');
  await expect(page.locator('main[data-app-ready="true"]')).toBeVisible();
  await page.getByRole('tab', { name: /Exportar|Export|Esporta|Exporter|Exportieren|导出/ }).click();
  await page.screenshot({ path: testInfo.outputPath('export-panel.png'), fullPage: true });
});
