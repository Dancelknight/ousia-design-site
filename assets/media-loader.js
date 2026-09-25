/* Ousia media loader — stable profile portrait + CMS-managed process film */
(()=>{
  const currentScript=[...document.scripts].find(s=>/\/assets\/media-loader\.js(?:\?|$)/.test(s.src));
  const assetsBase=currentScript?new URL('./',currentScript.src):new URL('/assets/',location.origin);
  const cleanPortrait=new URL('images/daniel-stofner-profile-clean.jpg?v=20260925',assetsBase).href;

  function cutOutWhiteBackground(img){
    if(img.dataset.cutoutBusy==='1'||img.dataset.cutoutDone==='1')return;
    img.dataset.cutoutBusy='1';
    const source=new Image();
    source.onload=()=>{
      try{
        const w=source.naturalWidth,h=source.naturalHeight,n=w*h;
        if(!w||!h)throw new Error('portrait dimensions unavailable');
        const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);
        const frame=ctx.getImageData(0,0,w,h),d=frame.data;
        const seen=new Uint8Array(n),queue=new Uint32Array(n);let head=0,tail=0;
        const candidate=i=>{const p=i*4,r=d[p],g=d[p+1],b=d[p+2],max=Math.max(r,g,b),min=Math.min(r,g,b);return min>226&&(max-min)<22;};
        const add=i=>{if(!seen[i]&&candidate(i)){seen[i]=1;queue[tail++]=i;}};
        for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
        while(head<tail){const i=queue[head++],x=i%w,y=(i/w)|0;if(x)add(i-1);if(x<w-1)add(i+1);if(y)add(i-w);if(y<h-1)add(i+w);}
        for(let i=0;i<n;i++)if(seen[i]){const p=i*4,b=(d[p]+d[p+1]+d[p+2])/3;d[p+3]=b>=246?0:Math.max(0,Math.min(255,Math.round((246-b)*12.75)));}
        ctx.putImageData(frame,0,0);img.src=canvas.toDataURL('image/png');img.dataset.cutoutDone='1';
      }catch(e){console.error('Portrait cutout failed',e);}
      finally{delete img.dataset.cutoutBusy;}
    };
    source.onerror=()=>{delete img.dataset.cutoutBusy;};
    source.src=cleanPortrait;
  }

  document.querySelectorAll('img[src*="daniel-stofner-profile"]').forEach(img=>{
    img.src=cleanPortrait;
    cutOutWhiteBackground(img);
  });

  const section=document.querySelector('[data-film-section]'),video=document.querySelector('[data-film]');
  if(!section||!video)return;

  const localSettings=(()=>{try{return JSON.parse(localStorage.getItem('ousia-site-settings')||'{}')}catch{return {}}})();
  const publicSettings=window.OUSIA_SITE_SETTINGS||{};
  const filename=localSettings.videoFilename||publicSettings.videoFilename||null;

  const openDb=()=>new Promise((resolve,reject)=>{
    const req=indexedDB.open('ousia-content-assets',1);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('files'))db.createObjectStore('files',{keyPath:'name'});};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
  const getLocal=async name=>{
    try{const db=await openDb();return await new Promise((resolve,reject)=>{const q=db.transaction('files').objectStore('files').get(name);q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>reject(q.error);});}
    catch{return null;}
  };

  (async()=>{
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
  })();
})();