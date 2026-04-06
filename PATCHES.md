# PATCHES.md — Roadmap Conseil du Plan

> Règle d'or : **une patch = un fichier ou une fonctionnalité isolée**.  
> Chaque patch est testable indépendamment avant de passer au suivant.  
> Toujours lancer `node --check` sur les fichiers JS modifiés.

---

## V1.1 — Correctifs visibles et quick wins

---

### Patch 1 — Correction de l'affichage de l'image dans l'onglet Factions

**Problème** : L'image de fond choisie pour une faction ne s'affiche pas correctement.  
**Fichier** : `js/modules/aventure.js`  
**Cause probable** : La valeur `f.bgImage` est stockée dans `DB` (texte localStorage) mais les images de faction ne passent pas par IndexedDB — elles sont donc potentiellement trop lourdes pour localStorage, ou la référence est perdue au rechargement.  
**Correction** :
- Faire passer `f.bgImage` par IndexedDB exactement comme les avatars membres (`n_av_<id>`), en ajoutant une clé `fac_bg_<id>` dans `_splitBlobs` / `_mergeBlobs` de `db.js`.
- Vérifier que `renderFactionDetailHTML` utilise bien la valeur reconstituée.  
**Fichiers touchés** : `js/core/db.js`, `js/modules/aventure.js`  
**Risque** : Faible — ajout isolé dans les fonctions de split/merge.

---

### Patch 2 — Supprimer l'onglet "Combat" dans la modale aventurier

**Problème** : Un onglet "Combat" apparaît dans `member-modal.js` mais son contenu est redondant ou vide.  
**Fichier** : `js/modules/member-modal.js`  
**Correction** : Retirer l'entrée de l'onglet dans le tableau de tabs, et supprimer le bloc HTML correspondant. Vérifier qu'aucun `onclick` ou état ne référence cet onglet.  
**Fichiers touchés** : `js/modules/member-modal.js`  
**Risque** : Très faible — suppression pure.

---

### Patch 3 — Case "Permanent" dans le bestiaire

**Problème** : Le bouton "Vider le bestiaire" supprime les créatures custom que le MJ veut garder.  
**Fichier** : `js/modules/bestiaire.js`  
**Correction** :
- Ajouter un champ `permanent: false` dans la structure d'une créature.
- Afficher une checkbox "Permanent ⭐" dans le formulaire d'édition d'une créature.
- Modifier la fonction "Vider le bestiaire" pour ne supprimer que les créatures où `permanent !== true`.
- Afficher un badge ou filtre "Mes créatures" pour isoler les permanentes.  
**Fichiers touchés** : `js/modules/bestiaire.js`  
**Risque** : Faible.

---

### Patch 4 — Lier un monstre du bestiaire à un PNJ

**Problème** : Un statblock de créature ne peut pas être rattaché à une fiche PNJ existante.  
**Correction** :
- Ajouter un champ `linkedNpcId` dans la structure créature du bestiaire.
- Ajouter un bouton "🎭 Lier à un PNJ" dans la vue détail d'une créature, qui ouvre un select des PNJ existants.
- Dans la fiche PNJ, afficher un lien vers le statblock si `linkedNpcId` est renseigné.
- Les créatures liées à un PNJ héritent automatiquement du comportement "permanent" (Patch 3).  
**Fichiers touchés** : `js/modules/bestiaire.js`, `js/modules/pnj.js`  
**Risque** : Moyen — double liaison, vérifier la cohérence des IDs.

---

## V1.2 — Bases de données et uniformisation

---

### Patch 5 — Base de données d'objets extensible via JSON externe

**Contexte** : Une `ITEM_DATABASE` existe déjà dans `data-store.js`. L'objectif est de permettre au MJ d'y injecter ses propres objets via un fichier JSON externe, sans modifier le code.  
**Correction** :
- Créer un fichier `data/custom-items.json` vide à la racine (tableau `[]`).
- Au chargement (`init.js`), faire un `fetch('data/custom-items.json')` et merger les résultats dans `ITEM_DATABASE` (les items custom écrasent les doublons par nom).
- Documenter la structure attendue d'un objet dans un commentaire du fichier JSON.
- Ajouter dans l'interface Inventaire un bouton "📥 Importer des objets (JSON)" qui permet aussi de charger un fichier depuis le disque (alternative pour `file://`).

> **Note protocole `file://`** : `fetch()` est bloqué en `file://` sur certains navigateurs (Chrome). Le bouton d'import manuel est donc le fallback principal. Documenter ce comportement.

**Fichiers touchés** : `js/core/init.js`, `js/modules/inventaire.js`, `data/custom-items.json` (nouveau)  
**Risque** : Faible à moyen.

---

### Patch 6 — Uniformisation des objets dans toute l'application

**Problème** : Les objets créés dans l'inventaire perso, le coffre de guilde, les coffres nommés et le marché n'ont pas toujours la même structure (champs manquants, `emoji` vs `icon`, `size` absent…).  
**Correction** :
- Auditer tous les endroits qui créent ou affichent un objet.
- S'assurer que `normalizeItem()` dans `utils.js` est appelé systématiquement à la création ET à l'import.
- Ajouter les champs manquants dans `normalizeItem()` avec des valeurs par défaut.
- Unifier l'affichage visuel (badge rareté, emoji, taille) dans un helper `renderItemCard(item)` réutilisable.  
**Fichiers touchés** : `js/core/utils.js`, `js/modules/inventaire.js`, `js/modules/member-inventory.js`  
**Risque** : Moyen — transversal, tester chaque zone d'inventaire.

---

### Patch 7 — Base de données Compétences / Spécialisations / Dons

**Objectif** : Même logique que le Grimoire de sorts — une base consultable et assignable à un aventurier.  
**Correction** :
- Créer `data/features-dnd5e.js` contenant un tableau `DND5E_FEATURES` avec les capacités de classe, les dons (feats) et les traits raciaux du SRD 5.1 (domaine public). Structure suggérée :
  ```javascript
  { id, name, type, source, level, description, prerequisite }
  // type : 'class' | 'race' | 'feat' | 'background'
  // source : 'Barbare', 'Elfe', 'Sentinelle'…
  ```
- Ajouter un onglet "Capacités" dans la modale aventurier (`member-modal.js`), avec filtre par type/source.
- Un clic assigne la capacité à `member.features[]` ou `member.specializations[]`.
- Ajouter le script dans `index.html` après `spells-aidedd.js`.  
**Fichiers touchés** : `data/features-dnd5e.js` (nouveau), `js/modules/member-modal.js`, `index.html`  
**Risque** : Moyen — gros fichier de données à constituer, logique d'UI simple.

---

## V1.3 — Liens et cohérence narrative

---

### Patch 8 — Lier le Lore aventurier à l'onglet Aventure

**Objectif** : Le lore d'un aventurier (historique, personnalité, liens, défauts) doit être visible/accessible depuis les sections concernées d'Aventure (Journal, PNJ, Factions).  
**Correction** :
- Dans la vue détail d'un PNJ lié à un aventurier (`linkedNpcId`), afficher un encart "📖 Lore du personnage" avec les champs lore de l'aventurier correspondant.
- Dans le Journal, afficher l'avatar + nom du personnage quand il est listé en participant, avec un lien cliquable vers sa fiche.
- Dans les Factions, si un membre est un aventurier (`isNpc === false`), afficher son lore résumé au survol ou en section dédiée.  
**Fichiers touchés** : `js/modules/pnj.js`, `js/modules/journal.js`, `js/modules/aventure.js`  
**Risque** : Moyen — lecture seule sur des données existantes, pas de modification de structure.

---

### Patch 9 — Classement et filtres des PNJ

**Objectif** : Permettre de trier/filtrer les PNJ par statut, rôle, faction, ou importance.  
**Correction** :
- Ajouter un champ `importance` : `'principale' | 'secondaire' | 'figurant'` dans la structure PNJ.
- Ajouter des boutons de filtre rapide en haut de la sidebar PNJ (par statut, par importance, par faction liée).
- Ajouter un tri alphabétique / par importance.
- Option "épingler" un PNJ en haut de liste (`pinned: true`).  
**Fichiers touchés** : `js/modules/pnj.js`  
**Risque** : Faible.

---

## V1.4 — Plans enrichis

---

### Patch 10 — Level up de l'onglet Plans : images et documents

**Objectif** : Chaque Plan et chaque Lieu peut avoir des images et des documents attachés (cartes, illustrations, PDF de description).  
**Correction** :
- Ajouter un tableau `images: []` et `documents: []` dans la structure d'un Plan et d'un Lieu.
- Chaque image est stockée via IndexedDB (clé `plane_img_<planeId>_<idx>`).
- Chaque document est stocké via IndexedDB (clé `plane_doc_<planeId>_<idx>`).
- Afficher une galerie miniature dans `renderPlaneDetailHTML`.
- Afficher les documents avec icône de type et bouton de téléchargement.  
**Fichiers touchés** : `js/modules/aventure.js`, `js/core/db.js` (ajout clés dans split/merge)  
**Risque** : Moyen.

---

### Patch 11 — Fusion Plans DB ↔ Carousels de sélection de plan

**Contexte** : Dans l'application, les "plans" (Plan Matériel, Enfer, etc.) sont des chaînes de texte dans les fiches aventurier et les tokens de battlemap. L'onglet Plans gère des objets `DB.planes[]` riches. Il faut que les deux soient liés.  
**Correction** :
- Dans la fiche aventurier, le select "Plan" utilise désormais `DB.planes` comme source (nom + icône), avec fallback sur `DB.customPlanes` pour la rétrocompatibilité.
- Dans les tokens de battlemap, idem.
- Ajouter un lien "🌀 Voir la fiche du plan" à côté du select quand le plan sélectionné a une fiche dans `DB.planes`.
- Migration : à l'init, si `m.plane` est une string qui correspond au nom d'un plan dans `DB.planes`, conserver la cohérence.  
**Fichiers touchés** : `js/modules/member-modal.js`, `js/modules/battlemaps.js`, `js/modules/aventure.js`, `js/core/db.js` (migration)  
**Risque** : Moyen-élevé — transversal. Bien tester les cas de rétrocompatibilité.

---

## V1.5 — Performance et stockage images

---

### Patch 12 — Stockage des images par chemin local plutôt que base64

**Problème** : Encoder les images en base64 dans IndexedDB alourdit considérablement le stockage et les performances (sérialisation, export JSON volumineux).  
**Solution** : Permettre de référencer une image par chemin relatif local (`./images/avatar.png`) au lieu de la stocker en base64.  
**Correction** :
- Créer un dossier `images/` à la racine du projet (documenté dans le README).
- Dans chaque formulaire d'upload d'image, ajouter une deuxième option : "🔗 Entrer un chemin local" (input texte).
- Si la valeur commence par `./` ou `/`, l'utiliser directement comme `src` sans passer par IndexedDB.
- Les images base64 existantes continuent de fonctionner (rétrocompatibilité totale).
- Dans l'export JSON, les chemins locaux sont exportés tels quels (légers) ; les base64 restent optionnels.

> **Limite** : Cette approche ne fonctionne qu'en `file://` ou serveur local. Documenter clairement.

**Fichiers touchés** : `js/modules/member-modal.js`, `js/modules/pnj.js`, `js/modules/aventure.js`, `js/modules/battlemaps.js`, `js/modules/medias.js`  
**Risque** : Moyen — changement de paradigme, mais non-destructif grâce à la rétrocompatibilité.

---

## V1.6 — Finalisation de la création d'aventurier

---

### Patch 13 — Création rapide d'aventurier guidée (MJ-friendly)

**Objectif** : Un MJ doit pouvoir créer un nouveau joueur en moins de 3 minutes en respectant les règles D&D 5e.  
**Correction** :
- Ajouter un bouton "✨ Création guidée" en plus du bouton "Nouvel aventurier" existant.
- Ce wizard en étapes (pas une modale unique) guide : Race → Classe → Niveau → Distribution des stats (méthode standard : 15/14/13/12/10/8, ou lancer de dés, ou achat de points) → Compétences maîtrisées selon classe/race → PV de départ calculés automatiquement → Équipement de départ selon classe.
- Chaque étape est une modale séquentielle (`step 1/5`, `step 2/5`…).
- Les stats, compétences, PV et équipement sont pré-remplis selon les choix — le MJ peut tout modifier ensuite.
- S'appuie sur `CLASS_RESOURCES` (déjà dans `data-store.js`) et sur `DND5E_FEATURES` (Patch 7).  
**Fichiers touchés** : `js/modules/aventuriers.js`, `js/modules/member-modal.js`, nouveau fichier `js/modules/member-wizard.js`  
**Risque** : Élevé — feature complexe, à faire en dernier de la V1.x.

---

## Ordre d'exécution recommandé

| Ordre | Patch | Complexité | Fichiers |
|-------|-------|------------|----------|
| 1 | Patch 2 — Supprimer onglet Combat | 🟢 Faible | 1 fichier |
| 2 | Patch 1 — Fix image Factions | 🟢 Faible | 2 fichiers |
| 3 | Patch 3 — Case Permanent bestiaire | 🟢 Faible | 1 fichier |
| 4 | Patch 9 — Classement PNJ | 🟢 Faible | 1 fichier |
| 5 | Patch 4 — Lier monstre à PNJ | 🟡 Moyen | 2 fichiers |
| 6 | Patch 6 — Uniformisation objets | 🟡 Moyen | 3 fichiers |
| 7 | Patch 5 — Base objets JSON externe | 🟡 Moyen | 3 fichiers |
| 8 | Patch 7 — Base compétences/dons | 🟡 Moyen | 3 fichiers |
| 9 | Patch 8 — Lore ↔ Aventure | 🟡 Moyen | 3 fichiers |
| 10 | Patch 10 — Plans + images/docs | 🟡 Moyen | 2 fichiers |
| 11 | Patch 12 — Images par chemin local | 🟡 Moyen | 5 fichiers |
| 12 | Patch 11 — Fusion Plans/Carousels | 🔴 Élevé | 4 fichiers |
| 13 | Patch 13 — Wizard création aventurier | 🔴 Élevé | 3 fichiers |

---

---

# Analyse V2.0 — Faisabilité, coûts, réalisme

## Vue d'ensemble

La V2.0 représente un changement de nature du projet : on passe d'une **webapp locale statique** à une **application SaaS multi-utilisateurs**. C'est techniquement faisable, mais c'est un projet à part entière — pas une extension de la V1.

---

## Feature par feature

### Déploiement web + comptes utilisateurs + paiement

**Faisabilité** : ✅ Réalisable  
**Ce que ça implique** :
- Remplacer localStorage/IndexedDB par une vraie base de données serveur (PostgreSQL, MongoDB, ou Supabase pour aller vite).
- Backend API (Node/Express, ou Supabase qui fournit tout ça out-of-the-box).
- Authentification (Auth0, Supabase Auth, ou custom JWT) — ne pas coder ça à la main.
- Paiement : Stripe est la référence, intégration ~1 semaine pour quelqu'un qui connaît.
- Hébergement : Vercel/Render pour le front, Supabase pour la BDD — coût ~20-50€/mois pour commencer.

**Temps estimé** : 2 à 4 mois pour une version stable, en travail soutenu.  
**Coût si développeur freelance** : 15 000 à 40 000€ selon profil.  
**Coût si fait soi-même** : quasi nul en argent, mais courbe d'apprentissage élevée si tu n'as pas de background backend.

---

### Version joueur synchronisée avec la version MJ

**Faisabilité** : ✅ Réalisable mais complexe  
**Ce que ça implique** :
- Système de "campagne partagée" : un MJ crée une campagne, les joueurs la rejoignent avec un code.
- Synchronisation en temps réel (WebSockets ou Supabase Realtime) pour que les actions du MJ (dégâts, conditions) se reflètent sur la fiche joueur.
- Interface joueur distincte et allégée (mobile-first idéalement).

**Temps estimé** : 3 à 6 mois en plus du déploiement de base.

---

### Éditeur de battlemap étoffe

**Faisabilité** : ✅ Réalisable  
**Mais** : c'est le chantier le plus long individuellement. Un éditeur de battlemap compétitif (Owlbear Rodeo, Foundry VTT) représente des années de développement. L'objectif réaliste est une version "bonne mais pas parfaite" en 3 à 4 mois.

---

### Stack technique moderne

**Recommandation** : React + TypeScript + Supabase + Tailwind CSS.  
- React pour la réactivité UI sans tout ré-écrire à la main.
- Supabase pour éviter de gérer un backend from scratch (BDD + Auth + Storage + Realtime inclus).
- Tailwind pour aller vite sur le design.
- La migration du code vanilla actuel vers React est un **réécriture partielle** — prévoir 1 à 2 mois rien que pour ça.

---

## Réalisme global du projet V2.0

| Critère | Évaluation |
|--------|------------|
| Faisabilité technique | ✅ Tout est faisable avec les technos actuelles |
| Complexité totale | 🔴 Élevée — c'est un vrai projet startup |
| Temps réaliste (seul, mi-temps) | 12 à 18 mois |
| Temps réaliste (équipe 2-3 devs) | 6 à 9 mois |
| Budget minimum viable (freelances) | 30 000 à 80 000€ |
| Concurrence | Foundry VTT, Roll20, Alchemy, Owlbear — marché existant |
| Différenciation possible | Oui : 100% en français, orienté MJ narratif, UX simple |
| Modèle économique réaliste | Freemium (MJ gratuit limité / premium ~5€/mois) ou one-shot ~15€ |

---

## Recommandation stratégique

Avant d'investir dans la V2.0, deux étapes intermédiaires ont du sens :

1. **Finir la V1.x proprement** et la distribuer en `file://` à une communauté de MJ francophones (Discord JDR, Reddit /r/DnDFR). Valider l'intérêt réel.
2. **Faire une V1.5-web minimale** : héberger le fichier `index.html` statique sur GitHub Pages (gratuit, zéro backend), avec export/import JSON comme mécanisme de "sauvegarde cloud" manuel. Ça donne une URL partageable sans aucune infra.

La V2.0 complète ne vaut l'investissement que si la V1 a une base d'utilisateurs actifs. Sans ça, le risque de construire quelque chose que personne n'utilise est élevé.
