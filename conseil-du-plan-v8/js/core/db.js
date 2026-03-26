/**
 * STOCKAGE HYBRIDE — localStorage + IndexedDB
 * Extrait de V7_6.html lignes 883-1397
 */
// ================================================================
// STOCKAGE HYBRIDE : texte → localStorage | blobs → IndexedDB
// ================================================================
// DB en mémoire contient toujours les blobs (base64) pour l'affichage.
// save() = écrit le texte dans localStorage + les blobs dans IndexedDB.
// Les blobs sont des champs identifiés par leur clé : "m_av_<id>", "m_pdf_<id>",
// "bm_bg_<id>", "med_<id>".

const IDB_NAME  = 'cdp_blobs';
const IDB_STORE = 'blobs';
const IDB_VER   = 1;

let _idb = null; // handle IndexedDB ouvert

function openIDB(){
  return new Promise((res,rej)=>{
    if(_idb){ res(_idb); return; }
    const req = indexedDB.open(IDB_NAME, IDB_VER);
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    req.onsuccess = e => { _idb=e.target.result; res(_idb); };
    req.onerror   = e => { console.warn('IDB open error',e); rej(e); };
  });
}
function idbPut(key, value){
  return openIDB().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(IDB_STORE,'readwrite');
    tx.objectStore(IDB_STORE).put(value,key);
    tx.oncomplete=()=>res(); tx.onerror=e=>rej(e);
  })).catch(e=>console.warn('idbPut failed',key,e));
}
function idbGet(key){
  return openIDB().then(db=>new Promise((res,rej)=>{
    const req=db.transaction(IDB_STORE,'readonly').objectStore(IDB_STORE).get(key);
    req.onsuccess=e=>res(e.target.result||null);
    req.onerror=e=>rej(e);
  })).catch(()=>null);
}
function idbDelete(key){
  return openIDB().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(IDB_STORE,'readwrite');
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete=()=>res(); tx.onerror=e=>rej(e);
  })).catch(()=>{});
}
function idbGetAll(){
  return openIDB().then(db=>new Promise((res,rej)=>{
    const out={};
    const req=db.transaction(IDB_STORE,'readonly').objectStore(IDB_STORE).openCursor();
    req.onsuccess=e=>{ const c=e.target.result; if(c){out[c.key]=c.value;c.continue();}else res(out); };
    req.onerror=e=>rej(e);
  })).catch(()=>({}));
}

// Extrait les blobs de DB et retourne {text:DB_sans_blobs, blobs:{key:data}}
function _splitBlobs(db){
  const d = JSON.parse(JSON.stringify(db)); // deep clone
  const blobs = {};
  d.members.forEach(m=>{
    if(m.avatarImg){ blobs['m_av_'+m.id]=m.avatarImg; m.avatarImg='__blob__'; }
    if(m.pdf)      { blobs['m_pdf_'+m.id]=m.pdf;       m.pdf='__blob__'; }
  });
  (d.npcs||[]).forEach(n=>{
    if(n.avatarImg){ blobs['n_av_'+n.id]=n.avatarImg; n.avatarImg='__blob__'; }
  });
  (d.battlemaps||[]).forEach(b=>{
    if(b.bgImage){ blobs['bm_bg_'+b.id]=b.bgImage; b.bgImage='__blob__'; }
  });
  (d.media||[]).forEach(m=>{
    if(m.data){ blobs['med_'+m.id]=m.data; m.data='__blob__'; }
  });
  return {text:d, blobs};
}

// Réinjecte les blobs dans un objet DB texte
function _mergeBlobs(d, blobs){
  d.members.forEach(m=>{
    if(m.avatarImg==='__blob__') m.avatarImg=blobs['m_av_'+m.id]||null;
    if(m.pdf==='__blob__')       m.pdf=blobs['m_pdf_'+m.id]||null;
  });
  (d.npcs||[]).forEach(n=>{
    if(n.avatarImg==='__blob__') n.avatarImg=blobs['n_av_'+n.id]||null;
  });
  (d.battlemaps||[]).forEach(b=>{
    if(b.bgImage==='__blob__') b.bgImage=blobs['bm_bg_'+b.id]||null;
  });
  (d.media||[]).forEach(m=>{
    if(m.data==='__blob__') m.data=blobs['med_'+m.id]||null;
  });
  return d;
}

function migrateDB(parsed){
  if(parsed.members) parsed.members.forEach(m=>{
    if(!m.pdf) m.pdf=null; if(!m.pdfName) m.pdfName=null;
    if(!m.stats) m.stats={str:10,dex:10,con:10,int:10,wis:10,cha:10};
    if(!m.hp) m.hp={current:10,max:10};
    if(!m.ac) m.ac=10; if(!m.speed) m.speed="9m";
    if(!m.profBonus) m.profBonus=2; if(!m.initiative) m.initiative="+0";
    if(!m.extraFields) m.extraFields=[]; if(!m.weapons) m.weapons=[];
    if(!m.avatarImg) m.avatarImg=null; if(!m.inventory) m.inventory=[];
    if(!m.gold) m.gold={pp:0,po:0,pa:0,pc:0};
    if(m.isNpc===undefined) m.isNpc=false; if(!m.linkedNpcId) m.linkedNpcId=null;
    if(!m.spells) m.spells=[];
    m.spells=m.spells.map(sp=>typeof sp==='string'?{id:uid(),name:sp,level:"Niveau 1",school:"Évocation",castTime:"1 action",range:"9 m",components:"V, S",duration:"Instantanée",concentration:false,ritual:false,description:"",icon:null}:sp);
    m.spells.forEach(sp=>{ if(!sp.icon) sp.icon=null; });
    m.weapons.forEach(w=>{ if(!w.icon) w.icon=null; });
    m.inventory.forEach(i=>{ if(!i.icon) i.icon=null; });
    if(!m.kills)m.kills=[]; if(!m.saveProficiencies)m.saveProficiencies=[];
    if(!m.skillProficiencies)m.skillProficiencies=[]; if(!m.skillExpertise)m.skillExpertise=[];
    if(!m.equipment)m.equipment={}; if(!m.features)m.features=[];
    if(!m.specializations)m.specializations=[]; if(!m.languages)m.languages="";
    if(!m.armorProf)m.armorProf=""; if(!m.weaponProf)m.weaponProf=""; if(!m.toolProf)m.toolProf="";
    if(!m.bagCols)m.bagCols=8; if(!m.bagRows)m.bagRows=6;
    if(!m.bank) m.bank={pp:0,po:0,pa:0,pc:0};
    if(!m.pocket) m.pocket=[]; if(!m.pocketSize) m.pocketSize=6;
    if(!m.pocketName) m.pocketName='Sacoche';
    if(!m.resources) m.resources=[];
    if(!m.loreBackground) m.loreBackground=''; if(!m.lorePersonality) m.lorePersonality='';
    if(!m.loreBonds) m.loreBonds=''; if(!m.loreFlaws) m.loreFlaws=''; if(!m.loreDmSecrets) m.loreDmSecrets='';
  });
  if(parsed.npcs) parsed.npcs.forEach(n=>{
    if(!n.avatarImg)n.avatarImg=null;
    // V7.1: migrate single status string to statuses array
    if(!n.statuses){
      n.statuses = n.status ? [n.status] : ['vivant'];
      delete n.status;
    }
  });
  if(parsed.battlemaps) parsed.battlemaps.forEach(b=>{if(!b.bgImage)b.bgImage=null;b.tokens&&b.tokens.forEach(t=>{if(!t.size)t.size=1;if(t.hpCur===undefined)t.hpCur=0;if(t.hpMax===undefined)t.hpMax=0;if(!t.icon)t.icon='✨';})});
  if(!parsed.media) parsed.media=[];
  if(!parsed.bestiary) parsed.bestiary=[];
  if(parsed.factions) parsed.factions.forEach(function(f){if(f.bgImage===undefined)f.bgImage=null;});
  if(!parsed.merchants) parsed.merchants={};
  if(!parsed.merchantItems) parsed.merchantItems={};
  if(!parsed.planes) parsed.planes=[];
  if(!parsed.timelineGroups) parsed.timelineGroups=[];
  if(parsed.timeline) parsed.timeline.forEach(function(ev){if(!ev.image)ev.image=null;if(!ev.tlGroupId)ev.tlGroupId=null;});
  if(parsed.factions) parsed.factions.forEach(function(f){if(f.bgImage===undefined)f.bgImage=null;});
  if(!parsed.customPlanes) parsed.customPlanes=[];
  if(!parsed.wealth) parsed.wealth={pp:0,po:0,pa:0,pc:0,lingots:0,tresor:''};
  if(!parsed.market) parsed.market=[];
  if(!parsed.treasures) parsed.treasures=[];
  if(parsed.guildInventory) parsed.guildInventory.forEach(i=>{if(!i.icon)i.icon=null;if(!i.description)i.description='';});
  if(!parsed.investments) parsed.investments={capital:0,history:[],merchantStock:{}};
  if(parsed.journal) parsed.journal.forEach(j=>{ if(!j.participants)j.participants=[]; if(!j.authorId)j.authorId=null; });
  return parsed;
}

// Charge DB : texte depuis localStorage + blobs depuis IndexedDB
let DB = (() => {
  try {
    const s = localStorage.getItem(STORE_KEY);
    if(s) {
      const parsed = JSON.parse(s);
      // Les blobs seront chargés async après le boot via loadBlobsIntoDB()
      return migrateDB(parsed);
    }
  } catch(e){}
  return JSON.parse(JSON.stringify(DEFAULT));
})();

// Appelé après le boot pour réinjecter les blobs depuis IndexedDB
async function loadBlobsIntoDB(){
  try {
    const blobs = await idbGetAll();
    if(!blobs || Object.keys(blobs).length===0) return;
    _mergeBlobs(DB, blobs);
    // Rafraîchir l'affichage si nécessaire
    if(document.getElementById('member-detail')) renderMemberDetail();
    const mapCanvas=document.getElementById('map-canvas');
    if(mapCanvas) renderMapCanvas();
  } catch(e){ console.warn('loadBlobsIntoDB error',e); }
}

// save() : texte → localStorage | blobs → IndexedDB (async, non bloquant)

// ── BASE D'ITEMS : toggle et rendu des résultats ───────────────
function toggleItemDBPanel(){
  const panel = document.getElementById('item-db-panel');
  if(!panel) return;
  const visible = panel.style.display !== 'none';
  panel.style.display = visible ? 'none' : 'block';
  if(!visible) { renderItemDBResults(); }
}

// → Affiche les items de la DB correspondant à la recherche
function renderItemDBResults(){
  const q   = document.getElementById('item-db-search')?.value||'';
  const cat = document.getElementById('item-db-cat')?.value||'';
  const results = searchItemDatabase(q, cat).slice(0,40);
  const el = document.getElementById('item-db-results');
  if(!el) return;
  if(results.length===0){
    el.innerHTML='<div style="color:var(--dim);font-size:12px;grid-column:1/-1;padding:8px">Aucun résultat.</div>';
    return;
  }
  const rc_map = {'Commun':'#9ca3af','Peu commun':'#4ade80','Rare':'#60a5fa','Très rare':'#a78bfa','Légendaire':'#f59e0b','Artefact':'#f97316'};
  el.innerHTML = results.map(item=>{
    const rc = rc_map[item.rarity]||'#9ca3af';
    return `<div onclick="importItemFromDB(${JSON.stringify(item).replace(/"/g,'&quot;')})"
      style="background:var(--surface);border:1px solid ${rc}44;border-radius:7px;padding:7px;cursor:pointer;text-align:center;transition:border-color .15s"
      onmouseover="this.style.borderColor='${rc}'" onmouseout="this.style.borderColor='${rc}44'"
      title="${item.description}">
      <div style="font-size:18px;margin-bottom:3px">${item.emoji||CAT_ICON[item.category]||'📦'}</div>
      <div style="font-size:10px;font-weight:700;color:var(--text);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${item.name}</div>
      <div style="font-size:9px;color:${rc};margin-top:2px">${item.rarity}</div>
    </div>`;
  }).join('');
}

// → Remplit le formulaire de la modale avec les données de l'item importé
function importItemFromDB(itemData){
  const item = typeof itemData === 'string' ? JSON.parse(itemData) : itemData;
  window._editItem.name        = item.name;
  window._editItem.category    = item.category;
  window._editItem.rarity      = item.rarity;
  window._editItem.description = item.description;
  window._editItem.emoji       = item.emoji||'';
  window._editItem.size        = item.size||1;
  if(item.bagBonus!==undefined) window._editItem.bagBonus = item.bagBonus;
  // Refresh the form fields
  const modal = document.querySelector('.modal');
  if(modal){
    const nameInput = modal.querySelector('input[placeholder="Épée du Néant..."]');
    if(nameInput) nameInput.value = item.name;
  }
  // Hide the panel after import
  const panel = document.getElementById('item-db-panel');
  if(panel) panel.style.display='none';
  toast('📦 '+item.name+' importé !');
  // Full re-open to refresh form
  openInvModal(null, window._editItem.chestId||null);
  // Patch back the imported data since openInvModal resets the item
  setTimeout(()=>{
    const m2 = document.querySelector('.modal');
    if(!m2) return;
    const ni = m2.querySelector('input[placeholder="Épée du Néant..."]');
    if(ni){ ni.value=item.name; window._editItem.name=item.name; }
  }, 50);
}

// ── MISE À JOUR INLINE DES CHAMPS MEMBRE (V6) ─────────────────
// path : 'stats.str' | 'hp.current' | 'gold.po' | 'bank.po' | 'race' etc.
function updateMemberField(memberId, path, value){
  const m = DB.members.find(x=>x.id===memberId);
  if(!m) return;
  const parts = path.split('.');
  if(parts.length===1){
    m[parts[0]] = value;
  } else if(parts.length===2){
    if(!m[parts[0]]) m[parts[0]]={};
    m[parts[0]][parts[1]] = value;
  } else if(parts.length===3){
    if(!m[parts[0]]) m[parts[0]]={};
    if(!m[parts[0]][parts[1]]) m[parts[0]][parts[1]]={};
    m[parts[0]][parts[1]][parts[2]] = value;
  }
  save(); updateStats();
  // Re-render seulement les panneaux affectés pour éviter de perdre le focus
  // Pour les stats → recalcul des mods affiché via updateSummaryMods()
  _softRefreshSummary(memberId);
}

// → Refresh partiel du résumé sans perdre le focus sur un input actif
function _softRefreshSummary(memberId){
  const m = DB.members.find(x=>x.id===memberId);
  if(!m) return;
  const container = document.getElementById('summary-panels-'+memberId);
  if(!container) return;
  // Re-render complet du résumé seulement si aucun input n'est focused
  const active = document.activeElement;
  if(active && container.contains(active)) return; // ne pas interrompre la saisie
  const content = document.getElementById('member-detail-content');
  if(content && window._memberDetailTab===0) content.innerHTML = renderMemberSummary(m);
}

// → Toggle maîtrise d'un jet de sauvegarde
function toggleSaveProficiency(memberId, statKey){
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  if(!m.saveProficiencies) m.saveProficiencies=[];
  const idx=m.saveProficiencies.indexOf(statKey);
  if(idx>=0) m.saveProficiencies.splice(idx,1);
  else m.saveProficiencies.push(statKey);
  save();
  const content=document.getElementById('member-detail-content');
  if(content&&window._memberDetailTab===0) content.innerHTML=renderMemberSummary(m);
}

// → Toggle maîtrise d'une compétence (clic simple)
function toggleSkillProficiency(memberId, skillName){
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  if(!m.skillProficiencies) m.skillProficiencies=[];
  if(!m.skillExpertise) m.skillExpertise=[];
  // Si expertise → passe à rien
  const expIdx=m.skillExpertise.indexOf(skillName);
  if(expIdx>=0){ m.skillExpertise.splice(expIdx,1); save(); }
  else {
    const profIdx=m.skillProficiencies.indexOf(skillName);
    if(profIdx>=0) m.skillProficiencies.splice(profIdx,1);
    else m.skillProficiencies.push(skillName);
    save();
  }
  const content=document.getElementById('member-detail-content');
  if(content&&window._memberDetailTab===0) content.innerHTML=renderMemberSummary(m);
}

// → Toggle expertise d'une compétence (double-clic)
function toggleSkillExpertise(memberId, skillName){
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  if(!m.skillProficiencies) m.skillProficiencies=[];
  if(!m.skillExpertise) m.skillExpertise=[];
  const expIdx=m.skillExpertise.indexOf(skillName);
  if(expIdx>=0){ m.skillExpertise.splice(expIdx,1); }
  else {
    // S'assure que maîtrise est aussi là
    if(!m.skillProficiencies.includes(skillName)) m.skillProficiencies.push(skillName);
    m.skillExpertise.push(skillName);
  }
  save();
  const content=document.getElementById('member-detail-content');
  if(content&&window._memberDetailTab===0) content.innerHTML=renderMemberSummary(m);
}

// → Met à jour la valeur courante d'une ressource (+delta)
function updateResourceVal(memberId, resourceId, delta){
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  const r=(m.resources||[]).find(x=>x.id===resourceId); if(!r) return;
  r.current=Math.max(0,Math.min(r.max,r.current+delta));
  save();
  const content=document.getElementById('member-detail-content');
  if(content&&window._memberDetailTab===0) content.innerHTML=renderMemberSummary(m);
}

// → Set resource value directly (click-to-edit)
function setResourceVal(memberId, resourceId, val){
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  const r=(m.resources||[]).find(x=>x.id===resourceId); if(!r) return;
  r.current=Math.max(0,Math.min(r.max, val));
  save();
  const content=document.getElementById('member-detail-content');
  if(content&&window._memberDetailTab===0) content.innerHTML=renderMemberSummary(m);
}

// → Edit resource modal (name, max, icon, recharge, color)
function openEditResourceModal(memberId, resourceId){
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  const r=(m.resources||[]).find(x=>x.id===resourceId); if(!r) return;
  window._editResource=r; window._editResourceMid=memberId; window._editResourceIsEdit=true;
  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:380px">
    <div class="modal-header"><span class="modal-title">✏️ Modifier la ressource</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="grid2">
        <div class="field"><label>Nom</label>
          <input value="${esc(r.name)}" oninput="window._editResource.name=this.value"
            style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px"></div>
        <div class="field"><label>Icône</label>
          <input value="${r.icon||'⚡'}" oninput="window._editResource.icon=this.value"
            style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px;text-align:center;font-size:18px"></div>
        <div class="field"><label>Max</label>
          <input type="number" value="${r.max}" min="1" oninput="window._editResource.max=+this.value"
            style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px"></div>
        <div class="field"><label>Actuel</label>
          <input type="number" value="${r.current}" min="0" oninput="window._editResource.current=+this.value"
            style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px"></div>
        <div class="field"><label>Recharge</label>
          <select onchange="window._editResource.recharge=this.value"
            style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px">
            ${['repos court','repos long','manuel','quotidien'].map(o=>`<option${r.recharge===o?' selected':''}>${o}</option>`).join('')}
          </select></div>
        <div class="field"><label>Couleur</label>
          <input type="color" value="${r.color||'#6366f1'}" oninput="window._editResource.color=this.value"
            style="width:100%;height:38px;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;cursor:pointer"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="saveEditResource()">Sauvegarder</button>
    </div>
  </div>`);
}
function saveEditResource(){
  const r=window._editResource;
  if(!r||!r.name.trim()){toast('Nom requis');return;}
  r.current=Math.min(r.current,r.max);
  save(); closeModal(); renderMemberDetail(); toast('⚡ Ressource mise à jour');
}

// → Supprime une ressource
function removeResource(memberId, resourceId){
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  m.resources=(m.resources||[]).filter(r=>r.id!==resourceId);
  save();
  const content=document.getElementById('member-detail-content');
  if(content&&window._memberDetailTab===0) content.innerHTML=renderMemberSummary(m);
}

// → Ouvre la modale d'ajout de ressource
function openAddResourceModal(memberId){
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  const r={id:uid(),name:'',icon:'⚡',current:1,max:1,maxFormula:1,recharge:'repos long',color:'#6366f1'};
  window._editResource=r; window._editResourceMid=memberId;
  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:380px">
    <div class="modal-header"><span class="modal-title">⚡ Nouvelle ressource</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="grid2">
        <div class="field"><label>Nom</label>
          <input placeholder="Points de Ki…" oninput="window._editResource.name=this.value"
            style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px"></div>
        <div class="field"><label>Icône</label>
          <input value="⚡" oninput="window._editResource.icon=this.value"
            style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px;text-align:center;font-size:18px"></div>
        <div class="field"><label>Max</label>
          <input type="number" value="1" min="1" oninput="window._editResource.max=+this.value;window._editResource.current=+this.value"
            style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px"></div>
        <div class="field"><label>Recharge</label>
          <select onchange="window._editResource.recharge=this.value"
            style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px">
            <option>repos court</option><option>repos long</option><option>manuel</option><option>quotidien</option>
          </select></div>
        <div class="field"><label>Couleur</label>
          <input type="color" value="#6366f1" oninput="window._editResource.color=this.value"
            style="width:100%;height:38px;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;cursor:pointer"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="saveAddResource()">Ajouter</button>
    </div>
  </div>`);
}
function saveAddResource(){
  const r=window._editResource, mid=window._editResourceMid;
  if(!r.name.trim()){toast('Nom requis');return;}
  const m=DB.members.find(x=>x.id===mid); if(!m) return;
  if(!m.resources) m.resources=[];
  m.resources.push({...r});
  save(); closeModal();
  const content=document.getElementById('member-detail-content');
  if(content&&window._memberDetailTab===0) content.innerHTML=renderMemberSummary(m);
}

// ── LEGO : drag-and-drop des panneaux du résumé ────────────────
let _draggedPanel=null;
function panelDragStart(ev, panelId, memberId){
  _draggedPanel={panelId,memberId};
  ev.currentTarget.style.opacity='.4';
  ev.dataTransfer.effectAllowed='move';
}
function panelDrop(ev, col, memberId){
  ev.preventDefault();
  if(!_draggedPanel||_draggedPanel.memberId!==memberId) return;
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  const LEFT=['identity','stats','saves','skills','lore'];
  const RIGHT=['resources','purse','weapons','gear','npc'];
  // Move panel to dropped column
  const pid=_draggedPanel.panelId;
  let order=m.panelOrder&&m.panelOrder.length?[...m.panelOrder]:
    [...LEFT,...RIGHT];
  // Remove from current position, ensure it's in the order
  if(!order.includes(pid)) order.push(pid);
  order=order.filter(x=>x!==pid);
  // Add to target column at end
  const colPanels=col==='left'?LEFT:RIGHT;
  const lastOfCol=order.filter(x=>colPanels.includes(x)).slice(-1)[0];
  const insertAt=lastOfCol?order.indexOf(lastOfCol)+1:order.length;
  order.splice(insertAt,0,pid);
  m.panelOrder=order;
  _draggedPanel=null;
  save();
  const content=document.getElementById('member-detail-content');
  if(content&&window._memberDetailTab===0) content.innerHTML=renderMemberSummary(m);
}

// ── IMPRESSION / PDF ──────────────────────────────────────────
function printMemberSheet(memberId){
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  window._printMember=m;
  window.print();
}

function save(){
  const {text, blobs} = _splitBlobs(DB);
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(text)); }catch(e){
    console.error('localStorage save failed', e);
    toast('⚠️ Sauvegarde texte échouée — localStorage plein ?');
  }
  // Sauvegarder les blobs en IndexedDB (async)
  const validKeys = new Set(Object.keys(blobs).filter(k=>blobs[k]));
  Object.entries(blobs).forEach(([k,v])=>{ if(v) idbPut(k,v); });
  // Nettoyer les blobs orphelins
  idbGetAll().then(existing=>{
    Object.keys(existing).forEach(k=>{ if(!validKeys.has(k)) idbDelete(k); });
  }).catch(()=>{});
  updateStats();
}
function uid(){ return Date.now()+Math.floor(Math.random()*9999); }

function updateStats(){
  document.getElementById('stat-members').textContent = DB.members.length;
  // Richesse totale : guilde + banque guilde + membres + lingots + trésors
  const _w=DB.wealth||{};
  const _gb=DB.guildBank||{};
  const _poVal = g => (g?.po||0)+(g?.pp||0)*10+(g?.pa||0)*0.1+(g?.pc||0)*0.01;
  const _memberCoins = DB.members.reduce((s,m)=>s+_poVal(m.gold)+_poVal(m.bank||{}),0);
  const totalPO = Math.round(
    (_w.po||0)+(_w.pp||0)*10+(_w.pa||0)*0.1+(_w.pc||0)*0.01+
    (_gb.po||0)+(_gb.pp||0)*10+(_gb.pa||0)*0.1+(_gb.pc||0)*0.01+
    _memberCoins +
    (_w.lingots||0)*50 +
    (DB.treasures||[]).reduce((s,tr)=>s+(+(tr.value||0))*(tr.qty||1),0)
  )
  document.getElementById('stat-items').textContent = totalPO.toLocaleString();
  document.getElementById('stat-logs').textContent = DB.journal.length;
}

