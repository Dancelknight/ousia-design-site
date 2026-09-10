const CONFIG={email:"CHANGE-ME@example.com",linkedin:"#",instagram:"#"};
document.querySelectorAll('[data-email]').forEach(a=>{a.textContent=CONFIG.email;a.href='mailto:'+CONFIG.email});
document.querySelectorAll('[data-linkedin]').forEach(a=>a.href=CONFIG.linkedin);
document.querySelectorAll('[data-instagram]').forEach(a=>a.href=CONFIG.instagram);
const btn=document.querySelector('.menu-btn'),panel=document.querySelector('.mobile-panel');
if(btn&&panel){btn.addEventListener('click',()=>panel.classList.toggle('open'));panel.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>panel.classList.remove('open')))}
