/* Shared by the live homepage, local manager preview and static SEO build. */
(()=>{
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isPreview=typeof location!=='undefined'&&new URLSearchParams(location.search).get('preview')==='1';
  if(isPreview){
    try{
      const draft=JSON.parse(localStorage.getItem('ousia-content-manager')||'null');
      if(Array.isArray(draft?.en))window.OUSIA_PROJECTS=draft.en;
      if(Array.isArray(draft?.de))window.OUSIA_PROJECTS_DE=draft.de;
      const settings=JSON.parse(localStorage.getItem('ousia-site-settings')||'{}');
      window.OUSIA_SITE_SETTINGS={...window.OUSIA_SITE_SETTINGS,...settings};
    }catch{}
  }
  window.OUSIA_HOME={
    featured(projects,settings){
      return projects.find(p=>p.slug===settings.featuredProjectSlug&&p.cover)||null;
    },
    markup(project,de){
      if(!project)return '';
      const image=(de?'../':'')+'assets/images/'+project.cover;
      return `<a class="hero-project" href="project/?p=${encodeURIComponent(project.slug)}"><img src="${escape(image)}" alt="${escape(project.title)}" fetchpriority="high"><span>${de?'Im Fokus':'Featured project'} · ${escape(project.shortTitle||project.title)}${project.location?' · '+escape(project.location):''} · ${de?'Projekt ansehen':'View project'}</span></a>`;
    },
    render(projects,de){
      const slot=document.querySelector('[data-featured-project]');
      if(!slot)return projects;
      const featured=this.featured(projects,window.OUSIA_SITE_SETTINGS||{});
      slot.innerHTML=this.markup(featured,de);
      slot.hidden=!featured;
      document.querySelector('.hero-zurich')?.classList.toggle('without-featured',!featured);
      return featured?projects.filter(p=>p.slug!==featured.slug):projects;
    }
  };
})();
