import { test, expect } from '@playwright/test';
import { login, logout } from './utils/auth';

// One long, serial scenario — each step depends on state produced by the
// previous one (the same incident moves through Reporter → Approver →
// Resolver), so splitting into independent `test()` blocks would just
// require re-deriving that state.
test('golden path: report -> approve -> investigate -> RCA -> CAPA -> resolve', async ({ page }) => {
  let incidentReference = '';
  let investigationUrl = '';

  await test.step('Reporter creates an incident', async () => {
    await login(page, 'reporter@factoryshield.dev', 'Reporter123!');
    await page.goto('/report');

    await page.locator('select[formcontrolname="category"]').selectOption('Injury');
    await page.getByRole('button', { name: 'Next' }).click(); // -> step 2 (Reporter)
    await page.getByRole('button', { name: 'Next' }).click(); // -> step 3 (Details)
    await page.getByPlaceholder('Briefly describe what happened…')
      .fill('E2E golden-path test incident.');

    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: 'Next' }).click(); // -> steps 4..8
    }

    await page.getByRole('button', { name: 'Submit Report' }).click();
    const confirmationText = page.locator('.alert-success strong');
    await expect(confirmationText).toBeVisible({ timeout: 15_000 });
    incidentReference = (await confirmationText.innerText()).trim();
    expect(incidentReference).toMatch(/^INC-/);
  });

  await test.step('Approver approves and assigns a resolver', async () => {
    await logout(page);
    await login(page, 'approver@factoryshield.dev', 'Approver123!');
    await page.goto('/approver/queue');

    await page.locator('tr.inc-row', { hasText: incidentReference }).click();
    await expect(page).toHaveURL(new RegExp(`/incidents/${incidentReference}\\?from=approver`));

    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await page.locator('select').selectOption({ label: 'Resolver User (resolver@factoryshield.dev)' });
    await page.getByRole('button', { name: 'Confirm Approve' }).click();
    // On success the incident reloads and the approver panel unmounts (status
    // moves past Submitted), so assert on the resulting assignment instead of
    // the transient success toast.
    await expect(page.locator('.inc-sum-value.inc-sum-blue')).toHaveText('Resolver User', { timeout: 15_000 });
  });

  await test.step('Resolver opens the investigation and completes the checklist', async () => {
    await logout(page);
    await login(page, 'resolver@factoryshield.dev', 'Resolver123!');
    await page.goto('/resolver/assigned');

    await page.locator('tr.inc-row', { hasText: incidentReference }).click();
    await expect(page).toHaveURL(/\/resolver\/incidents\/.+\/investigation/, { timeout: 15_000 });
    investigationUrl = page.url();

    const items = page.locator('ul.checklist li.cl-item');
    await expect(items.first()).toBeVisible({ timeout: 15_000 });
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const alreadyDone = await item.evaluate(el => el.classList.contains('cl-item--done'));
      if (!alreadyDone) {
        await item.click();
        await expect(item).toHaveClass(/cl-item--done/);
      }
    }
  });

  await test.step('Resolver submits the RCA', async () => {
    await page.goto(investigationUrl.replace('/investigation', '/rca'));
    await page.getByPlaceholder('Describe the problem…')
      .fill('Operator caught hand in an unguarded machine.');
    // The 5-Why tab has no editable root-cause field — Structured RCA does.
    await page.getByRole('button', { name: 'Structured RCA' }).click();
    await page.getByPlaceholder('Describe the root cause in detail…')
      .fill('Machine guard was missing, allowing operator contact with moving parts.');
    await page.getByRole('button', { name: 'Submit RCA' }).click();
    await expect(page.getByText('RCA submitted successfully.')).toBeVisible({ timeout: 15_000 });
  });

  await test.step('Resolver creates and completes a CAPA action', async () => {
    await page.goto(investigationUrl);

    await page.locator('.add-capa-btn').click();
    await page.getByPlaceholder('Action title…').fill('Install machine guard');
    await page.locator('.capa-save-btn').click();

    const capaItem = page.locator('.capa-item', { hasText: 'Install machine guard' });
    await expect(capaItem).toBeVisible({ timeout: 10_000 });
    await capaItem.locator('select').selectOption('Completed');
    await expect(capaItem.locator('.capa-status-pill')).toHaveText('Completed');
  });

  await test.step('Resolver resolves the incident', async () => {
    const resolveBtn = page.getByRole('button', { name: 'Mark Resolved' });
    await expect(resolveBtn).toBeEnabled({ timeout: 10_000 });
    await resolveBtn.click();
    await expect(page).toHaveURL(/\/resolver\/assigned/, { timeout: 15_000 });
  });
});
