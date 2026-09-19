import { expect, test } from '@playwright/test';
import { seedConversations, seedMessages } from '../specs/mock/db';
import { getE2EUser } from '../setup/user';

// Rendering contract against the real UI and isolated database, without model inference.
test('TING conversation hover and message alignment follow the reference', async ({ page }) => {
  const email = getE2EUser().email;
  const conversationId = '16390000-0000-4000-8000-000000000010';
  const otherId = '16390000-0000-4000-8000-000000000011';
  await seedConversations(email, [
    { conversationId, title: 'Aktiver Vorgang', updatedAt: new Date() },
    { conversationId: otherId, title: 'Weiterer Vorgang', updatedAt: new Date() },
  ]);
  await seedMessages(email, conversationId, [
    {
      messageId: '16390000-0000-4000-8000-000000000012',
      parentMessageId: '00000000-0000-0000-0000-000000000000',
      text: 'Meine Nachricht',
      isCreatedByUser: true,
      sender: 'User',
    },
    {
      messageId: '16390000-0000-4000-8000-000000000013',
      parentMessageId: '16390000-0000-4000-8000-000000000012',
      text: 'Die Antwort im Gespräch.',
      isCreatedByUser: false,
      sender: 'Assistant',
    },
  ]);
  await page.goto(`/c/${conversationId}`);
  const active = page.getByTestId('convo-item').filter({ hasText: 'Aktiver Vorgang' });
  const inactive = page.getByTestId('convo-item').filter({ hasText: 'Weiterer Vorgang' });
  await expect(active).toBeVisible();
  await expect(inactive).toBeVisible();
  const before = await inactive.boundingBox();
  await inactive.hover();
  await expect(inactive).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(inactive).toHaveCSS('border-left-color', 'rgb(155, 161, 165)');
  await expect(inactive).toHaveCSS('border-left-width', '3px');
  expect(await inactive.boundingBox()).toEqual(before);
  await active.hover();
  await expect(active).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(active).toHaveCSS('border-left-color', 'rgb(0, 113, 173)');
  const user = page.locator('.user-turn [data-testid="message-body"]').first();
  const agent = page.locator('.agent-turn [data-testid="message-body"]').first();
  await expect(user).toBeVisible();
  await expect(agent).toBeVisible();
  await expect(user).toHaveCSS('background-color', 'rgb(238, 239, 241)');
  await expect(agent).toHaveCSS('background-color', 'rgb(235, 243, 248)');
  const userBox = await user.boundingBox();
  const agentBox = await agent.boundingBox();
  expect(userBox!.x).toBeGreaterThan(agentBox!.x);
  await page.screenshot({ path: test.info().outputPath('conversation-desktop.png') });
});
