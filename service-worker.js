const CACHE='shiftmate-3.1.16-named-native-pdf';
const SHELL=['./','./index.html','./styles.css','./app.js','./shiftData.js','./payCalculator.js','./annualLeaveLoading.js','./agreementData.js','./storage.js','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./manifest.json','./leave-form-template.pdf','./shift-change-form-template.png','./styles.css?v=3.1.13-pta-forms','./apple-touch-icon.png?v=3.1.13-pta-forms','./manifest.json?v=3.1.13-pta-forms','./agreementData.js?v=8.3','./shiftData.js?v=3.1.14-payroll-pdf','./annualLeaveLoading.js?v=3.1.13-pta-forms','./payCalculator.js?v=3.1.14-payroll-pdf','./storage.js?v=8.3','./vendor/pdf-lib.min.js?v=1.17.1','./formPdfFields.js?v=2','./formPdf.js?v=5','./app.js?v=3.1.16-named-native-pdf'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const PDF_CACHE='shiftmate-private-pdf-previews';
const PDF_ROUTE=new URL('./__pdf_preview__/',self.registration.scope).href;
const PDF_LIFETIME=5*60*1000;

async function clearExpiredPreviews(cache){
  for(const request of await cache.keys()){
    const response=await cache.match(request);
    if(!response||Number(response.headers.get('X-ShiftMate-Expires'))<=Date.now())await cache.delete(request);
  }
}

self.addEventListener('message',event=>{
  if(event.data?.type!=='shiftmate-pdf-preview'||!event.ports[0])return;
  event.waitUntil((async()=>{
    const port=event.ports[0];
    try{
      const {file}=event.data;
      if(!(file instanceof File)||file.type!=='application/pdf')throw new TypeError('Expected a PDF file');
      const cache=await caches.open(PDF_CACHE);
      await clearExpiredPreviews(cache);
      const encoded=encodeURIComponent(file.name).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
      const ascii=file.name.normalize('NFKD').replace(/\p{M}/gu,'').replace(/[^\x20-\x7e]|["\\]/g,'_');
      const url=PDF_ROUTE+crypto.randomUUID()+'/'+encoded;
      await cache.put(url,new Response(file,{headers:{
        'Content-Type':'application/pdf',
        'Content-Disposition':`inline; filename="${ascii}"; filename*=UTF-8''${encoded}`,
        'Cache-Control':'no-store',
        'X-ShiftMate-Expires':String(Date.now()+PDF_LIFETIME)
      }}));
      port.postMessage({url});
    }catch{
      port.postMessage({url:null});
    }
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  if(event.request.url.startsWith(PDF_ROUTE)){
    event.respondWith((async()=>{
      const cache=await caches.open(PDF_CACHE);
      const response=await cache.match(event.request.url);
      if(response&&Number(response.headers.get('X-ShiftMate-Expires'))>Date.now())return response;
      await cache.delete(event.request.url);
      return new Response(null,{status:404});
    })());
    return;
  }
  if(event.request.mode==='navigate'){
    event.waitUntil(caches.has(PDF_CACHE).then(async exists=>{
      if(exists)await clearExpiredPreviews(await caches.open(PDF_CACHE));
    }).catch(()=>{}));
  }
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return response;
  }).catch(async()=>{
    const cached=await caches.match(event.request);
    if(cached)return cached;
    if(event.request.mode==='navigate')return caches.match('./index.html');
    return Response.error();
  }));
});
