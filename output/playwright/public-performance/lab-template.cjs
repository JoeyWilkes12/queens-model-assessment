async (page) => {
 const round=ROUND_NUMBER;
 const browser=page.context().browser();
 await page.goto('about:blank');
 const routes=[{id:'home',hash:''},{id:'local-qwen',hash:'#/local-qwen'},{id:'atlas',hash:'#/evidence-atlas'}];
 const profiles=[{id:'desktop',viewport:{width:1440,height:1000},cpu:1,network:null},{id:'mobile-slow4g',viewport:{width:390,height:844},cpu:4,network:{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750,connectionType:'cellular4g'}}];
 const results=[];
 for(const profile of profiles) for(const route of routes){
  const context=await browser.newContext({viewport:profile.viewport,serviceWorkers:'block',isMobile:profile.id!=='desktop',hasTouch:profile.id!=='desktop',deviceScaleFactor:profile.id==='desktop'?1:3,...(profile.id==='desktop'?{}:{userAgent:'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36'})});
  const p=await context.newPage();await p.bringToFront();
  const cdp=await context.newCDPSession(p);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile.cpu});if(profile.network)await cdp.send('Network.emulateNetworkConditions',profile.network);
  const requests=new Map(),errors=[];
  cdp.on('Network.requestWillBeSent',e=>requests.set(e.requestId,{url:e.request.url,type:e.type,start:e.timestamp}));
  cdp.on('Network.responseReceived',e=>{const r=requests.get(e.requestId);if(r)Object.assign(r,{status:e.response.status,protocol:e.response.protocol,mime:e.response.mimeType,cache:!!e.response.fromDiskCache,serviceWorker:!!e.response.fromServiceWorker,headers:e.response.headers})});
  cdp.on('Network.loadingFinished',e=>{const r=requests.get(e.requestId);if(r)Object.assign(r,{encodedDataLength:e.encodedDataLength,durationMs:(e.timestamp-r.start)*1000})});
  cdp.on('Network.loadingFailed',e=>{const r=requests.get(e.requestId);if(r)r.failure=e.errorText});
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(({route})=>{
   window.__audit={lcpMs:null,lcpElement:null,cls:0,longTasks:[],primaryReadyMs:null};
   new PerformanceObserver(list=>{for(const e of list.getEntries()){window.__audit.lcpMs=e.startTime;window.__audit.lcpElement={tag:e.element?.tagName,id:e.element?.id,text:e.element?.textContent?.slice(0,100),size:e.size}}}).observe({type:'largest-contentful-paint',buffered:true});
   new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__audit.cls+=e.value}).observe({type:'layout-shift',buffered:true});
   new PerformanceObserver(list=>{for(const e of list.getEntries())window.__audit.longTasks.push({start:e.startTime,duration:e.duration})}).observe({type:'longtask',buffered:true});
   const observer=new MutationObserver(()=>{
    const ready=route==='home'?document.querySelector('.leaderboard .lb-controls'):route==='atlas'?document.querySelector('.evidence-list .evidence-row')&&document.querySelector('.atlas-count')?.textContent.includes('5422'):document.querySelector('#lq-study')&&document.querySelector('#lq-tariff')&&document.querySelector('#lq-receipts tbody tr');
    if(ready){observer.disconnect();requestAnimationFrame(()=>requestAnimationFrame(()=>window.__audit.primaryReadyMs=performance.now()))}
   });observer.observe(document,{subtree:true,childList:true});
  },{route:route.id});
  let failure=null;
  try{
   await p.goto('https://joeywilkes12.github.io/queens-model-assessment/'+route.hash,{waitUntil:'domcontentloaded',timeout:45000});
   await p.waitForFunction(()=>window.__audit.primaryReadyMs!==null,null,{timeout:45000});
   await p.waitForLoadState('networkidle',{timeout:15000});await p.waitForTimeout(1000);
  }catch(e){failure=String(e)}
  const data=await p.evaluate(()=>{
   const nav=performance.getEntriesByType('navigation')[0];const resources=performance.getEntriesByType('resource');
   const compact=e=>({name:e.name,initiatorType:e.initiatorType,transferSize:e.transferSize,encodedBodySize:e.encodedBodySize,decodedBodySize:e.decodedBodySize,startTime:e.startTime,duration:e.duration,responseStart:e.responseStart,responseEnd:e.responseEnd});
   return {...window.__audit,title:document.title,atlasCount:document.querySelector('.atlas-count')?.textContent??null,visibility:document.visibilityState,ttfbMs:nav.responseStart,domContentLoadedMs:nav.domContentLoadedEventEnd,loadEventMs:nav.loadEventEnd,paint:performance.getEntriesByType('paint').map(e=>({name:e.name,startTime:e.startTime})),navigation:compact(nav),resources:resources.map(compact),domNodes:document.getElementsByTagName('*').length,measuredThroughMs:performance.now()};
  });
  const reqs=[...requests.values()].filter(r=>r.url.startsWith('https://joeywilkes12.github.io/queens-model-assessment/'));
  const row={round,profile:profile.id,route:route.id,browser:browser.version(),cpuRate:profile.cpu,network:profile.network,viewport:profile.viewport,...data,requests:reqs,networkTransferBytes:reqs.reduce((n,r)=>n+(r.encodedDataLength||0),0),encodedBodyBytes:data.navigation.encodedBodySize+data.resources.reduce((n,r)=>n+r.encodedBodySize,0),decodedBodyBytes:data.navigation.decodedBodySize+data.resources.reduce((n,r)=>n+r.decodedBodySize,0),requestCount:reqs.length,cacheResponses:reqs.filter(r=>r.cache||r.serviceWorker).length,errors,failure};
  if(round===1)await p.screenshot({path:'output/playwright/public-performance/'+profile.id+'-'+route.id+'.png'});
  results.push(row);await context.close();
 }
 return results;
}
