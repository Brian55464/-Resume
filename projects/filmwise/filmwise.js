(() => {
 'use strict';
 try{if(localStorage.getItem('bozhang-motion')==='reduced')document.documentElement.classList.add('no-motion')}catch{}
 const input=document.getElementById('ev-input'),iso=document.getElementById('iso-select'),value=document.getElementById('ev-value'),results=document.getElementById('exposure-results'),note=document.getElementById('exposure-note');
 function formatShutter(seconds){if(seconds>=1)return Number(seconds.toFixed(1))+' 秒';return '1/'+Math.round(1/seconds)+' 秒'}
 function update(){const ev=Number(input.value),sensitivity=Number(iso.value);value.value=ev.toFixed(1);results.replaceChildren();let slow=false;for(const aperture of [2.8,4,5.6]){const seconds=aperture*aperture/(2**ev*(sensitivity/100));slow=slow||seconds>1/60;const row=document.createElement('div');row.className='exposure-row';const f=document.createElement('span'),s=document.createElement('span');f.textContent='f/'+aperture.toFixed(1);s.textContent=formatShutter(seconds);row.append(f,s);results.append(row)}note.textContent=slow?'部分組合快門較慢，請留意手持晃動或主體移動。以上為公式近似值，請以相機實際刻度為準。':'以上為公式近似值，請以相機實際可用的光圈與快門刻度為準。';document.querySelector('.sim-scene img').style.filter='brightness('+Math.max(.35,Math.min(1.3,.55+(ev-3)*.06))+')'}
 input.addEventListener('input',update);iso.addEventListener('change',update);update();
})();
