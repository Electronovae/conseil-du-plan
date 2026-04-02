# ⚔️ Conseil du Plan — Outil de campagne D&D 5e

Application web de gestion de campagne Donjons & Dragons 5e, entièrement en français. 100% locale, aucune installation, aucun compte.

## Fonctionnalités

### 🧙 Aventuriers
Fiches personnages complètes : caractéristiques (FOR/DEX/CON/INT/SAG/CHA) éditables inline, jets de sauvegarde, compétences avec maîtrises et expertises, CA / PV / initiative / vitesse, bourse (PP/PO/PA/PC) et dépôt en banque de guilde, armes avec jets d'attaque et de dégâts dés, équipement porté par slot (armure, casque, bottes…), sorts connus (vignettes ou liste), inventaire avec système d'encombrement en cases, coffre de guilde / casier / sacoche, tableau de chasse (kills), lore (historique, personnalité, liens, défauts, secrets MJ), impression PDF.

### ⚖️ Inventaire de guilde
Coffre commun et casiers personnels par membre, coffres nommés (forgeron, aubergiste…), drag & drop entre zones. Trésorerie (PP/PO/PA/PC + lingots) avec total anti-flottants IEEE 754. Marché (mise en vente d'objets aux PJ avec débit automatique). Marchands générés aléatoirement par seed (stocks renouvelables). Système d'investissement 5d6 style Naheulbeuk avec courbe d'évolution. Base de données d'objets D&D 5e intégrée.

### 📜 Journal
Chroniques de campagne multi-onglets, entrées liées aux membres participants, tags, liens cliquables vers les fiches aventuriers.

### 🎭 PNJ
Répertoire avec avatars, rôles, statuts multiples (vivant/mort/disparu…), journal d'interactions, relations entre PNJ, secrets MJ, lien vers fiche aventurier associée.

### 🗺️ Battlemaps
Grille configurable (5 terrains), tokens déplaçables (alliés/ennemis/neutres/effets), images de fond, barre de PV par token, lien vers fiche membre ou créature du bestiaire. Tracker d'initiative avec gestion des conditions D&D 5e, dégâts/soins en direct. Lance-dés intégré (expressions 2d6+3, 4d6kh3…). Gestion des lieux. Playlist audio d'ambiance.

### 🐉 Bestiaire
Statblocks D&D 5e complets (caractéristiques, actions structurées, légendaires, traits). Import depuis fichier `bestiary.json` compatible AideDD. Générateur de loot par FP. Placement direct sur la battlemap active.

### 📖 Aventure
Quêtes (statuts, priorités, objectifs cochables, tags, notes MJ). Factions (attitudes, membres PNJ liés, illustration). Timeline chronologique ou en organigramme par type d'événement, filtrable par timeline nommée. Plans (lieux, PNJ liés). Notes de session numérotées.

### 🎵 Médias & Grimoire
Galerie d'images, sons, cartes, documents. Grimoire complet : 490+ sorts D&D 5e en français (AideDD), filtrable par école / niveau / concentration, assignation directe à un aventurier.

---

## Installation

Aucune installation requise. Ouvrir `index.html` dans un navigateur.

```bash
git clone https://github.com/VOTRE_USER/conseil-du-plan.git
cd conseil-du-plan
open index.html       # macOS
xdg-open index.html   # Linux
start index.html      # Windows
```

> Fonctionne en protocole `file://` — aucun serveur local nécessaire.

---

## Stack technique

- **HTML/CSS/JS vanilla** — zéro framework, zéro bundler, zéro dépendance npm
- **localStorage** — données textuelles (clé `cdp_v3`)
- **IndexedDB** — blobs (avatars, images de fond, médias)
- **Google Fonts** — seule ressource externe (Cinzel, Crimson Pro, Exo 2)
- Thème sombre (défaut) / thème clair, persisté en localStorage

---

## Structure du projet

```
conseil-du-plan/
├── index.html                  # Point d'entrée — charge tout dans l'ordre
├── css/
│   └── styles.css              # Tout le CSS (~500 lignes, variables CSS)
├── js/
│   ├── core/                   # Infrastructure partagée
│   │   ├── constants.js        # STORE_KEY, SPELL_SCHOOLS, ALIGNMENTS, RACES…
│   │   ├── db.js               # save(), IndexedDB, helpers membres (updateMemberField…)
│   │   ├── utils.js            # esc(), uid(), RARITY, calcCarryCapacity(), normalizeItem(), DragDrop
│   │   ├── modal.js            # openModal(), closeModal()
│   │   ├── toast.js            # toast(msg)
│   │   ├── app.js              # switchModule(), renderModule()
│   │   ├── export-import.js    # exportData(), importData()
│   │   └── init.js             # Bootstrap : thème, stats, premier rendu
│   ├── modules/                # 1 fichier par fonctionnalité
│   │   ├── aventuriers.js      # Fiches perso — le plus gros module
│   │   ├── member-modal.js     # Formulaire d'édition multi-onglets
│   │   ├── member-spells.js    # Sous-modale sorts
│   │   ├── member-inventory.js # Sous-modale inventaire perso
│   │   ├── member-save.js      # saveMember()
│   │   ├── member-resources.js # Ressources de classe (slots sorts, capacités)
│   │   ├── inventaire.js       # Coffre, richesse, marchands, investissements
│   │   ├── journal.js          # Chroniques
│   │   ├── pnj.js              # Personnages non-joueurs
│   │   ├── battlemaps.js       # Cartes + initiative + dés + lieux
│   │   ├── medias.js           # Galerie + Grimoire sorts
│   │   ├── bestiaire.js        # Statblocks + import + loot
│   │   ├── tresors.js          # Objets de valeur
│   │   ├── chasse.js           # Tableau de chasse
│   │   └── aventure.js         # Quêtes, factions, timeline, plans, sessions
│   └── data/
│       ├── data-store.js       # DB par défaut, ITEM_DATABASE, MERCHANTS, CLASS_RESOURCES…
│       └── spells-aidedd.js    # 490+ sorts D&D 5e (~493KB, variable AIDEDD_SPELLS)
└── CLAUDE.md                   # Documentation technique pour développement IA
```

---

## Données et persistance

Toutes les données sont stockées **localement dans le navigateur** — rien n'est envoyé sur un serveur.

- Export : bouton dans l'interface → fichier `.json` complet (texte + blobs base64)
- Import : recharge complète depuis un fichier `.json` exporté précédemment
- Les blobs (images) sont séparés du texte : localStorage pour le texte, IndexedDB pour les images (évite la limite des 5MB)

---

## Licence

Usage personnel. Données D&D sous licence Wizards of the Coast (SRD 5.1).
