/**
 * MODULE INVENTAIRE — Onglets guild/member
 * ============================================================
 * Gère : coffre de guilde, inventaire personnel, richesse,
 *        marché, marchands, investissements, coffres nommés.
 *
 * ARCHITECTURE DE DONNÉES :
 *   DB.guildInventory  → [{id, name, qty, category, rarity, ownerId?, chestId?, ...}]
 *   DB.wealth          → {pp, po, pa, pc, lingots, tresor}  — trésorerie principale
 *   DB.guildBank       → {pp, po, pa, pc}  — conservé mais non affiché (doublon)
 *   DB.guildChests     → [{id, name, icon, owner}]  — coffres nommés
 *   DB.market          → [{...item, sourceId, price}]  — objets mis en vente
 *   DB.merchants       → {key: {name, icon, color, desc, stock}}  — marchands custom
 *   DB.merchantItems   → {key: [itemName, ...]}  — stocks custom par marchand
 *   DB.investments     → {capital, history:[...]}  — placements 5d6
 *   DB.treasures       → [{name, icon, value, qty}]  — objets de valeur
 *
 * TAUX DE CHANGE D&D 5e :
 *   1 PP = 10 PO | 1 PO = 10 PA | 1 PA = 10 PC → 1 PO = 10 PA = 100 PC
 *   Lingot d'or maison = 50 PO pièce
 *
 * ⚠️  BUG CORRIGÉ (v8.1) :
 *   La valeur totale en PO était calculée avec des flottants bruts
 *   (ex: 10.099999…) car PA×0.1 et PC×0.01 ne sont pas arrondis.
 *   Désormais toutes les conversions passent par calcWealthPO() qui
 *   arrondit proprement à 2 décimales.
 */

// ================================================================
// ÉTAT DU MODULE — variables globales de navigation
// ================================================================

/** Onglet principal actif : 'guild' (coffre de guilde) | 'member' (inventaire perso) */
let invTab = 'guild';

/** ID du membre sélectionné en mode inventaire perso */
let invMemberId = DB.members[0]?.id || null;

/** Texte de recherche courant dans la liste d'objets */
let invSearch = '';

/** Mode d'affichage de la liste : 'list' (lignes) | 'grid' (vignettes) */
let invViewMode = 'list';

/**
 * Mode d'affichage de l'inventaire PERSO dans renderMemberInventoryView.
 * Déclaré ici mais aussi utilisé dans aventuriers.js (accès global).
 */
let memberInvViewMode = 'list';

/**
 * Sous-onglet du coffre de guilde :
 * 'items' | 'wealth' | 'market' | 'merchants' | 'invest' | 'chests'
 */
let invGuildTab = 'items';


// ================================================================
// UTILITAIRE — conversion de richesse en PO
// ================================================================

/**
 * Convertit un objet {pp, po, pa, pc, lingots?} en valeur PO
 * arrondie à 2 décimales.
 *
 * Taux officiels D&D 5e :
 *   1 PP  =  10 PO
 *   1 PO  =   1 PO
 *   1 PA  =   0.1 PO
 *   1 PC  =   0.01 PO
 *   1 Lingot (maison) = 50 PO
 *
 * Utiliser cette fonction partout où on affiche un total
 * pour éviter les flottants parasites (ex: 0.30000000000000004).
 *
 * @param {object} coins - {pp?, po?, pa?, pc?, lingots?}
 * @returns {number} Valeur totale arrondie à 2 décimales
 */
function calcWealthPO(coins) {
  const pp      = +(coins.pp      || 0);
  const po      = +(coins.po      || 0);
  const pa      = +(coins.pa      || 0);
  const pc      = +(coins.pc      || 0);
  const lingots = +(coins.lingots || 0);

  // Multiplication entière pour chaque devise, conversion finale
  const total = pp * 10 + po + pa * 0.1 + pc * 0.01 + lingots * 50;

  // Math.round(x * 100) / 100 élimine les imprécisions IEEE 754
  return Math.round(total * 100) / 100;
}


// ================================================================
// RENDU PRINCIPAL — construit toute la coque du module
// ================================================================

/**
 * Point d'entrée du module.
 * Injecte le squelette HTML dans #module-inventory puis délègue
 * le rendu du contenu actif au bon sous-panneau.
 */
function renderInventory() {
  const el = document.getElementById('module-inventory');
  const member = DB.members.find(m => m.id === invMemberId);

  el.innerHTML = `
  <div class="module-header">
    <span style="font-size:26px">⚖️</span>
    <div><div class="module-title">Inventaire</div><div class="module-bar"></div></div>
  </div>

  <!-- ── Onglets principaux : Coffre de Guilde / Inventaire Perso ── -->
  <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center">
    <button class="btn btn-sm ${invTab==='guild'?'btn-primary':'btn-ghost'}" onclick="invSetTab('guild')">⚖️ Coffre de Guilde</button>
    <button class="btn btn-sm ${invTab==='member'?'btn-primary':'btn-ghost'}" onclick="invSetTab('member')">🎒 Perso.</button>

    <!-- Sélecteur de membre (visible uniquement en mode inventaire perso) -->
    ${invTab==='member' ? `<select onchange="invMemberId=+this.value;renderInventory()"
        style="background:var(--surface);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:6px 12px;font-size:13px">
      ${DB.members.map(m => `<option value="${m.id}"${m.id===invMemberId?' selected':''}>${m.avatar} ${esc(m.name)}</option>`).join('')}
    </select>` : ''}

    <!-- Sous-onglets du coffre de guilde -->
    ${invTab==='guild' ? `
      <div style="height:24px;border-left:1px solid var(--border);margin:0 4px"></div>
      <button class="btn btn-xs ${invGuildTab==='items'?'btn-primary':'btn-ghost'}"     onclick="invGuildTab='items';renderInventory()">📦 Objets</button>
      <button class="btn btn-xs ${invGuildTab==='wealth'?'btn-primary':'btn-ghost'}"    onclick="invGuildTab='wealth';renderInventory()">💰 Richesse</button>
      <button class="btn btn-xs ${invGuildTab==='market'?'btn-primary':'btn-ghost'}"    onclick="invGuildTab='market';renderInventory()">🏪 Marché</button>
      <button class="btn btn-xs ${invGuildTab==='merchants'?'btn-primary':'btn-ghost'}" onclick="invGuildTab='merchants';renderInventory()">🧑‍🔧 Marchands</button>
      <button class="btn btn-xs ${invGuildTab==='invest'?'btn-primary':'btn-ghost'}"    onclick="invGuildTab='invest';renderInventory()">⚙️ Investir</button>
      <button class="btn btn-xs ${invGuildTab==='chests'?'btn-primary':'btn-ghost'}"    onclick="invGuildTab='chests';renderInventory()">🗄️ Coffres</button>
    ` : ''}

    <div style="flex:1"></div>

    <!-- Barre de recherche + bouton ajout (onglets avec liste d'objets) -->
    ${(invTab==='member' || invGuildTab==='items') ? `
      <button onclick="invViewMode=invViewMode==='list'?'grid':'list';renderInventory()"
        class="btn btn-ghost btn-xs">${invViewMode==='list'?'⊞ Grille':'☰ Liste'}</button>
      <input placeholder="🔍 Rechercher..." value="${esc(invSearch)}"
        oninput="invSearch=this.value;renderInventoryList()"
        style="background:var(--surface);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:6px 14px;font-size:13px;width:180px">
      <button class="btn btn-primary btn-sm" onclick="openInvModal()">+ Ajouter</button>
    ` : ''}

    <!-- Bouton "Mettre en vente" (onglet Marché uniquement) -->
    ${(invGuildTab==='market' && invTab==='guild') ? `
      <button class="btn btn-primary btn-sm" onclick="openMarketModal()">+ Mettre en vente</button>
    ` : ''}
  </div>

  <!-- En-tête du membre sélectionné (mode inventaire perso) -->
  ${invTab==='member' && member ? `
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px 16px">
    ${avatarEl(member, 42)}
    <div>
      <div style="font-family:'Cinzel',serif;font-weight:700;color:var(--text)">${esc(member.name)}</div>
      <div style="color:var(--muted);font-size:13px">${esc(member.clazz)} — Niveau ${member.level}</div>
    </div>
    <div style="margin-left:auto">${planeTag(member.plane)}</div>
  </div>` : ''}

  <!-- Zone de contenu dynamique — remplie par les fonctions ci-dessous -->
  <div id="inv-list"></div>`;

  // ── Délégation vers le bon sous-panneau ──
  if      (invTab==='guild' && invGuildTab==='wealth')    renderWealthPanel();
  else if (invTab==='guild' && invGuildTab==='market')    renderMarketPanel();
  else if (invTab==='guild' && invGuildTab==='merchants') renderMerchantsPanel();
  else if (invTab==='guild' && invGuildTab==='invest')    renderInvestPanel();
  else if (invTab==='guild' && invGuildTab==='chests')    renderGuildChestsPanel();
  else                                                    renderInventoryList();
}

/**
 * Change l'onglet principal (guild / member) et réinitialise
 * le sous-onglet guildes à 'items' pour éviter les états incohérents.
 *
 * @param {string} t - 'guild' | 'member'
 */
function invSetTab(t) {
  invTab = t;
  if (t === 'guild') invGuildTab = 'items';
  renderInventory();
}


// ================================================================
// LISTE D'OBJETS — affichage liste ou grille
// ================================================================

/**
 * Affiche la liste des objets du coffre de guilde ou de l'inventaire
 * perso, filtrée par invSearch et triée par ordre de création.
 *
 * Deux modes visuels contrôlés par invViewMode :
 *  - 'list' : ligne compacte avec actions inline
 *  - 'grid' : vignette carrée avec image/emoji
 */
function renderInventoryList() {
  // ── Source des objets selon l'onglet actif ──
  const items = invTab==='guild'
    ? DB.guildInventory
    : (DB.members.find(m => m.id===invMemberId)?.inventory || []);

  // ── Filtrage par recherche (nom ou catégorie) ──
  const q = invSearch.toLowerCase();
  const filtered = q
    ? items.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    : items;

  const el = document.getElementById('inv-list');
  if (!el) return;

  /**
   * Génère les badges HTML d'appartenance (propriétaire du casier,
   * coffre nommé) pour un objet du coffre de guilde.
   *
   * @param {object} item
   * @returns {string} HTML des badges ou chaîne vide
   */
  const ownerTag = item => {
    const tags = [];
    // Badge du propriétaire (casier personnel)
    if (invTab==='guild' && item.ownerId) {
      const o = DB.members.find(m => m.id===item.ownerId);
      if (o) tags.push(`<span style="background:var(--indigo)22;color:var(--indigo);padding:1px 6px;border-radius:3px;font-size:10px">${o.avatar} ${esc(o.name)}</span>`);
    }
    // Badge du coffre nommé d'appartenance
    if (invTab==='guild' && item.chestId) {
      const ch = (DB.guildChests||[]).find(x => x.id===item.chestId);
      if (ch) tags.push(`<span style="background:var(--surface2);color:var(--dim);padding:1px 6px;border-radius:3px;font-size:10px">${ch.icon||'🗄️'} ${esc(ch.name)}</span>`);
    }
    return tags.join('');
  };

  // ── MODE GRILLE ──
  if (invViewMode==='grid') {
    el.innerHTML = filtered.length===0
      ? `<div style="text-align:center;color:var(--dim);padding:40px 0;font-style:italic">Aucun objet trouvé...</div>`
      : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px">`
        + filtered.map(item => {
          const rc = RARITY[item.rarity]?.col || '#9ca3af';
          return `<div style="background:var(--surface);border:1px solid ${rc}44;border-radius:10px;padding:14px;text-align:center;cursor:default;transition:border-color .15s"
              title="${esc(item.description||'')}">
            <!-- Vignette icône/emoji/image -->
            <div style="width:52px;height:52px;margin:0 auto 8px;background:${rc}18;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:28px;overflow:hidden">
              ${item.emoji ? `<span style="font-size:22px">${esc(item.emoji)}</span>`
                : item.icon ? `<img src="${item.icon}" style="width:100%;height:100%;object-fit:cover">`
                : `<span style="font-size:22px">${CAT_ICON[item.category]||'📦'}</span>`}
            </div>
            <div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:4px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;white-space:nowrap">${esc(item.name)}</div>
            ${badge(item.rarity)}
            ${ownerTag(item)}
            <div style="margin-top:6px;font-size:18px;font-weight:900;color:var(--text)">×${item.qty}</div>
            <div style="display:flex;gap:4px;justify-content:center;margin-top:8px">
              <button class="btn btn-outline btn-xs" onclick="openInvTransfer(${item.id})" title="Transférer">⇄</button>
              <button class="btn btn-outline btn-xs" onclick="openInvModal(${item.id})">✏️</button>
              <button class="btn btn-danger btn-xs" onclick="deleteInvItem(${item.id})">✕</button>
            </div>
          </div>`;
        }).join('') + '</div>';

  // ── MODE LISTE ──
  } else {
    el.innerHTML = filtered.length===0
      ? `<div style="text-align:center;color:var(--dim);padding:40px 0;font-style:italic">Aucun objet trouvé...</div>`
      : filtered.map(item => {
          const rc = RARITY[item.rarity]?.col || '#9ca3af';
          return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px 16px;display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <!-- Icône / image -->
            <div style="width:38px;height:38px;background:${rc}18;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;overflow:hidden;border:1px solid ${rc}22">
              ${item.emoji ? `<span style="font-size:22px">${esc(item.emoji)}</span>`
                : item.icon ? `<img src="${item.icon}" style="width:100%;height:100%;object-fit:cover">`
                : `<span style="font-size:22px">${CAT_ICON[item.category]||'📦'}</span>`}
            </div>
            <!-- Nom, badges et description -->
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span style="color:var(--text);font-weight:600;font-size:15px">${esc(item.name)}</span>
                ${badge(item.rarity)}
                ${ownerTag(item)}
                <span style="color:var(--dim);font-size:12px">${esc(item.category)}</span>
              </div>
              ${item.description ? `<div style="color:var(--dim);font-size:13px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(item.description)}</div>` : ''}
            </div>
            <!-- Quantité -->
            <div style="background:var(--surface2);border:1px solid var(--border2);border-radius:6px;padding:4px 14px;color:var(--text);font-weight:700;font-size:16px;min-width:42px;text-align:center">${item.qty}</div>
            <!-- Actions -->
            <div style="display:flex;gap:6px">
              <button class="btn btn-outline btn-xs" onclick="openInvTransfer(${item.id})" title="Transférer">⇄</button>
              <button class="btn btn-outline btn-xs" onclick="openInvModal(${item.id})" title="Modifier">✏️</button>
              <button class="btn btn-danger btn-xs" onclick="deleteInvItem(${item.id})">✕</button>
            </div>
          </div>`;
        }).join('');
  }
}


// ================================================================
// RICHESSE — trésorerie, dépôts aventuriers, trésors
// ================================================================

/**
 * Affiche le panneau "Richesse" avec :
 *  1. La trésorerie de guilde (PP/PO/PA/PC + lingots) — éditable inline
 *  2. Les dépôts individuels des aventuriers (m.bank)
 *  3. Les trésors & objets de valeur (DB.treasures)
 *
 * ⚠️  CORRECTION BUG v8.1 :
 *   Toutes les valeurs totales en PO passent désormais par calcWealthPO()
 *   qui arrondit à 2 décimales, évitant les flottants parasites IEEE 754
 *   (ex: 10.099999999999998 affiché au lieu de 10.10).
 */
function renderWealthPanel() {
  const el = document.getElementById('inv-list');
  if (!el) return;

  // Récupération de la trésorerie principale (défaut si absente)
  const w  = DB.wealth    || {pp:0, po:0, pa:0, pc:0, lingots:0, tresor:''};
  // DB.guildBank conservé en données mais non affiché (voir CLAUDE.md Patch 1)
  const gb = DB.guildBank || {pp:0, po:0, pa:0, pc:0};

  // ── Calcul du total des dépôts membres en PO (via calcWealthPO) ──
  // On n'affiche que les membres avec un dépôt non nul.
  const memberBankPO = DB.members.reduce((sum, m) => {
    return sum + calcWealthPO(m.bank || {});
  }, 0);

  // ── Valeur totale de la trésorerie principale en PO (BUG FIX) ──
  // Avant : ((w.pp||0)*10 + (w.po||0) + (w.pa||0)*0.1 + (w.pc||0)*0.01 + (w.lingots||0)*50)
  //         → pouvait produire 10.099999999999998 pour 10 PA
  // Après : calcWealthPO(w) → 10.10 (arrondi propre)
  const totalPO = calcWealthPO(w);

  // ── Lignes de pièces pour la trésorerie (PP / PO / PA / PC) ──
  // Chaque input modifie directement DB.wealth[k] et appelle save() + updateStats()
  const coinRows = (
    [['pp','PP','#c084fc'], ['po','PO','#fbbf24'], ['pa','PA','#9ca3af'], ['pc','PC','#b45309']]
  ).map(([k, label, col]) => `
    <div style="background:var(--surface2);border:1px solid ${col}33;border-radius:10px;padding:16px;text-align:center">
      <div style="font-size:11px;color:${col};text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">${label}</div>
      <input type="number" value="${w[k]||0}" min="0"
        style="width:100%;background:transparent;border:none;color:${col};font-size:26px;font-weight:900;font-family:'Cinzel',serif;text-align:center"
        oninput="if(!DB.wealth)DB.wealth={};DB.wealth['${k}']=+this.value;save();updateStats()">
    </div>`).join('');

  el.innerHTML = `
  <div style="display:flex;flex-direction:column;gap:20px;max-width:700px">

    <!-- ═══════════════════════════════════════════════════════════
         SECTION 1 : TRÉSORERIE DE LA GUILDE
         Pièces (PP/PO/PA/PC), lingots, et valeur totale calculée.
         ═══════════════════════════════════════════════════════════ -->
    <div class="card">
      <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px">
        💰 Trésorerie de la Guilde
      </div>

      <!-- Grille des 4 devises — chacune éditable inline -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
        ${coinRows}
      </div>

      <!-- Lingots d'or + affichage de la valeur totale corrigée -->
      <div style="background:var(--surface2);border:1px solid #c084fc33;border-radius:10px;padding:16px;display:flex;align-items:center;gap:16px">
        <div style="font-size:32px">🏅</div>
        <div style="flex:1">
          <div style="font-size:11px;color:#c084fc;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Lingots d'Or</div>
          <input type="number" value="${w.lingots||0}" min="0"
            style="background:transparent;border:none;color:#fbbf24;font-size:24px;font-weight:900;font-family:'Cinzel',serif;width:100px"
            oninput="if(!DB.wealth)DB.wealth={};DB.wealth.lingots=+this.value;save();updateStats()">
          <span style="color:var(--dim);font-size:12px;margin-left:6px">× 50 PO chacun</span>
        </div>
        <!-- CORRECTION BUG : utilisation de calcWealthPO() au lieu du calcul inline -->
        <div style="text-align:right;color:var(--gold)">
          <div style="font-size:11px;color:var(--dim);margin-bottom:4px">Valeur totale en PO</div>
          <div style="font-size:22px;font-weight:900">${totalPO.toLocaleString('fr-FR', {minimumFractionDigits:0, maximumFractionDigits:2})}</div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         SECTION 2 : DÉPÔTS DES AVENTURIERS
         Affiche les fonds déposés en banque par chaque membre (m.bank).
         NOTE : DB.guildBank (fonds communs) est intentionnellement
         absent — voir PATCHES.md Patch 1 pour l'explication.
         ═══════════════════════════════════════════════════════════ -->
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase">
          🎒 Dépôts des Aventuriers
        </div>
        <!-- Affiche le total uniquement si des dépôts existent -->
        ${memberBankPO > 0
          ? `<span style="font-size:12px;color:var(--gold);font-weight:700">
               ${memberBankPO.toLocaleString('fr-FR', {minimumFractionDigits:0, maximumFractionDigits:2})} PO au total
             </span>`
          : ''}
      </div>

      <!-- Une ligne par membre ayant un dépôt non nul -->
      ${DB.members.length ? `
      <div style="display:flex;flex-direction:column;gap:5px">
        ${DB.members.map(m => {
          const b   = m.bank || {};
          // calcWealthPO arrondit correctement (bug fix)
          const bPO = calcWealthPO(b);
          if (!bPO) return ''; // Masque les membres sans dépôt
          return `<div style="display:flex;align-items:center;gap:10px;padding:7px 10px;background:var(--surface2);border-radius:7px">
            ${avatarEl(m, 28)}
            <span style="flex:1;color:var(--text);font-size:13px">${esc(m.name)}</span>
            <!-- Montant total en PO -->
            <span style="color:var(--gold);font-weight:700;font-size:13px">
              ${bPO.toLocaleString('fr-FR', {minimumFractionDigits:0, maximumFractionDigits:2})} PO
            </span>
            <!-- Détail par devise (affiche seulement les devises > 0) -->
            <span style="color:var(--dim);font-size:11px">
              [${[['pp','#c084fc'],['po','#fbbf24'],['pa','#9ca3af'],['pc','#b45309']]
                  .filter(([k]) => b[k] > 0)
                  .map(([k, col]) => `<span style="color:${col}">${b[k]}${k}</span>`)
                  .join(' ')}]
            </span>
          </div>`;
        }).filter(Boolean).join('') || '<div style="color:var(--dim);font-size:12px;font-style:italic">Aucun dépôt enregistré.</div>'}
      </div>` : ''}
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         SECTION 3 : TRÉSORS & OBJETS DE VALEUR
         Objets précieux hors-inventaire (gems, œuvres d'art, etc.)
         Stockés dans DB.treasures[]. Valeur en PO, quantifiable.
         ═══════════════════════════════════════════════════════════ -->
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="font-size:11px;color:var(--gold);font-weight:700;letter-spacing:.1em;text-transform:uppercase">
          💎 Trésors & Objets de Valeur
        </div>
        <button class="btn btn-xs btn-outline" onclick="openAddTreasureModal()">+ Ajouter</button>
      </div>

      <!-- Aucun trésor -->
      ${(DB.treasures||[]).length===0
        ? `<div style="color:var(--dim);font-size:12px;font-style:italic;margin-bottom:8px">Aucun trésor enregistré.</div>`
        : ''}

      <!-- Liste des trésors -->
      ${(DB.treasures||[]).map((tr, ti) => `
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:18px">${tr.icon||'💎'}</span>
          <div style="flex:1">
            <div style="color:var(--text);font-size:13px;font-weight:600">${esc(tr.name)}</div>
            ${tr.value ? `<div style="color:var(--gold);font-size:11px">${esc(tr.value)} PO</div>` : ''}
          </div>
          <span style="background:var(--surface2);color:var(--text);padding:2px 8px;border-radius:4px;font-size:12px">× ${tr.qty||1}</span>
          <button onclick="deleteTreasure(${ti})" class="btn btn-xs btn-danger">✕</button>
        </div>`).join('')}

      <!-- Total des trésors — calcul simple entier × valeur unitaire -->
      ${(DB.treasures||[]).length ? `
        <div style="margin-top:8px;text-align:right;color:var(--gold);font-size:13px;font-weight:700">
          Total: ${(DB.treasures||[])
            .reduce((s, tr) => s + (+(tr.value||0)) * (tr.qty||1), 0)
            .toLocaleString('fr-FR')} PO
        </div>` : ''}
    </div>
  </div>`;
}


// ================================================================
// COFFRES NOMMÉS DE LA GUILDE
// ================================================================

/**
 * Affiche le panneau de gestion des coffres nommés (DB.guildChests).
 * Chaque coffre peut contenir des objets de DB.guildInventory
 * via item.chestId === chest.id.
 * Un coffre supprimé reverse ses objets dans le coffre commun (chestId = null).
 */
function renderGuildChestsPanel() {
  const el = document.getElementById('inv-list');
  if (!el) return;
  const chests = DB.guildChests || [];

  el.innerHTML = `
  <div style="display:flex;flex-direction:column;gap:16px;max-width:700px">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div style="color:var(--dim);font-size:12px">${chests.length} coffre(s) enregistré(s)</div>
      <button class="btn btn-primary btn-sm" onclick="openChestModal()">+ Nouveau coffre</button>
    </div>

    ${chests.length===0 ? `
      <div style="text-align:center;color:var(--dim);padding:40px;font-style:italic">
        Aucun coffre. Créez un coffre pour le forgeron, l'aubergiste, etc.
      </div>` : ''}

    <!-- Carte par coffre avec ses objets associés -->
    ${chests.map((ch, ci) => {
      // Objets appartenant à ce coffre nommé
      const items = (DB.guildInventory||[]).filter(i => i.chestId===ch.id);
      return `<div class="card">
        <!-- En-tête du coffre -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="width:42px;height:42px;background:var(--surface2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px">${ch.icon||'🗄️'}</div>
          <div style="flex:1">
            <div style="font-family:'Cinzel',serif;font-weight:700;font-size:15px;color:var(--text)">${esc(ch.name)}</div>
            ${ch.owner ? `<div style="color:var(--dim);font-size:11px">Propriétaire : ${esc(ch.owner)}</div>` : ''}
          </div>
          <button class="btn btn-outline btn-xs" onclick="openChestModal(${ci})">✏️</button>
          <button class="btn btn-danger btn-xs" onclick="deleteGuildChest(${ci})">✕</button>
        </div>
        <!-- Objets du coffre -->
        ${items.length===0 ? `<div style="color:var(--dim);font-size:12px;font-style:italic">Coffre vide.</div>` : ''}
        ${items.map(item => {
          const rc = RARITY[item.rarity]?.col || '#6366f1';
          return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:16px">${item.emoji||CAT_ICON[item.category]||'📦'}</span>
            <span style="flex:1;color:var(--text);font-size:13px">${esc(item.name)}</span>
            ${badge(item.rarity)}
            <span style="color:var(--dim);font-size:12px">× ${item.qty||1}</span>
          </div>`;
        }).join('')}
        <!-- Ajout rapide dans ce coffre spécifique -->
        <button class="btn btn-ghost btn-xs" style="margin-top:8px"
          onclick="openInvModal(null,${JSON.stringify(ch.id)})">+ Ajouter un objet</button>
      </div>`;
    }).join('')}
  </div>`;
}

/**
 * Ouvre la modale de création / édition d'un coffre nommé.
 * Les données sont stockées dans window._editChest pendant l'édition.
 *
 * @param {number} [editIdx] - index dans DB.guildChests, undefined = création
 */
function openChestModal(editIdx) {
  const ch = editIdx !== undefined
    ? {...(DB.guildChests[editIdx]||{})}
    : {id:uid(), name:'', icon:'🗄️', owner:''};
  window._editChest    = ch;
  window._editChestIdx = editIdx;

  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:400px">
    <div class="modal-header">
      <span class="modal-title">${editIdx !== undefined ? '✏️ Modifier' : '🗄️ Nouveau Coffre'}</span>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="grid2">
        <div class="field"><label>Nom du coffre</label>
          <input value="${esc(ch.name)}" placeholder="Coffre du Forgeron"
            oninput="window._editChest.name=this.value"
            style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 10px">
        </div>
        <div class="field"><label>Icône (emoji)</label>
          <input value="${esc(ch.icon||'🗄️')}" oninput="window._editChest.icon=this.value"
            style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 10px;font-size:20px;text-align:center">
        </div>
      </div>
      <div class="field"><label>Propriétaire (optionnel)</label>
        <input value="${esc(ch.owner||'')}" placeholder="ex: Garron le Forgeron"
          oninput="window._editChest.owner=this.value"
          style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 10px">
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="saveGuildChest()">Sauvegarder</button>
      </div>
    </div>
  </div>`);
}

/**
 * Persiste le coffre en cours d'édition (création ou mise à jour).
 * Valide que le nom n'est pas vide avant de sauvegarder.
 */
function saveGuildChest() {
  const ch = window._editChest;
  if (!ch || !ch.name.trim()) return;
  if (!DB.guildChests) DB.guildChests = [];
  if (window._editChestIdx !== undefined) DB.guildChests[window._editChestIdx] = ch;
  else DB.guildChests.push(ch);
  save(); closeModal(); renderGuildChestsPanel(); toast('Coffre sauvegardé !');
}

/**
 * Supprime un coffre nommé et déplace ses objets dans le coffre commun
 * (en mettant chestId = undefined/null sur chaque objet concerné).
 *
 * @param {number} idx - index dans DB.guildChests
 */
function deleteGuildChest(idx) {
  const ch = DB.guildChests[idx];
  if (!ch) return;
  if (!confirm('Supprimer ce coffre ? Les objets seront déplacés dans le coffre commun.')) return;
  // Réaffecte les objets orphelins au coffre commun
  (DB.guildInventory||[]).filter(i => i.chestId===ch.id).forEach(i => { delete i.chestId; });
  DB.guildChests.splice(idx, 1);
  save(); renderGuildChestsPanel(); toast('Coffre supprimé.');
}


// ================================================================
// MARCHÉ — objets du coffre mis en vente aux PJ
// ================================================================

/**
 * Affiche le panneau Marché : liste des objets en vente avec
 * leur prix et bouton d'achat vers un PJ.
 *
 * Le marché est un miroir de DB.guildInventory — chaque entrée
 * dans DB.market porte sourceId → id de l'objet dans le coffre.
 */
function renderMarketPanel() {
  const el = document.getElementById('inv-list');
  if (!el) return;
  const market = DB.market || [];

  el.innerHTML = `
  <div style="display:flex;flex-direction:column;gap:10px">
    ${market.length===0
      ? `<div style="text-align:center;color:var(--dim);padding:40px;font-style:italic">
           Aucun objet en vente. Mettez des objets du Coffre en vente avec le bouton "+ Mettre en vente".
         </div>`
      : market.map(item => {
          const rc = RARITY[item.rarity]?.col || '#9ca3af';
          return `<div style="background:var(--surface);border:1px solid ${rc}44;border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:14px">
            <!-- Icône -->
            <div style="width:44px;height:44px;background:${rc}18;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;overflow:hidden;flex-shrink:0">
              ${item.emoji ? `<span style="font-size:22px">${esc(item.emoji)}</span>`
                : item.icon ? `<img src="${item.icon}" style="width:100%;height:100%;object-fit:cover">`
                : `<span style="font-size:22px">${CAT_ICON[item.category]||'📦'}</span>`}
            </div>
            <!-- Infos -->
            <div style="flex:1">
              <div style="font-weight:700;font-size:15px;color:var(--text)">${esc(item.name)}</div>
              <div style="color:var(--dim);font-size:12px;margin-top:2px">${esc(item.category)} · ${esc(item.rarity)} · ×${item.qty} en stock</div>
            </div>
            <!-- Prix -->
            <div style="text-align:right;margin-right:12px">
              <div style="color:var(--gold);font-weight:900;font-size:18px">${item.price||0} PO</div>
              <div style="color:var(--dim);font-size:11px">par unité</div>
            </div>
            <!-- Actions -->
            <div style="display:flex;flex-direction:column;gap:4px">
              <button class="btn btn-primary btn-xs" onclick="openBuyModal(${item.id})">🛒 Vendre à un PJ</button>
              <button class="btn btn-danger btn-xs" onclick="removeFromMarket(${item.id})">Retirer</button>
            </div>
          </div>`;
        }).join('')}
  </div>`;
}

/**
 * Ouvre la modale de sélection d'un objet du coffre à mettre en vente.
 * Filtre les objets déjà en vente pour éviter les doublons.
 */
function openMarketModal() {
  // Objets du coffre pas encore dans le marché
  const available = DB.guildInventory.filter(i => !(DB.market||[]).find(m => m.sourceId===i.id));
  if (!available.length) { toast('Tout le coffre est déjà en vente !'); return; }

  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:420px">
    <div class="modal-header"><span class="modal-title">🏪 Mettre en vente</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="field"><label>Objet (depuis le Coffre)</label>
        <select id="mkt-item" onchange="window._mktId=+this.value">
          ${available.map(i => `<option value="${i.id}">${esc(i.name)} (×${i.qty})</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>Prix unitaire (PO)</label>
        <input type="number" value="10" min="0" id="mkt-price" oninput="window._mktPrice=+this.value">
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="addToMarket()">Mettre en vente</button>
      </div>
    </div>
  </div>`);
  window._mktId    = available[0].id;
  window._mktPrice = 10;
}

/**
 * Ajoute un objet du coffre au marché.
 * Effectue aussi des migrations de données pour les anciens enregistrements
 * (V5/V6 → V8) : initialise les champs manquants sur les membres.
 */
function addToMarket() {
  const item = DB.guildInventory.find(i => i.id===window._mktId);
  if (!item) return;
  if (!DB.market)     DB.market     = [];
  if (!DB.guildBank)  DB.guildBank  = {pp:0, po:0, pa:0, pc:0};

  // ── Migrations V5/V6 → V8 ──
  // Exécutées ici car addToMarket est appelé fréquemment et garantit
  // que tous les champs requis existent avant tout affichage.
  DB.members.forEach(m => {
    if (!m.pocket)      m.pocket      = [];
    if (!m.pocketSize)  m.pocketSize  = 6;
    if (m.race          === undefined) m.race          = '';
    if (m.alignment     === undefined) m.alignment     = '';
    if (m.background    === undefined) m.background    = '';
    if (m.age           === undefined) m.age           = '';
    if (!m.resources)   m.resources   = [];
    if (!m.panelOrder)  m.panelOrder  = [];
    if (m.bagSize       === undefined) m.bagSize       = 20;
  });
  // Migrations V6.1 – V6.3 — structures de données globales
  if (!DB.locations)    DB.locations    = [];
  if (!DB.quests)       DB.quests       = [];
  if (!DB.factions)     DB.factions     = [];
  if (!DB.timeline)     DB.timeline     = [];
  if (!DB.sessionNotes) DB.sessionNotes = [];
  if (!DB.chronicles)   DB.chronicles   = [{id:1, title:'Chronique principale', color:'#6366f1', icon:'📜'}];
  (DB.journal||[]).forEach(e => { if (!e.chronicleId) e.chronicleId = 1; });
  if (!DB.guildChests)  DB.guildChests  = [];

  if (DB.market.find(m => m.sourceId===item.id)) { toast('Déjà en vente !'); return; }

  // Crée une copie de l'objet pour le marché (sans modifier l'original)
  DB.market.push({...JSON.parse(JSON.stringify(item)), id:uid(), sourceId:item.id, price:window._mktPrice||10});
  save(); closeModal(); renderInventory(); toast('Mis en vente !');
}

/**
 * Retire un objet du marché sans le supprimer du coffre.
 * @param {number} id - id de l'entrée dans DB.market
 */
function removeFromMarket(id) {
  DB.market = (DB.market||[]).filter(m => m.id!==id);
  save(); renderMarketPanel();
}

/**
 * Ouvre la modale d'achat d'un objet du marché par un PJ.
 * Affiche le prix, le stock disponible et un sélecteur de membre.
 *
 * @param {number} marketItemId - id dans DB.market
 */
function openBuyModal(marketItemId) {
  const mitem = (DB.market||[]).find(m => m.id===marketItemId);
  if (!mitem) return;

  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:400px">
    <div class="modal-header"><span class="modal-title">🛒 Vendre : ${esc(mitem.name)}</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div style="background:var(--surface2);border-radius:8px;padding:12px 16px;margin-bottom:14px;color:var(--muted);font-size:14px">
        Prix : <strong style="color:var(--gold)">${mitem.price} PO</strong>
        · Stock coffre : ×${DB.guildInventory.find(i => i.id===mitem.sourceId)?.qty||0}
      </div>
      <div class="field"><label>Acheter pour quel personnage ?</label>
        <select id="buy-member">
          ${DB.members.map(m => `<option value="${m.id}">${m.avatar} ${esc(m.name)} — ${m.gold?.po||0} PO</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>Quantité</label>
        <input type="number" id="buy-qty" value="1" min="1"
          max="${DB.guildInventory.find(i => i.id===mitem.sourceId)?.qty||1}">
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="executeBuy(${marketItemId})">Acheter</button>
      </div>
    </div>
  </div>`);
}

/**
 * Exécute l'achat d'un objet du marché :
 *  1. Vérifie que le membre a assez de PO
 *  2. Débite le membre
 *  3. Retire l'objet du coffre de guilde
 *  4. Ajoute l'objet dans l'inventaire perso du membre
 *  5. Met à jour le miroir marché
 *  6. Crédite la trésorerie de guilde
 *
 * @param {number} marketItemId - id dans DB.market
 */
function executeBuy(marketItemId) {
  const mitem    = (DB.market||[]).find(m => m.id===marketItemId);
  const memberId = +document.getElementById('buy-member').value;
  const qty      = +document.getElementById('buy-qty').value || 1;
  const member   = DB.members.find(m => m.id===memberId);
  if (!mitem || !member) return;

  const cost = mitem.price * qty;

  // Vérification de solvabilité
  if ((member.gold?.po||0) < cost) {
    toast(`💸 ${member.name} n'a pas assez de PO ! (${cost} PO requis)`);
    return;
  }

  // 1. Débit du membre
  member.gold.po -= cost;

  // 2. Retrait du coffre de guilde (source)
  const src = DB.guildInventory.find(i => i.id===mitem.sourceId);
  if (!src || src.qty < qty) { toast('Stock insuffisant dans le Coffre !'); return; }
  src.qty -= qty;
  if (src.qty <= 0) DB.guildInventory = DB.guildInventory.filter(i => i.id!==mitem.sourceId);

  // 3. Ajout dans l'inventaire du membre (empile si même nom)
  if (!member.inventory) member.inventory = [];
  const existing = member.inventory.find(i => i.name===mitem.name);
  if (existing) existing.qty += qty;
  else member.inventory.push({...JSON.parse(JSON.stringify(mitem)), id:uid(), qty, sourceId:undefined, price:undefined});

  // 4. Mise à jour du miroir marché (décrémente le stock affiché)
  const mktItem = DB.market.find(m => m.id===marketItemId);
  if (mktItem) {
    mktItem.qty -= qty;
    if (mktItem.qty <= 0) DB.market = DB.market.filter(m => m.id!==marketItemId);
  }

  // 5. Crédit de la trésorerie de guilde
  if (!DB.wealth) DB.wealth = {pp:0, po:0, pa:0, pc:0, lingots:0, tresor:''};
  DB.wealth.po = (DB.wealth.po||0) + cost;

  save(); closeModal(); renderInventory();
  toast(`🛒 ${member.name} achète ×${qty} ${mitem.name} pour ${cost} PO !`);
}


// ================================================================
// OBJETS — modale d'ajout / édition
// ================================================================

/**
 * Ouvre la modale d'ajout ou de modification d'un objet.
 * Fonctionne à la fois pour le coffre de guilde et l'inventaire perso.
 *
 * @param {number} [editId] - id de l'objet à modifier, null/undefined = création
 * @param {string} [preChestId] - id du coffre nommé à pré-sélectionner
 */
function openInvModal(editId, preChestId) {
  const items = invTab==='guild'
    ? DB.guildInventory
    : (DB.members.find(m => m.id===invMemberId)?.inventory || []);
  const src  = editId ? items.find(i => i.id===editId) : null;
  const item = src
    ? JSON.parse(JSON.stringify(src))
    : {id:uid(), name:'', qty:1, category:'Équipement', chestId:preChestId||null, rarity:'Commun', description:'', icon:null};

  window._editItem = item;
  window._imgUploads['inv-icon'] = null;

  openModal(`<div class="modal" onclick="event.stopPropagation()">
    <div class="modal-header">
      <span class="modal-title">${editId ? '✏️ Modifier' : '+ Ajouter'} un Objet</span>
      ${!editId ? `<button class="btn btn-ghost btn-xs" style="font-size:11px"
        onclick="toggleItemDBPanel()">📚 Base de données</button>` : ''}
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">

      <!-- Panneau de recherche dans la base d'items D&D 5e -->
      <div id="item-db-panel" style="display:none;margin-bottom:14px;background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:10px">
        <div style="font-size:11px;color:var(--gold);font-weight:700;letter-spacing:.05em;margin-bottom:8px">
          📚 BASE D'OBJETS D&D 5e — cliquer pour importer
        </div>
        <div style="display:flex;gap:6px;margin-bottom:8px">
          <input id="item-db-search" placeholder="Rechercher…" oninput="renderItemDBResults()"
            style="flex:1;background:var(--surface);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 10px;font-size:12px">
          <select id="item-db-cat" onchange="renderItemDBResults()"
            style="background:var(--surface);border:1px solid var(--border2);border-radius:5px;color:var(--dim);font-size:11px;padding:4px">
            <option value="">Toutes</option>
            ${ITEM_CATS.map(cat => `<option value="${cat}">${CAT_ICON[cat]||''} ${cat}</option>`).join('')}
          </select>
        </div>
        <div id="item-db-results" style="max-height:200px;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:5px"></div>
      </div>

      <div class="field"><label>Nom</label>
        <input value="${esc(item.name)}" oninput="window._editItem.name=this.value" placeholder="Épée du Néant...">
      </div>

      <div class="grid2">
        <div class="field"><label>Quantité</label>
          <input type="number" value="${item.qty}" oninput="window._editItem.qty=+this.value" min="1">
        </div>
        <div class="field"><label>Catégorie</label>
          <select onchange="window._editItem.category=this.value;
            const _gbf=document.getElementById('ginv-bag-bonus-field');
            if(_gbf)_gbf.style.display=this.value==='Sac'?'block':'none'">
            ${ITEM_CATS.map(cat => `<option value="${cat}"${cat===item.category?' selected':''}>${CAT_ICON[cat]||''} ${cat}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Bonus de cases — visible uniquement si catégorie = Sac -->
      <div id="ginv-bag-bonus-field" style="display:${item.category==='Sac'?'block':'none'}">
        <div class="field">
          <label>🎒 Bonus de cases (capacité ajoutée par ce sac)</label>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="number" min="0" max="100"
              value="${item.bagBonus !== undefined && item.bagBonus !== '' ? item.bagBonus : ''}"
              placeholder="ex: 12"
              oninput="window._editItem.bagBonus=this.value!==''?+this.value:undefined"
              style="width:90px;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px">
            <span style="color:var(--dim);font-size:12px">cases supplémentaires d'inventaire</span>
          </div>
        </div>
      </div>

      <div class="field"><label>Rareté</label>
        <select onchange="window._editItem.rarity=this.value">
          ${Object.keys(RARITY).map(r => `<option${r===item.rarity?' selected':''}>${r}</option>`).join('')}
        </select>
      </div>

      <!-- Affectation à un coffre nommé (mode guilde, si coffres existent) -->
      ${invTab==='guild' && (DB.guildChests||[]).length ? `
      <div class="field"><label>🗄️ Coffre</label>
        <select onchange="window._editItem.chestId=this.value?+this.value:null" style="width:100%">
          <option value="">— Coffre commun —</option>
          ${(DB.guildChests||[]).map(ch =>
            `<option value="${ch.id}"${item.chestId===ch.id?' selected':''}>${ch.icon||'🗄️'} ${esc(ch.name)}</option>`
          ).join('')}
        </select>
      </div>` : ''}

      <div class="field"><label>Description</label>
        <textarea rows="3" oninput="window._editItem.description=this.value"
          placeholder="Description...">${esc(item.description||'')}</textarea>
      </div>

      <!-- Emoji rapide — prioritaire sur l'image si renseigné -->
      <div class="field"><label>Émoji / Icône rapide</label>
        <div style="display:flex;align-items:center;gap:8px">
          <input id="inv-emoji-input" value="${esc(item.emoji||item.icon||'')}"
            oninput="window._editItem.emoji=this.value.trim()"
            placeholder="📦 ou 🗡️ ou ⚗️..."
            style="width:90px;font-size:20px;text-align:center;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:6px">
          <span style="color:var(--dim);font-size:12px">Emoji affiché (optionnel — remplace l'image si renseigné)</span>
        </div>
      </div>
      ${imgUploadField('inv-icon', item.icon, '🖼️ Icône (optionnel)')}

      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="saveInvItem(${editId||'null'})">${editId ? 'Sauvegarder' : 'Ajouter'}</button>
      </div>
    </div>
  </div>`);
}

/**
 * Persiste un objet créé ou modifié dans le bon conteneur
 * (DB.guildInventory ou member.inventory selon invTab).
 *
 * @param {number|'null'} editId - id de l'objet à mettre à jour, 'null' = création
 */
function saveInvItem(editId) {
  const item = window._editItem;
  if (!item || !item.name.trim()) return;

  // Remplace l'icône par l'image uploadée si présente
  if (window._imgUploads['inv-icon']) item.icon = window._imgUploads['inv-icon'];
  if (!item.emoji) item.emoji = null;

  if (invTab==='guild') {
    if (editId && editId!=='null') DB.guildInventory = DB.guildInventory.map(i => i.id===editId ? item : i);
    else DB.guildInventory.push(item);
  } else {
    const m = DB.members.find(x => x.id===invMemberId);
    if (!m) return;
    if (!m.inventory) m.inventory = [];
    if (editId && editId!=='null') m.inventory = m.inventory.map(i => i.id===editId ? item : i);
    else m.inventory.push(item);
  }
  save(); closeModal(); renderInventoryList(); toast('Objet sauvegardé !');
}

/**
 * Supprime un objet du coffre ou de l'inventaire perso.
 * @param {number} id - id de l'objet
 */
function deleteInvItem(id) {
  if (invTab==='guild') {
    DB.guildInventory = DB.guildInventory.filter(i => i.id!==id);
  } else {
    const m = DB.members.find(x => x.id===invMemberId);
    if (m) m.inventory = (m.inventory||[]).filter(i => i.id!==id);
  }
  save(); renderInventoryList();
}


// ================================================================
// TRANSFERT D'OBJETS — entre coffre et inventaires
// ================================================================

/**
 * Ouvre la modale de transfert d'un objet vers une autre destination.
 * La liste des destinations varie selon la source (guild vs member).
 *
 * @param {number} itemId - id de l'objet à transférer
 */
function openInvTransfer(itemId) {
  const items = invTab==='guild'
    ? DB.guildInventory
    : (DB.members.find(m => m.id===invMemberId)?.inventory || []);
  const item = items.find(i => i.id===itemId);
  if (!item) return;

  // Construction des options de destination
  const destOptions = invTab==='guild'
    // Depuis le coffre : vers inventaires joueurs ou casiers
    ? `<optgroup label="Inventaires joueurs">`
        + DB.members.map(m => `<option value="inv_${m.id}">${m.avatar||'👤'} ${esc(m.name)} — inventaire</option>`).join('')
        + `</optgroup>`
        + `<optgroup label="Coffre guilde">`
        + `<option value="coffre">⚖️ Coffre commun</option>`
        + DB.members.map(m => `<option value="casier_${m.id}">${m.avatar||'👤'} ${esc(m.name)} — casier</option>`).join('')
        + `</optgroup>`
    // Depuis inventaire perso : vers coffre commun ou casiers
    : `<optgroup label="Coffre guilde">`
        + `<option value="coffre">⚖️ Coffre commun</option>`
        + DB.members.map(m => `<option value="casier_${m.id}">${m.avatar||'👤'} ${esc(m.name)} — casier</option>`).join('')
        + `</optgroup>`;

  const defDest = invTab==='guild' ? `inv_${DB.members[0]?.id||''}` : 'coffre';
  window._trDest = defDest;
  window._trQty  = 1;

  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:400px">
    <div class="modal-header"><span class="modal-title">⇄ Transférer : ${esc(item.name)}</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="field"><label>Destination</label>
        <select id="tr-dest" onchange="window._trDest=this.value">${destOptions}</select>
      </div>
      <div class="field"><label>Quantité</label>
        <input type="number" id="tr-qty" value="1" min="1" max="${item.qty}"
          oninput="window._trQty=+this.value">
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="doTransfer(${itemId})">Transférer</button>
      </div>
    </div>
  </div>`);
  setTimeout(() => { const s = document.getElementById('tr-dest'); if (s) s.value = defDest; }, 30);
}

/**
 * Effectue le transfert d'un ou plusieurs exemplaires d'un objet
 * vers une destination (inventaire perso, coffre commun, casier).
 *
 * Logique :
 *  - Décrémente/supprime l'objet source
 *  - Empile dans la destination si un objet du même nom existe déjà
 *  - Sinon crée une nouvelle entrée
 *
 * @param {number} itemId - id de l'objet source
 */
function doTransfer(itemId) {
  const qty  = +(window._trQty || 1);
  const dest = String(window._trDest || '');

  /**
   * Ajoute qty unités dans DB.guildInventory, avec ownerId optionnel.
   * Empile si un objet du même nom et même ownerId existe.
   *
   * @param {object} src - objet source
   * @param {number|null} ownerId - null = coffre commun
   */
  const addToGuild = (src, ownerId) => {
    const ex = DB.guildInventory.find(i => i.name===src.name && (i.ownerId||null)===(ownerId||null));
    if (ex) ex.qty += qty;
    else DB.guildInventory.push({...src, id:uid(), qty, ownerId: ownerId||null});
  };

  if (invTab==='guild') {
    // Source = coffre de guilde
    const src = DB.guildInventory.find(i => i.id===itemId);
    if (!src || src.qty < qty) return;
    src.qty -= qty;
    if (src.qty <= 0) DB.guildInventory = DB.guildInventory.filter(i => i.id!==itemId);

    if      (dest.startsWith('inv_'))    {
      // → Inventaire perso d'un membre
      const m = DB.members.find(x => x.id===+dest.slice(4));
      if (m) {
        const ex = (m.inventory||[]).find(i => i.name===src.name);
        if (ex) ex.qty += qty;
        else    { if (!m.inventory) m.inventory=[]; m.inventory.push({...src, id:uid(), qty, ownerId:undefined}); }
      }
    }
    else if (dest==='coffre')            addToGuild(src, null);
    else if (dest.startsWith('casier_')) addToGuild(src, +dest.slice(7));

  } else {
    // Source = inventaire perso
    const m = DB.members.find(x => x.id===invMemberId);
    if (!m) return;
    const src = (m.inventory||[]).find(i => i.id===itemId);
    if (!src || src.qty < qty) return;
    src.qty -= qty;
    if (src.qty <= 0) m.inventory = m.inventory.filter(i => i.id!==itemId);

    if      (dest==='coffre')            addToGuild(src, null);
    else if (dest.startsWith('casier_')) addToGuild(src, +dest.slice(7));
  }

  save(); closeModal(); renderInventoryList(); toast('Transféré !');
}


// ================================================================
// MARCHANDS — stock aléatoire par seed, achat depuis la guilde ou perso
// ================================================================

/**
 * Seed principal de génération des stocks marchands.
 * Changé par refreshMerchants() pour forcer un nouveau tirage global.
 */
let _merchantSeed  = Date.now();

/**
 * Seeds individuels par marchand (key → seed).
 * Permettent de relancer un seul marchand sans affecter les autres.
 */
let _merchantSeeds = {};

/**
 * Retourne (ou génère) le seed aléatoire d'un marchand spécifique.
 * Un seed est stable entre deux renders, ce qui garantit que le stock
 * ne change pas au simple rechargement de l'affichage.
 *
 * @param {string} key - identifiant du marchand
 * @returns {number} seed numérique
 */
function getMerchantSeed(key) {
  if (!_merchantSeeds[key]) _merchantSeeds[key] = Date.now() + key.charCodeAt(0)*1000;
  return _merchantSeeds[key];
}

/**
 * Force le renouvellement du stock d'un seul marchand.
 * Génère un nouveau seed aléatoire pour la clé donnée.
 *
 * @param {string} key - identifiant du marchand
 */
function refreshMerchant(key) {
  _merchantSeeds[key] = Date.now() + Math.random()*99999;
  renderMerchantsPanel();
  toast('🔄 Stock renouvelé !');
}

/**
 * Génère le stock d'un marchand à partir de son seed.
 * Utilise un mélange de Fisher-Yates déterministe basé sur le seed
 * pour garantir la stabilité tant que le seed ne change pas.
 *
 * Si DB.merchantItems[key] est défini, utilise cette liste custom ;
 * sinon filtre ITEM_DATABASE par item.merchant === key.
 *
 * @param {string} merchantKey - identifiant du marchand
 * @returns {Array} Liste d'objets avec {_price, _qty, _mult} ajoutés
 */
function generateMerchantStock(merchantKey) {
  const m = getMerchantsAll()[merchantKey];
  if (!m) return [];

  // ── Sélection du pool d'items ──
  let pool;
  if (DB.merchantItems && DB.merchantItems[merchantKey] && Array.isArray(DB.merchantItems[merchantKey])) {
    // Pool personnalisé : seuls les items explicitement listés
    const allowed = new Set(DB.merchantItems[merchantKey]);
    pool = ITEM_DATABASE.filter(i => allowed.has(i.name));
  } else {
    // Pool par défaut : items dont merchant === merchantKey
    pool = ITEM_DATABASE.filter(i => i.merchant===merchantKey);
  }
  if (!pool.length) return [];

  // ── Mélange pseudo-aléatoire déterministe ──
  // La fonction rng(i) produit toujours la même valeur pour un seed+i donnés,
  // ce qui rend le tri stable entre les renders.
  const seed = getMerchantSeed(merchantKey);
  const rng  = (i) => { let x = Math.sin(seed+i)*10000; return x - Math.floor(x); };
  const shuffled = pool.map((item, i) => ({item, r:rng(i)})).sort((a, b) => a.r - b.r);
  const count = Math.min(m.stock, shuffled.length);

  // ── Application d'un modificateur de prix aléatoire (×0.5 à ×4) ──
  return shuffled.slice(0, count).map((s, i) => {
    const basePrice = s.item.price || 1;
    const mult  = 0.5 + rng(i+100) * 3.5;               // facteur entre 0.5× et 4×
    const price = Math.max(1, Math.round(basePrice * mult));
    const qty   = 1 + Math.floor(rng(i+200) * 5);        // 1 à 5 unités
    return {...s.item, _price:price, _qty:qty, _mult:mult};
  });
}

/** Renouvelle le stock de TOUS les marchands simultanément. */
function refreshMerchants() {
  _merchantSeed  = Date.now();
  _merchantSeeds = {};
  renderMerchantsPanel();
  toast('🔄 Les marchands ont renouvelé leur stock !');
}

/**
 * Ouvre la modale de création / édition d'un marchand.
 * Les marchands custom sont stockés dans DB.merchants.
 *
 * @param {string} [editKey] - clé du marchand à modifier, undefined = création
 */
function openMerchantModal(editKey) {
  var allM  = MERCHANTS;
  var isNew = !editKey;
  var src   = editKey ? allM[editKey] : null;
  var d = {
    key:   editKey || ('marchand_' + uid()),
    name:  src ? src.name  : '',
    icon:  src ? src.icon  : '🏪',
    color: src ? src.color : '#6366f1',
    desc:  src ? src.desc  : '',
    stock: src ? src.stock : 6
  };
  window._editMerchant = d;

  // Palette de couleurs prédéfinies (10 teintes)
  var colors = ['#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#6366f1','#8b5cf6','#ec4899','#a78bfa'];
  var colorPicker = colors.map(function(c) {
    var outline = d.color===c ? 'outline:2px solid white;' : '';
    return '<div onclick="window._editMerchant.color=\'' + c + '\';'
      + 'document.querySelectorAll(\'[data-cpick]\').forEach(function(x){x.style.outline=\'none\'});'
      + 'this.style.outline=\'2px solid white\'" '
      + 'data-cpick="1" style="width:24px;height:24px;background:' + c + ';border-radius:4px;cursor:pointer;display:inline-block;margin:2px;' + outline + '"></div>';
  }).join('');

  var delBtn = !isNew
    ? '<button class="btn btn-danger btn-sm" onclick="deleteMerchant(\'' + editKey + '\')">Supprimer</button>'
    : '';

  var html = '<div class="modal" onclick="event.stopPropagation()" style="max-width:480px">'
    + '<div class="modal-header"><span class="modal-title">' + (isNew ? '+ Nouveau Marchand' : 'Modifier Marchand') + '</span>'
    + '<button class="modal-close" onclick="closeModal()">&#x2715;</button></div>'
    + '<div class="modal-body">'
    + '<div class="grid2">'
    + '<div class="field"><label>Icône</label><input id="mi-icon" value="' + esc(d.icon) + '" oninput="window._editMerchant.icon=this.value" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;text-align:center;font-size:22px;box-sizing:border-box"></div>'
    + '<div class="field"><label>Nom *</label><input id="mi-name" value="' + esc(d.name) + '" oninput="window._editMerchant.name=this.value" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>'
    + '<div class="field" style="grid-column:1/-1"><label>Description</label><input id="mi-desc" value="' + esc(d.desc) + '" oninput="window._editMerchant.desc=this.value" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>'
    + '<div class="field"><label>Stock max</label><input type="number" min="1" max="20" value="' + d.stock + '" oninput="window._editMerchant.stock=+this.value" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:9px;box-sizing:border-box"></div>'
    + '<div class="field"><label>Couleur</label><div style="margin-top:6px">' + colorPicker + '</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">'
    + '<button class="btn btn-ghost" onclick="closeModal()">Annuler</button>'
    + delBtn
    + '<button class="btn btn-primary" onclick="saveMerchant(\'' + (editKey||'') + '\')">Enregistrer</button>'
    + '</div>'
    + '</div></div>';
  openModal(html);
}

/**
 * Persiste un marchand dans DB.merchants.
 * Valide le nom avant de sauvegarder.
 *
 * @param {string} editKey - clé existante, '' = création
 */
function saveMerchant(editKey) {
  var d = window._editMerchant;
  if (!d.name.trim()) { toast('Nom requis'); return; }
  if (!DB.merchants) DB.merchants = {};
  var key = editKey || d.key;
  DB.merchants[key] = {name:d.name, icon:d.icon, emoji:d.icon, color:d.color, desc:d.desc, stock:d.stock};
  save(); closeModal(); renderMerchantsPanel(); toast('Marchand enregistré !');
}

/**
 * Supprime un marchand de DB.merchants.
 * @param {string} key - clé du marchand
 */
function deleteMerchant(key) {
  if (!confirm('Supprimer ce marchand ?')) return;
  if (DB.merchants) delete DB.merchants[key];
  save(); closeModal(); renderMerchantsPanel(); toast('Marchand supprimé');
}

/**
 * Retourne l'objet marchands actif :
 *  - DB.merchants si des marchands custom ont été créés
 *  - MERCHANTS (constante de data-store.js) sinon
 *
 * @returns {object} {key: {name, icon, color, desc, stock}, ...}
 */
function getMerchantsAll() {
  if (DB.merchants && Object.keys(DB.merchants).length > 0) return DB.merchants;
  return MERCHANTS;
}

/**
 * Ouvre la modale de sélection des objets vendus par un marchand.
 * Permet de surcharger la liste par défaut (ITEM_DATABASE filtré)
 * par une liste custom sauvegardée dans DB.merchantItems[key].
 *
 * @param {string} merchantKey - clé du marchand
 */
function openMerchantItemsModal(merchantKey) {
  var allM = getMerchantsAll();
  var m = allM[merchantKey];
  if (!m) return;
  if (!DB.merchantItems) DB.merchantItems = {};

  // État initial : items par défaut ou custom si déjà définis
  var defaultItems  = ITEM_DATABASE.filter(function(i) { return i.merchant===merchantKey; });
  var isCustom      = Array.isArray(DB.merchantItems[merchantKey]);
  var selectedNames = isCustom
    ? new Set(DB.merchantItems[merchantKey])
    : new Set(defaultItems.map(function(i) { return i.name; }));
  window._editMerchantItems = {key:merchantKey, selected:selectedNames};

  var CATS = ['Arme','Armure','Bouclier','Casque','Bottes','Gants','Cape / Manteau','Bague / Anneau',
              'Amulette','Sac','Consommable','Équipement','Outil','Magie','Artefact'];
  var itemsByCategory = {};
  ITEM_DATABASE.forEach(function(item) {
    if (!itemsByCategory[item.category]) itemsByCategory[item.category] = [];
    itemsByCategory[item.category].push(item);
  });

  var catSections = CATS.map(function(cat) {
    var items = itemsByCategory[cat] || [];
    if (!items.length) return '';
    var rows = items.map(function(item) {
      var checked = selectedNames.has(item.name);
      var rc = RARITY[item.rarity] ? RARITY[item.rarity].col : '#9ca3af';
      return '<label style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:5px;cursor:pointer;background:var(--surface2);margin-bottom:3px">'
        + '<input type="checkbox" data-iname="' + item.name.replace(/"/g,'&quot;') + '" ' + (checked?'checked':'') + ' onchange="toggleMerchantItem(this)">'
        + '<span style="font-size:14px">' + (item.emoji||'📦') + '</span>'
        + '<span style="flex:1;font-size:12px;color:var(--text)">' + esc(item.name) + '</span>'
        + '<span style="font-size:10px;color:' + rc + '">' + esc(item.rarity) + '</span>'
        + '<span style="font-size:10px;color:var(--gold)">' + item.price + ' PO</span>'
        + '</label>';
    }).join('');
    return '<div style="margin-bottom:12px">'
      + '<div style="font-size:10px;color:var(--indigo);font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:8px">'
      + cat
      + '<button onclick="toggleMerchantCategory(\'' + cat.replace(/\'/g,"\\'") + '\')" '
      + 'style="background:none;border:1px solid var(--border2);border-radius:4px;color:var(--dim);cursor:pointer;font-size:9px;padding:1px 6px">Tout/rien</button>'
      + '</div>' + rows + '</div>';
  }).join('');

  var html = '<div class="modal modal-wide" onclick="event.stopPropagation()" style="max-height:90vh">'
    + '<div class="modal-header"><span class="modal-title">📦 Objets de ' + esc(m.name) + '</span>'
    + '<button class="modal-close" onclick="closeModal()">&#x2715;</button></div>'
    + '<div class="modal-body" style="overflow-y:auto;max-height:65vh">'
    + '<div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;flex-wrap:wrap">'
    + '<div style="color:var(--muted);font-size:12px">Cochez les objets que ce marchand peut vendre.</div>'
    + '<button class="btn btn-ghost btn-xs" onclick="selectAllMerchantItems(true)">Tout</button>'
    + '<button class="btn btn-ghost btn-xs" onclick="selectAllMerchantItems(false)">Aucun</button>'
    + '<button class="btn btn-ghost btn-xs" onclick="resetMerchantItemsToDefault(\'' + merchantKey + '\')" title="Revenir aux objets par défaut">↩️ Défauts</button>'
    + '</div>'
    + '<div style="columns:2;column-gap:16px">' + catSections + '</div>'
    + '</div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;padding:16px 24px;border-top:1px solid var(--border)">'
    + '<button class="btn btn-ghost" onclick="closeModal()">Annuler</button>'
    + '<button class="btn btn-primary" onclick="saveMerchantItems()">✅ Enregistrer</button>'
    + '</div></div>';
  openModal(html);
}

/** Coche ou décoche un item dans la modale de sélection marchand. */
function toggleMerchantItem(checkbox) {
  var name = checkbox.getAttribute('data-iname');
  if (checkbox.checked) window._editMerchantItems.selected.add(name);
  else window._editMerchantItems.selected.delete(name);
}

/**
 * Coche / décoche tous les items d'une catégorie.
 * Si tous sont cochés, décoche tout ; sinon coche tout.
 *
 * @param {string} cat - nom de la catégorie
 */
function toggleMerchantCategory(cat) {
  var checkboxes = Array.from(document.querySelectorAll('[data-iname]')).filter(function(cb) {
    var item = ITEM_DATABASE.find(function(i) { return i.name===cb.getAttribute('data-iname'); });
    return item && item.category===cat;
  });
  var allChecked = checkboxes.every(function(cb) { return cb.checked; });
  checkboxes.forEach(function(cb) { cb.checked = !allChecked; toggleMerchantItem(cb); });
}

/**
 * Coche ou décoche tous les items de la modale marchand.
 * @param {boolean} state - true = tout cocher, false = tout décocher
 */
function selectAllMerchantItems(state) {
  document.querySelectorAll('[data-iname]').forEach(function(cb) {
    cb.checked = state;
    toggleMerchantItem(cb);
  });
}

/**
 * Réinitialise la liste custom d'items d'un marchand (supprime DB.merchantItems[key]).
 * Le marchand retrouve sa liste par défaut (ITEM_DATABASE filtré par merchant).
 *
 * @param {string} key - identifiant du marchand
 */
function resetMerchantItemsToDefault(key) {
  if (!DB.merchantItems) DB.merchantItems = {};
  delete DB.merchantItems[key];
  save(); closeModal(); renderMerchantsPanel();
  toast('↩️ Objets réinitialisés aux défauts');
}

/** Enregistre la liste custom d'items d'un marchand. */
function saveMerchantItems() {
  var key = window._editMerchantItems.key;
  if (!DB.merchantItems) DB.merchantItems = {};
  DB.merchantItems[key] = Array.from(window._editMerchantItems.selected);
  save(); closeModal(); renderMerchantsPanel();
  toast('✅ Objets mis à jour !');
}

/**
 * Affiche le panneau des marchands avec leurs stocks générés aléatoirement.
 * Chaque marchand a un bouton de relance individuel et global.
 */
function renderMerchantsPanel() {
  const el = document.getElementById('inv-list');
  if (!el) return;

  el.innerHTML = `
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">
    <div style="color:var(--muted);font-size:13px">🧑‍🔧 ${Object.keys(getMerchantsAll()).length} marchand(s)</div>
    <div style="display:flex;gap:6px">
      <button class="btn btn-outline btn-sm" onclick="openMerchantModal()">+ Créer</button>
      <button class="btn btn-primary btn-sm" onclick="refreshMerchants()">🔄 Tout relancer</button>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:20px">
    ${Object.entries(getMerchantsAll()).map(([key, m]) => {
      const stock = generateMerchantStock(key);
      return `<div class="card" style="border-left:4px solid ${m.color}">
        <!-- En-tête du marchand -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
          <div style="width:48px;height:48px;background:${m.color}22;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:26px">${m.icon}</div>
          <div style="flex:1">
            <div style="font-family:'Cinzel',serif;font-weight:700;font-size:16px;color:var(--text)">${esc(m.name)}</div>
            <div style="color:${m.color};font-size:12px">${esc(m.desc)}</div>
          </div>
          <div style="display:flex;gap:4px">
            <button class="btn btn-ghost btn-xs" onclick="refreshMerchant('${key}')" title="Relancer ce marchand">🔄</button>
            <button class="btn btn-ghost btn-xs" onclick="openMerchantModal('${key}')" title="Modifier">✏️</button>
            <button class="btn btn-ghost btn-xs" onclick="openMerchantItemsModal('${key}')" title="Objets vendus">📦</button>
            <button class="btn btn-danger btn-xs" onclick="deleteMerchant('${key}')" title="Supprimer">🗑️</button>
          </div>
        </div>
        <!-- Stock généré aléatoirement -->
        ${stock.length===0
          ? `<div style="color:var(--dim);font-style:italic;font-size:12px">Rien à vendre aujourd'hui...</div>`
          : `<div style="display:grid;gap:6px">
              ${stock.map(item => {
                const rc = RARITY[item.rarity]?.col || '#9ca3af';
                // Indicateur de remise (<1×) ou majoration (>1×)
                const pctStr = item._mult < 1
                  ? `<span style="color:#22c55e;font-size:10px">−${Math.round((1-item._mult)*100)}%</span>`
                  : item._mult > 1
                    ? `<span style="color:#ef4444;font-size:10px">+${Math.round((item._mult-1)*100)}%</span>`
                    : '';
                return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface2);border-radius:8px;border:1px solid ${rc}22">
                  <span style="font-size:20px">${item.emoji||'📦'}</span>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:600;font-size:13px;color:var(--text)">${esc(item.name)}</div>
                    <div style="color:var(--dim);font-size:11px">${esc(item.category)} · ${badge(item.rarity)} · ×${item._qty}</div>
                  </div>
                  <div style="text-align:right">
                    <div style="color:var(--gold);font-weight:900;font-size:15px">${item._price} PO</div>
                    <div style="font-size:10px;color:var(--dim)">base ${item.price} PO ${pctStr}</div>
                  </div>
                  <button class="btn btn-primary btn-xs" onclick="buyFromMerchant('${key}','${esc(item.name)}',${item._price},${item._qty})">🛒</button>
                </div>`;
              }).join('')}
            </div>`}
      </div>`;
    }).join('')}
  </div>`;
}

/**
 * Ouvre la modale d'achat d'un objet chez un marchand.
 * L'achat peut être fait pour la guilde ou pour un membre spécifique.
 *
 * @param {string} merchantKey - clé du marchand
 * @param {string} itemName - nom de l'objet
 * @param {number} price - prix unitaire (modifié par le multiplicateur)
 * @param {number} maxQty - stock disponible
 */
function buyFromMerchant(merchantKey, itemName, price, maxQty) {
  const dbItem = ITEM_DATABASE.find(i => i.name===itemName && i.merchant===merchantKey);
  if (!dbItem) return;

  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:400px">
    <div class="modal-header"><span class="modal-title">🛒 Acheter : ${esc(itemName)}</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div style="background:var(--surface2);border-radius:8px;padding:12px;margin-bottom:14px;color:var(--muted);font-size:14px">
        Prix : <strong style="color:var(--gold)">${price} PO</strong> · Stock : ×${maxQty}
      </div>
      <div class="field"><label>Acheter pour</label>
        <select id="merch-buyer">
          <option value="guild">⚖️ Coffre de Guilde (${DB.wealth?.po||0} PO)</option>
          ${DB.members.map(m => `<option value="${m.id}">${m.avatar} ${esc(m.name)} — ${m.gold?.po||0} PO</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>Quantité (stock : ×${maxQty})</label>
        <input type="number" id="merch-qty" value="1" min="1" max="${maxQty}"
          oninput="document.getElementById('merch-total').textContent='Total : '+(+this.value||1)*${price}+' PO'">
      </div>
      <div id="merch-total" style="text-align:center;color:var(--gold);font-weight:900;font-size:16px;padding:6px;background:var(--surface2);border-radius:6px;margin-bottom:8px">
        Total : ${price} PO
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="execMerchantBuy('${esc(itemName)}',${price})">🛒 Acheter</button>
      </div>
    </div>
  </div>`);
}

/**
 * Exécute l'achat chez un marchand :
 *  - Débite la trésorerie de guilde (DB.wealth) ou la bourse du membre
 *  - Ajoute l'objet dans DB.guildInventory ou member.inventory
 *
 * @param {string} itemName - nom de l'objet
 * @param {number} price - prix unitaire (après modificateur)
 */
function execMerchantBuy(itemName, price) {
  const buyerVal = document.getElementById('merch-buyer').value;
  const qty      = +(document.getElementById('merch-qty')?.value || 1);
  const cost     = price * qty;
  const dbItem   = ITEM_DATABASE.find(i => i.name===itemName);
  if (!dbItem) return;

  const newItem = {
    id:uid(), name:dbItem.name, qty,
    category:dbItem.category, rarity:dbItem.rarity,
    description:dbItem.description, emoji:dbItem.emoji, icon:null
  };

  if (buyerVal==='guild') {
    // Achat pour le coffre de guilde — débite DB.wealth.po
    if (!DB.wealth) DB.wealth = {pp:0, po:0, pa:0, pc:0, lingots:0};
    if ((DB.wealth.po||0) < cost) { toast('💸 Pas assez de PO !'); return; }
    DB.wealth.po -= cost;
    const ex = DB.guildInventory.find(i => i.name===newItem.name);
    if (ex) ex.qty += qty; else DB.guildInventory.push(newItem);
  } else {
    // Achat pour un membre — débite member.gold.po
    const m = DB.members.find(x => x.id===+buyerVal);
    if (!m) { toast('Membre introuvable'); return; }
    if ((m.gold?.po||0) < cost) { toast(`💸 ${m.name} n'a pas assez de PO !`); return; }
    m.gold.po -= cost;
    if (!m.inventory) m.inventory = [];
    const ex = m.inventory.find(i => i.name===newItem.name);
    if (ex) ex.qty += qty; else m.inventory.push(newItem);
  }

  save(); closeModal(); renderMerchantsPanel(); updateStats();
  toast(`🛒 ×${qty} ${itemName} acheté pour ${cost} PO !`);
}


// ================================================================
// INVESTISSEMENTS — système 5d6 style Naheulbeuk
// ================================================================

/**
 * Table des résultats d'investissement (5d6 → résultat).
 * La plage 5-30 (min possible : 5×1, max : 5×6=30) est couverte.
 * Chaque entrée définit le pourcentage de gain/perte sur le capital.
 */
const INVEST_TABLE = [
  {min:5,  max:6,  pct:-20, label:'Catastrophe !',       icon:'💥', color:'#ef4444'},
  {min:7,  max:10, pct:-10, label:'Mauvais retour',       icon:'📉', color:'#f87171'},
  {min:11, max:12, pct:-5,  label:'Légère perte',         icon:'😰', color:'#fb923c'},
  {min:13, max:16, pct:0,   label:'Stagnation',           icon:'😐', color:'#9ca3af'},
  {min:17, max:20, pct:10,  label:'Bénéfice modeste',     icon:'📈', color:'#4ade80'},
  {min:21, max:24, pct:20,  label:'Bon investissement',   icon:'💰', color:'#22c55e'},
  {min:25, max:28, pct:30,  label:'Excellent !',          icon:'🤑', color:'#10b981'},
  {min:29, max:29, pct:50,  label:'Coup de génie !',      icon:'⚡', color:'#6366f1'},
  {min:30, max:30, pct:100, label:'JACKPOT !',            icon:'🎰', color:'#f59e0b'},
];

/**
 * Retourne la ligne de résultat correspondant à un jet 5d6.
 * Fallback sur la stagnation (pct:0) si hors plage (ne devrait pas arriver).
 *
 * @param {number} roll - somme des 5d6 (5–30)
 * @returns {object} entrée de INVEST_TABLE
 */
function getInvestResult(roll) {
  return INVEST_TABLE.find(r => roll >= r.min && roll <= r.max) || INVEST_TABLE[3];
}

/**
 * Lance 5d6, calcule le gain/perte sur le capital investi,
 * et enregistre le résultat dans l'historique.
 */
function rollInvestment() {
  const inv = DB.investments || (DB.investments = {capital:0, history:[]});
  if (!inv.capital || inv.capital <= 0) {
    toast('⚠️ Investissez d\'abord du capital !');
    return;
  }

  // Tirage de 5d6
  const dice   = Array.from({length:5}, () => 1 + Math.floor(Math.random()*6));
  const total  = dice.reduce((a, b) => a + b, 0);
  const result = getInvestResult(total);

  // Calcul du gain/perte (arrondi à l'entier)
  const gain = Math.round(inv.capital * result.pct / 100);

  inv.capital += gain;
  if (inv.capital < 0) inv.capital = 0; // plancher à 0

  // Historique (conserve les 50 derniers pour limiter la taille localStorage)
  inv.history.push({
    date: new Date().toLocaleDateString('fr-FR'),
    dice, total, pct:result.pct, gain,
    capitalAfter: inv.capital,
    label: result.label
  });
  if (inv.history.length > 50) inv.history.shift();

  save(); renderInvestPanel();
  toast(`${result.icon} ${result.label} (5d6 = ${total}) → ${gain>=0?'+':''}${gain} PO`);
}

/**
 * Transfère un montant de la trésorerie (DB.wealth.po) vers le capital investi.
 * Vérifie que la trésorerie a suffisamment de PO avant de débiter.
 */
function investCapital() {
  const amount = +(document.getElementById('invest-amount')?.value || 0);
  if (!amount || amount <= 0) { toast('Montant invalide'); return; }
  if (!DB.wealth) DB.wealth = {pp:0, po:0, pa:0, pc:0, lingots:0};
  if ((DB.wealth.po||0) < amount) { toast('💸 Pas assez de PO en trésorerie !'); return; }
  DB.wealth.po -= amount;
  if (!DB.investments) DB.investments = {capital:0, history:[]};
  DB.investments.capital += amount;
  save(); renderInvestPanel(); updateStats();
  toast(`⚙️ ${amount} PO investis !`);
}

/**
 * Retire un montant du capital investi et le reverse dans la trésorerie.
 * Vérifie que le capital est suffisant.
 */
function withdrawCapital() {
  const amount = +(document.getElementById('withdraw-amount')?.value || 0);
  const inv    = DB.investments || (DB.investments = {capital:0, history:[]});
  if (!amount || amount <= 0 || amount > inv.capital) { toast('Montant invalide'); return; }
  inv.capital -= amount;
  if (!DB.wealth) DB.wealth = {pp:0, po:0, pa:0, pc:0, lingots:0};
  DB.wealth.po = (DB.wealth.po||0) + amount;
  save(); renderInvestPanel(); updateStats();
  toast(`💰 ${amount} PO récupérés !`);
}

/**
 * Efface l'historique des placements sans toucher au capital.
 * Utile pour repartir d'une ardoise propre sur la courbe SVG.
 */
function resetInvestments() {
  if (!confirm('Réinitialiser le graphique et le journal des placements ?\nLe capital sera conservé.')) return;
  if (!DB.investments) DB.investments = {capital:0, history:[]};
  DB.investments.history = [];
  save(); renderInvestPanel();
  toast('🔄 Historique réinitialisé !');
}

/**
 * Affiche le panneau Investissement :
 *  - Carte steampunk avec capital et actions (investir/retirer/lancer)
 *  - Table des résultats 5d6
 *  - Courbe SVG d'évolution du capital
 *  - Journal des derniers placements
 */
function renderInvestPanel() {
  const el = document.getElementById('inv-list');
  if (!el) return;
  const inv = DB.investments || (DB.investments = {capital:0, history:[]});

  // ── Préparation de la courbe SVG ──
  const history = (inv.history||[]).slice(-20); // 20 derniers points max
  const cW = 600, cH = 160, pad = 30;

  // Points Y à tracer (capital après chaque placement)
  let pts = history.map(h => h.capitalAfter);
  if (pts.length < 2) pts = [inv.capital, inv.capital]; // ligne plate si pas d'historique

  const maxY = Math.max(...pts, 1);
  const minY = Math.min(...pts, 0);
  const rY   = maxY - minY || 1; // évite la division par zéro

  // Conversion capital → coordonnées SVG
  const coords = pts.map((v, i) => {
    const x = pad + i * (cW-2*pad) / (pts.length-1);
    const y = cH - pad - (v-minY)/rY * (cH-2*pad);
    return [x, y];
  });
  const poly = coords.map(c => c.join(',')).join(' ');
  // Zone remplie sous la courbe (aire)
  const area = `M${coords[0].join(',')} ${coords.map(c => 'L'+c.join(',')).join(' ')} `
    + `L${coords[coords.length-1][0]},${cH-pad} L${coords[0][0]},${cH-pad} Z`;

  el.innerHTML = `<div style="max-width:750px">

    <!-- ── Carte steampunk principale ── -->
    <div style="background:linear-gradient(135deg,#1a1207,#2d1f0e,#1a150d);border:2px solid #8b6914;border-radius:16px;padding:24px;margin-bottom:20px;position:relative;overflow:hidden">
      <!-- Motif de fond en quadrillage subtil -->
      <div style="position:absolute;inset:0;background:repeating-conic-gradient(#8b691406 0% 25%, transparent 0% 50%) 0 0/20px 20px;opacity:.4"></div>
      <div style="position:relative;display:flex;align-items:center;gap:20px">
        <div style="font-size:52px;text-shadow:0 0 20px #f59e0b55">⚙️</div>
        <div style="flex:1">
          <div style="font-family:'Cinzel',serif;font-size:22px;font-weight:900;color:#f59e0b;text-shadow:0 2px 4px #00000088;letter-spacing:.05em">BUREAU D'INVESTISSEMENT</div>
          <div style="color:#d4a853;font-size:12px;margin-top:4px;font-style:italic">« La Guilde Mécanique des Placements Hasardeux » — Système Naheulbeuk™</div>
        </div>
        <!-- Affichage du capital courant -->
        <div style="text-align:center;background:#0d0a0533;border:1px solid #8b691444;border-radius:12px;padding:14px 20px">
          <div style="font-size:10px;color:#d4a853;text-transform:uppercase;letter-spacing:.15em">Capital investi</div>
          <div style="font-family:'Cinzel',serif;font-size:32px;font-weight:900;color:#fbbf24;text-shadow:0 0 10px #f59e0b44">${(inv.capital||0).toLocaleString()}</div>
          <div style="font-size:11px;color:#d4a853">Pièces d'Or</div>
        </div>
      </div>
    </div>

    <!-- ── Actions (investir / retirer / lancer les dés) ── -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
      <!-- Investir depuis la trésorerie -->
      <div class="card" style="background:linear-gradient(135deg,#1a1207,#2d1f0e);border:1px solid #8b691444">
        <div style="font-size:10px;color:#d4a853;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">⬆️ Investir</div>
        <div style="display:flex;gap:6px">
          <input id="invest-amount" type="number" min="1" placeholder="PO"
            style="flex:1;background:#0d0a05;border:1px solid #8b691444;border-radius:6px;color:#fbbf24;padding:8px;font-family:'Cinzel',serif;font-size:14px">
          <button class="btn btn-primary btn-sm" onclick="investCapital()" style="background:#8b6914;border-color:#d4a853">⚙️</button>
        </div>
        <div style="font-size:10px;color:#8b6914;margin-top:4px">depuis la Trésorerie</div>
      </div>
      <!-- Retirer vers la trésorerie -->
      <div class="card" style="background:linear-gradient(135deg,#1a1207,#2d1f0e);border:1px solid #8b691444">
        <div style="font-size:10px;color:#d4a853;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">⬇️ Retirer</div>
        <div style="display:flex;gap:6px">
          <input id="withdraw-amount" type="number" min="1" max="${inv.capital}" placeholder="PO"
            style="flex:1;background:#0d0a05;border:1px solid #8b691444;border-radius:6px;color:#fbbf24;padding:8px;font-family:'Cinzel',serif;font-size:14px">
          <button class="btn btn-ghost btn-sm" onclick="withdrawCapital()" style="color:#d4a853;border-color:#8b691444">💰</button>
        </div>
        <div style="font-size:10px;color:#8b6914;margin-top:4px">vers la Trésorerie</div>
      </div>
      <!-- Lancer 5d6 -->
      <div class="card" style="background:linear-gradient(135deg,#0d1a07,#1a2d0e);border:1px solid #4ade8044;text-align:center;cursor:pointer"
        onclick="rollInvestment()">
        <div style="font-size:28px;margin-bottom:4px">🎲</div>
        <div style="font-family:'Cinzel',serif;font-size:14px;font-weight:700;color:#4ade80">LANCER 5d6</div>
        <div style="font-size:10px;color:#4ade8088;margin-top:2px">Générer de l'argent !</div>
      </div>
    </div>

    <!-- ── Table des résultats 5d6 ── -->
    <div class="card" style="background:linear-gradient(135deg,#1a1207,#2d1f0e);border:1px solid #8b691444;margin-bottom:20px">
      <div style="font-size:10px;color:#d4a853;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">📊 Table des Placements (5d6)</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">
        ${INVEST_TABLE.map(r => `
          <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:#0d0a0566;border-radius:4px;border:1px solid ${r.color}22">
            <span style="font-size:14px">${r.icon}</span>
            <span style="font-size:11px;color:#d4a853;min-width:36px">${r.min===r.max ? r.min : r.min+'–'+r.max}</span>
            <span style="font-size:11px;color:${r.color};font-weight:700">${r.pct>=0?'+':''}${r.pct}%</span>
          </div>`).join('')}
      </div>
    </div>

    <!-- ── Courbe d'évolution du capital (SVG) ── -->
    ${history.length > 0 ? `
    <div class="card" style="background:linear-gradient(135deg,#1a1207,#2d1f0e);border:1px solid #8b691444;margin-bottom:20px">
      <div style="font-size:10px;color:#d4a853;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">📈 Évolution du Capital</div>
      <svg viewBox="0 0 ${cW} ${cH}" style="width:100%;height:auto">
        <defs>
          <linearGradient id="investGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <!-- Aire sous la courbe -->
        <path d="${area}" fill="url(#investGrad)"/>
        <!-- Courbe principale -->
        <polyline points="${poly}" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linejoin="round"/>
        <!-- Points de données -->
        ${coords.map(c => `<circle cx="${c[0]}" cy="${c[1]}" r="3" fill="#fbbf24" stroke="#1a1207" stroke-width="1.5"/>`).join('')}
        <!-- Axe horizontal bas -->
        <line x1="${pad}" y1="${cH-pad}" x2="${cW-pad}" y2="${cH-pad}" stroke="#8b691444"/>
        <!-- Labels valeurs max/min -->
        <text x="${pad}" y="${pad-8}" fill="#d4a853" font-size="9">${maxY.toLocaleString()} PO</text>
        <text x="${pad}" y="${cH-pad+14}" fill="#8b6914" font-size="9">${minY.toLocaleString()} PO</text>
      </svg>
    </div>` : ''}

    <!-- ── Journal des placements ── -->
    ${history.length > 0 ? `
    <div class="card" style="background:linear-gradient(135deg,#1a1207,#2d1f0e);border:1px solid #8b691444">
      <div style="font-size:10px;color:#d4a853;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">📜 Journal des Placements</div>
      <button class="btn btn-danger btn-xs" onclick="resetInvestments()" style="float:right" title="Réinitialiser l'historique">🗑️ Reset</button>
      <div style="display:flex;flex-direction:column;gap:4px">
        ${history.slice().reverse().map(h => {
          const r = getInvestResult(h.total);
          return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#0d0a0566;border-radius:6px;border-left:3px solid ${r.color}">
            <span style="font-size:14px">${r.icon}</span>
            <span style="color:#8b6914;font-size:10px;min-width:64px">${h.date}</span>
            <span style="color:#d4a853;font-size:12px;min-width:80px">🎲 [${h.dice.join(',')}] = ${h.total}</span>
            <span style="color:${r.color};font-weight:700;font-size:12px;min-width:50px">${h.gain>=0?'+':''}${h.gain} PO</span>
            <span style="color:#8b6914;font-size:11px;flex:1">${r.label}</span>
            <span style="color:#fbbf24;font-size:11px">→ ${h.capitalAfter.toLocaleString()} PO</span>
          </div>`;
        }).join('')}
      </div>
    </div>` :
    '<div style="text-align:center;color:var(--dim);padding:30px;font-style:italic">Aucun placement. Investissez du capital puis lancez les dés !</div>'}
  </div>`;
}
