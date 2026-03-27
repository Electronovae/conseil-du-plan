# Patches V7.6 → V8.1 — Journal des modifications

## État d'avancement

| # | Description | Statut |
|---|-------------|--------|
| 1 | Fusion Banque de Guilde → Trésorerie | ✅ Appliqué |
| Bug | Calcul richesse PO (flottants IEEE 754) | ✅ Corrigé |
| 2a | Format objet unifié — `normalizeItem()` | ✅ Appliqué |
| 2b | Drag & Drop sans artefacts — `DragDrop` | ✅ Appliqué |
| 4 | Ressources Aventurier (slots sorts, capacités) | ✅ Appliqué |
| 3 | Import Bestiaire : Langues et FP | ⏳ À faire |

---

## ✅ PATCH 1 — Fusion "Banque de Guilde" dans Trésorerie

**Fichier modifié :** `js/modules/inventaire.js`

### Ce qui a été fait
Dans `renderWealthPanel()` :
- Le bloc "🏦 Banque de la Guilde" (PP/PO/PA/PC + total `guildBankPO`) a été **supprimé de l'affichage**
- Les dépôts individuels (`m.bank`) ont été **conservés**, renommés "🎒 Dépôts des Aventuriers"
- `DB.guildBank` n'est **pas supprimé des données** (localStorage) pour ne pas casser l'export/import

### Si tu veux annuler
Rechercher dans `inventaire.js` :
```javascript
// NOTE : les fonds communs de la banque (DB.guildBank) sont supprimés de
//        l'affichage car ils faisaient doublon avec la trésorerie ci-dessus.
```
Et réintégrer le bloc HTML de la banque à cet endroit.

---

## ✅ BUG FIX — Calcul richesse PO (flottants IEEE 754)

**Fichier modifié :** `js/modules/inventaire.js`

### Problème
L'affichage de la valeur totale en PO pouvait produire des flottants parasites
(`10.099999...` pour 10 PA, `0.030000000000000002` pour 3 PC, etc.)
à cause des imprécisions arithmétiques IEEE 754 de JavaScript.

### Solution
Nouvelle fonction `calcWealthPO(coins)` dans `inventaire.js` :
```javascript
function calcWealthPO(coins) {
  const total = (coins.pp||0)*10 + (coins.po||0) + (coins.pa||0)*0.1
              + (coins.pc||0)*0.01 + (coins.lingots||0)*50;
  return Math.round(total * 100) / 100;  // arrondi à 2 décimales
}
```
Utilisée dans `renderWealthPanel()` pour le total de la trésorerie et les dépôts membres.

---

## ✅ PATCH 2a — Format d'objet unifié

**Fichier modifié :** `js/core/utils.js` (ajout en fin de fichier)

### Problème
Les objets créés dans différents modules avaient des structures variables :
`nom` vs `name`, `rarete` vs `rarity`, `quantite` vs `qty`, `poids` vs `weight`, etc.
Causait des comportements incohérents lors des transferts entre modules.

### Solution — `normalizeItem(raw)`
```javascript
function normalizeItem(raw) {
  if (!raw) return null;
  return {
    id:       raw.id || ('item_' + Date.now() + '_' + Math.random().toString(36).substr(2,4)),
    name:     raw.name     || raw.nom      || 'Objet sans nom',
    category: raw.category || raw.type     || 'Équipement',
    rarity:   raw.rarity   || raw.rarete   || 'Commun',
    size:     raw.size !== undefined ? +raw.size : (raw.w !== undefined ? +raw.w : 1),
    price:    parseInt(raw.price || raw.prix || raw.valeur || raw.value || 0, 10),
    qty:      Math.max(1, parseInt(raw.qty || raw.quantity || raw.quantite || 1, 10)),
    description: raw.description || raw.desc || '',
    emoji:    raw.emoji || null,
    icon:     raw.icon  || null,
    equippedSlot: raw.equippedSlot || null,
    ownerId:  raw.ownerId || null,
    chestId:  raw.chestId || null,
    // + champs optionnels arme, armure, sac...
  };
}
```

**À utiliser à chaque création d'objet :**
```javascript
DB.guildInventory.push(normalizeItem({nom:'Épée', quantite:1}));
member.inventory.push(normalizeItem(rawLootItem));
```

---

## ✅ PATCH 2b — Drag & Drop sans artefacts

**Fichiers modifiés :** `js/core/utils.js` (ajout), `css/styles.css` (ajout)

### Problème
L'ancien système stockait `e.target.outerHTML` dans `dataTransfer`, ce qui dupliquait
le DOM au drop et créait des éléments "fantômes" persistants.

### Solution — objet `DragDrop`
```javascript
// Rendre un élément draggable (stocke l'ID, jamais le HTML) :
DragDrop.makeDraggable(el, itemId, 'inventaire');

// Rendre un conteneur droppable :
DragDrop.makeDropZone(container, 'coffre', function(itemId, source, target) {
  // modifier DB ici, puis save() + render()
});
```

**CSS ajouté dans `styles.css` :**
```css
.dragging  { opacity:.4; transform:scale(.95); transition:all .15s ease; }
.drag-over { outline:2px dashed var(--accent,#c8a455); outline-offset:4px;
             background:rgba(200,164,85,.05); }
```

**Note :** le système existant de drag dans `aventuriers.js` (chestDragStart/chestDrop)
coexiste sans conflit — il n'a pas été remplacé car il est déjà fonctionnel.

---

## ✅ PATCH 4 — Ressources Aventurier

**Fichier créé :** `js/modules/member-resources.js`
**Chargement :** après `member-save.js`, avant `inventaire.js` dans `index.html`

### Fonctionnement
Trois types de ressources dans `member.resources[]` :
- `slot` : emplacement de sort — cases cochables, triées par niveau
- `usage` : capacité à utilisations limitées — boutons +/-
- `custom` : ressource libre — boutons +/-

### Fonctions exposées globalement
| Fonction | Rôle |
|----------|------|
| `renderResourcesPanel(memberId)` | Rendu du panneau complet |
| `showAddResourceModal(memberId, type)` | Modale d'ajout |
| `confirmAddResource(memberId, type)` | Validation depuis la modale |
| `toggleSpellSlot(memberId, resourceId, idx)` | Coche/décoche un emplacement de sort |
| `resourcesAdjust(memberId, resourceId, delta)` | +/- sur une capacité |
| `resourcesRemove(memberId, resourceId)` | Suppression |
| `resourcesDoRest(memberId, type)` | Repos 'court' ou 'long' |

### Valeurs de recharge acceptées
`long_rest`, `repos long`, `dawn` → rechargé par repos long
`short_rest`, `repos court` → rechargé par repos court
`manual`, `manuel` → jamais rechargé automatiquement

### Vérifier
- Ouvrir un aventurier → onglet Résumé → panneau ⚡ Ressources visible
- Ajouter un emplacement Niv. 3 (2 cases) → cases cochables
- Ajouter "Rage" (3 utilisations, repos long) → boutons +/- fonctionnels
- Repos court → seules les ressources "repos court" rechargées
- Repos long → tout rechargé sauf "manuel"
- Recharger la page → ressources persistées

---

## ⏳ PATCH 3 — Import Bestiaire : Langues et FP

**Fichier à modifier :** `js/modules/bestiaire.js`

### Problème
L'import AideDD ne parse pas correctement les langues et le facteur de puissance.
Les fractions comme "1/4" ne sont pas converties en nombre, et les langues avec
parenthèses comme "commun (ne peut pas parler)" sont mal découpées.

### 3a — `parseChallengeRating(text)`

À ajouter dans `bestiaire.js` et utiliser dans `_doImportMonsters()` :

```javascript
/**
 * Parse le FP depuis du texte AideDD.
 * Gère : "1/8", "1/4", "1/2", "0", "1" … "30"
 * Retourne un nombre : 0.125, 0.25, 0.5, 0, 1, 2 …
 */
function parseChallengeRating(text) {
  if (!text) return 0;
  var cleaned = text.toString().trim();
  var fpMatch = cleaned.match(/(?:FP|Puissance|CR|Challenge)\s*[:\-–]?\s*([\d]+\s*\/\s*[\d]+|[\d]+)/i);
  if (fpMatch) cleaned = fpMatch[1].trim();
  var fracMatch = cleaned.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fracMatch) {
    var num = parseInt(fracMatch[1], 10);
    var den = parseInt(fracMatch[2], 10);
    return den > 0 ? num / den : 0;
  }
  var val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}
```

### 3b — `parseMonsterLanguages(text)`

```javascript
/**
 * Parse les langues depuis du texte AideDD.
 * Gère : "commun, elfique", "—", "aucune",
 *        "commun (ne peut pas parler)", "télépathie 36 m"
 */
function parseMonsterLanguages(text) {
  if (!text) return [];
  var cleaned = text.trim();
  var langMatch = cleaned.match(/Langues?\s*[:\-–—]?\s*(.+?)(?:\n|Sens\s|Puissance|FP|$)/is);
  if (langMatch) cleaned = langMatch[1].trim();
  if (cleaned === '—' || cleaned === '-' || cleaned === '–' ||
      cleaned.toLowerCase() === 'aucune' || cleaned === '') return [];
  var langs = [], current = '', depth = 0;
  for (var i = 0; i < cleaned.length; i++) {
    var ch = cleaned[i];
    if      (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      var trimmed = current.trim();
      if (trimmed) langs.push(trimmed);
      current = ''; continue;
    }
    current += ch;
  }
  var last = current.trim();
  if (last) langs.push(last);
  return langs;
}
```

### Intégration dans `_doImportMonsters()`

Dans la boucle d'import, remplacer les affectations `cr` et `languages` :
```javascript
// Avant :
cr: m.cr || '0',
languages: m.languages || '',

// Après :
cr: parseChallengeRating(m.cr || m.fp || m.puissance),
languages: parseMonsterLanguages(m.languages || m.langues),
```

### Vérifier
- Importer FP 1/4 → affiche "FP 1/4", valeur numérique 0.25
- Importer FP 12 → affiche "FP 12"
- Langues "commun, draconique" → tableau de 2 éléments
- Langues "—" → tableau vide
- Langues "commun (ne peut pas parler), télépathie 36 m" → 2 éléments corrects

---

## Règles pour les futurs patches

1. Vérifier dans `data-store.js` ce qui est déjà déclaré avant d'ajouter dans `utils.js`
2. `node --check` sur chaque fichier modifié avant de tester dans le navigateur
3. Ne pas imbriquer les template literals
4. Toujours tester en `file://` (pas besoin de serveur local)
