(()=>{
  const clone=v=>JSON.parse(JSON.stringify(v));
  const originals={en:clone(window.OUSIA_PROJECTS||[]),de:clone(window.OUSIA_PROJECTS_DE||[])};
  const saved=(()=>{try{return JSON.parse(localStorage.getItem('ousia-content-manager')||'null');}catch{return null;}})();
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
  const logoDrop=document.getElementById('logo-drop');
  const logoFile=document.getElementById('logo-file');
  const logoPanel=document.getElementById('logo-panel');
  const logoPreview=document.getElementById('logo-preview');
  const logoName=document.getElementById('logo-name');
  const logoState=document.getElementById('logo-state');
  const videoDrop=document.getElementById('video-drop');
  const videoFile=document.getElementById('video-file');
  const videoPanel=document.getElementById('video-panel');
  const videoPreview=document.getElementById('video-preview');
  const videoName=document.getElementById('video-name');
  const videoState=document.getElementById('video-state');
  const publicSiteSettings=window.OUSIA_SITE_SETTINGS||{};
  const siteSettings=(()=>{try{return JSON.parse(localStorage.getItem('ousia-site-settings')||'null')||{videoFilename:publicSiteSettings.videoFilename||null,profileFilename:publicSiteSettings.profileFilename||null,logoFilename:publicSiteSettings.logoFilename||null};}catch{return {videoFilename:publicSiteSettings.videoFilename||null,profileFilename:publicSiteSettings.profileFilename||null,logoFilename:publicSiteSettings.logoFilename||null};}})();
  if(siteSettings.videoFilename===undefined)siteSettings.videoFilename=publicSiteSettings.videoFilename||null;
  if(siteSettings.profileFilename===undefined)siteSettings.profileFilename=publicSiteSettings.profileFilename||null;
  if(siteSettings.logoFilename===undefined)siteSettings.logoFilename=publicSiteSettings.logoFilename||null;
  const saveSiteSettings=()=>localStorage.setItem('ousia-site-settings',JSON.stringify(siteSettings));
  if(siteSettings.featuredProjectSlug===undefined)siteSettings.featuredProjectSlug=publicSiteSettings.featuredProjectSlug||null;
  if(!/\.png$/i.test(siteSettings.profileFilename||''))siteSettings.profileFilename=publicSiteSettings.profileFilename;
  const featuredSelect=document.getElementById('featured-project');
  function renderFeatured(){
    featuredSelect.replaceChildren(new Option('None / Keines',''),...currentList().map(p=>new Option((p.shortTitle||p.title)+' · '+(p.location||''),p.slug)));
    featuredSelect.value=siteSettings.featuredProjectSlug||'';
    document.getElementById('featured-state').textContent='Local selection: '+(featuredSelect.selectedOptions[0]?.textContent||'None')+' · export settings to publish';
    document.getElementById('preview-home').href=(state.lang==='de'?'../de/':'../')+'?preview=1';
  }
  featuredSelect.onchange=()=>{siteSettings.featuredProjectSlug=featuredSelect.value||null;saveSiteSettings();renderFeatured();renderList();fillForm();};
  const panes=[...document.querySelectorAll('[data-manager-pane]')];
  const siteNav=document.getElementById('site-nav');
  function setManagerTab(tab){
    panes.forEach(p=>p.hidden=p.dataset.managerPane!==tab);
    siteNav.classList.toggle('active',tab==='site');
    document.getElementById('shop-nav').classList.toggle('active',tab==='shop');
    document.querySelectorAll('#project-list button').forEach((b,i)=>b.classList.toggle('active',tab==='projects'&&i===state.selected));
    localStorage.setItem('ousia-manager-tab',tab);
  }
  siteNav.onclick=()=>setManagerTab('site');
  document.getElementById('shop-nav').onclick=()=>setManagerTab('shop');
  const save=()=>localStorage.setItem('ousia-content-manager',JSON.stringify(state));
  const currentList=()=>state[state.lang];
  const otherLang=()=>state.lang==='en'?'de':'en';
  const current=()=>currentList()[state.selected]||null;
  const findOther=slug=>state[otherLang()].find(p=>p.slug===slug)||null;
  document.getElementById('translate-project').onclick=()=>{
 const slug=current()?.slug;if(!slug)return;
 const source=state.de.find(p=>p.slug===slug),target=state.en.find(p=>p.slug===slug);
 if(!source||!target){alert('Verbundene DE/EN-Projektdaten fehlen.');return;}
 const before=JSON.stringify([source,target]);
 window.OusiaTranslation.review(clone(source),clone(target),patch=>{
 const de=state.de.find(p=>p.slug===slug),en=state.en.find(p=>p.slug===slug);
 if(JSON.stringify([de,en])!==before)throw Error('Projekt wurde inzwischen geändert. Bitte Übersetzung neu öffnen.');
 const old=clone(en);Object.assign(en,patch);
 try{save();}catch(e){Object.assign(en,old);throw Error('Nicht gespeichert: '+e.message);}
 state.lang='en';state.selected=state.en.findIndex(p=>p.slug===slug);
 document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang==='en'));
 render();
 });
 };
  const sharedFields=new Set(['slug','number','cover','plan','images']);
  let objectUrls=[];
  let siteObjectUrls=[];
  let videoBusy=false;
  let selectedVideoUrl=null;
  let videoPersistence='';
  const videoFeedback=document.getElementById('video-feedback');
  const setVideoFeedback=message=>{videoFeedback.textContent=message;};

  const dbPromise=new Promise((resolve,reject)=>{
    let settled=false;
    const finish=(error,db)=>{if(settled){if(db)db.close();return;}settled=true;clearTimeout(timer);error?reject(error):resolve(db);};
    const timer=setTimeout(()=>finish(new Error('Browser storage did not open. Close other manager tabs and reload.')),15000);
    let req;
    try{req=indexedDB.open('ousia-content-assets',1);}catch(error){finish(error);return;}
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('files'))db.createObjectStore('files',{keyPath:'name'});};
    req.onsuccess=()=>finish(null,req.result);
    req.onerror=()=>finish(req.error||new Error('Browser storage is unavailable.'));
    req.onblocked=()=>finish(new Error('Browser storage is blocked. Close other manager tabs and reload.'));
  });
  dbPromise.catch(()=>{}); // Video selection remains usable even if storage cannot open.
  async function dbPut(file){
    const db=await dbPromise;
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('files','readwrite');
      const timer=setTimeout(()=>{try{tx.abort();}catch{}reject(new Error('Saving timed out. Try a smaller video from Files.'));},30000);
      tx.oncomplete=()=>{clearTimeout(timer);resolve();};
      tx.onerror=tx.onabort=()=>{clearTimeout(timer);reject(tx.error||new Error('Storage transaction aborted'));};
      try{tx.objectStore('files').put({name:file.name,type:file.type,lastModified:file.lastModified,blob:file});}
      catch(error){clearTimeout(timer);try{tx.abort();}catch{}reject(error);}
    });
  }
  async function dbGet(name){const db=await dbPromise;return new Promise((resolve,reject)=>{const req=db.transaction('files').objectStore('files').get(name);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});}
  async function dbAll(){const db=await dbPromise;return new Promise((resolve,reject)=>{const req=db.transaction('files').objectStore('files').getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);});}
  async function dbDelete(name){const db=await dbPromise;return new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').delete(name);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}

  function syncShared(p,oldSlug=p.slug){
    const counterpart=findOther(oldSlug)||state[otherLang()].find(x=>x.number===p.number);
    if(counterpart)for(const k of sharedFields)counterpart[k]=clone(p[k]);
  }

  function homePositions(){
    const projects=currentList();
    const featured=projects.find(p=>p.slug===siteSettings.featuredProjectSlug&&p.cover);
    const labels=new Map();let n=0;
    projects.forEach(p=>labels.set(p.slug,p===featured?(state.lang==='de'?'Im Fokus':'Featured'):String(++n).padStart(2,'0')));
    return {labels,featured};
  }
  function renderList(){
    const {labels,featured}=homePositions();
    const rows=currentList().map((p,i)=>({p,i}));
    if(featured)rows.sort((a,b)=>(b.p===featured)-(a.p===featured));
    listEl.replaceChildren();
    for(const {p,i} of rows){
      const button=document.createElement('button');button.type='button';button.dataset.index=i;button.className=i===state.selected?'active':'';
      const title=document.createElement('strong');title.textContent=labels.get(p.slug)+' · '+(p.shortTitle||p.title||'Untitled');
      const slug=document.createElement('small');slug.textContent=p.slug||'no-slug';button.append(title,slug);
      button.onclick=()=>{state.selected=i;save();localStorage.setItem('ousia-manager-tab','projects');render();};
      listEl.append(button);
    }
  }
  function fillForm(){
    const p=current();document.getElementById('homepage-number').value=p?(homePositions().labels.get(p.slug)||''):'';if(!p){form.reset();return;}
    [...form.elements].forEach(el=>{if(!el.name)return;const v=p[el.name];el.value=el.name==='images'?(v||[]).join('\n'):(v??'');});
    const prefix=state.lang==='de'?'../de/project/?p=':'../project/?p=';
    preview.href=prefix+encodeURIComponent(p.slug||'')+'&preview=1';
  }
  async function imageSrc(name){
    const local=await dbGet(name).catch(()=>null);
    if(local?.blob){const u=URL.createObjectURL(local.blob);objectUrls.push(u);return {src:u,local:true};}
    return {src:'../assets/images/'+encodeURIComponent(name).replace(/%2F/g,'/'),local:false};
  }
  function renderPublishedPlan(p){
    const host=document.getElementById('published-plan');host.replaceChildren();
    const live=originals[state.lang].find(x=>x.slug===p.slug);
    const heading=document.createElement('h3');heading.textContent='Plan auf der veröffentlichten Website';host.append(heading);
    const status=document.createElement('p');
    status.textContent=!live?'Dieses Projekt ist unter dieser Kennung noch nicht veröffentlicht.':!live.plan?'Für dieses veröffentlichte Projekt ist keine Planzeichnung hinterlegt.':live.plan===p.plan?'Diese Planzeichnung ist auch im lokalen Entwurf ausgewählt.':'Dein lokaler Entwurf weicht vom veröffentlichten Plan ab.';
    host.append(status);
    const link=document.getElementById('media-local-preview');link.href=(state.lang==='de'?'../de/project/?p=':'../project/?p=')+encodeURIComponent(p.slug)+'&preview=1';
    if(!live?.plan)return;
    const img=document.createElement('img');img.src='/assets/images/'+encodeURIComponent(live.plan);img.alt='Veröffentlichte Planzeichnung – '+live.title;img.style.cssText='display:block;width:100%;max-width:500px;max-height:360px;object-fit:contain;background:#fff';
    const filename=document.createElement('p');filename.textContent=live.plan;
    const use=document.createElement('button');use.type='button';use.textContent='Veröffentlichten Plan in Entwurf übernehmen';use.onclick=()=>setMediaRole(live.plan,'plan');
    img.onerror=()=>{status.textContent='Die veröffentlichte Plan-Datei ist nicht erreichbar: '+live.plan;};
    host.append(img,filename,use);
  }
  let mediaGeneration=0;
  async function renderMedia(){
    const generation=++mediaGeneration;
    objectUrls.forEach(URL.revokeObjectURL);objectUrls=[];
    const p=current();if(!p){mediaPreview.innerHTML='';return;}
    renderPublishedPlan(p);
    const names=[...new Set([p.cover,...(p.images||[]),p.plan].filter(Boolean))];
    mediaPreview.innerHTML='';
    if(!names.length){mediaPreview.innerHTML='<div class="empty-media">No project photos yet. Drop the first images above.</div>';}
    for(const name of names){
      const {src,local}=await imageSrc(name);
      if(generation!==mediaGeneration)return;
      const card=document.createElement('article');card.className='media-card';
      card.innerHTML=`<div class="media-thumb"><img src="${src}" alt=""><span class="asset-state ${local?'local':''}">${local?'local upload':'live asset'}</span></div><div class="media-card-body"><strong title="${name}">${name}</strong><div class="media-badges">${p.cover===name?'<span>Cover</span>':''}${p.plan===name?'<span>Plan</span>':''}${p.cover!==name&&p.plan!==name?'<span>Galeriebild</span>':''}</div><div class="media-actions"><button type="button" data-act="cover">Set cover</button><button type="button" data-act="plan">Set plan</button><button type="button" data-act="gallery">Als Galeriebild</button><button type="button" data-act="remove" class="danger-link">Remove</button></div></div>`;
      card.querySelector('[data-act="cover"]').onclick=()=>setMediaRole(name,'cover');
      card.querySelector('[data-act="plan"]').onclick=()=>setMediaRole(name,'plan');
      card.querySelector('[data-act="gallery"]').onclick=()=>setMediaRole(name,'gallery');
      card.querySelector('img').onerror=()=>{const note=document.createElement('p');note.textContent='Bilddatei nicht erreichbar. Bitte diese Datei erneut hochladen: '+name;card.querySelector('.media-card-body').prepend(note);};
      card.querySelector('[data-act="remove"]').onclick=()=>removeMedia(name);
      mediaPreview.appendChild(card);
    }
    const all=await dbAll().catch(()=>[]);if(generation!==mediaGeneration)return;pendingCount.textContent=all.length?`${all.length} locally stored image file${all.length===1?'':'s'} ready for publishing`:'No locally stored image files';
  }
  async function renderSiteMedia(){
    siteObjectUrls.forEach(URL.revokeObjectURL);siteObjectUrls=[];
    const profile=siteSettings.profileFilename;
    if(profile){
      const localProfile=await dbGet(profile);
      profilePanel.hidden=false;profileName.textContent=profile;
      if(localProfile?.blob){
        const u=URL.createObjectURL(localProfile.blob);siteObjectUrls.push(u);profilePreview.src=u;profileState.textContent='Local CMS upload · used on Home + Profile in this browser';
      }else{
        profilePreview.src='../assets/images/'+encodeURIComponent(profile);profileState.textContent='Published portrait · used on Home + Profile';
      }
    }else{
      profilePanel.hidden=true;profilePreview.removeAttribute('src');profileName.textContent='';
    }

    const logo=siteSettings.logoFilename;
    if(logo){
      const localLogo=await dbGet(logo);
      logoPanel.hidden=false;logoName.textContent=logo;
      if(localLogo?.blob){
        const u=URL.createObjectURL(localLogo.blob);siteObjectUrls.push(u);logoPreview.src=u;logoState.textContent='Local CMS upload · keeps the animated O';
      }else{
        logoPreview.src='../assets/images/'+encodeURIComponent(logo);logoState.textContent='Published wordmark · animated O remains separate';
      }
    }else{
      logoPanel.hidden=true;logoPreview.removeAttribute('src');logoName.textContent='';
    }

    const name=siteSettings.videoFilename;
    if(!name){videoPanel.hidden=true;videoPreview.removeAttribute('src');videoName.textContent='';return;}
    const local=await dbGet(name);
    videoPanel.hidden=false;videoName.textContent=name;
    if(local?.blob){
      const url=URL.createObjectURL(local.blob);siteObjectUrls.push(url);videoPreview.src=url;videoState.textContent='Local CMS upload · previewing now';
    }else{
      videoPreview.src='../assets/media/'+encodeURIComponent(name);videoState.textContent='Published filename · file must exist in assets/media/';
    }
  }
  async function render(){
    document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===state.lang));
    if(state.selected>=currentList().length)state.selected=Math.max(0,currentList().length-1);
    renderFeatured();renderList();fillForm();setManagerTab(localStorage.getItem('ousia-manager-tab')||'projects');await renderMedia();await renderSiteMedia();
  }

  function writeForm(){
    const p=current();if(!p)return;
    const oldSlug=p.slug;const fd=new FormData(form);
    for(const [k,v] of fd.entries()){p[k]=k==='images'?String(v).split(/\r?\n/).map(x=>x.trim()).filter(Boolean):String(v).trim();}
    if(!p.plan)p.plan=null;
    if(siteSettings.featuredProjectSlug===oldSlug){siteSettings.featuredProjectSlug=p.slug;saveSiteSettings();}
    syncShared(p,oldSlug);save();renderList();renderFeatured();
    const prefix=state.lang==='de'?'../de/project/?p=':'../project/?p=';
    preview.href=prefix+encodeURIComponent(p.slug||'')+'&preview=1';
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
    const p=current();if(!p)return;
    p.images=p.images||[];
    if(!p.images.includes(name))p.images.push(name);
    if(role==='gallery'){
      if(p.plan===name)p.plan=null;
      if(p.cover===name){
        const replacement=p.images.find(n=>n!==name&&n!==p.plan);
        if(!replacement){alert('Dieses Bild ist das einzige verfügbare Hauptbild. Bitte zuerst ein weiteres Bild als Cover wählen.');return;}
        p.cover=replacement;
      }
    }else{
      p[role]=name;
      if(role==='cover'&&p.plan===name)p.plan=null;
      if(role==='plan'&&p.cover===name)p.cover=p.images.find(n=>n!==name)||'';
    }
    if(p.cover)p.images=[p.cover,...p.images.filter(n=>n!==p.cover)];
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
  for(const id of ['add-gallery-top','add-gallery-bottom'])document.getElementById(id).onclick=()=>galleryFiles.click();
  galleryFiles.onchange=async()=>{
    const files=[...galleryFiles.files];if(!files.length)return;
    const status=document.getElementById('gallery-upload-status');
    const supported=files.filter(f=>/^image\/(jpeg|png|webp)$/i.test(f.type));
    if(!supported.length){status.textContent='Kein unterstütztes Bild ausgewählt. Bitte JPG, PNG oder WebP verwenden.';galleryFiles.value='';return;}
    const controls=['add-gallery-top','add-gallery-bottom','choose-gallery'].map(id=>document.getElementById(id));
    controls.forEach(b=>b.disabled=true);status.textContent='Bilder werden lokal gespeichert …';
    try{await addFiles(files);status.textContent=supported.length+' Bild(er) im lokalen Entwurf hinzugefügt. Zum Prüfen „Entwurf mit neuen Bildern ansehen“ öffnen.'+(files.length>supported.length?' Nicht unterstützte Dateien wurden übersprungen.':'');}
    catch(e){status.textContent='Hinzufügen nicht vollständig abgeschlossen: '+e.message;}
    finally{galleryFiles.value='';controls.forEach(b=>b.disabled=false);}
  };

  document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{const slug=current()?.slug;state.lang=b.dataset.lang;if(slug){const i=currentList().findIndex(p=>p.slug===slug);state.selected=i>=0?i:Math.min(state.selected,currentList().length-1);}save();render();});

  document.getElementById('new-project').onclick=()=>{localStorage.setItem('ousia-manager-tab','projects');
    const n=Math.max(state.en.length,state.de.length)+1;const num=String(n).padStart(2,'0');const slug=`new-project-${num}`;
    const shell={slug,number:num,title:'New Project',shortTitle:'New Project',category:'Interior Design',location:'Location on request',clientType:'',role:'',scope:'',status:'Selected Work',cover:'',plan:null,images:[],quote:'',description:''};
    state.en.push(clone(shell));state.de.push({...clone(shell),title:'Neues Projekt',shortTitle:'Neues Projekt',location:'Ort auf Anfrage',status:'Ausgewählte Arbeit'});
    state.selected=currentList().findIndex(p=>p.slug===slug);save();render();
    setTimeout(()=>galleryDrop.scrollIntoView({behavior:'smooth',block:'center'}),100);
  };

  document.getElementById('duplicate-project').onclick=()=>{localStorage.setItem('ousia-manager-tab','projects');const p=current();if(!p)return;const slug=p.slug;const newSlug=slug+'-copy';for(const lang of ['en','de']){const idx=state[lang].findIndex(x=>x.slug===slug);const source=idx>=0?state[lang][idx]:p;const copy=clone(source);copy.slug=newSlug;copy.number=String(Math.max(state.en.length,state.de.length)+1).padStart(2,'0');state[lang].splice(Math.max(0,idx)+1,0,copy);}state.selected=currentList().findIndex(x=>x.slug===newSlug);save();render();};

  document.getElementById('delete-project').onclick=()=>{const p=current();if(!p||!confirm('Delete this project in EN and DE?'))return;const slug=p.slug;if(siteSettings.featuredProjectSlug===slug){siteSettings.featuredProjectSlug=null;saveSiteSettings();}state.en=state.en.filter(x=>x.slug!==slug);state.de=state.de.filter(x=>x.slug!==slug);state.selected=Math.max(0,state.selected-1);save();render();};

  function move(direction){const p=current();if(!p)return;const slug=p.slug;for(const lang of ['en','de']){const a=state[lang];const i=a.findIndex(x=>x.slug===slug);const j=i+direction;if(i<0||j<0||j>=a.length)continue;[a[i],a[j]]=[a[j],a[i]];}state.selected=currentList().findIndex(x=>x.slug===slug);save();render();}
  document.getElementById('move-up').onclick=()=>move(-1);document.getElementById('move-down').onclick=()=>move(1);
  document.getElementById('reset-local').onclick=()=>{if(!confirm('Discard all local editor changes and reload the live project data?'))return;state.en=clone(originals.en);state.de=clone(originals.de);state.selected=0;save();render();};

  async function addProfile(files){
    const file=[...files][0];if(!file)return;
    try{
      const signature=new Uint8Array(await file.slice(0,8).arrayBuffer());
      if(!/\.png$/i.test(file.name)||signature.join(',')!=='137,80,78,71,13,10,26,10')throw new Error('Please choose a transparent PNG, not JPEG or WebP.');
      const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);bitmap.close();
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let transparent=false;for(let i=3;i<pixels.length;i+=4){if(pixels[i]<255){transparent=true;break;}}
      if(!transparent)throw new Error('This PNG has no transparency. Please remove its background first.');
      await dbPut(file);siteSettings.profileFilename=file.name;saveSiteSettings();await renderSiteMedia();
    }catch(error){alert(error.message||'Portrait could not be saved.');}
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
    siteSettings.profileFilename=publicSiteSettings.profileFilename||'daniel-stofner-transparent.png';
    saveSiteSettings();await renderSiteMedia();
  };

  async function addLogo(files){
    const file=[...files].find(f=>['image/png','image/webp','image/svg+xml'].includes(f.type)||/\.(png|webp|svg)$/i.test(f.name));if(!file)return;
    await dbPut(file);siteSettings.logoFilename=file.name;saveSiteSettings();await renderSiteMedia();
  }
  ['dragenter','dragover'].forEach(evt=>logoDrop.addEventListener(evt,e=>{e.preventDefault();logoDrop.classList.add('dragging');}));
  ['dragleave','drop'].forEach(evt=>logoDrop.addEventListener(evt,e=>{e.preventDefault();logoDrop.classList.remove('dragging');}));
  logoDrop.addEventListener('drop',e=>addLogo(e.dataTransfer.files));
  logoDrop.addEventListener('click',e=>{if(e.target.closest('button'))return;logoFile.click();});
  logoDrop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();logoFile.click();}});
  document.getElementById('choose-logo').onclick=e=>{e.stopPropagation();logoFile.click();};
  logoFile.onchange=async()=>{await addLogo(logoFile.files);logoFile.value='';};
  document.getElementById('download-logo').onclick=async()=>{
    const name=siteSettings.logoFilename;if(!name)return;const item=await dbGet(name);
    if(!item?.blob){alert('This logo is not stored locally in this browser.');return;}
    const url=URL.createObjectURL(item.blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  };
  document.getElementById('remove-logo').onclick=async()=>{
    const name=siteSettings.logoFilename;if(name)await dbDelete(name);siteSettings.logoFilename=null;saveSiteSettings();await renderSiteMedia();
  };

  function isSupportedVideo(file){
    return /^(video\/(mp4|quicktime|x-m4v|webm))$/i.test(file.type)||/\.(mp4|mov|m4v|webm)$/i.test(file.name);
  }
  async function addVideo(files){
    if(videoBusy)return;
    const file=[...files][0];
    if(!file){setVideoFeedback('No file was received from the picker. If the movie is in iCloud, download it to Files first and select it there.');return;}
    if(!isSupportedVideo(file)){setVideoFeedback('Unsupported file: '+file.name+'. Choose MP4, MOV, M4V or WebM.');return;}
    if(!file.size){setVideoFeedback('The selected file is empty. Download it to Files first, then select it again.');return;}
    videoBusy=true;videoFile.disabled=true;videoDrop.setAttribute('aria-busy','true');
    const previous=siteSettings.videoFilename;
    videoPersistence='Saving on this device…';
    setVideoFeedback('File received: '+file.name+' ('+(file.size/1048576).toFixed(1)+' MB). '+videoPersistence);
    try{
      // Show the selected file immediately; do not wait for IndexedDB or other media.
      if(selectedVideoUrl)URL.revokeObjectURL(selectedVideoUrl);
      selectedVideoUrl=URL.createObjectURL(file);
      videoPanel.hidden=false;videoName.textContent=file.name;
      videoState.textContent='Loading preview…';
      videoPreview.src=selectedVideoUrl;videoPreview.load();
      await dbPut(file);
      siteSettings.videoFilename=file.name;
      try{saveSiteSettings();}catch(error){siteSettings.videoFilename=previous;throw error;}
      videoPersistence='Saved on this device. Not published yet.';
      setVideoFeedback(file.name+' — '+videoPersistence);
    }catch(error){
      videoPersistence='Not saved.';
      const reason=error?.name==='QuotaExceededError'?'Not enough browser storage. Try a smaller video.':(error?.message||'Browser storage is unavailable.');
      setVideoFeedback('File received, but not saved. '+reason+' The temporary preview may still work; keep the original file.');
    }finally{
      videoBusy=false;videoFile.disabled=false;videoDrop.removeAttribute('aria-busy');
    }
  }
  videoPreview.addEventListener('loadedmetadata',()=>{
    videoState.textContent='Preview ready · '+videoPreview.videoWidth+' × '+videoPreview.videoHeight;
  });
  videoPreview.addEventListener('error',()=>{
    videoState.textContent='Preview unavailable. This may be a codec or file-read problem. Try MP4 with H.264 video and AAC audio; renaming the extension will not convert it.';
  });
  ['dragenter','dragover'].forEach(evt=>videoDrop.addEventListener(evt,e=>{e.preventDefault();videoDrop.classList.add('dragging');}));
  ['dragleave','drop'].forEach(evt=>videoDrop.addEventListener(evt,e=>{e.preventDefault();videoDrop.classList.remove('dragging');}));
  videoDrop.addEventListener('drop',e=>addVideo(e.dataTransfer.files));
  // Use the browser's native file control. No synthetic click on a hidden input.
  videoFile.addEventListener('click',()=>setVideoFeedback('Choose a movie. Once the phone passes the file to this page, its name and size will appear here. If Photos stalls, save the movie to Files and choose it from there.'));
  videoFile.addEventListener('cancel',()=>setVideoFeedback('No new file selected. You can try again using Files.'));
  videoFile.onchange=async()=>{try{await addVideo(videoFile.files);}finally{videoFile.value='';}};
  document.getElementById('download-video').onclick=async()=>{
    const name=siteSettings.videoFilename;if(!name)return;const item=await dbGet(name);
    if(!item?.blob){alert('This video is not stored locally in this browser.');return;}
    const url=URL.createObjectURL(item.blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  };
  document.getElementById('download-settings').onclick=()=>{
    const body='window.OUSIA_SITE_SETTINGS = '+JSON.stringify({featuredProjectSlug:siteSettings.featuredProjectSlug||null,videoFilename:siteSettings.videoFilename||null,profileFilename:siteSettings.profileFilename||null,logoFilename:siteSettings.logoFilename||null},null,2)+';\n';
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
  render().catch(error=>{setManagerTab('site');setVideoFeedback('Browser storage could not be loaded. You can still select a video to preview it. '+(error?.message||''));});
})();
