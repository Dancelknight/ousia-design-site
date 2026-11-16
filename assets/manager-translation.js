window.OusiaTranslation={review(source,target,apply){
 const fields=['title','shortTitle','category','location','clientType','role','scope','status','quote','description'];
 const d=document.createElement('dialog');d.style.cssText='width:min(850px,92vw);max-height:88vh;overflow:auto;padding:24px;background:#f4f1eb;color:#222';
 d.innerHTML='<h2>Deutsch → Englisch · Übersetzung prüfen</h2><p>Die Übersetzung läuft lokal auf diesem Gerät. Prüfe Eigennamen und Fachbegriffe. Erst „Auswahl übernehmen“ ersetzt englische Texte im lokalen Entwurf.</p><p role="status"></p><div class="translation-rows"></div><button type="button">Übersetzung erstellen</button> <button type="button" disabled>Auswahl übernehmen</button> <button type="button">Abbrechen</button>';
 const [start,accept,cancel]=d.querySelectorAll('button'),status=d.querySelector('[role=status]'),rows=d.querySelector('.translation-rows');let session,closed=false,controls=[];
 document.body.append(d);cancel.onclick=()=>d.close();d.onclose=()=>{closed=true;session?.destroy();d.remove();};
 if(!('Translator' in window)){start.disabled=true;status.textContent='Dieser Browser unterstützt keine automatische Übersetzung. Bitte aktuelles Chrome am Computer verwenden. Lokale Entwürfe werden nicht automatisch zwischen Geräten übertragen.';}
 start.onclick=async()=>{start.disabled=true;status.textContent='Sprachmodell vorbereiten … Beim ersten Mal ist ein Download erforderlich.';
 try{session=await Translator.create({sourceLanguage:'de',targetLanguage:'en',monitor(m){m.addEventListener('downloadprogress',e=>status.textContent='Sprachmodell laden: '+Math.round(e.loaded*100)+' %');}});
 if(closed){session.destroy();return;}
 for(const key of fields){if(!source[key]?.trim())continue;status.textContent='Übersetze: '+key;const value=await session.translate(source[key]);if(closed)return;
 const box=document.createElement('section');box.style.cssText='padding:16px 0;border-top:1px solid #bbb';
 const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=true;label.append(check,document.createTextNode(' '+key+' übernehmen'));
 const original=document.createElement('p');original.textContent='DE: '+source[key];
 const before=document.createElement('p');before.textContent='Bisher EN: '+(target[key]||'—');
 const input=document.createElement('textarea');input.rows=4;input.style.cssText='width:100%;box-sizing:border-box';input.value=value;input.setAttribute('aria-label',key+' Englisch');
 box.append(label,original,before,input);rows.append(box);controls.push({key,check,input});
 }accept.disabled=!controls.length;status.textContent=controls.length?'Vorschlag fertig. Texte bearbeiten oder einzelne Felder abwählen.':'Keine deutschen Texte vorhanden.';
 }catch(e){if(!closed){status.textContent='Übersetzung fehlgeschlagen: '+e.message+'. Bisherige Texte bleiben unverändert.';start.disabled=false;rows.replaceChildren();controls=[];session?.destroy();session=null;}}};
 accept.onclick=()=>{const patch={};controls.filter(c=>c.check.checked).forEach(c=>patch[c.key]=c.input.value);if(!Object.keys(patch).length){status.textContent='Bitte ein Feld auswählen.';return;}try{apply(patch);d.close();}catch(e){status.textContent=e.message;}};
 d.showModal();
}};
