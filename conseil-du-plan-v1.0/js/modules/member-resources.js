/**
 * MODULE RESSOURCES AVENTURIER — Patch 4
 * ============================================================
 * Gère l'onglet "Ressources" de la fiche aventurier (onglet Résumé).
 *
 * TROIS TYPES DE RESSOURCES :
 *  - 'slot'   : emplacement de sort (cases cochables)
 *  - 'usage'  : capacité à utilisations limitées (boutons +/-)
 *  - 'custom' : ressource personnalisée libre (boutons +/-)
 *
 * RECHARGE :
 *  - 'long_rest'  : repos long (rechargé par doRest(id,'long'))
 *  - 'short_rest' : repos court (rechargé par doRest(id,'court'))
 *  - 'dawn'       : à l'aube (rechargé par repos long)
 *  - 'manual'     : jamais rechargé automatiquement
 *
 * PERSISTANCE :
 *  Les ressources sont stockées dans member.resources[] via DB.
 *  Chaque ressource : {id, name, icon, current, max, type, recharge, level?, color?}
 *
 * DÉPENDANCES :
 *  - utils.js   : esc(), uid()
 *  - db.js      : DB, save()
 *  - modal.js   : openModal(), closeModal()
 *  - toast.js   : toast()
 *  - aventuriers.js : renderMemberDetail(), selectedMemberId
 *
 * ORDRE DE CHARGEMENT : après aventuriers.js, avant init.js
 *
 * INTÉGRATION dans renderMemberSummary() (aventuriers.js) :
 *   Le panneau "⚡ Ressources" appelle déjà openAddResourceModal() et
 *   doRest() depuis db.js. Ce fichier ajoute renderResourcesPanel()
 *   pour un rendu autonome depuis l'onglet Résumé, et les fonctions
 *   spécifiques aux emplacements de sorts (toggleSpellSlot).
 *
 * HTML à ajouter dans l'onglet Résumé si un conteneur dédié est voulu :
 *   <div id="resources-panel-<memberId>"></div>
 *   Appeler renderResourcesPanel(memberId) au montage de l'onglet.
 */

// ================================================================
// LIBELLÉS DE RECHARGE — utilisés dans les badges UI
// ================================================================

/**
 * Correspondance clé de recharge → libellé affiché avec emoji.
 * Utilisé dans renderUsageResourceRow() et renderResourcesPanel().
 */
const RECHARGE_LABELS = {
  'long_rest':  '🌙 Long',
  'short_rest': '🌅 Court',
  'dawn':       '☀️ Aube',
  'manual':     '🔧 Manuel',
  // Compatibilité avec les anciennes valeurs de db.js
  'repos long':  '🌙 Long',
  'repos court': '🌅 Court',
  'quotidien':   '☀️ Aube',
  'manuel':      '🔧 Manuel',
};


// ================================================================
// RENDERRESOURCESPANEL — rendu autonome (Patch 4)
// ================================================================

/**
 * Affiche le panneau de ressources complet dans un conteneur identifié.
 * Cherche d'abord #resources-panel-<memberId>, puis #resources-panel.
 *
 * Le panneau contient :
 *  1. Boutons Repos court / Repos long
 *  2. Section "Emplacements de sorts" (type='slot', triés par niveau)
 *  3. Section "Capacités" (type='usage')
 *  4. Section "Autres" (type='custom')
 *  5. Boutons d'ajout
 *
 * @param {number} memberId - id du membre dans DB.members
 */
function renderResourcesPanel(memberId) {
  // Recherche du conteneur dans le DOM
  var container = document.getElementById('resources-panel-' + memberId);
  if (!container) container = document.getElementById('resources-panel');
  if (!container) return;

  var m = DB.members.find(function(x) { return x.id === memberId; });
  if (!m) { container.innerHTML = '<p style="color:var(--dim)">Aventurier non trouvé.</p>'; return; }
  if (!m.resources) m.resources = [];

  var html = '';

  // ── Boutons de repos ──────────────────────────────────────────
  html += '<div style="display:flex;gap:10px;margin-bottom:15px">';
  html += '<button class="btn btn-outline btn-sm" onclick="resourcesDoRest(' + memberId + ',\'court\')">';
  html += '🌅 Repos court</button>';
  html += '<button class="btn btn-outline btn-sm" onclick="resourcesDoRest(' + memberId + ',\'long\')">';
  html += '🌙 Repos long</button>';
  html += '</div>';

  // ── Section : Emplacements de sorts (type='slot') ─────────────
  var slots = m.resources.filter(function(r) { return r.type === 'slot'; });
  if (slots.length > 0) {
    // Trie par niveau croissant (undefined → fin)
    slots = slots.slice().sort(function(a, b) { return (a.level||0) - (b.level||0); });

    html += '<div class="card" style="margin-bottom:10px">';
    html += '<div style="font-size:10px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">✨ Emplacements de sorts</div>';

    slots.forEach(function(slot) {
      html += '<div style="display:flex;align-items:center;gap:10px;padding:5px 0">';
      // Label de niveau
      html += '<span style="min-width:64px;font-weight:600;font-size:13px;color:var(--text)">Niv. ' + (slot.level || '?') + '</span>';
      // Cases cochables (remplies = utilisées)
      html += '<div style="display:flex;gap:4px">';
      for (var i = 0; i < slot.max; i++) {
        var filled = i < slot.current;
        var col    = slot.color || 'var(--indigo)';
        var boxStyle = 'width:22px;height:22px;border-radius:4px;cursor:pointer;border:2px solid ' + col + ';';
        boxStyle += filled ? 'background:' + col + ';' : 'background:transparent;';
        // Clore la capture de i via data-attribute pour éviter le bug de closure dans la boucle
        html += '<div style="' + boxStyle + '"'
          + ' data-mid="' + memberId + '" data-rid="' + slot.id + '" data-idx="' + i + '"'
          + ' onclick="toggleSpellSlot(+this.dataset.mid, this.dataset.rid, +this.dataset.idx)"'
          + ' title="' + (filled ? 'Emplacement utilisé (clic pour libérer)' : 'Emplacement disponible (clic pour utiliser)') + '">'
          + '</div>';
      }
      html += '</div>';
      // Badge max
      html += '<span style="font-size:11px;color:var(--dim)">' + slot.current + '/' + slot.max + '</span>';
      // Bouton supprimer
      html += '<button onclick="resourcesRemove(' + memberId + ',\'' + slot.id + '\')"'
        + ' style="margin-left:auto;background:none;border:none;color:var(--dim);cursor:pointer;font-size:13px"'
        + ' title="Supprimer cet emplacement"'
        + ' onmouseover="this.style.color=\'var(--red)\'" onmouseout="this.style.color=\'var(--dim)\'">✕</button>';
      html += '</div>';
    });

    html += '</div>';
  }

  // ── Section : Capacités (type='usage') ───────────────────────
  var usages = m.resources.filter(function(r) { return r.type === 'usage'; });
  if (usages.length > 0) {
    html += '<div class="card" style="margin-bottom:10px">';
    html += '<div style="font-size:10px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">⚔️ Capacités</div>';
    usages.forEach(function(res) { html += renderUsageResourceRow(memberId, res); });
    html += '</div>';
  }

  // ── Section : Autres (type='custom' ou type non reconnu) ─────
  var customs = m.resources.filter(function(r) { return r.type !== 'slot' && r.type !== 'usage'; });
  if (customs.length > 0) {
    html += '<div class="card" style="margin-bottom:10px">';
    html += '<div style="font-size:10px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">📋 Autres ressources</div>';
    customs.forEach(function(res) { html += renderUsageResourceRow(memberId, res); });
    html += '</div>';
  }

  // ── Aucune ressource ──────────────────────────────────────────
  if (m.resources.length === 0) {
    html += '<div style="color:var(--dim);font-style:italic;font-size:13px;margin-bottom:14px">Aucune ressource. Ajoutez des emplacements de sorts ou des capacités.</div>';
  }

  // ── Boutons d'ajout ──────────────────────────────────────────
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">';
  html += '<button class="btn btn-outline btn-xs" onclick="showAddResourceModal(' + memberId + ',\'slot\')">+ Emplacement de sort</button>';
  html += '<button class="btn btn-outline btn-xs" onclick="showAddResourceModal(' + memberId + ',\'usage\')">+ Capacité</button>';
  html += '<button class="btn btn-ghost btn-xs" onclick="showAddResourceModal(' + memberId + ',\'custom\')">+ Autre</button>';
  html += '</div>';

  container.innerHTML = html;
}

/**
 * Génère une ligne HTML pour une ressource de type 'usage' ou 'custom'.
 * Affiche les boutons +/-, la barre de progression et le badge de recharge.
 *
 * @param {number} memberId - id du membre
 * @param {object} res      - ressource {id, name, icon, current, max, recharge, color?}
 * @returns {string} HTML de la ligne
 */
function renderUsageResourceRow(memberId, res) {
  var col = res.color || 'var(--indigo)';
  var rechargeLabel = RECHARGE_LABELS[res.recharge] || res.recharge || '';
  var pct = res.max > 0 ? Math.min(1, res.current / res.max) : 0;

  var html = '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">';

  // Icône + nom
  html += '<span style="font-size:18px">' + (res.icon || '⚡') + '</span>';
  html += '<span style="flex:1;font-size:13px;font-weight:600;color:var(--text)">' + esc(res.name) + '</span>';

  // Bouton −
  html += '<button onclick="resourcesAdjust(' + memberId + ',\'' + res.id + '\',-1)"'
    + ' style="width:26px;height:26px;border-radius:50%;background:' + col + '22;border:1px solid ' + col + '55;'
    + 'color:' + col + ';cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center"'
    + ' title="Utiliser une charge">−</button>';

  // Affichage current / max
  html += '<span style="min-width:52px;text-align:center;font-weight:700;font-size:14px;color:' + col + '">'
    + res.current + '/' + res.max + '</span>';

  // Bouton +
  html += '<button onclick="resourcesAdjust(' + memberId + ',\'' + res.id + '\',+1)"'
    + ' style="width:26px;height:26px;border-radius:50%;background:' + col + '22;border:1px solid ' + col + '55;'
    + 'color:' + col + ';cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center"'
    + ' title="Récupérer une charge">+</button>';

  // Badge de recharge
  html += '<span style="font-size:10px;color:var(--dim);min-width:60px;text-align:right">' + rechargeLabel + '</span>';

  // Bouton supprimer
  html += '<button onclick="resourcesRemove(' + memberId + ',\'' + res.id + '\')"'
    + ' style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:12px"'
    + ' onmouseover="this.style.color=\'var(--red)\'" onmouseout="this.style.color=\'var(--dim)\'"'
    + ' title="Supprimer cette ressource">✕</button>';

  html += '</div>';
  return html;
}


// ================================================================
// ACTIONS SUR LES RESSOURCES
// ================================================================

/**
 * Bascule un emplacement de sort (cochable → décoché, décoché → coché).
 *
 * Logique intuitive :
 *  - Clic sur une case REMPLIE (index < current) : décoche → current = index
 *  - Clic sur une case VIDE   (index >= current) : coche  → current = index + 1
 *
 * @param {number} memberId  - id du membre
 * @param {string} resourceId - id de la ressource
 * @param {number} slotIndex  - index 0-based de la case cliquée
 */
function toggleSpellSlot(memberId, resourceId, slotIndex) {
  var m = DB.members.find(function(x) { return x.id === memberId; });
  if (!m || !m.resources) return;
  var res = m.resources.find(function(r) { return r.id === resourceId; });
  if (!res) return;

  if (slotIndex < res.current) {
    // Case remplie → décoche jusqu'à slotIndex
    res.current = slotIndex;
  } else {
    // Case vide → coche jusqu'à slotIndex + 1
    res.current = slotIndex + 1;
  }

  save();
  // Re-render du panneau (préfère renderResourcesPanel si disponible)
  _refreshResourcesDisplay(memberId);
}

/**
 * Ajuste la valeur courante d'une ressource de ±delta.
 * Borne entre 0 et max.
 *
 * @param {number} memberId
 * @param {string} resourceId
 * @param {number} delta - +1 ou -1
 */
function resourcesAdjust(memberId, resourceId, delta) {
  var m = DB.members.find(function(x) { return x.id === memberId; });
  if (!m || !m.resources) return;
  var res = m.resources.find(function(r) { return r.id === resourceId; });
  if (!res) return;
  res.current = Math.max(0, Math.min(res.max, res.current + delta));
  save();
  _refreshResourcesDisplay(memberId);
}

/**
 * Supprime une ressource d'un membre.
 *
 * @param {number} memberId
 * @param {string} resourceId
 */
function resourcesRemove(memberId, resourceId) {
  var m = DB.members.find(function(x) { return x.id === memberId; });
  if (!m || !m.resources) return;
  m.resources = m.resources.filter(function(r) { return r.id !== resourceId; });
  save();
  _refreshResourcesDisplay(memberId);
}

/**
 * Applique un repos court ou long aux ressources d'un membre.
 *
 * - Repos court : recharge 'short_rest' et 'repos court'
 * - Repos long  : recharge tout sauf 'manual' et 'manuel'
 *
 * Appelle aussi doRest() de db.js pour le re-render du panneau inline
 * dans renderMemberSummary si l'onglet Résumé est actif.
 *
 * @param {number} memberId
 * @param {'court'|'long'} type
 */
function resourcesDoRest(memberId, type) {
  var m = DB.members.find(function(x) { return x.id === memberId; });
  if (!m || !m.resources) return;

  m.resources.forEach(function(res) {
    if (type === 'long') {
      // Tout sauf manuel
      if (res.recharge !== 'manual' && res.recharge !== 'manuel') {
        res.current = res.max;
      }
    } else {
      // Repos court : recharge uniquement les ressources "repos court"
      if (res.recharge === 'short_rest' || res.recharge === 'repos court') {
        res.current = res.max;
      }
    }
  });

  save();
  _refreshResourcesDisplay(memberId);
  toast(type === 'long' ? '🌙 Repos long — tout rechargé !' : '🌅 Repos court effectué !');
}

/**
 * Met à jour l'affichage des ressources sans re-render complet de la fiche.
 * Cherche d'abord le conteneur renderResourcesPanel, sinon re-render
 * l'onglet Résumé complet (fallback).
 *
 * @param {number} memberId
 */
function _refreshResourcesDisplay(memberId) {
  // Priorité : conteneur autonome du panneau ressources
  var panel = document.getElementById('resources-panel-' + memberId)
           || document.getElementById('resources-panel');
  if (panel) {
    renderResourcesPanel(memberId);
    return;
  }
  // Fallback : re-render de l'onglet Résumé complet
  var m = DB.members.find(function(x) { return x.id === memberId; });
  if (!m) return;
  var content = document.getElementById('member-detail-content');
  if (content && window._memberDetailTab === 0) {
    content.innerHTML = renderMemberSummary(m);
  }
}


// ================================================================
// MODALE D'AJOUT DE RESSOURCE
// ================================================================

/**
 * Ouvre la modale d'ajout d'une ressource selon son type.
 *
 * @param {number} memberId
 * @param {'slot'|'usage'|'custom'} type
 */
function showAddResourceModal(memberId, type) {
  var titles = {
    slot:   '✨ Emplacement de sort',
    usage:  '⚔️ Ajouter une capacité',
    custom: '📋 Ajouter une ressource',
  };
  var title = titles[type] || 'Ajouter une ressource';

  var html = '<div class="modal" onclick="event.stopPropagation()" style="max-width:400px">'
    + '<div class="modal-header">'
    + '<span class="modal-title">' + title + '</span>'
    + '<button class="modal-close" onclick="closeModal()">✕</button>'
    + '</div>'
    + '<div class="modal-body">'
    + '<div style="display:flex;flex-direction:column;gap:12px">';

  if (type === 'slot') {
    // ── Formulaire emplacement de sort ──
    html += '<div class="field"><label>Niveau du sort</label>'
      + '<select id="res-level" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px">';
    for (var lvl = 1; lvl <= 9; lvl++) {
      html += '<option value="' + lvl + '">Niveau ' + lvl + '</option>';
    }
    html += '</select></div>';
    html += '<div class="field"><label>Nombre d\'emplacements</label>'
      + '<input type="number" id="res-max" value="2" min="1" max="10"'
      + ' style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px"></div>';
  } else {
    // ── Formulaire capacité / ressource custom ──
    html += '<div class="field"><label>Nom</label>'
      + '<input type="text" id="res-name" placeholder="Ex: Rage, Inspiration bardique, Points de Ki…"'
      + ' style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px"></div>';

    html += '<div class="field"><label>Icône (emoji)</label>'
      + '<input type="text" id="res-icon" value="⚡" maxlength="4"'
      + ' style="width:80px;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px;text-align:center;font-size:20px"></div>';

    html += '<div class="field"><label>Utilisations max</label>'
      + '<input type="number" id="res-max" value="3" min="1" max="99"'
      + ' style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px"></div>';

    html += '<div class="field"><label>Récupération</label>'
      + '<select id="res-recharge" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px">'
      + '<option value="long_rest">🌙 Repos long</option>'
      + '<option value="short_rest">🌅 Repos court</option>'
      + '<option value="dawn">☀️ À l\'aube</option>'
      + '<option value="manual">🔧 Manuel (jamais automatique)</option>'
      + '</select></div>';

    html += '<div class="field"><label>Couleur</label>'
      + '<input type="color" id="res-color" value="#6366f1"'
      + ' style="width:60px;height:38px;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;cursor:pointer"></div>';
  }

  html += '</div>'; // flex column
  html += '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">';
  html += '<button class="btn btn-ghost" onclick="closeModal()">Annuler</button>';
  html += '<button class="btn btn-primary" onclick="confirmAddResource(' + memberId + ',\'' + type + '\')">Ajouter</button>';
  html += '</div>';
  html += '</div></div>'; // modal-body + modal

  openModal(html);
}

/**
 * Valide et enregistre la ressource depuis la modale d'ajout.
 * Lit les valeurs des champs de la modale, construit l'objet
 * ressource normalisé, le pousse dans member.resources et sauvegarde.
 *
 * @param {number} memberId
 * @param {'slot'|'usage'|'custom'} type
 */
function confirmAddResource(memberId, type) {
  var m = DB.members.find(function(x) { return x.id === memberId; });
  if (!m) return;
  if (!m.resources) m.resources = [];

  var newResource;

  if (type === 'slot') {
    // Emplacement de sort
    var levelEl = document.getElementById('res-level');
    var maxEl   = document.getElementById('res-max');
    var level   = levelEl ? +levelEl.value : 1;
    var maxVal  = maxEl   ? +maxEl.value   : 2;
    if (!maxVal || maxVal < 1) { toast('Nombre d\'emplacements invalide'); return; }

    newResource = {
      id:       uid(),
      name:     'Sorts Niv. ' + level,
      icon:     '✨',
      type:     'slot',
      level:    level,
      current:  maxVal,  // tous disponibles au départ
      max:      maxVal,
      recharge: 'long_rest',
      color:    '#a78bfa',
    };
  } else {
    // Capacité ou ressource custom
    var nameEl     = document.getElementById('res-name');
    var iconEl     = document.getElementById('res-icon');
    var maxEl2     = document.getElementById('res-max');
    var rechargeEl = document.getElementById('res-recharge');
    var colorEl    = document.getElementById('res-color');

    var name = nameEl ? nameEl.value.trim() : '';
    if (!name) { toast('Un nom est requis'); return; }

    var maxVal2 = maxEl2 ? +maxEl2.value : 3;
    if (!maxVal2 || maxVal2 < 1) { toast('Max invalide'); return; }

    newResource = {
      id:       uid(),
      name:     name,
      icon:     iconEl     ? (iconEl.value.trim()     || '⚡') : '⚡',
      type:     type,
      current:  maxVal2,
      max:      maxVal2,
      recharge: rechargeEl ? rechargeEl.value          : 'long_rest',
      color:    colorEl    ? colorEl.value             : '#6366f1',
    };
  }

  m.resources.push(newResource);
  save();
  closeModal();
  _refreshResourcesDisplay(memberId);
  toast('⚡ Ressource ajoutée !');
}
