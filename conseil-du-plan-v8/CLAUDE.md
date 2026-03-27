# CLAUDE.md — Guide pour travailler sur ce projet

## Qu'est-ce que c'est

**Conseil du Plan** est une webapp D&D 5e en français, 100% client-side (HTML + CSS + JS vanilla).
Pas de framework, pas de bundler, pas de backend. Juste `index.html` qui charge les fichiers JS/CSS.
Ouvrir `index.html` dans un navigateur suffit pour tout faire tourner.

## Persistence des données

- **localStorage** pour les données textuelles (clé: `cdp_v3`)
- **IndexedDB** pour les blobs (images base64 des avatars, battlemaps, médias)
- Pas de serveur, tout est local au navigateur de l'utilisateur

## Architecture des fichiers

```
conseil-du-plan-v8/
├── index.html                     # Point d'entrée — charge tout
├── css/styles.css                 # Tout le CSS (~500 lignes)
├── js/
│   ├── core/                      # Infrastructure
│   │   ├── constants.js           # STORE_KEY, SPELL_SCHOOLS, ALIGNMENTS, RACES, etc.
│   │   ├── db.js                  # save()/load(), IndexedDB, hydrate(), helpers inline
│   │   ├── toast.js               # toast(msg) — notifications
│   │   ├── modal.js               # openModal(html, onReady), closeModal()
│   │   ├── app.js                 # switchModule() — navigation entre onglets
│   │   ├── utils.js               # esc(), uid(), RARITY, calcCarryCapacity(),
│   │   │                          # + [Patch 2a] normalizeItem()
│   │   │                          # + [Patch 2b] DragDrop
│   │   ├── export-import.js       # exportData(), importData()
│   │   └── init.js                # DOMContentLoaded, theme restore, hydrate()
│   ├── modules/                   # Modules fonctionnels (1 par onglet)
│   │   ├── aventuriers.js         # Fiches personnages (101KB, le plus gros)
│   │   ├── member-modal.js        # Modale d'édition multi-onglets d'un aventurier
│   │   ├── member-spells.js       # Sous-modale sorts (modifie _editMember.spells)
│   │   ├── member-inventory.js    # Sous-modale inventaire perso
│   │   ├── member-save.js         # saveMember() — sauvegarde d'un aventurier
│   │   ├── member-resources.js    # [Patch 4] Ressources aventurier (slots sorts, capacités)
│   │   ├── inventaire.js          # Inventaire de guilde (items, wealth, market, merchants, chests)
│   │   │                          # + [Patch 1] renderWealthPanel() corrigé
│   │   │                          # + [Bug fix] calcWealthPO() pour les flottants IEEE 754
│   │   ├── journal.js             # Chroniques de la campagne
│   │   ├── pnj.js                 # PNJ (personnages non-joueurs)
│   │   ├── battlemaps.js          # Cartes de bataille avec tokens (72KB)
│   │   ├── medias.js              # Galerie d'images
│   │   ├── bestiaire.js           # Bestiaire D&D 5e avec statblocks
│   │   ├── tresors.js             # Trésors trouvés
│   │   ├── chasse.js              # Tableau de chasse (monstres tués)
│   │   └── aventure.js            # Module Aventure V6.3 (quêtes, factions, timeline, notes)
│   └── data/                      # Données statiques volumineuses
│       ├── data-store.js          # DB par défaut, membres démo, données initiales
│       │                          # Contient : NPC_STATUSES, CONDITIONS, MEDIA_TYPES,
│       │                          # CLASS_RESOURCES, MERCHANTS, ITEM_DATABASE, etc.
│       └── spells-aidedd.js       # 490+ sorts D&D 5e en français (493KB, 1 ligne)
└── assets/                        # (vide pour l'instant)
```

## Comment ça communique entre modules

Tout est en **variables globales** sur `window` :
- `DB` — l'objet central avec toutes les données (members, journal, npcs, bestiary, battlemaps, etc.)
- `save()` — persiste DB en localStorage
- `selectedMemberId`, `invTab`, `journalSelectedId`, etc. — état UI par module
- Les fonctions `renderMembers()`, `renderInventory()`, etc. sont globales

Il n'y a PAS d'encapsulation IIFE ni de modules ES6. C'est volontaire : l'app a été conçue comme un monolithe et la modularisation est récente. L'encapsulation se fera progressivement.

## Ordre de chargement des scripts

**L'ordre est critique !** Défini dans index.html :
1. `core/constants.js` — définit les constantes utilisées partout
2. `data/data-store.js` — initialise DB avec les données par défaut
3. `core/db.js` — fonctions save/load/hydrate + helpers inline membres
4. `core/toast.js`, `core/modal.js`, `core/app.js` — UI de base
5. `core/utils.js` — helpers + normalizeItem() + DragDrop
6. `modules/aventuriers.js` → `member-modal.js` → `member-spells.js` → `member-inventory.js` → `member-save.js`
7. `modules/member-resources.js` — **après member-save.js**, avant inventaire.js
8. `modules/inventaire.js` → ... → tous les autres modules
9. `data/spells-aidedd.js` — après le bestiaire qui l'utilise
10. `core/export-import.js` — après tous les modules
11. `core/init.js` — DERNIER : lance hydrate() et le premier rendu

## Règles strictes de développement

### 1. JAMAIS de backticks imbriqués
Le code utilise des template literals, mais **ne jamais imbriquer** un template literal dans un autre.
```javascript
// ❌ INTERDIT
html += `<div onclick="${`dosomething(${id})`}">`;

// ✅ CORRECT
html += '<div onclick="dosomething(' + id + ')">';
// ou
html += `<div onclick="dosomething(${id})">`;
```

### 2. Vérification syntaxique après chaque modif
```bash
node --check js/modules/aventuriers.js
```

### 3. Pas de dépendances externes
Sauf Google Fonts. Pas de npm, pas de CDN, pas de framework.

### 4. Test dans le navigateur
Ouvrir `index.html` directement (protocole file://) — tout doit marcher.

### 5. Ne JAMAIS redéclarer dans utils.js ce qui est dans data-store.js
Les constantes suivantes sont définies dans `data/data-store.js` et ne doivent
**pas** être redéclarées dans `core/utils.js` (causera un `SyntaxError: redeclaration`) :
- `MEDIA_TYPES`, `NPC_STATUSES`, `CONDITIONS`
- `CLASS_RESOURCES`, `MERCHANTS`, `ITEM_DATABASE`
- `getLootTier()`, `generateLoot()`, `initClassResources()`, `doRest()`
- `NPC_RELATION_TYPES`, `LOOT_TIERS`, `STORE_KEY`, `SPELL_SCHOOLS`
- `ALIGNMENTS`, `RACES_5E`, `SPELL_LEVELS`, `CAST_TIMES`, `DURATIONS`, `RANGES`

## Données volumineuses

- **spells-aidedd.js** : ~493KB, 490+ sorts D&D 5e en français, 1 seule ligne JSON.
  Variable: `var AIDEDD_SPELLS = [...]`
- **bestiaire.js** : le code du module + potentiellement des données de monstres inline.
  Les données du bestiaire sont stockées dans `DB.bestiary[]` via localStorage,
  pas en dur dans le code (contrairement aux sorts). L'import se fait depuis AideDD.

## État des patches (V8.1)

| Patch | Description | Statut | Fichiers modifiés |
|-------|-------------|--------|-------------------|
| 1 | Fusion Banque de Guilde → Trésorerie | ✅ Fait | `inventaire.js` |
| Bug | Calcul richesse PO (flottants IEEE 754) | ✅ Fait | `inventaire.js` (calcWealthPO) |
| 2a | Format objet unifié (normalizeItem) | ✅ Fait | `utils.js` |
| 2b | Drag & Drop sans artefacts (DragDrop) | ✅ Fait | `utils.js`, `styles.css` |
| 4 | Ressources Aventurier (slots sorts, capacités) | ✅ Fait | `member-resources.js` (nouveau) |
| 3 | Import Bestiaire : Langues et FP | ⏳ À faire | `bestiaire.js` |

## Ce qui a été modifié — inventaire.js (V8.1)

### Bug fix — calcWealthPO()
Nouvelle fonction utilitaire qui convertit PP/PO/PA/PC/lingots en valeur PO arrondie à 2 décimales.
Corrige les affichages parasites dus aux imprécisions IEEE 754 (`10.099999...` au lieu de `10.10`).
À utiliser partout où un total en PO est calculé — remplace le calcul inline dans renderWealthPanel().

### Suppression de la section "Banque de Guilde" (Patch 1)
Dans `renderWealthPanel()`, le bloc "🏦 Banque de la Guilde" a été supprimé car il faisait
doublon avec la section "💰 Trésorerie de la Guilde". Concrètement :
- Le titre et le sous-total `guildBankPO` affiché en header ont été retirés
- La grille des fonds communs (PP/PO/PA/PC de `DB.guildBank`) a été supprimée de l'affichage
- **`DB.guildBank` n'est pas supprimé des données** — la structure persiste en localStorage
  pour ne pas casser l'import/export. Seul l'affichage est retiré.

### Conservation des dépôts individuels
La section listant les dépôts par membre (`m.bank`) est conservée, renommée
"🎒 Dépôts des Aventuriers" et intégrée directement dans le panneau Richesse.
Elle reste masquée si aucun membre n'a de dépôt.

### Commentaires ajoutés
Tout `inventaire.js` a été commenté :
- Séparateurs `// ===` pour naviguer entre les grandes sections
- JSDoc sur toutes les fonctions publiques
- Commentaires inline sur les blocs logiques non évidents

## Ce qui a été modifié — utils.js (V8.1)

### [Patch 2a] normalizeItem(raw)
Normalise un objet brut au format standard, quelle que soit la convention de nommage source.
Supporte les champs legacy : `nom`, `rarete`, `quantite`, `poids`, `prix`, `qty`, `w`, etc.
**À utiliser à CHAQUE création ou import d'objet** :
```javascript
DB.guildInventory.push(normalizeItem({nom:'Épée', quantite:1}));
member.inventory.push(normalizeItem(rawLootItem));
```

### [Patch 2b] DragDrop
Objet global remplaçant les anciens handlers qui stockaient `outerHTML` dans `dataTransfer`.
Deux méthodes :
- `DragDrop.makeDraggable(el, itemId, source)` — rend un élément draggable
- `DragDrop.makeDropZone(container, target, onDrop)` — rend un conteneur droppable

Le callback `onDrop(itemId, source, target)` est responsable de modifier DB puis re-render.
**Important** : le système existant dans `aventuriers.js` (chestDragStart/chestDrop) coexiste
sans conflit — il utilise son propre système plus spécialisé pour le coffre des membres.

## Ce qui a été ajouté — member-resources.js (V8.1, Patch 4)

Nouveau fichier gérant le panneau Ressources de l'onglet Résumé aventurier.

### Trois types de ressources
- `slot` : emplacement de sort (cases cochables, triées par niveau)
- `usage` : capacité à utilisations limitées (boutons +/-)
- `custom` : ressource personnalisée libre (boutons +/-)

### Fonctions principales
- `renderResourcesPanel(memberId)` — rendu du panneau complet
- `showAddResourceModal(memberId, type)` — modale d'ajout
- `confirmAddResource(memberId, type)` — validation et persistance
- `toggleSpellSlot(memberId, resourceId, slotIndex)` — coche/décoche un emplacement
- `resourcesAdjust(memberId, resourceId, delta)` — +/- sur une capacité
- `resourcesRemove(memberId, resourceId)` — suppression
- `resourcesDoRest(memberId, type)` — repos court ('court') ou long ('long')

### Recharge
- `long_rest` / `repos long` : rechargé par repos long
- `short_rest` / `repos court` : rechargé par repos court
- `dawn` : rechargé par repos long (assimilé)
- `manual` / `manuel` : jamais rechargé automatiquement

## Système d'onglets inventaire

- `invTab` : 'guild' | 'member'
- `invGuildTab` : 'items' | 'wealth' | 'market' | 'merchants' | 'invest' | 'chests'
- `DB.guildBank` : {pp, po, pa, pc} — données conservées mais non affichées (doublon trésorerie)
- `DB.wealth` : {pp, po, pa, pc, lingots} — trésorerie principale affichée dans l'onglet Richesse
- `guildChests` : coffres nommés avec inventaire propre

## Thème clair/sombre

- Variables CSS dans `:root` (thème sombre par défaut)
- `.light-mode` sur `<body>` pour le thème clair
- Toggle dans `aventure.js` (section THEME TOGGLE)
- Persisté dans `localStorage('cdp_theme')`

## Pour travailler sur un fichier spécifique

1. Lire ce CLAUDE.md d'abord
2. Lire le fichier cible
3. Identifier les dépendances (fonctions globales utilisées)
4. Vérifier dans data-store.js ce qui est déjà déclaré (éviter les redéclarations)
5. Modifier avec `str_replace` chirurgical
6. `node --check` après chaque modif
7. Tester dans le navigateur
