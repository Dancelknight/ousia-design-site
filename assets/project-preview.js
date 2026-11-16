(()=>{
 if(new URLSearchParams(location.search).get('preview')!=='1')return;
 const de=document.documentElement.lang==='de';
 const robots=document.createElement('meta');robots.name='robots';robots.content='noindex,nofollow';document.head.append(robots);
 let error='';
 try{const d=JSON.parse(localStorage.getItem('ousia-content-manager')||'null');if(Array.isArray(d?.[de?'de':'en']))window[de?'OUSIA_PROJECTS_DE':'OUSIA_PROJECTS']=d[de?'de':'en'];else error=' Kein lokaler Entwurf gefunden.';}catch{error=' Lokaler Entwurf konnte nicht gelesen werden.';}
 document.addEventListener('DOMContentLoaded',()=>{
 const note=document.createElement('p');note.textContent='Lokale Vorschau · noch nicht veröffentlicht.'+error;note.style.cssText='position:fixed;bottom:12px;left:12px;z-index:100;background:#fff;color:#222;padding:12px;border:1px solid #888;max-width:90vw';document.body.append(note);
 document.querySelectorAll('a[href*="/project/?p="],a[href^="project/?p="]').forEach(a=>{const u=new URL(a.href);u.searchParams.set('preview','1');a.href=u.href;});
 const q=indexedDB.open('ousia-content-assets',1);
 q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('files'))q.result.createObjectStore('files',{keyPath:'name'});};
 q.onerror=()=>note.textContent+=' Bilder im Browserspeicher nicht erreichbar.';
 q.onsuccess=()=>{const db=q.result,urls=[];for(const img of document.querySelectorAll('[data-project-detail] img')){
 const name=decodeURIComponent(new URL(img.src).pathname.split('/').pop());
 const r=db.transaction('files').objectStore('files').get(name);
 r.onsuccess=()=>{if(r.result?.blob){const u=URL.createObjectURL(r.result.blob);urls.push(u);img.src=u;}};
 }window.addEventListener('pagehide',()=>{urls.forEach(URL.revokeObjectURL);db.close();},{once:true});};
 });
})();