/* Ousia media loader — CMS-managed portrait + process film */
(()=>{
  const currentScript=[...document.scripts].find(s=>/\/assets\/media-loader\.js(?:\?|$)/.test(s.src));
  const assetsBase=currentScript?new URL('./',currentScript.src):new URL('/assets/',location.origin);
  const publicSettings=window.OUSIA_SITE_SETTINGS||{};
  const localSettings=(()=>{try{return JSON.parse(localStorage.getItem('ousia-site-settings')||'{}')}catch{return {}}})();

  const openDb=()=>new Promise((resolve,reject)=>{
    const req=indexedDB.open('ousia-content-assets',1);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('files'))db.createObjectStore('files',{keyPath:'name'});};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
  const getLocal=async name=>{
    if(!name)return null;
    try{const db=await openDb();return await new Promise((resolve,reject)=>{const q=db.transaction('files').objectStore('files').get(name);q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>reject(q.error);});}
    catch{return null;}
  };

  async function loadPortrait(){
    const imgs=[...document.querySelectorAll('img[src*="daniel-stofner-profile"], .profile-card-photo img, .profile-intro-photo img')];
    if(!imgs.length)return;
    const name=localSettings.profileFilename||publicSettings.profileFilename||'daniel-stofner-profile-clean.jpg';
    const local=await getLocal(name);
    let src;
    if(local?.blob) src=URL.createObjectURL(local.blob);
    else src=new URL('images/'+name,assetsBase).href;
    imgs.forEach(img=>{
      img.removeAttribute('srcset');
      img.src=src;
      img.style.opacity='1';
      img.style.display='block';
      img.style.objectFit='contain';
      img.style.background='transparent';
    });
  }

  async function loadVideo(){
    const section=document.querySelector('[data-film-section]'),video=document.querySelector('[data-film]');
    if(!section||!video)return;
    const filename=localSettings.videoFilename||publicSettings.videoFilename||null;
    if(!filename){section.hidden=true;return;}
    const local=await getLocal(filename);
    if(local?.blob){
      video.src=URL.createObjectURL(local.blob);
      video.preload='metadata';video.playsInline=true;section.hidden=false;return;
    }
    const url=new URL('media/'+filename,assetsBase);
    try{
      const head=await fetch(url,{method:'HEAD',cache:'no-store'});
      if(!head.ok)throw new Error(String(head.status));
      video.src=url.href;video.preload='metadata';video.playsInline=true;section.hidden=false;
    }catch(e){
      section.hidden=true;
      console.warn('Process film not published yet',e);
    }
  }

  loadPortrait();
  loadVideo();
})();