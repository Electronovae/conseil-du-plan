# Patches V7.6 → V8.0 — Guide d'application manuelle

## Comment utiliser ce document

Chaque patch ci-dessous indique :
- **CHERCHER** : le code à trouver dans le HTML (utilise Ctrl+F)
- **REMPLACER PAR** : le nouveau code
- **VÉRIFIER** : ce qu'il faut tester après

---

## PATCH 1 — Fusion "Fond Commun" dans Trésorerie

### Problème
L'onglet "Fond commun" dans "Banque de guilde" fait doublon avec la trésorerie.

### Solution
Supprimer l'onglet "Fond commun" comme onglet séparé et intégrer son contenu
directement dans la vue Trésorerie, comme une section "Fond commun de guilde".

### Étapes

**1a.** Supprimer le bouton d'onglet "Fond commun" dans les tabs de la banque.
CHERCHER le HTML du bouton de tab (ressemble à) :
```html
<button class="tab-btn" onclick="showBankTab('fond-commun')">Fond commun</button>
```
→ SUPPRIMER cette ligne.

**1b.** Déplacer le contenu du div fond-commun dans la section trésorerie.
CHERCHER :
```html
<div id="tab-fond-commun" class="tab-content">
```
→ Couper TOUT le contenu de ce div.
→ Le coller à la fin du div `tab-tresorerie`, dans une section séparée :
```html
<!-- Section Fond Commun (intégrée à la trésorerie) -->
<div class="fond-commun-section" style="margin-top:20px; border-top:2px solid var(--border); padding-top:15px;">
    <h3 style="display:flex; align-items:center; gap:10px;">
        <span>💰</span> Fond Commun de Guilde
    </h3>
    <!-- COLLER ICI le contenu de l'ancien tab fond-commun -->
</div>
```

**1c.** Supprimer le div `tab-fond-commun` vide restant.

**1d.** Dans le JS, chercher la fonction `showBankTab` et retirer 'fond-commun'
des onglets gérés (ou supprimer la fonction si elle ne sert plus qu'à ça).

### Vérifier
- La trésorerie affiche le solde + le fond commun dans la même vue
- Les opérations de versement/retrait du fond commun fonctionnent toujours
- Il n'y a plus d'onglet "Fond commun" séparé

---

## PATCH 2 — Format d'objet unifié + Drag & Drop sans artefacts

### Problème
Les objets n'ont pas un format cohérent entre modules, et le drag & drop
crée des artefacts visuels (éléments dupliqués, éléments fantômes).

### Solution en 2 parties

### 2a. Format unifié

Partout où un objet est créé (inventaire, marchands, loot), normaliser :

CHERCHER chaque création d'objet (pattern type) :
```javascript
var item = {
    name: ...,
    // format variable selon les endroits
};
```

REMPLACER PAR (utiliser cette fonction de normalisation) :
```javascript
/**
 * Normalise un objet au format standard.
 * Appeler cette fonction à CHAQUE création/import d'objet.
 */
function normalizeItem(raw) {
    return {
        id: raw.id || ('item_' + Date.now() + '_' + Math.random().toString(36).substr(2,4)),
        name: raw.name || raw.nom || 'Objet sans nom',
        type: raw.type || 'divers',
        rarity: raw.rarity || raw.rarete || 'commun',
        weight: parseFloat(raw.weight || raw.poids || 0),
        value: parseInt(raw.value || raw.prix || raw.valeur || 0, 10),
        quantity: parseInt(raw.quantity || raw.quantite || raw.qty || 1, 10),
        description: raw.description || raw.desc || '',
        properties: Array.isArray(raw.properties) ? raw.properties : [],
        equipped: !!raw.equipped,
        attuned: !!raw.attuned
    };
}
```

Placer cette fonction dans `core/utils.js` (ou en haut du JS avant les modules).

### 2b. Drag & Drop corrigé

CHERCHER les handlers de drag existants. Ils ressemblent probablement à :
```javascript
element.draggable = true;
element.addEventListener('dragstart', function(e) {
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    // ou e.dataTransfer.setData('text', ...)
});
```

REMPLACER PAR ce système propre basé sur les IDs :
```javascript
// === SYSTÈME DRAG & DROP UNIFIÉ ===
// Stocke uniquement l'ID de l'objet, jamais le HTML.
// Le drop déplace l'objet dans le MODÈLE DE DONNÉES puis re-render.

var DragDrop = {
    /** ID de l'objet en cours de drag */
    _draggedItemId: null,
    /** Source du drag (ex: 'inventaire', 'marchand', 'loot') */
    _dragSource: null,

    /**
     * Rend un élément draggable.
     * @param {HTMLElement} el - L'élément DOM
     * @param {string} itemId - L'ID unique de l'objet
     * @param {string} source - Le module source ('inventaire', 'marchand', etc.)
     */
    makeDraggable: function(el, itemId, source) {
        el.draggable = true;
        el.dataset.itemId = itemId;
        
        el.addEventListener('dragstart', function(e) {
            DragDrop._draggedItemId = itemId;
            DragDrop._dragSource = source;
            // Stocke l'ID dans dataTransfer (pour compat cross-browser)
            e.dataTransfer.setData('text/plain', itemId);
            e.dataTransfer.effectAllowed = 'move';
            // Style visuel
            el.classList.add('dragging');
            // Empêche le click event de se déclencher
            e.stopPropagation();
        });
        
        el.addEventListener('dragend', function(e) {
            el.classList.remove('dragging');
            DragDrop._draggedItemId = null;
            DragDrop._dragSource = null;
            // Nettoie tous les indicateurs visuels
            document.querySelectorAll('.drag-over').forEach(function(el) {
                el.classList.remove('drag-over');
            });
        });
    },

    /**
     * Rend un conteneur droppable.
     * @param {HTMLElement} container - Le conteneur
     * @param {string} target - Le module cible ('inventaire', 'marchand', etc.)
     * @param {function} onDrop - Callback(itemId, source, target) appelé au drop
     */
    makeDropZone: function(container, target, onDrop) {
        container.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            container.classList.add('drag-over');
        });
        
        container.addEventListener('dragleave', function(e) {
            // Vérifie qu'on quitte vraiment le conteneur (pas un enfant)
            if (!container.contains(e.relatedTarget)) {
                container.classList.remove('drag-over');
            }
        });
        
        container.addEventListener('drop', function(e) {
            e.preventDefault();
            container.classList.remove('drag-over');
            
            var itemId = e.dataTransfer.getData('text/plain') || DragDrop._draggedItemId;
            if (!itemId) return;
            
            var source = DragDrop._dragSource;
            if (source === target) return; // Pas de drop sur soi-même
            
            // Appelle le callback — c'est LUI qui modifie les données et re-render
            if (typeof onDrop === 'function') {
                onDrop(itemId, source, target);
            }
            
            DragDrop._draggedItemId = null;
            DragDrop._dragSource = null;
        });
    }
};

// Exporte globalement
window.DragDrop = DragDrop;
```

CSS à ajouter :
```css
/* Drag & Drop */
.dragging {
    opacity: 0.4;
    transform: scale(0.95);
    transition: all 0.15s ease;
}
.drag-over {
    outline: 2px dashed var(--accent, #c8a455);
    outline-offset: 4px;
    background: rgba(200,164,85,0.05);
}
```

### Vérifier
- Drag un objet d'un inventaire à un autre : pas de duplication
- Click sur un objet : pas d'artefact visuel
- Le drag & drop ne se déclenche pas sur un simple click

---

## PATCH 3 — Import Bestiaire : Langues et FP

### Problème
L'import AideDD ne parse pas correctement les langues et le facteur de puissance.

### 3a. Facteur de puissance

CHERCHER la fonction qui parse le FP (probablement dans le bloc Bestiaire).
Elle ressemble peut-être à :
```javascript
// Cherche un truc comme :
cr = parseInt(someText);
// ou
cr = parseFloat(someText);
```

REMPLACER le parsing du FP par :
```javascript
/**
 * Parse le facteur de puissance depuis du texte AideDD.
 * Gère : "1/8", "1/4", "1/2", "0", "1", "2", ..., "30"
 * Retourne un nombre (0.125, 0.25, 0.5, 0, 1, 2, etc.)
 */
function parseChallengeRating(text) {
    if (!text) return 0;
    // Nettoie
    var cleaned = text.toString().trim();
    
    // Pattern : cherche "FP X" ou "Puissance X" ou juste un nombre/fraction
    var fpMatch = cleaned.match(/(?:FP|Puissance|CR|Challenge)\s*[:\-–]?\s*([\d]+\s*\/\s*[\d]+|[\d]+)/i);
    if (fpMatch) {
        cleaned = fpMatch[1].trim();
    }
    
    // Fraction ?
    var fracMatch = cleaned.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (fracMatch) {
        var num = parseInt(fracMatch[1], 10);
        var den = parseInt(fracMatch[2], 10);
        return den > 0 ? num / den : 0;
    }
    
    // Nombre entier ou décimal
    var val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
}
```

### 3b. Langues

CHERCHER le parsing des langues. Ça ressemble probablement à :
```javascript
languages = someText.split(',');
// ou rien du tout (langues ignorées)
```

REMPLACER PAR :
```javascript
/**
 * Parse les langues d'un monstre depuis le texte AideDD.
 * Gère : "commun, elfique, sylvestre", "—", "aucune",
 *         "commun (ne peut pas parler)", "télépathie 36 m", etc.
 */
function parseMonsterLanguages(text) {
    if (!text) return [];
    
    var cleaned = text.trim();
    
    // Cherche la ligne "Langues ..." dans un bloc de texte
    var langMatch = cleaned.match(/Langues?\s*[:\-–—]?\s*(.+?)(?:\n|Sens\s|Puissance|FP|$)/is);
    if (langMatch) {
        cleaned = langMatch[1].trim();
    }
    
    // Pas de langues
    if (cleaned === '—' || cleaned === '-' || cleaned === '–' ||
        cleaned.toLowerCase() === 'aucune' || cleaned === '') {
        return [];
    }
    
    // Sépare par virgule MAIS préserve les parenthèses
    // Ex: "commun (ne peut pas parler), draconique" → ["commun (ne peut pas parler)", "draconique"]
    var langs = [];
    var current = '';
    var depth = 0;
    for (var i = 0; i < cleaned.length; i++) {
        var ch = cleaned[i];
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        else if (ch === ',' && depth === 0) {
            var trimmed = current.trim();
            if (trimmed) langs.push(trimmed);
            current = '';
            continue;
        }
        current += ch;
    }
    var last = current.trim();
    if (last) langs.push(last);
    
    return langs;
}
```

### Intégration dans l'import

Là où les monstres sont importés depuis AideDD, utiliser ces fonctions :
```javascript
// Dans la boucle d'import des monstres :
monster.cr = parseChallengeRating(rawMonsterData.cr || rawMonsterData.fp || rawMonsterData.puissance);
monster.languages = parseMonsterLanguages(rawMonsterData.languages || rawMonsterData.langues);
```

### Vérifier
- Importer un monstre avec FP 1/4 → affiche "FP 1/4" et la valeur numérique 0.25
- Importer un monstre avec FP 12 → affiche "FP 12"
- Langues "commun, draconique" → tableau de 2 éléments
- Langues "—" → tableau vide
- Langues "commun (ne peut pas parler), télépathie 36 m" → 2 éléments avec parenthèses préservées

---

## PATCH 4 — Ressources Aventurier (onglet Résumé)

### Problème
La fonctionnalité "Ressources" dans l'onglet Résumé de la page Aventurier ne fonctionne pas.

### Solution complète

CHERCHER la section "ressources" dans le module Aventurier JS.
Elle est probablement cassée ou incomplète.

REMPLACER par ce système complet. Le code est prêt à copier :

```javascript
// =============================================
// RESSOURCES — Onglet Résumé Aventurier
// =============================================

/**
 * Initialise les ressources d'un aventurier si absent.
 * À appeler au chargement de chaque aventurier.
 */
function initResources(adventurer) {
    if (!adventurer.resources) {
        adventurer.resources = [];
    }
    return adventurer;
}

/**
 * Ajoute une ressource à un aventurier.
 * @param {string} adventurerId
 * @param {object} resourceData - {name, max, type, recharge, level}
 */
function addResource(adventurerId, resourceData) {
    var adv = DB.getAdventurer(adventurerId);
    if (!adv) return;
    initResources(adv);
    
    var resource = {
        id: 'res_' + Date.now() + '_' + Math.random().toString(36).substr(2,4),
        name: resourceData.name || 'Nouvelle ressource',
        current: parseInt(resourceData.max, 10) || 1,
        max: parseInt(resourceData.max, 10) || 1,
        type: resourceData.type || 'usage',      // 'usage' | 'slot' | 'custom'
        recharge: resourceData.recharge || 'long_rest', // 'short_rest' | 'long_rest' | 'dawn' | 'manual'
        level: resourceData.level || null         // Niveau du sort (1-9) si type=slot
    };
    
    adv.resources.push(resource);
    DB.saveAdventurer(adv);
    renderResourcesPanel(adventurerId);
}

/**
 * Supprime une ressource.
 */
function removeResource(adventurerId, resourceId) {
    var adv = DB.getAdventurer(adventurerId);
    if (!adv || !adv.resources) return;
    
    adv.resources = adv.resources.filter(function(r) {
        return r.id !== resourceId;
    });
    DB.saveAdventurer(adv);
    renderResourcesPanel(adventurerId);
}

/**
 * Modifie la valeur courante d'une ressource.
 * @param {string} adventurerId
 * @param {string} resourceId
 * @param {number} delta - +1 ou -1
 */
function adjustResource(adventurerId, resourceId, delta) {
    var adv = DB.getAdventurer(adventurerId);
    if (!adv || !adv.resources) return;
    
    var res = adv.resources.find(function(r) { return r.id === resourceId; });
    if (!res) return;
    
    res.current = Math.max(0, Math.min(res.max, res.current + delta));
    DB.saveAdventurer(adv);
    renderResourcesPanel(adventurerId);
}

/**
 * Toggle un emplacement de sort (case à cocher).
 */
function toggleSlot(adventurerId, resourceId, slotIndex) {
    var adv = DB.getAdventurer(adventurerId);
    if (!adv || !adv.resources) return;
    
    var res = adv.resources.find(function(r) { return r.id === resourceId; });
    if (!res) return;
    
    // Si on clique sur une case cochée → décoche (et toutes après)
    // Si on clique sur une case décochée → coche (et toutes avant)
    if (slotIndex < res.current) {
        // Décoche : current = slotIndex
        res.current = slotIndex;
    } else {
        // Coche : current = slotIndex + 1
        res.current = slotIndex + 1;
    }
    
    DB.saveAdventurer(adv);
    renderResourcesPanel(adventurerId);
}

/**
 * Repos court : recharge les ressources 'short_rest' et 'long_rest' ne bouge pas.
 */
function shortRest(adventurerId) {
    var adv = DB.getAdventurer(adventurerId);
    if (!adv || !adv.resources) return;
    
    adv.resources.forEach(function(res) {
        if (res.recharge === 'short_rest') {
            res.current = res.max;
        }
    });
    DB.saveAdventurer(adv);
    renderResourcesPanel(adventurerId);
}

/**
 * Repos long : recharge TOUTES les ressources sauf 'manual'.
 */
function longRest(adventurerId) {
    var adv = DB.getAdventurer(adventurerId);
    if (!adv || !adv.resources) return;
    
    adv.resources.forEach(function(res) {
        if (res.recharge !== 'manual') {
            res.current = res.max;
        }
    });
    DB.saveAdventurer(adv);
    renderResourcesPanel(adventurerId);
}

/**
 * Affiche le panneau de ressources complet dans l'onglet Résumé.
 * @param {string} adventurerId
 */
function renderResourcesPanel(adventurerId) {
    var container = document.getElementById('resources-panel-' + adventurerId);
    if (!container) {
        // Essaie le conteneur générique
        container = document.getElementById('resources-panel');
    }
    if (!container) return;
    
    var adv = DB.getAdventurer(adventurerId);
    if (!adv) { container.innerHTML = '<p>Aventurier non trouvé</p>'; return; }
    initResources(adv);
    
    var html = '';
    
    // === Boutons Repos ===
    html += '<div class="resources-actions" style="display:flex;gap:10px;margin-bottom:15px;">';
    html += '<button class="btn-secondary" onclick="shortRest(\'' + adventurerId + '\')">';
    html += '🌅 Repos court</button>';
    html += '<button class="btn-secondary" onclick="longRest(\'' + adventurerId + '\')">';
    html += '🌙 Repos long</button>';
    html += '</div>';
    
    // === Emplacements de sorts ===
    var slots = adv.resources.filter(function(r) { return r.type === 'slot'; });
    if (slots.length > 0) {
        slots.sort(function(a, b) { return (a.level || 0) - (b.level || 0); });
        html += '<div class="resource-group">';
        html += '<h4 style="margin:10px 0 5px;color:var(--accent,#c8a455);">✨ Emplacements de sorts</h4>';
        slots.forEach(function(slot) {
            html += '<div class="resource-row" style="display:flex;align-items:center;gap:10px;padding:5px 0;">';
            html += '<span style="min-width:60px;font-weight:500;">Niv. ' + (slot.level || '?') + '</span>';
            html += '<div style="display:flex;gap:4px;">';
            for (var i = 0; i < slot.max; i++) {
                var filled = i < slot.current;
                var style = 'width:22px;height:22px;border-radius:4px;cursor:pointer;border:2px solid var(--accent,#c8a455);';
                style += filled ? 'background:var(--accent,#c8a455);' : 'background:transparent;';
                html += '<div style="' + style + '"';
                html += ' onclick="toggleSlot(\'' + adventurerId + '\',\'' + slot.id + '\',' + i + ')"';
                html += ' title="' + (filled ? 'Utilisé' : 'Disponible') + '"></div>';
            }
            html += '</div>';
            // Bouton supprimer
            html += '<button onclick="removeResource(\'' + adventurerId + '\',\'' + slot.id + '\')"';
            html += ' style="margin-left:auto;background:none;border:none;color:#c44;cursor:pointer;font-size:14px;">✕</button>';
            html += '</div>';
        });
        html += '</div>';
    }
    
    // === Capacités à usage limité ===
    var usages = adv.resources.filter(function(r) { return r.type === 'usage'; });
    if (usages.length > 0) {
        html += '<div class="resource-group">';
        html += '<h4 style="margin:15px 0 5px;color:var(--accent,#c8a455);">⚔️ Capacités</h4>';
        usages.forEach(function(res) {
            html += renderUsageRow(adventurerId, res);
        });
        html += '</div>';
    }
    
    // === Ressources custom ===
    var customs = adv.resources.filter(function(r) { return r.type === 'custom'; });
    if (customs.length > 0) {
        html += '<div class="resource-group">';
        html += '<h4 style="margin:15px 0 5px;color:var(--accent,#c8a455);">📋 Autres</h4>';
        customs.forEach(function(res) {
            html += renderUsageRow(adventurerId, res);
        });
        html += '</div>';
    }
    
    // === Bouton Ajouter ===
    html += '<div style="margin-top:15px;display:flex;gap:8px;flex-wrap:wrap;">';
    html += '<button class="btn-primary" onclick="showAddResourceModal(\'' + adventurerId + '\',\'slot\')">';
    html += '+ Emplacement de sort</button>';
    html += '<button class="btn-primary" onclick="showAddResourceModal(\'' + adventurerId + '\',\'usage\')">';
    html += '+ Capacité</button>';
    html += '<button class="btn-primary" onclick="showAddResourceModal(\'' + adventurerId + '\',\'custom\')">';
    html += '+ Autre ressource</button>';
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * Affiche une ligne de capacité avec boutons +/-.
 */
function renderUsageRow(adventurerId, res) {
    var rechargeLabels = {
        'short_rest': '🌅 Court',
        'long_rest': '🌙 Long',
        'dawn': '☀️ Aube',
        'manual': '🔧 Manuel'
    };
    
    var html = '<div class="resource-row" style="display:flex;align-items:center;gap:10px;padding:5px 0;">';
    html += '<span style="min-width:120px;font-weight:500;">' + res.name + '</span>';
    
    // Boutons +/-
    html += '<div style="display:flex;align-items:center;gap:6px;">';
    html += '<button onclick="adjustResource(\'' + adventurerId + '\',\'' + res.id + '\',-1)"';
    html += ' style="width:28px;height:28px;border-radius:4px;border:1px solid var(--border);cursor:pointer;font-size:16px;">−</button>';
    html += '<span style="min-width:50px;text-align:center;font-weight:bold;">';
    html += res.current + ' / ' + res.max + '</span>';
    html += '<button onclick="adjustResource(\'' + adventurerId + '\',\'' + res.id + '\',1)"';
    html += ' style="width:28px;height:28px;border-radius:4px;border:1px solid var(--border);cursor:pointer;font-size:16px;">+</button>';
    html += '</div>';
    
    // Badge recharge
    html += '<span style="font-size:12px;opacity:0.7;">' + (rechargeLabels[res.recharge] || '') + '</span>';
    
    // Bouton supprimer
    html += '<button onclick="removeResource(\'' + adventurerId + '\',\'' + res.id + '\')"';
    html += ' style="margin-left:auto;background:none;border:none;color:#c44;cursor:pointer;font-size:14px;">✕</button>';
    html += '</div>';
    
    return html;
}

/**
 * Modale d'ajout de ressource.
 */
function showAddResourceModal(adventurerId, type) {
    var title = type === 'slot' ? 'Ajouter un emplacement de sort' :
                type === 'usage' ? 'Ajouter une capacité' :
                'Ajouter une ressource';
    
    var html = '<div style="display:flex;flex-direction:column;gap:12px;padding:15px;">';
    
    if (type === 'slot') {
        html += '<label>Niveau du sort :';
        html += '<select id="res-level">';
        for (var i = 1; i <= 9; i++) {
            html += '<option value="' + i + '">Niveau ' + i + '</option>';
        }
        html += '</select></label>';
        html += '<label>Nombre d\'emplacements :';
        html += '<input type="number" id="res-max" value="2" min="1" max="10"></label>';
    } else {
        html += '<label>Nom :';
        html += '<input type="text" id="res-name" placeholder="Ex: Rage, Inspiration bardique..."></label>';
        html += '<label>Utilisations max :';
        html += '<input type="number" id="res-max" value="3" min="1" max="99"></label>';
        html += '<label>Récupération :';
        html += '<select id="res-recharge">';
        html += '<option value="long_rest">Repos long</option>';
        html += '<option value="short_rest">Repos court</option>';
        html += '<option value="dawn">À l\'aube</option>';
        html += '<option value="manual">Manuel</option>';
        html += '</select></label>';
    }
    
    html += '<button class="btn-primary" onclick="confirmAddResource(\'' + adventurerId + '\',\'' + type + '\')">Ajouter</button>';
    html += '</div>';
    
    // Utilise ton système de modale existant :
    showModal(title, html);
}

/**
 * Confirme l'ajout de ressource depuis la modale.
 */
function confirmAddResource(adventurerId, type) {
    var data = { type: type };
    
    if (type === 'slot') {
        var levelEl = document.getElementById('res-level');
        var maxEl = document.getElementById('res-max');
        data.name = 'Sort Niv. ' + (levelEl ? levelEl.value : '1');
        data.level = parseInt(levelEl ? levelEl.value : '1', 10);
        data.max = parseInt(maxEl ? maxEl.value : '2', 10);
        data.recharge = 'long_rest';
    } else {
        var nameEl = document.getElementById('res-name');
        var maxEl2 = document.getElementById('res-max');
        var rechargeEl = document.getElementById('res-recharge');
        data.name = nameEl ? nameEl.value : 'Ressource';
        data.max = parseInt(maxEl2 ? maxEl2.value : '3', 10);
        data.recharge = rechargeEl ? rechargeEl.value : 'long_rest';
    }
    
    addResource(adventurerId, data);
    closeModal(); // Utilise ta fonction de fermeture de modale
}
```

### HTML à ajouter dans l'onglet Résumé

Dans le template HTML de l'onglet Résumé de chaque aventurier, ajouter :
```html
<div id="resources-panel" class="resources-panel">
    <!-- Rendu dynamiquement par renderResourcesPanel() -->
    <p style="opacity:0.6;">Chargement des ressources...</p>
</div>
```

Et appeler `renderResourcesPanel(adventurerId)` quand l'onglet Résumé s'affiche.

### Vérifier
- Ouvrir un aventurier → onglet Résumé → section Ressources visible
- Ajouter un emplacement de sort Niv. 3 (2 emplacements) → cases cochables
- Ajouter "Rage" (3 utilisations, repos long) → boutons +/- fonctionnels
- Cliquer Repos court → seules les ressources "repos court" se rechargent
- Cliquer Repos long → tout se recharge sauf "manuel"
- Recharger la page → les ressources sont persistées

---

## Ordre d'application recommandé

1. **Patch 2a** (format unifié) — c'est la base pour tout le reste
2. **Patch 2b** (drag & drop) — corrige les artefacts
3. **Patch 4** (ressources) — fonctionnalité indépendante
4. **Patch 3** (bestiaire) — fonctionnalité indépendante
5. **Patch 1** (fusion fond commun) — refactoring UI

Après chaque patch : `node --check` sur le JS extrait !
