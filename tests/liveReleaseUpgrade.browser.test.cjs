// Same-origin upgrade from the previous LIVE release; no reinstall or storage reset.
// Requires full Git history, Chrome and PLAYWRIGHT_MODULE (or installed playwright).
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process'),{once}=require('node:events');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),baseline=process.env.LIVE_UPGRADE_BASELINE_REF||'f529f86';
const old=file=>execFileSync('git',['show',`${baseline}:${file}`],{cwd:root,maxBuffer:20*1024*1024,stdio:['ignore','pipe','pipe']});
const fixture={startDate:'2026-09-20',settings:{classification:'STO3',classificationOverride:true,rateSource:'agreement',baseRate:44.37,homeLine:'ARMADALE',lease:546.95,gesb:100,postTax:7.4,extraTax:0,paygScale:1,supervisorRate:52,supervisorRateEffective:'2026-10-12',employeeName:'Example User',serviceNumber:'EXAMPLE',employmentFraction:.5,partTimeLeaveHours:6},days:Array.from({length:14},(_,i)=>[0,1,5,6,7,8,9,10].includes(i)?{code:'A/L',type:'Leave',start:'00:00',finish:'10:00',leaveHours:10,entered:true,partner:'Example'}:{code:'',type:'Off',entered:true})};
const saved=[{...JSON.parse(JSON.stringify(fixture)),id:'cycle-2026-09-20',status:'paid',actualDeposit:'2935.91',notes:'Keep this note',summary:{gross:4339.24,hours:78,net:2867.89},updatedAt:'2026-10-14T00:00:00.000Z'}];
let server,browser,release=false;
(async()=>{
 for(const file of ['manifest.json','storage.js','agreementData.js'])assert.equal(fs.readFileSync(path.join(root,file),'utf8').replaceAll('\r\n','\n'),old(file).toString().replaceAll('\r\n','\n'),file+' changed unexpectedly');
 const before=old('app.js').toString(),after=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const oldCalculator=old('payCalculator.js').toString(),newCalculator=fs.readFileSync(path.join(root,'payCalculator.js'),'utf8');
 const residentCoefficients=source=>source.match(/const residentScales=\{[\s\S]+?\n\s*\};/)[0].replaceAll('\r\n','\n');
 assert.equal(residentCoefficients(newCalculator),residentCoefficients(oldCalculator),'2026 withholding coefficients changed');
 const begin='  const ROSTER_PROJECTION_PROFILES=',end='  function projectedSettingsForDate';
 const projection=source=>source.slice(source.indexOf(begin),source.indexOf(end,source.indexOf(begin))).replaceAll('\r\n','\n');
 assert.equal(projection(after),projection(before),'LIVE roster projection changed');
 const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};
 server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),relative=url.pathname==='/'?'index.html':url.pathname.slice(1);
  if(relative.includes('..')){res.writeHead(403);res.end();return;}
  try{const data=release?fs.readFileSync(path.join(root,relative)):old(relative);res.writeHead(200,{'Content-Type':mime[path.extname(relative)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);}
  catch{res.writeHead(404);res.end('Missing');}
 }).listen(0,'127.0.0.1');await once(server,'listening');
 browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const url=`http://127.0.0.1:${server.address().port}/`;
 await page.goto(url);await page.evaluate(({fixture,saved})=>{localStorage.setItem('ptaV2Current',JSON.stringify(fixture));localStorage.setItem('ptaV2Cycles',JSON.stringify(saved));},{fixture,saved});
 await page.reload();await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
 await page.waitForFunction(()=>navigator.serviceWorker.controller!=null);
 assert.equal(await page.locator('#gross').textContent(),'$4,443.78');
 const cycleBefore=await page.evaluate(()=>localStorage.getItem('ptaV2Cycles'));
 const identityBefore=await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();const m=await fetch('manifest.json').then(r=>r.json());return {scope:r.scope,script:r.active.scriptURL,manifest:m,origin:location.origin}});
 release=true;await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
 await page.waitForFunction(async()=> (await caches.keys()).includes('shiftmate-3.1.19-payroll'));
 await page.reload();await page.waitForFunction(()=>document.querySelector('#gross').textContent==='$4,443.78');
 assert.equal(await page.locator('#hours').textContent(),'80.0');
 assert.equal(await page.evaluate(()=>localStorage.getItem('ptaV2Cycles')),cycleBefore,'saved cycles/deposits were rewritten on upgrade');
 const current=await page.evaluate(()=>JSON.parse(localStorage.getItem('ptaV2Current')));
 assert.equal(current.settings.employeeName,fixture.settings.employeeName);assert.equal(current.settings.serviceNumber,fixture.settings.serviceNumber);
 for(const key of ['lease','gesb','postTax','classification','homeLine','paygScale','supervisorRate','supervisorRateEffective'])assert.equal(current.settings[key],fixture.settings[key]);
 assert.deepEqual(current.days,fixture.days,'entered current roster changed during release');
 const result=await page.evaluate(f=>PayCalc.calculate(f),fixture);
 assert.equal(result.leaveUsage.annual,70);assert.equal(result.hours,80);assert.ok(Math.abs(result.gross-4443.78)<.005);
 const identityAfter=await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();const m=await fetch('manifest.json').then(r=>r.json());return {scope:r.scope,script:r.active.scriptURL,manifest:m,origin:location.origin}});
 assert.deepEqual(identityAfter,identityBefore,'installation identity or scope changed');
 await page.locator('.nav-button[data-go="settings"]').click();
 assert.equal(await page.locator('#employmentFraction,#partTimeLeaveHours').count(),0);
 assert.equal(await page.locator('#advancedLeaveLoadingSettings').getAttribute('open'),null);
 await context.setOffline(true);await page.reload();
 await page.waitForFunction(()=>document.querySelector('#gross')?.textContent==='$4,443.78');
 assert.equal(await page.evaluate(()=>localStorage.getItem('ptaV2Cycles')),cycleBefore);
 await page.locator('.nav-button[data-go="settings"]').click();
 await page.locator('#mileagePayg').locator('xpath=ancestor::details[1]/summary').click();
 assert.equal(await page.locator('#mileagePayg').inputValue(),'unconfirmed');
 await page.locator('#mileagePayg').selectOption('cents-per-km');
 await page.locator('#mileagePriorKm').fill('125.5');
 await page.locator('#saveCurrent').click();
 await page.reload();
 await page.locator('.nav-button[data-go="settings"]').click();
 assert.equal(await page.locator('#mileagePayg').inputValue(),'cents-per-km');
 assert.equal(await page.locator('#mileagePriorKm').inputValue(),'125.5');
 assert.equal(await page.evaluate(()=>localStorage.getItem('ptaV2Cycles')),cycleBefore);
 assert.deepEqual(errors,[]);
 console.log('LIVE same-origin upgrade preserved manifest/scope/storage/current roster/saved cycles/actual deposits; offline release passed');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
