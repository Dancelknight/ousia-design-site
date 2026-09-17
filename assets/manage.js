(()=>{
  const clone=v=>JSON.parse(JSON.stringify(v));
  const originals={en:clone(window.OUSIA_PROJECTS||[]),de:clone(window.OUSIA_PROJECTS_DE||[])};
  const saved=JSON.parse(localStorage.getItem('ousia-content-manager')||'null');
  const state=saved||{en:clone(originals.en),de:clone(originals.de),lang:'en',selected:0};
  if(!state.en)state.en=clone(originals.en);if(!state.de)state.de=clone(originals.de);if(!state.lang)state.lang='en';if(state.selected==null)state.selected=0;

  const listEl=document.getElementById('project-list');const form=document.getElementById('project-form');const preview=document.getElementById('preview-project');
  const save=()=>localStorage.setItem('ousia-content-manager',JSON.stringify(state));
  const currentList=()=>state[state.lang];
  const current=()=>currentList()[state.selected]||null;

  function renderList(){
    listEl.innerHTML=currentList().map((p,i)=>`<button type="button" data-index="${i}" class="${i===state.selected?'active':''}"><strong>${p.number||'—'} · ${p.shortTitle||p.title||'Untitled'}</strong><small>${p.slug||'no-slug'}</small></button>`).join('');
    listEl.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.selected=Number(b.dataset.index);save();render();});
  }
  function fillForm(){
    const p=current();if(!p){form.reset();return;}
    [...form.elements].forEach(el=>{if(!el.name)return;const v=p[el.name];el.value=el.name==='images'?(v||[]).join('\n'):(v??'');});
    const prefix=state.lang==='de'?'../de/project/?p=':'../project/?p=';preview.href=prefix+encodeURIComponent(p.slug||'');
  }
  function render(){
    document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===state.lang));
    if(state.selected>=currentList().length)state.selected=Math.max(0,currentList().length-1);
    renderList();fillForm();
  }
  function writeForm(){
    const p=current();if(!p)return;
    const fd=new FormData(form);for(const [k,v] of fd.entries()){p[k]=k==='images'?String(v).split(/\r?\n/).map(x=>x.trim()).filter(Boolean):String(v).trim();}
    if(!p.plan)p.plan=null;save();renderList();const prefix=state.lang==='de'?'../de/project/?p=':'../project/?p=';preview.href=prefix+encodeURIComponent(p.slug||'');
  }
  form.addEventListener('input',writeForm);
  document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{state.lang=b.dataset.lang;state.selected=Math.min(state.selected,currentList().length-1);save();render();});

  document.getElementById('new-project').onclick=()=>{
    const n=Math.max(state.en.length,state.de.length)+1;const num=String(n).padStart(2,'0');const slug=`new-project-${num}`;
    const shell={slug,number:num,title:'New Project',shortTitle:'New Project',category:'Interior Design',location:'Location on request',clientType:'',role:'',scope:'',status:'Selected Work',cover:'cover.webp',plan:null,images:['cover.webp'],quote:'',description:''};
    state.en.push(clone(shell));state.de.push({...clone(shell),title:'Neues Projekt',shortTitle:'Neues Projekt',location:'Ort auf Anfrage',status:'Ausgewählte Arbeit'});state.selected=currentList().length-1;save();render();
  };
  document.getElementById('duplicate-project').onclick=()=>{
    const p=current();if(!p)return;const copy=clone(p);copy.slug=(p.slug||'project')+'-copy';copy.number=String(currentList().length+1).padStart(2,'0');currentList().splice(state.selected+1,0,copy);state.selected++;save();render();
  };
  document.getElementById('delete-project').onclick=()=>{if(!current()||!confirm('Delete this project in the current language?'))return;currentList().splice(state.selected,1);state.selected=Math.max(0,state.selected-1);save();render();};
  document.getElementById('move-up').onclick=()=>{if(state.selected<1)return;const a=currentList();[a[state.selected-1],a[state.selected]]=[a[state.selected],a[state.selected-1]];state.selected--;save();render();};
  document.getElementById('move-down').onclick=()=>{const a=currentList();if(state.selected>=a.length-1)return;[a[state.selected+1],a[state.selected]]=[a[state.selected],a[state.selected+1]];state.selected++;save();render();};
  document.getElementById('reset-local').onclick=()=>{if(!confirm('Discard all local editor changes and reload the live project data?'))return;state.en=clone(originals.en);state.de=clone(originals.de);state.selected=0;save();render();};

  document.getElementById('download-data').onclick=()=>{
    const isDe=state.lang==='de';const varName=isDe?'window.OUSIA_PROJECTS_DE':'window.OUSIA_PROJECTS';const filename=isDe?'projects-data-de.js':'projects-data.js';const body=`${varName} = ${JSON.stringify(currentList(),null,2)};\n`;const blob=new Blob([body],{type:'text/javascript;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  render();
})();
