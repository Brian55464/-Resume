'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const accessibilityMode=matchMedia('(prefers-reduced-motion: reduce), (max-height: 550px) and (orientation: landscape)');
let isCinematic=!accessibilityMode.matches;
document.documentElement.classList.toggle('has-story',isCinematic);
const tracks=$$('.scroll-scene');
const sections=$$('[data-chapter]');
const cold=$('.cold-sequence');
const phases=$$('.sequence-phase');
const drawings=$$('[data-drawing]');
const stops=$$('.rail-stop');
const stageNames=['採收與選別','清潔與分級','包裝與預冷','裝櫃與檢疫','跨海運輸','通路配送','賣場上架'];
const diagramDescriptions=[
 '採收與選別：掌握果實成熟度，減少碰撞，及時移至陰涼處。',
 '清潔與分級：輸送與清潔後依大小、外觀及品質分級。',
 '壓差預冷示意：冷卻氣流經過包裝通風空間，帶走熱量，並確認果心溫度。',
 '裝櫃與檢疫示意：作業銜接，注意氣流與檢疫要求，避免預冷後回溫。',
 '跨海運輸：冷藏貨櫃維持適溫，持續記錄時間與溫度，及時處理異常。',
 '通路配送：冷鏈車輛銜接倉儲，縮短等待時間並保留交接紀錄。',
 '賣場上架：陳列、庫存與品質追蹤接續管理，減少耗損。'
];
let currentStage=-1;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
function activate(container,index){
 const options=$$('.copy-phase',container);
 options.forEach((el,i)=>{el.classList.toggle('active',i===index);if(isCinematic)el.setAttribute('aria-hidden',String(i!==index));else el.removeAttribute('aria-hidden')});
}
function selectStage(index){
 if(index===currentStage)return;
 currentStage=index;
 $('#stage-number').textContent=String(index+1).padStart(2,'0');
 $('#stage-name').textContent=stageNames[index];
 $('#technical-title').textContent=diagramDescriptions[index];
 phases.forEach((el,i)=>{el.classList.toggle('active',i===index);if(isCinematic)el.setAttribute('aria-hidden',String(i!==index));else el.removeAttribute('aria-hidden')});
 drawings.forEach((el,i)=>el.classList.toggle('active',i===index));
 stops.forEach((el,i)=>{el.classList.toggle('active',i===index);el.classList.toggle('passed',i<index)});
}
function progress(el){const rect=el.getBoundingClientRect();return clamp(-rect.top/Math.max(1,el.offsetHeight-innerHeight))}
function visible(el){const r=el.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0}
let scheduled=false;
function renderStory(){
 const y=scrollY;
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 const percent=clamp(y/max)*100;
 $('#story-progress').style.width=percent+'%';
 $('#story-percent').textContent=String(Math.round(percent)).padStart(2,'0');
 let name='序幕';for(const el of sections){if(el.getBoundingClientRect().top<innerHeight*.5)name=el.dataset.chapter}
 $('#chapter-position').textContent=name;
 if(isCinematic){
  if(y<innerHeight*1.3){$('.opening').style.setProperty('--hero-y',`${(y*.16).toFixed(2)}px`);$('.opening-type').style.opacity=String(clamp(1-y/(innerHeight*.8)))}
  if(visible($('.field-scene'))){const r=$('.field-scene').getBoundingClientRect();$('.field-photo').style.transform=`translateY(${-r.top*.1}px) scale(1.12)`;$('.field-scene').style.setProperty('--field-inset',`${(clamp(r.top/innerHeight)*8).toFixed(2)}%`);$('.field-scene').style.setProperty('--field-travel',`${(-r.top*.2).toFixed(2)}px`)}
  tracks.forEach(el=>{
   if(!visible(el))return;
   const p=progress(el);el.style.setProperty('--p',p.toFixed(4));activate(el,p<.48?0:1);
   if(el.id==='voyage'){
    const t=.04+p*.92;
    const x=(1-t)*(1-t)*320+2*(1-t)*t*780+t*t*1140;
    const yy=(1-t)*(1-t)*660+2*(1-t)*t*820+t*t*200;
    $('#cargo-ship').setAttribute('transform',`translate(${x.toFixed(2)} ${yy.toFixed(2)}) scale(.75) rotate(${-5-p*15})`);
    $('#journey-line').style.strokeDashoffset=String(1-t);
   }
   if(el.id==='crisis')el.style.setProperty('--browning',clamp((p-.05)*1.5).toFixed(4));
  });
  if(visible(cold)){
   const p=progress(cold),stage=Math.min(6,Math.floor(p*7)),local=clamp(p*7-stage);
   cold.style.setProperty('--p',p.toFixed(4));cold.style.setProperty('--local-p',local.toFixed(4));cold.style.setProperty('--flow',`${(-local*160).toFixed(1)}`);selectStage(stage);
  }
  const turning=$('.turning-point');if(visible(turning))turning.style.setProperty('--turning-p',String(clamp((innerHeight-turning.getBoundingClientRect().top)/(innerHeight+turning.offsetHeight))));
  const future=$('.future-scene');if(visible(future)){const r=future.getBoundingClientRect();future.style.setProperty('--p',String(clamp((innerHeight-r.top)/(innerHeight+future.offsetHeight))))}
 }
 scheduled=false;
}
function requestRender(){if(!scheduled){scheduled=true;requestAnimationFrame(renderStory)}}
addEventListener('scroll',requestRender,{passive:true});addEventListener('resize',requestRender);
accessibilityMode.addEventListener('change',e=>{
 isCinematic=!e.matches;document.documentElement.classList.toggle('has-story',isCinematic);
 $$('.copy-phase,.sequence-phase').forEach(el=>el.removeAttribute('aria-hidden'));
 $('.opening-type').style.opacity='1';currentStage=-1;selectStage(0);requestRender();
});
if('IntersectionObserver' in window){
 const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');reveal.unobserve(e.target)}}),{threshold:.12});
 $$('.reveal').forEach(el=>reveal.observe(el));
}else $$('.reveal').forEach(el=>el.classList.add('visible'));
selectStage(0);renderStory();
const dialog=$('#video-dialog');let lastVideoButton;
$$('[data-video]').forEach(button=>button.addEventListener('click',()=>{
 lastVideoButton=button;$('#video-title').textContent=button.dataset.title;
 const iframe=document.createElement('iframe');iframe.src=`https://www.youtube-nocookie.com/embed/${button.dataset.video}`;iframe.title=button.dataset.title;
 iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';iframe.allowFullscreen=true;
 $('#video-container').replaceChildren(iframe);$('#external-video').href=`https://www.youtube.com/watch?v=${button.dataset.video}`;
 dialog.showModal();$('#close-video').focus();
}));
$('#close-video').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
dialog.addEventListener('close',()=>{$('#video-container').replaceChildren();lastVideoButton?.focus()});
const prelude=$('#prelude');
const mainStory=$('main');
const introMeter=$('#intro-meter');
let introRun=0;
let resourcesSettled=false;
let criticalCompleted=0;
const criticalUrls=['assets/pineapple-sculpture.webp','assets/hero.webp','assets/field.webp','assets/facility.webp'];
const criticalTotal=criticalUrls.length+1;
const criticalLoads=criticalUrls.map(url=>new Promise(resolve=>{
 const asset=new Image();
 const settle=()=>{criticalCompleted++;resolve()};
 asset.onload=()=>{if(asset.decode)asset.decode().catch(()=>{}).then(settle);else settle()};
 asset.onerror=settle;asset.src=url;
}));
criticalLoads.push((document.fonts?.load('700 24px "Odyssey Display"')||Promise.resolve()).catch(()=>{}).then(()=>{criticalCompleted++}));
Promise.allSettled(criticalLoads).then(()=>{resourcesSettled=true});
function beginIntro(replay=false){
 if(replay)scrollTo({top:0,behavior:'instant'});
 const run=++introRun;
 let finished=false,frame=0,lastValue=-1,lastLabel='';
 let seen=false;try{seen=sessionStorage.getItem('pineapple-prologue-v3')==='seen'}catch{}
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const duration=reducedMotion?0:(replay?2600:(seen?650:2600));
 const started=performance.now();
 if(!replay&&!document.documentElement.classList.contains('js-prelude')){
  document.documentElement.classList.add('story-ready');prelude.hidden=true;return;
 }
 clearTimeout(window.__introSafety);
 document.documentElement.classList.add('js-prelude');
 document.documentElement.classList.remove('story-ready');
 prelude.hidden=false;prelude.classList.remove('exiting');prelude.style.setProperty('--load','0');
 $('#intro-number').textContent='000';introMeter.setAttribute('aria-valuenow','0');
 $('#intro-context').textContent=replay?'REPLAYING THE PROLOGUE':'PREPARING THE JOURNEY';
 mainStory.inert=true;
 function finish(skip=false){
  if(finished||run!==introRun)return;finished=true;cancelAnimationFrame(frame);
  if(!skip){prelude.style.setProperty('--load','1');$('#intro-number').textContent='100';introMeter.setAttribute('aria-valuenow','100');$('#intro-stage').textContent='準備出航'}
  mainStory.inert=false;
  prelude.classList.add('exiting');
  if(!replay&&scrollY<10)requestRender();
  setTimeout(()=>document.documentElement.classList.add('story-ready'),reducedMotion?0:150);
  setTimeout(()=>{
   if(run!==introRun)return;
   prelude.hidden=true;document.documentElement.classList.remove('js-prelude');
   if(document.activeElement===$('#skip-intro')){$('#home').setAttribute('tabindex','-1');$('#home').focus({preventScroll:true})}
   try{sessionStorage.setItem('pineapple-prologue-v3','seen')}catch{}
  },reducedMotion?0:1120);
 }
 $('#skip-intro').onclick=()=>finish(true);
 function tick(now){
  if(run!==introRun||finished)return;
  const elapsed=now-started;
  const visual=duration===0?1:clamp(elapsed/duration);
  const available=resourcesSettled?1:criticalCompleted/criticalTotal;
  const done=elapsed>6200;
  const amount=done?1:Math.min(visual,available);
  prelude.style.setProperty('--load',amount.toFixed(4));
  const n=Math.floor(amount*100);
  if(n!==lastValue){lastValue=n;$('#intro-number').textContent=String(n).padStart(3,'0');introMeter.setAttribute('aria-valuenow',String(n))}
  const label=n<32?'建立輪廓':n<72?'光影顯影':n<100?'連結旅程':'準備出航';
  if(label!==lastLabel){$('#intro-stage').textContent=label;lastLabel=label}
  if(amount>=1){setTimeout(()=>finish(),reducedMotion?0:160);return}
  frame=requestAnimationFrame(tick);
 }
 frame=requestAnimationFrame(tick);
}
$('#replay-intro').addEventListener('click',()=>beginIntro(true));
beginIntro();
const finePointer=matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
const halo=$('.cursor-halo');
let pointerFrame=0,pointerX=0,pointerY=0;
addEventListener('pointermove',event=>{
 if(!finePointer.matches||!isCinematic)return;
 pointerX=event.clientX;pointerY=event.clientY;
 halo.classList.add('on');halo.classList.toggle('over-link',!!event.target.closest('a,button,summary'));
 if(pointerFrame)return;
 pointerFrame=requestAnimationFrame(()=>{
  halo.style.transform=`translate3d(${pointerX-17}px,${pointerY-17}px,0)`;
  if(scrollY<innerHeight){const x=(pointerX/innerWidth-.5),y=(pointerY/innerHeight-.5);const hero=$('.opening');hero.style.setProperty('--hero-ry',`${x*10}deg`);hero.style.setProperty('--hero-rx',`${-y*7}deg`);hero.style.setProperty('--hero-mx',`${x*12}px`);hero.style.setProperty('--hero-my',`${y*8}px`)}
  pointerFrame=0;
 });
},{passive:true});
document.addEventListener('pointerleave',()=>halo.classList.remove('on'));
