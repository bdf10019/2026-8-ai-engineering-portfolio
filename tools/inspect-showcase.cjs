const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.documentElement.classList.contains('has-3d'),{timeout:20000}).catch(()=>{});
 await page.screenshot({path:'output/showcase-desktop.png'});
 console.log(JSON.stringify({title:await page.title(),enhanced:await page.locator('html').getAttribute('class'),errors,canvas:await page.locator('#axisCanvas').boundingBox(),bodyWidth:await page.evaluate(()=>document.body.scrollWidth)}));
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
