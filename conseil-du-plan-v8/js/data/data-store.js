/**
 * DATA STORE — données démo, ITEM_DB si présent
 * Extrait de V7_6.html lignes 495-882
 */
// ================================================================
// ================================================================
// DATA STORE
// ================================================================
const STORE_KEY = 'cdp_v3';
const SPELL_SCHOOLS = ["Abjuration","Conjuration","Divination","Enchantement","Évocation","Illusion","Invocation","Nécromancie","Transmutation"];

// ── ALIGNEMENTS ─────────────────────────────────────────────────
const ALIGNMENTS = [
  'Loyal Bon','Neutre Bon','Chaotique Bon',
  'Loyal Neutre','Neutre','Chaotique Neutre',
  'Loyal Mauvais','Neutre Mauvais','Chaotique Mauvais'
];

// ── RACES D&D 5e ─────────────────────────────────────────────────
const RACES_5E = [
  'Humain','Elfe (Haut)','Elfe des Bois','Elfe Noir (Drow)',
  'Nain des Montagnes','Nain des Collines',
  'Halfelin (Pied-léger)','Halfelin (Robuste)',
  'Gnome des Rochers','Gnome des Forêts',
  'Demi-Elfe','Demi-Orque','Tieflin',
  'Aasimar','Dragonborn','Goliath','Triton','Tabaxi',
  'Yuan-ti Pur-sang','Kenku','Lizardfolk','Autre'
];

// ── RESSOURCES PAR CLASSE (V6) ──────────────────────────────────
// maxFormula : 'level'|'profBonus'|'level*5'|N (entier)|'rages_by_level'
const CLASS_RESOURCES = {
  'Barbare':    [{name:'Rages',icon:'😤',maxFormula:'rages_by_level',recharge:'repos long',color:'#ef4444'}],
  'Barde':      [{name:'Inspiration bardique',icon:'🎵',maxFormula:'profBonus',recharge:'repos court',color:'#8b5cf6'}],
  'Clerc':      [{name:'Renvoi des Morts-Vivants',icon:'☀️',maxFormula:'profBonus',recharge:'repos court',color:'#fbbf24'}],
  'Druide':     [{name:'Forme Sauvage',icon:'🐺',maxFormula:2,recharge:'repos court',color:'#22c55e'}],
  'Guerrier':   [{name:'Second Souffle',icon:'💨',maxFormula:1,recharge:'repos court',color:'#3b82f6'},
                 {name:'Action Héroïque',icon:'⚔️',maxFormula:1,recharge:'repos long',color:'#60a5fa'}],
  'Moine':      [{name:'Points de Ki',icon:'☯️',maxFormula:'level',recharge:'repos court',color:'#06b6d4'}],
  'Paladin':    [{name:'Imposition des Mains',icon:'✋',maxFormula:'level*5',recharge:'repos long',color:'#f59e0b'}],
  'Rôdeur':     [{name:'Faveur du Chasseur',icon:'🏹',maxFormula:'profBonus',recharge:'repos long',color:'#84cc16'}],
  'Roublard':   [{name:'Ruse (charges)',icon:'🎭',maxFormula:'profBonus',recharge:'repos court',color:'#94a3b8'}],
  'Sorcier':    [{name:'Points de Sorcellerie',icon:'🌑',maxFormula:'level',recharge:'repos long',color:'#7c3aed'}],
  'Ensorceleur':[{name:'Points de Sorcellerie',icon:'💫',maxFormula:'level',recharge:'repos long',color:'#c084fc'}],
  'Magicien':   [{name:'Récupération Arcanique',icon:'📖',maxFormula:1,recharge:'repos long',color:'#6366f1'}],
};

// → Calcule la valeur max d'une ressource selon la formule et le perso
function resolveResourceMax(formula, m){
  const lvl=m.level||1, prof=m.profBonus||2;
  if(typeof formula==='number') return formula;
  if(formula==='level')     return lvl;
  if(formula==='profBonus') return prof;
  if(formula==='level*5')   return lvl*5;
  if(formula==='rages_by_level') return lvl>=20?99:2+Math.floor(Math.max(0,lvl-1)/3);
  return 1;
}


// ── BASE DE DONNÉES D'ITEMS D&D 5e (V6.1) ──────────────────────
// ~220 objets standards issus du Manuel des Joueurs et de l'équipement
// Chaque item : {name, category, rarity, description, emoji, size}
const ITEM_DATABASE = [
  // ── ARMES COURANTES ──
  {name:'Dague',category:'Arme',rarity:'Commun',emoji:'🗡️',size:1,price:2,merchant:'forgeron',description:'Légère, finesse, lancer (6/18m). Dégâts : 1d4 perforant.'},
  {name:'Gourdin',category:'Arme',rarity:'Commun',emoji:'🪵',size:1,price:0.1,merchant:'forgeron',description:'Légère. Dégâts : 1d4 contondant.'},
  {name:'Hachette',category:'Arme',rarity:'Commun',emoji:'🪓',size:1,price:5,merchant:'forgeron',description:'Légère, lancer (6/18m). Dégâts : 1d6 tranchant.'},
  {name:'Javeline',category:'Arme',rarity:'Commun',emoji:'🏹',size:1,price:0.5,merchant:'forgeron',description:'Lancer (9/36m). Dégâts : 1d6 perforant.'},
  {name:'Marteau léger',category:'Arme',rarity:'Commun',emoji:'🔨',size:1,price:2,merchant:'forgeron',description:'Léger, lancer (6/18m). Dégâts : 1d4 contondant.'},
  {name:'Masse d\'armes',category:'Arme',rarity:'Commun',emoji:'⚔️',size:1,price:5,merchant:'forgeron',description:'Dégâts : 1d6 contondant.'},
  {name:'Bâton',category:'Arme',rarity:'Commun',emoji:'🪄',size:2,price:0.2,merchant:'forgeron',description:'Polyvalent (1d8). Dégâts : 1d6 contondant.'},
  {name:'Épée courte',category:'Arme',rarity:'Commun',emoji:'🗡️',size:1,price:10,merchant:'forgeron',description:'Finesse, légère. Dégâts : 1d6 perforant.'},
  {name:'Épée longue',category:'Arme',rarity:'Commun',emoji:'⚔️',size:2,price:15,merchant:'forgeron',description:'Polyvalent (1d10). Dégâts : 1d8 tranchant.'},
  {name:'Rapière',category:'Arme',rarity:'Commun',emoji:'🗡️',size:1,price:25,merchant:'forgeron',description:'Finesse. Dégâts : 1d8 perforant.'},
  {name:'Arc court',category:'Arme',rarity:'Commun',emoji:'🏹',size:2,price:25,merchant:'forgeron',description:'Munitions, portée (24/96m), à deux mains. Dégâts : 1d6 perforant.'},
  {name:'Arc long',category:'Arme',rarity:'Commun',emoji:'🏹',size:2,price:50,merchant:'forgeron',description:'Munitions, lourde, portée (45/180m), à deux mains. Dégâts : 1d8 perforant.'},
  {name:'Arbalète légère',category:'Arme',rarity:'Commun',emoji:'🏹',size:2,price:25,merchant:'forgeron',description:'Munitions, portée (24/96m), rechargement, à deux mains. Dégâts : 1d8 perforant.'},
  {name:'Arbalète de poing',category:'Arme',rarity:'Commun',emoji:'🏹',size:1,price:75,merchant:'forgeron',description:'Portée (9/36m). Dégâts : 1d6 perforant.'},
  {name:'Lance',category:'Arme',rarity:'Commun',emoji:'⚔️',size:2,price:1,merchant:'forgeron',description:'Lancer (6/18m), polyvalent (1d8). Dégâts : 1d6 perforant.'},
  {name:'Grande hache',category:'Arme',rarity:'Commun',emoji:'🪓',size:2,price:30,merchant:'forgeron',description:'Lourde, à deux mains. Dégâts : 1d12 tranchant.'},
  {name:'Épée à deux mains',category:'Arme',rarity:'Commun',emoji:'⚔️',size:2,price:50,merchant:'forgeron',description:'Lourde, à deux mains. Dégâts : 2d6 tranchant.'},
  {name:'Fléau d\'armes',category:'Arme',rarity:'Commun',emoji:'⚔️',size:2,price:10,merchant:'forgeron',description:'Dégâts : 1d8 contondant.'},
  {name:'Marteau de guerre',category:'Arme',rarity:'Commun',emoji:'🔨',size:2,price:15,merchant:'forgeron',description:'Polyvalent (1d10). Dégâts : 1d8 contondant.'},
  {name:'Trident',category:'Arme',rarity:'Commun',emoji:'🔱',size:2,price:5,merchant:'forgeron',description:'Lancer (6/18m), polyvalent (1d8). Dégâts : 1d6 perforant.'},
  // ── ARMURES ──
  {name:'Armure de cuir',category:'Armure',rarity:'Commun',emoji:'🧥',size:2,price:10,merchant:'forgeron',description:'CA 11 + Mod. DEX. Légère.'},
  {name:'Armure en peau',category:'Armure',rarity:'Commun',emoji:'🧥',size:2,price:10,merchant:'forgeron',description:'CA 12 + Mod. DEX (max +2). Intermédiaire.'},
  {name:'Chemise de mailles',category:'Armure',rarity:'Commun',emoji:'🛡️',size:3,price:50,merchant:'forgeron',description:'CA 13 + Mod. DEX (max +2). Intermédiaire.'},
  {name:'Armure d\'écailles',category:'Armure',rarity:'Commun',emoji:'🛡️',size:3,price:50,merchant:'forgeron',description:'CA 14 + Mod. DEX (max +2). Intermédiaire.'},
  {name:'Cuirasse',category:'Armure',rarity:'Commun',emoji:'🛡️',size:3,price:400,merchant:'forgeron',description:'CA 14 + Mod. DEX (max +2). Intermédiaire.'},
  {name:'Demi-plate',category:'Armure',rarity:'Peu commun',emoji:'🛡️',size:3,price:750,merchant:'forgeron',description:'CA 15 + Mod. DEX (max +2). Intermédiaire.'},
  {name:'Cotte de mailles',category:'Armure',rarity:'Commun',emoji:'🛡️',size:4,price:75,merchant:'forgeron',description:'CA 16. Lourde. FOR 13 requise.'},
  {name:'Armure de bandes',category:'Armure',rarity:'Commun',emoji:'🛡️',size:4,price:200,merchant:'forgeron',description:'CA 17. Lourde. FOR 15 requise.'},
  {name:'Harnois',category:'Armure',rarity:'Peu commun',emoji:'⚔️',size:4,price:1500,merchant:'forgeron',description:'CA 18. Lourde. FOR 15 requise.'},
  {name:'Bouclier',category:'Bouclier',rarity:'Commun',emoji:'🔰',size:1,price:10,merchant:'forgeron',description:'CA +2.'},
  // ── CASQUES & ACCESSOIRES ──
  {name:'Casque en acier',category:'Casque',rarity:'Commun',emoji:'⛑️',size:1,price:15,merchant:'forgeron',description:'Protection de la tête.'},
  {name:'Casque à cornes',category:'Casque',rarity:'Peu commun',emoji:'⛑️',size:1,price:45,merchant:'forgeron',description:'Impressionnant. Imposture +1 visuelle.'},
  {name:'Bottes de voyage',category:'Bottes',rarity:'Commun',emoji:'👢',size:1,price:5,merchant:'epicier',description:'Confort en voyage. Endurance améliorée.'},
  {name:'Bottes de vitesse',category:'Bottes',rarity:'Rare',emoji:'👢',size:1,price:2500,merchant:'enchanteur',description:'Double la vitesse de déplacement.'},
  {name:'Gants de travail',category:'Gants',rarity:'Commun',emoji:'🧤',size:1,price:2,merchant:'epicier',description:'Protection des mains.'},
  {name:'Gants de force du géant',category:'Gants',rarity:'Très rare',emoji:'🧤',size:1,price:8000,merchant:'enchanteur',description:'Force porte à 27.'},
  {name:'Cape de la Raie Manta',category:'Cape / Manteau',rarity:'Peu commun',emoji:'🧥',size:1,price:500,merchant:'enchanteur',description:'Respirer sous l\'eau, nager à 18m.'},
  {name:'Cape de protection',category:'Cape / Manteau',rarity:'Peu commun',emoji:'🧥',size:1,price:350,merchant:'enchanteur',description:'CA +1, jets de sauvegarde +1.'},
  {name:'Anneau de protection',category:'Bague / Anneau',rarity:'Rare',emoji:'💍',size:1,price:3500,merchant:'enchanteur',description:'CA +1, jets de sauvegarde +1.'},
  {name:'Anneau de feu',category:'Bague / Anneau',rarity:'Rare',emoji:'💍',size:1,price:5000,merchant:'enchanteur',description:'Résistance au feu. Lance boule de feu.'},
  {name:'Amulette de santé',category:'Amulette',rarity:'Rare',emoji:'📿',size:1,price:4000,merchant:'enchanteur',description:'Constitution porte à 19.'},
  {name:'Symbole sacré en argent',category:'Amulette',rarity:'Commun',emoji:'📿',size:1,price:25,merchant:'enchanteur',description:'Focaliseur d\'incantation pour Clerc/Paladin.'},
  // ── SACS & CONTENANTS ──
  {name:'Sac de randonnée',category:'Sac',rarity:'Commun',emoji:'🎒',size:2,price:5,merchant:'epicier',description:'24 cases supplémentaires.', bagBonus:24},
  {name:'Sac léger',category:'Sac',rarity:'Commun',emoji:'🎒',size:1,price:2,merchant:'epicier',description:'12 cases supplémentaires.', bagBonus:12},
  {name:'Besace',category:'Sac',rarity:'Commun',emoji:'👜',size:1,price:1,merchant:'epicier',description:'6 cases supplémentaires.', bagBonus:6},
  {name:'Sac sans fond',category:'Sac',rarity:'Rare',emoji:'🎒',size:1,price:4000,merchant:'enchanteur',description:'Contient jusqu\'à 500 kg dans un espace extra-dimensionnel.', bagBonus:50},
  // ── CONSOMMABLES & POTIONS ──
  {name:'Potion de soins',category:'Consommable',rarity:'Commun',emoji:'🧪',size:1,price:50,merchant:'alchimiste',description:'Restaure 2d4+2 PV.'},
  {name:'Potion de soins supérieure',category:'Consommable',rarity:'Peu commun',emoji:'🧪',size:1,price:150,merchant:'alchimiste',description:'Restaure 4d4+4 PV.'},
  {name:'Potion de soins excellente',category:'Consommable',rarity:'Rare',emoji:'🧪',size:1,price:500,merchant:'alchimiste',description:'Restaure 8d4+8 PV.'},
  {name:'Potion de soins suprême',category:'Consommable',rarity:'Très rare',emoji:'🧪',size:1,price:1500,merchant:'alchimiste',description:'Restaure 10d4+20 PV.'},
  {name:'Antidote',category:'Consommable',rarity:'Commun',emoji:'💉',size:1,price:50,merchant:'alchimiste',description:'Immunité contre le poison pendant 1h.'},
  {name:'Philtre d\'amour',category:'Consommable',rarity:'Peu commun',emoji:'💘',size:1,price:200,merchant:'alchimiste',description:'Cible charmée pendant 1h.'},
  {name:'Huile de glissance',category:'Consommable',rarity:'Peu commun',emoji:'🫙',size:1,price:100,merchant:'alchimiste',description:'Surface extrêmement glissante pendant 8h.'},
  {name:'Potion de force de géant',category:'Consommable',rarity:'Peu commun',emoji:'💪',size:1,price:250,merchant:'alchimiste',description:'FOR porte à 21 pendant 1h.'},
  {name:'Potion de vol',category:'Consommable',rarity:'Rare',emoji:'🧪',size:1,price:500,merchant:'alchimiste',description:'Vitesse de vol 18m pendant 1h.'},
  {name:'Potion d\'invisibilité',category:'Consommable',rarity:'Très rare',emoji:'👻',size:1,price:2000,merchant:'alchimiste',description:'Invisibilité jusqu\'à la fin du prochain tour.'},
  {name:'Elixir de santé',category:'Consommable',rarity:'Rare',emoji:'🧪',size:1,price:600,merchant:'alchimiste',description:'Guérit toutes les maladies et poisons.'},
  {name:'Huile d\'affûtage',category:'Consommable',rarity:'Peu commun',emoji:'🫙',size:1,price:120,merchant:'alchimiste',description:'+2 jets d\'attaque et dégâts pour 10 min.'},
  // ── ÉQUIPEMENT D'AVENTURIER ──
  {name:'Corde de chanvre (15m)',category:'Équipement',rarity:'Commun',emoji:'🪢',size:2,price:1,merchant:'epicier',description:'Résistance 2 points. FOR DC 17 pour casser.'},
  {name:'Corde de soie (15m)',category:'Équipement',rarity:'Peu commun',emoji:'🪢',size:1,price:10,merchant:'epicier',description:'Plus légère et plus solide que le chanvre.'},
  {name:'Torche',category:'Équipement',rarity:'Commun',emoji:'🔦',size:1,price:0.01,merchant:'epicier',description:'Lumière vive 6m, faible 6m supplémentaires. Dure 1h.'},
  {name:'Lanterne sourde',category:'Équipement',rarity:'Commun',emoji:'🪔',size:1,price:5,merchant:'epicier',description:'Lumière vive 9m en cône, faible 9m. Dure 6h avec huile.'},
  {name:'Lanterne bullseye',category:'Équipement',rarity:'Commun',emoji:'🪔',size:1,price:10,merchant:'epicier',description:'Lumière vive 18m en cône. Dure 6h.'},
  {name:'Huile (flasque)',category:'Consommable',rarity:'Commun',emoji:'🫙',size:1,price:0.1,merchant:'epicier',description:'Combustible pour lanterne. Peut être enflammée (1d4 feu).'},
  {name:'Rations (1 jour)',category:'Consommable',rarity:'Commun',emoji:'🍞',size:1,price:0.5,merchant:'epicier',description:'Nourriture sèche pour 1 journée d\'aventure.'},
  {name:'Eau (outre)',category:'Équipement',rarity:'Commun',emoji:'🫗',size:1,price:0.2,merchant:'epicier',description:'Contient 4 litres d\'eau.'},
  {name:'Kit de premiers soins',category:'Équipement',rarity:'Commun',emoji:'🩹',size:1,price:5,merchant:'alchimiste',description:'10 utilisations. Stabilise une créature mourante.'},
  {name:'Grappin',category:'Équipement',rarity:'Commun',emoji:'⚓',size:1,price:2,merchant:'forgeron',description:'Accrocher et grimper.'},
  {name:'Pied de biche',category:'Équipement',rarity:'Commun',emoji:'🔧',size:1,price:2,merchant:'forgeron',description:'+2 aux tests de Force pour ouvrir.'},
  {name:'Marteau',category:'Équipement',rarity:'Commun',emoji:'🔨',size:1,price:1,merchant:'forgeron',description:'Outil polyvalent.'},
  {name:'Piton (10)',category:'Équipement',rarity:'Commun',emoji:'📌',size:1,price:0.5,merchant:'forgeron',description:'Bloquer portes, ancrer cordes.'},
  {name:'Couverture',category:'Équipement',rarity:'Commun',emoji:'🛏️',size:2,price:0.5,merchant:'epicier',description:'Confort et chaleur lors des repos.'},
  {name:'Tente (2 personnes)',category:'Équipement',rarity:'Commun',emoji:'⛺',size:3,price:2,merchant:'epicier',description:'Abri portable.'},
  {name:'Loupe',category:'Équipement',rarity:'Commun',emoji:'🔍',size:1,price:100,merchant:'enchanteur',description:'+2 Investigation sur petits objets.'},
  {name:'Longue-vue',category:'Équipement',rarity:'Peu commun',emoji:'🔭',size:1,price:1000,merchant:'enchanteur',description:'Voir jusqu\'à 2 km avec clarté.'},
  {name:'Matériel d\'escalade',category:'Équipement',rarity:'Commun',emoji:'🧗',size:2,price:25,merchant:'epicier',description:'Pitons, sangles, mousquetons. +4 Athlétisme escalade.'},
  // ── OUTILS ──
  {name:'Outils de voleur',category:'Outil',rarity:'Commun',emoji:'🗝️',size:1,price:25,merchant:'epicier',description:'Nécessaires pour crocheter les serrures.'},
  {name:'Outils de forgeron',category:'Outil',rarity:'Commun',emoji:'⚒️',size:4,price:20,merchant:'forgeron',description:'Fabriquer et réparer des objets en métal.'},
  {name:'Outils d\'herboriste',category:'Outil',rarity:'Commun',emoji:'🌿',size:1,price:5,merchant:'alchimiste',description:'Identifier et préparer des herbes.'},
  {name:'Outils d\'empoisonneur',category:'Outil',rarity:'Commun',emoji:'☠️',size:1,price:50,merchant:'alchimiste',description:'Fabriquer et appliquer des poisons.'},
  {name:'Instruments de navigateur',category:'Outil',rarity:'Peu commun',emoji:'🧭',size:2,price:25,merchant:'epicier',description:'Naviguer à la mer et en terrain inconnu.'},
  {name:'Matériel de déguisement',category:'Outil',rarity:'Commun',emoji:'🎭',size:2,price:25,merchant:'epicier',description:'Tromperie (Déguisement).'},
  {name:'Instruments musicaux (luth)',category:'Outil',rarity:'Commun',emoji:'🎸',size:2,price:35,merchant:'epicier',description:'Représentation +2 (avec maîtrise).'},
  {name:'Kit de calligraphie',category:'Outil',rarity:'Commun',emoji:'✍️',size:1,price:10,merchant:'epicier',description:'Copier documents, faux.'},
  // ── MAGIE & ARTEFACTS ──
  {name:'Baguette magique (10 charges)',category:'Magie',rarity:'Peu commun',emoji:'🪄',size:1,price:300,merchant:'enchanteur',description:'Peut lancer des sorts mineurs selon le type.'},
  {name:'Bâton du mage',category:'Magie',rarity:'Rare',emoji:'🪄',size:2,price:2000,merchant:'enchanteur',description:'Focaliseur d\'incantation. +2 jets d\'attaque de sort.'},
  {name:'Orbe de focalisation',category:'Magie',rarity:'Commun',emoji:'🔮',size:1,price:25,merchant:'enchanteur',description:'Focaliseur d\'incantation arcanique.'},
  {name:'Composantes d\'incantation',category:'Magie',rarity:'Commun',emoji:'✨',size:1,price:10,merchant:'enchanteur',description:'Sachet de composantes variées pour sorts de bas niveau.'},
  {name:'Parchemin de sort (Niv.1)',category:'Magie',rarity:'Commun',emoji:'📜',size:1,price:50,merchant:'enchanteur',description:'Contient un sort de niveau 1 à usage unique.'},
  {name:'Parchemin de sort (Niv.2)',category:'Magie',rarity:'Peu commun',emoji:'📜',size:1,price:120,merchant:'enchanteur',description:'Contient un sort de niveau 2 à usage unique.'},
  {name:'Parchemin de sort (Niv.3)',category:'Magie',rarity:'Peu commun',emoji:'📜',size:1,price:200,merchant:'enchanteur',description:'Contient un sort de niveau 3 à usage unique.'},
  {name:'Parchemin de sort (Niv.4-5)',category:'Magie',rarity:'Rare',emoji:'📜',size:1,price:500,merchant:'enchanteur',description:'Contient un sort de niveau 4 ou 5 à usage unique.'},
  {name:'Pierre de réveil',category:'Magie',rarity:'Peu commun',emoji:'🔮',size:1,price:200,merchant:'enchanteur',description:'Message télépathique à portée 1,5 km.'},
  {name:'Anneau de résistance (feu)',category:'Bague / Anneau',rarity:'Rare',emoji:'💍',size:1,price:6000,merchant:'enchanteur',description:'Résistance aux dégâts de feu.'},
  {name:'Bottes elfiques',category:'Bottes',rarity:'Peu commun',emoji:'👢',size:1,price:500,merchant:'enchanteur',description:'Déplacements silencieux. Discrétion avec avantage.'},
  {name:'Gants des ogres',category:'Gants',rarity:'Peu commun',emoji:'🧤',size:1,price:400,merchant:'enchanteur',description:'FOR +5 (max 19).'},
  {name:'Sac de contenance',category:'Sac',rarity:'Rare',emoji:'🎒',size:1,price:5000,merchant:'enchanteur',description:'1000 kg max, 30 cases. Pèse toujours 7,5 kg.', bagBonus:30},
  {name:'Grimoire',category:'Magie',rarity:'Commun',emoji:'📖',size:2,price:50,merchant:'enchanteur',description:'Recueil de sorts du magicien. 100 pages.'},
  {name:'Symbole sacré (fer)',category:'Amulette',rarity:'Commun',emoji:'✝️',size:1,price:5,merchant:'enchanteur',description:'Focaliseur divin.'},
  {name:'Bâton druidique',category:'Magie',rarity:'Commun',emoji:'🌿',size:2,price:10,merchant:'enchanteur',description:'Focaliseur druidique naturel.'},
  {name:'Fragment de Pierre d\'Ancre',category:'Artefact',rarity:'Très rare',emoji:'⚗️',size:1,price:10000,merchant:'enchanteur',description:'Stabilise les portails planaires dans un rayon de 90m.'},
  {name:'Œil de Vérité',category:'Artefact',rarity:'Légendaire',emoji:'👁️',size:1,price:50000,merchant:'enchanteur',description:'Détecte les mensonges et illusions à 9m.'},
  {name:'Cristal d\'âme',category:'Artefact',rarity:'Rare',emoji:'💎',size:1,price:5000,merchant:'enchanteur',description:'Emprisonne une âme. Nécessite une action pour activer.'},
];

// ── MARCHANDS (V7.2) ────────────────────────────────────────────
const MERCHANTS = {
  forgeron:    {name:'Bjorn le Forgeron',     icon:'⚒️', emoji:'🔨', color:'#ef4444', desc:'Armes, armures et métaux', stock:8},
  alchimiste:  {name:'Elara l\'Alchimiste',   icon:'⚗️', emoji:'🧪', color:'#a78bfa', desc:'Potions, élixirs et poisons', stock:6},
  epicier:     {name:'Gundren l\'Épicier',     icon:'🏪', emoji:'🎒', color:'#22c55e', desc:'Équipement, vivres et outils', stock:10},
  enchanteur:  {name:'Sylas l\'Enchanteur',    icon:'✨', emoji:'🔮', color:'#6366f1', desc:'Objets magiques et artefacts', stock:5},
};

// → Recherche dans la base d'items : retourne les items correspondant à la query
function searchItemDatabase(query, category=''){
  const q = query.toLowerCase().trim();
  return ITEM_DATABASE.filter(i=>{
    const matchQ = !q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
    const matchC = !category || i.category===category;
    return matchQ && matchC;
  });
}

// → Initialise les ressources par défaut selon la classe du perso
function initClassResources(m){
  const templates=CLASS_RESOURCES[(m.clazz||'').trim()];
  if(!templates) return;
  templates.forEach(tpl=>{
    if(m.resources.find(r=>r.name===tpl.name)) return;
    const maxVal=resolveResourceMax(tpl.maxFormula,m);
    m.resources.push({id:uid(),name:tpl.name,icon:tpl.icon,current:maxVal,max:maxVal,
      maxFormula:tpl.maxFormula,recharge:tpl.recharge,color:tpl.color});
  });
}

// → Recharge des ressources (repos court ou long)
function doRest(memberId, type){
  // type : 'court' | 'long'
  const m=DB.members.find(x=>x.id===memberId); if(!m) return;
  (m.resources||[]).forEach(r=>{
    if(type==='long') r.current=r.max;
    else if(type==='court'&&r.recharge==='repos court') r.current=r.max;
  });
  if(type==='long'){ // PV max restaurés aussi
    if(m.hp) m.hp.current=m.hp.max;
  }
  save(); renderMemberDetail(); updateStats();
  toast(type==='long'?'🌙 Repos long — toutes les ressources rechargées !':'⏳ Repos court — ressources courtes rechargées');
}

const SPELL_LEVELS = ["Tour de magie","Niveau 1","Niveau 2","Niveau 3","Niveau 4","Niveau 5","Niveau 6","Niveau 7","Niveau 8","Niveau 9"];
const CAST_TIMES = ["1 action","1 action bonus","1 réaction","1 minute","10 minutes","1 heure","8 heures","Rituel (10 min)"];
const DURATIONS = ["Instantanée","1 round","1 minute","10 minutes","1 heure","8 heures","24 heures","Jusqu'à dissipation","Concentration (1 min)","Concentration (1h)"];
const RANGES = ["Contact","1,5 m","6 m","9 m","18 m","27 m","36 m","45 m","90 m","150 m","Personnelle","Illimité"];

// ── STATUTS ET RELATIONS PNJ (V6.1) ───────────────────────────
const NPC_STATUSES = {
  'vivant':   {label:'Vivant',   color:'#22c55e', icon:'💚'},
  'disparu':  {label:'Disparu',  color:'#f59e0b', icon:'❓'},
  'mort':     {label:'Mort',     color:'#ef4444', icon:'💀'},
  'allié':    {label:'Allié',    color:'#3b82f6', icon:'🤝'},
  'ennemi':   {label:'Ennemi',   color:'#ef4444', icon:'⚔️'},
  'neutre':   {label:'Neutre',   color:'#9ca3af', icon:'😐'},
  'inconnu':  {label:'Inconnu',  color:'#6b7280', icon:'👤'},
};
const NPC_RELATION_TYPES = ['Allié','Ennemi','Rival','Mentor','Disciple','Famille','Employeur','Client','Neutre'];


// ── CONDITIONS D&D 5e (V6.2) ─────────────────────────────────
const CONDITIONS = {
  'Aveuglé':    {icon:'🙈', color:'#9ca3af', desc:'Échoue auto. en Perception visuelle, désavantage attaques'},
  'Charmé':     {icon:'💜', color:'#a78bfa', desc:'Ne peut attaquer le charmeur, avantage en Persuasion'},
  'Effrayé':    {icon:'😱', color:'#f59e0b', desc:'Désavantage jets/attaques si source en vue'},
  'Empoisonné': {icon:'🟢', color:'#22c55e', desc:'Désavantage jets d\'attaque et de caractéristiques'},
  'Étourdi':    {icon:'⭐', color:'#fbbf24', desc:'Incapacité, échoue FOR/DEX, attaques avec avantage'},
  'Incapacité': {icon:'💤', color:'#6b7280', desc:'Ne peut prendre aucune action ni réaction'},
  'Invisible':  {icon:'👻', color:'#e5e7eb', desc:'Avantage attaques, désavantage ennemis vs lui'},
  'Paralysé':   {icon:'⚡', color:'#ef4444', desc:'Incapacité, échoue FOR/DEX, attaques crit au contact'},
  'Pétrifié':   {icon:'🪨', color:'#78716c', desc:'Transformé en pierre, incapacité, résistances'},
  'Renversé':   {icon:'🔽', color:'#3b82f6', desc:'Désavantage attaques, avantage contre lui au contact'},
  'Terrorisé':  {icon:'💀', color:'#dc2626', desc:'Vitesse 0, désavantage, doit fuir la source'},
  'Entravé':    {icon:'⛓️',  color:'#d97706', desc:'Vitesse 0, désavantage attaques/DEX'},
  'Saignement': {icon:'🩸', color:'#ef4444', desc:'Perd 1d4 PV au début de son tour'},
  'Concentré':  {icon:'🎯', color:'#6366f1', desc:'Maintient un sort de concentration'},
  'Rageur':     {icon:'😤', color:'#f97316', desc:'En rage — bonus dégâts, résistance'},
};

// ── LOOT TABLES PAR TIER DE FP (V6.2) ────────────────────────
// Tier 0 (FP 0-1), Tier 1 (FP 1-4), Tier 2 (FP 5-10),
// Tier 3 (FP 11-16), Tier 4 (FP 17+)
const LOOT_TIERS = [
  { label:'Bas (FP 0–4)',   min:0,  max:4,  gold:{min:0,max:20},   rolls:1, rarities:['Commun'] },
  { label:'Moyen (FP 5–10)',min:5,  max:10, gold:{min:10,max:100}, rolls:2, rarities:['Commun','Peu commun'] },
  { label:'Haut (FP 11–16)',min:11, max:16, gold:{min:50,max:300}, rolls:2, rarities:['Peu commun','Rare'] },
  { label:'Légend. (FP 17+)',min:17,max:99, gold:{min:200,max:1000},rolls:3, rarities:['Rare','Très rare','Légendaire'] },
];

function getLootTier(cr){
  const n = parseFloat(cr)||0;
  return LOOT_TIERS.find(t=>n>=t.min&&n<=t.max) || LOOT_TIERS[0];
}

// → Génère un loot aléatoire selon le FP de la créature
// Retourne {gold, items:[]}
function generateLoot(cr){
  const tier = getLootTier(cr);
  const gold  = tier.gold.min + Math.floor(Math.random()*(tier.gold.max-tier.gold.min+1));
  const items = [];
  for(let i=0;i<tier.rolls;i++){
    const rarity = tier.rarities[Math.floor(Math.random()*tier.rarities.length)];
    const pool   = ITEM_DATABASE.filter(x=>x.rarity===rarity);
    if(pool.length) items.push({...pool[Math.floor(Math.random()*pool.length)], qty:1, id:uid()});
  }
  // Chance 25% d'un item d'une rareté supérieure
  if(Math.random()<.25 && tier.rarities.length>1){
    const nextRarity = tier.rarities[tier.rarities.length-1];
    const pool2 = ITEM_DATABASE.filter(x=>x.rarity===nextRarity);
    if(pool2.length) items.push({...pool2[Math.floor(Math.random()*pool2.length)], qty:1, id:uid()});
  }
  return {gold, items};
}

const MEDIA_TYPES = {audio:"🎵",image:"🖼️",map:"🗺️",document:"📄",video:"🎬",other:"📎"};

const DEFAULT = {
  members:[
    {id:1,name:"Aelindra Voss",clazz:"Magicienne",level:7,plane:"Plan Matériel",avatar:"🧙‍♀️",avatarImg:null,
     isNpc:false,linkedNpcId:null,
     pdf:null,pdfName:null,
     stats:{str:10,dex:14,con:12,int:18,wis:13,cha:16},
     hp:{current:38,max:38},ac:13,speed:"9m",
     profBonus:3,initiative:"+2",
     gold:{pp:0,po:45,pa:12,pc:30},
     extraFields:[{key:"École de magie",val:"Transmutation"},{key:"Sort signature",val:"Boule de feu"}],
     weapons:[{name:"Bâton magique",atk:"+5",dmg:"1d6+2",icon:null}],
     spells:[
       {id:101,name:"Boule de feu",level:"Niveau 3",school:"Évocation",castTime:"1 action",range:"45 m",components:"V, S, M",duration:"Instantanée",concentration:false,ritual:false,description:"Une boule de feu explose depuis votre doigt en un point que vous choisissez à portée. Chaque créature dans une sphère de 6 m de rayon centrée sur ce point doit effectuer un jet de sauvegarde de Dextérité (DD 14). Elle subit 8d6 dégâts de feu en cas d'échec, ou la moitié en cas de succès.",icon:null},
       {id:102,name:"Téléportation",level:"Niveau 7",school:"Conjuration",castTime:"1 action",range:"3 m",components:"V",duration:"Instantanée",concentration:false,ritual:false,description:"Ce sort téléporte immédiatement vous et jusqu'à huit créatures consentantes de votre choix que vous voyez à portée.",icon:null},
     ],
     inventory:[
       {id:101,name:"Bâton des Éclairs",qty:1,category:"Arme",rarity:"Rare",icon:null},
       {id:102,name:"Grimoire des Arcanes",qty:1,category:"Magie",rarity:"Très rare",icon:null},
     ]},
    {id:2,name:"Korvath le Brisé",clazz:"Paladin",level:6,plane:"Plan Astral",avatar:"⚔️",avatarImg:null,
     isNpc:false,linkedNpcId:null,
     pdf:null,pdfName:null,
     stats:{str:18,dex:10,con:16,int:10,wis:14,cha:16},
     hp:{current:55,max:55},ac:18,speed:"9m",
     profBonus:3,initiative:"+0",
     gold:{pp:2,po:18,pa:5,pc:0},
     extraFields:[{key:"Divinité",val:"Bahamut"},{key:"Serment",val:"Serment de Dévotion"}],
     weapons:[{name:"Épée longue",atk:"+7",dmg:"1d8+4",icon:null}],
     spells:[
       {id:201,name:"Frappe divine",level:"Niveau 2",school:"Évocation",castTime:"1 action bonus",range:"Personnelle",components:"V",duration:"Concentration (1 min)",concentration:true,ritual:false,description:"La prochaine fois que vous touchez une créature avec une arme de corps à corps au cours de ce sort, votre frappe délivre un tonnerre céleste. L'attaque inflige 2d8 dégâts de tonnerre supplémentaires.",icon:null},
     ],
     inventory:[
       {id:201,name:"Épée Sainte de Bahamut",qty:1,category:"Arme",rarity:"Très rare",icon:null},
     ]},
  ],
  guildInventory:[
    {id:1,name:"Parchemin de Téléportation",qty:3,category:"Magie",rarity:"Rare",description:"Permet de se téléporter vers un plan connu.",icon:null},
    {id:2,name:"Pierre d'Ancrage Planaire",qty:7,category:"Artefact",rarity:"Peu commun",description:"Stabilise le voyage entre plans.",icon:null},
    {id:3,name:"Potion de Soin Supérieure",qty:12,category:"Consommable",rarity:"Commun",description:"Restaure 4d4+4 PV.",icon:null},
    {id:4,name:"Boussole des Plans",qty:1,category:"Artefact",rarity:"Très rare",description:"Indique tout plan connu.",icon:null},
  ],
  // V6.1 : Chroniques (plusieurs fils narratifs)
  chronicles:[
    {id:1, title:'Chronique principale', color:'#6366f1', icon:'📜'}
  ],
  journal:[
    {id:1,title:"L'Éveil du Conseil",date:"Jour 1, Lune Froide",author:"Aelindra Voss",authorId:1,plane:"Plan Matériel",
     content:"Nous nous sommes retrouvés dans la grande salle du Nexus — ce carrefour entre les plans que peu d'élus peuvent percevoir. La guilde prenait forme. Les anciens nous ont confié notre première mission : stabiliser une fissure planaire dans les bas-fonds de Sigil.",
     tags:["fondation","sigil","fissure"],participants:[1,2]},
    {id:2,title:"Les Démons du Plan Astral",date:"Jour 14, Lune Froide",author:"Korvath le Brisé",authorId:2,plane:"Plan Astral",
     content:"La traversée du Plan Astral ne ressemble à rien de ce que j'avais connu. Nos corps flottaient dans un éther argenté, nos pensées amplifiées jusqu'à devenir presque douloureuses. Les githyanki nous ont tendu une embuscade près du cadavre d'un dieu mort.",
     tags:["astral","combat","githyanki"],participants:[1,2]},
  ],
  npcs:[
    {id:1,name:"Meridian l'Éternel",role:"Maître de Guilde",age:"Inconnu",race:"Homme Planaire",avatar:"👴",avatarImg:null,
     personality:"Sage, énigmatique, parle par métaphores",
     description:"Le fondateur supposé du Conseil. Nul ne connaît son véritable âge. Il observe plus qu'il n'agit.",
     secrets:"Il serait lui-même un ancien dieu déchu ayant choisi la mortalité.",location:"Salle du Nexus"},
    {id:2,name:"Cassidy «Deux-Doigts»",role:"Intendante",age:"42 ans",race:"Halfeline",avatar:"💼",avatarImg:null,
     personality:"Pragmatique, légèrement cupide, fiable",
     description:"Responsable des stocks et de la logistique. Elle a perdu deux doigts dans une transaction githzerai.",
     secrets:"Elle détourne des fonds pour libérer sa sœur prisonnière dans le Plan du Feu.",location:"Entrepôt"},
    {id:3,name:"Zephyros le Souffleur",role:"Guide des Plans",age:"230 ans",race:"Djinn Lié",avatar:"🌪️",avatarImg:null,
     personality:"Exubérant, théâtral, passionné",
     description:"Un djinn qui connaît les routes entre plans mieux que quiconque.",
     secrets:"Son vœu sacré est de retrouver son frère disparu dans le Plan du Chaos.",location:"Tour de Navigation"},
    {id:4,name:"Sœur Mourne",role:"Guérisseuse",age:"60 ans",race:"Humaine",avatar:"⚕️",avatarImg:null,
     personality:"Douce, mélancolique, empathique",
     description:"Ancienne aventurière reconvertie. Elle soigne corps et âmes.",
     secrets:"Elle entend encore les voix de ses compagnons morts.",location:"Infirmerie"},
  ],
  battlemaps:[
    {id:1,name:"Carrefour de Sigil",width:20,height:14,terrain:"urban",bgImage:null,
     tokens:[
       {id:"t1",x:3,y:4,label:"A",color:"#4ade80",type:"ally"},
       {id:"t2",x:12,y:7,label:"E",color:"#f87171",type:"enemy"},
     ],notes:"Embuscade githyanki. Ruelles à l'est."},
  ],
  media:[],
  bestiary:[],
  merchants:{},
  merchantItems:{},
  customPlanes:[],
  planes:[],
  timelineGroups:[],
  wealth:{pp:0,po:0,pa:0,pc:0,lingots:0,tresor:''},
  guildBank:{pp:0,po:0,pa:0,pc:0},
  quests:[],       // V6.3 : {id, title, giver, status, priority, description, objectives:[{id,text,done}], reward, notes, tags:[], createdAt}
  factions:[],     // V6.3 : {id, icon, name, description, attitude, members:[], notes}
  timeline:[],     // V6.3 : {id, date, title, description, type, questId, linkedIds:[]}
  sessionNotes:[], // V6.3 : {id, session, date, title, content, tags:[]}
  locations:[],
  guildChests:[],
  market:[],
  treasures:[]
};

