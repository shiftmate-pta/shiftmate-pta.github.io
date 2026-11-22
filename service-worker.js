const CACHE='shiftmate-3.1.17-pdf-viewer';
const SHELL=['./pdfViewer.js?v=2','./pdfViewer.css?v=3','./vendor/pdfjs/pdf.min.mjs','./vendor/pdfjs/pdf.worker.min.mjs','./vendor/pdfjs/standard_fonts/FoxitDingbats.pfb','./vendor/pdfjs/standard_fonts/FoxitFixed.pfb','./vendor/pdfjs/standard_fonts/FoxitFixedBold.pfb','./vendor/pdfjs/standard_fonts/FoxitFixedBoldItalic.pfb','./vendor/pdfjs/standard_fonts/FoxitFixedItalic.pfb','./vendor/pdfjs/standard_fonts/FoxitSerif.pfb','./vendor/pdfjs/standard_fonts/FoxitSerifBold.pfb','./vendor/pdfjs/standard_fonts/FoxitSerifBoldItalic.pfb','./vendor/pdfjs/standard_fonts/FoxitSerifItalic.pfb','./vendor/pdfjs/standard_fonts/FoxitSymbol.pfb','./vendor/pdfjs/standard_fonts/LiberationSans-Bold.ttf','./vendor/pdfjs/standard_fonts/LiberationSans-BoldItalic.ttf','./vendor/pdfjs/standard_fonts/LiberationSans-Italic.ttf','./vendor/pdfjs/standard_fonts/LiberationSans-Regular.ttf','./','./index.html','./styles.css','./app.js','./shiftData.js','./payCalculator.js','./annualLeaveLoading.js','./agreementData.js','./storage.js','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./manifest.json','./leave-form-template.pdf','./shift-change-form-template.png','./styles.css?v=3.1.17-pdf-viewer','./apple-touch-icon.png?v=3.1.13-pta-forms','./manifest.json?v=3.1.13-pta-forms','./agreementData.js?v=8.3','./shiftData.js?v=3.1.14-payroll-pdf','./annualLeaveLoading.js?v=3.1.13-pta-forms','./payCalculator.js?v=3.1.14-payroll-pdf','./storage.js?v=8.3','./vendor/pdf-lib.min.js?v=1.17.1','./formPdfFields.js?v=2','./formPdf.js?v=6','./app.js?v=3.1.17-pdf-viewer'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return response;
  }).catch(async()=>{
    const cached=await caches.match(event.request);
    if(cached)return cached;
    if(event.request.mode==='navigate')return caches.match('./index.html');
    return Response.error();
  }));
});
