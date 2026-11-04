// VYA service worker: keeps the app opening without signal, and shows push notifications. Never touches Supabase or map calls.
const CACHE='vya-shell-v2';
const SHELL=['/','/icon-192.png','/icon-512.png','/manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;
  // network first, so a new version always wins; cached copy only when offline
  e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c));}return res;}).catch(()=>caches.match(r).then(m=>m||caches.match('/'))));
});
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{};}catch(_){}
  const title=String(d.title||'VYA').slice(0,60),body=String(d.body||'').slice(0,140),tag=String(d.tag||'vya').slice(0,40);
  e.waitUntil(self.registration.showNotification(title,{body,tag,renotify:true,icon:'/icon-192.png',badge:'/icon-192.png',data:{url:'/'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if('focus' in c)return c.focus();}
    return self.clients.openWindow('/');
  }));
});
