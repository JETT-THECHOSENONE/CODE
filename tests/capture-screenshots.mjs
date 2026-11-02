import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const ref=path.join(root,'docs','reference');const shots=path.join(root,'docs','screenshots');
await mkdir(ref,{recursive:true});await mkdir(shots,{recursive:true});
const browser=await chromium.launch({headless:true});
const shot=async(page,file)=>{await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();window.scrollTo(0,0)});await page.waitForTimeout(550);await page.screenshot({path:file,fullPage:true})};

for(const [width,height,name] of [[1440,900,'original-home-1440.png'],[390,844,'original-home-390.png'],[375,812,'original-home-375.png']]){
  const page=await browser.newPage({viewport:{width,height}});await page.goto('https://www.sameword.top/?lang=zh',{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1500);await shot(page,path.join(ref,name));await page.close();
}

const desktop=await browser.newPage({viewport:{width:1440,height:900}});await desktop.goto('http://127.0.0.1:5173');await desktop.getByTestId('nickname').fill('柠檬可乐');await shot(desktop,path.join(shots,'home-desktop.png'));
await desktop.getByTestId('nickname').fill('小岚');await desktop.getByTestId('primary-action').click();await desktop.locator('.lobby-card').waitFor();await shot(desktop,path.join(shots,'lobby-desktop.png'));
const code=new URL(desktop.url()).searchParams.get('room');
const guestContext=await browser.newContext({viewport:{width:1200,height:820}});const guest=await guestContext.newPage();await guest.goto(`http://127.0.0.1:5173/?room=${code}`);await guest.getByTestId('nickname').fill('阿海');await guest.getByTestId('primary-action').click();await desktop.getByTestId('start-game').waitFor();await shot(desktop,path.join(shots,'lobby-full-desktop.png'));await desktop.getByTestId('start-game').click();await desktop.getByTestId('answer-input').waitFor();await shot(desktop,path.join(shots,'round-input.png'));
await desktop.getByTestId('answer-input').fill('苹果');await guest.getByTestId('answer-input').fill('苹果');await desktop.getByTestId('submit-answer').click();await guest.getByTestId('submit-answer').click();await desktop.getByText('默契命中！').waitFor();await shot(desktop,path.join(shots,'reveal.png'));await desktop.getByText('你们的脑回路相遇了').waitFor({timeout:8000});await shot(desktop,path.join(shots,'finish.png'));
const mobile=await browser.newPage({viewport:{width:390,height:844}});await mobile.goto('http://127.0.0.1:5173');await mobile.getByTestId('nickname').fill('柠檬可乐');await shot(mobile,path.join(shots,'home-mobile-390.png'));
const mobileHostContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
const mobileGuestContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
const mobileHost=await mobileHostContext.newPage();
await mobileHost.goto('http://127.0.0.1:5173');
await mobileHost.getByTestId('nickname').fill('小岚');
await mobileHost.getByTestId('primary-action').click();
await mobileHost.locator('.lobby-card').waitFor();
const mobileCode=new URL(mobileHost.url()).searchParams.get('room');
const mobileGuest=await mobileGuestContext.newPage();
await mobileGuest.goto(`http://127.0.0.1:5173/?room=${mobileCode}`);
await mobileGuest.getByTestId('nickname').fill('阿海');
await mobileGuest.getByTestId('primary-action').click();
await mobileHost.getByTestId('start-game').waitFor();
await shot(mobileHost,path.join(shots,'lobby-mobile-390.png'));
await mobileHost.getByTestId('start-game').click();
await mobileHost.getByTestId('answer-input').waitFor();
await shot(mobileHost,path.join(shots,'round-input-mobile-390.png'));
await mobileHost.getByTestId('answer-input').fill('苹果');
await mobileGuest.getByTestId('answer-input').fill('苹果');
await mobileHost.getByTestId('submit-answer').click();
await mobileGuest.getByTestId('submit-answer').click();
await mobileHost.getByText('你们的脑回路相遇了').waitFor({timeout:8000});
await shot(mobileHost,path.join(shots,'finish-mobile-390.png'));
await mobileHostContext.close();await mobileGuestContext.close();
await guestContext.close();await browser.close();
