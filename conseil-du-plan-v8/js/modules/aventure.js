/**
 * THEME TOGGLE + MODULE AVENTURE (V6.3)
 * Extrait de V7_6.html lignes 7890-8981
 */
// ================================================================
// THEME TOGGLE
// ================================================================
// ── MODULE AVENTURE (V6.3) ────────────────────────────────────
// Quêtes · Factions · Timeline · Notes de session
// ══════════════════════════════════════════════════════════════

const QUEST_STATUSES = {
  'active':    {label:'En cours',    icon:'⚔️',  color:'#6366f1'},
  'completed': {label:'Terminée',    icon:'✅',  color:'#22c55e'},
  'failed':    {label:'Échouée',     icon:'💀',  color:'#ef4444'},
  'paused':    {label:'En attente',  icon:'⏸️',  color:'#f59e0b'},
  'secret':    {label:'Secrète',     icon:'🔒',  color:'#9ca3af'},
};
const QUEST_PRIORITIES = {
  'main':      {label:'Principale',  icon:'🌟', color:'#f59e0b'},
  'side':      {label:'Secondaire',  icon:'📌', color:'#6366f1'},
  'personal':  {label:'Personnelle', icon:'💜', color:'#a78bfa'},
  'urgent':    {label:'Urgente',     icon:'🔥', color:'#ef4444'},
};
const FACTION_ATTITUDES = {
  'allié':    {icon:'🤝', color:'#22c55e'},
  'neutre':   {icon:'😐', color:'#9ca3af'},
  'méfiant':  {icon:'👀', color:'#f59e0b'},
  'hostile':  {icon:'⚔️', color:'#ef4444'},
  'inconnu':  {icon:'❓', color:'#6b7280'},
};
const TIMELINE_TYPES = {
  'combat':    {icon:'⚔️',  color:'#ef4444'},
  'quête':     {icon:'📜', color:'#6366f1'},
  'rencontre': {icon:'🎭', color:'#a78bfa'},
  'découverte':{icon:'🔍', color:'#60a5fa'},
  'repos':     {icon:'🏕️',  color:'#22c55e'},
  'voyage':    {icon:'🗺️',  color:'#f59e0b'},
  'autre':     {icon:'📝', color:'#9ca3af'},
};

// ── State ──────────────────────────────────────────────────────
let adventureTab       = 'quests';   // 'quests'|'factions'|'timeline'|'sessions'|'journal'|'npcs'
let selectedQuestId    = null;
let questStatusFilter  = 'all';
let selectedFactionId  = null;
let selectedSessionId  = null;

// ══════════════════════════════════════════════════════════════
// RENDER PRINCIPAL
// ══════════════════════════════════════════════════════════════
function renderAdventure(){
  const el = document.getElementById('module-adventure');
  const tabs = [
    ['quests',   '📜 Quêtes',   (DB.quests||[]).length],
    ['journal',  '📖 Journal',  (DB.journal||[]).length],
    ['npcs',     '🎭 PNJ',      (DB.npcs||[]).length],
    ['factions', '🏰 Factions', (DB.factions||[]).length],
    ['timeline', '⏳ Timeline', (DB.timeline||[]).length],
    ['plans',    '🌀 Plans',    (DB.planes||[]).length],
    ['sessions', '📓 Sessions', (DB.sessionNotes||[]).length],
  ];
  el.innerHTML = `
  <div class="module-header">
    <span style="font-size:26px">📖</span>
    <div><div class="module-title">Aventure</div><div class="module-bar"></div></div>
    <div style="flex:1"></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${tabs.map(([id,label,count])=>`
      <button onclick="adventureTab='${id}';renderAdventure()" class="btn btn-sm ${adventureTab===id?'btn-primary':'btn-ghost'}" style="gap:5px">
        ${label}${count?` <span style="background:${adventureTab===id?'#ffffff33':'var(--surface2)'};padding:1px 6px;border-radius:8px;font-size:10px">${count}</span>`:''}
      </button>`).join('')}
    </div>
  </div>
  <div id="adventure-content"></div>`;

  if(adventureTab==='quests')   renderQuestsTab();
  if(adventureTab==='journal')  { document.getElementById('adventure-content').innerHTML='<div id="module-journal"></div>'; renderJournal(); }
  if(adventureTab==='npcs')     { document.getElementById('adventure-content').innerHTML='<div id="module-npcs"></div>'; renderNPCs(); }
  if(adventureTab==='factions') renderFactionsTab();
  if(adventureTab==='timeline') renderTimelineTab();
  if(adventureTab==='sessions') renderSessionsTab();
  if(adventureTab==='plans')    renderPlansTab();
}

// ══════════════════════════════════════════════════════════════
// ONGLET QUÊTES
// ══════════════════════════════════════════════════════════════
function renderQuestsTab(){
  const el = document.getElementById('adventure-content');
  const all = DB.quests||[];
  const filtered = questStatusFilter==='all' ? all : all.filter(q=>q.status===questStatusFilter);

  el.innerHTML = `
  <div style="display:flex;gap:20px;min-height:70vh">
    <!-- SIDEBAR -->
    <div style="width:260px;flex-shrink:0;display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-primary btn-sm" onclick="openQuestModal()">+ Nouvelle quête</button>
      <!-- Filtres statuts -->
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        <button onclick="questStatusFilter='all';renderQuestsTab()" class="btn btn-xs ${questStatusFilter==='all'?'btn-primary':'btn-ghost'}">Toutes (${all.length})</button>
        ${Object.entries(QUEST_STATUSES).map(([k,v])=>{
          const n=all.filter(q=>q.status===k).length;
          if(!n) return '';
          return `<button onclick="questStatusFilter='${k}';renderQuestsTab()" class="btn btn-xs ${questStatusFilter===k?'btn-primary':'btn-ghost'}" style="gap:3px">${v.icon} ${n}</button>`;
        }).join('')}
      </div>
      <!-- Liste -->
      <div style="display:flex;flex-direction:column;gap:5px;overflow-y:auto;max-height:65vh">
        ${filtered.length===0?`<div style="color:var(--dim);font-style:italic;text-align:center;padding:20px;font-size:13px">Aucune quête — créez-en une !</div>`
        :filtered.map(q=>{
          const st=QUEST_STATUSES[q.status]||QUEST_STATUSES.active;
          const pr=QUEST_PRIORITIES[q.priority]||QUEST_PRIORITIES.side;
          const done=(q.objectives||[]).filter(o=>o.done).length;
          const total=(q.objectives||[]).length;
          const sel=q.id===selectedQuestId;
          return `<div onclick="selectedQuestId=${q.id};renderQuestsTab()" style="
            padding:10px 12px;border-radius:9px;cursor:pointer;
            background:${sel?'var(--selected)':'var(--surface)'};
            border:1px solid ${sel?'var(--indigo)':'var(--border)'};
            transition:border-color .15s">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span title="${pr.label}" style="font-size:13px">${pr.icon}</span>
              <span style="flex:1;font-weight:600;font-size:13px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(q.title)}</span>
              <span style="font-size:11px;color:${st.color}" title="${st.label}">${st.icon}</span>
            </div>
            ${q.giver?`<div style="font-size:11px;color:var(--dim)">Donneur : ${esc(q.giver)}</div>`:''}
            ${total?`<div style="margin-top:5px">
              <div style="height:3px;background:var(--border2);border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${Math.round(done/total*100)}%;background:${st.color};border-radius:2px;transition:width .3s"></div>
              </div>
              <div style="font-size:10px;color:var(--dim);margin-top:2px">${done}/${total} objectifs</div>
            </div>`:''}
          </div>`;
        }).join('')}
      </div>
    </div>
    <!-- DETAIL -->
    <div style="flex:1;min-width:0" id="quest-detail-panel">
      ${renderQuestDetailHTML(selectedQuestId)}
    </div>
  </div>`;
}

function renderQuestDetailHTML(questId){
  const q = (DB.quests||[]).find(x=>x.id===questId);
  if(!q) return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:400px;color:var(--dim)">
    <div style="font-size:48px;margin-bottom:12px">📜</div>
    <div style="font-style:italic">Sélectionnez une quête ou créez-en une nouvelle</div>
  </div>`;

  const st=QUEST_STATUSES[q.status]||QUEST_STATUSES.active;
  const pr=QUEST_PRIORITIES[q.priority]||QUEST_PRIORITIES.side;
  const done=(q.objectives||[]).filter(o=>o.done).length;
  const total=(q.objectives||[]).length;

  return `<div style="display:flex;flex-direction:column;gap:14px">
    <!-- Header -->
    <div class="card" style="border-left:4px solid ${st.color}">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="font-size:18px">${pr.icon}</span>
            <span style="font-family:'Cinzel',serif;font-weight:900;font-size:20px;color:var(--text)">${esc(q.title)}</span>
            <span style="background:${st.color}22;color:${st.color};padding:2px 9px;border-radius:10px;font-size:11px;font-weight:700">${st.icon} ${st.label}</span>
            <span style="background:${pr.color}22;color:${pr.color};padding:2px 9px;border-radius:10px;font-size:11px">${pr.label}</span>
          </div>
          ${q.giver?`<div style="font-size:13px;color:var(--muted)">🧑 Donné par <b>${esc(q.giver)}</b></div>`:''}
          ${q.reward?`<div style="font-size:13px;color:var(--gold)">🏆 Récompense : ${esc(q.reward)}</div>`:''}
          ${q.tags&&q.tags.length?`<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${q.tags.map(t=>`<span style="background:var(--surface2);color:var(--muted);padding:1px 8px;border-radius:8px;font-size:11px">#${esc(t)}</span>`).join('')}</div>`:''}
        </div>
        <div style="display:flex;flex-direction:column;gap:5px">
          <button class="btn btn-outline btn-sm" onclick="openQuestModal(${q.id})">✏️ Modifier</button>
          <button class="btn btn-danger btn-xs" onclick="deleteQuest(${q.id})">Supprimer</button>
          <!-- Quick status change -->
          <select onchange="updateQuestStatus(${q.id},this.value)"
            style="background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px;font-size:11px">
            ${Object.entries(QUEST_STATUSES).map(([k,v])=>`<option value="${k}" ${q.status===k?'selected':''}>${v.icon} ${v.label}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <!-- Description -->
    ${q.description?`<div class="card">
      <div style="font-size:10px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">Description</div>
      <p style="color:var(--muted);font-family:'Crimson Pro',serif;font-size:15px;line-height:1.75;margin:0;white-space:pre-wrap">${esc(q.description)}</p>
    </div>`:''}

    <!-- Objectifs -->
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-size:10px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase">
          Objectifs ${total?`<span style="color:var(--dim);font-weight:400">(${done}/${total})</span>`:''}
        </div>
        <button onclick="addObjective(${q.id})" class="btn btn-ghost btn-xs">+ Objectif</button>
      </div>
      ${total===0?`<div style="color:var(--dim);font-style:italic;font-size:13px">Aucun objectif défini</div>`
      :`<div style="display:flex;flex-direction:column;gap:6px">
        ${(q.objectives||[]).map((o,i)=>`
        <div style="display:flex;align-items:flex-start;gap:8px;padding:7px 10px;border-radius:7px;background:var(--surface2);${o.done?'opacity:.65':''}">
          <input type="checkbox" ${o.done?'checked':''} onchange="toggleObjective(${q.id},${i})"
            style="margin-top:2px;cursor:pointer;accent-color:var(--indigo)">
          <span style="flex:1;color:var(--text);font-size:13px;${o.done?'text-decoration:line-through;color:var(--dim)':''}">${esc(o.text)}</span>
          <button onclick="removeObjective(${q.id},${i})" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:12px;padding:0"
            onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--dim)'">✕</button>
        </div>`).join('')}
      </div>`}
      ${total>0?`<div style="margin-top:8px">
        <div style="height:4px;background:var(--border2);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${total?Math.round(done/total*100):0}%;background:${st.color};border-radius:2px;transition:width .4s"></div>
        </div>
      </div>`:''}
    </div>

    <!-- Notes MJ -->
    ${q.notes?`<div class="card" style="border-color:#78350f">
      <div style="font-size:10px;color:var(--gold);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">🔒 Notes MJ</div>
      <div class="secret-box"><p class="secret-text" style="white-space:pre-wrap">${esc(q.notes)}</p></div>
    </div>`:''}

    <!-- Évènements liés dans timeline -->
    ${(()=>{
      const linked=(DB.timeline||[]).filter(t=>t.questId===q.id);
      if(!linked.length) return '';
      return `<div class="card">
        <div style="font-size:10px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">⏳ Évènements liés</div>
        ${linked.map(t=>{const tp=TIMELINE_TYPES[t.type]||TIMELINE_TYPES.autre;return `<div style="display:flex;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid var(--border2)">
          <span>${tp.icon}</span>
          <span style="color:var(--dim);font-size:11px;white-space:nowrap">${esc(t.date||'')}</span>
          <span style="color:var(--text);font-size:13px">${esc(t.title)}</span>
        </div>`;}).join('')}
      </div>`;
    })()}
  </div>`;
}

function updateQuestStatus(questId, status){
  const q=(DB.quests||[]).find(x=>x.id===questId);
  if(!q) return;
  q.status=status; save(); renderQuestsTab();
}

function toggleObjective(questId, idx){
  const q=(DB.quests||[]).find(x=>x.id===questId);
  if(!q||!q.objectives[idx]) return;
  q.objectives[idx].done=!q.objectives[idx].done;
  save();
  document.getElementById('quest-detail-panel').innerHTML=renderQuestDetailHTML(questId);
}

function addObjective(questId){
  const text=prompt('Texte de l\'objectif :'); if(!text) return;
  const q=(DB.quests||[]).find(x=>x.id===questId);
  if(!q) return;
  if(!q.objectives) q.objectives=[];
  q.objectives.push({id:uid(),text,done:false});
  save();
  document.getElementById('quest-detail-panel').innerHTML=renderQuestDetailHTML(questId);
}

function removeObjective(questId,idx){
  const q=(DB.quests||[]).find(x=>x.id===questId);
  if(!q||!q.objectives) return;
  q.objectives.splice(idx,1); save();
  document.getElementById('quest-detail-panel').innerHTML=renderQuestDetailHTML(questId);
}

function deleteQuest(id){
  if(!confirm('Supprimer cette quête ?')) return;
  DB.quests=(DB.quests||[]).filter(x=>x.id!==id);
  if(selectedQuestId===id) selectedQuestId=null;
  save(); renderQuestsTab();
}

function openQuestModal(editId){
  const src=editId?(DB.quests||[]).find(x=>x.id===editId):null;
  const q=src?{...src,objectives:[...(src.objectives||[])],tags:[...(src.tags||[])]}
             :{id:uid(),title:'',giver:'',status:'active',priority:'side',description:'',reward:'',notes:'',objectives:[],tags:[]};
  window._editQuest=q;
  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:540px">
  <div class="modal-header"><span class="modal-title">${editId?'✏️ Modifier':'+ Nouvelle'} Quête</span>
  <button class="modal-close" onclick="closeModal()">✕</button></div>
  <div class="modal-body">
  <div class="grid2">
    <div class="field" style="grid-column:1/-1"><label>Titre *</label>
    <input value="${esc(q.title)}" oninput="window._editQuest.title=this.value"
      style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>
    <div class="field"><label>Statut</label>
    <select onchange="window._editQuest.status=this.value"
      style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px">
      ${Object.entries(QUEST_STATUSES).map(([k,v])=>`<option value="${k}" ${q.status===k?'selected':''}>${v.icon} ${v.label}</option>`).join('')}
    </select></div>
    <div class="field"><label>Priorité</label>
    <select onchange="window._editQuest.priority=this.value"
      style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px">
      ${Object.entries(QUEST_PRIORITIES).map(([k,v])=>`<option value="${k}" ${q.priority===k?'selected':''}>${v.icon} ${v.label}</option>`).join('')}
    </select></div>
    <div class="field"><label>Donneur de quête</label>
    <input value="${esc(q.giver||'')}" oninput="window._editQuest.giver=this.value"
      placeholder="PNJ, organisation…"
      style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>
    <div class="field"><label>🏆 Récompense</label>
    <input value="${esc(q.reward||'')}" oninput="window._editQuest.reward=this.value"
      placeholder="500 PO, objet magique…"
      style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>
  </div>
  <div class="field"><label>Description</label>
  <textarea rows="3" oninput="window._editQuest.description=this.value"
    style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;resize:vertical;box-sizing:border-box">${esc(q.description||'')}</textarea></div>
  <div class="field"><label>Tags (séparés par virgule)</label>
  <input value="${esc((q.tags||[]).join(', '))}" oninput="window._editQuest.tags=this.value.split(',').map(s=>s.trim()).filter(Boolean)"
    placeholder="magie, donjon, vengeance…"
    style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>
  <div class="field"><label>🔒 Notes MJ (secrètes)</label>
  <textarea rows="2" oninput="window._editQuest.notes=this.value"
    style="width:100%;background:var(--surface2);border:1px solid #78350f;border-radius:6px;color:var(--text);padding:9px;resize:vertical;box-sizing:border-box">${esc(q.notes||'')}</textarea></div>
  </div>
  <div class="modal-footer">
  <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
  <button class="btn btn-primary" onclick="saveQuest()">Enregistrer</button>
  </div></div>`);
}

function saveQuest(){
  const q=window._editQuest;
  if(!q.title.trim()){toast('Titre requis');return;}
  if(!DB.quests) DB.quests=[];
  const idx=DB.quests.findIndex(x=>x.id===q.id);
  if(idx>=0) DB.quests[idx]={...q};
  else { q.createdAt=Date.now(); DB.quests.push({...q}); }
  selectedQuestId=q.id;
  save(); closeModal(); renderQuestsTab();
}

// ══════════════════════════════════════════════════════════════
// ONGLET FACTIONS
// ══════════════════════════════════════════════════════════════
function renderFactionsTab(){
  const el=document.getElementById('adventure-content');
  const factions=DB.factions||[];

  el.innerHTML=`<div style="display:flex;gap:20px;min-height:70vh">
    <!-- SIDEBAR -->
    <div style="width:240px;flex-shrink:0;display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-primary btn-sm" onclick="openFactionModal()">+ Nouvelle faction</button>
      <div style="display:flex;flex-direction:column;gap:5px;overflow-y:auto;max-height:65vh">
        ${factions.length===0?`<div style="color:var(--dim);font-style:italic;text-align:center;padding:20px;font-size:13px">Aucune faction</div>`
        :factions.map(f=>{
          const att=FACTION_ATTITUDES[f.attitude]||FACTION_ATTITUDES.inconnu;
          const sel=f.id===selectedFactionId;
          return `<div onclick="selectedFactionId=${f.id};renderFactionsTab()" style="
            padding:10px 12px;border-radius:9px;cursor:pointer;
            background:${sel?'var(--selected)':'var(--surface)'};
            border:1px solid ${sel?'var(--indigo)':'var(--border)'}">
            <div style="display:flex;align-items:center;gap:7px">
              <span style="font-size:20px">${f.icon||'🏰'}</span>
              <span style="flex:1;font-weight:600;font-size:13px;color:var(--text)">${esc(f.name)}</span>
              <span title="${f.attitude||'inconnu'}">${att.icon}</span>
            </div>
            ${f.members&&f.members.length?`<div style="font-size:11px;color:var(--dim);margin-top:3px">${f.members.length} membre(s) connu(s)</div>`:''}
          </div>`;
        }).join('')}
      </div>
    </div>
    <!-- DETAIL -->
    <div style="flex:1;min-width:0">${renderFactionDetailHTML(selectedFactionId)}</div>
  </div>`;
}

function renderFactionDetailHTML(factionId){
  const f=(DB.factions||[]).find(x=>x.id===factionId);
  if(!f) return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:400px;color:var(--dim)">
    <div style="font-size:48px;margin-bottom:12px">🏰</div>
    <div style="font-style:italic">Sélectionnez une faction</div></div>`;
  const att=FACTION_ATTITUDES[f.attitude]||FACTION_ATTITUDES.inconnu;

  // Get linked NPCs
  const linkedNpcs=(f.members||[]).map(id=>{
    const n=DB.npcs.find(x=>x.id===id);
    return n?n:null;
  }).filter(Boolean);
  // All NPCs for assignment
  const unlinked=DB.npcs.filter(n=>!(f.members||[]).includes(n.id));

  return `<div style="display:flex;flex-direction:column;gap:14px">
    <div class="card" style="${f.bgImage ? 'position:relative;overflow:hidden;background-image:url('+JSON.stringify(f.bgImage)+');background-size:cover;background-position:center' : ''}">
      ${f.bgImage ? '<div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(6,6,15,0.88),rgba(6,6,15,0.6));z-index:0"></div>' : ''}
      <div style="display:flex;align-items:flex-start;gap:14px;position:relative;z-index:1">
        <div style="font-size:44px">${f.icon||'🏰'}</div>
        <div style="flex:1">
          <div style="font-family:'Cinzel',serif;font-weight:900;font-size:22px;color:var(--text);margin-bottom:6px">${esc(f.name)}</div>
          <div style="display:flex;gap:8px;align-items:center">
            <span style="background:${att.color}22;color:${att.color};padding:3px 10px;border-radius:10px;font-size:12px;font-weight:700">${att.icon} ${f.attitude||'Inconnu'}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px">
          <button class="btn btn-outline btn-sm" onclick="openFactionModal(${f.id})">✏️ Modifier</button>
          <button class="btn btn-danger btn-xs" onclick="deleteFaction(${f.id})">Supprimer</button>
          <select onchange="updateFactionAttitude(${f.id},this.value)"
            style="background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px;font-size:11px">
            ${Object.entries(FACTION_ATTITUDES).map(([k,v])=>`<option value="${k}" ${f.attitude===k?'selected':''}>${v.icon} ${k}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
    ${f.description?`<div class="card">
      <div style="font-size:10px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">Description</div>
      <p style="color:var(--muted);font-family:'Crimson Pro',serif;font-size:15px;line-height:1.75;margin:0;white-space:pre-wrap">${esc(f.description)}</p>
    </div>`:''}
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-size:10px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase">Membres connus (${linkedNpcs.length})</div>
        ${unlinked.length?`<select onchange="addNpcToFaction(${f.id},+this.value);this.value=''"
          style="background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px;font-size:11px">
          <option value="">+ Ajouter un PNJ…</option>
          ${unlinked.map(n=>`<option value="${n.id}">${n.avatar||'🎭'} ${esc(n.name)}</option>`).join('')}
        </select>`:''}
      </div>
      ${linkedNpcs.length===0?`<div style="color:var(--dim);font-style:italic;font-size:13px">Aucun PNJ lié</div>`
      :`<div style="display:flex;flex-wrap:wrap;gap:7px">
        ${linkedNpcs.map(n=>`<div style="display:flex;align-items:center;gap:6px;padding:5px 10px;background:var(--surface2);border-radius:8px;font-size:12px">
          <span>${n.avatar||'🎭'}</span><span style="color:var(--text)">${esc(n.name)}</span>
          <button onclick="removeNpcFromFaction(${f.id},${n.id})" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:11px;padding:0"
            onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--dim)'">✕</button>
        </div>`).join('')}
      </div>`}
    </div>
    ${f.notes?`<div class="card" style="border-color:#78350f">
      <div style="font-size:10px;color:var(--gold);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">🔒 Notes MJ</div>
      <div class="secret-box"><p class="secret-text">${esc(f.notes)}</p></div>
    </div>`:''}
  </div>`;
}

function updateFactionAttitude(factionId, att){
  const f=(DB.factions||[]).find(x=>x.id===factionId);
  if(f){ f.attitude=att; save(); renderFactionsTab(); }
}
function addNpcToFaction(factionId, npcId){
  const f=(DB.factions||[]).find(x=>x.id===factionId);
  if(!f) return;
  if(!f.members) f.members=[];
  if(!f.members.includes(npcId)) f.members.push(npcId);
  save(); renderFactionsTab();
}
function removeNpcFromFaction(factionId, npcId){
  const f=(DB.factions||[]).find(x=>x.id===factionId);
  if(!f) return;
  f.members=(f.members||[]).filter(id=>id!==npcId);
  save(); renderFactionsTab();
}
function deleteFaction(id){
  if(!confirm('Supprimer cette faction ?')) return;
  DB.factions=(DB.factions||[]).filter(x=>x.id!==id);
  if(selectedFactionId===id) selectedFactionId=null;
  save(); renderFactionsTab();
}

function openFactionModal(editId){
  const src=editId?(DB.factions||[]).find(x=>x.id===editId):null;
  const f=src?{...src,members:[...(src.members||[])]}
             :{id:uid(),icon:'🏰',name:'',attitude:'neutre',description:'',notes:'',members:[],bgImage:null};
  window._editFaction=f;
  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:480px">
  <div class="modal-header"><span class="modal-title">${editId?'✏️ Modifier':'+ Nouvelle'} Faction</span>
  <button class="modal-close" onclick="closeModal()">✕</button></div>
  <div class="modal-body">
  <div class="grid2">
    <div class="field"><label>Icône</label>
    <input value="${esc(f.icon||'🏰')}" oninput="window._editFaction.icon=this.value"
      style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;text-align:center;font-size:22px"></div>
    <div class="field"><label>Nom *</label>
    <input value="${esc(f.name||'')}" oninput="window._editFaction.name=this.value"
      style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>
    <div class="field" style="grid-column:1/-1"><label>Attitude envers le groupe</label>
    <select onchange="window._editFaction.attitude=this.value"
      style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px">
      ${Object.entries(FACTION_ATTITUDES).map(([k,v])=>`<option value="${k}" ${f.attitude===k?'selected':''}>${v.icon} ${k}</option>`).join('')}
    </select></div>
  </div>
  <div class="field"><label>Description</label>
  <textarea rows="3" oninput="window._editFaction.description=this.value"
    style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;resize:vertical;box-sizing:border-box">${esc(f.description||'')}</textarea></div>
  <div class="field"><label>🔒 Notes MJ</label>
  <textarea rows="2" oninput="window._editFaction.notes=this.value"
    style="width:100%;background:var(--surface2);border:1px solid #78350f;border-radius:6px;color:var(--text);padding:9px;resize:vertical;box-sizing:border-box">${esc(f.notes||'')}</textarea></div>
  <div class="field"><label>🖼️ Image d'illustration (fond)</label>
  <div style="display:flex;gap:8px;align-items:center">
    ${f.bgImage ? '<img src="'+f.bgImage+'" style="width:64px;height:40px;object-fit:cover;border-radius:5px;border:1px solid var(--border2)">' : '<div style="width:64px;height:40px;background:var(--surface2);border-radius:5px;border:1px dashed var(--border2);display:flex;align-items:center;justify-content:center;font-size:18px">🖼️</div>'}
    <label class="btn btn-outline btn-sm" style="cursor:pointer">📁 Choisir
      <input type="file" accept="image/*" style="display:none" onchange="(function(e){var file=e.target.files[0];if(!file)return;var r=new FileReader();r.onload=function(x){window._editFaction.bgImage=x.target.result;saveFaction();openFactionModal(${f.id});};r.readAsDataURL(file);})(event)">
    </label>
    ${f.bgImage ? '<button class="btn btn-ghost btn-xs" onclick="window._editFaction.bgImage=null">✕ Retirer</button>' : ''}
  </div></div>
  </div>
  <div class="modal-footer">
  <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
  <button class="btn btn-primary" onclick="saveFaction()">Enregistrer</button>
  </div></div>`);
}

function saveFaction(){
  const f=window._editFaction;
  if(!f.name.trim()){toast('Nom requis');return;}
  if(!DB.factions) DB.factions=[];
  const idx=DB.factions.findIndex(x=>x.id===f.id);
  if(idx>=0) DB.factions[idx]={...f};
  else DB.factions.push({...f});
  selectedFactionId=f.id;
  save(); closeModal(); renderFactionsTab();
}

// ══════════════════════════════════════════════════════════════
// ONGLET TIMELINE
// ══════════════════════════════════════════════════════════════
var _tlView = 'chrono';
var _tlGroupFilter = null;

function openTimelineGroupModal(editId) {
  var isNew = !editId;
  var src = editId ? (DB.timelineGroups||[]).find(function(x){return x.id===editId;}) : null;
  var COLORS = ['#6366f1','#8b5cf6','#3b82f6','#14b8a6','#22c55e','#eab308','#f97316','#ef4444','#ec4899','#60a5fa'];
  var d = { id: editId||uid(), name: src?src.name:'', color: src?(src.color||'#6366f1'):'#6366f1' };
  window._editTLGroup = d;
  var cpicker = COLORS.map(function(c){
    var outline = (d.color===c) ? 'outline:2px solid white;' : '';
    return '<div onclick="window._editTLGroup.color=\''+c+'\''
      + ';document.querySelectorAll(\'[data-tlcp]\').forEach(function(x){x.style.outline=\'none\'})'
      + ';this.style.outline=\'2px solid white\'"'
      + ' data-tlcp="1" style="width:22px;height:22px;background:'+c+';border-radius:4px;cursor:pointer;display:inline-block;margin:2px;'+outline+'"></div>';
  }).join('');
  var delBtn = (!isNew && editId) ? '<button class="btn btn-danger btn-sm" onclick="deleteTLGroup(\''+editId+'\')">Supprimer</button>' : '';
  var html = '<div class="modal" onclick="event.stopPropagation()" style="max-width:380px">'
    + '<div class="modal-header"><span class="modal-title">'+(isNew?'+ Nouvelle Timeline':'Modifier Timeline')+'</span>'
    + '<button class="modal-close" onclick="closeModal()">&#x2715;</button></div>'
    + '<div class="modal-body">'
    + '<div class="field"><label>Nom *</label><input value="'+esc(d.name)+'" oninput="window._editTLGroup.name=this.value"'
    + ' placeholder="Timeline principale, Histoire des Dieux..."'
    + ' style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>'
    + '<div class="field"><label>Couleur</label><div style="margin-top:4px">'+cpicker+'</div></div>'
    + '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">'
    + '<button class="btn btn-ghost" onclick="closeModal()">Annuler</button>'
    + delBtn
    + '<button class="btn btn-primary" onclick="saveTLGroup(\''+editId+'\')">Enregistrer</button>'
    + '</div></div></div>';
  openModal(html);
}

function saveTLGroup(editId) {
  var d = window._editTLGroup;
  if(!d.name.trim()) { toast('Nom requis'); return; }
  if(!DB.timelineGroups) DB.timelineGroups = [];
  var idx = editId ? DB.timelineGroups.findIndex(function(x){return x.id===editId;}) : -1;
  if(idx >= 0) DB.timelineGroups[idx] = d; else DB.timelineGroups.push(d);
  save(); closeModal(); renderTimelineTab();
  toast('Timeline enregistr&#233;e !');
}

function deleteTLGroup(id) {
  if(!confirm('Supprimer cette timeline ? Les &#233;v&#232;nements ne seront pas supprim&#233;s.')) return;
  DB.timelineGroups = (DB.timelineGroups||[]).filter(function(x){return x.id!==id;});
  if(_tlGroupFilter === id) _tlGroupFilter = null;
  save(); closeModal(); renderTimelineTab();
}

function renderTimelineTab(){
  const el=document.getElementById('adventure-content');
  const groups = DB.timelineGroups||[];
  const allEvents=(DB.timeline||[]).slice().sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
  const events = _tlGroupFilter ? allEvents.filter(e=>e.tlGroupId===_tlGroupFilter) : allEvents;

  var pillAll = '<button class="btn btn-xs ' + (!_tlGroupFilter?'btn-primary':'btn-ghost') + '" onclick="_tlGroupFilter=null;renderTimelineTab()">Toutes (' + allEvents.length + ')</button> ';
  var pillGroups = groups.map(function(g){
    var cnt = allEvents.filter(function(e){return e.tlGroupId===g.id;}).length;
    var sel = _tlGroupFilter===g.id;
    var btnStyle = sel ? '' : 'border:1px solid '+g.color+'55;color:'+g.color+';';
    return '<button class="btn btn-xs '+(sel?'btn-primary':'btn-ghost')+'" style="'+btnStyle+'" onclick="_tlGroupFilter=\''+g.id+'\';renderTimelineTab()">'
      + esc(g.name)+' ('+cnt+')'
      + '<span onclick="event.stopPropagation();openTimelineGroupModal(\''+g.id+'\')" style="margin-left:5px;opacity:.55;font-size:9px">✏️</span>'
      + '</button> ';
  }).join('');
  var groupPills = pillAll + pillGroups;

  el.innerHTML=`
  <div style="display:flex;gap:8px;justify-content:space-between;align-items:flex-start;margin-bottom:14px;flex-wrap:wrap">
    <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center">
      ${groupPills}
      <button class="btn btn-ghost btn-xs" onclick="openTimelineGroupModal()" title="Cr&#233;er une nouvelle timeline">+ Timeline</button>
    </div>
    <div style="display:flex;gap:6px">
      <button class="btn btn-ghost btn-xs" style="font-size:11px" onclick="_tlView=_tlView==='orga'?'chrono':'orga';renderTimelineTab()">${_tlView==='orga'?'&#x23F1; Chrono':'&#x1F5C2; Organigramme'}</button>
      <button class="btn btn-primary btn-sm" onclick="openTimelineEventModal()">+ &#xC9;v&#xE8;nement</button>
    </div>
  </div>
  ${events.length===0
    ?`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;color:var(--dim)"><div style="font-size:48px;margin-bottom:12px">&#x23F3;</div><div style="font-style:italic">Aucun &#233;v&#232;nement dans cette timeline</div></div>`
    :(_tlView==='orga' ? renderTimelineOrga(events) : renderTimelineHTML(events))
  }`;
}


function renderTimelineOrga(events) {
  var byType = {};
  events.forEach(function(ev) {
    var t = ev.type || 'autre';
    if(!byType[t]) byType[t] = [];
    byType[t].push(ev);
  });
  var cols = Object.keys(byType).map(function(type) {
    var tp = TIMELINE_TYPES[type] || TIMELINE_TYPES.autre;
    var cards = byType[type].map(function(ev) {
      var quest = ev.questId ? (DB.quests||[]).find(function(q){return q.id===ev.questId;}) : null;
      return '<div class="card" style="border-left:3px solid ' + tp.color + ';cursor:pointer;transition:transform .12s" '
        + 'onmouseover="this.style.transform=\'translateX(3px)\'" onmouseout="this.style.transform=\'\'" '
        + 'onclick="openTimelineEventDetail(' + ev.id + ')">'
        + '<div style="display:flex;align-items:flex-start;gap:6px">'
        + '<div style="flex:1">'
        + '<div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:2px">' + esc(ev.title) + '</div>'
        + (ev.date ? '<div style="font-size:10px;color:var(--dim)">📅 ' + esc(ev.date) + '</div>' : '')
        + (quest ? '<div style="font-size:10px;color:var(--indigo);margin-top:2px">📜 ' + esc(quest.title) + '</div>' : '')
        + (ev.description ? '<p style="color:var(--muted);font-size:11px;line-height:1.5;margin:4px 0 0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + esc(ev.description) + '</p>' : '')
        + '</div>'
        + '<button onclick="event.stopPropagation();deleteTimelineEvent(' + ev.id + ')" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:11px;padding:0;flex-shrink:0" onmouseover="this.style.color=\'var(--red)\'" onmouseout="this.style.color=\'var(--dim)\'">&#x2715;</button>'
        + '</div></div>';
    }).join('');
    return '<div style="display:flex;flex-direction:column;gap:8px;min-width:220px;max-width:260px">'
      + '<div style="background:' + tp.color + '22;border:1px solid ' + tp.color + '44;border-radius:10px;padding:8px 12px;text-align:center">'
      + '<div style="font-size:18px">' + tp.icon + '</div>'
      + '<div style="font-weight:700;font-size:12px;color:' + tp.color + ';text-transform:uppercase;letter-spacing:.05em">' + type + '</div>'
      + '<div style="font-size:10px;color:var(--dim)">' + byType[type].length + ' évènement(s)</div>'
      + '</div>'
      + '<div style="display:flex;flex-direction:column;gap:8px">' + cards + '</div>'
      + '</div>';
  }).join('');
  return '<div style="overflow-x:auto;padding-bottom:16px"><div style="display:flex;gap:16px;min-width:max-content;align-items:flex-start;padding:4px 0">' + cols + '</div></div>';
}

function openTimelineEventDetail(id) {
  var ev = (DB.timeline||[]).find(function(x){return x.id===id;});
  if(!ev) return;
  var tp = TIMELINE_TYPES[ev.type] || TIMELINE_TYPES.autre;
  var quest = ev.questId ? (DB.quests||[]).find(function(q){return q.id===ev.questId;}) : null;
  var imgHtml = ev.image ? '<img src="'+ev.image+'" style="width:100%;max-height:180px;object-fit:cover;border-radius:8px;margin-bottom:12px">' : '';
  var html = '<div class="modal" onclick="event.stopPropagation()" style="max-width:500px">'
    + '<div class="modal-header" style="border-bottom:2px solid ' + tp.color + '">'
    + '<span class="modal-title">' + tp.icon + ' ' + esc(ev.title) + '</span>'
    + '<button class="modal-close" onclick="closeModal()">&#x2715;</button></div>'
    + '<div class="modal-body">'
    + imgHtml
    + '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">'
    + '<span style="background:' + tp.color + '22;color:' + tp.color + ';padding:2px 10px;border-radius:8px;font-size:11px">' + (ev.type||'autre') + '</span>'
    + (ev.date ? '<span style="background:var(--surface2);color:var(--muted);padding:2px 10px;border-radius:8px;font-size:11px">📅 ' + esc(ev.date) + '</span>' : '')
    + (quest ? '<span style="background:var(--indigo)22;color:var(--indigo);padding:2px 10px;border-radius:8px;font-size:11px">📜 ' + esc(quest.title) + '</span>' : '')
    + '</div>'
    + (ev.description ? '<p style="color:var(--muted);font-family:\'Crimson Pro\',serif;font-size:15px;line-height:1.7;white-space:pre-wrap">' + esc(ev.description) + '</p>' : '<p style="color:var(--dim);font-style:italic">Aucune description.</p>')
    + '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">'
    + '<button class="btn btn-danger btn-sm" onclick="deleteTimelineEvent(' + ev.id + ');closeModal()">🗑️ Supprimer</button>'
    + '<button class="btn btn-outline btn-sm" onclick="closeModal();openTimelineEventModal(' + ev.id + ')">✏️ Modifier</button>'
    + '<button class="btn btn-ghost" onclick="closeModal()">Fermer</button>'
    + '</div></div></div>';
  openModal(html);
}

function renderTimelineHTML(events){
  return `<div style="position:relative;padding-left:28px">
    <!-- Ligne verticale -->
    <div style="position:absolute;left:10px;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,var(--indigo),transparent)"></div>
    ${events.map((ev,i)=>{
      const tp=TIMELINE_TYPES[ev.type]||TIMELINE_TYPES.autre;
      const quest=ev.questId?(DB.quests||[]).find(q=>q.id===ev.questId):null;
      return `
      <div style="position:relative;margin-bottom:18px">
        <!-- Dot -->
        <div style="position:absolute;left:-22px;top:8px;width:14px;height:14px;border-radius:50%;background:${tp.color};border:2px solid var(--bg);display:flex;align-items:center;justify-content:center;font-size:8px;box-shadow:0 0 6px ${tp.color}55"></div>
        <div class="card" style="border-left:3px solid ${tp.color};cursor:pointer;transition:transform .12s" onclick="openTimelineEventDetail(${ev.id})" onmouseover="this.style.transform='translateX(3px)'" onmouseout="this.style.transform=''">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
                <span style="font-size:13px">${tp.icon}</span>
                <span style="font-weight:700;color:var(--text);font-size:14px">${esc(ev.title)}</span>
                ${ev.date?`<span style="color:var(--dim);font-size:11px">📅 ${esc(ev.date)}</span>`:''}
                <span style="background:${tp.color}22;color:${tp.color};padding:1px 8px;border-radius:8px;font-size:10px">${ev.type||'autre'}</span>
                ${quest?`<span style="background:var(--indigo)22;color:var(--indigo);padding:1px 8px;border-radius:8px;font-size:10px">📜 ${esc(quest.title)}</span>`:''}
              </div>
              ${ev.description?`<p style="color:var(--muted);font-family:'Crimson Pro',serif;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${esc(ev.description)}</p>`:''}
            </div>
            <button onclick="event.stopPropagation();deleteTimelineEvent(${ev.id})" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:12px;padding:2px 4px"
              onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--dim)'">✕</button>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function openTimelineEventModal(editId){
  var src = editId ? (DB.timeline||[]).find(function(x){return x.id===editId;}) : null;
  var isEdit = !!src;
  window._editTL = src
    ? JSON.parse(JSON.stringify(src))
    : {id:uid(),title:'',date:'',type:'autre',description:'',questId:null,tlGroupId:_tlGroupFilter||null,image:null};
  var tl = window._editTL;

  var typeOpts = Object.entries(TIMELINE_TYPES).map(function(kv){
    return '<option value="'+kv[0]+'" '+(tl.type===kv[0]?'selected':'')+'>'+kv[1].icon+' '+kv[0]+'</option>';
  }).join('');
  var questOpts = '<option value="">&#x2014; Aucune &#x2014;</option>'
    + (DB.quests||[]).map(function(q){
        return '<option value="'+q.id+'" '+(tl.questId===q.id?'selected':'')+'>'
          +(QUEST_STATUSES[q.status]?QUEST_STATUSES[q.status].icon:'📜')+' '+esc(q.title)+'</option>';
      }).join('');
  var groupOpts = '<option value="">&#x2014; Toutes les timelines &#x2014;</option>'
    + (DB.timelineGroups||[]).map(function(g){
        return '<option value="'+g.id+'" '+(tl.tlGroupId===g.id?'selected':'')+'>'+esc(g.name)+'</option>';
      }).join('');
  var imgPreview = tl.image
    ? '<img src="'+tl.image+'" style="width:80px;height:52px;object-fit:cover;border-radius:5px;border:1px solid var(--border2)" id="tl-img-prev">'
    : '<div id="tl-img-prev" style="width:80px;height:52px;background:var(--surface2);border-radius:5px;border:1px dashed var(--border2);display:flex;align-items:center;justify-content:center;font-size:20px">&#x1F5BC;</div>';

  var html = '<div class="modal" onclick="event.stopPropagation()" style="max-width:500px">'
    + '<div class="modal-header"><span class="modal-title">'+(isEdit?'✏️ Modifier':'⏳ Nouvel')+'&#x20;&#xE9;v&#xE8;nement</span><button class="modal-close" onclick="closeModal()">&#x2715;</button></div>'
    + '<div class="modal-body">'
    + '<div class="grid2">'
    + '<div class="field" style="grid-column:1/-1"><label>Titre *</label><input value="'+esc(tl.title)+'" oninput="window._editTL.title=this.value" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>'
    + '<div class="field"><label>Date en jeu</label><input value="'+esc(tl.date||'')+'" placeholder="Jour 14, Mois des Feux..." oninput="window._editTL.date=this.value" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>'
    + '<div class="field"><label>Type</label><select onchange="window._editTL.type=this.value" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px">'+typeOpts+'</select></div>'
    + '<div class="field" style="grid-column:1/-1"><label>Timeline</label><select onchange="window._editTL.tlGroupId=this.value||null" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px">'+groupOpts+'</select></div>'
    + '<div class="field" style="grid-column:1/-1"><label>Qu&#234;te li&#233;e</label><select onchange="window._editTL.questId=this.value?+this.value:null" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px">'+questOpts+'</select></div>'
    + '</div>'
    + '<div class="field"><label>Description</label><textarea rows="3" oninput="window._editTL.description=this.value" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;resize:vertical;box-sizing:border-box">'+esc(tl.description||'')+'</textarea></div>'
    + '<div class="field"><label>&#x1F5BC; Illustration</label><div style="display:flex;gap:8px;align-items:center">'
    + imgPreview
    + '<label class="btn btn-outline btn-sm" style="cursor:pointer">&#x1F4C1; Choisir<input type="file" accept="image/*" style="display:none" onchange="tlPickImage(event)"></label>'
    + (tl.image ? '<button class="btn btn-ghost btn-xs" onclick="window._editTL.image=null;document.getElementById(\'tl-img-prev\').outerHTML=\'<div id=\\\'tl-img-prev\\\' style=\\\'width:80px;height:52px;background:var(--surface2);border-radius:5px;border:1px dashed var(--border2);display:flex;align-items:center;justify-content:center;font-size:20px\\\'>&#x1F5BC;</div>\'">&#x2715;</button>' : '')
    + '</div></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">'
    + '<button class="btn btn-ghost" onclick="closeModal()">Annuler</button>'
    + (isEdit ? '<button class="btn btn-danger btn-sm" onclick="deleteTimelineEvent('+tl.id+');closeModal()">🗑️</button>' : '')
    + '<button class="btn btn-primary" onclick="saveTimelineEvent('+(isEdit?tl.id:'null')+')">'+(isEdit?'Modifier':'Ajouter')+'</button>'
    + '</div></div></div>';
  openModal(html);
}

function tlPickImage(event) {
  var file = event.target.files[0]; if(!file) return;
  var r = new FileReader();
  r.onload = function(x) {
    window._editTL.image = x.target.result;
    var prev = document.getElementById('tl-img-prev');
    if(prev) { var img = document.createElement('img'); img.src=x.target.result; img.id='tl-img-prev'; img.style='width:80px;height:52px;object-fit:cover;border-radius:5px'; prev.replaceWith(img); }
  };
  r.readAsDataURL(file);
}

function saveTimelineEvent(editId){
  var ev = window._editTL;
  if(!ev.title.trim()){toast('Titre requis');return;}
  if(!DB.timeline) DB.timeline=[];
  if(editId) {
    var idx = DB.timeline.findIndex(function(x){return x.id===editId;});
    if(idx >= 0) DB.timeline[idx] = ev;
  } else {
    ev.createdAt = Date.now();
    DB.timeline.push({...ev});
  }
  save(); closeModal(); renderTimelineTab();
}

function deleteTimelineEvent(id){
  DB.timeline=(DB.timeline||[]).filter(x=>x.id!==id);
  save(); renderTimelineTab();
}


// ══════════════════════════════════════════════════════════════
// ONGLET PLANS (V7.6)
// ══════════════════════════════════════════════════════════════
var selectedPlaneId = null;

function renderPlansTab() {
  var el = document.getElementById('adventure-content');
  var planes = DB.planes || [];
  var sideItems = planes.length === 0
    ? '<div style="color:var(--dim);font-style:italic;text-align:center;padding:20px;font-size:13px">Aucun plan</div>'
    : planes.map(function(p) {
        var pc = p.color || '#6366f1';
        var sel = p.id === selectedPlaneId;
        return '<div onclick="selectedPlaneId=' + p.id + ';renderPlansTab()" style="'
          + 'padding:10px 12px;border-radius:9px;cursor:pointer;'
          + 'background:' + (sel ? 'var(--selected)' : 'var(--surface)') + ';'
          + 'border:1px solid ' + (sel ? 'var(--indigo)' : 'var(--border)') + '">'
          + '<div style="display:flex;align-items:center;gap:8px">'
          + '<span style="font-size:18px">' + (p.icon || '🌀') + '</span>'
          + '<div style="flex:1"><div style="font-weight:600;font-size:13px;color:var(--text)">' + esc(p.name) + '</div>'
          + (p.type ? '<div style="font-size:11px;color:' + pc + '">' + esc(p.type) + '</div>' : '')
          + '</div></div>'
          + ((p.locations && p.locations.length) ? '<div style="font-size:10px;color:var(--dim);margin-top:3px">📍 ' + p.locations.length + ' lieu(x)</div>' : '')
          + '</div>';
      }).join('');

  el.innerHTML = '<div style="display:flex;gap:20px;min-height:70vh">'
    + '<div style="width:240px;flex-shrink:0;display:flex;flex-direction:column;gap:8px">'
    + '<button class="btn btn-primary btn-sm" onclick="openPlaneModal()">+ Nouveau Plan</button>'
    + '<div style="display:flex;flex-direction:column;gap:5px;overflow-y:auto;max-height:65vh">' + sideItems + '</div>'
    + '</div>'
    + '<div style="flex:1;min-width:0">' + renderPlaneDetailHTML(selectedPlaneId) + '</div>'
    + '</div>';
}

function renderPlaneDetailHTML(planeId) {
  var p = (DB.planes || []).find(function(x){ return x.id === planeId; });
  if(!p) return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:400px;color:var(--dim)">'
    + '<div style="font-size:48px;margin-bottom:12px">🌀</div>'
    + '<div style="font-style:italic">Sélectionnez un plan ou créez-en un</div></div>';

  var pc = p.color || '#6366f1';
  var linkedNpcs = (p.npcIds || []).map(function(id){ return (DB.npcs||[]).find(function(n){return n.id===id;}); }).filter(Boolean);
  var unlinkedNpcs = (DB.npcs||[]).filter(function(n){ return !(p.npcIds||[]).includes(n.id); });

  var locHtml = (p.locations && p.locations.length)
    ? p.locations.map(function(loc, i) {
        return '<div style="background:var(--surface2);border-radius:8px;padding:10px 14px;border:1px solid var(--border2);margin-bottom:8px">'
          + '<div style="display:flex;align-items:center;gap:8px">'
          + '<span style="font-size:16px">' + (loc.icon || '📍') + '</span>'
          + '<div style="flex:1"><div style="font-weight:600;font-size:13px;color:var(--text)">' + esc(loc.name) + '</div>'
          + (loc.desc ? '<div style="font-size:12px;color:var(--muted);margin-top:2px">' + esc(loc.desc) + '</div>' : '') + '</div>'
          + '<button onclick="removePlaneLocation(' + p.id + ',' + i + ')" style="background:none;border:none;color:var(--dim);cursor:pointer" onmouseover="this.style.color=\'var(--red)\'" onmouseout="this.style.color=\'var(--dim)\'">&#x2715;</button>'
          + '</div></div>';
      }).join('')
    : '';

  var bgStyle = p.bgImage ? 'position:relative;overflow:hidden;background-image:url(' + JSON.stringify(p.bgImage) + ');background-size:cover;background-position:center' : '';
  var overlay = p.bgImage ? '<div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(6,6,15,0.9),rgba(6,6,15,0.65));z-index:0"></div>' : '';

  return '<div style="display:flex;flex-direction:column;gap:14px">'
    + '<div class="card" style="' + bgStyle + '">' + overlay
    + '<div style="position:relative;z-index:1;display:flex;align-items:flex-start;gap:14px">'
    + '<div style="font-size:44px">' + (p.icon || '🌀') + '</div>'
    + '<div style="flex:1"><div style="font-family:\'Cinzel\',serif;font-weight:900;font-size:22px;color:var(--text);margin-bottom:4px">' + esc(p.name) + '</div>'
    + (p.type ? '<span style="background:' + pc + '22;color:' + pc + ';padding:2px 10px;border-radius:8px;font-size:12px">' + esc(p.type) + '</span>' : '') + '</div>'
    + '<div style="display:flex;flex-direction:column;gap:5px;position:relative;z-index:1">'
    + '<button class="btn btn-outline btn-sm" onclick="openPlaneModal(' + p.id + ')">✏️ Modifier</button>'
    + '<button class="btn btn-danger btn-xs" onclick="deletePlane(' + p.id + ')">Supprimer</button>'
    + '</div></div></div>'
    + (p.description ? '<div class="card"><div style="font-size:10px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">Description</div>'
      + '<p style="color:var(--muted);font-family:\'Crimson Pro\',serif;font-size:15px;line-height:1.75;margin:0;white-space:pre-wrap">' + esc(p.description) + '</p></div>' : '')
    + '<div class="card"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
    + '<div style="font-size:10px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase">📍 Lieux importants</div>'
    + '<button class="btn btn-ghost btn-xs" onclick="openAddPlaneLocation(' + p.id + ')">+ Ajouter</button></div>'
    + (locHtml || '<div style="color:var(--dim);font-style:italic;font-size:13px">Aucun lieu ajouté</div>')
    + '</div>'
    + '<div class="card"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
    + '<div style="font-size:10px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase">🎭 Personnages liés (' + linkedNpcs.length + ')</div>'
    + (unlinkedNpcs.length ? '<select onchange="addNpcToPlane(' + p.id + ',+this.value);this.value=\'\'" style="background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px;font-size:11px"><option value="">+ Ajouter...</option>' + unlinkedNpcs.map(function(n){return '<option value="'+n.id+'">'+(n.avatar||'🎭')+' '+esc(n.name)+'</option>';}).join('') + '</select>' : '')
    + '</div>'
    + (linkedNpcs.length
        ? '<div style="display:flex;flex-wrap:wrap;gap:7px">' + linkedNpcs.map(function(n){
            return '<div style="display:flex;align-items:center;gap:6px;padding:5px 10px;background:var(--surface2);border-radius:8px;font-size:12px">'
              + '<span>' + (n.avatar||'🎭') + '</span><span style="color:var(--text)">' + esc(n.name) + '</span>'
              + '<button onclick="removeNpcFromPlane(' + p.id + ',' + n.id + ')" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:11px" onmouseover="this.style.color=\'var(--red)\'" onmouseout="this.style.color=\'var(--dim)\'">&#x2715;</button>'
              + '</div>';
          }).join('') + '</div>'
        : '<div style="color:var(--dim);font-style:italic;font-size:13px">Aucun PNJ lié</div>')
    + '</div>'
    + (p.notes ? '<div class="card" style="border-color:#78350f"><div style="font-size:10px;color:var(--gold);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">🔒 Notes MJ</div><p style="color:#fcd34d;font-family:\'Crimson Pro\',serif;font-size:15px;line-height:1.7;white-space:pre-wrap">' + esc(p.notes) + '</p></div>' : '')
    + '</div>';
}

function openPlaneModal(editId) {
  var isNew = !editId;
  var src = editId ? (DB.planes||[]).find(function(x){return x.id===editId;}) : null;
  var COLORS = ['#6366f1','#8b5cf6','#3b82f6','#14b8a6','#22c55e','#eab308','#f97316','#ef4444','#ec4899','#60a5fa'];
  var d = {
    id: editId || uid(), name: src?src.name:'', icon: src?(src.icon||'🌀'):'🌀',
    type: src?(src.type||''):'', description: src?(src.description||''):'', notes: src?(src.notes||''):'', color: src?(src.color||'#6366f1'):'#6366f1',
    bgImage: src?(src.bgImage||null):null, locations: src?(src.locations||[]):[],
    npcIds: src?(src.npcIds||[]):[]
  };
  window._editPlane = d;
  var cpicker = COLORS.map(function(c){
    return '<div onclick="window._editPlane.color=\''+c+'\';document.querySelectorAll(\'[data-pp]\').forEach(function(x){x.style.outline=\'none\'});this.style.outline=\'2px solid white\'" data-pp="1" style="width:24px;height:24px;background:'+c+';border-radius:4px;cursor:pointer;display:inline-block;margin:2px;'+(d.color===c?'outline:2px solid white':'')+'"></div>';
  }).join('');
  var html = '<div class="modal" onclick="event.stopPropagation()" style="max-width:520px">'
    + '<div class="modal-header"><span class="modal-title">'+(isNew?'+ Nouveau Plan':'&#x270F; Modifier Plan')+'</span><button class="modal-close" onclick="closeModal()">&#x2715;</button></div>'
    + '<div class="modal-body">'
    + '<div class="grid2">'
    + '<div class="field"><label>Ic&#244;ne</label><input value="'+esc(d.icon)+'" oninput="window._editPlane.icon=this.value" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;text-align:center;font-size:22px;box-sizing:border-box"></div>'
    + '<div class="field"><label>Nom *</label><input value="'+esc(d.name)+'" oninput="window._editPlane.name=this.value" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>'
    + '<div class="field" style="grid-column:1/-1"><label>Type de plan</label><input value="'+esc(d.type)+'" placeholder="Ext&#233;rieur, Plan Mat&#233;riel..." oninput="window._editPlane.type=this.value" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>'
    + '<div class="field" style="grid-column:1/-1"><label>Description</label><textarea rows="3" oninput="window._editPlane.description=this.value" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;resize:vertical;box-sizing:border-box">'+esc(d.description)+'</textarea></div>'
    + '<div class="field" style="grid-column:1/-1"><label>&#x1F512; Notes MJ</label><textarea rows="2" oninput="window._editPlane.notes=this.value" style="width:100%;background:var(--surface2);border:1px solid #78350f;border-radius:6px;color:var(--text);padding:9px;resize:vertical;box-sizing:border-box">'+esc(d.notes)+'</textarea></div>'
    + '<div class="field"><label>Couleur</label><div style="margin-top:4px">'+cpicker+'</div></div>'
    + '<div class="field"><label>&#x1F5BC; Image de fond</label><div style="display:flex;gap:8px;align-items:center;margin-top:4px">'
    + (d.bgImage ? '<img src="'+d.bgImage+'" style="width:60px;height:40px;object-fit:cover;border-radius:5px;border:1px solid var(--border2)">' : '<div style="width:60px;height:40px;background:var(--surface2);border-radius:5px;border:1px dashed var(--border2);display:flex;align-items:center;justify-content:center">&#x1F5BC;</div>')
    + '<label class="btn btn-outline btn-sm" style="cursor:pointer">&#x1F4C1; Choisir<input type="file" accept="image/*" style="display:none" onchange="(function(e){var fi=e.target.files[0];if(!fi)return;var r=new FileReader();r.onload=function(x){window._editPlane.bgImage=x.target.result;savePlane('+(isNew?'null':editId)+');openPlaneModal(window._lastPlaneId||'+editId+');};r.readAsDataURL(fi);})(event)"></label>'
    + (d.bgImage ? '<button class="btn btn-ghost btn-xs" onclick="window._editPlane.bgImage=null">&#x2715;</button>' : '')
    + '</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">'
    + '<button class="btn btn-ghost" onclick="closeModal()">Annuler</button>'
    + (!isNew ? '<button class="btn btn-danger btn-sm" onclick="deletePlane('+editId+')">Supprimer</button>' : '')
    + '<button class="btn btn-primary" onclick="savePlane('+(isNew?'null':editId)+')">Enregistrer</button>'
    + '</div></div></div>';
  openModal(html);
}

function savePlane(editId) {
  var d = window._editPlane;
  if(!d.name.trim()) { toast('Nom requis'); return; }
  if(!DB.planes) DB.planes = [];
  var idx = editId ? DB.planes.findIndex(function(x){return x.id===editId;}) : -1;
  if(idx >= 0) DB.planes[idx] = d;
  else { DB.planes.push(d); window._lastPlaneId = d.id; }
  selectedPlaneId = d.id;
  save(); closeModal(); renderPlansTab();
  toast('&#x2705; Plan enregistr&#233; !');
}

function deletePlane(id) {
  if(!confirm('Supprimer ce plan ?')) return;
  DB.planes = (DB.planes||[]).filter(function(x){return x.id!==id;});
  if(selectedPlaneId === id) selectedPlaneId = null;
  save(); closeModal(); renderPlansTab();
}

function addNpcToPlane(planeId, npcId) {
  var p = (DB.planes||[]).find(function(x){return x.id===planeId;});
  if(!p) return;
  if(!p.npcIds) p.npcIds = [];
  if(!p.npcIds.includes(npcId)) p.npcIds.push(npcId);
  save(); renderPlansTab();
}

function removeNpcFromPlane(planeId, npcId) {
  var p = (DB.planes||[]).find(function(x){return x.id===planeId;});
  if(!p) return;
  p.npcIds = (p.npcIds||[]).filter(function(id){return id!==npcId;});
  save(); renderPlansTab();
}

function openAddPlaneLocation(planeId) {
  window._addLocPlaneId = planeId;
  var html = '<div class="modal" onclick="event.stopPropagation()" style="max-width:400px">'
    + '<div class="modal-header"><span class="modal-title">&#x1F4CD; Ajouter un lieu</span><button class="modal-close" onclick="closeModal()">&#x2715;</button></div>'
    + '<div class="modal-body">'
    + '<div class="field"><label>Ic&#244;ne</label><input id="loc-icon" value="📍" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;text-align:center;font-size:20px;box-sizing:border-box"></div>'
    + '<div class="field"><label>Nom du lieu *</label><input id="loc-name" placeholder="Temple des Ombres..." style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>'
    + '<div class="field"><label>Description</label><textarea id="loc-desc" rows="2" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;resize:vertical;box-sizing:border-box"></textarea></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">'
    + '<button class="btn btn-ghost" onclick="closeModal()">Annuler</button>'
    + '<button class="btn btn-primary" onclick="saveAddPlaneLocation()">Ajouter</button>'
    + '</div></div></div>';
  openModal(html);
}

function saveAddPlaneLocation() {
  var name = document.getElementById('loc-name').value.trim();
  if(!name) { toast('Nom requis'); return; }
  var p = (DB.planes||[]).find(function(x){return x.id===window._addLocPlaneId;});
  if(!p) return;
  if(!p.locations) p.locations = [];
  p.locations.push({
    icon: document.getElementById('loc-icon').value||'📍',
    name: name,
    desc: document.getElementById('loc-desc').value.trim()
  });
  save(); closeModal(); renderPlansTab();
}

function removePlaneLocation(planeId, idx) {
  var p = (DB.planes||[]).find(function(x){return x.id===planeId;});
  if(!p || !p.locations) return;
  p.locations.splice(idx, 1);
  save(); renderPlansTab();
}

// ══════════════════════════════════════════════════════════════
// ONGLET NOTES DE SESSION
// ══════════════════════════════════════════════════════════════
function renderSessionsTab(){
  const el=document.getElementById('adventure-content');
  const sessions=(DB.sessionNotes||[]).slice().sort((a,b)=>(b.session||0)-(a.session||0));

  el.innerHTML=`
  <div style="display:flex;gap:20px;min-height:70vh">
    <!-- SIDEBAR -->
    <div style="width:220px;flex-shrink:0;display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-primary btn-sm" onclick="openSessionModal()">+ Session</button>
      <div style="display:flex;flex-direction:column;gap:5px;overflow-y:auto;max-height:65vh">
        ${sessions.length===0?`<div style="color:var(--dim);font-style:italic;text-align:center;padding:20px;font-size:13px">Aucune session</div>`
        :sessions.map(s=>{
          const sel=s.id===selectedSessionId;
          return `<div onclick="selectedSessionId=\'${s.id}\';renderSessionsTab()" style="
            padding:10px 12px;border-radius:9px;cursor:pointer;
            background:${sel?'var(--selected)':'var(--surface)'};
            border:1px solid ${sel?'var(--indigo)':'var(--border)'}">
            <div style="font-weight:700;color:var(--text);font-size:13px">Session ${s.session||'?'}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px">${esc(s.title||'')}</div>
            ${s.date?`<div style="font-size:10px;color:var(--dim)">${esc(s.date)}</div>`:''}
          </div>`;
        }).join('')}
      </div>
    </div>
    <!-- DETAIL -->
    <div style="flex:1;min-width:0">${renderSessionDetailHTML(selectedSessionId)}</div>
  </div>`;
}

function renderSessionDetailHTML(sessionId){
  const s=(DB.sessionNotes||[]).find(x=>x.id===sessionId);
  if(!s) return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:400px;color:var(--dim)">
    <div style="font-size:48px;margin-bottom:12px">📓</div>
    <div style="font-style:italic">Sélectionnez une session ou créez-en une</div></div>`;

  return `<div class="card" style="height:100%;display:flex;flex-direction:column;gap:10px">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="font-family:'Cinzel',serif;font-weight:900;font-size:18px;color:var(--text)">Session ${s.session||'?'} — ${esc(s.title||'')}</div>
        ${s.date?`<div style="font-size:12px;color:var(--dim)">📅 ${esc(s.date)}</div>`:''}
      </div>
      <div style="display:flex;gap:5px">
        <button class="btn btn-outline btn-sm" onclick="openSessionModal('${s.id}')">✏️ Modifier</button>
        <button class="btn btn-danger btn-xs" onclick="deleteSession('${s.id}')">Supprimer</button>
      </div>
    </div>
    ${s.tags&&s.tags.length?`<div style="display:flex;gap:4px;flex-wrap:wrap">${s.tags.map(t=>`<span style="background:var(--surface2);color:var(--muted);padding:1px 8px;border-radius:8px;font-size:11px">#${esc(t)}</span>`).join('')}</div>`:''}
    <div style="border-top:1px solid var(--border);padding-top:10px;flex:1">
      <p style="color:var(--muted);font-family:'Crimson Pro',serif;font-size:15px;line-height:1.8;white-space:pre-wrap;margin:0">${esc(s.content||'')}</p>
    </div>
  </div>`;
}

function openSessionModal(editId){
  const src=editId?(DB.sessionNotes||[]).find(x=>x.id===editId):null;
  const nextN=Math.max(0,...(DB.sessionNotes||[]).map(s=>s.session||0))+1;
  const s=src?{...src,tags:[...(src.tags||[])]}
             :{id:uid(),session:nextN,title:'',date:new Date().toLocaleDateString('fr-FR'),content:'',tags:[]};
  window._editSession=s;
  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:540px">
  <div class="modal-header"><span class="modal-title">${editId?'✏️ Modifier':'+ Nouvelle'} Session</span>
  <button class="modal-close" onclick="closeModal()">✕</button></div>
  <div class="modal-body">
  <div class="grid2">
    <div class="field"><label>N° Session</label>
    <input type="number" value="${s.session||nextN}" oninput="window._editSession.session=+this.value"
      style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px"></div>
    <div class="field"><label>Date réelle</label>
    <input value="${esc(s.date||'')}" oninput="window._editSession.date=this.value"
      style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>
    <div class="field" style="grid-column:1/-1"><label>Titre</label>
    <input value="${esc(s.title||'')}" oninput="window._editSession.title=this.value"
      style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>
  </div>
  <div class="field"><label>Résumé / Notes</label>
  <textarea rows="8" oninput="window._editSession.content=this.value"
    placeholder="Ce qui s&#39;est passé cette session…"
    style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;resize:vertical;box-sizing:border-box;font-family:\'Crimson Pro\',serif;font-size:15px;line-height:1.7">${esc(s.content||'')}</textarea></div>
  <div class="field"><label>Tags</label>
  <input value="${esc((s.tags||[]).join(', '))}" oninput="window._editSession.tags=this.value.split(',').map(t=>t.trim()).filter(Boolean)"
    placeholder="boss, révélation, perte…"
    style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>
  </div>
  <div class="modal-footer">
  <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
  <button class="btn btn-primary" onclick="saveSession()">Enregistrer</button>
  </div></div>`);
}

function saveSession(){
  const s=window._editSession;
  if(!s.title&&!s.content){toast('Titre ou contenu requis');return;}
  if(!DB.sessionNotes) DB.sessionNotes=[];
  const idx=DB.sessionNotes.findIndex(x=>x.id===s.id);
  if(idx>=0) DB.sessionNotes[idx]={...s};
  else DB.sessionNotes.push({...s});
  selectedSessionId=s.id;
  save(); closeModal(); renderSessionsTab();
}

function deleteSession(id){
  if(!confirm('Supprimer cette note de session ?')) return;
  DB.sessionNotes=(DB.sessionNotes||[]).filter(x=>x.id!==id);
  if(selectedSessionId===id) selectedSessionId=null;
  save(); renderSessionsTab();
}



function toggleTheme(){
  document.body.classList.toggle('light-mode');
  const btn=document.getElementById('theme-btn');
  const isLight=document.body.classList.contains('light-mode');
  if(btn) btn.textContent=isLight?'☀️':'🌙';
  localStorage.setItem('cdp_theme',isLight?'light':'dark');
}
