/**
 * SORTS — sous-modale
 * Extrait de V7_6.html lignes 3708-3828
 */
// ================================================================
// SORTS — sous-modale qui modifie _editMember.spells directement
// ================================================================
function renderSpellRow(sp, i){
  const sCol=SCHOOL_COLOR[sp.school]||"#a5b4fc";
  return `<div style="background:var(--surface);border:1px solid var(--border2);border-radius:8px;padding:10px 12px;margin-bottom:6px;display:flex;gap:10px;align-items:flex-start">
    <div style="flex-shrink:0;width:36px;height:36px;background:var(--surface2);border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid var(--border2)">
      ${sp.icon?`<img src="${sp.icon}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-size:18px">✨</span>`}
    </div>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px">
        <span style="font-weight:700;color:var(--text);font-size:13px">${esc(sp.name)}</span>
        <span style="background:${sCol}22;color:${sCol};padding:1px 6px;border-radius:3px;font-size:10px;font-weight:700">${sp.school}</span>
        <span style="background:var(--surface2);color:var(--muted);padding:1px 5px;border-radius:3px;font-size:10px">${sp.level}</span>
        ${sp.concentration?`<span style="color:#fbbf24;font-size:9px;font-weight:700;background:#fbbf2422;padding:1px 4px;border-radius:3px">C</span>`:''}
        ${sp.ritual?`<span style="color:#a78bfa;font-size:9px;font-weight:700;background:#a78bfa22;padding:1px 4px;border-radius:3px">R</span>`:''}
        <a href="https://www.aidedd.org/dnd/sorts.php?vf=${encodeURIComponent(sp.name.toLowerCase().replace(/ /g,'-'))}" target="_blank" style="color:var(--indigo);font-size:10px;text-decoration:none" title="Voir sur aidedd.org">🔗</a>
      </div>
      <div style="font-size:11px;color:var(--dim)">${[sp.castTime,sp.range,sp.duration].filter(Boolean).join(' · ')}</div>
    </div>
    <div style="display:flex;gap:4px;flex-shrink:0">
      <button class="btn btn-outline btn-xs" onclick="openSpellModal(${i})">✏️</button>
      <button class="btn btn-danger btn-xs" onclick="em_removeSpell(${i})">✕</button>
    </div>
  </div>`;
}

function refreshSpellList(){
  const el=document.getElementById('spell-list');
  if(!el) return;
  const spells=window._editMember?.spells||[];
  el.innerHTML=spells.map((sp,i)=>renderSpellRow(sp,i)).join('');
}

function em_removeSpell(i){
  if(!window._editMember) return;
  window._editMember.spells.splice(i,1);
  refreshSpellList();
}

function openSpellModal(spellIdx){
  const em=window._editMember;
  if(!em) return;
  const src=(spellIdx!==undefined&&spellIdx!==null)?em.spells[spellIdx]:null;
  const sp=src?JSON.parse(JSON.stringify(src)):{id:uid(),name:'',level:'Niveau 1',school:'Évocation',castTime:'1 action',range:'9 m',components:'V, S',duration:'Instantanée',concentration:false,ritual:false,description:'',icon:null};
  window._editSpell=sp; window._editSpellIdx=spellIdx;
  window._spellImgUpload=null;

  // IMPORTANT: on crée une deuxième modale par-dessus (overlay nested)
  const mc=document.getElementById('modal-container');
  const overlay=document.createElement('div');
  overlay.className='overlay'; overlay.id='spell-overlay';
  overlay.style.zIndex='600';
  overlay.innerHTML=`<div class="modal modal-wide" onclick="event.stopPropagation()" style="max-height:85vh;overflow:auto">
    <div class="modal-header">
      <span class="modal-title">${src?'✏️ Modifier':'✨ Nouveau Sort'}</span>
      <button class="modal-close" onclick="closeSpellModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="grid2">
        <div class="field"><label>Nom du sort</label><input value="${esc(sp.name)}" oninput="window._editSpell.name=this.value" placeholder="Boule de feu..."></div>
        <div class="field"><label>Niveau</label><select onchange="window._editSpell.level=this.value">${SPELL_LEVELS.map(l=>`<option${l===sp.level?' selected':''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label>École</label><select onchange="window._editSpell.school=this.value">${SPELL_SCHOOLS.map(l=>`<option${l===sp.school?' selected':''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label>Temps d'incantation</label><select onchange="window._editSpell.castTime=this.value">${CAST_TIMES.map(l=>`<option${l===sp.castTime?' selected':''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label>Portée</label><select onchange="window._editSpell.range=this.value">${RANGES.map(l=>`<option${l===sp.range?' selected':''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label>Durée</label><select onchange="window._editSpell.duration=this.value">${DURATIONS.map(l=>`<option${l===sp.duration?' selected':''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label>Composantes</label><input value="${esc(sp.components)}" oninput="window._editSpell.components=this.value" placeholder="V, S, M (poudre de soufre)"></div>
      </div>
      <div style="display:flex;gap:20px;margin-bottom:14px">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--muted)">
          <input type="checkbox" ${sp.concentration?'checked':''} onchange="window._editSpell.concentration=this.checked" style="width:16px;height:16px"> Concentration
        </label>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--muted)">
          <input type="checkbox" ${sp.ritual?'checked':''} onchange="window._editSpell.ritual=this.checked" style="width:16px;height:16px"> Rituel
        </label>
      </div>
      <div class="field"><label>Description / Effets</label><textarea rows="5" oninput="window._editSpell.description=this.value" placeholder="Effets, dégâts, jets de sauvegarde...">${esc(sp.description||'')}</textarea></div>
      <div class="field">
        <label>🖼️ Icône du sort</label>
        <label class="img-upload-btn" style="${sp.icon?'border-style:solid':''}">
          ${sp.icon?`<img src="${sp.icon}" style="max-height:60px;border-radius:4px">`:`<span style="font-size:24px">✨</span><span>Image optionnelle</span>`}
          <input type="file" accept="image/*" style="display:none" onchange="handleSpellIconUpload(this)">
        </label>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="closeSpellModal()">Annuler</button>
        <button class="btn btn-primary" onclick="saveSpell()">Sauvegarder le sort</button>
      </div>
    </div>
  </div>`;
  mc.appendChild(overlay);
}

function handleSpellIconUpload(input){
  if(!input.files[0]) return;
  readFile(input.files[0], data=>{
    window._spellImgUpload=data;
    window._editSpell.icon=data;
    const label=input.closest('label');
    label.style.borderStyle='solid';
    label.innerHTML=`<img src="${data}" style="max-height:60px;border-radius:4px"><input type="file" accept="image/*" style="display:none" onchange="handleSpellIconUpload(this)">`;
  });
}

function closeSpellModal(){
  document.getElementById('spell-overlay')?.remove();
}

function saveSpell(){
  const sp=window._editSpell;
  if(!sp||!sp.name.trim()){alert('Un nom est requis.');return;}
  const em=window._editMember;
  if(!em) return;
  if(!em.spells) em.spells=[];
  if(window._editSpellIdx!==undefined&&window._editSpellIdx!==null) em.spells[window._editSpellIdx]=sp;
  else em.spells.push(sp);
  closeSpellModal();
  // Juste rafraîchir la liste in-place, SANS relancer openMemberModal
  refreshSpellList();
}

