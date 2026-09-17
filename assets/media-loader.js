/* Ousia media loader — transparent profile cutout + process film */
(()=>{
  const currentScript=[...document.scripts].find(s=>/\/assets\/media-loader\.js(?:\?|$)/.test(s.src));
  const assetsBase=currentScript?new URL('./',currentScript.src):new URL('/assets/',location.origin);

  function cutOutWhiteBackground(img){
    if(img.dataset.cutoutBusy==='1'||img.dataset.cutoutDone==='1')return;
    const src=img.currentSrc||img.src||'';
    if(!src.startsWith('data:image/jpeg'))return;
    img.dataset.cutoutBusy='1';
    const source=new Image();
    source.onload=()=>{
      try{
        const w=source.naturalWidth,h=source.naturalHeight,n=w*h;
        const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);
        const frame=ctx.getImageData(0,0,w,h),d=frame.data;
        const seen=new Uint8Array(n),queue=new Uint32Array(n);let head=0,tail=0;
        const candidate=i=>{const p=i*4,r=d[p],g=d[p+1],b=d[p+2],max=Math.max(r,g,b),min=Math.min(r,g,b);return min>226&&(max-min)<22;};
        const add=i=>{if(!seen[i]&&candidate(i)){seen[i]=1;queue[tail++]=i;}};
        for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
        while(head<tail){const i=queue[head++],x=i%w,y=(i/w)|0;if(x)add(i-1);if(x<w-1)add(i+1);if(y)add(i-w);if(y<h-1)add(i+w);}
        for(let i=0;i<n;i++)if(seen[i]){const p=i*4,b=(d[p]+d[p+1]+d[p+2])/3;d[p+3]=b>=246?0:Math.max(0,Math.min(255,Math.round((246-b)*12.75)));}
        ctx.putImageData(frame,0,0);img.dataset.cutoutDone='1';img.src=canvas.toDataURL('image/png');
      }catch(e){console.error('Portrait cutout failed',e);}finally{delete img.dataset.cutoutBusy;}
    };
    source.onerror=()=>{delete img.dataset.cutoutBusy;};source.src=src;
  }

  document.querySelectorAll('img[src*="daniel-stofner-profile"]').forEach(img=>{
    const observer=new MutationObserver(()=>cutOutWhiteBackground(img));observer.observe(img,{attributes:true,attributeFilter:['src']});cutOutWhiteBackground(img);
    window.setTimeout(()=>cutOutWhiteBackground(img),300);window.setTimeout(()=>cutOutWhiteBackground(img),1000);
  });

  const section=document.querySelector('[data-film-section]'),video=document.querySelector('[data-film]');
  if(section&&video){
    Promise.all(['00','01','02','03','04'].map(async n=>{const r=await fetch(new URL(`video-micro/${n}.txt?v=20260917`,assetsBase),{cache:'force-cache'});if(!r.ok)throw new Error(`video chunk ${n}: ${r.status}`);return (await r.text()).replace(/\s+/g,'');}))
      .then(parts=>{const raw=atob(parts.join('')),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);video.src=URL.createObjectURL(new Blob([bytes],{type:'video/mp4'}));video.preload='metadata';video.playsInline=true;section.hidden=false;})
      .catch(e=>console.error('Process film load failed',e));
  }
})();
