(()=>{
  const clone=v=>JSON.parse(JSON.stringify(v));
  const originals={en:clone(window.OUSIA_PROJECTS||[]),de:clone(window.OUSIA_PROJECTS_DE||[])};
  const saved=JSON.parse(localStorage.getItem('ousia-content-manager')||'null');
  const state=saved||{en:clone(originals.en),de:clone(originals.de),lang:'en',selected:0};
  if(!state.en)state.en=clone(originals.en);if(!state.de)state.de=clone(originals.de);if(!state.lang)state.lang='en';if(state.selected==null)state.selected=0;

  const listEl=document.getElementById('project-list');const form=document.getElementById('project-form');const preview=document.getElementById('preview-project');
  const save=()=>localStorage.setItem('ousia-content-manager',JSON.stringify(state));
  const currentList=()=>state[state.lang];const otherLang=()=>state.lang==='en'?'de':'en';const current=()=>currentList()[state.selected]||null;
  const findOther=(slug)=>state[otherLang()].find(p=>p.slug===slug)||null;
  const sharedFields=new Set(['slug','number','cover','plan','images']);

  function renderList(){listEl.innerHTML=currentList().map((p,i)=>`<button type="button" data-index="${i}" class="${i===state.selected?'active':''}"><strong>${p.number||'—'} · ${p.shortTitle||p.title||'Untitled'}</strong><small>${p.slug||'no-slug'}</small></button>`).join('');listEl.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.selected=Number(b.dataset.index);save();render();});}
  function fillForm(){const p=current();if(!p){form.reset();return;}[...form.elements].forEach(el=>{if(!el.name)return;const v=p[el.name];el.value=el.name==='images'?(v||[]).join('\n'):(v??'');});const prefix=state.lang==='de'?'../de/project/?p=':'../project/?p=';preview.href=prefix+encodeURIComponent(p.slug||'');}
  function render(){document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===state.lang));if(state.selected>=currentList().length)state.selected=Math.max(0,currentList().length-1);renderList();fillForm();}

  function writeForm(){
    const p=current();if(!p)return;const oldSlug=p.slug;const fd=new FormData(form);
    for(const [k,v] of fd.entries()){p[k]=k==='images'?String(v).split(/\r?\n/).map(x=>x.trim()).filter(Boolean):String(v).trim();}
    if(!p.plan)p.plan=null;
    const counterpart=findOther(oldSlug)||state[otherLang()].find(x=>x.number===p.number);
    if(counterpart){for(const k of sharedFields)counterpart[k]=clone(p[k]);}
    save();renderList();const prefix=state.lang==='de'?'../de/project/?p=':'../project/?p=';preview.href=prefix+encodeURIComponent(p.slug||'');
  }
  form.addEventListener('input',writeForm);
  document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{const slug=current()?.slug;state.lang=b.dataset.lang;if(slug){const i=currentList().findIndex(p=>p.slug===slug);state.selected=i>=0?i:Math.min(state.selected,currentList().length-1);}save();render();});

  document.getElementById('new-project').onclick=()=>{const n=Math.max(state.en.length,state.de.length)+1;const num=String(n).padStart(2,'0');const slug=`new-project-${num}`;const shell={slug,number:num,title:'New Project',shortTitle:'New Project',category:'Interior Design',location:'Location on request',clientType:'',role:'',scope:'',status:'Selected Work',cover:'cover.webp',plan:null,images:['cover.webp'],quote:'',description:''};state.en.push(clone(shell));state.de.push({...clone(shell),title:'Neues Projekt',shortTitle:'Neues Projekt',location:'Ort auf Anfrage',status:'Ausgewählte Arbeit'});state.selected=currentList().findIndex(p=>p.slug===slug);save();render();};

  document.getElementById('duplicate-project').onclick=()=>{const p=current();if(!p)return;const slug=p.slug;const newSlug=slug+'-copy';for(const lang of ['en','de']){const idx=state[lang].findIndex(x=>x.slug===slug);const source=idx>=0?state[lang][idx]:p;const copy=clone(source);copy.slug=newSlug;copy.number=String(Math.max(state.en.length,state.de.length)+1).padStart(2,'0');state[lang].splice(Math.max(0,idx)+1,0,copy);}state.selected=currentList().findIndex(x=>x.slug===newSlug);save();render();};

  document.getElementById('delete-project').onclick=()=>{const p=current();if(!p||!confirm('Delete this project in EN and DE?'))return;const slug=p.slug;state.en=state.en.filter(x=>x.slug!==slug);state.de=state.de.filter(x=>x.slug!==slug);state.selected=Math.max(0,state.selected-1);save();render();};

  function move(direction){const p=current();if(!p)return;const slug=p.slug;for(const lang of ['en','de']){const a=state[lang];const i=a.findIndex(x=>x.slug===slug);const j=i+direction;if(i<0||j<0||j>=a.length)continue;[a[i],a[j]]=[a[j],a[i]];}state.selected=currentList().findIndex(x=>x.slug===slug);save();render();}
  document.getElementById('move-up').onclick=()=>move(-1);document.getElementById('move-down').onclick=()=>move(1);
  document.getElementById('reset-local').onclick=()=>{if(!confirm('Discard all local editor changes and reload the live project data?'))return;state.en=clone(originals.en);state.de=clone(originals.de);state.selected=0;save();render();};

  document.getElementById('download-data').onclick=()=>{const isDe=state.lang==='de';const varName=isDe?'window.OUSIA_PROJECTS_DE':'window.OUSIA_PROJECTS';const filename=isDe?'projects-data-de.js':'projects-data.js';const body=`${varName} = ${JSON.stringify(currentList(),null,2)};\n`;const blob=new Blob([body],{type:'text/javascript;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  render();
})();
