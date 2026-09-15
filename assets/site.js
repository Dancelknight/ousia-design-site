const CONFIG={
  email:"CHANGE-ME@example.com",
  linkedin:"#",
  instagram:"#",
  videoSrc:""
};

document.querySelectorAll('[data-email]').forEach(a=>{a.textContent=CONFIG.email;a.href='mailto:'+CONFIG.email});
document.querySelectorAll('[data-linkedin]').forEach(a=>a.href=CONFIG.linkedin);
document.querySelectorAll('[data-instagram]').forEach(a=>a.href=CONFIG.instagram);

const btn=document.querySelector('.menu-btn'),panel=document.querySelector('.mobile-panel');
if(btn&&panel){btn.addEventListener('click',()=>panel.classList.toggle('open'));panel.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>panel.classList.remove('open')))}

const projects=window.OUSIA_PROJECTS||[];
const list=document.querySelector('[data-project-list]');
if(list){
  list.innerHTML=projects.map((p,i)=>`<a class="project-row" href="projects/${p.slug}/">
    <div class="project-image"><img src="assets/images/${p.cover}" alt="${p.title}" loading="${i>1?'lazy':'eager'}"></div>
    <div class="project-meta"><span class="number">${p.number}</span><div><div class="tags">${p.category}${p.location&&p.location!=='Italy'?' · '+p.location:''}</div><h3>${p.shortTitle||p.title}</h3><span class="text-link">View project</span></div></div>
  </a>`).join('');
}

const detail=document.querySelector('[data-project-detail]');
if(detail){
  const slug=document.body.dataset.projectSlug;
  const p=projects.find(x=>x.slug===slug);
  if(p){
    document.title=`${p.title} — Ousia Design`;
    detail.innerHTML=`
      <section class="page-hero project-hero"><span class="eyebrow">${p.category}</span><h1>${p.title}</h1><p>${p.description}</p></section>
      <section class="project-grid"><div class="visual"><img src="../../assets/images/${p.images[0]}" alt="${p.title}"></div><aside class="info"><blockquote class="quote">“${p.quote}”</blockquote><div class="facts">
        <div class="fact"><b>Project</b><span>${p.title}</span></div><div class="fact"><b>Location</b><span>${p.location}</span></div><div class="fact"><b>Client Type</b><span>${p.clientType}</span></div><div class="fact"><b>Role</b><span>${p.role}</span></div><div class="fact"><b>Scope</b><span>${p.scope}</span></div><div class="fact"><b>Status</b><span>${p.status}</span></div>
      </div></aside></section>
      <section class="gallery">${p.images.slice(1).map((img,idx)=>`<figure class="${idx===p.images.length-2&&p.images.length%2===0?'wide':''}"><img src="../../assets/images/${img}" alt="${p.title} — view ${idx+2}" loading="lazy"></figure>`).join('')}</section>
      ${nextProjectHTML(p)}
    `;
  } else { detail.innerHTML='<section class="page-hero"><h1>Project not found.</h1></section>'; }
}
function nextProjectHTML(p){
  const i=projects.findIndex(x=>x.slug===p.slug),n=projects[(i+1)%projects.length];
  return `<a class="next" href="../${n.slug}/"><div><small>Next project</small><h2>${n.shortTitle||n.title}</h2></div><span class="text-link">View</span></a>`;
}

const filmSection=document.querySelector('[data-film-section]'),film=document.querySelector('[data-film]');
if(filmSection&&film&&CONFIG.videoSrc){film.src=CONFIG.videoSrc;filmSection.hidden=false;}
