# CLAUDE.md — Guide pour travailler sur ce projet

## Qu'est-ce que c'est

**Conseil du Plan** est une webapp D&D 5e en français, 100% client-side (HTML + CSS + JS vanilla).
Pas de framework, pas de bundler, pas de backend. Juste `index.html` qui charge les fichiers JS/CSS.
Ouvrir `index.html` dans un navigateur suffit pour tout faire tourner.

---

## Persistance des données

- **localStorage** — données textuelles (clé : `cdp_v3`)
- **IndexedDB** — blobs base64 : avatars (`m_av_<id>`, `n_av_<id>`), PDFs (`m_pdf_<id>`), images de fond battlemaps (`bm_bg_<id>`), médias (`med_<id>`)
- Pas de serveur, tout est local au navigateur de l'utilisateur
- `save()` écrit le texte dans localStorage + les blobs dans IndexedDB (async, non bloquant)
- Au chargement : texte depuis localStorage, blobs réinjectés via `loadBlobsIntoDB()` (async)

---

## Architecture des fichiers

```
conseil-du-plan/
├── index.html                     # Point d'entrée — charge tout dans l'ordre
├── css/styles.css                 # Tout le CSS (~500 lignes)
├── js/
│   ├── core/                      # Infrastructure
│   │   ├── constants.js           # STORE_KEY, SPELL_SCHOOLS, ALIGNMENTS, RACES_5E…
│   │   ├── db.js                  # save(), IndexedDB, updateMemberField(), toggleSaveProficiency()…
│   │   ├── toast.js               # toast(msg)
│   │   ├── modal.js               # openModal(html), closeModal()
│   │   ├── app.js                 # switchModule(), renderModule()
│   │   ├── utils.js               # esc(), uid(), RARITY, calcCarryCapacity(), normalizeItem(), DragDrop
│   │   ├── export-import.js       # exportData(), importData()
│   │   └── init.js                # Bootstrap : thème, updateStats(), renderMembers(), loadBlobsIntoDB()
│   ├── modules/
│   │   ├── aventuriers.js         # Fiches perso (le plus gros module)
│   │   ├── member-modal.js        # Formulaire d'édition multi-onglets d'un aventurier
│   │   ├── member-spells.js       # Sous-modale sorts (modifie _editMember.spells)
│   │   ├── member-inventory.js    # Sous-modale inventaire perso
│   │   ├── member-save.js         # saveMember()
│   │   ├── member-resources.js    # Ressources de classe (slots sorts, capacités) — non affiché pour l'instant
│   │   ├── inventaire.js          # Coffre, richesse, marchands, investissements, coffres nommés
│   │   ├── journal.js             # Chroniques de campagne
│   │   ├── pnj.js                 # PNJ
│   │   ├── battlemaps.js          # Cartes + initiative + dés + lieux + audio
│   │   ├── medias.js              # Galerie médias + Grimoire 490+ sorts
│   │   ├── bestiaire.js           # Statblocks + import + générateur de loot
│   │   ├── tresors.js             # Objets de valeur (appelé depuis inventaire.js)
│   │   ├── chasse.js              # Tableau de chasse (appelé depuis aventuriers.js)
│   │   └── aventure.js            # Quêtes, factions, timeline, plans, sessions + toggle thème
│   └── data/
│       ├── data-store.js          # DB par défaut + toutes les grandes constantes
│       └── spells-aidedd.js       # 490+ sorts D&D 5e en français (~493KB, 1 ligne)
└── assets/                        # (vide)
```

---

## Ordre de chargement des scripts

**L'ordre est critique.** Défini dans `index.html` :

1. `core/constants.js` — constantes globales
2. `data/data-store.js` — DB par défaut + ITEM_DATABASE, MERCHANTS, CLASS_RESOURCES, etc.
3. `core/db.js` — save/load/hydrate + helpers membres
4. `core/toast.js`, `core/modal.js`, `core/app.js`
5. `core/utils.js` — helpers + normalizeItem() + DragDrop
6. `modules/aventuriers.js` → `member-modal.js` → `member-spells.js` → `member-inventory.js` → `member-save.js`
7. `modules/member-resources.js` — après member-save.js, avant inventaire.js
8. `modules/inventaire.js` → `journal.js` → `pnj.js` → `battlemaps.js` → `medias.js` → `bestiaire.js` → `tresors.js` → `chasse.js` → `aventure.js`
9. `data/spells-aidedd.js` — après bestiaire.js (qui l'utilise)
10. `core/export-import.js`
11. `core/init.js` — **DERNIER** : lance le premier rendu

---

## Communication entre modules

Tout est en **variables globales** sur `window`. Pas d'encapsulation IIFE ni de modules ES6 (volontaire — monolithe en cours de modularisation).

Variables d'état globales importantes :
- `DB` — objet central (members, journal, npcs, bestiary, battlemaps, guildInventory, wealth…)
- `save()` — persiste DB
- `uid()` — génère un ID unique **number** (`Date.now() + random`) — important : toujours un number, pas une string
- `selectedMemberId`, `invTab`, `invGuildTab`, `journalSelectedId`, `selectedNpcId`, etc.
- `window._editMember`, `window._editMemberInvItem`, `window._editSpell` — états des modales d'édition

---

## Structure de DB

```javascript
DB = {
  members: [...],          // Aventuriers
  journal: [...],          // Entrées de journal
  npcs: [...],             // PNJ
  bestiary: [...],         // Créatures
  battlemaps: [...],       // Cartes
  guildInventory: [...],   // Objets du coffre de guilde
  wealth: {pp,po,pa,pc,lingots,tresor},   // Trésorerie principale
  guildBank: {pp,po,pa,pc},               // Conservé mais non affiché (doublon)
  guildChests: [...],      // Coffres nommés
  market: [...],           // Objets en vente
  merchants: {},           // Marchands custom (sinon MERCHANTS de data-store.js)
  merchantItems: {},       // Stocks custom par marchand
  investments: {capital, history:[]},
  treasures: [...],        // Objets de valeur
  media: [...],            // Fichiers médias
  quests: [...],           // Quêtes
  factions: [...],         // Factions
  timeline: [...],         // Événements
  timelineGroups: [...],   // Timelines nommées
  planes: [...],           // Plans cosmologiques custom
  customPlanes: [...],     // Noms de plans personnalisés
  sessionNotes: [...],     // Notes de session
  locations: [...],        // Lieux (battlemaps)
}
```

Structure d'un membre :
```javascript
{
  id, name, clazz, level, plane, avatar, avatarImg,
  stats: {str,dex,con,int,wis,cha},
  hp: {current,max}, ac, speed, profBonus, initiative,
  gold: {pp,po,pa,pc}, bank: {pp,po,pa,pc},
  saveProficiencies:[], skillProficiencies:[], skillExpertise:[],
  spells:[], inventory:[], weapons:[], pocket:[], pocketSize,
  features:[], specializations:[], resources:[],
  kills:[], equipment:{}, extraFields:[],
  loreBackground, lorePersonality, loreBonds, loreFlaws, loreDmSecrets,
  race, alignment, background, age, languages,
  armorProf, weaponProf, toolProf, panelOrder:[],
  pdf, pdfName, isNpc, linkedNpcId,
}
```

---

## Règles strictes de développement

### 1. JAMAIS de backticks imbriqués

```javascript
// ❌ INTERDIT
html += `<div onclick="${`dosomething(${id})`}">`;

// ✅ CORRECT
html += `<div onclick="dosomething(${id})">`;
// ou
html += '<div onclick="dosomething(' + id + ')">';
```

### 2. IDs toujours des numbers — coercion obligatoire dans les fonctions

`uid()` retourne un **number**. Après passage dans un attribut HTML `onclick="fn('${id}')"`, l'ID arrive comme **string** dans la fonction. Toujours forcer la conversion avec `+` dans les fonctions qui cherchent par ID :

```javascript
// ✅ CORRECT — résiste aux deux cas (string ou number en entrée)
const m = DB.members.find(x => x.id === +memberId);
const r = (m.resources||[]).find(x => x.id === +resourceId);
```

Ne jamais passer un ID entre guillemets simples dans un `onclick` si la fonction compare avec `===` :
```javascript
// ❌ Risqué si la fonction utilise ===
onclick="fn('${r.id}')"

// ✅ Sûr — passe comme number
onclick="fn(${r.id})"
```

### 3. Vérification syntaxique après chaque modification

```bash
node --check js/modules/aventuriers.js
node --check js/core/db.js
```

### 4. Ne JAMAIS redéclarer dans utils.js ce qui est dans data-store.js

Ces constantes/fonctions sont dans `data/data-store.js` et causent une `SyntaxError: redeclaration` si redéclarées ailleurs :

`MEDIA_TYPES`, `NPC_STATUSES`, `CONDITIONS`, `CLASS_RESOURCES`, `MERCHANTS`, `ITEM_DATABASE`, `getLootTier()`, `generateLoot()`, `initClassResources()`, `doRest()`, `NPC_RELATION_TYPES`, `LOOT_TIERS`, `STORE_KEY`, `SPELL_SCHOOLS`, `ALIGNMENTS`, `RACES_5E`, `SPELL_LEVELS`, `CAST_TIMES`, `DURATIONS`, `RANGES`

### 5. Pas de dépendances externes

Sauf Google Fonts. Pas de npm, pas de CDN, pas de framework.

### 6. Test en file://

Ouvrir `index.html` directement — tout doit marcher sans serveur local.

---

## Fonctions clés à connaître

### core/db.js
| Fonction | Rôle |
|---|---|
| `save()` | Persiste DB (texte → localStorage, blobs → IndexedDB) |
| `uid()` | Génère un ID unique (number) |
| `updateMemberField(memberId, path, value)` | Met à jour un champ imbriqué d'un membre et re-render le résumé |
| `updateResourceVal(memberId, resourceId, delta)` | Ajuste une ressource +/- |
| `setResourceVal(memberId, resourceId, val)` | Fixe la valeur d'une ressource |
| `removeResource(memberId, resourceId)` | Supprime une ressource |
| `openEditResourceModal(memberId, resourceId)` | Modale d'édition ressource |
| `toggleSaveProficiency(memberId, statKey)` | Toggle maîtrise jet de sauvegarde |
| `toggleSkillProficiency(memberId, skillName)` | Toggle maîtrise compétence |
| `toggleSkillExpertise(memberId, skillName)` | Toggle expertise compétence |
| `panelDragStart/panelDrop` | Drag des panneaux du résumé |
| `updateStats()` | Met à jour les compteurs header (membres, PO totaux, logs) |

### core/utils.js
| Fonction | Rôle |
|---|---|
| `esc(s)` | Échappe HTML (utiliser dans tout rendu de données utilisateur) |
| `mod(score)` | Calcule le modificateur D&D |
| `modStr(score)` | Modificateur formaté (+2, -1…) |
| `calcCarryCapacity(m)` | Calcule la capacité d'inventaire en cases |
| `carryBar(m)` | HTML de la barre d'encombrement |
| `badge(rarity)` | HTML d'un badge de rareté coloré |
| `avatarEl(m, size)` | HTML de l'avatar (image ou emoji) |
| `normalizeItem(raw)` | Normalise un objet brut au format standard |
| `DragDrop.makeDraggable(el, id, source)` | Rend un élément draggable |
| `DragDrop.makeDropZone(container, target, onDrop)` | Rend un conteneur droppable |

### modules/aventuriers.js — renderMemberSummary()
Génère le panneau résumé de l'aventurier avec des panneaux repositionnables par drag.
Panneaux disponibles : `identity`, `stats`, `saves`, `skills`, `purse`, `weapons`, `gear`, `lore`, `npc`.
L'ordre est persisté dans `member.panelOrder[]`.

---

## État actuel des fonctionnalités (v1.0)

| Fonctionnalité | État | Notes |
|---|---|---|
| Fiches aventuriers (stats, sorts, inventaire, lore) | ✅ Fonctionnel | |
| Système d'encombrement en cases | ✅ Fonctionnel | |
| Drag & drop inventaire (sacoche/casier/coffre) | ✅ Fonctionnel | |
| Bourse + dépôt banque de guilde | ✅ Fonctionnel | |
| Coffre de guilde + coffres nommés | ✅ Fonctionnel | |
| Trésorerie (calcul PO anti-flottants) | ✅ Fonctionnel | |
| Marché + marchands aléatoires | ✅ Fonctionnel | |
| Investissements 5d6 | ✅ Fonctionnel | |
| Journal de campagne | ✅ Fonctionnel | |
| PNJ + statuts + interactions | ✅ Fonctionnel | |
| Battlemaps + tokens + initiative | ✅ Fonctionnel | |
| Bestiaire + import AideDD | ✅ Fonctionnel | |
| Grimoire 490+ sorts | ✅ Fonctionnel | |
| Quêtes / Factions / Timeline / Plans | ✅ Fonctionnel | |
| Export / Import JSON | ✅ Fonctionnel | |
| Thème clair/sombre | ✅ Fonctionnel | |
| Ressources de classe (slots sorts, Ki…) | ⏳ Différé | Code présent dans member-resources.js, panneau masqué dans le résumé — à réintégrer |
| Import Bestiaire : parsing Langues et FP | ⏳ À faire | Voir PATCHES.md Patch 3 |

---

## Pour travailler sur un fichier spécifique

1. Lire ce CLAUDE.md
2. Lire le fichier cible en entier
3. Identifier les dépendances (fonctions globales utilisées, constantes de data-store.js)
4. Vérifier si les IDs manipulés sont des numbers (utiliser `+id` dans les `find()`)
5. Ne pas imbriquer les template literals
6. Modifier avec `str_replace` chirurgical
7. `node --check` sur chaque fichier modifié
8. Tester dans le navigateur en `file://`
