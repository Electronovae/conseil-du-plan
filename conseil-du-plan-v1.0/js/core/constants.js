/**
 * Guide dev + constantes STORE_KEY, SPELL_SCHOOLS, etc.
 * Extrait de V7_6.html lignes 433-494
 */
// ================================================================
// 🗂️  CONSEIL DU PLAN — Guide développeur VSCode
// ================================================================
//
// STRUCTURE DU FICHIER (tout est dans ce fichier HTML autonome) :
//
//  📦 DONNÉES (ligne ~260)
//     • STORE_KEY    : clé localStorage ('cdp_v3')
//     • DEFAULT      : données de démonstration initiales
//     • DB           : objet en mémoire, chargé depuis localStorage
//     • save()       : écrit DB dans localStorage + met à jour stats
//     • uid()        : génère un ID unique (timestamp + random)
//
//  🎨 UI HELPERS (ligne ~395)
//     • toast()      : notification temporaire en bas à droite
//     • openModal()  : ouvre une modale
//     • closeModal() : ferme la modale
//     • avatarEl()   : génère le HTML d'un avatar (emoji ou image)
//     • badge()      : badge coloré de rareté
//     • planeTag()   : badge de plan
//     • modStr()     : calcule le modificateur D&D (ex: 14 → "+2")
//
//  ⚔️  MODULE AVENTURIERS (ligne ~500)
//     • renderMembers()        : affiche la liste + fiche
//     • openMemberModal(id)    : formulaire de création/édition
//     • saveMember(editId)     : sauvegarde dans DB.members
//     ⚠️  Les sous-modales SORTS et INVENTAIRE modifient
//         window._editMember directement (pas de rechargement modal)
//
//  ⚖️  MODULE INVENTAIRE (ligne ~1460)
//     • DB.guildInventory       : coffre de la guilde
//     • DB.members[n].inventory : inventaire personnel
//
//  📜 MODULE JOURNAL (ligne ~1655)
//     • entry.participants[]    : IDs des membres présents
//     • entry.authorId          : ID du membre auteur (lien cliquable)
//
//  🎭 MODULE PNJ (ligne ~1755)
//     • DB.npcs[]               : liste des PNJ
//
//  🗺️  MODULE BATTLEMAP (ligne ~1830)
//     • token.memberId          : lien vers DB.members[n].id
//     • token.beastId           : lien vers DB.bestiary[n].id
//     • token.image             : image personnalisée (base64)
//
//  🐉 MODULE BESTIAIRE (ligne ~2070)
//     • DB.bestiary[]           : créatures avec statblock complet
//     • addBeastToMap(id)       : place la créature sur la map active
//
//  🎵 MODULE MÉDIAS (ligne ~2005)
//     • DB.media[]              : sons, images, cartes, documents
//
//  💾 EXPORT / IMPORT (ligne ~2200)
//     • exportData()  : télécharge un .json
//     • importData()  : importe un .json + recharge la page
//
// AJOUTER UNE FEATURE :
//  1. Ajoute tes données dans DEFAULT et la migration DB (ligne ~310)
//  2. Crée tes fonctions render/open/save dans la bonne section
//  3. Si nouveau module : ajoute un bouton nav + div#module-xxx + 
//     un case dans renderModule()
//
