(()=>{
  const clone=v=>JSON.parse(JSON.stringify(v));
  const originals={en:clone(window.OUSIA_PROJECTS||[]),de:clone(window.OUSIA_PROJECTS_DE||[])};
  const saved=JSON.parse(localStorage.getItem('ousia-content-manager')||'null');
  const state=saved||{en:clone(originals.en),de:clone(originals.de),lang:'en',selected:0};
  if(!state.en)state.en=clone(originals.en);if(!state.de)state.de=clone(originals.de);if(!state.lang)state.lang='en';if(state.selected==null)state.selected=0;

  const listEl=document.getElementById('project-list');
  const form=document.getElementById('project-form');
  const preview=document.getElementById('preview-project');
  const mediaPreview=document.getElementById('media-preview');
  const galleryDrop=document.getElementById('gallery-drop');
  const galleryFiles=document.getElementById('gallery-files');
  const pendingCount=document.getElementById('pending-count');
  const profileDrop=document.getElementById('profile-drop');
  const profileFile=document.getElementById('profile-file');
  const profilePanel=document.getElementById('profile-panel');
  const profilePreview=document.getElementById('profile-preview');
  const profileName=document.getElementById('profile-name');
  const profileState=document.getElementById('profile-state');
  const videoDrop=document.getElementById('video-drop');
  const videoFile=document.getElementById('video-file');
  const videoPanel=document.getElementById('video-panel');
  const videoPreview=document.getElementById('video-preview');
  const videoName=document.getElementById('video-name');
  const videoState=document.getElementById('video-state');
  const publicSiteSettings=window.OUSIA_SITE_SETTINGS||{};
  const siteSettings=(()=>{try{return JSON.parse(localStorage.getItem('ousia-site-settings')||'null')||{videoFilename:publicSiteSettings.videoFilename||null,profileFilename:publicSiteSettings.profileFilename||null};}catch{return {videoFilename:publicSiteSettings.videoFilename||null,profileFilename:publicSiteSettings.profileFilename||null};}})();
  if(siteSettings.videoFilename===undefined)siteSettings.videoFilename=publicSiteSettings.videoFilename||null;
  if(siteSettings.profileFilename===undefined)siteSettings.profileFilename=publicSiteSettings.profileFilename||null;
  const saveSiteSettings=()=>localStorage.setItem('ousia-site-settings',JSON.stringify(siteSettings));
  const save=()=>localStorage.setItem('ousia-content-manager',JSON.stringify(state));
  const currentList=()=>state[state.lang];
  const otherLang=()=>state.lang==='en'?'de':'en';
  const current=()=>currentList()[state.selected]||null;
  const findOther=slug=>state[otherLang()].find(p=>p.slug===slug)||null;
  const sharedFields=new Set(['slug','number','cover','plan','images']);
  let objectUrls=[];

  const dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open('ousia-content-assets',1);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('files'))db.createObjectStore('files',{keyPath:'name'});};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
  async function dbPut(file){const db=await dbPromise;return new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put({name:file.name,type:file.type,lastModified:file.lastModified,blob:file});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
  async function dbGet(name){const db=await dbPromise;return new Promise((resolve,reject)=>{const req=db.transaction('files').objectStore('files').get(name);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});}
  async function dbAll(){const db=await dbPromise;return new Promise((resolve,reject)=>{const req=db.transaction('files').objectStore('files').getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);});}
  async function dbDelete(name){const db=await dbPromise;return new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').delete(name);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}

  function syncShared(p,oldSlug=p.slug){
    const counterpart=findOther(oldSlug)||state[otherLang()].find(x=>x.number===p.number);
    if(counterpart)for(const k of sharedFields)counterpart[k]=clone(p[k]);
  }

  function renderList(){
    listEl.innerHTML=currentList().map((p,i)=>`<button type="button" data-index="${i}" class="${i===state.selected?'active':''}"><strong>${p.number||'—'} · ${p.shortTitle||p.title||'Untitled'}</strong><small>${p.slug||'no-slug'}</small></button>`).join('');
    listEl.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.selected=Number(b.dataset.index);save();render();});
  }
  function fillForm(){
    const p=current();if(!p){form.reset();return;}
    [...form.elements].forEach(el=>{if(!el.name)return;const v=p[el.name];el.value=el.name==='images'?(v||[]).join('\n'):(v??'');});
    const prefix=state.lang==='de'?'../de/project/?p=':'../project/?p=';
    preview.href=prefix+encodeURIComponent(p.slug||'');
  }
  async function imageSrc(name){
    const local=await dbGet(name);
    if(local?.blob){const u=URL.createObjectURL(local.blob);objectUrls.push(u);return {src:u,local:true};}
    return {src:'../assets/images/'+encodeURIComponent(name).replace(/%2F/g,'/'),local:false};
  }
  async function renderMedia(){
    objectUrls.forEach(URL.revokeObjectURL);objectUrls=[];
    const p=current();if(!p){mediaPreview.innerHTML='';return;}
    const names=[...new Set((p.images||[]).filter(Boolean))];
    mediaPreview.innerHTML='';
    if(!names.length){mediaPreview.innerHTML='<div class="empty-media">No project photos yet. Drop the first images above.</div>';}
    for(const name of names){
      const {src,local}=await imageSrc(name);
      const card=document.createElement('article');card.className='media-card';
      card.innerHTML=`<div class="media-thumb"><img src="${src}" alt=""><span class="asset-state ${local?'local':''}">${local?'local upload':'live asset'}</span></div><div class="media-card-body"><strong title="${name}">${name}</strong><div class="media-badges">${p.cover===name?'<span>Cover</span>':''}${p.plan===name?'<span>Plan</span>':''}</div><div class="media-actions"><button type="button" data-act="cover">Set cover</button><button type="button" data-act="plan">Set plan</button><button type="button" data-act="remove" class="danger-link">Remove</button></div></div>`;
      card.querySelector('[data-act="cover"]').onclick=()=>setMediaRole(name,'cover');
      card.querySelector('[data-act="plan"]').onclick=()=>setMediaRole(name,'plan');
      card.querySelector('[data-act="remove"]').onclick=()=>removeMedia(name);
      mediaPreview.appendChild(card);
    }
    const all=await dbAll();pendingCount.textContent=all.length?`${all.length} locally stored image file${all.length===1?'':'s'} ready for publishing`:'No locally stored image files';
  }
  async function renderSiteMedia(){
    const profile=siteSettings.profileFilename;
    if(profile){
      const localProfile=await dbGet(profile);
      profilePanel.hidden=false;profileName.textContent=profile;
      if(localProfile?.blob){
        const u=URL.createObjectURL(localProfile.blob);objectUrls.push(u);profilePreview.src=u;profileState.textContent='Local CMS upload · used on Home + Profile in this browser';
      }else{
        profilePreview.src='../assets/images/'+encodeURIComponent(profile);profileState.textContent='Published portrait · used on Home + Profile';
      }
    }else{
      profilePanel.hidden=true;profilePreview.removeAttribute('src');profileName.textContent='';
    }

    const name=siteSettings.videoFilename;
    if(!name){videoPanel.hidden=true;videoPreview.removeAttribute('src');videoName.textContent='';return;}
    const local=await dbGet(name);
    videoPanel.hidden=false;videoName.textContent=name;
    if(local?.blob){
      const url=URL.createObjectURL(local.blob);objectUrls.push(url);videoPreview.src=url;videoState.textContent='Local CMS upload · previewing now';
    }else{
      videoPreview.src='../assets/media/'+encodeURIComponent(name);videoState.textContent='Published filename · file must exist in assets/media/';
    }
  }
  async function render(){
    document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===state.lang));
    if(state.selected>=currentList().length)state.selected=Math.max(0,currentList().length-1);
    renderList();fillForm();await renderMedia();await renderSiteMedia();
  }

  function writeForm(){
    const p=current();if(!p)return;
    const oldSlug=p.slug;const fd=new FormData(form);
    for(const [k,v] of fd.entries()){p[k]=k==='images'?String(v).split(/\r?\n/).map(x=>x.trim()).filter(Boolean):String(v).trim();}
    if(!p.plan)p.plan=null;
    syncShared(p,oldSlug);save();renderList();
    const prefix=state.lang==='de'?'../de/project/?p=':'../project/?p=';
    preview.href=prefix+encodeURIComponent(p.slug||'');
    renderMedia();
  }
  form.addEventListener('input',writeForm);

  async function addFiles(fileList){
    const p=current();if(!p)return;
    const files=[...fileList].filter(f=>/^image\/(jpeg|png|webp)$/i.test(f.type));
    if(!files.length)return;
    for(const file of files)await dbPut(file);
    p.images=p.images||[];
    for(const file of files)if(!p.images.includes(file.name))p.images.push(file.name);
    const placeholder=!p.cover||p.cover==='cover.webp'||!p.images.includes(p.cover);
    if(placeholder&&files[0])p.cover=files[0].name;
    syncShared(p);save();fillForm();await renderMedia();
  }
  function setMediaRole(name,role){
    const p=current();if(!p)return;p[role]=name;
    if(!p.images.includes(name))p.images.push(name);
    syncShared(p);save();fillForm();renderMedia();
  }
  async function removeMedia(name){
    const p=current();if(!p)return;
    p.images=(p.images||[]).filter(x=>x!==name);
    if(p.cover===name)p.cover=p.images[0]||'';
    if(p.plan===name)p.plan=null;
    syncShared(p);save();fillForm();await renderMedia();
  }

  ['dragenter','dragover'].forEach(evt=>galleryDrop.addEventListener(evt,e=>{e.preventDefault();galleryDrop.classList.add('dragging');}));
  ['dragleave','drop'].forEach(evt=>galleryDrop.addEventListener(evt,e=>{e.preventDefault();galleryDrop.classList.remove('dragging');}));
  galleryDrop.addEventListener('drop',e=>addFiles(e.dataTransfer.files));
  galleryDrop.addEventListener('click',e=>{if(e.target.closest('button'))return;galleryFiles.click();});
  galleryDrop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();galleryFiles.click();}});
  document.getElementById('choose-gallery').onclick=e=>{e.stopPropagation();galleryFiles.click();};
  galleryFiles.onchange=async()=>{await addFiles(galleryFiles.files);galleryFiles.value='';};

  document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{const slug=current()?.slug;state.lang=b.dataset.lang;if(slug){const i=currentList().findIndex(p=>p.slug===slug);state.selected=i>=0?i:Math.min(state.selected,currentList().length-1);}save();render();});

  document.getElementById('new-project').onclick=()=>{
    const n=Math.max(state.en.length,state.de.length)+1;const num=String(n).padStart(2,'0');const slug=`new-project-${num}`;
    const shell={slug,number:num,title:'New Project',shortTitle:'New Project',category:'Interior Design',location:'Location on request',clientType:'',role:'',scope:'',status:'Selected Work',cover:'',plan:null,images:[],quote:'',description:''};
    state.en.push(clone(shell));state.de.push({...clone(shell),title:'Neues Projekt',shortTitle:'Neues Projekt',location:'Ort auf Anfrage',status:'Ausgewählte Arbeit'});
    state.selected=currentList().findIndex(p=>p.slug===slug);save();render();
    setTimeout(()=>galleryDrop.scrollIntoView({behavior:'smooth',block:'center'}),100);
  };

  document.getElementById('duplicate-project').onclick=()=>{const p=current();if(!p)return;const slug=p.slug;const newSlug=slug+'-copy';for(const lang of ['en','de']){const idx=state[lang].findIndex(x=>x.slug===slug);const source=idx>=0?state[lang][idx]:p;const copy=clone(source);copy.slug=newSlug;copy.number=String(Math.max(state.en.length,state.de.length)+1).padStart(2,'0');state[lang].splice(Math.max(0,idx)+1,0,copy);}state.selected=currentList().findIndex(x=>x.slug===newSlug);save();render();};

  document.getElementById('delete-project').onclick=()=>{const p=current();if(!p||!confirm('Delete this project in EN and DE?'))return;const slug=p.slug;state.en=state.en.filter(x=>x.slug!==slug);state.de=state.de.filter(x=>x.slug!==slug);state.selected=Math.max(0,state.selected-1);save();render();};

  function move(direction){const p=current();if(!p)return;const slug=p.slug;for(const lang of ['en','de']){const a=state[lang];const i=a.findIndex(x=>x.slug===slug);const j=i+direction;if(i<0||j<0||j>=a.length)continue;[a[i],a[j]]=[a[j],a[i]];}state.selected=currentList().findIndex(x=>x.slug===slug);save();render();}
  document.getElementById('move-up').onclick=()=>move(-1);document.getElementById('move-down').onclick=()=>move(1);
  document.getElementById('reset-local').onclick=()=>{if(!confirm('Discard all local editor changes and reload the live project data?'))return;state.en=clone(originals.en);state.de=clone(originals.de);state.selected=0;save();render();};

  async function addProfile(files){
    const file=[...files].find(f=>/^image\/(png|jpeg|webp)$/i.test(f.type));if(!file)return;
    await dbPut(file);siteSettings.profileFilename=file.name;saveSiteSettings();await renderSiteMedia();
  }
  ['dragenter','dragover'].forEach(evt=>profileDrop.addEventListener(evt,e=>{e.preventDefault();profileDrop.classList.add('dragging');}));
  ['dragleave','drop'].forEach(evt=>profileDrop.addEventListener(evt,e=>{e.preventDefault();profileDrop.classList.remove('dragging');}));
  profileDrop.addEventListener('drop',e=>addProfile(e.dataTransfer.files));
  profileDrop.addEventListener('click',e=>{if(e.target.closest('button'))return;profileFile.click();});
  profileDrop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();profileFile.click();}});
  document.getElementById('choose-profile').onclick=e=>{e.stopPropagation();profileFile.click();};
  profileFile.onchange=async()=>{await addProfile(profileFile.files);profileFile.value='';};
  document.getElementById('download-profile').onclick=async()=>{
    const name=siteSettings.profileFilename;if(!name)return;const item=await dbGet(name);
    if(!item?.blob){alert('This portrait is not stored locally in this browser.');return;}
    const url=URL.createObjectURL(item.blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  };
  document.getElementById('remove-profile').onclick=async()=>{
    const name=siteSettings.profileFilename;if(name)await dbDelete(name);
    siteSettings.profileFilename=publicSiteSettings.profileFilename||'daniel-stofner-profile-clean.jpg';
    saveSiteSettings();await renderSiteMedia();
  };

  async function addVideo(files){
    const file=[...files].find(f=>f.type==='video/mp4'||/\.mp4$/i.test(f.name));if(!file)return;
    await dbPut(file);siteSettings.videoFilename=file.name;saveSiteSettings();await renderSiteMedia();
  }
  ['dragenter','dragover'].forEach(evt=>videoDrop.addEventListener(evt,e=>{e.preventDefault();videoDrop.classList.add('dragging');}));
  ['dragleave','drop'].forEach(evt=>videoDrop.addEventListener(evt,e=>{e.preventDefault();videoDrop.classList.remove('dragging');}));
  videoDrop.addEventListener('drop',e=>addVideo(e.dataTransfer.files));
  videoDrop.addEventListener('click',e=>{if(e.target.closest('button'))return;videoFile.click();});
  videoDrop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();videoFile.click();}});
  document.getElementById('choose-video').onclick=e=>{e.stopPropagation();videoFile.click();};
  videoFile.onchange=async()=>{await addVideo(videoFile.files);videoFile.value='';};
  document.getElementById('download-video').onclick=async()=>{
    const name=siteSettings.videoFilename;if(!name)return;const item=await dbGet(name);
    if(!item?.blob){alert('This video is not stored locally in this browser.');return;}
    const url=URL.createObjectURL(item.blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  };
  document.getElementById('download-settings').onclick=()=>{
    const body='window.OUSIA_SITE_SETTINGS = '+JSON.stringify({videoFilename:siteSettings.videoFilename||null,profileFilename:siteSettings.profileFilename||null},null,2)+';\n';
    const blob=new Blob([body],{type:'text/javascript;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='site-settings.js';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  document.getElementById('remove-video').onclick=async()=>{
    const name=siteSettings.videoFilename;if(name)await dbDelete(name);siteSettings.videoFilename=null;saveSiteSettings();await renderSiteMedia();
  };

  document.getElementById('download-pending').onclick=async()=>{
    const files=await dbAll();
    if(!files.length){alert('No locally stored images to download.');return;}
    for(const item of files){const url=URL.createObjectURL(item.blob);const a=document.createElement('a');a.href=url;a.download=item.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);await new Promise(r=>setTimeout(r,180));}
  };

  document.getElementById('download-data').onclick=()=>{const isDe=state.lang==='de';const varName=isDe?'window.OUSIA_PROJECTS_DE':'window.OUSIA_PROJECTS';const filename=isDe?'projects-data-de.js':'projects-data.js';const body=`${varName} = ${JSON.stringify(currentList(),null,2)};\n`;const blob=new Blob([body],{type:'text/javascript;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  render();
})();