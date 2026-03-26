/**
 * INIT — theme, fonts, hydrate
 * Extrait de V7_6.html lignes 9053-9237
 */
// ================================================================
// INIT
// ================================================================
if(localStorage.getItem('cdp_theme')==='light'){
  document.body.classList.add('light-mode');
  const btn=document.getElementById('theme-btn');
  if(btn) btn.textContent='☀️';
}
updateStats();
renderMembers();
selectMember(DB.members[0]?.id||null);
renderMemberDetail();
// Charger les blobs depuis IndexedDB (async, non bloquant)
_bootImport().then(()=>loadBlobsIntoDB());

// ── IMPRESSION / EXPORT PDF (V6.1) ─────────────────────────────
// Construit le HTML de la fiche perso et lance window.print()
// IMPORTANT : utilise la concaténation (+) pour éviter les problèmes
// de template literals imbriqués lors de la manipulation du fichier
function generatePrintSheet(m){
  if(!m){ toast('Aucun personnage sélectionné'); return; }

  const e2 = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const m2 = v => { const n=Math.floor(((v||10)-10)/2); return (n>=0?'+':'')+n; };
  const bStr = n => (n>=0?'+':'')+n;
  const stats = m.stats||{str:10,dex:10,con:10,int:10,wis:10,cha:10};
  const SLBL = {str:'FOR',dex:'DEX',con:'CON',int:'INT',wis:'SAG',cha:'CHA'};
  const SK2=[
    {n:'Acrobaties',a:'dex'},{n:'Arcanes',a:'int'},{n:'Athlétisme',a:'str'},
    {n:'Discrétion',a:'dex'},{n:'Dressage',a:'wis'},{n:'Escamotage',a:'dex'},
    {n:'Histoire',a:'int'},{n:'Intimidation',a:'cha'},{n:'Investigation',a:'int'},
    {n:'Médecine',a:'wis'},{n:'Nature',a:'int'},{n:'Perception',a:'wis'},
    {n:'Perspicacité',a:'wis'},{n:'Persuasion',a:'cha'},{n:'Religion',a:'int'},
    {n:'Représentation',a:'cha'},{n:'Survie',a:'wis'},{n:'Tromperie',a:'cha'},
  ];

  // Construction du HTML par concaténation (pas de template literals imbriqués)
  let html = '<div style="font-family:Georgia,serif;color:#111;max-width:800px;margin:0 auto">';

  // ── EN-TÊTE ──────────────────────────────────────────────────
  html += '<div style="display:flex;align-items:center;gap:14px;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:14px">';
  html += '<div style="font-size:42px">' + (m.avatar||'⚔️') + '</div>';
  html += '<div style="flex:1">';
  html += '<div style="font-size:20pt;font-weight:900;font-family:serif">' + e2(m.name) + '</div>';
  html += '<div style="font-size:11pt;color:#444">'
       + e2(m.clazz||'') + ' · Niveau ' + (m.level||1)
       + (m.race ? ' · ' + e2(m.race) : '')
       + (m.alignment ? ' · ' + e2(m.alignment) : '') + '</div>';
  if(m.background) html += '<div style="font-size:9pt;color:#777">Historique : ' + e2(m.background) + '</div>';
  html += '</div>';
  html += '<div style="text-align:right;font-size:9pt;color:#444">';
  html += '<div>CA : <b>' + (m.ac||10) + '</b></div>';
  html += '<div>Vitesse : <b>' + e2(m.speed||'9m') + '</b></div>';
  html += '<div>Init. : <b>' + e2(m.initiative||'+0') + '</b></div>';
  html += '<div>Maîtrise : <b>+' + (m.profBonus||2) + '</b></div>';
  html += '</div></div>';

  // ── PV ───────────────────────────────────────────────────────
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">';
  html += '<div style="border:2px solid #555;border-radius:8px;padding:8px;text-align:center">';
  html += '<div style="font-size:8pt;text-transform:uppercase;color:#555;margin-bottom:2px">Points de vie actuels</div>';
  html += '<div style="font-size:28pt;font-weight:900;line-height:1">' + (m.hp?.current??'___') + '</div></div>';
  html += '<div style="border:1px solid #aaa;border-radius:8px;padding:8px;text-align:center">';
  html += '<div style="font-size:8pt;text-transform:uppercase;color:#555;margin-bottom:2px">PV Maximum</div>';
  html += '<div style="font-size:28pt;font-weight:900;color:#555;line-height:1">' + (m.hp?.max??'___') + '</div></div>';
  html += '</div>';

  // ── CARACTÉRISTIQUES ─────────────────────────────────────────
  html += '<div style="margin-bottom:12px">';
  html += '<div style="font-size:9pt;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #aaa;margin-bottom:6px;color:#444;font-weight:700">Caractéristiques</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:5px">';
  ['str','dex','con','int','wis','cha'].forEach(function(k){
    const v = stats[k]||10;
    html += '<div style="border:1px solid #999;border-radius:6px;padding:5px;text-align:center">';
    html += '<div style="font-size:7pt;text-transform:uppercase;color:#555">' + SLBL[k] + '</div>';
    html += '<div style="font-size:20pt;font-weight:900;line-height:1.1">' + v + '</div>';
    html += '<div style="font-size:12pt;font-weight:700">' + m2(v) + '</div>';
    html += '</div>';
  });
  html += '</div></div>';

  // ── SAUVEGARDES + COMPÉTENCES (côte à côte) ──────────────────
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">';

  // Sauvegardes
  html += '<div>';
  html += '<div style="font-size:9pt;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #aaa;margin-bottom:5px;color:#444;font-weight:700">Jets de sauvegarde</div>';
  ['str','dex','con','int','wis','cha'].forEach(function(k){
    const prof = (m.saveProficiencies||[]).includes(k);
    const bonus = Math.floor(((stats[k]||10)-10)/2) + (prof?(m.profBonus||2):0);
    html += '<div style="display:flex;gap:5px;padding:2px 0;font-size:9pt;align-items:center">';
    html += '<span>' + (prof?'●':'○') + '</span>';
    html += '<span style="flex:1">' + SLBL[k] + '</span>';
    html += '<b>' + bStr(bonus) + '</b></div>';
  });
  html += '</div>';

  // Compétences
  html += '<div>';
  html += '<div style="font-size:9pt;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #aaa;margin-bottom:5px;color:#444;font-weight:700">Compétences</div>';
  SK2.forEach(function(sk){
    const prof = (m.skillProficiencies||[]).includes(sk.n);
    const exp  = (m.skillExpertise||[]).includes(sk.n);
    const bonus = Math.floor(((stats[sk.a]||10)-10)/2) + (exp?(m.profBonus||2)*2:prof?(m.profBonus||2):0);
    html += '<div style="display:flex;gap:4px;padding:1px 0;font-size:8pt;align-items:center">';
    html += '<span>' + (exp?'◆':prof?'●':'○') + '</span>';
    html += '<span style="flex:1">' + sk.n + '</span>';
    html += '<b>' + bStr(bonus) + '</b></div>';
  });
  html += '</div>';
  html += '</div>'; // end grid

  // ── BOURSE ───────────────────────────────────────────────────
  if(m.gold && (m.gold.pp||m.gold.po||m.gold.pa||m.gold.pc)){
    html += '<div style="margin-bottom:12px">';
    html += '<div style="font-size:9pt;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #aaa;margin-bottom:5px;color:#444;font-weight:700">Bourse</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">';
    [['PP','pp','#7c3aed'],['PO','po','#d97706'],['PA','pa','#6b7280'],['PC','pc','#92400e']].forEach(function(cc){
      html += '<div style="border:1px solid #ccc;border-radius:5px;padding:6px;text-align:center">';
      html += '<div style="font-size:16pt;font-weight:900;color:' + cc[2] + '">' + (m.gold[cc[1]]||0) + '</div>';
      html += '<div style="font-size:8pt;color:' + cc[2] + '">' + cc[0] + '</div></div>';
    });
    html += '</div></div>';
  }

  // ── RESSOURCES ───────────────────────────────────────────────
  if((m.resources||[]).length){
    html += '<div style="margin-bottom:12px">';
    html += '<div style="font-size:9pt;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #aaa;margin-bottom:5px;color:#444;font-weight:700">Ressources</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px">';
    (m.resources||[]).forEach(function(r){
      html += '<div style="border:1px solid #ccc;border-radius:5px;padding:6px;text-align:center">';
      html += '<div style="font-size:14pt">' + (r.icon||'⚡') + '</div>';
      html += '<div style="font-size:8pt;font-weight:700">' + e2(r.name) + '</div>';
      html += '<div style="font-size:14pt;font-weight:900">' + r.current + '/' + r.max + '</div>';
      html += '<div style="font-size:7pt;color:#777">' + r.recharge + '</div></div>';
    });
    html += '</div></div>';
  }

  // ── ÉQUIPEMENT PORTÉ ─────────────────────────────────────────
  const equipped = (m.inventory||[]).filter(function(i){ return i.equippedSlot; });
  if(equipped.length){
    html += '<div style="margin-bottom:12px">';
    html += '<div style="font-size:9pt;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #aaa;margin-bottom:5px;color:#444;font-weight:700">Équipement porté</div>';
    html += '<div style="font-size:9pt;line-height:1.8">';
    equipped.forEach(function(i){ html += '• ' + e2(i.name) + ' &nbsp; '; });
    html += '</div></div>';
  }

  // ── INVENTAIRE ───────────────────────────────────────────────
  const inBag = (m.inventory||[]).filter(function(i){ return !i.equippedSlot; });
  if(inBag.length){
    html += '<div style="margin-bottom:12px">';
    html += '<div style="font-size:9pt;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #aaa;margin-bottom:5px;color:#444;font-weight:700">Inventaire (sac à dos)</div>';
    html += '<div style="font-size:9pt;line-height:1.8">';
    inBag.forEach(function(i){ html += '• ' + e2(i.name) + ' ×' + (i.qty||1) + ' &nbsp; '; });
    html += '</div></div>';
  }

  // ── SORTS ────────────────────────────────────────────────────
  if((m.spells||[]).length){
    html += '<div style="margin-bottom:12px">';
    html += '<div style="font-size:9pt;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #aaa;margin-bottom:5px;color:#444;font-weight:700">Sorts connus</div>';
    html += '<div style="font-size:9pt;line-height:1.8">';
    (m.spells||[]).forEach(function(sp){ html += '• <b>' + e2(sp.name) + '</b> (' + e2(sp.level) + ') &nbsp; '; });
    html += '</div></div>';
  }

  // ── PIED DE PAGE ─────────────────────────────────────────────
  html += '<div style="margin-top:16px;font-size:7pt;color:#aaa;text-align:right;border-top:1px solid #eee;padding-top:6px">';
  html += 'Le Conseil du Plan · Fiche générée le ' + new Date().toLocaleDateString('fr-FR');
  html += '</div>';
  html += '</div>'; // fin container

  // Injecter dans le div d'impression et lancer
  const printDiv = document.getElementById('print-sheet');
  const printContent = document.getElementById('print-sheet-content');
  if(!printDiv || !printContent){ toast('Erreur : div d\'impression introuvable'); return; }
  printContent.innerHTML = html;
  printDiv.style.display = 'block';
  window.print();
  setTimeout(function(){ printDiv.style.display='none'; }, 1200);
}
