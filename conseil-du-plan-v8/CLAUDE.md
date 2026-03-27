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
├── css/styles.css                 # Tout le CSS (374 lignes)
├── js/
│   ├── core/                      # Infrastructure
│   │   ├── constants.js           # STORE_KEY, SPELL_SCHOOLS, ALIGNMENTS, RACES, etc.
│   │   ├── db.js                  # save()/load(), IndexedDB, hydrate()
│   │   ├── toast.js               # toast(msg) — notifications
│   │   ├── modal.js               # openModal(html, onReady), closeModal()
│   │   ├── app.js                 # switchModule() — navigation entre onglets
│   │   ├── utils.js               # esc(), uid(), RARITY, SCHOOL_COLOR, calcCarryCapacity()
│   │   ├── export-import.js       # exportData(), importData()
│   │   └── init.js                # DOMContentLoaded, theme restore, hydrate()
│   ├── modules/                   # Modules fonctionnels (1 par onglet)
│   │   ├── aventuriers.js         # Fiches personnages (101KB, le plus gros)
│   │   ├── member-modal.js        # Modale d'édition multi-onglets d'un aventurier
│   │   ├── member-spells.js       # Sous-modale sorts (modifie _editMember.spells)
│   │   ├── member-inventory.js    # Sous-modale inventaire perso
│   │   ├── member-save.js         # saveMember() — sauvegarde d'un aventurier
│   │   ├── inventaire.js          # Inventaire de guilde (items, wealth, market, merchants, chests)
│   │   ├── journal.js             # Chroniques de la campagne
│   │   ├── pnj.js                 # PNJ (personnages non-joueurs)
│   │   ├── battlemaps.js          # Cartes de bataille avec tokens (72KB)
│   │   ├── medias.js              # Galerie d'images
│   │   ├── bestiaire.js           # Bestiaire D&D 5e avec statblocks (~1.5MB avec données inline)
│   │   ├── tresors.js             # Trésors trouvés
│   │   ├── chasse.js              # Tableau de chasse (monstres tués)
│   │   └── aventure.js            # Module Aventure V6.3 (quêtes, factions, timeline, notes)
│   └── data/                      # Données statiques volumineuses
│       ├── data-store.js          # DB par défaut, membres démo, données initiales
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
3. `core/db.js` — fonctions save/load/hydrate
4. `core/toast.js`, `core/modal.js`, `core/app.js` — UI de base
5. `core/utils.js` — helpers
6. `modules/aventuriers.js` → ... → tous les modules
7. `data/spells-aidedd.js` — après le bestiaire qui l'utilise
8. `core/export-import.js` — après tous les modules
9. `core/init.js` — DERNIER : lance hydrate() et le premier rendu

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

## Données volumineuses

- **spells-aidedd.js** : ~493KB, 490+ sorts D&D 5e en français, 1 seule ligne JSON.
  Variable: `var AIDEDD_SPELLS = [...]`
- **bestiaire.js** : le code du module + potentiellement des données de monstres inline
  Note: les données du bestiaire sont stockées dans `DB.bestiary[]` via localStorage,
  pas en dur dans le code (contrairement aux sorts). L'import se fait depuis AideDD.

## Bugs connus / Améliorations prévues (PATCHES.md)

3 patches restent à appliquer (le Patch 1 a été partiellement résolu, voir ci-dessous) :
1. ~~**Fusion Fond Commun → Trésorerie**~~ — **FAIT** (voir section ci-dessous)
2. **Format objet unifié + Drag & Drop** — normalizeItem() + DragDrop sans artefacts
3. **Import Bestiaire : Langues et FP** — parseChallengeRating(), parseMonsterLanguages()
4. **Ressources Aventurier** — système complet pour l'onglet Résumé (slots de sorts, capacités, repos)

Ordre recommandé : 2a → 2b → 4 → 3

## Ce qui a été modifié — inventaire.js (V8.0)

### Suppression de la section "Banque de Guilde"
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
- Commentaires inline sur les blocs logiques non évidents (seed marchand, migrations, etc.)

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
4. Modifier avec `str_replace` chirurgical
5. `node --check` après chaque modif
6. Tester dans le navigateur
