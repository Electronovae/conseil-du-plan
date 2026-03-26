/**
 * MODULE AVENTURIERS — renderMembers, renderMemberDetail
 * Extrait de V7_6.html lignes 1643-3312
 */
// ================================================================
// ================================================================
// MODULE AVENTURIERS
// ================================================================
// Architecture: _editMember est le seul état en mémoire pendant
// l'édition. Les sous-modales (sorts, items) modifient directement
// _editMember.spells et _editMember.inventory SANS relancer
// openMemberModal() — seul refreshSpellList()/refreshMemberInvList()
// est appelé pour mettre à jour l'affichage in-place.
// ================================================================

let selectedMemberId = DB.members[0]?.id || null;

// --- Couleur par école de magie ---
const SCHOOL_COLOR = {
  "Abjuration":"#60a5fa","Conjuration":"#4ade80","Divination":"#a78bfa",
  "Enchantement":"#f472b6","Évocation":"#fb923c","Illusion":"#818cf8",
  "Invocation":"#f59e0b","Nécromancie":"#6b7280","Transmutation":"#34d399"
};

// --- Compétences D&D 5e ---
const SKILLS = [
  {name:"Acrobaties",  attr:"dex"}, {name:"Arcanes",      attr:"int"},
  {name:"Athlétisme",  attr:"str"}, {name:"Discrétion",   attr:"dex"},
  {name:"Dressage",    attr:"wis"}, {name:"Escamotage",   attr:"dex"},
  {name:"Histoire",    attr:"int"}, {name:"Intimidation", attr:"cha"},
  {name:"Investigation",attr:"int"},{name:"Médecine",     attr:"wis"},
  {name:"Nature",      attr:"int"}, {name:"Perception",   attr:"wis"},
  {name:"Perspicacité",attr:"wis"}, {name:"Persuasion",   attr:"cha"},
  {name:"Religion",    attr:"int"}, {name:"Représentation",attr:"cha"},
  {name:"Survie",      attr:"wis"}, {name:"Tromperie",    attr:"cha"}
];
const SAVES = ["str","dex","con","int","wis","cha"];
const SAVE_LABELS = {str:"FOR",dex:"DEX",con:"CON",int:"INT",wis:"SAG",cha:"CHA"};

// === RENDER LISTE ===
function renderMembers(){
  const el = document.getElementById('module-members');
  el.innerHTML = `
    <div class="module-header">
      <span style="font-size:26px">⚔️</span>
      <div><div class="module-title">Aventuriers</div><div class="module-bar"></div></div>
      <div style="flex:1"></div>
      <button class="btn btn-primary" onclick="openMemberModal()">+ Recruter</button>
    </div>
    <div style="display:flex;gap:20px;min-height:70vh">
      <div style="width:230px;flex-shrink:0;display:flex;flex-direction:column;gap:8px;overflow-y:auto;max-height:80vh" id="member-list"></div>
      <div style="flex:1;overflow-y:auto" id="member-detail"></div>
    </div>`;
  renderMemberList();
  renderMemberDetail();
}

let memberSortBy = 'default';
let npcSortBy = 'default'; let npcSearch = ''; let npcStatusFilter = '';
let beastSortBy = 'default';
function renderMemberList(){
  const list = document.getElementById('member-list');
  if(!list) return;
  let members = [...DB.members];
  if(memberSortBy==='name') members.sort((a,b)=>a.name.localeCompare(b.name));
  else if(memberSortBy==='level') members.sort((a,b)=>b.level-a.level);
  else if(memberSortBy==='class') members.sort((a,b)=>a.clazz.localeCompare(b.clazz));
  const sortBtns = `<div style="display:flex;gap:3px;margin-bottom:8px;flex-wrap:wrap">
    ${[['default','⚔️'],['name','A→Z'],['level','Niv'],['class','Cls']].map(([v,l])=>
      `<button onclick="memberSortBy='${v}';renderMemberList()" class="btn btn-xs ${memberSortBy===v?'btn-primary':'btn-ghost'}">${l}</button>`
    ).join('')}
  </div>`;
  list.innerHTML = sortBtns + members.map(m=>`
    <div class="member-card${selectedMemberId===m.id?' active':''}"
      onclick="selectMember(${m.id})"
      style="border-left:3px solid ${PLANE_COL[m.plane]||'var(--indigo)'}">
      <div class="member-card-body" style="display:flex;align-items:center;gap:10px">
        ${avatarEl(m,44)}
        <div style="flex:1;min-width:0">
          <div style="font-family:'Cinzel',serif;font-weight:700;font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.name)}</div>
          <div style="color:var(--muted);font-size:11px">${esc(m.clazz)} · Niv.${m.level}${m.isNpc?' · <span style="color:var(--purple)">PNJ</span>':''}</div>
        </div>
      </div>
    </div>`).join('')
  + `<button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center" onclick="openMemberModal()">+ Recruter</button>`;
}

function selectMember(id){
  selectedMemberId = id;
  renderMemberList();
  renderMemberDetail();
}

// === FICHE DÉTAILLÉE ===
function renderMemberDetail(){
  const el = document.getElementById('member-detail');
  if(!el) return;
  const m = DB.members.find(x=>x.id===selectedMemberId);
  if(!m){
    el.innerHTML=`<div style="display:flex;align-items:center;justify-content:center;height:300px;color:var(--dim);font-style:italic">Sélectionnez un aventurier</div>`;
    return;
  }
  const pc = PLANE_COL[m.plane]||'var(--indigo)';

  // Tabs for detail view
  const detailTabs = ['📋 Résumé','✨ Sorts','🎯 Capacités','🎒 Inventaire','🏦 Coffre','📖 Lore','🏆 Chasse','📄 PDF'];
  const activeDetailTab = window._memberDetailTab || 0;

  el.innerHTML = `
  <div style="display:flex;flex-direction:column;gap:16px">
    <!-- TOP BAR -->
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;align-items:flex-start;gap:18px">
      ${avatarEl(m,72)}
      <div style="flex:1">
        <div style="font-family:'Cinzel',serif;font-weight:900;font-size:22px;color:var(--text)">${esc(m.name)}${m.isNpc?` <span style="font-size:12px;background:#7c3aed22;color:#a78bfa;padding:2px 8px;border-radius:4px;border:1px solid #7c3aed33">PNJ</span>`:''}</div>
        <div style="color:var(--muted);font-size:14px;margin-bottom:8px">${esc(m.clazz)} — Niveau <span style="color:var(--gold);font-weight:900">${m.level}</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${planeTag(m.plane)}
          <span style="background:var(--surface2);color:var(--muted);padding:3px 10px;border-radius:4px;font-size:12px">🛡️ CA ${m.ac||'—'}</span>
          <span style="background:var(--surface2);color:var(--muted);padding:3px 10px;border-radius:4px;font-size:12px">❤️ PV ${m.hp?.current||0}/${m.hp?.max||0}</span>
          <span style="background:var(--surface2);color:var(--muted);padding:3px 10px;border-radius:4px;font-size:12px">⚡ Init. ${m.initiative||'+0'}</span>
          <span style="background:var(--surface2);color:var(--muted);padding:3px 10px;border-radius:4px;font-size:12px">🎯 Maîtrise +${m.profBonus||2}</span>
          ${(()=>{const cc=calcCarryCapacity(m);const over=cc.used>cc.capacity;return `<span style="background:${over?'#ef444422':'var(--surface2)'};color:${over?'#ef4444':'var(--muted)'};padding:3px 10px;border-radius:4px;font-size:12px;border:1px solid ${over?'#ef444444':'transparent'};cursor:pointer" onclick="window._memberDetailTab=3;renderMemberDetail()" title="Voir l'inventaire">🎒 ${cc.used}/${cc.capacity} cases</span>`;})()} 
          ${m.gold?`<span style="background:#fbbf2418;color:var(--gold);padding:3px 10px;border-radius:4px;font-size:12px;border:1px solid #fbbf2433">💰 ${m.gold.po||0} PO</span>`:''}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <button class="btn btn-outline btn-sm" onclick="openMemberModal(${m.id})">✏️ Modifier</button>
        <button class="btn btn-danger btn-xs" onclick="deleteMember(${m.id})">Retirer</button>
        ${m.isNpc&&m.linkedNpcId?`<button class="btn btn-ghost btn-xs" onclick="goToNpc(${m.linkedNpcId})">🎭 Fiche PNJ</button>`:''}
      </div>
    </div>

    <!-- DETAIL TABS -->
    <div style="display:flex;gap:4px;border-bottom:1px solid var(--border);padding-bottom:0;align-items:flex-end;flex-wrap:wrap">
      ${detailTabs.map((t,i)=>`<button class="btn btn-sm ${i===activeDetailTab?'btn-primary':'btn-ghost'}" onclick="window._memberDetailTab=${i};renderMemberDetail()" style="border-radius:6px 6px 0 0">${t}</button>`).join('')}
      <button class="btn btn-ghost btn-xs" style="margin-left:auto;font-size:11px;opacity:.7;margin-bottom:2px"
        onclick="generatePrintSheet(DB.members.find(x=>x.id===${m.id}))" title="Imprimer / Exporter PDF">🖨️ PDF</button>
    </div>

    <!-- TAB CONTENT -->
    <div id="member-detail-content"></div>
  </div>`;

  // Render the active tab
  const content = document.getElementById('member-detail-content');
  if(activeDetailTab===0) content.innerHTML = renderMemberSummary(m);
  else if(activeDetailTab===1) content.innerHTML = renderMemberSpells(m);
  else if(activeDetailTab===2) content.innerHTML = renderMemberCapacities(m);
  else if(activeDetailTab===3) content.innerHTML = renderMemberInventoryView(m);
  else if(activeDetailTab===4) content.innerHTML = renderMemberGuildChest(m);
  else if(activeDetailTab===5) content.innerHTML = renderMemberLore(m);
  else if(activeDetailTab===6) content.innerHTML = renderMemberKills(m);
  else if(activeDetailTab===7) content.innerHTML = renderMemberPDF(m);

  // V6 : activer le drag LEGO sur les panneaux du résumé
  if(activeDetailTab===0){
    document.querySelectorAll('.v6-panel').forEach(panel=>{
      const handle = panel.querySelector('.v6-panel-handle');
      if(!handle) return;
      handle.addEventListener('mousedown', ()=>{ panel.setAttribute('draggable','true'); });
      panel.addEventListener('dragstart', ev=>{
        const pid  = panel.dataset.panel;
        const mid  = +panel.dataset.mid;
        panelDragStart(ev, pid, mid);
        panel.classList.add('dragging');
      });
      panel.addEventListener('dragend', ev=>{
        panel.classList.remove('dragging');
        panel.setAttribute('draggable','false');
      });
    });
    document.querySelectorAll('.v6-drop-col').forEach(col=>{
      col.addEventListener('dragover', ev=>{
        ev.preventDefault();
        col.classList.add('drag-over');
      });
      col.addEventListener('dragleave', ()=>col.classList.remove('drag-over'));
      col.addEventListener('drop', ev=>{
        col.classList.remove('drag-over');
        const mid = +col.dataset.mid;
        const colName = col.dataset.col;
        if(mid && colName) panelDrop(ev, colName, mid);
      });
    });
  }
}

function goToMemberFromNpc(npcId){
  const m=DB.members.find(x=>x.linkedNpcId===npcId);
  if(!m) return;
  selectedMemberId=m.id;
  switchModule('members',document.querySelector('[data-module=members]'));
  renderMembers(); renderMemberDetail();
}
function goToNpc(npcId){
  selectedNpcId=npcId;
  switchModule('npcs',document.querySelector('[data-module=npcs]'));
}

// ── RÉSUMÉ PERSONNAGE : tout éditable inline (V6) ─────────────────────────────
// Les champs envoient leurs modifications directement à DB via updateMemberField()
function renderMemberSummary(m){

  // → Raccourci : met à jour un champ imbriqué et sauvegarde
  // path ex: 'stats.str' | 'hp.current' | 'gold.po' | 'race'
  // Exposé globalement pour les oninput inline
  window._umf = window.updateMemberField;

  const mid = m.id;

  // → Génère un input numérique inline sauvegardant sur changement
  const numInput = (path, val, opts='') =>
    `<input type="number" value="${+val||0}" ${opts}
      onchange="updateMemberField(${mid},'${path}',+this.value)"
      style="width:100%;background:transparent;border:none;border-bottom:1px solid var(--border2);
        color:var(--text);font-size:inherit;font-weight:inherit;text-align:center;
        padding:2px;border-radius:0;outline:none;min-width:0"
      onfocus="this.style.borderBottomColor='var(--indigo)'"
      onblur="this.style.borderBottomColor='var(--border2)'">`;

  // → Génère un input texte inline
  const txtInput = (path, val, placeholder='', style='') =>
    `<input type="text" value="${esc(val||'')}" placeholder="${esc(placeholder)}"
      onchange="updateMemberField(${mid},'${path}',this.value)"
      style="background:transparent;border:none;border-bottom:1px solid var(--border2);
        color:var(--text);font-size:inherit;outline:none;width:100%;${style}"
      onfocus="this.style.borderBottomColor='var(--indigo)'"
      onblur="this.style.borderBottomColor='var(--border2)'">`;

  // → Panneau draggable (LEGO V6) — chaque card peut être réordonnée
  const panelOrder = m.panelOrder&&m.panelOrder.length
    ? m.panelOrder
    : ['identity','stats','saves','skills','resources','purse','weapons','gear','lore','proficiencies'];

  // ── PANNEAU : IDENTITÉ ÉTENDUE ───────────────────────────────
  const panelIdentity = `<div class="card v6-panel" data-panel="identity" data-mid="${mid}">
    <div class="v6-panel-handle" title="Glisser pour réordonner">⠿</div>
    <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">
      👤 Identité
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div>
        <div style="font-size:10px;color:var(--dim);text-transform:uppercase;margin-bottom:3px">Race</div>
        <select onchange="updateMemberField(${mid},'race',this.value)"
          style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);font-size:12px;padding:4px 6px">
          <option value="">— non défini —</option>
          ${RACES_5E.map(r=>`<option value="${r}"${m.race===r?' selected':''}>${r}</option>`).join('')}
        </select>
      </div>
      <div>
        <div style="font-size:10px;color:var(--dim);text-transform:uppercase;margin-bottom:3px">Alignement</div>
        <select onchange="updateMemberField(${mid},'alignment',this.value)"
          style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);font-size:12px;padding:4px 6px">
          <option value="">— non défini —</option>
          ${ALIGNMENTS.map(a=>`<option value="${a}"${m.alignment===a?' selected':''}>${a}</option>`).join('')}
        </select>
      </div>
      <div>
        <div style="font-size:10px;color:var(--dim);text-transform:uppercase;margin-bottom:3px">Historique</div>
        ${txtInput('background', m.background, 'Voyageur, Noble…', 'font-size:12px')}
      </div>
      <div>
        <div style="font-size:10px;color:var(--dim);text-transform:uppercase;margin-bottom:3px">Âge</div>
        ${txtInput('age', m.age, '24 ans…', 'font-size:12px')}
      </div>
    </div>
  </div>`;

  // ── PANNEAU : CARACTÉRISTIQUES (stats inline) ──────────────────
  const panelStats = `<div class="card v6-panel" data-panel="stats" data-mid="${mid}">
    <div class="v6-panel-handle" title="Glisser pour réordonner">⠿</div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase">⚔️ Caractéristiques</div>
      <div style="display:flex;gap:8px;align-items:center">
        <span style="font-size:11px;color:var(--dim)">
          Bonus de maîtrise : <input type="number" value="${m.profBonus||2}" min="2" max="6"
            onchange="updateMemberField(${mid},'profBonus',+this.value)"
            style="width:36px;background:var(--surface2);border:1px solid var(--border2);border-radius:4px;
              color:var(--gold);font-weight:700;font-size:12px;text-align:center;padding:2px">
        </span>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">
      ${ABILITIES.map(a=>{
        const val = m.stats?.[a.key]||10;
        const modVal = mod(val);
        return `<div class="stat-score" style="position:relative">
          <div style="font-size:10px;color:var(--dim);text-align:center;margin-bottom:4px;font-weight:700;letter-spacing:.05em">${a.name}</div>
          <input type="number" value="${val}" min="1" max="30"
            onchange="updateMemberField(${mid},'stats.${a.key}',+this.value)"
            style="width:100%;background:var(--surface2);border:2px solid var(--border2);border-radius:8px;
              color:var(--text);font-size:22px;font-weight:900;text-align:center;padding:8px 4px;
              outline:none;transition:border-color .15s"
            onfocus="this.style.borderColor='var(--indigo)'"
            onblur="this.style.borderColor='var(--border2)'">
          <div style="text-align:center;font-size:14px;font-weight:700;color:${modVal>=0?'var(--green)':'var(--red)'};margin-top:4px">
            ${modStr(val)}
          </div>
        </div>`;
      }).join('')}
    </div>
    ${(()=>{
      const eb=getEquipBonuses(m);
      const parts=[];
      if(eb.ac)  parts.push('🛡️ CA '+(eb.ac>=0?'+':'')+eb.ac);
      if(eb.dex) parts.push('🎯 DEX '+(eb.dex>=0?'+':'')+eb.dex);
      if(eb.str) parts.push('💪 FOR '+(eb.str>=0?'+':'')+eb.str);
      if(eb.speed.length) parts.push('💨 Vit. '+eb.speed.join(', '));
      eb.free.forEach(f=>parts.push('✨ '+f));
      return parts.length?`<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:5px">
        ${parts.map(p=>`<span style="font-size:11px;color:var(--indigo);background:var(--indigo)15;padding:2px 7px;border-radius:10px">${p}</span>`).join('')}
      </div>`:'';
    })()}
    <!-- Ligne CA / PV / Init / Vitesse -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:12px">
      ${[
        ['ac','CA','🛡️'],
        ['hp.current','PV','❤️'],
        ['hp.max','PV max','💖'],
        ['initiative','Init.','🎲'],
      ].map(([path,label,ico])=>{
        const isInit = path==='initiative';
        const rawVal = path==='hp.current'?(m.hp?.current??10):path==='hp.max'?(m.hp?.max??10):(m.ac??10);
        return `<div style="background:var(--surface2);border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:10px;color:var(--dim);margin-bottom:4px">${ico} ${label}</div>
          ${isInit
            ? `<input type="text" value="${esc(m.initiative||'+0')}"
                onchange="updateMemberField(${mid},'initiative',this.value)"
                style="width:100%;background:transparent;border:none;color:var(--text);font-size:18px;font-weight:900;text-align:center;outline:none">`
            : `<input type="number" value="${rawVal}"
                onchange="updateMemberField(${mid},'${path}',+this.value)"
                style="width:100%;background:transparent;border:none;color:${path==='hp.current'?'var(--red)':'var(--text)'};font-size:18px;font-weight:900;text-align:center;outline:none">`
          }
        </div>`;
      }).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">
      <div style="background:var(--surface2);border-radius:8px;padding:8px;text-align:center">
        <div style="font-size:10px;color:var(--dim);margin-bottom:4px">🏃 Vitesse</div>
        <input type="text" value="${esc(m.speed||'9m')}"
          onchange="updateMemberField(${mid},'speed',this.value)"
          style="width:100%;background:transparent;border:none;color:var(--text);font-size:16px;font-weight:900;text-align:center;outline:none">
      </div>
      <div style="background:var(--surface2);border-radius:8px;padding:8px;text-align:center">
        <div style="font-size:10px;color:var(--dim);margin-bottom:4px">📊 Niveau</div>
        <input type="number" value="${m.level||1}" min="1" max="20"
          onchange="updateMemberField(${mid},'level',+this.value)"
          style="width:100%;background:transparent;border:none;color:var(--gold);font-size:16px;font-weight:900;text-align:center;outline:none">
      </div>
    </div>
  </div>`;

  // ── PANNEAU : JETS DE SAUVEGARDE ───────────────────────────────
  // → Clic sur le point = toggle maîtrise, valeur recalculée en temps réel
  const panelSaves = `<div class="card v6-panel" data-panel="saves" data-mid="${mid}">
    <div class="v6-panel-handle" title="Glisser pour réordonner">⠿</div>
    <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">
      🎯 Jets de sauvegarde
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 12px">
      ${SAVES.map(k=>{
        const prof = (m.saveProficiencies||[]).includes(k);
        const bonus = mod(m.stats?.[k]||10)+(prof?(m.profBonus||2):0);
        const modVal = mod(m.stats?.[k]||10);
        const tooltip = prof
          ? `Mod. ${SAVE_LABELS[k]} (${modStr(modVal)}) + Maîtrise (+${m.profBonus||2}) = ${bonus>=0?'+':''}${bonus}`
          : `Mod. ${SAVE_LABELS[k]} = ${modStr(modVal)} (sans maîtrise)`;
        return `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer"
          onclick="toggleSaveProficiency(${mid},'${k}')"
          title="${tooltip}">
          <span style="width:11px;height:11px;border-radius:50%;flex-shrink:0;border:2px solid var(--indigo);
            background:${prof?'var(--indigo)':'transparent'};transition:background .15s;display:block"></span>
          <span style="color:var(--muted);font-size:12px;flex:1">${SAVE_LABELS[k]}</span>
          <span style="color:${bonus>=0?'var(--green)':'var(--red)'};font-weight:700;font-size:13px">${bonus>=0?'+':''}${bonus}</span>
          <span style="font-size:10px;color:var(--dim)" title="${tooltip}">ℹ</span>
        </div>`;
      }).join('')}
    </div>
    <div style="font-size:10px;color:var(--dim);margin-top:8px">Clic sur le point = toggle maîtrise</div>
  </div>`;

  // ── PANNEAU : COMPÉTENCES ──────────────────────────────────────
  // → Clic simple = maîtrise (indigo), double-clic = expertise (or)
  const panelSkills = `<div class="card v6-panel" data-panel="skills" data-mid="${mid}">
    <div class="v6-panel-handle" title="Glisser pour réordonner">⠿</div>
    <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">
      🎓 Compétences
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 12px">
      ${SKILLS.map(sk=>{
        const prof = (m.skillProficiencies||[]).includes(sk.name);
        const exp  = (m.skillExpertise||[]).includes(sk.name);
        const bonus = mod(m.stats?.[sk.attr]||10)+(exp?(m.profBonus||2)*2:prof?(m.profBonus||2):0);
        const tooltip = exp
          ? `Expertise : Mod.+2×Maîtrise = ${bonus>=0?'+':''}${bonus}`
          : prof
          ? `Maîtrise : Mod.+Maîtrise = ${bonus>=0?'+':''}${bonus}`
          : `Sans maîtrise : Mod. seulement = ${bonus>=0?'+':''}${bonus}`;
        const dotCol = exp?'var(--gold)':prof?'var(--indigo)':'transparent';
        const dotBorder = exp?'var(--gold)':prof?'var(--indigo)':'var(--border2)';
        return `<div style="display:flex;align-items:center;gap:5px;padding:3px 0;cursor:pointer"
          title="${tooltip}"
          onclick="toggleSkillProficiency(${mid},'${sk.name}')"
          ondblclick="toggleSkillExpertise(${mid},'${sk.name}');event.preventDefault()">
          <span style="width:9px;height:9px;border-radius:50%;flex-shrink:0;border:2px solid ${dotBorder};
            background:${dotCol};transition:all .15s;display:block"></span>
          <span style="color:var(--muted);font-size:11px;flex:1">${sk.name}</span>
          <span style="font-size:9px;color:var(--dim)">${sk.attr.toUpperCase()}</span>
          <span style="color:${bonus>=0?'var(--green)':'var(--red)'};font-weight:700;font-size:12px">${bonus>=0?'+':''}${bonus}</span>
        </div>`;
      }).join('')}
    </div>
    <div style="font-size:10px;color:var(--dim);margin-top:6px">🟣 clic = maîtrise · 🟡 double-clic = expertise</div>
  </div>`;

  // ── PANNEAU : RESSOURCES LIMITÉES ─────────────────────────────
  const resources = m.resources||[];
  const panelResources = `<div class="card v6-panel" data-panel="resources" data-mid="${mid}">
    <div class="v6-panel-handle" title="Glisser pour réordonner">⠿</div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase">⚡ Ressources</div>
      <div style="display:flex;gap:5px">
        <button class="btn btn-xs btn-outline" onclick="doRest(${mid},'court')" title="Repos court">⏳ Court</button>
        <button class="btn btn-xs btn-outline" onclick="doRest(${mid},'long')"  title="Repos long">🌙 Long</button>
        <button class="btn btn-xs btn-ghost"   onclick="openAddResourceModal(${mid})">+ Ajouter</button>
      </div>
    </div>
    ${resources.length===0?`<div style="color:var(--dim);font-size:12px;font-style:italic">
        Aucune ressource.
        ${CLASS_RESOURCES[(m.clazz||'').trim()]?`<button class="btn btn-xs btn-outline" style="margin-left:8px"
          onclick="initClassResources(DB.members.find(x=>x.id===${mid}));save();renderMemberDetail()">
          ✨ Init. depuis ${esc(m.clazz)}</button>`:''}
      </div>`
    :`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px">
      ${resources.map((r,ri)=>{
        const pct = r.max>0?Math.min(1,r.current/r.max):0;
        const col = r.color||'var(--indigo)';
        return `<div style="background:var(--surface);border:1px solid ${col}44;border-radius:10px;padding:10px;position:relative;text-align:center">
          <div style="position:absolute;top:3px;right:3px;display:flex;gap:2px">
            <button onclick="openEditResourceModal(${mid},'${r.id}')"
              style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:10px;padding:1px 4px;border-radius:3px"
              onmouseover="this.style.color='var(--indigo)'" onmouseout="this.style.color='var(--dim)'" title="Modifier">✏️</button>
            <button onclick="removeResource(${mid},'${r.id}')"
              style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:10px;padding:1px 4px;border-radius:3px"
              onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--dim)'" title="Supprimer">✕</button>
          </div>
          <div style="font-size:20px;margin-bottom:3px">${r.icon||'⚡'}</div>
          <div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:6px;line-height:1.2">${esc(r.name)}</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px">
            <button onclick="updateResourceVal(${mid},'${r.id}',-1)"
              style="width:22px;height:22px;border-radius:50%;background:${col}33;border:none;color:${col};cursor:pointer;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center">−</button>
            <input type="number" value="${r.current}" min="0" max="${r.max}"
              onchange="setResourceVal(${mid},'${r.id}',+this.value)"
              style="width:36px;background:transparent;border:none;color:${col};font-size:20px;font-weight:900;text-align:center;outline:none;-moz-appearance:textfield"
              title="Cliquer pour modifier">
            <button onclick="updateResourceVal(${mid},'${r.id}',+1)"
              style="width:22px;height:22px;border-radius:50%;background:${col}33;border:none;color:${col};cursor:pointer;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center">+</button>
          </div>
          <div style="height:4px;background:var(--border2);border-radius:2px;overflow:hidden;margin-bottom:4px">
            <div style="height:100%;width:${Math.min(100,pct*100)}%;background:${col};border-radius:2px;transition:width .3s"></div>
          </div>
          <div style="font-size:10px;color:var(--dim)">${r.current}/${r.max} · ${r.recharge}</div>
        </div>`;
      }).join('')}
    </div>`}
  </div>`;

  // ── PANNEAU : BOURSE ───────────────────────────────────────────
  // → Champs numériques directs pour PP/PO/PA/PC
  const panelPurse = `<div class="card v6-panel" data-panel="purse" data-mid="${mid}">
    <div class="v6-panel-handle" title="Glisser pour réordonner">⠿</div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase">💰 Bourse</div>
      <button class="btn btn-xs btn-ghost" onclick="openBourseTransferModal(${mid})" style="font-size:10px">⇄ Transférer</button>
    </div>
    <!-- Bourse sur soi -->
    <div style="font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Sur soi</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">
      ${[['pp','PP','#c084fc'],['po','PO','#fbbf24'],['pa','PA','#9ca3af'],['pc','PC','#b45309']].map(([k,label,col])=>`
        <div style="background:var(--surface2);border:1px solid ${col}33;border-radius:6px;padding:7px 4px;text-align:center">
          <input type="number" value="${m.gold?.[k]||0}" min="0"
            onchange="updateMemberField(${mid},'gold.${k}',+this.value)"
            style="width:100%;background:transparent;border:none;color:${col};font-size:18px;font-weight:900;text-align:center;outline:none">
          <div style="font-size:10px;color:${col};opacity:.7;margin-top:1px">${label}</div>
        </div>`).join('')}
    </div>
    <!-- En banque de guilde -->
    <div style="font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">🏦 En banque de guilde</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
      ${[['pp','PP','#c084fc'],['po','PO','#fbbf24'],['pa','PA','#9ca3af'],['pc','PC','#b45309']].map(([k,label,col])=>`
        <div style="background:var(--surface2);border:1px solid ${col}22;border-radius:6px;padding:7px 4px;text-align:center">
          <input type="number" value="${(m.bank||{})[k]||0}" min="0"
            onchange="updateMemberField(${mid},'bank.${k}',+this.value)"
            style="width:100%;background:transparent;border:none;color:${col};font-size:15px;font-weight:900;text-align:center;outline:none;opacity:.8">
          <div style="font-size:10px;color:${col};opacity:.5;margin-top:1px">${label}</div>
        </div>`).join('')}
    </div>
  </div>`;

  // ── PANNEAU : ARMES ────────────────────────────────────────────
  const invWeapons = (m.inventory||[]).filter(i=>['mainhand','offhand','ranged'].includes(i.equippedSlot));
  const legWeapons = (m.weapons||[]).filter(w=>w.name&&!invWeapons.find(i=>i.name===w.name));
  const allWeapons = [
    ...invWeapons.map(w=>({...w,_src:'inv',_wid:w.id})),
    ...legWeapons.map((w,wi)=>({...w,_src:'legacy',_legIdx:wi}))
  ];
  const slotIco={mainhand:'⚔️',offhand:'🗡️',ranged:'🏹',outfit:'👘'};
  const panelWeapons = allWeapons.length ? `<div class="card v6-panel" data-panel="weapons" data-mid="${mid}">
    <div class="v6-panel-handle" title="Glisser pour réordonner">⠿</div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase">⚔️ Armes</div>
      <button class="btn btn-ghost btn-xs" onclick="openAddWeaponItem(${mid})">+ Arme</button>
    </div>
    ${allWeapons.map(w=>{
      const atkDisplay = w.atkBonus!==undefined?(w.atkBonus>=0?'+':'')+w.atkBonus:(w.atk||'—');
      const dmgDisplay = w.dmgDice?(w.dmgDice+(w.dmgBonus?'+'+w.dmgBonus:'')+(w.dmgType?' '+w.dmgType:'')):(w.dmg||'—');
      const wSrc=w._src, wRef=wSrc==='inv'?w._wid:w._legIdx;
      return `<div style="padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--surface2);border-radius:6px;overflow:hidden">
            ${w.icon?`<img src="${w.icon}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-size:16px">${CAT_ICON['Arme']||'⚔️'}</span>`}
          </div>
          <div style="flex:1">
            <span style="color:var(--text);font-size:13px;font-weight:600">${esc(w.name)}</span>
            ${w.equippedSlot?`<span style="font-size:11px;margin-left:4px">${slotIco[w.equippedSlot]||''}</span>`:''}
          </div>
          <div style="text-align:right">
            <div style="color:var(--green);font-weight:700;font-size:13px">${esc(atkDisplay)}</div>
            <div style="color:var(--gold);font-size:11px">${esc(dmgDisplay)}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-xs" style="background:var(--surface2);color:var(--blue);border:1px solid var(--blue)44"
            onclick="rollWeaponFromInv(${mid},'${wSrc}','${wRef}')">🎲 Attaque</button>
          <button class="btn btn-xs" style="background:var(--surface2);color:var(--gold);border:1px solid var(--gold)44"
            onclick="rollWeaponFromInv(${mid},'${wSrc}','${wRef}','dmg')">💥 Dégâts</button>
        </div>
      </div>`;
    }).join('')}
  </div>` : '';

  // ── PANNEAU : ÉQUIPEMENT PORTÉ ─────────────────────────────────
  const inv = m.inventory||[];
  const SLOTS_EQ = [
    ['bag','Sac','🎒',['Sac']],['outfit','Tenue','👘',['Cape / Manteau','Équipement','Autre']],
    ['mainhand','Main P.','⚔️',['Arme']],['offhand','Main S.','🗡️',['Arme','Bouclier']],
    ['ranged','Distance','🏹',['Arme']],['armor','Armure','🛡️',['Armure']],
    ['shield','Bouclier','🔰',['Bouclier']],['helmet','Casque','⛑️',['Casque']],
    ['boots','Bottes','👢',['Bottes']],['gloves','Gants','🧤',['Gants']],
    ['ring1','Anneau 1','💍',['Bague / Anneau']],['ring2','Anneau 2','💍',['Bague / Anneau']],
    ['cloak','Cape','🧥',['Cape / Manteau']],['amulet','Amulette','📿',['Amulette']],
  ];
  const eqMap={};
  inv.forEach(item=>{if(item.equippedSlot) eqMap[item.equippedSlot]=item;});
  const panelGear = `<div class="card v6-panel" data-panel="gear" data-mid="${mid}">
    <div class="v6-panel-handle" title="Glisser pour réordonner">⠿</div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase">🎽 Équipement porté</div>
      <button class="btn btn-ghost btn-xs" onclick="window._memberDetailTab=3;renderMemberDetail()">📦 Inventaire →</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">
      ${SLOTS_EQ.map(([slotKey,label,ico])=>{
        const item=eqMap[slotKey];
        const filled=!!item;
        const dico=filled?(item.emoji||item.icon?null:ico):ico;
        const rc=filled?(RARITY[item.rarity]?.col||'var(--border2)'):'var(--border)';
        const itemIdx=filled?(m.inventory||[]).indexOf(item):-1;
        return `<div style="background:var(--surface2);border:1px solid ${rc}${filled?'':'44'};border-radius:7px;padding:6px 8px;display:flex;align-items:center;gap:7px;${filled?'cursor:pointer':''}${filled?`;transition:border-color .15s`:''}"
          ${filled?`onclick="openMemberInvModal(${itemIdx})" onmouseover="this.style.borderColor='var(--indigo)'" onmouseout="this.style.borderColor='${rc}'"`:''}>
          <span style="font-size:16px;width:20px;text-align:center">${filled&&item.icon?'':(filled&&item.emoji?item.emoji:ico)}</span>
          ${filled&&item.icon?`<img src="${item.icon}" style="width:20px;height:20px;border-radius:4px;object-fit:cover">`:''}
          <div style="min-width:0;flex:1">
            <div style="font-size:9px;color:var(--dim)">${label}</div>
            <div style="font-size:11px;font-weight:${filled?700:400};color:${filled?'var(--text)':'var(--dim)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${filled?esc(item.name):'—'}</div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  // ── PANNEAU : MAÎTRISES & LANGUES ─────────────────────────────
  const panelLore = (m.languages||m.armorProf||m.weaponProf||m.toolProf) ? `<div class="card v6-panel" data-panel="lore" data-mid="${mid}">
    <div class="v6-panel-handle" title="Glisser pour réordonner">⠿</div>
    <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">📚 Maîtrises & Langues</div>
    ${m.languages?`<div style="margin-bottom:8px"><div style="font-size:10px;color:var(--dim);text-transform:uppercase;margin-bottom:3px">Langues</div><div style="color:var(--muted);font-size:12px">${esc(m.languages)}</div></div>`:''}
    ${m.armorProf?`<div style="margin-bottom:8px"><div style="font-size:10px;color:var(--dim);text-transform:uppercase;margin-bottom:3px">Armures maîtrisées</div><div style="color:var(--muted);font-size:12px">${esc(m.armorProf)}</div></div>`:''}
    ${m.weaponProf?`<div style="margin-bottom:8px"><div style="font-size:10px;color:var(--dim);text-transform:uppercase;margin-bottom:3px">Armes maîtrisées</div><div style="color:var(--muted);font-size:12px">${esc(m.weaponProf)}</div></div>`:''}
    ${m.toolProf?`<div><div style="font-size:10px;color:var(--dim);text-transform:uppercase;margin-bottom:3px">Outils maîtrisés</div><div style="color:var(--muted);font-size:12px">${esc(m.toolProf)}</div></div>`:''}
  </div>` : '';

  // ── PANNEAU : PNJ lié ─────────────────────────────────────────
  const linkedNpc = m.linkedNpcId?(DB.npcs||[]).find(n=>n.id===m.linkedNpcId):null;
  const panelNpc = linkedNpc?`<div class="card v6-panel" data-panel="npc" data-mid="${mid}">
    <div class="v6-panel-handle" title="Glisser pour réordonner">⠿</div>
    <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">🔗 PNJ associé</div>
    <div style="display:flex;align-items:center;gap:10px">
      ${avatarEl(linkedNpc,36)}
      <div style="flex:1"><div style="font-weight:600;color:var(--text)">${esc(linkedNpc.name)}</div>
        <div style="color:var(--dim);font-size:11px">${esc(linkedNpc.role||'')}</div></div>
      <button class="btn btn-outline btn-xs" onclick="goToNpc(${linkedNpc.id})">→ Voir</button>
    </div>
  </div>`:'';

  // ── ASSEMBLY : ordre configurable par drag ─────────────────────
  const PANEL_MAP = {
    identity: panelIdentity, stats: panelStats,
    saves: panelSaves, skills: panelSkills,
    resources: panelResources, purse: panelPurse,
    weapons: panelWeapons, gear: panelGear,
    lore: panelLore, npc: panelNpc,
    proficiencies: panelLore // alias
  };
  const DEFAULT_ORDER = ['identity','stats','saves','skills','resources','purse','weapons','gear','lore','npc'];
  const order = (m.panelOrder&&m.panelOrder.length) ? m.panelOrder : DEFAULT_ORDER;

  // Split en 2 colonnes pour équilibre visuel
  // Colonne gauche : stats-heavy | Colonne droite : actions/ressources
  const LEFT_DEFAULT  = ['identity','stats','saves','skills','lore'];
  const RIGHT_DEFAULT = ['resources','purse','weapons','gear','npc'];
  const leftIds  = order.filter(id=>LEFT_DEFAULT.includes(id));
  const rightIds = order.filter(id=>RIGHT_DEFAULT.includes(id));
  // Les IDs non classés vont à droite
  const extraIds = order.filter(id=>!LEFT_DEFAULT.includes(id)&&!RIGHT_DEFAULT.includes(id));

  const renderCol = (ids) => ids
    .map(id=>PANEL_MAP[id]||'')
    .filter(Boolean)
    .join('');

  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" id="summary-panels-${mid}">
    <div id="summary-col-left-${mid}" class="v6-drop-col" data-mid="${mid}" data-col="left"
      ondragover="event.preventDefault()" ondrop="panelDrop(event,'left',${mid})">
      ${renderCol(leftIds)}
      ${renderCol(extraIds)}
    </div>
    <div id="summary-col-right-${mid}" class="v6-drop-col" data-mid="${mid}" data-col="right"
      ondragover="event.preventDefault()" ondrop="panelDrop(event,'right',${mid})">
      ${renderCol(rightIds)}
    </div>
  </div>`;
}



function renderMemberCapacities(m){
  const specs = m.specializations||[];
  const feats = m.features||[];
  const hasContent = specs.length||feats.length;

  const specCard = (s,idx)=>{
    const colors=['#818cf8','#a78bfa','#c084fc','#e879f9','#f472b6','#fb7185'];
    const col = colors[idx%colors.length];
    return `<div style="background:var(--surface);border:1px solid ${col}44;border-radius:12px;padding:16px;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${col};border-radius:12px 12px 0 0"></div>
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px">
        <div style="width:36px;height:36px;border-radius:8px;background:${col}22;border:1px solid ${col}55;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">
          ${s.icon||'🌟'}
        </div>
        <div style="flex:1">
          <div style="font-family:'Cinzel',serif;font-weight:700;color:var(--text);font-size:14px;margin-bottom:2px">${esc(s.name)}</div>
          ${s.source?`<div style="color:${col};font-size:11px;font-style:italic">${esc(s.source)}</div>`:''}
        </div>
      </div>
      ${s.description?`<p style="color:var(--muted);font-size:13px;line-height:1.6;font-family:'Crimson Pro',serif;margin:0">${esc(s.description)}</p>`:''}
    </div>`;
  };

  const featCard = (f,idx)=>{
    const types={'Attaque':'⚔️','Défense':'🛡️','Magie':'✨','Mouvement':'💨','Social':'💬','Utilitaire':'🔧','Passif':'👁️'};
    const ico = types[f.type]||f.icon||'⚡';
    const col = f.type==='Attaque'?'#f87171':f.type==='Défense'?'#60a5fa':f.type==='Magie'?'#a78bfa':'var(--indigo)';
    return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;gap:12px;align-items:flex-start">
      <div style="width:40px;height:40px;border-radius:10px;background:var(--surface2);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">
        ${ico}
      </div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
          <span style="font-weight:700;color:var(--text);font-size:14px">${esc(f.name)}</span>
          ${f.type?`<span style="background:var(--surface2);color:var(--dim);padding:1px 7px;border-radius:3px;font-size:10px;text-transform:uppercase;letter-spacing:.05em">${esc(f.type)}</span>`:''}
          ${f.source?`<span style="color:var(--dim);font-size:11px;font-style:italic">${esc(f.source)}</span>`:''}
        </div>
        ${f.description?`<p style="color:var(--muted);font-size:13px;line-height:1.6;font-family:'Crimson Pro',serif;margin:0">${esc(f.description)}</p>`:''}
      </div>
    </div>`;
  };

  if(!hasContent) return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">🎯</div>
    <div style="color:var(--muted);font-style:italic">Aucune spécialisation ni capacité enregistrée.</div>
    <div style="color:var(--dim);font-size:12px;margin-top:6px">Ajoutez-les dans la fiche du personnage (✏️ Modifier)</div>
  </div>`;

  return `<div style="display:flex;flex-direction:column;gap:20px">
    ${specs.length?`
    <div>
      <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">🌟 Spécialisations de Classe (${specs.length})</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
        ${specs.map((s,i)=>specCard(s,i)).join('')}
      </div>
    </div>`:''}
    ${feats.length?`
    <div>
      <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">⚡ Capacités & Traits (${feats.length})</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${feats.map((f,i)=>featCard(f,i)).join('')}
      </div>
    </div>`:''}
  </div>`;
}

function renderMemberSpells(m){
  const spells = m.spells||[];
  const viewMode = window._memberSpellMode||'list';
  const toggleBtn = `<button onclick="window._memberSpellMode=window._memberSpellMode==='list'?'cards':'list';renderMemberDetail()" class="btn btn-outline btn-xs">${viewMode==='list'?'&#8862; Vignettes':'&#9776; Liste'}</button>`;
  if(!spells.length) return `<div style="text-align:center;color:var(--dim);padding:40px;font-style:italic">Aucun sort connu.<br><span style="font-size:12px">Ajouter depuis l'onglet de modification.</span></div>`;
  window._spellCards = [];
  if(viewMode==='cards'){
    const byLevel={};
    spells.forEach(sp=>{
      const spObj=typeof sp==='object'?sp:{name:sp,level:'?',school:'',castTime:'',range:'',duration:'',description:'',icon:null};
      const lvl=spObj.level||'?';
      if(!byLevel[lvl])byLevel[lvl]=[];
      byLevel[lvl].push(spObj);
    });
    const levelOrder=['Tour de magie','Niveau 1','Niveau 2','Niveau 3','Niveau 4','Niveau 5','Niveau 6','Niveau 7','Niveau 8','Niveau 9','?'];
    return `<div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">${toggleBtn}
        <span style="color:var(--dim);font-size:11px">${spells.length} sort(s)</span>
        <a href="https://www.aidedd.org/dnd/sorts.php" target="_blank" style="color:var(--indigo);font-size:11px;margin-left:auto">&#128218; aidedd.org</a>
      </div>
      ${levelOrder.filter(lvl=>byLevel[lvl]).map(lvl=>`
        <div style="margin-bottom:14px">
          <div style="font-size:10px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px">${lvl}</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:6px">
            ${byLevel[lvl].map(spObj=>{
              const sCol=SCHOOL_COLOR[spObj.school]||'#a5b4fc';
              const _spIdx = (window._spellCards=window._spellCards||[]).push(spObj)-1;
              return `<div onclick="showSpellDetail(event,null,${_spIdx})" title="Cliquer pour le détail"
                style="background:var(--bg);border:1px solid ${sCol}44;border-radius:8px;padding:8px 6px;
                  display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;transition:border-color .15s,transform .15s"
                onmouseover="this.style.borderColor='${sCol}';this.style.transform='translateY(-2px)'"
                onmouseout="this.style.borderColor='${sCol}44';this.style.transform=''">
                <div style="width:36px;height:36px;background:var(--surface2);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  ${spObj.icon?`<img src="${spObj.icon}" style="width:100%;height:100%;object-fit:cover;border-radius:5px">`:`<span style="font-size:18px">\u2728</span>`}
                </div>
                <div style="font-size:10px;font-weight:700;color:var(--text);text-align:center;line-height:1.2;word-break:break-word">${esc(spObj.name)}</div>
                <div style="display:flex;gap:2px;flex-wrap:wrap;justify-content:center">
                  ${spObj.concentration?`<span style="font-size:7px;background:#fbbf2222;color:#fbbf24;padding:1px 3px;border-radius:2px">Conc.</span>`:''}
                  ${spObj.ritual?`<span style="font-size:7px;background:#a78bfa22;color:#a78bfa;padding:1px 3px;border-radius:2px">Ritual</span>`:''}
                  ${spObj.school?`<span style="font-size:7px;background:${sCol}22;color:${sCol};padding:1px 3px;border-radius:2px">${esc(spObj.school.slice(0,5))}</span>`:''}
                </div>
                ${spObj.castTime?`<div style="font-size:8px;color:var(--dim);text-align:center">${esc(spObj.castTime)}</div>`:''}
              </div>`;
            }).join('')}
          </div>
        </div>`).join('')}
    </div>`;
  }
  return `<div style="display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
      ${toggleBtn}
      <span style="color:var(--dim);font-size:11px">${spells.length} sort(s)</span>
      <a href="https://www.aidedd.org/dnd/sorts.php" target="_blank" style="color:var(--indigo);font-size:11px;margin-left:auto">&#128161; aidedd.org</a>
    </div>
    ${spells.map(sp=>{
      const sCol=SCHOOL_COLOR[sp.school]||"#a5b4fc";
      const spObj=typeof sp==='object'?sp:{name:sp,level:'?',school:'',castTime:'',range:'',duration:'',description:''};
      return `<div style="background:var(--bg);border:1px solid var(--border2);border-radius:8px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start">
        <div style="width:36px;height:36px;background:var(--surface2);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
          ${spObj.icon?`<img src="${spObj.icon}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-size:18px">\u2728</span>`}
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-weight:700;color:var(--text);font-size:14px">${esc(spObj.name)}</span>
            ${spObj.school?`<span style="background:${sCol}22;color:${sCol};padding:1px 7px;border-radius:3px;font-size:10px;font-weight:700">${esc(spObj.school)}</span>`:''}
            ${spObj.level?`<span style="background:var(--surface2);color:var(--muted);padding:1px 6px;border-radius:3px;font-size:10px">${esc(spObj.level)}</span>`:''}
            ${spObj.concentration?`<span style="color:#fbbf24;font-size:9px;font-weight:700;background:#fbbf2422;padding:1px 5px;border-radius:3px">Conc.</span>`:''}
            ${spObj.ritual?`<span style="color:#a78bfa;font-size:9px;font-weight:700;background:#a78bfa22;padding:1px 5px;border-radius:3px">Rituel</span>`:''}
            ${spObj.name?`<a href="https://www.aidedd.org/dnd/sorts.php?vf=${encodeURIComponent(spObj.name.toLowerCase().replace(/ /g,'+'))}" target="_blank" style="color:var(--indigo);font-size:10px;margin-left:auto">\u2197</a>`:''}
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--dim);margin-bottom:4px">
            ${[spObj.castTime,spObj.range,spObj.duration,spObj.components].filter(Boolean).map(x=>`<span>${x}</span>`).join('')}
          </div>
          ${spObj.description?`<div style="font-size:13px;color:var(--muted);font-family:'Crimson Pro',serif;line-height:1.5">${esc(spObj.description)}</div>`:''}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}


function renderMemberInventoryView(m){
  const inv = m.inventory||[];
  const cc = calcCarryCapacity(m);
  const pct = cc.capacity > 0 ? Math.min(1, cc.used/cc.capacity) : 1;
  const over = cc.used > cc.capacity;

  // Stats summary
  const equippedCount = inv.filter(i=>i.equippedSlot).length;
  const totalItems    = inv.reduce((s,i)=>s+(i.qty||1),0);
  const totalCases    = inv.reduce((s,i)=>{ const sz=i.size!==undefined?i.size:(i.w||1); return s+sz*(i.qty||1); },0);
  const cats = {};
  inv.forEach(i=>{ cats[i.category||'Autre']=(cats[i.category||'Autre']||0)+(i.qty||1); });

  const viewToggle = memberInvViewMode==='list' ? '⊞ Vignettes' : '☰ Liste';

  return `<div style="display:flex;flex-direction:column;gap:10px">
    <!-- Barre de capacité -->
    ${carryBar(m)}

    <!-- Stats bar -->
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 10px;background:var(--surface2);border-radius:8px;border:1px solid var(--border2)">
      <span style="font-size:12px;color:var(--text);font-weight:600">📦 ${inv.length} type(s)</span>
      <span style="color:var(--border2)">·</span>
      <span style="font-size:12px;color:var(--text)">${totalItems} objet(s) total</span>
      <span style="color:var(--border2)">·</span>
      <span style="font-size:12px;color:${over?'#ef4444':'var(--green)'};font-weight:600">${cc.used} / ${cc.capacity} cases</span>
      ${equippedCount?`<span style="color:var(--border2)">·</span><span style="font-size:12px;color:var(--indigo)">⚔️ ${equippedCount} équipé(s)</span>`:''}
      <div style="flex:1"></div>
      ${Object.keys(cats).slice(0,4).map(cat=>`<span style="font-size:10px;background:var(--surface);padding:1px 7px;border-radius:10px;color:var(--dim)">${CAT_ICON[cat]||'📦'} ${cats[cat]}</span>`).join('')}
    </div>

    <!-- Règles collapsibles -->
    <div>
      <button onclick="const r=document.getElementById('carry-rules-v');r.style.display=r.style.display==='none'?'block':'none'"
        class="btn btn-ghost btn-xs" style="font-size:10px;opacity:.6;margin-bottom:4px">📋 Règles d'encombrement</button>
      <div id="carry-rules-v" style="display:none;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;padding:8px;font-size:11px;color:var(--dim);line-height:1.7">
        <b style="color:var(--text)">Cases de base</b> = FOR × 2 &nbsp;|&nbsp;
        <b style="color:var(--green)">Besace</b> +6 &nbsp;|&nbsp; <b style="color:var(--green)">Sac léger</b> +12 &nbsp;|&nbsp; <b style="color:var(--green)">Sac randonnée</b> +24<br>
        <b style="color:#f87171">Armure légère</b> −2 &nbsp;|&nbsp; <b style="color:#f87171">Armure inter.</b> −4 &nbsp;|&nbsp; <b style="color:#f87171">Armure lourde</b> −8<br>
        Chaque objet a une taille en cases. Bourse libre jusqu'à 100 pièces — surplus : 1 case / rouleau de 50.
      </div>
    </div>

    <!-- Header + actions -->
    <div style="display:flex;align-items:center;gap:6px">
      <button class="btn btn-ghost btn-xs" onclick="memberInvViewMode=memberInvViewMode==='list'?'grid':'list';renderMemberDetail()">${viewToggle}</button>
      <div style="flex:1"></div>
      <button class="btn btn-primary btn-sm" onclick="openMemberInvModal()">+ Ajouter</button>
    </div>

    <!-- Inventaire -->
    ${inv.length===0?`<div style="text-align:center;color:var(--dim);padding:40px;font-style:italic">Inventaire vide.</div>`:''}
    ${memberInvViewMode==='grid' ? `
    <!-- VUE VIGNETTES -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px">
      ${inv.map((item,idx)=>{
        const rc = RARITY[item.rarity]?.col||'#6366f1';
        const sz = item.size!==undefined?item.size:(item.w||1);
        const equipped = item.equippedSlot;
        return `<div style="background:var(--surface);border:2px solid ${equipped?rc+'99':'var(--border)'};border-radius:10px;
          padding:10px 8px;text-align:center;cursor:pointer;transition:border-color .15s,transform .12s;position:relative"
          onmouseover="this.style.borderColor='${rc}';this.style.transform='translateY(-2px)'"
          onmouseout="this.style.borderColor='${equipped?rc+'99':'var(--border)'}';this.style.transform=''"
          onclick="openMemberInvModal(${idx})">
          ${equipped?`<div style="position:absolute;top:4px;right:4px;font-size:9px;background:${rc}33;color:${rc};padding:1px 4px;border-radius:3px;line-height:1.4">${{mainhand:'⚔️',offhand:'🗡️',ranged:'🏹',armor:'🛡️',shield:'🔰',helmet:'⛑️',boots:'👢',gloves:'🧤',ring1:'💍',ring2:'💍',cloak:'🧥',amulet:'📿',bag:'🎒'}[equipped]||'✓'}</div>`:''}
          <div style="width:44px;height:44px;margin:0 auto 6px;background:var(--surface2);border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden">
            ${item.icon?`<img src="${item.icon}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`:`<span style="font-size:22px">${item.emoji||CAT_ICON[item.category]||'📦'}</span>`}
          </div>
          <div style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(item.name)}</div>
          <div style="font-size:10px;color:${rc};font-weight:600">${item.rarity||''}</div>
          <div style="font-size:10px;color:var(--dim);margin-top:2px">×${item.qty||1} · ${sz} case${sz>1?'s':''}</div>
        </div>`;
      }).join('')}
    </div>
    ` : `
    <!-- VUE LISTE -->
    <div style="display:flex;flex-direction:column;gap:5px">
      ${inv.map((item,idx)=>{
        const rc = RARITY[item.rarity]?.col||'#6366f1';
        const sz = item.size!==undefined?item.size:(item.w||1);
        const equipped = item.equippedSlot;
        const slotIco = {mainhand:'⚔️',offhand:'🗡️',ranged:'🏹',outfit:'👘',armor:'🛡️',shield:'🔰',helmet:'⛑️',boots:'👢',gloves:'🧤',ring1:'💍',ring2:'💍',cloak:'🧥',amulet:'📿',bag:'🎒'};
        return `<div style="background:var(--bg);border:1px solid ${equipped?rc+'55':'var(--border2)'};border-radius:9px;padding:8px 12px;
          display:flex;align-items:center;gap:10px;transition:border-color .12s"
          onmouseover="this.style.borderColor='${rc}'" onmouseout="this.style.borderColor='${equipped?rc+'55':'var(--border2)'}'">
          <div style="width:36px;height:36px;background:var(--surface2);border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
            ${item.icon?`<img src="${item.icon}" style="width:100%;height:100%;object-fit:cover;border-radius:7px">`:`<span style="font-size:19px">${item.emoji||CAT_ICON[item.category]||'📦'}</span>`}
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
              <span style="color:var(--text);font-size:13px;font-weight:600">${esc(item.name)}</span>
              ${equipped?`<span style="font-size:11px" title="${equipped}">${slotIco[equipped]||'✓'}</span>`:''}
              ${badge(item.rarity)}
              <span style="font-size:10px;color:var(--dim);background:var(--surface2);padding:1px 5px;border-radius:3px">${CAT_ICON[item.category]||'📦'} ${item.category||'?'}</span>
            </div>
            ${item.description?`<div style="color:var(--dim);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px;margin-top:1px">${esc(item.description.slice(0,90))}</div>`:''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0">
            <span style="font-size:12px;font-weight:700;color:var(--text)">×${item.qty||1}</span>
            <span style="font-size:10px;color:var(--dim)">${sz*( item.qty||1)} case${sz*(item.qty||1)>1?'s':''}</span>
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0">
            <button class="btn btn-outline btn-xs" onclick="sendInvItemToPocket(${m.id},${item.id})" title="Mettre en sacoche">👜</button>
            <button class="btn btn-outline btn-xs" onclick="openMemberItemTransfer(${m.id},${item.id})" title="Transférer">⇄</button>
            <button class="btn btn-outline btn-xs" onclick="openMemberInvModal(${idx})">✏️</button>
          </div>
        </div>`;
      }).join('')}
    </div>
    `}
  </div>`;
}


function openMemberItemTransfer(memberId, itemId){
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  const item=(m.inventory||[]).find(i=>i.id===itemId); if(!item) return;
  const opts = `<option value="coffre">⚖️ Coffre commun de la Guilde</option>`
    + DB.members.map(x=>`<option value="casier_${x.id}"${x.id===memberId?' selected':''}>${x.avatar||'👤'} ${esc(x.name)} — casier</option>`).join('');
  window._mitMid = memberId;
  window._mitItemId = itemId;
  window._trDest = 'casier_'+memberId;
  window._trQty = 1;
  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:400px">
    <div class="modal-header"><span class="modal-title">⇄ Vers coffre : ${esc(item.name)}</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="field"><label>Destination</label>
        <select onchange="window._trDest=this.value">${opts}</select>
      </div>
      <div class="field"><label>Quantité</label>
        <input type="number" value="1" min="1" max="${item.qty}" oninput="window._trQty=+this.value">
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="doMemberItemTransfer()">Transférer</button>
      </div>
    </div>
  </div>`);
}
function doMemberItemTransfer(){
  const qty=+(window._trQty||1), dest=String(window._trDest||'coffre');
  const m=DB.members.find(x=>x.id===window._mitMid); if(!m) return;
  const src=(m.inventory||[]).find(i=>i.id===window._mitItemId); if(!src||src.qty<qty) return;
  src.qty-=qty; if(src.qty<=0) m.inventory=m.inventory.filter(i=>i.id!==window._mitItemId);
  const ownerId = dest.startsWith('casier_') ? +dest.slice(7) : null;
  const ex=DB.guildInventory.find(i=>i.name===src.name&&(i.ownerId||null)===(ownerId||null));
  if(ex) ex.qty+=qty;
  else DB.guildInventory.push({...src,id:uid(),qty,ownerId});
  save(); closeModal(); renderMemberDetail(); toast('Déposé dans le coffre !');
}

function renderMemberGuildChest(m){
  const personal = (DB.guildInventory||[]).filter(i=>i.ownerId===m.id);
  const allGuild  = (DB.guildInventory||[]).filter(i=>i.ownerId&&i.ownerId!==m.id);
  const communal  = (DB.guildInventory||[]).filter(i=>!i.ownerId);
  const pocket    = m.pocket||[];

  // Item row: draggable, with optional transfer button
  const itemRow = (item, zone, src='guild', itemIdx=null, canEdit=true, showOwner=false) => {
    const gIdx = src==='guild' ? (DB.guildInventory||[]).indexOf(item) : -1;
    const pIdx = src==='pocket' ? itemIdx : -1;
    const owner = showOwner && item.ownerId ? DB.members.find(x=>x.id===item.ownerId) : null;
    const dragData = JSON.stringify({src:src,iid:item.id,memberId:m.id});
    return `<div
      draggable="${canEdit}"
      data-drag-zone="${zone}"
      data-drag-json='${dragData}'
      ondragstart="chestDragStart(event,this.dataset.dragJson,this.dataset.dragZone)"
      ondragend="chestDragEnd(event)"
      style="background:var(--bg);border:1px solid var(--border2);border-radius:8px;padding:9px 12px;margin-bottom:5px;
        display:flex;align-items:center;gap:8px;cursor:${canEdit?'grab':'default'};transition:border-color .15s"
      ${canEdit?`onmouseover="this.style.borderColor='var(--indigo)'" onmouseout="this.style.borderColor='var(--border2)'"`:''}>
      <div style="width:28px;height:28px;background:var(--surface2);border-radius:5px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;pointer-events:none">
        ${item.emoji?`<span style="font-size:18px">${esc(item.emoji)}</span>`:item.icon?`<img src="${item.icon}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-size:14px">${CAT_ICON[item.category]||'📦'}</span>`}
      </div>
      <span style="flex:1;color:var(--text);font-size:13px;font-weight:600;pointer-events:none">${esc(item.name)}</span>
      ${badge(item.rarity)}
      ${owner?`<span style="background:var(--indigo)22;color:var(--indigo);padding:1px 6px;border-radius:3px;font-size:10px;pointer-events:none">${owner.avatar} ${esc(owner.name)}</span>`:''}
      <span style="background:var(--surface2);padding:2px 7px;border-radius:4px;color:var(--text);font-weight:700;font-size:12px;pointer-events:none">×${item.qty||1}</span>
      ${canEdit&&src==='guild'?`<button class="btn btn-xs btn-ghost" onclick="event.stopPropagation();openGuildToInvTransfer(${gIdx},${m.id})" title="Vers inventaire">📦</button>`:''}
      ${canEdit&&src==='pocket'?`<button class="btn btn-xs btn-ghost" onclick="event.stopPropagation();removePocketItem(${m.id},${pIdx})" title="Retirer">✕</button>`:''}
      ${canEdit&&src==='guild'?`<button class="btn btn-xs btn-danger" onclick="event.stopPropagation();guildChestRemove(${gIdx})" title="Supprimer">✕</button>`:''}
    </div>`;
  };

  const dropZone = (id, label) => `
    <div id="chest-drop-${id}"
      ondragover="chestDragOver(event,'${id}')"
      ondragleave="chestDragLeave(event,'${id}')"
      ondrop="chestDrop(event,'${id}',${m.id})"
      style="min-height:40px;border:2px dashed transparent;border-radius:8px;transition:border-color .2s,background .2s;padding:4px"
      data-drop-id="${id}">`;

  return `<div style="display:flex;flex-direction:column;gap:14px">
    <!-- Instructions -->
    <div style="background:var(--surface2);border-radius:8px;padding:8px 12px;color:var(--dim);font-size:11px">
      ↕️ Glissez-déposez les objets entre les sections. 📦 = envoyer vers l'inventaire.
    </div>

    <!-- SACOCHE (pocket) -->
    ${(()=>{
      const pCap  = m.pocketSize||6;
      const pName = m.pocketName||'Sacoche';
      const pUsed = pocket.reduce((s,i)=>s+(i.size!==undefined?i.size:(i.w||1))*(i.qty||1),0);
      const pPct  = pCap > 0 ? Math.min(1, pUsed/pCap) : 1;
      const pOver = pUsed > pCap;
      const pCol  = pOver ? '#ef4444' : pPct>=.8 ? '#f59e0b' : '#4ade80';
      return `<div class="card" id="chest-zone-pocket">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">👜</span>
          <div>
            <input value="${esc(pName)}" onchange="DB.members.find(x=>x.id===${m.id}).pocketName=this.value;save()"
              style="background:transparent;border:none;border-bottom:1px solid var(--border2);color:var(--gold);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:0 2px;width:120px;outline:none"
              title="Nom de la sacoche">
            <div style="font-size:10px;color:${pOver?'#ef4444':'var(--dim)'}">${pUsed}/${pCap} cases${pOver?' — <b>PLEINE</b>':''}</div>
          </div>
        </div>
        <div style="display:flex;gap:5px;align-items:center">
          <label style="font-size:10px;color:var(--dim)">Cases:
            <input type="number" value="${pCap}" min="1" max="100"
              onchange="DB.members.find(x=>x.id===${m.id}).pocketSize=+this.value;save();renderMemberDetail()"
              style="width:40px;background:var(--surface2);border:1px solid var(--border2);border-radius:4px;color:var(--text);font-size:11px;padding:2px 4px;text-align:center">
          </label>
          <button class="btn btn-xs btn-outline" onclick="openAddPocketItem(${m.id})">+ Ajouter</button>
        </div>
      </div>
      <div style="height:5px;background:var(--border2);border-radius:3px;margin-bottom:10px;overflow:hidden">
        <div style="height:100%;width:${Math.min(100,pPct*100)}%;background:${pCol};border-radius:3px;transition:width .3s"></div>
      </div>`
    })()}
      ${dropZone('pocket','Sacoche')}
        ${pocket.length===0?`<div style="color:var(--dim);font-size:12px;font-style:italic;text-align:center;padding:10px">Sacoche vide</div>`:''}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px;padding:4px">
          ${pocket.map((item,pi)=>{
            const pDragData = JSON.stringify({src:'pocket',iid:item.id,memberId:m.id});
            return `<div
              draggable="true"
              data-drag-zone="pocket"
              data-drag-json='${pDragData}'
              ondragstart="chestDragStart(event,this.dataset.dragJson,this.dataset.dragZone)"
              ondragend="chestDragEnd(event)"
              style="background:var(--surface);border:1px solid var(--border2);border-radius:8px;padding:8px;text-align:center;cursor:grab;transition:border-color .15s,transform .12s;position:relative"
              onmouseover="this.style.borderColor='var(--gold)';this.style.transform='translateY(-1px)'"
              onmouseout="this.style.borderColor='var(--border2)';this.style.transform=''">
              <button onclick="event.stopPropagation();removePocketItem(${m.id},${pi})" class="btn btn-xs btn-danger"
                style="position:absolute;top:3px;right:3px;padding:1px 4px;font-size:9px;line-height:1">✕</button>
              <div style="width:36px;height:36px;margin:0 auto 5px;background:var(--surface2);border-radius:7px;display:flex;align-items:center;justify-content:center;overflow:hidden;pointer-events:none">
                ${item.icon?`<img src="${item.icon}" style="width:100%;height:100%;object-fit:cover;border-radius:7px">`:`<span style="font-size:20px">${item.emoji||CAT_ICON[item.category]||'📦'}</span>`}
              </div>
              <div style="font-size:11px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none">${esc(item.name)}</div>
              <div style="font-size:10px;color:var(--dim);pointer-events:none">×${item.qty||1}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- INVENTAIRE PERSONNEL -->
    ${(()=>{
      const mInv = m.inventory||[];
      const cc   = calcCarryCapacity(m);
      const pct  = cc.capacity > 0 ? Math.min(1, cc.used/cc.capacity) : 1;
      const iCol = cc.used > cc.capacity ? '#ef4444' : pct>=.8 ? '#f59e0b' : '#4ade80';
      const slotEmoji={mainhand:'⚔️',offhand:'🗡️',ranged:'🏹',outfit:'👘',armor:'🛡️',shield:'🔰',helmet:'⛑️',boots:'👢',gloves:'🧤',ring1:'💍',ring2:'💍',cloak:'🧥',amulet:'📿',bag:'🎒'};
      const rows = mInv.map((item,ii)=>{
        const sz  = item.size!==undefined?item.size:(item.w||1);
        const rc  = RARITY[item.rarity]?.col||'#6366f1';
        const ico = item.emoji||CAT_ICON[item.category]||'📦';
        const eqIco = item.equippedSlot ? (slotEmoji[item.equippedSlot]||'✓') : '';
        const borderNorm = item.equippedSlot ? rc+'55' : 'var(--border2)';
        const invDragData = JSON.stringify({src:'invitem',iid:item.id,memberId:m.id});
        return '<div draggable="true"'
          +' data-drag-zone="inventory"'
          +' data-drag-json=\''+invDragData+'\''
          +' ondragstart="chestDragStart(event,this.dataset.dragJson,this.dataset.dragZone)"'
          +' ondragend="chestDragEnd(event)"'
          +' style="background:var(--bg);border:1px solid '+borderNorm+';border-radius:7px;padding:7px 10px;margin-bottom:4px;display:flex;align-items:center;gap:8px;cursor:grab;transition:border-color .12s">'
          +'<div style="width:26px;height:26px;background:var(--surface2);border-radius:5px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;pointer-events:none">'
          +(item.icon ? '<img src="'+item.icon+'" style="width:100%;height:100%;object-fit:cover">' : '<span style="font-size:15px">'+esc(ico)+'</span>')
          +'</div>'
          +'<span style="flex:1;font-size:12px;font-weight:600;color:var(--text);pointer-events:none">'+esc(item.name)+'</span>'
          +(eqIco ? '<span style="font-size:11px;pointer-events:none" title="'+item.equippedSlot+'">'+eqIco+'</span>' : '')
          +'<span style="font-size:11px;color:var(--dim);pointer-events:none">×'+(item.qty||1)+'</span>'
          +'<span style="font-size:10px;color:var(--dim);background:var(--surface2);padding:1px 5px;border-radius:3px;pointer-events:none">'+sz+'c</span>'
          +'</div>';
      }).join('');
      return '<div class="card" id="chest-zone-inventory">'
        +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
        +'<div style="display:flex;align-items:center;gap:6px">'
        +'<span style="font-size:16px">🎒</span>'
        +'<div>'
        +'<div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase">Inventaire de '+esc(m.name)+'</div>'
        +'<div style="font-size:10px;color:'+(cc.used>cc.capacity?'#ef4444':'var(--dim)')+'">'+cc.used+'/'+cc.capacity+' cases · '+mInv.length+' type(s) · Glissez ici depuis le coffre</div>'
        +'</div></div></div>'
        +'<div style="height:5px;background:var(--border2);border-radius:3px;margin-bottom:8px;overflow:hidden">'
        +'<div style="height:100%;width:'+Math.min(100,pct*100)+'%;background:'+iCol+';border-radius:3px;transition:width .3s"></div>'
        +'</div>'
        + dropZone('inventory','Inventaire')
        + (mInv.length===0?'<div style="color:var(--dim);font-size:12px;font-style:italic;text-align:center;padding:8px">Inventaire vide</div>':'')
        + rows
        + '</div>'
        +'</div>';
    })()}

    <!-- CASIER PERSONNEL (guild) -->
    <div class="card" id="chest-zone-personal">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase">🔒 Casier Personnel</div>
        <button class="btn btn-xs btn-outline" onclick="openGuildChestAddModal(${m.id})">+ Déposer</button>
      </div>
      ${dropZone('personal','Casier')}
        ${personal.length===0?`<div style="color:var(--dim);font-size:12px;font-style:italic;text-align:center;padding:8px">Casier vide</div>`:''}
        ${personal.map(item=>itemRow(item,'personal','guild',-1,true,false)).join('')}
      </div>
    </div>

    <!-- COFFRE COMMUN -->
    <div class="card" id="chest-zone-communal">
      <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">⚖️ Coffre Commun</div>
      ${dropZone('communal','Coffre commun')}
        ${communal.length===0?`<div style="color:var(--dim);font-size:12px;font-style:italic;text-align:center;padding:8px">Coffre vide</div>`:''}
        ${communal.map(item=>itemRow(item,'communal','guild',-1,true,false)).join('')}
      </div>
    </div>

    <!-- Casiers autres membres (lecture seule) -->
    ${allGuild.length>0?`<div class="card">
      <div style="font-size:11px;color:var(--dim);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">👥 Casiers des autres membres</div>
      ${allGuild.map(item=>itemRow(item,'other','guild',-1,false,true)).join('')}
    </div>`:''}
  </div>`;
}

// ── Drag-and-drop coffre ──────────────────────────────────
let _chestDragData = null;
let _chestDragZone = null;
function chestDragStart(ev, rawData, zone){
  try {
    const parsed = typeof rawData==='string' && rawData.startsWith('{') ? JSON.parse(rawData) : {src:'guild',gIdx:+rawData,memberId:null};
    if(parsed.iid !== undefined) parsed.iid = +parsed.iid;
    if(parsed.memberId !== undefined) parsed.memberId = +parsed.memberId;
    _chestDragData = parsed;
  } catch(e){
    _chestDragData = {src:'guild',gIdx:+rawData,memberId:null};
  }
  _chestDragZone = zone;
  ev.dataTransfer.effectAllowed = 'move';
  ev.dataTransfer.setData('text/plain', '');
  ev.currentTarget.style.opacity = '.4';
}
function chestDragEnd(ev){
  ev.currentTarget.style.opacity = '1';
}
function chestDragOver(ev, zoneId){
  ev.preventDefault();
  ev.stopPropagation();
  ev.dataTransfer.dropEffect = 'move';
  const el = document.getElementById('chest-drop-'+zoneId);
  if(el){ el.style.borderColor='var(--indigo)'; el.style.background='var(--indigo)11'; }
}
function chestDragLeave(ev, zoneId){
  const el = document.getElementById('chest-drop-'+zoneId);
  if(!el) return;
  const rect = el.getBoundingClientRect();
  const x = ev.clientX, y = ev.clientY;
  if(x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom){
    el.style.borderColor='transparent'; el.style.background='';
  }
}
function chestDrop(ev, targetZone, memberId){
  ev.preventDefault();
  ev.stopPropagation();
  const el = document.getElementById('chest-drop-'+targetZone);
  if(el){ el.style.borderColor='transparent'; el.style.background=''; }
  if(!_chestDragData) return;
  if(targetZone===_chestDragZone){ _chestDragData=null; return; }

  const d = _chestDragData;
  const m = DB.members.find(x=>x.id===(memberId||d.memberId));

  const _canStack = (a, b) =>
    a.name === b.name && (a.category||'') === (b.category||'') && (a.rarity||'Commun') === (b.rarity||'Commun');

  const _stackOrPush = (arr, item, qty, extraProps) => {
    const existing = arr.find(x => _canStack(x, item));
    if(existing){ existing.qty = (existing.qty||1) + (qty||1); return true; }
    arr.push({...item, id:uid(), qty: qty||1, ...extraProps});
    return false;
  };

  const _decreaseOrRemove = (arr, iid, qty) => {
    const idx = arr.findIndex(x => x.id === iid);
    if(idx < 0) return;
    const it = arr[idx];
    if((it.qty||1) <= qty) arr.splice(idx, 1);
    else it.qty -= qty;
  };

  if(d.src==='guild'){
    const gInv = DB.guildInventory;
    const idx  = gInv.findIndex(x=>x.id===d.iid);
    if(idx<0) return;
    const item = gInv[idx];
    const qty  = item.qty || 1;
    if(targetZone==='personal'){
      const existing = gInv.find(x => x.id !== item.id && x.ownerId === memberId && _canStack(x, item));
      if(existing){ existing.qty = (existing.qty||1) + qty; gInv.splice(idx, 1); }
      else { item.ownerId = memberId; }
    }
    else if(targetZone==='communal'){
      const existing = gInv.find(x => x.id !== item.id && !x.ownerId && _canStack(x, item));
      if(existing){ existing.qty = (existing.qty||1) + qty; gInv.splice(idx, 1); }
      else { item.ownerId = null; }
    }
    else if(targetZone==='pocket'){
      if(!m) return;
      if(!m.pocket) m.pocket=[];
      const cap  = m.pocketSize||6;
      const used = m.pocket.reduce((s,i)=>s+(i.size!==undefined?i.size:(i.w||1))*(i.qty||1),0);
      const sz   = item.size!==undefined?item.size:(item.w||1);
      if(used+sz>cap){ toast(`Sacoche pleine ! (${used}/${cap} cases)`); return; }
      _stackOrPush(m.pocket, item, 1, {});
      _decreaseOrRemove(gInv, d.iid, 1);
    }
    else if(targetZone==='inventory'){
      if(!m) return;
      if(!m.inventory) m.inventory=[];
      _stackOrPush(m.inventory, item, qty, {equippedSlot:undefined});
      gInv.splice(idx,1);
    }
  }
  else if(d.src==='invitem'){
    if(!m||!m.inventory) return;
    const idx  = m.inventory.findIndex(x=>x.id===d.iid);
    if(idx<0) return;
    const item = m.inventory[idx];
    const qty  = item.qty || 1;
    if(targetZone==='pocket'){
      if(!m.pocket) m.pocket=[];
      const cap  = m.pocketSize||6;
      const used = m.pocket.reduce((s,i)=>s+(i.size!==undefined?i.size:(i.w||1))*(i.qty||1),0);
      const sz   = item.size!==undefined?item.size:(item.w||1);
      if(used+sz>cap){ toast(`Sacoche pleine ! (${used}/${cap} cases)`); return; }
      _stackOrPush(m.pocket, item, 1, {});
      _decreaseOrRemove(m.inventory, d.iid, 1);
    }
    else if(targetZone==='personal'){
      _stackOrPush(DB.guildInventory, item, qty, {ownerId:m.id});
      m.inventory.splice(idx,1);
    }
    else if(targetZone==='communal'){
      _stackOrPush(DB.guildInventory, item, qty, {ownerId:null});
      m.inventory.splice(idx,1);
    }
  }
  else if(d.src==='pocket'){
    if(!m||!m.pocket) return;
    const idx  = m.pocket.findIndex(x=>x.id===d.iid);
    if(idx<0) return;
    const item = m.pocket[idx];
    const qty  = item.qty || 1;
    if(targetZone==='personal'){
      _stackOrPush(DB.guildInventory, item, qty, {ownerId:memberId});
      m.pocket.splice(idx,1);
    }
    else if(targetZone==='communal'){
      _stackOrPush(DB.guildInventory, item, qty, {ownerId:null});
      m.pocket.splice(idx,1);
    }
    else if(targetZone==='inventory'){
      if(!m.inventory) m.inventory=[];
      _stackOrPush(m.inventory, item, qty, {});
      m.pocket.splice(idx,1);
    }
  }

  save();
  _chestDragData = null; _chestDragZone = null;
  renderMemberDetail(); updateStats();
}

// ── Sacoche (pocket) helpers ─────────────────────────────────
function openAddPocketItem(memberId){
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  if(!m.pocket) m.pocket=[];
  const cap = m.pocketSize||6;
  const used = m.pocket.reduce((s,i)=>s+(i.size!==undefined?i.size:(i.w||1))*(i.qty||1),0);
  if(used>=cap){ toast(`Sacoche pleine ! (${used}/${cap} cases)`); return; }
  const item={id:uid(),name:'',qty:1,category:'Consommable',rarity:'Commun',emoji:'',description:''};
  window._editPocketItem=item; window._editPocketMemberId=memberId;
  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:400px">
    <div class="modal-header"><span class="modal-title">👜 Ajouter à la sacoche</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="field"><label>Nom</label>
        <input placeholder="Potion de soin…" oninput="window._editPocketItem.name=this.value"
          style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 10px">
      </div>
      <div class="grid2">
        <div class="field"><label>Qté</label>
          <input type="number" value="1" min="1" oninput="window._editPocketItem.qty=+this.value"
            style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 8px">
        </div>
        <div class="field"><label>Emoji</label>
          <input placeholder="🧪" oninput="window._editPocketItem.emoji=this.value"
            style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 8px;font-size:18px;text-align:center">
        </div>
      </div>
      <div class="field"><label>Catégorie</label>
        <select onchange="window._editPocketItem.category=this.value" style="width:100%">
          ${ITEM_CATS.map(cat=>`<option value="${cat}">${CAT_ICON[cat]||''} ${cat}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="saveAddPocketItem()">Ajouter</button>
      </div>
    </div>
  </div>`);
}

function saveAddPocketItem(){
  const item=window._editPocketItem; if(!item||!item.name.trim()) return;
  const m=DB.members.find(x=>x.id===window._editPocketMemberId); if(!m) return;
  if(!m.pocket) m.pocket=[];
  if(m.pocket.length>=6){ toast('Sacoche pleine !'); return; }
  m.pocket.push(item);
  save(); closeModal(); renderMemberDetail(); toast('Ajouté à la sacoche !');
}

function removePocketItem(memberId, idx){
  const m=DB.members.find(x=>x.id===memberId); if(!m||!m.pocket) return;
  m.pocket.splice(idx,1);
  save(); renderMemberDetail();
}

// ── Envoyer un item de l'inventaire vers la sacoche ──────────
function sendInvItemToPocket(memberId, itemId){
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  const invIdx=(m.inventory||[]).findIndex(i=>i.id===itemId); if(invIdx<0) return;
  const item=m.inventory[invIdx];
  const cap=m.pocketSize||6;
  const used=(m.pocket||[]).reduce((s,i)=>s+(i.size!==undefined?i.size:(i.w||1))*(i.qty||1),0);
  const sz=item.size!==undefined?item.size:(item.w||1);
  if(used+sz>cap){ toast(`Sacoche pleine ! (${used}/${cap} cases)`); return; }
  if(!m.pocket) m.pocket=[];
  m.pocket.push({...item, id:uid(), qty:1});
  if((item.qty||1)<=1) m.inventory.splice(invIdx,1);
  else item.qty=(item.qty||1)-1;
  save(); renderMemberDetail(); updateStats();
  toast(`${item.name} → sacoche`);
}

// ── Transférer du coffre vers l'inventaire perso ─────────────
function openGuildToInvTransfer(gIdx, memberId){
  const item=DB.guildInventory[gIdx]; if(!item) return;
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:380px">
    <div class="modal-header"><span class="modal-title">📦 → Inventaire : ${esc(item.name)}</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <p style="color:var(--dim);font-size:13px;margin-bottom:12px">Transférer vers l'inventaire de <b style="color:var(--text)">${esc(m.name)}</b> :</p>
      <div class="field"><label>Quantité</label>
        <input type="number" id="gtinv-qty" value="1" min="1" max="${item.qty}"
          style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 10px">
      </div>
      <div class="field"><label>Destination</label>
        <select id="gtinv-dest" style="width:100%">
          <option value="inventory">🎒 Inventaire</option>
          <option value="pocket">👜 Sacoche</option>
        </select>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="doGuildToInvTransfer(${gIdx},${memberId})">Transférer</button>
      </div>
    </div>
  </div>`);
}

function doGuildToInvTransfer(gIdx, memberId){
  const item=DB.guildInventory[gIdx]; if(!item) return;
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  const qty=+(document.getElementById('gtinv-qty')?.value||1);
  const dest=document.getElementById('gtinv-dest')?.value||'inventory';
  if(dest==='pocket'){
    if((m.pocket||[]).length>=6){ toast('Sacoche pleine !'); return; }
    if(!m.pocket) m.pocket=[];
    m.pocket.push({...item,id:uid(),qty});
  } else {
    if(!m.inventory) m.inventory=[];
    m.inventory.push({...item,id:uid(),qty,equippedSlot:undefined});
  }
  if(item.qty<=qty) DB.guildInventory.splice(gIdx,1);
  else item.qty -= qty;
  save(); closeModal(); renderMemberDetail(); updateStats();
  toast(`${qty}× ${item.name} → ${dest==='pocket'?'sacoche':'inventaire'} de ${m.name}`);
}

function openGuildChestAddModal(memberId){
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  const newItem={id:uid(),name:'',qty:1,category:'Équipement',rarity:'Commun',description:'',icon:null,ownerId:memberId};
  window._guildChestItem=newItem;
  openModal(`<div class="modal" onclick="event.stopPropagation()">
    <div class="modal-header"><span class="modal-title">📦 Déposer dans le casier de ${esc(m.name)}</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="field"><label>Nom de l'objet</label><input value="" oninput="window._guildChestItem.name=this.value" placeholder="Épée +1..." style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px"></div>
      <div class="grid2">
        <div class="field"><label>Quantité</label><input type="number" value="1" min="1" oninput="window._guildChestItem.qty=+this.value||1" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px"></div>
        <div class="field"><label>Catégorie</label><select onchange="window._guildChestItem.category=this.value" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px">${['Arme','Armure','Potion','Parchemin','Équipement','Trésor','Divers'].map(c=>`<option>${c}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>Rareté</label><select onchange="window._guildChestItem.rarity=this.value" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px">${Object.keys(RARITY).map(r=>`<option>${r}</option>`).join('')}</select></div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="guildChestSaveItem()">Déposer</button>
      </div>
    </div>
  </div>`);
}

function guildChestSaveItem(){
  const item=window._guildChestItem; if(!item||!item.name.trim()) return;
  if(!DB.guildInventory) DB.guildInventory=[];
  DB.guildInventory.push(item);
  save(); closeModal(); renderMemberDetail(); toast('Objet déposé dans le casier !');
}

function guildChestRemove(idx){
  if(!confirm('Retirer cet objet du casier ?')) return;
  DB.guildInventory.splice(idx,1);
  save(); renderMemberDetail(); toast('Objet retiré.');
}

function renderMemberLore(m){
  return `<div style="display:flex;flex-direction:column;gap:16px">
    <div class="card">
      <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">📖 Historique</div>
      <p style="color:var(--muted);font-family:'Crimson Pro',serif;font-size:16px;line-height:1.8;white-space:pre-wrap">${esc(m.loreBackground||'')}</p>
      ${!m.loreBackground?`<div style="color:var(--dim);font-style:italic;font-size:13px">Aucun historique renseigné.</div>`:''}
    </div>
    ${m.lorePersonality?`<div class="card">
      <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">🎭 Personnalité & Idéaux</div>
      <p style="color:var(--muted);font-family:'Crimson Pro',serif;font-size:15px;line-height:1.7;white-space:pre-wrap">${esc(m.lorePersonality)}</p>
    </div>`:''}
    ${m.loreBonds||m.loreFlaws?`<div class="card">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        ${m.loreBonds?`<div>
          <div style="font-size:11px;color:var(--gold);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">🔗 Liens</div>
          <p style="color:var(--muted);font-family:'Crimson Pro',serif;font-size:14px;line-height:1.7;white-space:pre-wrap">${esc(m.loreBonds)}</p>
        </div>`:''}
        ${m.loreFlaws?`<div>
          <div style="font-size:11px;color:var(--red);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">💀 Défauts & Secrets</div>
          <p style="color:var(--muted);font-family:'Crimson Pro',serif;font-size:14px;line-height:1.7;white-space:pre-wrap">${esc(m.loreFlaws)}</p>
        </div>`:''}
      </div>
    </div>`:''}
    ${m.loreDmSecrets?`<div class="card" style="border-color:#78350f">
      <div style="font-size:11px;color:var(--gold);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">🔒 Secrets MJ</div>
      <div class="secret-box"><p class="secret-text" style="white-space:pre-wrap">${esc(m.loreDmSecrets)}</p></div>
    </div>`:''}
    <!-- AVENTURES LIÉES AU PERSONNAGE -->
    ${(()=>{
      const memberJournal = (DB.journal||[]).filter(e=>
        e.authorId===m.id || (e.participants||[]).includes(m.id)
      ).sort((a,b)=>b.id-a.id);
      if(!memberJournal.length) return `<div class="card" style="border-style:dashed;opacity:.6">
        <div style="font-size:11px;color:var(--dim);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px">📜 Aventures</div>
        <div style="color:var(--dim);font-size:12px;font-style:italic">Aucune entrée de journal pour ce personnage.</div>
      </div>`;
      return `<div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase">📜 Aventures (${memberJournal.length})</div>
          <button class="btn btn-xs btn-ghost" onclick="switchModule('journal',document.querySelector('[data-module=journal]'))">Tout voir →</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${memberJournal.slice(0,5).map(e=>{
            const pc=PLANE_COL[e.plane]||'var(--indigo)';
            const isAuthor=e.authorId===m.id;
            return `<div onclick="switchModule('journal',document.querySelector('[data-module=journal]'));setTimeout(()=>{journalSelectedId=${e.id};renderJournalSidebar();renderJournalEntry()},100)"
              style="background:var(--bg);border:1px solid var(--border2);border-left:3px solid ${pc};border-radius:6px;padding:8px 12px;cursor:pointer;display:flex;align-items:center;gap:8px"
              onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='var(--bg)'">
              <div style="flex:1;min-width:0">
                <div style="font-family:'Cinzel',serif;font-weight:600;font-size:13px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.title)}</div>
                <div style="color:var(--dim);font-size:11px;margin-top:1px">${esc(e.date)} · <span style="color:${pc}">${esc(e.plane)}</span></div>
              </div>
              ${isAuthor?`<span style="background:var(--indigo)22;color:var(--indigo);padding:1px 6px;border-radius:3px;font-size:10px">auteur</span>`:`<span style="background:var(--surface2);color:var(--dim);padding:1px 6px;border-radius:3px;font-size:10px">participant</span>`}
            </div>`;
          }).join('')}
          ${memberJournal.length>5?`<div style="text-align:center;color:var(--dim);font-size:11px;font-style:italic">+${memberJournal.length-5} autres entrées</div>`:''}
        </div>
      </div>`;
    })()}
    <div style="text-align:center">
      <button class="btn btn-outline btn-sm" onclick="openMemberModal(${m.id});setTimeout(()=>{switchMemTab(6)},200)">✏️ Éditer le Lore</button>
    </div>
  </div>`;
}
// ── Transfert bourse ↔ banque de guilde ──────────────────────
function openBourseTransferModal(memberId){
  const m = DB.members.find(x=>x.id===memberId); if(!m) return;
  if(!m.gold) m.gold={pp:0,po:0,pa:0,pc:0};
  if(!m.bank) m.bank={pp:0,po:0,pa:0,pc:0};
  window._bourseTransferId = memberId;
  window._bourseDir = 'toBank'; // 'toBank' or 'toSelf'
  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:420px">
    <div class="modal-header">
      <span class="modal-title">⇄ Bourse ↔ Banque de Guilde</span>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <!-- Résumé actuel -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div style="background:var(--surface2);border-radius:8px;padding:10px">
          <div style="font-size:10px;color:var(--dim);text-transform:uppercase;margin-bottom:6px">💰 Sur soi</div>
          ${[['pp','PP','#c084fc'],['po','PO','#fbbf24'],['pa','PA','#9ca3af'],['pc','PC','#b45309']].map(([k,l,col])=>
            `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">
              <span style="color:var(--dim)">${l}</span><span style="color:${col};font-weight:700">${m.gold[k]||0}</span>
            </div>`).join('')}
        </div>
        <div style="background:var(--surface2);border-radius:8px;padding:10px">
          <div style="font-size:10px;color:var(--dim);text-transform:uppercase;margin-bottom:6px">🏦 Banque</div>
          ${[['pp','PP','#c084fc'],['po','PO','#fbbf24'],['pa','PA','#9ca3af'],['pc','PC','#b45309']].map(([k,l,col])=>
            `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">
              <span style="color:var(--dim)">${l}</span><span style="color:${col};font-weight:700">${m.bank[k]||0}</span>
            </div>`).join('')}
        </div>
      </div>
      <!-- Formulaire -->
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <select onchange="window._bourseDir=this.value" style="flex:1;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:6px 8px">
          <option value="toBank">💰 Bourse → 🏦 Banque</option>
          <option value="toSelf">🏦 Banque → 💰 Bourse</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px" id="bourse-inputs">
        ${[['pp','PP','#c084fc'],['po','PO','#fbbf24'],['pa','PA','#9ca3af'],['pc','PC','#b45309']].map(([k,l,col])=>`
          <div style="text-align:center">
            <div style="font-size:10px;color:${col};margin-bottom:3px;font-weight:700">${l}</div>
            <input type="number" id="bt-${k}" min="0" value="0"
              style="width:100%;background:var(--surface2);border:1px solid ${col}44;border-radius:5px;color:${col};padding:5px;text-align:center;font-size:14px;font-weight:700">
          </div>`).join('')}
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="doBourseTransfer(${memberId})">Transférer</button>
      </div>
    </div>
  </div>`);
}

function doBourseTransfer(memberId){
  const m = DB.members.find(x=>x.id===memberId); if(!m) return;
  if(!m.gold) m.gold={pp:0,po:0,pa:0,pc:0};
  if(!m.bank) m.bank={pp:0,po:0,pa:0,pc:0};
  const dir = window._bourseDir||'toBank';
  let ok = true;
  ['pp','po','pa','pc'].forEach(k=>{
    const qty = +(document.getElementById('bt-'+k)?.value||0);
    if(qty<=0) return;
    const src = dir==='toBank' ? m.gold : m.bank;
    const dst = dir==='toBank' ? m.bank : m.gold;
    if((src[k]||0) < qty){ ok=false; return; }
    src[k] = (src[k]||0) - qty;
    dst[k] = (dst[k]||0) + qty;
  });
  if(!ok){ toast('Fonds insuffisants !'); return; }
  save(); closeModal(); renderMemberDetail(); updateStats();
  toast(dir==='toBank'?'Déposé en banque !':'Retiré de la banque !');
}

function renderMemberKills(m){
  const kills = m.kills||[];
  const total = kills.reduce((s,k)=>s+(k.count||1),0);

  if(!kills.length) return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center">
    <div style="font-size:52px;margin-bottom:14px">☠️</div>
    <div style="color:var(--muted);font-style:italic;font-size:15px">Aucun ennemi terrassé pour l'instant.</div>
    <button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="openAddKillModal(${m.id})">+ Enregistrer un kill</button>
  </div>`;

  return `<div style="display:flex;flex-direction:column;gap:16px">
    <!-- Header stats -->
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:28px">☠️</span>
        <div>
          <div style="font-size:22px;font-weight:900;color:var(--text)">${total}</div>
          <div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.08em">ennemis terrassés</div>
        </div>
        <div style="background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;margin-left:8px">
          <div style="font-size:18px;font-weight:700;color:var(--indigo)">${kills.length}</div>
          <div style="font-size:10px;color:var(--dim);text-transform:uppercase">types différents</div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openAddKillModal(${m.id})">+ Ajouter</button>
    </div>

    <!-- Grille de kills -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px">
      ${kills.map((k,ki)=>{
        // Chercher l'image dans le bestiaire si on a un beastId
        const beast = k.beastId ? (DB.bestiary||[]).find(b=>b.id===k.beastId) : null;
        const img = k.image || beast?.image || null;
        const ico = k.icon || beast?.icon || '☠️';
        return `<div style="background:var(--surface);border:1px solid #7f1d1d44;border-radius:12px;padding:14px;text-align:center;position:relative;
          transition:border-color .15s,transform .15s"
          onmouseover="this.style.borderColor='#f87171';this.style.transform='translateY(-2px)'"
          onmouseout="this.style.borderColor='#7f1d1d44';this.style.transform=''">
          <!-- Image ou icône -->
          <div style="width:60px;height:60px;margin:0 auto 10px;background:#7f1d1d22;border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden;border:2px solid #7f1d1d44">
            ${img
              ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
              : `<span style="font-size:26px">${ico}</span>`}
          </div>
          <!-- Nom -->
          <div style="font-family:'Cinzel',serif;font-weight:700;font-size:12px;color:var(--text);margin-bottom:6px;line-height:1.3">${esc(k.name)}</div>
          <!-- Compteur -->
          <div style="display:flex;align-items:center;justify-content:center;gap:4px">
            <button onclick="memberKillDelta(${m.id},${ki},-1)" class="btn btn-xs btn-ghost" style="padding:2px 6px;font-size:12px;color:var(--dim)">−</button>
            <span style="background:#7f1d1d;color:#fca5a5;padding:3px 10px;border-radius:6px;font-weight:900;font-size:14px;min-width:28px">${k.count||1}</span>
            <button onclick="memberKillDelta(${m.id},${ki},1)" class="btn btn-xs btn-ghost" style="padding:2px 6px;font-size:12px;color:var(--red)">+</button>
          </div>
          <!-- Bestiaire link -->
          ${beast?`<div style="margin-top:6px"><a href="#" onclick="beastViewMode='detail';selectedBeastId=${beast.id};switchModule('bestiary',document.querySelector('[data-module=bestiary]'));event.preventDefault()" style="color:var(--dim);font-size:10px">→ Bestiaire</a></div>`:''}
          <!-- Delete -->
          <button onclick="memberKillRemove(${m.id},${ki})" style="position:absolute;top:6px;right:6px;background:none;border:none;color:var(--dim);cursor:pointer;font-size:12px;padding:2px" title="Retirer">✕</button>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function renderMemberPDF(m){
  return m.pdf?`
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">
      <span style="font-size:22px">📄</span>
      <span style="color:var(--text);font-size:13px;flex:1">${esc(m.pdfName||'fiche.pdf')}</span>
      <button class="btn btn-outline btn-sm" onclick="viewPDF(${m.id})">👁️ Voir</button>
      <button class="btn btn-danger btn-xs" onclick="removePDF(${m.id})">✕</button>
    </div>`:
    `<label class="img-upload-btn" style="cursor:pointer">
      <span style="font-size:24px">📄</span>
      <span>Glisser un PDF ou cliquer pour l'attacher</span>
      <input type="file" accept="application/pdf" style="display:none" onchange="uploadPDF(${m.id},this)">
    </label>`;
}

function deleteMember(id){
  if(!confirm('Retirer cet aventurier de la guilde ?')) return;
  deleteBlob('m_av_'+id);
  deleteBlob('m_pdf_'+id);
  DB.members = DB.members.filter(m=>m.id!==id);
  selectedMemberId = DB.members[0]?.id||null;
  window._memberDetailTab=0;
  save(); renderMembers();
}

function uploadPDF(memberId, input){
  if(!input.files[0]) return;
  const file = input.files[0];
  readFile(file, data=>{
    const m = DB.members.find(x=>x.id===memberId);
    if(!m) return;
    m.pdf=data; m.pdfName=file.name;
    save(); renderMemberDetail(); toast('PDF attaché !');
  });
}
function removePDF(memberId){
  const m=DB.members.find(x=>x.id===memberId);
  if(!m) return;
  m.pdf=null; m.pdfName=null;
  deleteBlob('m_pdf_'+memberId);
  save(); renderMemberDetail();
}
function viewPDF(memberId){
  const m=DB.members.find(x=>x.id===memberId);
  if(!m||!m.pdf) return;
  openModal(`<div class="modal modal-wide" style="max-width:95vw;max-height:95vh;height:95vh" onclick="event.stopPropagation()">
    <div class="modal-header"><span class="modal-title">📄 ${esc(m.pdfName||'Fiche')}</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div style="height:calc(100% - 60px)"><iframe src="${m.pdf}" style="width:100%;height:100%;border:none;border-radius:0 0 14px 14px"></iframe></div>
  </div>`);
}

