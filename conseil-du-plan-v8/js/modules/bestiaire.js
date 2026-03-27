/**
 * MODULE BESTIAIRE — code (sans données)
 * Extrait de V7_6.html lignes 7350-7367
 */
// ================================================================
// MODULE BESTIAIRE
// ================================================================
// Chaque créature a un statblock complet D&D 5e.
// Elle peut être placée comme token sur la battlemap.
// Les membres peuvent avoir un "tableau de chasse" qui référence
// des créatures du bestiaire.
// ================================================================
let selectedBeastId = DB.bestiary?.[0]?.id || null;
let beastSearch = '';
let beastViewMode = 'detail'; // 'detail' (master-detail) or 'grid' (card grid)
const BEAST_SIZES = ['Infime','Très petit','Petit','Moyen','Grand','Très grand','Gigantesque'];
const CREATURE_TYPES = ['Aberration','Bête','Céleste','Construction','Dragon','Élémentaire','Fée','Fiélon','Géant','Humanoïde','Mort-vivant','Plante','Vase','Monstruosité'];
// ALIGNMENTS already defined above

// ══════════════════════════════════════════════════════════════

var AIDEDD_MONSTERS = []
  // Extrait de https://www.aidedd.org/dnd/monstres.php (962 monstres, juin 2024) PS POUR CLAUDE : la var AIDEDD_MONSTERS a été effacée, j'aimerais un .json externe à la place, avec dans ce code une fonction d'import qui ajoute les monstres à notre bestiaire (en évitant les doublons par nom). Merci ! (et aussi une ligne "exemple" du json pour pas avoir à l'ouvrir pour voir la structure)
  // Format adapté pour correspondre à notre structure de données (voir importAideddMonsters ci-dessous)]
/**
 * MODULE BESTIAIRE — suite (render, search, etc.)
 * Extrait de V7_6.html lignes 7369-7806
 */

function importAideddMonsters() {
  if(!confirm('Importer les ' + AIDEDD_MONSTERS.length + ' monstres du bestiaire AideDD ?\nLes monstres ayant déjà le même nom seront ignorés.')) return;
  if(!DB.bestiary) DB.bestiary = [];
  var existing = {};
  DB.bestiary.forEach(function(b){ existing[b.name.toLowerCase()] = true; });
  var added = 0;
  AIDEDD_MONSTERS.forEach(function(m) {
    if(existing[m.name.toLowerCase()]) return;
    var strNum = typeof m.str === 'number' ? m.str : 10;
    var dexNum = typeof m.dex === 'number' ? m.dex : 10;
    var conNum = typeof m.con === 'number' ? m.con : 10;
    var intNum = typeof m.intel === 'number' ? m.intel : 10;
    var wisNum = typeof m.wis === 'number' ? m.wis : 10;
    var chaNum = typeof m.cha === 'number' ? m.cha : 10;
    DB.bestiary.push({
      id: uid(), name: m.name, icon: m.icon, image: null,
      size: m.size||'', type: m.type||'', alignment: m.alignment||'',
      cr: m.cr||'0', hp: m.hp||'', ac: m.ac||'', speed: m.speed||'',
      stats: {str:strNum, dex:dexNum, con:conNum, int:intNum, wis:wisNum, cha:chaNum},
      saves: m.saves||'', skills: m.skills||'', senses: m.senses||'',
      languages: m.languages||'', resistances: m.resistances||'',
      dmg_immunities: m.dmg_immunities||'', cond_immunities: m.cond_immunities||'',
      traits: m.traits||'',
      actions: m.actions||'',
      actionsList: m.actionsList||[],
      bonus_actions: m.bonus_actions||'',
      reactions: m.reactions||'',
      legendary: m.legendary||'',
      dmNotes: '', kills: 0, source: 'aidedd'
    });
    added++;
  });
  save(); renderBestiary();
  toast('✅ ' + added + ' monstres importés ! (' + (AIDEDD_MONSTERS.length - added) + ' déjà présents)');
}

function clearBestiary() {
  if(!confirm('⚠️ Supprimer TOUTES les créatures du bestiaire ?\nCette action est irréversible.')) return;
  DB.bestiary = [];
  save(); renderBestiary();
  toast('🗑️ Bestiaire vidé !');
}


function renderBestiary(){
  const el=document.getElementById('module-bestiary');
  el.innerHTML=`
  <div class="module-header">
    <span style="font-size:26px">🐉</span>
    <div><div class="module-title">Bestiaire</div><div class="module-bar"></div></div>
    <div style="flex:1"></div>
    <input placeholder="🔍 Rechercher..." value="${esc(beastSearch)}" oninput="beastSearch=this.value;beastViewMode==='grid'?renderBeastGrid():renderBeastList()"
      style="background:var(--surface);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:6px 14px;font-size:13px;width:200px">
    <button onclick="beastViewMode=beastViewMode==='detail'?'grid':'detail';renderBestiary()" class="btn btn-ghost btn-sm">
      ${beastViewMode==='detail'?'⊞ Grille':'☰ Détail'}
    </button>
    <button class="btn btn-outline btn-sm" onclick="importAideddMonsters()" title="Importer 962 monstres AideDD">⬇️ Import AideDD</button>
    <button class="btn btn-danger btn-sm" onclick="clearBestiary()" title="Supprimer toutes les créatures">🗑️ Vider</button>
    <button class="btn btn-primary" onclick="openBeastModal()">+ Ajouter une créature</button>
  </div>
  ${beastViewMode==='grid'?
    '<div id="beast-grid"></div>'
  :'<div style="display:flex;gap:20px;min-height:70vh"><div style="width:240px;flex-shrink:0;display:flex;flex-direction:column;gap:6px;overflow-y:auto;max-height:80vh" id="beast-list"></div><div style="flex:1;overflow-y:auto" id="beast-detail"></div></div>'}
  `;
  if(beastViewMode==='grid') renderBeastGrid();
  else { renderBeastList(); renderBeastDetail(); }
}

function renderBeastGrid(){
  const el=document.getElementById('beast-grid');
  if(!el) return;
  const q=beastSearch.toLowerCase();
  const list=(DB.bestiary||[]).filter(b=>!q||b.name.toLowerCase().includes(q)||(b.type||'').toLowerCase().includes(q));
  if(!list.length){ el.innerHTML=`<div style="text-align:center;color:var(--dim);padding:40px;font-style:italic">Aucune créature</div>`; return; }
  el.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-top:4px">`
    + list.map(b=>{
      const crColor=+b.cr>=20?'#f87171':+b.cr>=10?'#fb923c':+b.cr>=5?'#fbbf24':+b.cr>=1?'#4ade80':'#9ca3af';
      return `<div onclick="beastViewMode='detail';selectedBeastId=${b.id};renderBestiary()"
        style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;cursor:pointer;transition:border-color .15s;text-align:center"
        onmouseover="this.style.borderColor='var(--indigo)'" onmouseout="this.style.borderColor='var(--border)'">
        <div style="width:64px;height:64px;margin:0 auto 10px;background:var(--surface2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;overflow:hidden">
          ${b.image?`<img src="${b.image}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:`${b.icon||'👾'}`}
        </div>
        <div style="font-family:'Cinzel',serif;font-weight:700;font-size:14px;color:var(--text);margin-bottom:4px">${esc(b.name)}</div>
        <div style="color:var(--dim);font-size:11px;margin-bottom:8px">${b.size||''} ${b.type||''}</div>
        <div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap">
          <span style="background:${crColor}22;color:${crColor};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700">FP ${b.cr||'—'}</span>
          <span style="background:var(--surface2);color:var(--muted);padding:2px 8px;border-radius:4px;font-size:11px">❤️ ${b.hp||'—'}</span>
        </div>
        ${b.kills?`<div style="margin-top:8px"><span style="background:#7f1d1d;color:#fca5a5;padding:2px 8px;border-radius:4px;font-size:11px">☠️ ×${b.kills}</span></div>`:''}
      </div>`;
    }).join('') + '</div>';
}
function renderBeastList(){
  const el=document.getElementById('beast-list');
  if(!el) return;
  const q=beastSearch.toLowerCase();
  let list=(DB.bestiary||[]).filter(b=>!q||b.name.toLowerCase().includes(q)||(b.type||'').toLowerCase().includes(q));
  if(beastSortBy==='name')   list.sort((a,b)=>a.name.localeCompare(b.name));
  else if(beastSortBy==='cr') list.sort((a,b)=>{const pa=parseFloat(a.cr)||0,pb=parseFloat(b.cr)||0;return pa-pb;});
  else if(beastSortBy==='type') list.sort((a,b)=>(a.type||'').localeCompare(b.type||''));
  else if(beastSortBy==='kills') list.sort((a,b)=>(b.kills||0)-(a.kills||0));

  const sortBtns = `<div style="display:flex;gap:3px;margin-bottom:6px;flex-wrap:wrap">
    ${[['default','👾'],['name','A→Z'],['cr','FP'],['type','Type'],['kills','☠️']].map(([v,l])=>
      `<button onclick="beastSortBy='${v}';renderBeastList()" class="btn btn-xs ${beastSortBy===v?'btn-primary':'btn-ghost'}">${l}</button>`
    ).join('')}
  </div>`;

  el.innerHTML = sortBtns + (list.map(b=>{
    const sel=selectedBeastId===b.id;
    return `<div onclick="selectedBeastId=${b.id};renderBeastList();renderBeastDetail()" style="
      background:${sel?'var(--selected)':'var(--surface)'};
      border:1px solid ${sel?'var(--indigo)':'var(--border)'};
      border-radius:8px;padding:10px 12px;cursor:pointer;display:flex;align-items:center;gap:10px;
      transition:border-color .15s">
      <div style="width:36px;height:36px;background:var(--surface2);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;overflow:hidden">
        ${b.image?`<img src="${b.image}" style="width:100%;height:100%;object-fit:cover">`:`${b.icon||'👾'}`}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-family:'Cinzel',serif;font-weight:600;font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(b.name)}</div>
        <div style="color:var(--dim);font-size:11px">${b.size||''} ${b.type||''} · FP ${b.cr||'—'}</div>
      </div>
      ${b.kills?`<span style="background:#7f1d1d;color:#fca5a5;padding:1px 6px;border-radius:4px;font-size:10px">☠️ ${b.kills}</span>`:''}
    </div>`;
  }).join('') || `<div style="color:var(--dim);text-align:center;padding:20px;font-style:italic">Aucune créature trouvée</div>`);
}

function renderBeastDetail(){
  const el=document.getElementById('beast-detail');
  if(!el) return;
  const b=DB.bestiary?.find(x=>x.id===selectedBeastId);
  if(!b){
    el.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--dim)">
      <div style="font-size:48px;margin-bottom:12px">🐉</div>
      <div style="font-style:italic">Sélectionnez une créature ou créez-en une nouvelle</div>
    </div>`;
    return;
  }
  el.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:16px">
    <!-- HEADER -->
    <div class="card" style="display:flex;gap:20px;align-items:flex-start">
      <div style="width:80px;height:80px;background:var(--surface2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:44px;overflow:hidden;flex-shrink:0;border:1px solid var(--border2)">
        ${b.image?`<img src="${b.image}" style="width:100%;height:100%;object-fit:cover">`:`${b.icon||'👾'}`}
      </div>
      <div style="flex:1">
        <div style="font-family:'Cinzel',serif;font-weight:900;font-size:24px;color:var(--text)">${esc(b.name)}</div>
        <div style="color:var(--muted);font-size:14px;margin-bottom:8px;font-style:italic">${b.size||''} ${b.type||''} · ${b.alignment||''}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span style="background:#7f1d1d22;color:#fca5a5;padding:3px 10px;border-radius:4px;font-size:12px;border:1px solid #7f1d1d44">FP ${b.cr||'—'}</span>
          <span style="background:var(--surface2);color:var(--muted);padding:3px 10px;border-radius:4px;font-size:12px">❤️ PV ${b.hp||'—'}</span>
          <span style="background:var(--surface2);color:var(--muted);padding:3px 10px;border-radius:4px;font-size:12px">🛡️ CA ${b.ac||'—'}</span>
          <span style="background:var(--surface2);color:var(--muted);padding:3px 10px;border-radius:4px;font-size:12px">💨 ${b.speed||'9m'}</span>
          ${b.kills?`<span style="background:#7f1d1d;color:#fca5a5;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:700">☠️ Tués : ${b.kills}</span>`:''}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="btn btn-outline btn-sm" onclick="openBeastModal(${b.id})">✏️ Modifier</button>
        <button class="btn btn-danger btn-xs" onclick="deleteBeast(${b.id})">Supprimer</button>
        <button class="btn btn-outline btn-xs" style="color:var(--gold);border-color:var(--gold)44"
          onclick="openLootGenerator(${b.id})">🎁 Loot</button>
        <button class="btn btn-ghost btn-xs" onclick="addBeastToMap(${b.id})" title="Placer sur la Battlemap active">🗺️ → Map</button>
      </div>
    </div>

    <!-- STATS -->
    <div class="card">
      <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px">Caractéristiques</div>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;text-align:center;margin-bottom:12px">
        ${ABILITIES.map(a=>{const v=b.stats?.[a.key]||10;return `
          <div class="stat-score">
            <div class="stat-score-val">${v}</div>
            <div class="stat-score-mod">${modStr(v)}</div>
            <div class="stat-score-name">${a.name}</div>
          </div>`;}).join('')}
      </div>
      ${[['Jets de sauvegarde',b.saves],['Compétences',b.skills],['Résistances',b.resistances],
         ['Immunités (dégâts)',b.dmg_immunities],['Immunités (états)',b.cond_immunities],
         ['Sens',b.senses],['Langues',b.languages]
        ].filter(r=>r[1]).map(r=>`
        <div style="display:flex;gap:8px;padding:4px 0;border-top:1px solid var(--border);font-size:12px">
          <span style="color:var(--muted);font-weight:600;min-width:140px;flex-shrink:0">${r[0]}</span>
          <span style="color:var(--text)">${esc(r[1])}</span>
        </div>`).join('')}
    </div>

    <!-- TRAITS + ACTIONS -->
    ${b.traits||b.actionsList?.length||b.actions||b.legendary?`
    <div class="card">
      ${b.traits?`
        <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">Traits</div>
        <p style="color:var(--muted);font-family:'Crimson Pro',serif;font-size:15px;line-height:1.7;margin-bottom:14px">${esc(b.traits)}</p>`:''}
      ${(b.actionsList?.length||b.actions)?`
        <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">Actions</div>
        ${b.actionsList?.length
          ? b.actionsList.map(a=>`
            <div style="background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:10px 14px;margin-bottom:8px">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                <span style="font-family:'Cinzel',serif;font-weight:700;color:var(--text);font-size:14px">${esc(a.name)}</span>
                ${a.type?`<span style="background:var(--indigo)22;color:var(--indigo);padding:1px 7px;border-radius:3px;font-size:11px">${esc(a.type)}</span>`:''}
                ${a.atk?`<span style="color:var(--green);font-size:12px">🎯 +${esc(a.atk)}</span>`:''}
                ${a.dmg?`<span style="color:#f87171;font-size:12px">⚔️ ${esc(a.dmg)}</span>`:''}
              </div>
              ${a.desc?`<p style="color:var(--muted);font-family:'Crimson Pro',serif;font-size:14px;line-height:1.6;margin:0">${esc(a.desc)}</p>`:''}
            </div>`).join('')
          : `<p style="color:var(--muted);font-family:'Crimson Pro',serif;font-size:15px;line-height:1.7;margin-bottom:14px">${esc(b.actions)}</p>`
        }`:''}
      ${b.legendary?`
        <div style="font-size:11px;color:var(--gold);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;margin-top:8px">Actions Légendaires</div>
        <p style="color:#fcd34d;font-family:'Crimson Pro',serif;font-size:15px;line-height:1.7">${esc(b.legendary)}</p>`:''}
    </div>`:''}

    <!-- NOTES MJ -->
    ${b.dmNotes?`
    <div class="card" style="border-color:#78350f">
      <div style="font-size:11px;color:var(--gold);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">🔒 Notes MJ</div>
      <div class="secret-box"><p class="secret-text">${esc(b.dmNotes)}</p></div>
    </div>`:''}
  </div>`;
}


// ── GÉNÉRATEUR DE LOOT (V6.2) ─────────────────────────────────
function openLootGenerator(beastId){
  const b = (DB.bestiary||[]).find(x=>x.id===beastId);
  if(!b) return;
  _showLootModal(b, generateLoot(b.cr||'0'));
}

function _relancerLoot(beastId){
  const b=(DB.bestiary||[]).find(x=>x.id===beastId);
  if(b) _showLootModal(b, generateLoot(b.cr||'0'));
}

function _showLootModal(b, loot){
  const tier = getLootTier(b.cr||'0');
  const rc = {'Commun':'#9ca3af','Peu commun':'#4ade80','Rare':'#60a5fa','Très rare':'#a78bfa','Légendaire':'#f59e0b'};

  let html = '<div class="modal" onclick="event.stopPropagation()" style="max-width:460px">'
    + '<div class="modal-header"><span class="modal-title">🎁 Loot — '+esc(b.name)+'</span>'
    + '<button class="modal-close" onclick="closeModal()">✕</button></div>'
    + '<div class="modal-body">'
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding:8px 12px;background:var(--surface2);border-radius:7px">'
    + '<span style="font-size:20px">'+(b.icon||'👾')+'</span>'
    + '<span style="color:var(--muted);font-size:12px">FP '+esc(b.cr||'—')+' · '+tier.label+'</span>'
    + '<button onclick="_relancerLoot('+b.id+')"'
    + ' class="btn btn-ghost btn-xs" style="margin-left:auto">🎲 Relancer</button>'
    + '</div>'

    // Or
    + '<div style="background:var(--surface2);border:1px solid #fbbf2444;border-radius:8px;padding:12px;margin-bottom:12px;display:flex;align-items:center;gap:10px">'
    + '<span style="font-size:22px">🪙</span>'
    + '<div><div style="font-size:18px;font-weight:900;color:#fbbf24">'+loot.gold+' PO</div>'
    + '<div style="font-size:11px;color:var(--dim)">Monnaie trouvée</div></div>'
    + '<button onclick="addLootGoldToGuild('+loot.gold+')" class="btn btn-xs btn-outline" style="margin-left:auto;border-color:#fbbf2444;color:#fbbf24">+ Coffre guilde</button>'
    + '</div>'

    // Items
    + (loot.items.length ? '<div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Objets trouvés</div>'
      + '<div style="display:flex;flex-direction:column;gap:7px">'
      + loot.items.map((item,i)=>{
          const col = rc[item.rarity]||'#9ca3af';
          return '<div style="border:1px solid '+col+'44;border-radius:8px;padding:10px 12px;background:var(--surface2);display:flex;gap:10px;align-items:center">'
            + '<span style="font-size:22px">'+(item.emoji||'📦')+'</span>'
            + '<div style="flex:1"><div style="font-weight:700;color:var(--text)">'+(item.name||'')+'</div>'
            + '<div style="font-size:11px;color:'+col+'">'+item.rarity+'</div>'
            + '<div style="font-size:11px;color:var(--dim);margin-top:2px">'+(item.description||'')+'</div>'
            + '</div>'
            + '<button onclick="addLootItemToGuild('+JSON.stringify(item).replace(/"/g,"'")+')" class="btn btn-xs btn-outline" style="border-color:'+col+'44;color:'+col+'" title="Ajouter au coffre guilde">+ Guilde</button>'
            + '</div>';
        }).join('')
      + '</div>'
      : '<div style="color:var(--dim);font-style:italic;text-align:center;padding:10px">Aucun objet (malchance !)</div>')

    + '</div>'
    + '<div class="modal-footer">'
    + '<button class="btn btn-ghost" onclick="closeModal()">Fermer</button>'
    + '<button class="btn btn-primary" onclick="addAllLootToGuild('+JSON.stringify(loot).replace(/"/g,"'")+')" title="Tout ajouter au coffre de la guilde">🏦 Tout → Guilde</button>'
    + '</div></div>';

  openModal(html);
}

function addLootGoldToGuild(amount){
  if(!DB.guildBank) DB.guildBank={pp:0,po:0,pa:0,pc:0};
  DB.guildBank.po = (DB.guildBank.po||0) + amount;
  save(); toast('🪙 +'+amount+' PO ajoutés au coffre de la guilde !');
}

function addLootItemToGuild(item){
  const newItem = typeof item==='string' ? JSON.parse(item.replace(/'/g,'"')) : {...item};
  newItem.id = uid();
  if(!DB.guildInventory) DB.guildInventory=[];
  DB.guildInventory.push(newItem);
  save(); toast('📦 '+esc(newItem.name)+' ajouté au coffre !');
}

function addAllLootToGuild(loot){
  if(typeof loot==='string') loot=JSON.parse(loot.replace(/'/g,'"'));
  addLootGoldToGuild(loot.gold||0);
  (loot.items||[]).forEach(item=>addLootItemToGuild(item));
  closeModal(); toast('🎁 Tout le loot ajouté au coffre de la guilde !');
}

function addBeastToMap(beastId){
  const b=DB.bestiary?.find(x=>x.id===beastId);
  if(!b) return;
  const map=DB.battlemaps.find(m=>m.id===selectedMapId);
  if(!map){toast('Ouvre la Battlemap d\'abord !');return;}
  // Place at 0,0 or find free spot
  let x=0,y=0;
  while(map.tokens.find(t=>t.x===x&&t.y===y)&&x<map.width){ x++; if(x>=map.width){x=0;y++;} }
  map.tokens.push({id:'t'+uid(),label:b.name.slice(0,8),color:'#f87171',type:'enemy',
    image:b.image||null,beastId:b.id,memberId:null,x,y});
  save();
  toast(`${b.icon||'👾'} ${b.name} placé sur la map !`);
  if(document.getElementById('map-grid')) renderMapCanvas();
}

function openBeastModal(editId){
  const isEdit=!!editId;
  const src=isEdit?DB.bestiary.find(b=>b.id===editId):null;
  const b=isEdit?JSON.parse(JSON.stringify(src)):{
    id:uid(),name:'',icon:'👾',image:null,size:'Moyen',type:'Bête',alignment:'Neutre',
    cr:'1',hp:'10 (3d6)',ac:'12',speed:'9m',
    stats:{str:10,dex:10,con:10,int:10,wis:10,cha:10},
    traits:'',actions:'',legendary:'',dmNotes:'',kills:0
  };
  // Migrer actions string → array si nécessaire
  if(typeof b.actions === 'string' && b.actions.trim()){
    b.actionsList = b.actions.split(/\n{2,}|(?=\w[^.]*\.\s)/).filter(s=>s.trim()).map((s,i)=>({id:uid(),name:'Action '+(i+1),type:'mêlée',atk:'',dmg:'',desc:s.trim()}));
    b.actions = undefined;
  }
  if(!Array.isArray(b.actionsList)) b.actionsList = [];
  window._editBeast=b; window._imgUploads['beast-img']=null;
  // Render actions list après ouverture modale
  setTimeout(()=>refreshBeastActionsList(), 50);
  openModal(`<div class="modal modal-wide" onclick="event.stopPropagation()" style="max-height:90vh;overflow:auto">
    <div class="modal-header"><span class="modal-title">${isEdit?'✏️ Modifier':'🐉 Nouvelle Créature'}</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="grid2">
        <div class="field"><label>Nom</label><input value="${esc(b.name)}" oninput="window._editBeast.name=this.value" placeholder="Gobelin, Dragon rouge..."></div>
        <div class="field"><label>Facteur de Puissance (FP)</label><input value="${esc(b.cr)}" oninput="window._editBeast.cr=this.value" placeholder="1/4, 1, 5, 20..."></div>
        <div class="field"><label>Taille</label><select onchange="window._editBeast.size=this.value">${BEAST_SIZES.map(s=>`<option${s===b.size?' selected':''}>${s}</option>`).join('')}</select></div>
        <div class="field"><label>Type</label><select onchange="window._editBeast.type=this.value">${CREATURE_TYPES.map(s=>`<option${s===b.type?' selected':''}>${s}</option>`).join('')}</select></div>
        <div class="field"><label>Alignement</label><select onchange="window._editBeast.alignment=this.value">${ALIGNMENTS.map(s=>`<option${s===b.alignment?' selected':''}>${s}</option>`).join('')}</select></div>
        <div class="field"><label>Icône (emoji)</label><input value="${esc(b.icon||'👾')}" oninput="window._editBeast.icon=this.value" style="font-size:20px;width:80px;text-align:center"></div>
        <div class="field"><label>PV</label><input value="${esc(b.hp)}" oninput="window._editBeast.hp=this.value" placeholder="52 (8d10+8)"></div>
        <div class="field"><label>CA</label><input value="${esc(b.ac)}" oninput="window._editBeast.ac=this.value" placeholder="15 (armure de cuir)"></div>
        <div class="field"><label>Vitesse</label><input value="${esc(b.speed)}" oninput="window._editBeast.speed=this.value" placeholder="9m, vol 18m"></div>
      </div>
      <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin:12px 0 8px">Caractéristiques</div>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:14px">
        ${ABILITIES.map(a=>`
          <div style="text-align:center">
            <div style="font-size:10px;color:var(--dim);text-transform:uppercase;margin-bottom:4px">${a.name}</div>
            <input type="number" value="${b.stats?.[a.key]||10}" min="1" max="30"
              style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:6px;font-size:15px;font-weight:700;text-align:center"
              oninput="if(!window._editBeast.stats)window._editBeast.stats={};window._editBeast.stats['${a.key}']=+this.value">
          </div>`).join('')}
      </div>
      <div class="field"><label>Traits (Perception passive, résistances, immunités...)</label><textarea rows="3" oninput="window._editBeast.traits=this.value" placeholder="Résistance aux dégâts contondants, etc.">${esc(b.traits||'')}</textarea></div>
      <div class="field">
        <label>Actions <span style="font-weight:400;color:var(--dim);font-size:11px">(liste structurée)</span></label>
        <div id="beast-actions-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:6px"></div>
        <button type="button" class="btn btn-ghost btn-xs" onclick="beastActionAdd()">+ Ajouter une action</button>
      </div>
      <div class="field"><label>Actions Légendaires (optionnel)</label><textarea rows="2" oninput="window._editBeast.legendary=this.value" placeholder="Uniquement pour créatures légendaires...">${esc(b.legendary||'')}</textarea></div>
      <div class="field"><label>🔒 Notes MJ (secrètes)</label><textarea rows="2" oninput="window._editBeast.dmNotes=this.value" placeholder="Faiblesses cachées, comportement spécial...">${esc(b.dmNotes||'')}</textarea></div>
      ${imgUploadField('beast-img', b.image, '🖼️ Image / Illustration')}
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="saveBeast(${editId||'null'})">${isEdit?'Sauvegarder':'Créer'}</button>
      </div>
    </div>
  </div>`);
}

// ── Bestaire : éditeur liste d'actions ──────────────────────
function refreshBeastActionsList(){
  const el=document.getElementById('beast-actions-list');
  if(!el) return;
  const list=window._editBeast.actionsList||[];
  const ACTION_TYPES=['mêlée','distance','sort','légendaire','bonus','réaction','autre'];
  el.innerHTML=list.map((a,idx)=>`
    <div style="background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:10px 12px;position:relative">
      <div style="display:grid;grid-template-columns:1fr 120px;gap:6px;margin-bottom:6px">
        <div class="field" style="margin:0"><input value="${esc(a.name)}" placeholder="Nom de l'action"
          style="width:100%;background:var(--surface);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px"
          oninput="window._editBeast.actionsList[${idx}].name=this.value"></div>
        <div class="field" style="margin:0"><select style="width:100%;background:var(--surface);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px"
          onchange="window._editBeast.actionsList[${idx}].type=this.value">
          ${ACTION_TYPES.map(t=>`<option value="${t}"${a.type===t?' selected':''}>${t}</option>`).join('')}
        </select></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">
        <div class="field" style="margin:0"><input value="${esc(a.atk)}" placeholder="Bonus attaque (ex: 5)"
          style="width:100%;background:var(--surface);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px"
          oninput="window._editBeast.actionsList[${idx}].atk=this.value"></div>
        <div class="field" style="margin:0"><input value="${esc(a.dmg)}" placeholder="Dégâts (ex: 2d6+3)"
          style="width:100%;background:var(--surface);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px"
          oninput="window._editBeast.actionsList[${idx}].dmg=this.value"></div>
      </div>
      <textarea placeholder="Description de l'action..." rows="2"
        style="width:100%;background:var(--surface);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px;resize:vertical"
        oninput="window._editBeast.actionsList[${idx}].desc=this.value">${esc(a.desc||'')}</textarea>
      <button type="button" onclick="window._editBeast.actionsList.splice(${idx},1);refreshBeastActionsList()"
        style="position:absolute;top:8px;right:8px;background:none;border:none;color:var(--dim);cursor:pointer;font-size:16px" title="Supprimer">✕</button>
    </div>`).join('');
}
function beastActionAdd(){
  if(!window._editBeast.actionsList) window._editBeast.actionsList=[];
  window._editBeast.actionsList.push({id:uid(),name:'Nouvelle action',type:'mêlée',atk:'',dmg:'',desc:''});
  refreshBeastActionsList();
}

function saveBeast(editId){
  const b=window._editBeast;
  if(!b||!b.name.trim()) return;
  if(window._imgUploads['beast-img']) b.image=window._imgUploads['beast-img'];
  if(!DB.bestiary) DB.bestiary=[];
  if(editId&&editId!=='null') DB.bestiary=DB.bestiary.map(x=>x.id===editId?b:x);
  else { DB.bestiary.push(b); selectedBeastId=b.id; }
  save(); closeModal(); renderBestiary(); toast('Créature sauvegardée !');
}

function deleteBeast(id){
  if(!confirm('Supprimer cette créature du bestiaire ?')) return;
  DB.bestiary=DB.bestiary.filter(b=>b.id!==id);
  selectedBeastId=DB.bestiary[0]?.id||null;
  save(); renderBestiary();
}




