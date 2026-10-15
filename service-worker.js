const CACHE='shiftmate-3.1.12-pay-calculations';
const SHELL=['./','./index.html','./styles.css','./app.js','./shiftData.js','./payCalculator.js','./agreementData.js','./storage.js','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./manifest.json','./leave-form-template.png','./shift-change-form-template.png',"./annualLeaveLoading.js","./styles.css?v=3.1.12-pay-calculations","./apple-touch-icon.png?v=3.1.12-pay-calculations","./manifest.json?v=3.1.12-pay-calculations","./agreementData.js?v=8.3","./shiftData.js?v=3.1.12-pay-calculations","./annualLeaveLoading.js?v=3.1.12-pay-calculations","./payCalculator.js?v=3.1.12-pay-calculations","./storage.js?v=8.3","./app.js?v=3.1.12-pay-calculations"];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(fetch(event.request).then(response=>{
    const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return response;
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));
});
