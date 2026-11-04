const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
for(const de of [false,true]){
  const slot={innerHTML:'',hidden:false},hero={classList:{toggle(){}}};
  const w={},ctx={window:w,document:{querySelector:s=>s==='[data-featured-project]'?slot:hero}};
  for(const file of ['assets/site-settings.js','assets/projects-data'+(de?'-de':'')+'.js','assets/home-projects.js'])vm.runInNewContext(read(file),ctx);
  const projects=w[de?'OUSIA_PROJECTS_DE':'OUSIA_PROJECTS'];
  for(const slug of [projects[0].slug,'private-residence-bolzano',null,'missing']){
    w.OUSIA_SITE_SETTINGS.featuredProjectSlug=slug;
    const selected=projects.find(p=>p.slug===slug),list=w.OUSIA_HOME.render(projects,de);
    assert.equal(list.length,projects.length-(selected?1:0));
    assert.equal(slot.hidden,!selected);
    if(selected){assert(!list.some(p=>p.slug===slug));assert(slot.innerHTML.includes(encodeURIComponent(slug)));assert(slot.innerHTML.includes(de?'Im Fokus':'Featured project'));}
  }
  const html=read(de?'de/index.html':'index.html');
  const list=html.match(/<section class="projects" data-project-list>([\s\S]*?)<\/section>/)[1];
  assert(!list.includes('private-residence-bolzano'));
  assert.equal((html.match(/class="hero-project"/g)||[]).length,1);
  assert(html.includes('daniel-stofner-transparent.png'));
}
const preview={window:{},location:{search:'?preview=1'},URLSearchParams,localStorage:{getItem:k=>JSON.stringify(k==='ousia-content-manager'?{en:[{slug:'draft'}],de:[]}:{featuredProjectSlug:null})}};
vm.runInNewContext(read('assets/home-projects.js'),preview);
assert.equal(preview.window.OUSIA_PROJECTS[0].slug,'draft');assert.equal(preview.window.OUSIA_SITE_SETTINGS.featuredProjectSlug,null);
console.log('PASS: EN/DE featured selection, no duplicates, none, missing, static HTML and local preview');

// Public numbering follows visible order, not stored project IDs.
for(const de of [false,true]){
  const w={},slot={innerHTML:''},list={innerHTML:''};
  const document={scripts:[],querySelector:s=>s==='link[data-project-ui]'?{}:s==='[data-featured-project]'?slot:s==='[data-project-list]'?list:null,querySelectorAll:()=>[]};
  const ctx={window:w,document,location:{search:'',pathname:de?'/de/':'/'},URLSearchParams};
  for(const file of ['assets/projects-data'+(de?'-de':'')+'.js','assets/home-projects.js'])vm.runInNewContext(read(file),ctx);
  const projects=w[de?'OUSIA_PROJECTS_DE':'OUSIA_PROJECTS'];
  projects.forEach(p=>p.number='99');
  for(const slug of [projects[0].slug,projects[4].slug,null,'missing']){
    w.OUSIA_SITE_SETTINGS={featuredProjectSlug:slug};
    vm.runInNewContext(read('assets/site'+(de?'-de':'')+'.js'),{...ctx});
    const numbers=[...list.innerHTML.matchAll(/class="number">(?:Project|Projekt) (\d+)/g)].map(m=>m[1]);
    assert.equal(numbers.length,projects.length-(projects.some(p=>p.slug===slug)?1:0));
    assert.deepEqual(numbers,numbers.map((_,i)=>String(i+1).padStart(2,'0')));
  }
  const numbers=[...read(de?'de/index.html':'index.html').matchAll(/class="number">(?:Project|Projekt) (\d+)/g)].map(m=>m[1]);
  assert.deepEqual(numbers,numbers.map((_,i)=>String(i+1).padStart(2,'0')));
}
console.log('PASS: sequential EN/DE numbering with featured changes, missing featured and stale IDs; static HTML matches');
