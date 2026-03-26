/**
 * MODULE JOURNAL
 * Extrait de V7_6.html lignes 5196-5396
 */
// ================================================================
// FIN MODULE INVENTAIRE
// MODULE JOURNAL
// ================================================================
let journalSelectedId = DB.journal[0]?.id||null;
let activeChronicleId = 1; // V6.1 : chronique active

function renderJournal(){
  const el = document.getElementById('module-journal');
  el.innerHTML=`
  <div class="module-header">
    <span style="font-size:26px">📜</span>
    <div><div class="module-title">Journal des Aventures</div><div class="module-bar"></div></div>
    <div style="flex:1"></div>
    <button class="btn btn-primary" onclick="openJournalModal()">+ Nouvelle Entrée</button>
  </div>
  <div style="display:flex;gap:20px;min-height:70vh">
    <div style="width:260px;flex-shrink:0;display:flex;flex-direction:column;gap:8px">
      <input placeholder="🔍 Rechercher..." id="journal-search" oninput="renderJournalSidebar()"
        style="background:var(--surface);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:7px 12px;font-size:13px;width:100%">
      <div id="journal-sidebar" style="overflow-y:auto;max-height:75vh;display:flex;flex-direction:column;gap:6px"></div>
    </div>
    <div style="flex:1;overflow-y:auto" id="journal-content"></div>
  </div>`;
  renderJournalSidebar();
  renderJournalEntry();
}

// → Sidebar filtrée par chronique active
function renderJournalSidebar(){
  const q = (document.getElementById('journal-search')?.value||'').toLowerCase();
  const list = (DB.journal||[]).filter(e=>
    (e.chronicleId===activeChronicleId||(activeChronicleId===1&&!e.chronicleId)) &&
    (!q||(e.title.toLowerCase().includes(q)||e.author.toLowerCase().includes(q)||(e.tags||[]).some(t=>t.includes(q))))
  );
  const el = document.getElementById('journal-sidebar');
  if(!el) return;
  el.innerHTML = list.map(e=>{
    const c=PLANE_COL[e.plane]||'var(--indigo)';
    const sel=journalSelectedId===e.id;
    return `<div onclick="journalSelectedId=${e.id};renderJournalSidebar();renderJournalEntry()" style="
      background:${sel?'var(--selected)':'var(--surface)'};
      border:1px solid ${sel?'var(--indigo)':'var(--border)'};
      border-left:3px solid ${c};border-radius:8px;padding:10px 12px;cursor:pointer">
      <div style="font-family:'Cinzel',serif;font-weight:600;font-size:13px;color:var(--text);margin-bottom:2px">${esc(e.title)}</div>
      <div style="color:var(--dim);font-size:11px">${esc(e.author)} · ${esc(e.date)}</div>
      <div style="color:${c};font-size:11px;margin-top:2px">${esc(e.plane)}</div>
    </div>`;
  }).join('') || `<div style="color:var(--dim);text-align:center;padding:20px;font-style:italic">Aucune entrée</div>`;
}

function renderJournalEntry(){
  const el = document.getElementById('journal-content');
  if(!el) return;
  const entry = DB.journal.find(e=>e.id===journalSelectedId);
  if(!entry){
    el.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--dim)"><div style="font-size:48px;margin-bottom:12px">📜</div><div style="font-style:italic">Sélectionnez une entrée ou créez-en une nouvelle</div></div>`;
    return;
  }
  const pc=PLANE_COL[entry.plane]||'var(--indigo)';
  el.innerHTML=`<div class="parchment" id="journal-content">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
      <div>
        <h2 class="journal-entry-title">${esc(entry.title)}</h2>
        <div class="journal-meta" style="display:flex;gap:14px;flex-wrap:wrap">
          <span>✍️ ${entry.authorId?`<a href="#" onclick="selectMember(${entry.authorId});switchModule('members',document.querySelector('[data-module=members]'));return false;" style="color:#a5b4fc;text-decoration:none">${esc(entry.author)}</a>`:esc(entry.author)}</span>
          <span>📅 ${esc(entry.date)}</span>
          <span style="color:${pc}">🌀 ${esc(entry.plane)}</span>
        </div>
        ${(entry.participants||[]).length?`
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
          <span style="color:var(--dim);font-size:11px;align-self:center">Participants :</span>
          ${entry.participants.map(pid=>{const pm=DB.members.find(x=>x.id===pid);return pm?`
            <a href="#" onclick="selectMember(${pm.id});switchModule('members',document.querySelector('[data-module=members]'));return false;"
              style="background:var(--surface2);color:#a5b4fc;padding:2px 8px;border-radius:4px;font-size:11px;border:1px solid var(--border2);text-decoration:none;display:flex;align-items:center;gap:4px">
              ${pm.avatar} ${esc(pm.name)}
            </a>`:'';}).join('')}
        </div>`:''}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="btn btn-outline btn-sm" onclick="openJournalModal(${entry.id})" style="color:#a07850;border-color:#78350f55">✏️ Modifier</button>
        <button class="btn btn-danger btn-xs" onclick="deleteJournalEntry(${entry.id})">Supprimer</button>
      </div>
    </div>
    <div class="journal-entry-text">${esc(entry.content)}</div>
    ${(entry.tags||[]).length?`<div class="journal-tags">${entry.tags.map(t=>`<span class="journal-tag">#${esc(t)}</span>`).join('')}</div>`:''}
    <div style="position:absolute;bottom:20px;right:24px;font-size:40px;opacity:.04;pointer-events:none;z-index:0">🌀</div>
  </div>`;
}


// ── GESTION DES CHRONIQUES ─────────────────────────────────────
function openChronicleModal(){
  const chronicles = DB.chronicles||[];
  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:440px">
    <div class="modal-header">
      <span class="modal-title">📚 Chroniques</span>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div id="chronicle-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">
        ${chronicles.map(ch=>`
          <div style="display:flex;align-items:center;gap:8px;background:var(--surface2);padding:8px 12px;border-radius:7px;border-left:3px solid ${ch.color}">
            <span style="font-size:16px">${ch.icon||'📜'}</span>
            <span style="flex:1;font-weight:600;color:var(--text)">${esc(ch.title)}</span>
            <span style="font-size:11px;color:var(--dim)">${(DB.journal||[]).filter(e=>e.chronicleId===ch.id).length} entrée(s)</span>
            ${chronicles.length>1?`<button onclick="deleteChronicle(${ch.id})" class="btn btn-danger btn-xs">✕</button>`:''}
          </div>`).join('')}
      </div>
      <div style="border-top:1px solid var(--border);padding-top:12px">
        <div style="font-size:11px;color:var(--dim);margin-bottom:8px">Nouvelle chronique</div>
        <div style="display:flex;gap:6px">
          <input id="new-chronicle-title" placeholder="Titre de la chronique…"
            style="flex:1;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:7px 10px">
          <input type="color" id="new-chronicle-color" value="#6366f1"
            style="width:38px;height:36px;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;cursor:pointer">
          <button class="btn btn-primary btn-sm" onclick="addChronicle()">+ Créer</button>
        </div>
      </div>
    </div>
  </div>`);
}

function addChronicle(){
  const title = document.getElementById('new-chronicle-title')?.value?.trim();
  const color = document.getElementById('new-chronicle-color')?.value||'#6366f1';
  if(!title){ toast('Titre requis'); return; }
  if(!DB.locations) DB.locations=[];
  if(!DB.chronicles) DB.chronicles=[];
  const id = uid();
  DB.chronicles.push({id, title, color, icon:'📜'});
  save(); closeModal();
  activeChronicleId = id;
  renderJournal();
}

function deleteChronicle(id){
  if(!confirm('Supprimer cette chronique ? Les entrées seront déplacées vers la chronique principale.')) return;
  if(!DB.locations) DB.locations=[];
  if(!DB.chronicles) return;
  // Move entries to chronicle 1
  (DB.journal||[]).forEach(e=>{ if(e.chronicleId===id) e.chronicleId=1; });
  DB.chronicles = DB.chronicles.filter(ch=>ch.id!==id);
  if(activeChronicleId===id) activeChronicleId=1;
  save(); closeModal(); renderJournal();
}

function openJournalModal(editId){
  const src = editId ? DB.journal.find(e=>e.id===editId) : null;
  const entry = src ? JSON.parse(JSON.stringify(src)) : {id:uid(),title:'',date:'',author:'',authorId:null,chronicleId:activeChronicleId,plane:'Plan Matériel',content:'',tags:[],participants:[]};
  window._editEntry = entry;
  openModal(`<div class="modal modal-wide" onclick="event.stopPropagation()">
    <div class="modal-header"><span class="modal-title">${editId?'✏️ Modifier l\'entrée':'📜 Nouvelle Entrée'}</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="grid2">
        <div class="field"><label>Titre</label><input value="${esc(entry.title)}" oninput="window._editEntry.title=this.value" placeholder="Les Portes du Néant..."></div>
        <div class="field"><label>Date (univers)</label><input value="${esc(entry.date)}" oninput="window._editEntry.date=this.value" placeholder="Jour 7, Mois du Soleil Noir"></div>
        <div class="field"><label>Auteur (texte libre)</label><input id="journal-author-input" value="${esc(entry.author)}" oninput="window._editEntry.author=this.value" placeholder="Nom du personnage..."></div>
        <div class="field"><label>Auteur (lien perso)</label>
          <select onchange="const v=this.value;window._editEntry.authorId=v===''?null:+v;if(v){const m=DB.members.find(x=>x.id===+v);if(m){window._editEntry.author=m.name;const inp=document.getElementById('journal-author-input');if(inp)inp.value=m.name;}}";if(m)document.querySelector('[data-author-text]').value=m.name;window._editEntry.author=m?.name||window._editEntry.author;}">
            <option value="">— Libre —</option>
            ${DB.members.map(m=>`<option value="${m.id}"${entry.authorId===m.id?' selected':''}>${m.avatar} ${esc(m.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Plan</label><select onchange="window._editEntry.plane=this.value">${getPlanes().map(p=>`<option${p===entry.plane?' selected':''}>${p}</option>`).join('')}</select></div>
      </div>
      <div class="field">
        <label>Participants (cocher les PJ/PNJ présents)</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
          ${DB.members.map(m=>`
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;padding:5px 10px;font-size:13px;color:var(--text)">
              <input type="checkbox" ${(entry.participants||[]).includes(m.id)?'checked':''} onchange="const p=window._editEntry.participants||[];const id=${m.id};if(this.checked){if(!p.includes(id))p.push(id);}else{const i=p.indexOf(id);if(i>=0)p.splice(i,1);}window._editEntry.participants=p;" style="width:14px;height:14px">
              ${m.avatar} ${esc(m.name)}
            </label>`).join('')}
        </div>
      </div>
      <div class="field"><label>Récit</label><textarea rows="10" oninput="window._editEntry.content=this.value" placeholder="Racontez vos aventures...">${esc(entry.content)}</textarea></div>
      <div class="field"><label>Tags (séparés par des virgules)</label><input value="${(entry.tags||[]).join(', ')}" oninput="window._editEntry.tags=this.value.split(',').map(t=>t.trim().toLowerCase()).filter(Boolean)" placeholder="combat, trésor, mystère..."></div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="saveJournalEntry(${editId||'null'})">${editId?'Sauvegarder':'Publier'}</button>
      </div>
    </div>
  </div>`);
}

function saveJournalEntry(editId){
  const entry = window._editEntry;
  if(!entry||!entry.title.trim()) return;
  if(editId&&editId!=='null') DB.journal=DB.journal.map(e=>e.id===editId?entry:e);
  else { DB.journal.unshift(entry); journalSelectedId=entry.id; }
  save(); closeModal(); renderJournal(); toast('Entrée sauvegardée !');
}

function deleteJournalEntry(id){
  if(!confirm('Supprimer cette entrée ?')) return;
  DB.journal=DB.journal.filter(e=>e.id!==id);
  journalSelectedId=DB.journal[0]?.id||null;
  save(); renderJournal();
}

