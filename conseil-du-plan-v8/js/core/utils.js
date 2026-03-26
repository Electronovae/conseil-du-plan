/**
 * HELPERS — RARITY, esc(), uid(), etc.
 * Extrait de V7_6.html lignes 1439-1642
 */
// ================================================================
// HELPERS
// ================================================================
const RARITY = {
  'Commun':     {cls:'badge-common',    col:'#9ca3af'},
  'Peu commun': {cls:'badge-uncommon',  col:'#4ade80'},
  'Rare':       {cls:'badge-rare',      col:'#60a5fa'},
  'Très rare':  {cls:'badge-veryrare',  col:'#c084fc'},
  'Légendaire': {cls:'badge-legendary', col:'#fb923c'},
};
function getPlanes(){
  if(DB && DB.customPlanes && DB.customPlanes.length > 0) return DB.customPlanes;
  return PLANES;
}

function openPlanesModal(){
  var planes = getPlanes().slice();
  window._editPlanes = planes;
  var rows = planes.map(function(p, i){
    return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">'
      + '<span style="color:var(--dim);font-size:12px;width:18px">' + (i+1) + '</span>'
      + '<input value="' + p.replace(/"/g,'&quot;').replace(/'/g,'&#39;') + '" oninput="window._editPlanes[' + i + ']=this.value" style="flex:1;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 10px;font-size:13px">'
      + '<button onclick="window._editPlanes.splice(' + i + ',1);openPlanesModal()" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:14px" onmouseover="this.style.color=\'var(--red)\'" onmouseout="this.style.color=\'var(--dim)\'">&#x2715;</button>'
      + '</div>';
  }).join('');
  var html = '<div class="modal" onclick="event.stopPropagation()" style="max-width:420px">'
    + '<div class="modal-header"><span class="modal-title">🌀 Gérer les Plans</span>'
    + '<button class="modal-close" onclick="closeModal()">&#x2715;</button></div>'
    + '<div class="modal-body">'
    + '<div style="color:var(--muted);font-size:12px;margin-bottom:10px">Renommez ou ajoutez des plans. S\'applique partout dans l\'application.</div>'
    + '<div id="planes-list">' + rows + '</div>'
    + '<button class="btn btn-ghost btn-sm" style="margin-top:10px" onclick="window._editPlanes.push(\'Nouveau Plan\');openPlanesModal()">+ Ajouter</button>'
    + '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">'
    + '<button class="btn btn-ghost btn-sm" onclick="DB.customPlanes=[];save();closeModal();toast(\'Plans réinitialisés\')">Réinitialiser</button>'
    + '<button class="btn btn-ghost" onclick="closeModal()">Annuler</button>'
    + '<button class="btn btn-primary" onclick="savePlanes()">Enregistrer</button>'
    + '</div></div></div>';
  openModal(html);
}

function savePlanes(){
  var cleaned = window._editPlanes.map(function(p){return p.trim();}).filter(function(p){return p.length>0;});
  DB.customPlanes = cleaned;
  save(); closeModal(); toast('Plans enregistrés !');
}

const PLANES = ["Plan Matériel","Plan Astral","Plan des Ombres","Plan du Feu Élémentaire","Plan du Chaos","Plan de l'Air","Mechanus","Limbo","Les Neuf Enfers"];
const PLANE_COL = {"Plan Matériel":"#4ade80","Plan Astral":"#60a5fa","Plan des Ombres":"#a78bfa","Plan du Feu Élémentaire":"#fb923c","Plan du Chaos":"#f87171","Plan de l'Air":"#7dd3fc"};
const EMOJIS_CHAR = ["⚔️","🧙","🧙‍♀️","🗡️","🛡️","🏹","🔮","🌿","🔥","❄️","⚡","🌊","🐉","🦅","🌑","🎭","🧝","🧝‍♀️","🧛","🧜","🐺","🦁"];
const EMOJIS_NPC = ["👴","👵","🧑","🧙","🧙‍♀️","💼","🌪️","⚕️","🐀","⚒️","👁️","🦅","🐉","🎭","🌹","🗿","🌒","⚖️","🔑","🧿"];
const CAT_ICON = {
  "Arme":"⚔️","Armure":"🛡️","Casque":"⛑️","Bouclier":"🔰","Bottes":"👢","Gants":"🧤",
  "Bague / Anneau":"💍","Cape / Manteau":"🧥","Amulette":"📿","Sac":"🎒",
  "Magie":"✨","Artefact":"🔮","Consommable":"🧪","Ingrédient":"🌿",
  "Outil":"🔧","Clé / Document":"🗝️","Trésor":"💎","Équipement":"📦","Autre":"🎁"
};
// Catégories d'équipement portables (elles comptent dans les slots)
const EQUIP_SLOT_CATS = new Set(["Armure","Casque","Bouclier","Bottes","Gants","Bague / Anneau","Cape / Manteau","Amulette","Sac"]);
// Map: catégorie → slot équipement
const CAT_TO_SLOT = {
  "Armure":"armor","Casque":"helmet","Bouclier":"shield","Bottes":"boots",
  "Gants":"gloves","Bague / Anneau":"ring1","Cape / Manteau":"cloak",
  "Amulette":"amulet","Sac":"bag"
};
// Liste des catégories pour les selects
const ITEM_CATS = Object.keys(CAT_ICON);
const TERRAIN_BG = {urban:"#1a1a2e",astral:"#050510",forest:"#0d1a0d",dungeon:"#1a1208"};
const TERRAIN_GRID = {urban:"#2d2d4e",astral:"#15153a",forest:"#1a2e1a",dungeon:"#2e2010"};
const TERRAIN_ACCENT = {urban:"#6366f1",astral:"#818cf8",forest:"#4ade80",dungeon:"#fbbf24"};
const ABILITIES = [{key:'str',name:'FOR'},{key:'dex',name:'DEX'},{key:'con',name:'CON'},{key:'int',name:'INT'},{key:'wis',name:'SAG'},{key:'cha',name:'CHA'}];

function mod(score){ return Math.floor((score-10)/2); }
function modStr(score){ const m=mod(score); return (m>=0?'+':'')+m; }

// ── Système d'encombrement (Guide inventaire) ─────────────────
const BAG_BONUS   = {none:0, pouch:6, light:12, full:24};
const ARMOR_MALUS = {none:0, light:2, medium:4, heavy:8};

// Aggrège tous les bonus des items équipés
function getEquipBonuses(m){
  const inv = m.inventory||[];
  let ac=0, dex=0, str=0, speed=[], free=[];
  inv.filter(i=>i.equippedSlot&&i.equippedSlot!=='bag').forEach(item=>{
    if(item.bonusAC)   ac  += +item.bonusAC;
    if(item.bonusDEX)  dex += +item.bonusDEX;
    if(item.bonusSTR)  str += +item.bonusSTR;
    if(item.bonusSpeed) speed.push(item.bonusSpeed);
    if(item.bonusFree)  free.push(item.bonusFree+' ('+item.name+')');
  });
  return {ac, dex, str, speed, free};
}

function calcCarryCapacity(m){
  const str  = m.stats?.str || 10;
  const base = str * 2;
  const inv  = m.inventory||[];
  // Bag bonus: find item with equippedSlot==='bag' in inventory
  const bagItem = inv.find(i=>i.equippedSlot==='bag');
  let bag = 0;
  if(bagItem){
    if(bagItem.bagBonus !== undefined && bagItem.bagBonus !== null && bagItem.bagBonus !== '') {
      bag = +bagItem.bagBonus || 0;
    } else {
      const bn = (bagItem.name||'').toLowerCase();
      if(bn.includes('randonnée')||bn.includes('grand')) bag=24;
      else if(bn.includes('léger')||bn.includes('leger')) bag=12;
      else if(bn.includes('besace')||bn.includes('sacoche')) bag=6;
      else bag = 6;
    }
  } else {
    bag = BAG_BONUS[m.equipment?.bag||m.bagType||'none']||0;
  }
  const armorItem = inv.find(i=>i.equippedSlot==='armor');
  const armor = armorItem?.armorPenalty !== undefined
    ? (armorItem.armorPenalty||0)
    : (ARMOR_MALUS[m.armorType||'none']||0);
  const capacity = Math.max(0, base + bag - armor);
  const invUsed = inv.reduce((s,item)=>{
    const sz = item.size !== undefined ? item.size : (item.w||1);
    return s + sz * (item.qty||1);
  }, 0);
  const eqUsed = inv.filter(i=>i.equippedSlot).reduce((s,item)=>{
    const sz = item.size !== undefined ? item.size : (item.w||1);
    return s + sz;
  }, 0);
  const totalCoins = (m.gold?.pp||0)+(m.gold?.po||0)+(m.gold?.pa||0)+(m.gold?.pc||0);
  const coinRolls  = totalCoins > 100 ? Math.ceil((totalCoins-100)/50) : 0;
  const totalUsed  = invUsed + coinRolls;
  // Pocket capacity (independent of main inv)
  const pocketCap  = m.pocketSize || 6;
  const pocket     = m.pocket||[];
  const pocketUsed = pocket.reduce((s,i)=>s+(i.size!==undefined?i.size:(i.w||1))*(i.qty||1),0);
  return { capacity, used:totalUsed, coinRolls, base, bag, armor, str, invUsed, eqUsed,
           pocketCap, pocketUsed };
}

function carryBar(m){
  const {capacity, used, coinRolls, base, bag, armor, str, invUsed, eqUsed} = calcCarryCapacity(m);
  const pct = capacity > 0 ? Math.min(1, used/capacity) : 1;
  const full = used >= capacity;
  const over = used > capacity;
  const col = over ? '#ef4444' : pct >= .8 ? '#f59e0b' : '#4ade80';
  return `<div style="background:var(--surface2);border:1px solid ${over?'#ef444466':'var(--border2)'};border-radius:10px;padding:12px 14px;margin-bottom:10px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="font-size:11px;font-weight:700;color:var(--indigo);text-transform:uppercase;letter-spacing:.08em">
        🎒 Capacité d'inventaire
      </div>
      <div style="font-size:13px;font-weight:700;color:${col}">${used} / ${capacity} cases${over?' ⚠️ SURCHARGE':''}</div>
    </div>
    <div style="height:8px;background:var(--bg);border-radius:4px;overflow:hidden;margin-bottom:8px">
      <div style="height:100%;width:${Math.round(pct*100)}%;background:${col};border-radius:4px;transition:width .3s"></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--dim)">
      <span>🦾 FOR ${str} → ${base} cases</span>
      ${bag>0?`<span style="color:var(--green)">+${bag} sac</span>`:''}
      ${armor>0?`<span style="color:#f87171">−${armor} armure</span>`:''}
      ${coinRolls>0?`<span style="color:var(--gold)">🪙 ${coinRolls} rouleau${coinRolls>1?'x':''} de pièces</span>`:''}
    </div>
  </div>`;
}


function badge(rarity){
  const r=RARITY[rarity]||RARITY['Commun'];
  return `<span class="badge ${r.cls}">${rarity}</span>`;
}
function planeTag(plane){
  const c=PLANE_COL[plane]||'#6366f1';
  return `<span style="background:${c}22;color:${c};padding:3px 10px;border-radius:4px;font-size:12px;border:1px solid ${c}44">🌀 ${plane}</span>`;
}
function avatarEl(m, size=54){
  if(m.avatarImg)
    return `<img src="${m.avatarImg}" style="width:${size}px;height:${size}px;border-radius:${size<40?'50%':'10px'};object-fit:cover;border:1px solid var(--border2)">`;
  return `<div style="width:${size}px;height:${size}px;background:var(--surface2);border-radius:${size<40?'50%':'10px'};display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*.5)}px;border:1px solid var(--border2);flex-shrink:0">${m.avatar||'?'}</div>`;
}
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function readFile(file, cb, mode='dataURL'){
  const r=new FileReader();
  r.onload=e=>cb(e.target.result);
  if(mode==='dataURL') r.readAsDataURL(file);
  else r.readAsArrayBuffer(file);
}

function imgUploadField(id, currentSrc, label='Image'){
  return `<div class="field">
    <label>${label}</label>
    <label class="img-upload-btn" style="${currentSrc?'border-style:solid;border-color:var(--indigo)':''}">
      ${currentSrc?`<img src="${currentSrc}" style="max-height:80px;border-radius:6px;object-fit:contain">`:`<span style="font-size:24px">📁</span><span>Cliquer pour choisir une image</span>`}
      <input type="file" accept="image/*" id="${id}" style="display:none" onchange="handleImgUpload('${id}',this)">
    </label>
  </div>`;
}
window._imgUploads = {};
function handleImgUpload(id, input){
  if(!input.files[0]) return;
  readFile(input.files[0], data => {
    window._imgUploads[id] = data;
    const label = input.closest('label');
    label.innerHTML = `<img src="${data}" style="max-height:80px;border-radius:6px;object-fit:contain"><input type="file" accept="image/*" id="${id}" style="display:none" onchange="handleImgUpload('${id}',this)">`;
    label.appendChild(label.querySelector('input')); // reattach
  });
}

