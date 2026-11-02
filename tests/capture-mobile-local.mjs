import { chromium } from '@playwright/test';
import path from 'node:path';

const browser=await chromium.launch({headless:true});
const shots=path.join(process.cwd(),'docs','screenshots');
const contextA=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
const contextB=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
const a=await contextA.newPage();const b=await contextB.newPage();
const shot=async(page,name)=>{await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();scrollTo(0,0)});await page.waitForTimeout(300);await page.screenshot({path:path.join(shots,name),fullPage:false})};
await a.goto('http://127.0.0.1:5173');await a.getByTestId('nickname').fill('小岚');await a.getByTestId('primary-action').click();await a.locator('.lobby-card').waitFor();const code=new URL(a.url()).searchParams.get('room');
await b.goto(`http://127.0.0.1:5173/?room=${code}`);await b.getByTestId('nickname').fill('阿海');await b.getByTestId('primary-action').click();await a.getByTestId('start-game').waitFor();await shot(a,'lobby-mobile-390.png');await a.getByTestId('start-game').click();await a.getByTestId('answer-input').waitFor();await shot(a,'round-input-mobile-390.png');await a.getByTestId('answer-input').fill('苹果');await b.getByTestId('answer-input').fill('苹果');await a.getByTestId('submit-answer').click();await b.getByTestId('submit-answer').click();await a.getByText('你们的脑回路相遇了').waitFor({timeout:8000});await shot(a,'finish-mobile-390.png');
await contextA.close();await contextB.close();await browser.close();
