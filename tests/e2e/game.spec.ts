import { test, expect, type Browser } from '@playwright/test';

async function startPair(browser:Browser){
  const aContext=await browser.newContext();const bContext=await browser.newContext();
  const a=await aContext.newPage();await a.goto('/');await a.getByTestId('nickname').fill('小岚');await a.getByTestId('primary-action').click();await a.locator('.lobby-card').waitFor();
  const code=new URL(a.url()).searchParams.get('room')||'';expect(code).toMatch(/^\d{6}$/);
  const b=await bContext.newPage();await b.goto(`/?room=${code}`);await b.getByTestId('nickname').fill('阿海');await b.getByTestId('primary-action').click();
  await a.getByTestId('start-game').click();
  await Promise.all([a.getByTestId('answer-input').waitFor(),b.getByTestId('answer-input').waitFor()]);
  return {a,b,aContext,bContext,code};
}

test('two players match on the first round',async({browser})=>{
  const {a,b,aContext,bContext}=await startPair(browser);
  await a.getByTestId('answer-input').fill('苹果');await b.getByTestId('answer-input').fill('苹果');
  await a.getByTestId('submit-answer').click();await b.getByTestId('submit-answer').click();
  await expect(a.getByText('你们的脑回路相遇了')).toBeVisible({timeout:8000});
  await expect(a.locator('.finish-rounds')).toContainText('苹果');
  await aContext.close();await bContext.close();
});

test('different first answers continue to a second round',async({browser})=>{
  const {a,b,aContext,bContext}=await startPair(browser);
  await a.getByTestId('answer-input').fill('大海');await b.getByTestId('answer-input').fill('天空');
  await a.getByTestId('submit-answer').click();await b.getByTestId('submit-answer').click();
  await expect(a.getByText('把这些词联系起来')).toBeVisible({timeout:8000});
  await a.getByTestId('answer-input').fill('蓝色');await b.getByTestId('answer-input').fill('蓝色');
  await a.getByTestId('submit-answer').click();await b.getByTestId('submit-answer').click();
  await expect(a.getByText('你们的脑回路相遇了')).toBeVisible({timeout:8000});
  await expect(a.locator('.finish-rounds>div')).toHaveCount(2);
  await aContext.close();await bContext.close();
});

test('mobile home has no horizontal overflow',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true});const page=await context.newPage();await page.goto('/');
  const widths=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);await expect(page.getByTestId('primary-action')).toBeVisible();await context.close();
});

test('refresh restores identity and submitted state',async({browser})=>{
  const {a,b,aContext,bContext}=await startPair(browser);
  await a.getByTestId('answer-input').fill('苹果');await a.getByTestId('submit-answer').click();
  await a.reload();await expect(a.getByTestId('submit-answer')).toContainText('已锁定',{timeout:8000});
  await b.getByTestId('answer-input').fill('苹果');await b.getByTestId('submit-answer').click();
  await expect(a.getByText('你们的脑回路相遇了')).toBeVisible({timeout:8000});await aContext.close();await bContext.close();
});
