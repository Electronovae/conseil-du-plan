/**
 * MODULE PNJ
 * Extrait de V7_6.html lignes 5397-5691
 */
// ================================================================
// MODULE PNJ
// ================================================================
let selectedNpcId = DB.npcs[0]?.id||null;

function renderNPCs(){
  const el=document.getElementById('module-npcs');
  el.innerHTML=`
  <div class="module-header">
    <span style="font-size:26px">🎭</span>
    <div><div class="module-title">Personnages Non-Joueurs</div><div class="module-bar"></div></div>
    <div style="flex:1"></div>
    <button class="btn btn-primary" onclick="openNpcModal()">+ Nouveau PNJ</button>
  </div>
  <div style="display:flex;gap:20px;min-height:70vh">
    <div style="width:240px;flex-shrink:0;display:flex;flex-direction:column;gap:6px;overflow-y:auto;max-height:80vh" id="npc-list"></div>
    <div style="flex:1;overflow-y:auto" id="npc-detail"></div>
  </div>`;
  renderNpcList();
  renderNpcDetail();
}

function renderNpcList(){
  const el=document.getElementById('npc-list');
  if(!el) return;
  const q = npcSearch.toLowerCase();
  let npcs = [...DB.npcs];
  if(npcStatusFilter) npcs = npcs.filter(n=>(n.statuses||['vivant']).includes(npcStatusFilter));
  if(q) npcs = npcs.filter(n=>n.name.toLowerCase().includes(q)||(n.role||'').toLowerCase().includes(q)||(n.race||'').toLowerCase().includes(q));
  if(npcSortBy==='name')     npcs.sort((a,b)=>a.name.localeCompare(b.name));
  else if(npcSortBy==='role') npcs.sort((a,b)=>(a.role||'').localeCompare(b.role||''));
  else if(npcSortBy==='race') npcs.sort((a,b)=>(a.race||'').localeCompare(b.race||''));

  const sortBtns = `<div style="display:flex;gap:3px;margin-bottom:6px;flex-wrap:wrap">
    ${[['default','🎭'],['name','A→Z'],['role','Rôle'],['race','Race']].map(([v,l])=>
      `<button onclick="npcSortBy='${v}';renderNpcList()" class="btn btn-xs ${npcSortBy===v?'btn-primary':'btn-ghost'}">${l}</button>`
    ).join('')}
  </div>
  <div style="margin-bottom:6px">
    <input placeholder="🔍 Rechercher..." value="${esc(npcSearch)}"
      oninput="npcSearch=this.value;renderNpcList()"
      style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;
        color:var(--text);padding:6px 10px;font-size:12px;box-sizing:border-box">
  </div>`;

  el.innerHTML = sortBtns + (npcs.length ? npcs.map(n=>{
    const sel=selectedNpcId===n.id;
    const sts=(n.statuses||['vivant']).map(k=>NPC_STATUSES[k]).filter(Boolean);
    return `<div onclick="selectedNpcId=${n.id};renderNpcList();renderNpcDetail()" style="
      background:${sel?'var(--selected)':'var(--surface)'};
      border:1px solid ${sel?'var(--indigo)':'var(--border)'};
      border-radius:8px;padding:10px 12px;cursor:pointer;display:flex;align-items:center;gap:10px;
      transition:border-color .15s">
      ${avatarEl(n,40)}
      <div style="flex:1;min-width:0">
        <div style="font-family:'Cinzel',serif;font-weight:600;font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(n.name)}</div>
        <div style="color:var(--dim);font-size:11px">${esc(n.role||'')}${n.race?' · '+esc(n.race):''}</div>
        <div style="display:flex;gap:3px;margin-top:3px;flex-wrap:wrap">${sts.map(s=>`<span style="font-size:9px;padding:1px 5px;background:${s.color}22;color:${s.color};border-radius:8px">${s.icon} ${s.label}</span>`).join('')}</div>
      </div>
    </div>`;
  }).join('') : `<div style="color:var(--dim);text-align:center;padding:20px;font-style:italic">Aucun PNJ trouvé</div>`);
}

function renderNpcDetail(){
  const el=document.getElementById('npc-detail');
  if(!el) return;
  const n=DB.npcs.find(x=>x.id===selectedNpcId);
  if(!n){el.innerHTML=`<div style="display:flex;align-items:center;justify-content:center;height:300px;color:var(--dim);font-style:italic">Sélectionnez un PNJ</div>`;return;}
  el.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:16px">
    <div class="card" style="display:flex;gap:20px;align-items:flex-start">
      ${avatarEl(n,80)}
      <div style="flex:1">
        <div style="font-family:'Cinzel',serif;font-weight:900;font-size:24px;color:var(--text);margin-bottom:4px">${esc(n.name)}</div>
        <div style="color:var(--indigo);font-size:14px;font-weight:600;margin-bottom:10px">${esc(n.role)}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span style="background:var(--surface2);color:var(--muted);padding:3px 10px;border-radius:4px;font-size:12px">👤 ${esc(n.race)}</span>
          <span style="background:var(--surface2);color:var(--muted);padding:3px 10px;border-radius:4px;font-size:12px">⏳ ${esc(n.age)}</span>
          <span style="background:var(--surface2);color:var(--muted);padding:3px 10px;border-radius:4px;font-size:12px">📍 ${esc(n.location)}</span>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="btn btn-outline btn-sm" onclick="openNpcModal(${n.id})">✏️ Modifier</button>
        <button class="btn btn-danger btn-xs" onclick="deleteNpc(${n.id})">Supprimer</button>
        ${DB.members.find(m=>m.linkedNpcId===n.id)?`<button class="btn btn-ghost btn-xs" onclick="goToMemberFromNpc(${n.id})" title="Voir la fiche aventurier liée">⚔️ Fiche Perso</button>`:''}
        ${n.sheetUrl?`<a href="${esc(n.sheetUrl)}" target="_blank" class="btn btn-ghost btn-xs" style="text-decoration:none">📋 Fiche</a>`:''}
      </div>
    </div>
    <div class="card">
      <div class="section-divider"><span class="section-divider-label">Personnalité</span><div class="section-divider-line"></div></div>
      <p style="color:#d1d5db;font-family:'Crimson Pro',serif;font-size:16px;line-height:1.7">${esc(n.personality)}</p>
      <div class="section-divider" style="margin-top:16px"><span class="section-divider-label">Description</span><div class="section-divider-line"></div></div>
      <p style="color:#d1d5db;font-family:'Crimson Pro',serif;font-size:16px;line-height:1.7">${esc(n.description)}</p>
    </div>
    <!-- STATUT & INTERACTIONS V7.1 (multi-statuts) -->
    <div class="card">
      <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">📊 Statuts</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
        ${Object.entries(NPC_STATUSES).map(([k,v])=>{
          const active=(n.statuses||['vivant']).includes(k);
          return `<button onclick="toggleNpcStatus(${n.id},'${k}')"
            style="display:inline-flex;align-items:center;gap:4px;padding:5px 12px;border-radius:20px;cursor:pointer;
              border:1px solid ${active?v.color:v.color+'44'};
              background:${active?v.color+'33':'transparent'};
              color:${active?v.color:'var(--dim)'};font-size:12px;font-weight:${active?'700':'400'};
              transition:all .15s"
            onmouseover="this.style.borderColor='${v.color}'"
            onmouseout="this.style.borderColor='${active?v.color:v.color+'44'}'">
            <span>${v.icon}</span>${v.label}
          </button>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${(n.statuses||['vivant']).map(k=>{
          const s=NPC_STATUSES[k];
          if(!s) return '';
          return `<div style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;background:${s.color}22;border:1px solid ${s.color}44;border-radius:20px">
            <span>${s.icon}</span><span style="color:${s.color};font-weight:700;font-size:13px">${s.label}</span>
          </div>`;
        }).filter(Boolean).join('')}
      </div>
    </div>
    <!-- MINI-JOURNAL D'INTERACTIONS -->
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase">💬 Interactions</div>
        <button class="btn btn-xs btn-outline" onclick="addNpcInteraction(${n.id})">+ Ajouter</button>
      </div>
      ${(n.interactions||[]).length===0?`<div style="color:var(--dim);font-size:12px;font-style:italic">Aucune interaction enregistrée.</div>`
      :`<div style="display:flex;flex-direction:column;gap:6px">
        ${(n.interactions||[]).slice().reverse().map((inter,ri)=>{
          const realIdx=(n.interactions.length-1-ri);
          return `<div style="background:var(--surface2);border-radius:6px;padding:8px 12px;border-left:3px solid var(--indigo)">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
              <span style="font-size:10px;color:var(--dim)">${esc(inter.date||'')}</span>
              <span style="font-size:10px;color:var(--dim)">·</span>
              <span style="font-size:11px;font-weight:600;color:var(--indigo)">${esc(inter.author||'')}</span>
              <button onclick="removeNpcInteraction(${n.id},${realIdx})" style="margin-left:auto;background:none;border:none;color:var(--dim);cursor:pointer;font-size:10px" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--dim)'">✕</button>
            </div>
            <div style="color:var(--muted);font-size:13px;line-height:1.5">${esc(inter.text)}</div>
          </div>`;
        }).join('')}
      </div>`}
    </div>
    <!-- RELATIONS ENTRE PNJ -->
    ${(n.relations||[]).length?`
    <div class="card">
      <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">🕸️ Relations</div>
      <div style="display:flex;flex-direction:column;gap:5px">
        ${(n.relations||[]).map(rel=>{
          const other=DB.npcs.find(x=>x.id===rel.npcId);
          if(!other) return '';
          const typeColors={'Allié':'#22c55e','Ennemi':'#ef4444','Rival':'#f59e0b','Mentor':'#3b82f6','Famille':'#a78bfa'};
          const col=typeColors[rel.type]||'var(--indigo)';
          return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface2);border-radius:6px">
            ${avatarEl(other,28)}
            <span style="flex:1;font-size:12px;font-weight:600;color:var(--text)">${esc(other.name)}</span>
            <span style="font-size:11px;padding:2px 8px;background:${col}22;color:${col};border-radius:10px">${rel.type}</span>
            <button onclick="selectedNpcId=${other.id};renderNpcDetail()" class="btn btn-ghost btn-xs">→</button>
          </div>`;
        }).filter(Boolean).join('')}
      </div>
    </div>`:''}
    <div class="card">
      <div class="section-divider"><span class="section-divider-label" style="color:var(--gold)">🔒 Secrets — MJ seulement</span><div class="section-divider-line" style="background:linear-gradient(90deg,var(--gold)44,transparent)"></div></div>
      <div class="secret-box"><p class="secret-text">${esc(n.secrets)}</p></div>
    </div>
  </div>`;
}


// ── HELPERS PNJ V6.1 ───────────────────────────────────────────
// → Bascule un statut sur un PNJ (V7.1 multi-statuts)
function toggleNpcStatus(npcId, statusKey){
  const n=DB.npcs.find(x=>x.id===npcId); if(!n) return;
  if(!n.statuses) n.statuses=['vivant'];
  const idx=n.statuses.indexOf(statusKey);
  if(idx>=0){
    // Remove — but keep at least one status
    if(n.statuses.length>1) n.statuses.splice(idx,1);
    else { toast('⚠️ Un PNJ doit avoir au moins un statut'); return; }
  } else {
    n.statuses.push(statusKey);
  }
  save(); renderNpcList(); renderNpcDetail();
  const s=NPC_STATUSES[statusKey]||NPC_STATUSES.vivant;
  const action=idx>=0?'retiré':'ajouté';
  toast(s.icon+' '+esc(n.name)+' : '+s.label+' '+action);
}

// → Ouvre la modale d'ajout d'interaction
function addNpcInteraction(npcId){
  const n=DB.npcs.find(x=>x.id===npcId); if(!n) return;
  const today=new Date().toLocaleDateString('fr-FR');
  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:420px">
    <div class="modal-header">
      <span class="modal-title">💬 Nouvelle interaction — ${esc(n.name)}</span>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="grid2">
        <div class="field"><label>Date</label>
          <input id="inter-date" value="${today}"
            style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px"></div>
        <div class="field"><label>Auteur</label>
          <select id="inter-author"
            style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px">
            <option value="">— MJ —</option>
            ${DB.members.map(m=>`<option value="${esc(m.name)}">${m.avatar} ${esc(m.name)}</option>`).join('')}
          </select></div>
      </div>
      <div class="field"><label>Interaction</label>
        <textarea id="inter-text" rows="4" placeholder="Les aventuriers ont rencontré ce personnage dans la taverne…"
          style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px;resize:vertical;box-sizing:border-box"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="saveNpcInteraction(${npcId})">Enregistrer</button>
    </div>
  </div>`);
}

function saveNpcInteraction(npcId){
  const n=DB.npcs.find(x=>x.id===npcId); if(!n) return;
  const text=(document.getElementById('inter-text')?.value||'').trim();
  if(!text){ toast('Interaction vide'); return; }
  if(!n.interactions) n.interactions=[];
  n.interactions.push({
    date:  document.getElementById('inter-date')?.value||'',
    author:document.getElementById('inter-author')?.value||'MJ',
    text
  });
  save(); closeModal(); renderNpcDetail();
}

function removeNpcInteraction(npcId, idx){
  const n=DB.npcs.find(x=>x.id===npcId); if(!n||!n.interactions) return;
  n.interactions.splice(idx,1);
  save(); renderNpcDetail();
}

// → Ajoute un champ "Relations" dans la fiche PNJ via openNpcModal
// Relations stockées dans n.relations:[{npcId, type}]

function openNpcModal(editId){
  const isEdit=!!editId;
  const src=isEdit?DB.npcs.find(n=>n.id===editId):null;
  const n=isEdit?JSON.parse(JSON.stringify(src)):{id:uid(),name:'',role:'',age:'',race:'',statuses:['vivant'],interactions:[],relations:[],avatar:'🧑',avatarImg:null,personality:'',description:'',secrets:'',location:''};
  window._editNpc=n;
  window._imgUploads={};
  openModal(`<div class="modal modal-wide" onclick="event.stopPropagation()">
    <div class="modal-header"><span class="modal-title">${isEdit?'✏️ Modifier':'🎭 Nouveau PNJ'}</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="field">
        <label>Avatar (emoji)</label>
        <div class="avatar-grid">${EMOJIS_NPC.map(e=>`<div class="avatar-opt${e===n.avatar?' selected':''}" onclick="window._editNpc.avatar='${e}';this.closest('.avatar-grid').querySelectorAll('.avatar-opt').forEach(x=>x.classList.remove('selected'));this.classList.add('selected')">${e}</div>`).join('')}</div>
      </div>
      ${imgUploadField('npc-avatar-img', n.avatarImg, 'Image personnalisée')}
      <div class="grid2">
        <div class="field"><label>Nom</label><input value="${esc(n.name)}" oninput="window._editNpc.name=this.value"></div>
        <div class="field"><label>Rôle</label><input value="${esc(n.role)}" oninput="window._editNpc.role=this.value"></div>
        <div class="field"><label>Race</label><input value="${esc(n.race)}" oninput="window._editNpc.race=this.value"></div>
        <div class="field"><label>Âge</label><input value="${esc(n.age)}" oninput="window._editNpc.age=this.value"></div>
        <div class="field"><label>Localisation</label><input value="${esc(n.location)}" oninput="window._editNpc.location=this.value"></div>
        <div class="field"><label>🔗 Lien Fiche de Personnage (URL, optionnel)</label><input value="${esc(n.sheetUrl||'')}" oninput="window._editNpc.sheetUrl=this.value" placeholder="https://... (DNDBeyond, PDF, Drive...)"></div>
      </div>
      <div class="field"><label>Personnalité</label><textarea rows="2" oninput="window._editNpc.personality=this.value" placeholder="Traits de caractère...">${esc(n.personality)}</textarea></div>
      <div class="field"><label>Description</label><textarea rows="3" oninput="window._editNpc.description=this.value" placeholder="Apparence, histoire...">${esc(n.description)}</textarea></div>
      <div class="field"><label>🔒 Secret (MJ seulement)</label><textarea rows="2" oninput="window._editNpc.secrets=this.value" placeholder="Ce que personne ne sait...">${esc(n.secrets)}</textarea></div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="saveNpc(${editId||'null'})">${isEdit?'Sauvegarder':'Créer'}</button>
      </div>
    </div>
  </div>`);
}

function saveNpc(editId){
  const n=window._editNpc;
  if(!n||!n.name.trim()) return;
  if(window._imgUploads['npc-avatar-img']) n.avatarImg=window._imgUploads['npc-avatar-img'];
  if(editId&&editId!=='null') DB.npcs=DB.npcs.map(x=>x.id===editId?n:x);
  else { DB.npcs.push(n); selectedNpcId=n.id; }
  save(); closeModal(); renderNPCs(); toast('PNJ sauvegardé !');
}

function deleteNpc(id){
  if(!confirm('Supprimer ce PNJ ?')) return;
  deleteBlob('n_av_'+id);
  DB.npcs=DB.npcs.filter(n=>n.id!==id);
  selectedNpcId=DB.npcs[0]?.id||null;
  save(); renderNPCs();
}

