const CACHE='mondyal-freche-v1';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/','/index.html','/manifest.json'])));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  if(e.request.url.includes('supabase.co')){e.respondWith(fetch(e.request).catch(()=>new Response('[]')));return}
  e.respondWith(fetch(e.request).then(r=>{const cl=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));return r}).catch(()=>caches.match(e.request)))
});
