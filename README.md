# ⚔️ Conseil du Plan — Outil de campagne D&D 5e

Application web de gestion de campagne Donjons & Dragons 5e, entièrement en français.

## Fonctionnalités

- **🧙 Aventuriers** — Fiches personnages avec stats, sorts, inventaire, lore
- **🎒 Inventaire** — Banque de guilde, marchands, coffres, marché
- **📜 Journal** — Chroniques de campagne avec éditeur riche
- **👤 PNJ** — Répertoire de personnages non-joueurs
- **🗺️ Battlemaps** — Cartes de bataille avec tokens déplaçables
- **🖼️ Médias** — Galerie d'images de campagne
- **🐉 Bestiaire** — Statblocks D&D 5e complets (import AideDD)
- **⚔️ Aventure** — Quêtes, factions, timeline, notes de session

## Installation

Aucune installation requise. Ouvrir `index.html` dans un navigateur.

```bash
git clone https://github.com/VOTRE_USER/conseil-du-plan.git
cd conseil-du-plan
open index.html       # macOS
xdg-open index.html   # Linux
start index.html      # Windows
```

## Stack technique

- **HTML/CSS/JS vanilla** — zéro framework, zéro dépendance
- **localStorage + IndexedDB** — persistance 100% locale
- **Google Fonts** — seule ressource externe (Cinzel, Crimson Pro, Exo 2)
- Thème sombre/clair

## Structure du projet

```
├── index.html          # Point d'entrée
├── css/styles.css      # Styles (sombre par défaut)
├── js/
│   ├── core/           # Infrastructure (DB, utils, modal, routing)
│   ├── modules/        # 1 fichier par module fonctionnel
│   └── data/           # Données statiques (sorts D&D 5e)
├── CLAUDE.md           # Guide pour développement assisté par IA
└── PATCHES.md          # Corrections et améliorations planifiées
```

Voir [CLAUDE.md](CLAUDE.md) pour la documentation technique détaillée.

## Licence

Usage personnel — données D&D sous licence Wizards of the Coast (SRD 5.1).
