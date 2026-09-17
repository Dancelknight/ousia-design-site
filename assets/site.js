const CONFIG={
  email:"danielstofner@hotmail.com",
  linkedin:"#",
  instagram:"#",
  videoSrc:""
};

document.querySelectorAll('[data-email]').forEach(a=>{a.textContent=CONFIG.email;a.href='mailto:'+CONFIG.email});
document.querySelectorAll('[data-linkedin]').forEach(a=>a.href=CONFIG.linkedin);
document.querySelectorAll('[data-instagram]').forEach(a=>a.href=CONFIG.instagram);

const btn=document.querySelector('.menu-btn'),panel=document.querySelector('.mobile-panel');
const header=document.querySelector('.site-header'),navLang=document.querySelector('.nav .lang-switch');
if(header&&navLang&&!header.querySelector('.lang-quick')){const q=navLang.cloneNode(true);q.classList.add('lang-quick');header.insertBefore(q,btn||null);}
if(btn&&panel){btn.addEventListener('click',()=>panel.classList.toggle('open'));panel.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>panel.classList.remove('open')))}

const projects=window.OUSIA_PROJECTS||[];
document.querySelectorAll('[data-project-count]').forEach(el=>el.textContent=`${projects.length} project${projects.length===1?'':'s'}`);

const list=document.querySelector('[data-project-list]');
if(list){
  list.innerHTML=projects.map((p,i)=>`<a class="project-row" href="project/?p=${encodeURIComponent(p.slug)}">
    <div class="project-image"><img src="assets/images/${p.cover}" alt="${p.title}" loading="${i>1?'lazy':'eager'}"></div>
    <div class="project-meta"><span class="number">Project ${p.number}</span><div class="project-copy"><div class="tags">${p.category}${p.location&&p.location!=='Italy'?' · '+p.location:''}</div><h3>${p.shortTitle||p.title}</h3><span class="text-link">View project</span></div></div>
  </a>`).join('');
}

const detail=document.querySelector('[data-project-detail]');
if(detail){
  const querySlug=new URLSearchParams(location.search).get('p');
  const slug=querySlug||document.body.dataset.projectSlug;
  const p=projects.find(x=>x.slug===slug);
  const legacy=location.pathname.includes('/projects/');
  const imageBase=legacy?'../../assets/images/':'../assets/images/';
  if(p){
    document.title=`${p.title} — Ousia Design`;
    const galleryImages=(p.images||[]).filter(img=>img&&img!==p.plan);
    const first=galleryImages[0]||p.cover;
    const rest=galleryImages.slice(1);
    const planHTML=p.plan?`<section class="project-plan" data-header-theme="light"><div class="plan-heading"><span class="eyebrow">Plan / Drawing</span><h2>Spatial organization</h2></div><figure><img src="${imageBase}${p.plan}" alt="${p.title} — plan" loading="lazy"></figure></section>`:'';
    detail.innerHTML=`
      <section class="page-hero project-hero" data-header-theme="dark"><span class="eyebrow">${p.category}</span><h1>${p.title}</h1><p>${p.description}</p></section>
      <section class="project-grid" data-header-theme="light"><div class="visual"><img src="${imageBase}${first}" alt="${p.title}"></div><aside class="info"><blockquote class="quote">“${p.quote}”</blockquote><div class="facts">
        <div class="fact"><b>Project</b><span>${p.title}</span></div><div class="fact"><b>Location</b><span>${p.location}</span></div><div class="fact"><b>Client Type</b><span>${p.clientType}</span></div><div class="fact"><b>Role</b><span>${p.role}</span></div><div class="fact"><b>Scope</b><span>${p.scope}</span></div><div class="fact"><b>Status</b><span>${p.status}</span></div>
      </div></aside></section>
      ${planHTML}
      ${rest.length?`<section class="gallery" data-header-theme="light">${rest.map((img,idx)=>`<figure class="${idx===rest.length-1&&rest.length%2===1?'wide':''}"><img src="${imageBase}${img}" alt="${p.title} — view ${idx+2}" loading="lazy"></figure>`).join('')}</section>`:''}
      ${nextProjectHTML(p,legacy)}
    `;
  } else { detail.innerHTML='<section class="page-hero"><h1>Project not found.</h1></section>'; }
}
function nextProjectHTML(p,legacy=false){
  const i=projects.findIndex(x=>x.slug===p.slug),n=projects[(i+1)%projects.length];
  const href=legacy?`../../project/?p=${encodeURIComponent(n.slug)}`:`?p=${encodeURIComponent(n.slug)}`;
  return `<a class="next" href="${href}" data-header-theme="light"><div><small>Next project</small><h2>${n.shortTitle||n.title}</h2></div><span class="text-link">View</span></a>`;
}

const filmSection=document.querySelector('[data-film-section]'),film=document.querySelector('[data-film]');
if(filmSection&&film&&CONFIG.videoSrc){film.src=CONFIG.videoSrc;filmSection.hidden=false;}

const themedSections=[...document.querySelectorAll('[data-header-theme]')];
if(header&&themedSections.length){
  const setHeaderTheme=()=>{
    const y=(header.getBoundingClientRect().bottom+header.getBoundingClientRect().top)/2;
    let active=null;
    for(const s of themedSections){const r=s.getBoundingClientRect();if(r.top<=y&&r.bottom>=y){active=s;break;}}
    const dark=active?.dataset.headerTheme==='dark';
    header.classList.toggle('on-dark',dark);
    header.classList.toggle('on-light',!dark);
  };
  setHeaderTheme();window.addEventListener('scroll',setHeaderTheme,{passive:true});window.addEventListener('resize',setHeaderTheme);
}

/* Rebuild the clean portrait from verified repo chunks and replace every legacy portrait source. */
(async()=>{
  const imgs=[...document.querySelectorAll('img[src*="daniel-stofner-profile"]')];
  if(!imgs.length)return;
  try{
    const script=[...document.scripts].find(s=>/\/assets\/site\.js(?:\?|$)/.test(s.src));
    const assetsBase=script?new URL('./',script.src):new URL('/assets/',location.origin);
    const parts=await Promise.all(Array.from({length:8},(_,i)=>String(i).padStart(2,'0')).map(async n=>{
      const u=new URL(`portrait-web-v2/${n}.txt?v=20260917c`,assetsBase);const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw new Error(`portrait ${n}: ${r.status}`);return (await r.text()).replace(/\s+/g,'');
    }));
    const src='data:image/jpeg;base64,'+parts.join('');imgs.forEach(img=>{img.removeAttribute('srcset');img.src=src;img.style.imageRendering='auto';});
  }catch(err){console.error('Portrait load failed',err);}
})();
