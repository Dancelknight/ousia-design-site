/* Shared product schema, browser drafts and lossless publish archive. No credentials. */
(()=>{
 const KEY='ousia-shop-draft';
 const clone=v=>JSON.parse(JSON.stringify(v));
 const fileOK=n=>typeof n==='string'&&/^shop-[a-z0-9-]+\.(png|webp|jpg)$/.test(n);
 function validate(d){
  if(!d||d.version!==1||!Array.isArray(d.categories)||!Array.isArray(d.products))throw Error('Ungültige Shop-Daten.');
  const ids=new Set();for(const c of d.categories){if(!/^[a-z0-9-]+$/.test(c.id)||ids.has(c.id)||!c.de?.trim()||!c.en?.trim())throw Error('Kategorien benötigen eindeutige IDs und Namen in DE/EN.');ids.add(c.id);}
  const pids=new Set();for(const p of d.products){if(!/^[a-z0-9-]+$/.test(p.id)||pids.has(p.id)||!ids.has(p.category)||!['draft','preview'].includes(p.status))throw Error('Ungültiges Produkt oder Kategorie.');pids.add(p.id);if(!Array.isArray(p.images)||p.images.some(n=>!fileOK(n)))throw Error('Ungültige Bilddatei.');for(const k of ['name','description','material','dimensions'])if(!p[k]||typeof p[k].de!=='string'||typeof p[k].en!=='string')throw Error('DE/EN-Produkttexte fehlen.');if(p.status==='preview'&&(!p.name.de.trim()||!p.name.en.trim()||!p.images.length))throw Error('Für die öffentliche Vorschau braucht ein Produkt Namen in DE/EN und mindestens ein Bild.');}
  return d;
 }
 function read(){const raw=localStorage.getItem(KEY);return raw?validate(JSON.parse(raw)):clone(window.OUSIA_SHOP);}
 function save(data){validate(data);localStorage.setItem(KEY,JSON.stringify(data));}
 let db;
 function open(){return db||(db=new Promise((res,rej)=>{let q=indexedDB.open('ousia-content-assets',1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('files'))q.result.createObjectStore('files',{keyPath:'name'});};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);q.onblocked=()=>rej(Error('Bitte andere Manager-Tabs schliessen.'));}));}
 async function put(name,blob){const d=await open();return new Promise((res,rej)=>{const t=d.transaction('files','readwrite');t.objectStore('files').put({name,blob,type:blob.type});t.oncomplete=res;t.onerror=t.onabort=()=>rej(t.error||Error('Speicher voll.'));});}
 async function get(name){const d=await open();return new Promise((res,rej)=>{const q=d.transaction('files').objectStore('files').get(name);q.onsuccess=()=>res(q.result?.blob||null);q.onerror=()=>rej(q.error);});}
 async function source(name,local){if(!fileOK(name))return '';if(local){const b=await get(name);if(b)return URL.createObjectURL(b);}return '/assets/images/'+name;}
 const table=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
 function crc(a){let c=0xffffffff;for(const n of a)c=table[(c^n)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
 function zip(files){const out=[],central=[];let offset=0,cs=0;const enc=new TextEncoder();for(const f of files){const name=enc.encode(f.name),b=f.bytes,c=crc(b);const h=new Uint8Array(30),v=new DataView(h.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,c,true);v.setUint32(18,b.length,true);v.setUint32(22,b.length,true);v.setUint16(26,name.length,true);out.push(h,name,b);const ch=new Uint8Array(46),w=new DataView(ch.buffer);w.setUint32(0,0x02014b50,true);w.setUint16(4,20,true);w.setUint16(6,20,true);w.setUint16(8,0x800,true);w.setUint32(16,c,true);w.setUint32(20,b.length,true);w.setUint32(24,b.length,true);w.setUint16(28,name.length,true);w.setUint32(42,offset,true);central.push(ch,name);cs+=46+name.length;offset+=30+name.length+b.length;}const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,offset,true);return new Blob([...out,...central,end],{type:'application/zip'});}
 function publishData(data){validate(data);const p=clone(data);p.products=p.products.filter(x=>x.status==='preview').map(x=>{const {sku,shopifyProductId,...publicProduct}=x;return publicProduct;});return p;}
 function migrationData(data){validate(data);return {format:'fire-sea-portable-v1',exportedAt:new Date().toISOString(),commerce:{mode:'catalogue',checkoutEnabled:false,provider:null},catalogue:clone(data)};}
 function shopifyCSV(data,lang='de',origin='https://ousiadesign.ch'){
  validate(data);if(!['de','en'].includes(lang))throw Error('Unsupported language');
  const base=new URL(origin);if(base.protocol!=='https:')throw Error('Image origin must use HTTPS');
  const head=['Title','URL handle','Description','Vendor','Type','Tags','Published on online store','Status','Option1 name','Option1 value','SKU','Product image URL','Image position','Image alt text'];
  const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"',html=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rows=[head],handles=new Set();
  for(const p of data.products){const title=p.name[lang]||p.name.de||p.name.en;if(!title.trim())throw Error('Produktname fehlt.');const handle=p.handle||p.id;if(!/^[a-z0-9-]+$/.test(handle)||handles.has(handle))throw Error('Produkt-Handles müssen eindeutig sein.');handles.add(handle);
   const category=data.categories.find(c=>c.id===p.category);const desc=[p.description[lang],p.material[lang],p.dimensions[lang]].filter(Boolean).map(v=>'<p>'+html(v)+'</p>').join('');
   const images=p.images.length?p.images:[''];images.forEach((name,i)=>rows.push(i===0?[title,handle,desc,'Fire & Sea',category[lang],p.category,'false','draft','Title','Default Title',p.sku||'',name?new URL('/assets/images/'+name,base).href:'',name?1:'',title]:['',handle,'','','','','','','','','',new URL('/assets/images/'+name,base).href,i+1,title]));
  }return '\uFEFF'+rows.map(row=>row.map(quote).join(',')).join('\r\n')+'\r\n';
 }

 window.OusiaShop={KEY,clone,validate,read,save,put,get,source,zip,fileOK,publishData,migrationData,shopifyCSV};
})();
