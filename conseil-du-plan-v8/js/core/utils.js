/**
 * CORE/UTILS.JS — Helpers globaux
 * Extrait de V7_6.html lignes 1439-1642
 *
 * CONTENU :
 *  - Constantes UI (RARITY, PLANE_COL, CAT_ICON, ABILITIES, ITEM_CATS…)
 *  - Fonctions HTML (esc, badge, planeTag, avatarEl, imgUploadField…)
 *  - Calcul D&D (mod, modStr, calcCarryCapacity, carryBar, getEquipBonuses)
 *  - Utilitaires fichiers (readFile, handleImgUpload)
 *  - Gestion des plans (getPlanes, openPlanesModal, savePlanes)
 *  - [PATCH 2a] normalizeItem() — format unifié pour tous les objets
 *  - [PATCH 2b] DragDrop     — système drag & drop sans artefacts visuels
 *
 * ORDRE DE CHARGEMENT : après constants.js et db.js, avant les modules.
 */

// ================================================================
// CONSTANTES UI
// ================================================================

/** Rarétés D&D 5e avec classe CSS et couleur d'accentuation */
const RARITY = {
  'Commun':     {cls:'badge-common',    col:'#9ca3af'},
  'Peu commun': {cls:'badge-uncommon',  col:'#4ade80'},
  'Rare':       {cls:'badge-rare',      col:'#60a5fa'},
  'Très rare':  {cls:'badge-veryrare',  col:'#c084fc'},
  'Légendaire': {cls:'badge-legendary', col:'#fb923c'},
};

/**
 * Retourne la liste des plans disponibles.
 * Priorité : DB.customPlanes si défini, sinon PLANES (constante).
 */
function getPlanes() {
  if (DB && DB.customPlanes && DB.customPlanes.length > 0) return DB.customPlanes;
  return PLANES;
}

/** Ouvre la modale de gestion des plans personnalisés */
function openPlanesModal() {
  var planes = getPlanes().slice();
  window._editPlanes = planes;
  var rows = planes.map(function(p, i) {
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

/** Sauvegarde la liste de plans personnalisés dans DB.customPlanes */
function savePlanes() {
  var cleaned = window._editPlanes
    .map(function(p) { return p.trim(); })
    .filter(function(p) { return p.length > 0; });
  DB.customPlanes = cleaned;
  save(); closeModal(); toast('Plans enregistrés !');
}

// ── Listes et mappings de référence ──────────────────────────

/** Plans par défaut (si DB.customPlanes est vide) */
const PLANES = [
  "Plan Matériel","Plan Astral","Plan des Ombres",
  "Plan du Feu Élémentaire","Plan du Chaos","Plan de l'Air",
  "Mechanus","Limbo","Les Neuf Enfers"
];

/** Couleur d'accent associée à chaque plan (pour les badges) */
const PLANE_COL = {
  "Plan Matériel":           "#4ade80",
  "Plan Astral":             "#60a5fa",
  "Plan des Ombres":         "#a78bfa",
  "Plan du Feu Élémentaire": "#fb923c",
  "Plan du Chaos":           "#f87171",
  "Plan de l'Air":           "#7dd3fc"
};

/** Emojis proposés pour les personnages joueurs */
const EMOJIS_CHAR = [
  "⚔️","🧙","🧙‍♀️","🗡️","🛡️","🏹","🔮","🌿","🔥","❄️",
  "⚡","🌊","🐉","🦅","🌑","🎭","🧝","🧝‍♀️","🧛","🧜","🐺","🦁"
];

/** Emojis proposés pour les PNJ */
const EMOJIS_NPC = [
  "👴","👵","🧑","🧙","🧙‍♀️","💼","🌪️","⚕️","🐀","⚒️",
  "👁️","🦅","🐉","🎭","🌹","🗿","🌒","⚖️","🔑","🧿"
];

/**
 * Icônes emoji par catégorie d'objet.
 * Utilisé dans les listes d'inventaire et les modales.
 */
const CAT_ICON = {
  "Arme":           "⚔️",
  "Armure":         "🛡️",
  "Casque":         "⛑️",
  "Bouclier":       "🔰",
  "Bottes":         "👢",
  "Gants":          "🧤",
  "Bague / Anneau": "💍",
  "Cape / Manteau": "🧥",
  "Amulette":       "📿",
  "Sac":            "🎒",
  "Magie":          "✨",
  "Artefact":       "🔮",
  "Consommable":    "🧪",
  "Ingrédient":     "🌿",
  "Outil":          "🔧",
  "Clé / Document": "🗝️",
  "Trésor":         "💎",
  "Équipement":     "📦",
  "Autre":          "🎁"
};

/**
 * Catégories d'équipement qui occupent un slot corporel.
 * Utilisé pour détecter les items équipables.
 */
const EQUIP_SLOT_CATS = new Set([
  "Armure","Casque","Bouclier","Bottes","Gants",
  "Bague / Anneau","Cape / Manteau","Amulette","Sac"
]);

/**
 * Correspondance catégorie → slot d'équipement.
 * Permet de pré-remplir equippedSlot lors de l'ajout d'un item.
 */
const CAT_TO_SLOT = {
  "Armure":         "armor",
  "Casque":         "helmet",
  "Bouclier":       "shield",
  "Bottes":         "boots",
  "Gants":          "gloves",
  "Bague / Anneau": "ring1",
  "Cape / Manteau": "cloak",
  "Amulette":       "amulet",
  "Sac":            "bag"
};

/** Liste ordonnée des catégories pour les <select> de l'interface */
const ITEM_CATS = Object.keys(CAT_ICON);

/** Couleurs de fond/grille/accent par type de terrain (battlemap) */
const TERRAIN_BG    = {urban:"#1a1a2e", astral:"#050510", forest:"#0d1a0d", dungeon:"#1a1208"};
const TERRAIN_GRID  = {urban:"#2d2d4e", astral:"#15153a", forest:"#1a2e1a", dungeon:"#2e2010"};
const TERRAIN_ACCENT= {urban:"#6366f1", astral:"#818cf8", forest:"#4ade80", dungeon:"#fbbf24"};

/** Caractéristiques D&D 5e dans l'ordre standard */
const ABILITIES = [
  {key:'str', name:'FOR'},
  {key:'dex', name:'DEX'},
  {key:'con', name:'CON'},
  {key:'int', name:'INT'},
  {key:'wis', name:'SAG'},
  {key:'cha', name:'CHA'}
];

/** Bonus de cases selon le type de sac (legacy — remplacé par item.bagBonus) */
const BAG_BONUS   = {none:0, pouch:6, light:12, full:24};
/** Pénalité de cases selon le type d'armure (legacy — remplacé par item.armorPenalty) */
const ARMOR_MALUS = {none:0, light:2, medium:4, heavy:8};

/** Conditions D&D 5e avec icône, couleur et description courte */
const CONDITIONS = {
  'Aveuglé':      {icon:'🙈', color:'#9ca3af', desc:"Ne peut pas voir"},
  'Charmé':       {icon:'💕', color:'#f472b6', desc:"Considère la source comme amie"},
  'Effrayé':      {icon:'😱', color:'#f87171', desc:"Désavantage si source visible"},
  'Empoisonné':   {icon:'☠️', color:'#4ade80', desc:"Désavantage aux jets d'attaque"},
  'Entravé':      {icon:'⛓️', color:'#fbbf24', desc:"Vitesse 0"},
  'Étourdi':      {icon:'💫', color:'#a78bfa', desc:"Incapable d'agir"},
  'Incapacité':   {icon:'😵', color:'#6b7280', desc:"Pas d'action ni réaction"},
  'Inconscient':  {icon:'💤', color:'#374151', desc:"Incapable, tombe à terre"},
  'Invisible':    {icon:'👻', color:'#e5e7eb', desc:"Impossible à cibler normalement"},
  'Paralysé':     {icon:'🧊', color:'#60a5fa', desc:"Incapable, échec FOR/DEX"},
  'Pétrifié':     {icon:'🗿', color:'#78716c', desc:"Transformé en pierre"},
  'À terre':      {icon:'🤕', color:'#f59e0b', desc:"Désavantage aux attaques"},
};

/** Statuts PNJ avec icône, couleur et libellé */
const NPC_STATUSES = {
  'vivant':    {icon:'💚', color:'#22c55e', label:'Vivant'},
  'mort':      {icon:'💀', color:'#ef4444', label:'Mort'},
  'blessé':    {icon:'🩸', color:'#f97316', label:'Blessé'},
  'allié':     {icon:'🤝', color:'#3b82f6', label:'Allié'},
  'ennemi':    {icon:'⚔️', color:'#dc2626', label:'Ennemi'},
  'disparu':   {icon:'❓', color:'#9ca3af', label:'Disparu'},
  'prisonnier':{icon:'🔒', color:'#a78bfa', label:'Prisonnier'},
};

/** Types de médias supportés avec leur emoji d'affichage */
const MEDIA_TYPES = {
  audio:    '🎵',
  image:    '🖼️',
  map:      '🗺️',
  document: '📄',
  video:    '🎬',
  other:    '📎',
};


// ================================================================
// FONCTIONS D&D — modificateurs, capacités
// ================================================================

/**
 * Calcule le modificateur D&D à partir d'une valeur de caractéristique.
 * Formule officielle : floor((score - 10) / 2)
 *
 * @param {number} score - valeur de caractéristique (1–30)
 * @returns {number} modificateur (ex: 14 → +2, 8 → -1)
 */
function mod(score) { return Math.floor((score - 10) / 2); }

/**
 * Retourne le modificateur D&D sous forme de chaîne signée.
 * @param {number} score
 * @returns {string} ex: "+2", "-1", "+0"
 */
function modStr(score) { const m = mod(score); return (m >= 0 ? '+' : '') + m; }

/**
 * Calcule la capacité de transport et l'utilisation actuelle d'un membre.
 *
 * Règles maison :
 *  - Base          = FOR × 2 cases
 *  - Bonus sac     = item.bagBonus (ou legacy BAG_BONUS[m.bagType])
 *  - Malus armure  = item.armorPenalty (ou legacy ARMOR_MALUS[m.armorType])
 *  - Bourse        = gratuit jusqu'à 100 pièces ; surplus : 1 case / 50 pièces
 *  - Sacoche       = capacité indépendante (m.pocketSize)
 *
 * @param {object} m - membre DB
 * @returns {object} {capacity, used, coinRolls, base, bag, armor, str, invUsed, eqUsed, pocketCap, pocketUsed}
 */
function calcCarryCapacity(m) {
  const str  = m.stats?.str || 10;
  const base = str * 2;
  const inv  = m.inventory || [];

  // ── Bonus de sac ──
  const bagItem = inv.find(i => i.equippedSlot === 'bag');
  let bag = 0;
  if (bagItem) {
    if (bagItem.bagBonus !== undefined && bagItem.bagBonus !== null && bagItem.bagBonus !== '') {
      bag = +bagItem.bagBonus || 0;
    } else {
      // Fallback : déduit depuis le nom du sac
      const bn = (bagItem.name || '').toLowerCase();
      if      (bn.includes('randonnée') || bn.includes('grand'))   bag = 24;
      else if (bn.includes('léger')     || bn.includes('leger'))   bag = 12;
      else if (bn.includes('besace')    || bn.includes('sacoche')) bag = 6;
      else bag = 6;
    }
  } else {
    bag = BAG_BONUS[m.equipment?.bag || m.bagType || 'none'] || 0;
  }

  // ── Pénalité d'armure ──
  const armorItem = inv.find(i => i.equippedSlot === 'armor');
  const armor = armorItem?.armorPenalty !== undefined
    ? (armorItem.armorPenalty || 0)
    : (ARMOR_MALUS[m.armorType || 'none'] || 0);

  const capacity = Math.max(0, base + bag - armor);

  // ── Cases utilisées par l'inventaire ──
  const invUsed = inv.reduce((s, item) => {
    const sz = item.size !== undefined ? item.size : (item.w || 1);
    return s + sz * (item.qty || 1);
  }, 0);

  const eqUsed = inv.filter(i => i.equippedSlot).reduce((s, item) => {
    const sz = item.size !== undefined ? item.size : (item.w || 1);
    return s + sz;
  }, 0);

  // ── Surplus de pièces ──
  const totalCoins = (m.gold?.pp||0) + (m.gold?.po||0) + (m.gold?.pa||0) + (m.gold?.pc||0);
  const coinRolls  = totalCoins > 100 ? Math.ceil((totalCoins - 100) / 50) : 0;

  const totalUsed = invUsed + coinRolls;

  // ── Sacoche (indépendante) ──
  const pocketCap  = m.pocketSize || 6;
  const pocket     = m.pocket || [];
  const pocketUsed = pocket.reduce((s, i) => s + (i.size !== undefined ? i.size : (i.w||1)) * (i.qty||1), 0);

  return { capacity, used:totalUsed, coinRolls, base, bag, armor, str, invUsed, eqUsed, pocketCap, pocketUsed };
}

/**
 * Génère la barre HTML de capacité de transport pour un membre.
 * @param {object} m - membre DB
 * @returns {string} HTML
 */
function carryBar(m) {
  const {capacity, used, coinRolls, base, bag, armor, str} = calcCarryCapacity(m);
  const pct  = capacity > 0 ? Math.min(1, used / capacity) : 1;
  const over = used > capacity;
  const col  = over ? '#ef4444' : pct >= .8 ? '#f59e0b' : '#4ade80';

  return `<div style="background:var(--surface2);border:1px solid ${over?'#ef444466':'var(--border2)'};border-radius:10px;padding:12px 14px;margin-bottom:10px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="font-size:11px;font-weight:700;color:var(--indigo);text-transform:uppercase;letter-spacing:.08em">🎒 Capacité d'inventaire</div>
      <div style="font-size:13px;font-weight:700;color:${col}">${used} / ${capacity} cases${over?' ⚠️ SURCHARGE':''}</div>
    </div>
    <div style="height:8px;background:var(--bg);border-radius:4px;overflow:hidden;margin-bottom:8px">
      <div style="height:100%;width:${Math.round(pct*100)}%;background:${col};border-radius:4px;transition:width .3s"></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--dim)">
      <span>🦾 FOR ${str} → ${base} cases</span>
      ${bag   > 0 ? `<span style="color:var(--green)">+${bag} sac</span>`    : ''}
      ${armor > 0 ? `<span style="color:#f87171">−${armor} armure</span>`     : ''}
      ${coinRolls > 0 ? `<span style="color:var(--gold)">🪙 ${coinRolls} rouleau${coinRolls>1?'x':''} de pièces</span>` : ''}
    </div>
  </div>`;
}

/**
 * Agrège les bonus conférés par les items équipés d'un membre.
 * Utilisé dans renderMemberSummary() pour afficher les badges de bonus.
 *
 * @param {object} m - membre DB
 * @returns {{ac, dex, str, speed, free}}
 */
function getEquipBonuses(m) {
  const inv = m.inventory || [];
  let ac = 0, dex = 0, str = 0, speed = [], free = [];
  inv.filter(i => i.equippedSlot && i.equippedSlot !== 'bag').forEach(item => {
    if (item.bonusAC)    ac  += +item.bonusAC;
    if (item.bonusDEX)   dex += +item.bonusDEX;
    if (item.bonusSTR)   str += +item.bonusSTR;
    if (item.bonusSpeed) speed.push(item.bonusSpeed);
    if (item.bonusFree)  free.push(item.bonusFree + ' (' + item.name + ')');
  });
  return {ac, dex, str, speed, free};
}

/**
 * Détermine le tier de loot selon le FP d'une créature.
 * @param {string|number} cr - Facteur de Puissance
 * @returns {{label, gold, items}}
 */
function getLootTier(cr) {
  const n = parseFloat(cr) || 0;
  if (n < 1)  return {label:'Trivial',   gold:Math.floor(Math.random()*5)+1,    items:[]};
  if (n < 5)  return {label:'Faible',    gold:Math.floor(Math.random()*20)+5,   items:['Consommable']};
  if (n < 11) return {label:'Modéré',    gold:Math.floor(Math.random()*100)+20, items:['Consommable','Équipement']};
  if (n < 17) return {label:'Dangereux', gold:Math.floor(Math.random()*500)+100,items:['Équipement','Magie']};
  return             {label:'Légendaire',gold:Math.floor(Math.random()*2000)+500,items:['Magie','Artefact']};
}

/**
 * Génère un loot aléatoire pour un monstre selon son FP.
 * @param {string|number} cr
 * @returns {{gold: number, items: Array}}
 */
function generateLoot(cr) {
  const tier = getLootTier(cr);
  const pool = (typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE : [])
    .filter(i => tier.items.includes(i.category));
  const shuffled = pool.sort(() => Math.random() - .5).slice(0, Math.floor(Math.random()*3)+1);
  return {gold: tier.gold, items: shuffled};
}

/**
 * Ressources par défaut par classe.
 * max(profBonus, level) → nombre maximum de la ressource.
 */
const CLASS_RESOURCES = {
  'Barbare':  [{name:'Rages',         icon:'😤', color:'#ef4444', recharge:'repos long',  max:function(p,l){ return l<3?2:l<6?3:l<12?4:l<17?5:l<20?6:9999; }}],
  'Barde':    [{name:'Inspiration',   icon:'🎵', color:'#a78bfa', recharge:'repos long',  max:function(p,l){ return p; }}],
  'Druide':   [{name:'Forme Sauvage', icon:'🐻', color:'#4ade80', recharge:'repos court', max:function()   { return 2; }}],
  'Moine':    [{name:'Points de Ki',  icon:'☯️', color:'#fbbf24', recharge:'repos court', max:function(p,l){ return l; }}],
  'Paladin':  [{name:'Imposition des mains',icon:'🤲',color:'#fcd34d',recharge:'repos long',max:function(p,l){ return l*5; }}],
  'Sorcier':  [{name:'Arcanes occultes',icon:'🌑',color:'#818cf8', recharge:'repos court', max:function(p,l){ return l<2?1:l<11?2:l<17?3:4; }}],
};

/**
 * Initialise les ressources par défaut d'un membre selon sa classe.
 * Évite les doublons (vérifie par nom).
 * @param {object} m - membre DB (modifié en place)
 */
function initClassResources(m) {
  if (!m) return;
  if (!m.resources) m.resources = [];
  const templates = CLASS_RESOURCES[(m.clazz||'').trim()] || [];
  templates.forEach(function(tpl) {
    if (m.resources.find(function(r) { return r.name === tpl.name; })) return;
    const maxVal = tpl.max(m.profBonus||2, m.level||1);
    m.resources.push({
      id:       'res_' + Date.now() + '_' + Math.random().toString(36).substr(2,4),
      name:     tpl.name,
      icon:     tpl.icon || '⚡',
      current:  maxVal,
      max:      maxVal,
      recharge: tpl.recharge || 'repos long',
      color:    tpl.color    || '#6366f1',
    });
  });
}

/**
 * Applique un repos (court ou long) à un membre.
 * - Repos court : recharge les ressources avec recharge='repos court'
 * - Repos long  : recharge toutes sauf recharge='manuel'
 *
 * @param {number} memberId
 * @param {'court'|'long'} type
 */
function doRest(memberId, type) {
  const m = DB.members.find(function(x) { return x.id === memberId; });
  if (!m || !m.resources) return;
  m.resources.forEach(function(r) {
    if (type === 'long') {
      if (r.recharge !== 'manuel') r.current = r.max;
    } else {
      if (r.recharge === 'repos court') r.current = r.max;
    }
  });
  save();
  const content = document.getElementById('member-detail-content');
  if (content && window._memberDetailTab === 0) content.innerHTML = renderMemberSummary(m);
  toast(type === 'long' ? '🌙 Repos long — ressources rechargées !' : '⏳ Repos court effectué !');
}


// ================================================================
// PATCH 2a — FORMAT D'OBJET UNIFIÉ
// ================================================================

/**
 * Normalise un objet brut au format standard de l'application.
 *
 * POURQUOI : les objets créés dans différents modules (inventaire,
 * marchands, loot, import bestiaire) avaient des structures variables :
 * certains utilisaient 'nom' au lieu de 'name', 'poids' au lieu de
 * 'weight', 'quantite' au lieu de 'quantity', etc. Cela causait des
 * comportements incohérents lors du transfert entre modules.
 *
 * UTILISATION : appeler normalizeItem() à CHAQUE création ou import
 * d'un objet, avant de le pousser dans un tableau d'inventaire.
 *
 * Exemples :
 *   DB.guildInventory.push(normalizeItem({nom:'Épée', quantite:1}));
 *   member.inventory.push(normalizeItem(rawLootItem));
 *   DB.market.push(normalizeItem({...itemFromMerchant, price:50}));
 *
 * @param {object} raw - objet brut (n'importe quelle convention de nommage)
 * @returns {object|null} objet normalisé, ou null si raw est falsy
 */
function normalizeItem(raw) {
  if (!raw) return null;
  return {
    // ── Identité ──
    id: raw.id || ('item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),

    // Nom — supporte 'name', 'nom'
    name: raw.name || raw.nom || 'Objet sans nom',

    // Catégorie — 'type' est un alias accepté (imports externes)
    category: raw.category || raw.type || 'Équipement',

    // Rareté — 'rarete' est l'ancien champ
    rarity: raw.rarity || raw.rarete || 'Commun',

    // ── Dimensions ──
    // 'size' prioritaire, puis 'w' (legacy grille), puis 'weight'/'poids'
    size: raw.size !== undefined   ? +raw.size
        : raw.w   !== undefined    ? +raw.w
        : raw.weight !== undefined ? +raw.weight
        : raw.poids  !== undefined ? +raw.poids
        : 1,

    // ── Commerce ──
    // Valeur unitaire en PO — supporte 'prix', 'valeur', 'value'
    price: parseInt(raw.price || raw.prix || raw.valeur || raw.value || 0, 10),

    // Quantité — supporte 'quantite', 'qty', 'quantity'
    qty: Math.max(1, parseInt(raw.qty || raw.quantity || raw.quantite || 1, 10)),

    // ── Contenu textuel ──
    description: raw.description || raw.desc || '',

    // ── Visuels ──
    emoji: raw.emoji || null,   // emoji d'affichage (prioritaire sur icon)
    icon:  raw.icon  || null,   // image base64 ou URL

    // ── Équipement ──
    equippedSlot:  raw.equippedSlot  || null,
    armorPenalty:  raw.armorPenalty  !== undefined ? +raw.armorPenalty  : undefined,
    bagBonus:      raw.bagBonus      !== undefined ? +raw.bagBonus      : undefined,
    bonusAC:       raw.bonusAC       !== undefined ? +raw.bonusAC       : undefined,
    bonusDEX:      raw.bonusDEX      !== undefined ? +raw.bonusDEX      : undefined,
    bonusSTR:      raw.bonusSTR      !== undefined ? +raw.bonusSTR      : undefined,
    bonusSpeed:    raw.bonusSpeed    || undefined,
    bonusFree:     raw.bonusFree     || undefined,

    // ── Statistiques d'arme ──
    atkBonus:    raw.atkBonus   !== undefined ? raw.atkBonus   : (raw.atk || undefined),
    dmgDice:     raw.dmgDice    || null,
    dmgBonus:    raw.dmgBonus   !== undefined ? raw.dmgBonus   : null,
    dmgType:     raw.dmgType    || null,
    weaponProps: raw.weaponProps || null,

    // ── Appartenance (coffre guilde) ──
    ownerId:  raw.ownerId  || null,
    chestId:  raw.chestId  || null,
  };
}


// ================================================================
// PATCH 2b — SYSTÈME DRAG & DROP UNIFIÉ SANS ARTEFACTS
// ================================================================

/**
 * Système DragDrop — remplace tous les anciens handlers de drag.
 *
 * PROBLÈME RÉSOLU :
 *   L'ancien système stockait e.target.outerHTML dans dataTransfer,
 *   ce qui dupliquait le DOM lors du drop et créait des éléments
 *   "fantômes" persistants (artefacts visuels).
 *
 * PRINCIPE :
 *   On stocke uniquement l'ID de l'objet draggé dans dataTransfer.
 *   Le callback de drop modifie le MODÈLE DE DONNÉES (DB) puis
 *   appelle un re-render — jamais le DOM directement.
 *   → Zéro artefact visuel garanti.
 *
 * UTILISATION :
 *
 *   // 1. Rendre un élément draggable :
 *   DragDrop.makeDraggable(monDiv, 'item_123', 'inventaire');
 *
 *   // 2. Rendre un conteneur droppable :
 *   DragDrop.makeDropZone(monConteneur, 'coffre', function(itemId, source, target) {
 *     // Modifier DB ici selon itemId, source et target
 *     save();
 *     renderInventory(); // re-render propre
 *   });
 *
 * CSS REQUIS (à ajouter dans styles.css) :
 *   .dragging  { opacity:.4; transform:scale(.95); transition:all .15s ease; }
 *   .drag-over { outline:2px dashed var(--accent,#c8a455); outline-offset:4px;
 *                background:rgba(200,164,85,0.05); }
 */
var DragDrop = {
  /** ID de l'objet en cours de drag (null entre deux drags) */
  _draggedItemId: null,

  /** Identifiant du module source ('inventaire', 'coffre', 'sacoche', etc.) */
  _dragSource: null,

  /**
   * Rend un élément DOM draggable.
   *
   * Stocke l'ID dans dataTransfer.text/plain ET dans _draggedItemId
   * pour assurer la compatibilité cross-browser (Firefox ne retourne
   * pas toujours dataTransfer dans le drop handler).
   *
   * @param {HTMLElement} el      - élément à rendre draggable
   * @param {string}      itemId  - ID unique de l'objet dans DB
   * @param {string}      source  - identifiant du module source
   */
  makeDraggable: function(el, itemId, source) {
    el.draggable = true;
    el.dataset.itemId = String(itemId);

    el.addEventListener('dragstart', function(e) {
      DragDrop._draggedItemId = itemId;
      DragDrop._dragSource    = source;

      // dataTransfer : stocke UNIQUEMENT l'ID, jamais le HTML
      e.dataTransfer.setData('text/plain', String(itemId));
      e.dataTransfer.effectAllowed = 'move';

      // Feedback visuel : semi-transparent pendant le drag
      el.classList.add('dragging');

      // Stoppe la propagation pour éviter que le click parent se déclenche
      e.stopPropagation();
    });

    el.addEventListener('dragend', function() {
      el.classList.remove('dragging');
      DragDrop._draggedItemId = null;
      DragDrop._dragSource    = null;

      // Nettoyage : retire tous les indicateurs de survol résiduels
      document.querySelectorAll('.drag-over').forEach(function(x) {
        x.classList.remove('drag-over');
      });
    });
  },

  /**
   * Rend un conteneur DOM droppable.
   *
   * Gestion soigneuse de dragleave : on vérifie que e.relatedTarget
   * est bien hors du conteneur avant de retirer le style, ce qui
   * évite le clignotement causé par les enfants du conteneur.
   *
   * @param {HTMLElement} container - élément conteneur cible
   * @param {string}      target    - identifiant du module cible
   * @param {Function}    onDrop    - callback(itemId, source, target)
   *                                  Responsable de modifier DB + re-render.
   */
  makeDropZone: function(container, target, onDrop) {
    container.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      container.classList.add('drag-over');
    });

    container.addEventListener('dragleave', function(e) {
      // Ne retire le style que si on quitte vraiment le conteneur
      // (pas juste un de ses enfants) — évite le clignotement
      if (!container.contains(e.relatedTarget)) {
        container.classList.remove('drag-over');
      }
    });

    container.addEventListener('drop', function(e) {
      e.preventDefault();
      container.classList.remove('drag-over');

      // Récupère l'ID : dataTransfer en priorité, fallback sur la variable
      var itemId = e.dataTransfer.getData('text/plain') || DragDrop._draggedItemId;
      if (!itemId) return;

      var source = DragDrop._dragSource;

      // Drop sur soi-même → annuler silencieusement
      if (source === target) {
        DragDrop._draggedItemId = null;
        DragDrop._dragSource    = null;
        return;
      }

      // Délègue la logique métier au callback fourni par le module
      if (typeof onDrop === 'function') {
        onDrop(itemId, source, target);
      }

      DragDrop._draggedItemId = null;
      DragDrop._dragSource    = null;
    });
  }
};

// Expose globalement (accessible depuis les handlers inline du HTML)
window.DragDrop = DragDrop;


// ================================================================
// FONCTIONS HTML — génération de composants UI réutilisables
// ================================================================

/**
 * Génère un badge HTML coloré selon la rareté D&D.
 * @param {string} rarity - clé dans RARITY (ex: 'Rare')
 * @returns {string} span HTML
 */
function badge(rarity) {
  const r = RARITY[rarity] || RARITY['Commun'];
  return `<span class="badge ${r.cls}">${rarity}</span>`;
}

/**
 * Génère un badge HTML pour un plan (avec couleur associée).
 * @param {string} plane - nom du plan
 * @returns {string} span HTML
 */
function planeTag(plane) {
  const c = PLANE_COL[plane] || '#6366f1';
  return `<span style="background:${c}22;color:${c};padding:3px 10px;border-radius:4px;font-size:12px;border:1px solid ${c}44">🌀 ${plane}</span>`;
}

/**
 * Génère l'élément HTML d'avatar d'un membre ou PNJ.
 * - Si avatarImg (base64) : affiche une <img>
 * - Sinon : affiche l'emoji dans un <div>
 *
 * @param {object} m    - objet avec {avatar?, avatarImg?}
 * @param {number} size - taille en pixels (défaut 54)
 * @returns {string} HTML
 */
function avatarEl(m, size) {
  size = size || 54;
  const radius = size < 40 ? '50%' : '10px';
  if (m.avatarImg) {
    return `<img src="${m.avatarImg}" style="width:${size}px;height:${size}px;border-radius:${radius};object-fit:cover;border:1px solid var(--border2)">`;
  }
  return `<div style="width:${size}px;height:${size}px;background:var(--surface2);border-radius:${radius};display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*.5)}px;border:1px solid var(--border2);flex-shrink:0">${m.avatar||'?'}</div>`;
}

/**
 * Échappe les caractères HTML spéciaux (anti-XSS).
 * À utiliser sur TOUTE valeur utilisateur insérée dans le DOM via innerHTML.
 *
 * @param {*} s - valeur à échapper
 * @returns {string}
 */
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Lit un fichier local et appelle cb(result) une fois terminé.
 *
 * @param {File}     file - fichier à lire
 * @param {Function} cb   - callback(result: string|ArrayBuffer)
 * @param {string}   mode - 'dataURL' (défaut) | 'arrayBuffer'
 */
function readFile(file, cb, mode) {
  mode = mode || 'dataURL';
  const r = new FileReader();
  r.onload = function(e) { cb(e.target.result); };
  if (mode === 'dataURL') r.readAsDataURL(file);
  else                    r.readAsArrayBuffer(file);
}

/**
 * Génère un champ d'upload d'image avec prévisualisation inline.
 * L'image uploadée est stockée dans window._imgUploads[id] (base64).
 *
 * @param {string} id         - clé unique du champ (aussi id de l'<input>)
 * @param {string} currentSrc - URL/base64 de l'image actuelle, null si aucune
 * @param {string} label      - libellé du champ
 * @returns {string} HTML du champ
 */
function imgUploadField(id, currentSrc, label) {
  label = label || 'Image';
  return `<div class="field">
    <label>${label}</label>
    <label class="img-upload-btn" style="${currentSrc ? 'border-style:solid;border-color:var(--indigo)' : ''}">
      ${currentSrc
        ? `<img src="${currentSrc}" style="max-height:80px;border-radius:6px;object-fit:contain">`
        : `<span style="font-size:24px">📁</span><span>Cliquer pour choisir une image</span>`}
      <input type="file" accept="image/*" id="${id}" style="display:none"
        onchange="handleImgUpload('${id}',this)">
    </label>
  </div>`;
}

/** Stockage temporaire des images uploadées pendant l'édition d'une modale */
window._imgUploads = {};

/**
 * Gère l'upload d'une image dans une modale.
 * Lit le fichier, stocke en base64 dans window._imgUploads[id]
 * et met à jour la prévisualisation inline sans recharger la modale.
 *
 * @param {string}      id    - clé de window._imgUploads
 * @param {HTMLElement} input - <input type="file">
 */
function handleImgUpload(id, input) {
  if (!input.files[0]) return;
  readFile(input.files[0], function(data) {
    window._imgUploads[id] = data;
    const label = input.closest('label');
    label.style.borderStyle = 'solid';
    label.style.borderColor = 'var(--indigo)';
    label.innerHTML = `<img src="${data}" style="max-height:80px;border-radius:6px;object-fit:contain">`
      + `<input type="file" accept="image/*" id="${id}" style="display:none" onchange="handleImgUpload('${id}',this)">`;
  });
}
