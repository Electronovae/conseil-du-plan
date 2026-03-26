/**
 * MODULE BATTLEMAP
 * Extrait de V7_6.html lignes 5692-7048
 */
// ================================================================
// MODULE BATTLEMAP
// ================================================================
let selectedMapId = DB.battlemaps[0]?.id||null;

// ── STATE : INITIATIVE TRACKER (V6.2) ──────────────────────────
let initiativeList   = [];   // [{id, name, icon, initiative, hp, hpMax, ac, conditions:[], isPC, memberId}]
let initiativeTurn   = 0;    // index du combattant actif
let initTrackerOpen  = false;

// ── STATE : DÉS (V6.2) ─────────────────────────────────────────
let diceHistory      = [];   // [{expr, result, detail, ts}]
let dicePanelOpen    = false;

// ── STATE : LIEUX (V6.2) ───────────────────────────────────────
let selectedLocationId = null;
let locationPanelOpen  = false;

let activeTool = 'select';
let isDragging = false;
let dragTokenId = null;
let dragOffset = {x:0,y:0};
let selectedTokenId = null;
let CELL = 38; // dynamic per map via map.cellSize


// ══════════════════════════════════════════════════════════════
// ── MODULE DÉS (V6.2) ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════

// → Évalue une expression de dés : "2d6+3", "4d6kh3", "d20", etc.
// Retourne {total, detail, rolls}
function rollDiceExpr(expr){
  expr = expr.trim().toLowerCase().replace(/\s/g,'');
  if(!expr) return null;

  // Gestion de formules multiples séparées par +/-
  // Parsing simple : NdX[kh/kl Y][+/-mod]
  let total = 0;
  const parts = [];

  // Split par + et - en gardant le signe
  const tokens = expr.match(/[+-]?[^+-]+/g)||[];
  tokens.forEach(token=>{
    const sign = token[0]==='-'?-1:1;
    token = token.replace(/^[+-]/,'');

    const diceMatch = token.match(/^(\d*)d(\d+)(kh(\d+)|kl(\d+))?$/);
    if(diceMatch){
      const num   = parseInt(diceMatch[1])||1;
      const sides = parseInt(diceMatch[2]);
      const keepH = diceMatch[4]?parseInt(diceMatch[4]):null;
      const keepL = diceMatch[5]?parseInt(diceMatch[5]):null;

      const rolls = Array.from({length:num},()=>Math.floor(Math.random()*sides)+1);
      let kept = [...rolls];

      if(keepH!==null){
        kept = [...rolls].sort((a,b)=>b-a).slice(0,keepH);
      } else if(keepL!==null){
        kept = [...rolls].sort((a,b)=>a-b).slice(0,keepL);
      }

      const subtotal = kept.reduce((a,b)=>a+b,0);
      total += sign*subtotal;

      const rollStr = num>1
        ? '[' + rolls.map(r=>kept.includes(r)?`<b>${r}</b>`:`<s>${r}</s>`).join(', ') + ']'
        : '<b>'+rolls[0]+'</b>';
      parts.push({str: rollStr + (keepH?` kh${keepH}`:'') + (keepL?` kl${keepL}`:''), val:sign*subtotal});
    } else if(!isNaN(+token)){
      total += sign*(+token);
      parts.push({str: (sign<0?'-':'')+token, val:sign*(+token)});
    }
  });

  const detail = parts.map(p=>p.str).join(' + ').replace(/\+ -/g,'- ');
  return {total, detail, rolls:parts};
}

// → Lance et affiche les dés dans le panneau
function rollAndShow(expr){
  const result = rollDiceExpr(expr);
  if(!result){ toast('Expression invalide'); return; }

  diceHistory.unshift({expr, total:result.total, detail:result.detail, ts: new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});
  if(diceHistory.length>20) diceHistory.pop();

  renderDicePanel();

  // Flash visuel dans la zone résultat
  const res = document.getElementById('dice-result-val');
  if(res){
    res.textContent = result.total;
    res.style.transform = 'scale(1.4)';
    res.style.color = result.total===1?'#ef4444':result.total>=20&&expr.includes('d20')?'#fbbf24':'var(--green)';
    setTimeout(()=>{ res.style.transform='scale(1)'; },200);
  }
}

// → Rendu du panneau de dés (sidebar battlemap)
function renderDicePanel(){
  const el = document.getElementById('dice-panel-content');
  if(!el) return;

  const DICE_TYPES = [4,6,8,10,12,20,100];
  const last = diceHistory[0];

  el.innerHTML =
    // Résultat principal
    '<div style="text-align:center;padding:10px 0;border-bottom:1px solid var(--border)">'
    + '<div id="dice-result-val" style="font-size:42px;font-weight:900;color:var(--green);transition:transform .2s,color .2s;line-height:1">'
    + (last ? last.total : '—') + '</div>'
    + (last ? '<div style="font-size:11px;color:var(--dim);margin-top:4px">'+last.expr+'</div>' : '')
    + (last ? '<div style="font-size:10px;color:var(--indigo);margin-top:2px" title="Détail">'+last.detail+'</div>' : '')
    + '</div>'

    // Boutons dés rapides
    + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:10px 0">'
    + DICE_TYPES.map(d=>
        '<button onclick="rollAndShow(\'d'+d+'\')"'
        + ' style="padding:8px 4px;background:var(--surface2);border:1px solid var(--border2);border-radius:7px;'
        + 'color:var(--text);cursor:pointer;font-weight:700;font-size:12px;transition:all .15s"'
        + ' onmouseover="this.style.borderColor=\'var(--indigo)\'" onmouseout="this.style.borderColor=\'var(--border2)\'">'
        + 'd'+d+'</button>'
      ).join('')
    + '</div>'

    // Formule custom
    + '<div style="display:flex;gap:4px;margin-bottom:10px">'
    + '<input id="dice-custom-expr" placeholder="2d6+3, 4d6kh3…"'
    + ' style="flex:1;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;'
    + 'color:var(--text);padding:6px 8px;font-size:12px"'
    + ' onkeydown="if(event.key===\'Enter\')rollAndShow(document.getElementById(\'dice-custom-expr\').value)">'
    + '<button onclick="rollAndShow(document.getElementById(\'dice-custom-expr\').value)"'
    + ' style="padding:6px 10px;background:var(--indigo);border:none;border-radius:5px;color:#fff;cursor:pointer;font-weight:700">🎲</button>'
    + '</div>'

    // Historique
    + '<div style="font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">Historique</div>'
    + '<div style="display:flex;flex-direction:column;gap:3px;max-height:140px;overflow-y:auto">'
    + (diceHistory.length===0 ? '<div style="color:var(--dim);font-size:11px;font-style:italic">Aucun lancer</div>'
      : diceHistory.map(h=>
          '<div onclick="void(0)" style="display:flex;align-items:center;gap:6px;padding:4px 7px;'
          + 'background:var(--surface2);border-radius:5px;cursor:pointer"'
          + ' onclick="rollAndShow(\''+h.expr+'\')" title="Relancer '+h.expr+'">'
          + '<span style="font-size:11px;color:var(--dim)">'+h.ts+'</span>'
          + '<span style="font-size:11px;color:var(--muted);flex:1">'+h.expr+'</span>'
          + '<span style="font-size:13px;font-weight:700;color:var(--green)">'+h.total+'</span>'
          + '</div>'
        ).join(''))
    + '</div>'

    // Bouton effacer
    + (diceHistory.length ? '<button onclick="diceHistory=[];renderDicePanel()" style="width:100%;margin-top:6px;padding:4px;'
      + 'background:none;border:1px solid var(--border2);border-radius:5px;color:var(--dim);cursor:pointer;font-size:11px">✕ Effacer</button>' : '');
}


// ══════════════════════════════════════════════════════════════
// ── INITIATIVE TRACKER (V6.2) ─────────────────────────────────
// ══════════════════════════════════════════════════════════════

// → Ouvre la modale pour ajouter un combattant
function openAddCombatantModal(){
  openModal('<div class="modal" onclick="event.stopPropagation()" style="max-width:420px">'
    + '<div class="modal-header"><span class="modal-title">⚔️ Ajouter un combattant</span>'
    + '<button class="modal-close" onclick="closeModal()">✕</button></div>'
    + '<div class="modal-body">'

    // Import depuis les PJ
    + '<div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Importer depuis les Aventuriers</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px">'
    + DB.members.map(m=>
        '<button onclick="addCombatantFromMember('+m.id+')" class="btn btn-ghost btn-xs">'
        + m.avatar+' '+esc(m.name)+'</button>'
      ).join('')
    + '</div>'

    + '<div style="border-top:1px solid var(--border);padding-top:12px;font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Combattant personnalisé</div>'
    + '<div class="grid2">'
    + '<div class="field"><label>Nom</label>'
    + '<input id="cbt-name" placeholder="Gobelin Chef…" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px"></div>'
    + '<div class="field"><label>Icône</label>'
    + '<input id="cbt-icon" value="👾" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px;text-align:center;font-size:18px"></div>'
    + '<div class="field"><label>Initiative</label>'
    + '<input id="cbt-init" type="number" value="10" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px"></div>'
    + '<div class="field"><label>PV max</label>'
    + '<input id="cbt-hp" type="number" value="10" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px"></div>'
    + '<div class="field"><label>CA</label>'
    + '<input id="cbt-ac" type="number" value="12" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px"></div>'
    + '</div>'
    + '</div>'
    + '<div class="modal-footer">'
    + '<button class="btn btn-ghost" onclick="closeModal()">Annuler</button>'
    + '<button class="btn btn-primary" onclick="saveAddCombatant()">Ajouter</button>'
    + '</div>'
    + '</div>');
}

function addCombatantFromMember(memberId){
  const m = DB.members.find(x=>x.id===memberId);
  if(!m) return;
  // Avoid duplicates
  if(initiativeList.find(c=>c.memberId===memberId)){
    toast(m.name+' est déjà dans le tracker');
    closeModal(); return;
  }
  const init = Math.floor(Math.random()*20)+1 + (parseInt(m.initiative)||0);
  initiativeList.push({
    id: uid(), name:m.name, icon:m.avatar||'⚔️',
    initiative: init, hp: m.hp?.current||m.hp?.max||10,
    hpMax: m.hp?.max||10, ac: m.ac||10,
    conditions:[], isPC:true, memberId
  });
  initiativeList.sort((a,b)=>b.initiative-a.initiative);
  closeModal(); renderInitiativeTracker();
  toast(m.avatar+' '+m.name+' ajouté·e (Init: '+init+')');
}

function saveAddCombatant(){
  const name = document.getElementById('cbt-name')?.value?.trim();
  if(!name){ toast('Nom requis'); return; }
  initiativeList.push({
    id: uid(),
    name,
    icon:  document.getElementById('cbt-icon')?.value||'👾',
    initiative: +document.getElementById('cbt-init')?.value||10,
    hp:    +document.getElementById('cbt-hp')?.value||10,
    hpMax: +document.getElementById('cbt-hp')?.value||10,
    ac:    +document.getElementById('cbt-ac')?.value||12,
    conditions:[], isPC:false
  });
  initiativeList.sort((a,b)=>b.initiative-a.initiative);
  closeModal(); renderInitiativeTracker();
}

// → Tour suivant : avance le pointeur, décrémente les conditions avec durée
function nextTurn(){
  if(!initiativeList.length) return;
  initiativeTurn = (initiativeTurn+1) % initiativeList.length;
  // Décrémenter les durées de conditions au début de chaque tour
  const cur = initiativeList[initiativeTurn];
  if(cur){
    cur.conditions = (cur.conditions||[]).map(c=>{
      if(c.duration && c.duration>0){
        c.duration--;
        if(c.duration===0){ toast('⏱️ '+c.name+' expiré sur '+cur.name); return null; }
      }
      return c;
    }).filter(Boolean);
  }
  renderInitiativeTracker();
}

// → Applique des dégâts à un combattant
function applyDamage(combatantId, amount){
  const c = initiativeList.find(x=>x.id===combatantId);
  if(!c) return;
  c.hp = Math.max(0, c.hp - amount);
  // Sync PJ si lié
  if(c.memberId){
    const m = DB.members.find(x=>x.id===c.memberId);
    if(m && m.hp) { m.hp.current = c.hp; save(); }
  }
  renderInitiativeTracker();
  if(c.hp===0) toast('💀 '+c.name+' est à 0 PV !');
}

// → Applique des soins à un combattant
function applyHeal(combatantId, amount){
  const c = initiativeList.find(x=>x.id===combatantId);
  if(!c) return;
  c.hp = Math.min(c.hpMax, c.hp + amount);
  if(c.memberId){
    const m = DB.members.find(x=>x.id===c.memberId);
    if(m && m.hp) { m.hp.current = c.hp; save(); }
  }
  renderInitiativeTracker();
}

// → Ajoute/retire une condition à un combattant
function toggleCondition(combatantId, condName){
  const c = initiativeList.find(x=>x.id===combatantId);
  if(!c) return;
  if(!c.conditions) c.conditions=[];
  const idx = c.conditions.findIndex(x=>x.name===condName);
  if(idx>=0) c.conditions.splice(idx,1);
  else c.conditions.push({name:condName, duration:0}); // 0 = permanent
  renderInitiativeTracker();
}

// → Supprime un combattant
function removeCombatant(id){
  initiativeList = initiativeList.filter(x=>x.id!==id);
  if(initiativeTurn>=initiativeList.length) initiativeTurn=0;
  renderInitiativeTracker();
}

// → Rendu du tracker d'initiative (dans la sidebar battlemap)
function renderInitiativeTracker(){
  const el = document.getElementById('initiative-tracker-content');
  if(!el) return;

  if(!initiativeList.length){
    el.innerHTML = '<div style="color:var(--dim);font-size:12px;font-style:italic;text-align:center;padding:10px">Aucun combattant — cliquez + pour ajouter</div>';
    return;
  }

  el.innerHTML = initiativeList.map((c,i)=>{
    const isActive = i===initiativeTurn;
    const hpPct    = c.hpMax>0 ? Math.max(0,Math.min(1,c.hp/c.hpMax)) : 0;
    const hpCol    = hpPct>.6?'#22c55e':hpPct>.3?'#f59e0b':'#ef4444';
    const border   = isActive ? '2px solid var(--gold)' : '1px solid var(--border)';
    const bg       = isActive ? 'var(--surface)' : 'var(--surface2)';

    return '<div id="init-cbt-'+c.id+'" style="border:'+border+';background:'+bg+';border-radius:8px;padding:8px;margin-bottom:5px;transition:all .2s">'
      // Header : icône, nom, init, CA
      + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">'
      + (isActive ? '<span style="font-size:10px;color:var(--gold)">▶</span>' : '')
      + '<span style="font-size:18px">'+c.icon+'</span>'
      + '<span style="flex:1;font-weight:'+(isActive?700:500)+';color:var(--text);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(c.name)+'</span>'
      + '<span style="font-size:10px;color:var(--gold);font-weight:700" title="Initiative">🎲 '+c.initiative+'</span>'
      + '<span style="font-size:10px;color:var(--blue);font-weight:700;margin-left:4px" title="CA">🛡️ '+c.ac+'</span>'
      + '<button onclick="removeCombatant(\''+c.id+'\')" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:11px;padding:0 2px" onmouseover="this.style.color=\'var(--red)\'" onmouseout="this.style.color=\'var(--dim)\'">✕</button>'
      + '</div>'
      // Barre de PV
      + '<div style="display:flex;align-items:center;gap:5px;margin-bottom:5px">'
      + '<span style="font-size:10px;color:var(--dim)">❤️</span>'
      + '<div style="flex:1;height:6px;background:var(--border2);border-radius:3px;overflow:hidden">'
      + '<div style="height:100%;width:'+(hpPct*100)+'%;background:'+hpCol+';transition:width .3s;border-radius:3px"></div>'
      + '</div>'
      + '<span style="font-size:11px;color:'+hpCol+';font-weight:700">'+c.hp+'/'+c.hpMax+'</span>'
      + '</div>'
      // Contrôles PV + conditions
      + '<div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">'
      + '<input type="number" id="dmg-in-'+c.id+'" placeholder="Dmg" min="0"'
      + ' style="width:46px;background:var(--surface);border:1px solid var(--border2);border-radius:4px;color:var(--red);padding:3px 5px;font-size:11px"'
      + ' onkeydown="if(event.key===\'Enter\')applyDamage(\''+c.id+'\',+this.value)">'
      + '<button onclick="applyDamage(\''+c.id+'\',+document.getElementById(\'dmg-in-'+c.id+'\').value||0)"'
      + ' style="padding:3px 7px;background:#ef444422;border:1px solid #ef444444;border-radius:4px;color:#ef4444;cursor:pointer;font-size:11px;font-weight:700">💥</button>'
      + '<input type="number" id="heal-in-'+c.id+'" placeholder="Soin" min="0"'
      + ' style="width:46px;background:var(--surface);border:1px solid var(--border2);border-radius:4px;color:var(--green);padding:3px 5px;font-size:11px"'
      + ' onkeydown="if(event.key===\'Enter\')applyHeal(\''+c.id+'\',+this.value)">'
      + '<button onclick="applyHeal(\''+c.id+'\',+document.getElementById(\'heal-in-'+c.id+'\').value||0)"'
      + ' style="padding:3px 7px;background:#22c55e22;border:1px solid #22c55e44;border-radius:4px;color:#22c55e;cursor:pointer;font-size:11px;font-weight:700">💚</button>'
      + '<button onclick="openConditionPicker(\''+c.id+'\')"'
      + ' style="padding:3px 7px;background:var(--surface);border:1px solid var(--border2);border-radius:4px;color:var(--muted);cursor:pointer;font-size:11px" title="Conditions">+🏷️</button>'
      + '</div>'
      // Badges de conditions actives
      + (c.conditions&&c.conditions.length ? '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:5px">'
          + c.conditions.map(cond=>{
              const info=CONDITIONS[cond.name]||{icon:'❓',color:'#9ca3af'};
              return '<span onclick="toggleCondition(\''+c.id+'\',\''+cond.name+'\')"'
                + ' title="'+cond.name+(cond.duration>0?' — '+cond.duration+' tours':'')+' (clic pour retirer)"'
                + ' style="cursor:pointer;background:'+info.color+'22;border:1px solid '+info.color+'44;'
                + 'color:'+info.color+';padding:1px 6px;border-radius:10px;font-size:10px;font-weight:600">'
                + info.icon+' '+cond.name+(cond.duration>0?' '+cond.duration+'⏱':'')+'</span>';
            }).join('')
          + '</div>' : '')
      + '</div>';
  }).join('');
}

// → Modale pour choisir une condition à appliquer
function openConditionPicker(combatantId){
  openModal('<div class="modal" onclick="event.stopPropagation()" style="max-width:380px">'
    + '<div class="modal-header"><span class="modal-title">🏷️ Conditions</span>'
    + '<button class="modal-close" onclick="closeModal()">✕</button></div>'
    + '<div class="modal-body">'
    + '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">'
    + Object.entries(CONDITIONS).map(([name,info])=>{
        const c = initiativeList.find(x=>x.id===combatantId);
        const active = c&&c.conditions&&c.conditions.find(x=>x.name===name);
        return '<button onclick="toggleCondition(\''+combatantId+'\',\''+name+'\');renderInitiativeTracker();closeModal()"'
          + ' style="display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:7px;cursor:pointer;text-align:left;'
          + 'background:'+(active?info.color+'33':'var(--surface2)')+';'
          + 'border:1px solid '+(active?info.color:'var(--border2)')+'"'
          + ' title="'+info.desc+'">'
          + '<span style="font-size:16px">'+info.icon+'</span>'
          + '<span style="font-size:12px;color:'+(active?info.color:'var(--muted)')+';font-weight:'+(active?700:400)+'">'+name+'</span>'
          + '</button>';
      }).join('')
    + '</div></div></div>');
}

// → Réinitialise le combat
function resetCombat(){
  if(!confirm('Réinitialiser le combat ?')) return;
  initiativeList=[]; initiativeTurn=0;
  renderInitiativeTracker();
}


// ══════════════════════════════════════════════════════════════
// ── MODULE LIEUX (V6.2) ───────────────────────────────────────
// ══════════════════════════════════════════════════════════════

function renderLocationsPanel(){
  const el = document.getElementById('locations-panel-content');
  if(!el) return;
  const locs = DB.locations||[];

  el.innerHTML =
    '<div style="display:flex;gap:4px;margin-bottom:8px">'
    + '<button onclick="openAddLocationModal()" class="btn btn-primary btn-xs" style="flex:1">+ Nouveau lieu</button>'
    + '</div>'
    + (locs.length===0
      ? '<div style="color:var(--dim);font-size:11px;font-style:italic;text-align:center;padding:10px">Aucun lieu défini</div>'
      : locs.map(loc=>{
          const sel = loc.id===selectedLocationId;
          return '<div onclick="selectedLocationId=\''+loc.id+'\';renderLocationsPanel()"'
            + ' style="padding:8px 10px;border-radius:7px;cursor:pointer;margin-bottom:4px;'
            + 'background:'+(sel?'var(--selected)':'var(--surface)')+';'
            + 'border:1px solid '+(sel?'var(--indigo)':'var(--border)')+';">'
            + '<div style="font-weight:600;color:var(--text);font-size:12px">'+loc.icon+' '+esc(loc.name)+'</div>'
            + '<div style="font-size:10px;color:var(--dim)">'+esc(loc.type||'')+(loc.npcs&&loc.npcs.length?' · '+loc.npcs.length+' PNJ':'')+'</div>'
            + (sel ? renderLocationDetail(loc) : '')
            + '</div>';
        }).join('')
    );
}

function renderLocationDetail(loc){
  const npcList = (loc.npcs||[]).map(id=>{
    const n=DB.npcs.find(x=>x.id===id);
    return n?'<span style="font-size:10px;background:var(--surface2);padding:1px 6px;border-radius:4px;color:var(--muted)">'+n.avatar+' '+esc(n.name)+'</span>':'';
  }).filter(Boolean).join('');

  return '<div style="margin-top:6px;font-size:11px;color:var(--muted);line-height:1.5">'
    + (loc.description ? '<p style="margin:4px 0">'+esc(loc.description)+'</p>' : '')
    + (loc.interest ? '<div style="color:var(--gold);font-size:10px">⭐ '+esc(loc.interest)+'</div>' : '')
    + (npcList ? '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">'+npcList+'</div>' : '')
    + '<div style="display:flex;gap:4px;margin-top:6px">'
    + '<button onclick="openEditLocationModal(\''+loc.id+'\')" class="btn btn-ghost btn-xs">✏️ Modifier</button>'
    + '<button onclick="deleteLocation(\''+loc.id+'\')" class="btn btn-danger btn-xs">✕</button>'
    + '</div>'
    + '</div>';
}

function openAddLocationModal(editId){
  const src = editId ? (DB.locations||[]).find(x=>x.id===editId) : null;
  const loc = src ? {...src} : {id:uid(),name:'',type:'Donjon',icon:'🏰',description:'',interest:'',npcs:[]};
  window._editLocation = loc;
  const LOC_TYPES = ['Donjon','Ville','Village','Forêt','Montagne','Marais','Mer','Plan','Autre'];
  openModal('<div class="modal" onclick="event.stopPropagation()" style="max-width:440px">'
    + '<div class="modal-header"><span class="modal-title">'+(editId?'✏️ Modifier':'+ Nouveau')+' Lieu</span>'
    + '<button class="modal-close" onclick="closeModal()">✕</button></div>'
    + '<div class="modal-body">'
    + '<div class="grid2">'
    + '<div class="field"><label>Nom</label>'
    + '<input value="'+esc(loc.name||'')+'" oninput="window._editLocation.name=this.value"'
    + ' style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px"></div>'
    + '<div class="field"><label>Icône</label>'
    + '<input value="'+esc(loc.icon||'🏰')+'" oninput="window._editLocation.icon=this.value"'
    + ' style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px;text-align:center;font-size:18px"></div>'
    + '<div class="field"><label>Type</label>'
    + '<select onchange="window._editLocation.type=this.value"'
    + ' style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px">'
    + LOC_TYPES.map(t=>'<option'+(loc.type===t?' selected':'')+'>'+t+'</option>').join('')
    + '</select></div>'
    + '</div>'
    + '<div class="field"><label>Description</label>'
    + '<textarea rows="3" oninput="window._editLocation.description=this.value"'
    + ' style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px;resize:vertical;box-sizing:border-box">'
    + esc(loc.description||'')+'</textarea></div>'
    + '<div class="field"><label>⭐ Points d\'intérêt</label>'
    + '<input value="'+esc(loc.interest||'')+'" oninput="window._editLocation.interest=this.value"'
    + ' placeholder="Objet caché, piège, secret…"'
    + ' style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:8px"></div>'
    + '</div>'
    + '<div class="modal-footer">'
    + '<button class="btn btn-ghost" onclick="closeModal()">Annuler</button>'
    + '<button class="btn btn-primary" onclick="saveLocation()">Enregistrer</button>'
    + '</div></div>');
}

function openEditLocationModal(id){ openAddLocationModal(id); }

function saveLocation(){
  const loc = window._editLocation;
  if(!loc.name.trim()){ toast('Nom requis'); return; }
  if(!DB.locations) DB.locations=[];
  const idx = DB.locations.findIndex(x=>x.id===loc.id);
  if(idx>=0) DB.locations[idx]={...loc};
  else DB.locations.push({...loc});
  save(); closeModal(); renderLocationsPanel();
}

function deleteLocation(id){
  if(!confirm('Supprimer ce lieu ?')) return;
  DB.locations=(DB.locations||[]).filter(x=>x.id!==id);
  if(selectedLocationId===id) selectedLocationId=null;
  save(); renderLocationsPanel();
}

// ── BATTLEMAP V6.2 : Initiative + Dés + Lieux ─────────────────
function renderBattlemap(){
  const el = document.getElementById('module-battlemap');
  el.innerHTML = `
  <div class="module-header">
    <span style="font-size:26px">🗺️</span>
    <div><div class="module-title">Battlemap</div><div class="module-bar"></div></div>
    <div style="flex:1"></div>
    <button onclick="initTrackerOpen=!initTrackerOpen;renderBattlemap()" class="btn btn-sm ${initTrackerOpen?'btn-primary':'btn-ghost'}">⚔️ Initiative</button>
    <button onclick="dicePanelOpen=!dicePanelOpen;renderBattlemap()" class="btn btn-sm ${dicePanelOpen?'btn-primary':'btn-ghost'}">🎲 Dés</button>
    <button onclick="locationPanelOpen=!locationPanelOpen;renderBattlemap()" class="btn btn-sm ${locationPanelOpen?'btn-primary':'btn-ghost'}">🏰 Lieux</button>
  </div>
  <div style="display:flex;gap:16px;min-height:78vh">
    <!-- SIDEBAR GAUCHE -->
    <div style="width:190px;flex-shrink:0;display:flex;flex-direction:column;gap:10px">
      <button class="btn btn-primary btn-sm" onclick="openMapModal()">+ Nouvelle Map</button>
      <div id="map-list" style="display:flex;flex-direction:column;gap:5px;overflow-y:auto;max-height:200px"></div>
      <div id="map-tools" style="display:flex;flex-direction:column;gap:4px;border-top:1px solid var(--border);padding-top:8px">
        <div style="font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px">Outils</div>
        ${[['select','↖️','Sélectionner'],['token','🪙','Token (clic)'],['effect','✨','Effet/Sort'],['measure','📏','Mesurer'],['note','📝','Note']].map(([id,icon,label])=>
          `<button onclick="setTool('${id}')" id="tool-${id}" class="btn btn-ghost btn-sm" style="justify-content:flex-start;gap:6px;font-size:12px">${icon} ${label}</button>`
        ).join('')}
        <div id="sel-token-panel" style="display:none;border-top:1px solid var(--border);padding-top:8px;margin-top:4px">
          <div style="font-size:10px;color:var(--dim);margin-bottom:6px">Token sélectionné</div>
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;font-size:12px;color:var(--muted)">Taille:
            <input type="number" id="tok-size-input" value="1" min="1" max="4"
              style="width:40px;background:var(--surface);border:1px solid var(--border2);border-radius:4px;color:var(--text);padding:3px;text-align:center"
              oninput="updateSelTokenProp('size',+this.value)">
          </div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:2px">HP :</div>
          <div style="display:flex;gap:4px;align-items:center;margin-bottom:6px">
            <input type="number" id="tok-hp-cur" placeholder="Cur" min="0"
              style="width:44px;background:var(--surface);border:1px solid var(--border2);border-radius:4px;color:var(--text);padding:3px;text-align:center"
              oninput="updateSelTokenProp('hpCur',+this.value)">
            <span style="color:var(--dim)">/</span>
            <input type="number" id="tok-hp-max" placeholder="Max" min="0"
              style="width:44px;background:var(--surface);border:1px solid var(--border2);border-radius:4px;color:var(--text);padding:3px;text-align:center"
              oninput="updateSelTokenProp('hpMax',+this.value)">
          </div>
        </div>
        <hr style="border:none;border-top:1px solid var(--border);margin:4px 0">
        <label class="img-upload-btn" style="min-height:44px;font-size:12px" title="Image de fond">
          🖼️ Image de fond
          <input type="file" accept="image/*" style="display:none" onchange="uploadMapBg(this)">
        </label>
        <button class="btn btn-ghost btn-xs" onclick="clearMapBg()" style="color:var(--dim)">✕ Retirer image</button>
      </div>
      <div style="border-top:1px solid var(--border);padding-top:8px">
        <div style="font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">Notes de combat</div>
        <textarea id="map-notes" rows="4" oninput="saveMapNotes(this.value)"
          style="width:100%;background:var(--surface);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:7px;font-size:12px;resize:vertical;box-sizing:border-box"
          placeholder="Conditions, tour N, objectifs…"></textarea>
      </div>
      <div style="border-top:1px solid var(--border);padding-top:8px">
        <div style="font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">🎵 Ambiance</div>
        <audio id="map-audio" style="display:none"></audio>
        ${(()=>{ const audios=DB.media.filter(m=>m.type==='audio');
          if(!audios.length) return '<div style="color:var(--dim);font-size:11px;font-style:italic">Ajoutez des audios dans Médias</div>';
          return '<div style="display:flex;gap:4px;margin-bottom:6px">'
            +'<button onclick="playlistPrev()" class="btn btn-xs btn-ghost">⏮</button>'
            +'<button onclick="playlistPlayPause()" id="playlist-pp" class="btn btn-xs btn-ghost">▶</button>'
            +'<button onclick="playlistNext()" class="btn btn-xs btn-ghost">⏭</button>'
            +'<button onclick="togglePlaylistLoop()" id="playlist-loop" class="btn btn-xs btn-ghost">🔁</button>'
            +'</div>'
            +'<div style="display:flex;flex-direction:column;gap:3px;max-height:130px;overflow-y:auto" id="playlist-tracks">'
            +audios.map(m=>`<div id="pl-track-${m.id}" onclick="playlistPlay('${m.id}')" style="background:var(--surface2);border-radius:5px;padding:5px 8px;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:5px"><span id="pl-icon-${m.id}" style="color:var(--dim);font-size:10px">▶</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text)">${esc(m.name)}</span></div>`).join('')
            +'</div>';
        })()}
      </div>
    </div>
    <!-- MAP AREA -->
    <div style="flex:1;overflow:auto;min-width:0" id="map-canvas-wrap"></div>
    <!-- PANNEAUX DROITS -->
    <div style="width:${initTrackerOpen||dicePanelOpen||locationPanelOpen?'240':'0'}px;flex-shrink:0;overflow:hidden;transition:width .25s;display:flex;flex-direction:column;gap:12px">
      ${initTrackerOpen?`
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px;overflow-y:auto;max-height:45vh">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:11px;color:var(--gold);font-weight:700;text-transform:uppercase">⚔️ Initiative</div>
          <div style="display:flex;gap:4px">
            <button onclick="openAddCombatantModal()" class="btn btn-xs btn-outline">+</button>
            <button onclick="nextTurn()" class="btn btn-xs btn-primary">▶ Tour</button>
            <button onclick="resetCombat()" class="btn btn-xs btn-ghost" style="color:var(--red)">↺</button>
          </div>
        </div>
        <div id="initiative-tracker-content"></div>
      </div>`:``}
      ${dicePanelOpen?`
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px">
        <div style="font-size:11px;color:var(--indigo);font-weight:700;text-transform:uppercase;margin-bottom:8px">🎲 Dés</div>
        <div id="dice-panel-content"></div>
      </div>`:``}
      ${locationPanelOpen?`
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px;overflow-y:auto;max-height:40vh">
        <div style="font-size:11px;color:var(--green);font-weight:700;text-transform:uppercase;margin-bottom:8px">🏰 Lieux</div>
        <div id="locations-panel-content"></div>
      </div>`:``}
    </div>
  </div>`;
  renderMapList();
  renderMapCanvas();
  setTool('select');
  if(initTrackerOpen)   renderInitiativeTracker();
  if(dicePanelOpen)     renderDicePanel();
  if(locationPanelOpen) renderLocationsPanel();
}

function renderMapList(){
  const el=document.getElementById('map-list');
  if(!el) return;
  el.innerHTML=DB.battlemaps.map(m=>`
    <div onclick="selectedMapId=${m.id};renderMapList();renderMapCanvas()" style="
      background:${selectedMapId===m.id?'var(--selected)':'var(--surface)'};
      border:1px solid ${selectedMapId===m.id?'var(--indigo)':'var(--border)'};
      border-radius:8px;padding:10px 12px;cursor:pointer">
      <div style="font-size:13px;font-weight:600;color:var(--text)">${esc(m.name)}</div>
      <div style="font-size:11px;color:var(--dim)">${m.width}×${m.height} · ${m.terrain} · ${m.tokens.length}🪙</div>
    </div>`).join('');
}

function renderMapCanvas(){
  const wrap=document.getElementById('map-canvas-wrap');
  if(!wrap) return;
  const map=DB.battlemaps.find(m=>m.id===selectedMapId);
  if(!map){wrap.innerHTML=`<div style="display:flex;align-items:center;justify-content:center;height:300px;color:var(--dim);font-style:italic">Sélectionnez ou créez une map</div>`;return;}

  const notes=document.getElementById('map-notes');
  if(notes) notes.value=map.notes||'';

  const tbg=TERRAIN_BG[map.terrain]||'#1a1a2e';
  const tgrid=TERRAIN_GRID[map.terrain]||'#2d2d4e';
  const taccent=TERRAIN_ACCENT[map.terrain]||'#6366f1';
  CELL = map.cellSize||38; const W=map.width*CELL, H=map.height*CELL;

  wrap.innerHTML=`
  <div style="margin-bottom:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
    <span style="font-family:'Cinzel',serif;font-weight:700;color:var(--text);font-size:16px">${esc(map.name)}</span>
    <span style="background:${taccent}22;color:${taccent};padding:2px 10px;border-radius:4px;font-size:12px">${map.terrain}</span>
    <span style="color:var(--dim);font-size:12px">${map.width}×${map.height}</span>
    <button class="btn btn-danger btn-xs" onclick="deleteMap(${map.id})">Supprimer</button>
  </div>
  <div id="map-grid" style="position:relative;width:${W}px;height:${H}px;background:${tbg};
    border:2px solid ${taccent}44;border-radius:4px;cursor:crosshair;
    box-shadow:0 0 40px ${taccent}18;flex-shrink:0;overflow:hidden"
    onmousedown="mapMouseDown(event)"
    onmousemove="mapMouseMove(event)"
    onmouseup="mapMouseUp(event)"
    onmouseleave="mapMouseUp(event)">
    <!-- BG IMAGE -->
    ${map.bgImage?`<img src="${map.bgImage}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55;pointer-events:none" draggable="false">`:''}
    <!-- GRID OVERLAY -->
    <svg style="position:absolute;inset:0;pointer-events:none" width="${W}" height="${H}">
      ${Array.from({length:map.width+1},(_,i)=>`<line x1="${i*CELL}" y1="0" x2="${i*CELL}" y2="${H}" stroke="${tgrid}" stroke-width="1" opacity=".5"/>`).join('')}
      ${Array.from({length:map.height+1},(_,i)=>`<line x1="0" y1="${i*CELL}" x2="${W}" y2="${i*CELL}" stroke="${tgrid}" stroke-width="1" opacity=".5"/>`).join('')}
    </svg>
    <!-- TOKENS -->
    ${map.tokens.map(t=>{
      const linked=t.memberId?DB.members.find(m=>m.id===t.memberId):null;
      const linkedBeast=t.beastId?DB.bestiary.find(b=>b.id===t.beastId):null;
      const hasImg=t.image||(linked?.avatarImg)||(linkedBeast?.image);
      const shortLabel=t.label.length>4?t.label.slice(0,4):t.label;
      const sz=(t.size||1)*CELL-4;
      const hpPct=t.hpMax>0?Math.max(0,Math.min(1,t.hpCur/t.hpMax)):null;
      const hpCol=hpPct>=.5?'#4ade80':hpPct>=.25?'#fbbf24':'#f87171';
      const isEffect=t.type==='effect';
      const hpH = hpPct!==null&&!isEffect&&sz>24 ? 8 : 0;
      const totalH = sz + hpH;
      return `<div class="token${selectedTokenId===t.id?' selected':''}" id="tok-${t.id}"
        style="left:${t.x*CELL+2}px;top:${t.y*CELL+2}px;width:${sz}px;height:${totalH}px;
          background:transparent;
          border:none;color:#fff;
          font-size:${CELL>50?'12':'10'}px;overflow:visible;flex-direction:column;gap:0;
          ${isEffect?'border-radius:4px!important;':''}
          display:flex;flex-direction:column;align-items:center;justify-content:flex-start"
        data-id="${t.id}"
        ondblclick="showTokenCard(event,'${t.id}')"
        title="${esc(t.label)}${linked?' ('+esc(linked.name)+')':linkedBeast?' ('+esc(linkedBeast.name)+')':''}${t.hpMax>0?' HP:'+t.hpCur+'/'+t.hpMax:''}"
        >
        <!-- Token circle -->
        <div style="width:${sz}px;height:${sz}px;border-radius:${isEffect?'4px':'50%'};overflow:hidden;
          background:${isEffect?t.color+'44':hasImg?'transparent':t.color+'cc'};
          border:${isEffect?'2px dashed':' 2px solid'} ${t.color};
          box-shadow:0 0 ${isEffect?'14':'8'}px ${t.color}88;
          display:flex;align-items:center;justify-content:center;flex-shrink:0">
          ${isEffect
            ?`<div style="pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:2px">
                <span style="font-size:${CELL>40?'18':'12'}px">${t.icon||'✨'}</span>
                ${CELL>30?`<span style="font-size:9px;font-weight:700;text-shadow:0 0 4px #000">${esc(shortLabel)}</span>`:''}
              </div>`
            :hasImg
              ?`<img src="${t.image||linked?.avatarImg||linkedBeast?.image}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none">`
              :`<span style="font-size:${CELL>40?'12':'10'}px;font-weight:900;pointer-events:none">${esc(shortLabel)}</span>`}
        </div>
        <!-- Barre HP en dessous du cercle -->
        ${hpH>0?`<div style="width:${sz}px;height:6px;background:rgba(0,0,0,.55);border-radius:0 0 4px 4px;overflow:hidden;margin-top:2px;flex-shrink:0">
          <div style="height:100%;width:${Math.round(hpPct*100)}%;background:${hpCol};transition:width .3s;box-shadow:0 0 4px ${hpCol}88"></div>
        </div>`:''}
      </div>`;}).join('')}
    <!-- NOTE PINS -->
    ${(map.pins||[]).map(n=>`<div style="position:absolute;left:${n.x*CELL+2}px;top:${n.y*CELL+2}px;width:${CELL-4}px;height:${CELL-4}px;
        display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:40">
        <div style="background:#fbbf24cc;color:#1a1a2e;font-size:9px;font-weight:700;padding:2px 4px;border-radius:3px;
          max-width:${CELL*2}px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:auto;cursor:pointer;
          box-shadow:0 1px 4px rgba(0,0,0,.4)" title="${esc(n.text)}">📝 ${esc(n.text.length>12?n.text.slice(0,12)+'…':n.text)}</div>
      </div>`).join('')}
  </div>
  <div style="margin-top:8px;display:flex;gap:14px;font-size:12px;flex-wrap:wrap;align-items:center">
    <span style="color:#4ade80">● Alliés</span>
    <span style="color:#f87171">● Ennemis</span>
    <span style="color:#fbbf24">● Neutres</span>
    <span style="color:#c084fc">✦ Effets/Sorts</span>
    <div style="flex:1"></div>
    <label style="color:var(--dim);font-size:12px;display:flex;align-items:center;gap:6px">Taille cellule:
      <input type="range" min="28" max="72" step="4" value="${CELL}"
        style="width:80px;accent-color:var(--indigo)"
        oninput="const m=DB.battlemaps.find(x=>x.id===selectedMapId);if(m){m.cellSize=+this.value;save();renderMapCanvas()}">
      <span style="color:var(--indigo);font-weight:700;min-width:22px">${CELL}</span>
    </label>
    <span style="color:var(--dim)">Outil: <span id="tool-label" style="color:var(--indigo)"></span></span>
  </div>`;
  updateToolLabel();
}



// ── Popup détail d'un sort (vignette sorts) ─────────────────

// Stores equip card data for popup (avoid inline JSON issues)
window._eqCardData = [];
function _storeEq(d){ return (window._eqCardData=window._eqCardData||[]).push(d)-1; }
function showEquipIdx(evt, idx){ showEquipDetail(evt, window._eqCardData[idx]?.slot||'', window._eqCardData[idx]||{}); }

// ── Popup détail équipement porté ─────────────────────────────
// ── Lancers de dés pour les armes ─────────────────────────────
function parseDiceExpr(expr){
  // Supporte: "1d6+3", "2d8-1", "+5", "3", "1d20"
  if(!expr) return null;
  const s = String(expr).replace(/\s/g,'');
  // Bonus seul: +5, -2, 5
  const bonusOnly = s.match(/^([+-]?\d+)$/);
  if(bonusOnly) return {dice:0,sides:1,bonus:+bonusOnly[1],raw:s};
  // XdY+Z
  const full = s.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if(full) return {dice:+full[1],sides:+full[2],bonus:+(full[3]||0),raw:s};
  return null;
}

function rollDice(n,sides){
  let total=0, rolls=[];
  for(let i=0;i<n;i++){ const r=Math.floor(Math.random()*sides)+1; rolls.push(r); total+=r; }
  return {total,rolls};
}

function showRollResult(name, label, rolls, bonus, total, col){
  document.getElementById('dice-roll-popup')?.remove();
  const popup = document.createElement('div');
  popup.id = 'dice-roll-popup';
  popup.style.cssText = `position:fixed;z-index:9100;bottom:24px;right:24px;
    background:var(--surface);border:2px solid ${col};border-radius:14px;
    padding:16px 20px;min-width:220px;box-shadow:0 8px 40px rgba(0,0,0,.5);
    animation:slideUp .18s ease-out;`;
  popup.innerHTML = `
    <div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">${esc(name)} — ${esc(label)}</div>
    <div style="display:flex;align-items:baseline;gap:8px">
      <div style="font-size:44px;font-weight:900;color:${col};font-family:'Cinzel',serif;line-height:1">${total}</div>
      <div style="color:var(--dim);font-size:12px">
        ${rolls.length?`[${rolls.join(' + ')}]${bonus!==0?' '+(bonus>0?'+':'')+bonus:''}`:bonus>0?'+'+bonus:bonus}
      </div>
    </div>
    ${rolls.length===1&&rolls[0]===20?`<div style="color:#fbbf24;font-weight:700;font-size:13px;margin-top:4px">⭐ CRITIQUE !</div>`:''}
    ${rolls.length===1&&rolls[0]===1?`<div style="color:#ef4444;font-weight:700;font-size:13px;margin-top:4px">💀 FUMBLE !</div>`:''}
    <div style="margin-top:8px;font-size:11px;color:var(--dim);text-align:right;cursor:pointer" onclick="this.closest('#dice-roll-popup').remove()">✕ Fermer</div>
  `;
  document.body.appendChild(popup);
  setTimeout(()=>{ if(popup.parentNode) popup.remove(); }, 8000);
}

// ── Roll from inventory weapon ────────────────────────────────
function rollWeaponFromInv(memberId, src, ref, mode){
  const m = DB.members.find(x=>x.id===memberId); if(!m) return;
  let w;
  if(src==='inv')    w = (m.inventory||[]).find(x=>x.id===+ref||x.id===ref);
  else               w = (m.weapons||[])[+ref];
  if(!w) return;
  if(!mode||mode==='atk'){
    const atk = parseDiceExpr(w.atkBonus!==undefined ? String(w.atkBonus) : (w.atk||'+0'));
    const d20 = Math.floor(Math.random()*20)+1;
    const bonus = atk ? atk.bonus : 0;
    showRollResult(w.name, 'Jet d\u2019attaque', [d20], bonus, d20+bonus, '#38bdf8');
  } else {
    const dice = w.dmgDice || (w.dmg ? w.dmg.match(/\d+d\d+/)?.[0] : null) || '1d4';
    const bonusRaw = w.dmgBonus!==undefined ? w.dmgBonus : (parseDiceExpr(w.dmg||'0')?.bonus||0);
    const parsed = parseDiceExpr(dice);
    const rolls = [];
    for(let r=0;r<(parsed?.dice||1);r++) rolls.push(Math.floor(Math.random()*(parsed?.sides||4))+1);
    const total = rolls.reduce((a,b)=>a+b,0) + (+bonusRaw||0);
    showRollResult(w.name, "Dégâts"+(w.dmgType?" "+w.dmgType:""), rolls, +bonusRaw||0, total, '#fbbf24');
  }
}

// ── Quick-add weapon directly to inventory ────────────────────
function openAddWeaponItem(memberId){
  const m = DB.members.find(x=>x.id===memberId); if(!m) return;
  // Pre-fill a weapon item template and open the member inv modal
  const preItem = {id:uid(),name:'',qty:1,category:'Arme',rarity:'Commun',equippedSlot:'mainhand',
    atkBonus:0,dmgDice:'1d6',dmgBonus:0,dmgType:'Tranchant',weaponProps:'',description:'',emoji:'⚔️',size:1};
  if(!m.inventory) m.inventory=[];
  m.inventory.push(preItem);
  const idx = m.inventory.length-1;
  // Open modal on this new item
  openMemberInvModal(idx);
}

function rollWeaponAtk(memberId, weapIdx){
  const m = DB.members.find(x=>x.id===memberId); if(!m) return;
  const w = (m.weapons||[])[weapIdx]; if(!w) return;
  // Attaque: d20 + bonus
  const atk = parseDiceExpr(w.atk);
  const d20 = Math.floor(Math.random()*20)+1;
  const bonus = atk ? atk.bonus : 0;
  const total = d20 + bonus;
  showRollResult(w.name, 'Jet d\'attaque', [d20], bonus, total, '#38bdf8');
}

function rollWeaponDmg(memberId, weapIdx){
  const m = DB.members.find(x=>x.id===memberId); if(!m) return;
  const w = (m.weapons||[])[weapIdx]; if(!w) return;
  // Dégâts: XdY+Z
  const dmg = parseDiceExpr(w.dmg);
  if(!dmg){ showRollResult(w.name,'Dégâts',[],0,0,'#fbbf24'); return; }
  const {total:diceTotal, rolls} = dmg.dice>0 ? rollDice(dmg.dice,dmg.sides) : {total:0,rolls:[]};
  const total = diceTotal + dmg.bonus;
  showRollResult(w.name, 'Dégâts', rolls, dmg.bonus, total, '#fbbf24');
}

function showEquipDetail(evt, slot, data){
  if(typeof data === 'string'){
    try{ data = JSON.parse(data); } catch(e){ return; }
  }
  if(!data || (!data.name || data.name==='—')) return;
  document.getElementById('equip-detail-popup')?.remove();

  const SLOT_COLOR = {armor:'#94a3b8',shield:'#94a3b8',helmet:'#94a3b8',boots:'#a78bfa',
    gloves:'#a78bfa',ring1:'#fbbf24',ring2:'#fbbf24',cloak:'#60a5fa',amulet:'#34d399',bag:'#4ade80'};
  const col = SLOT_COLOR[slot]||'#6366f1';

  const popup = document.createElement('div');
  popup.id = 'equip-detail-popup';
  popup.style.cssText = `position:fixed;z-index:9000;background:var(--surface);border:1px solid ${col}66;
    border-radius:12px;padding:16px;width:260px;max-width:90vw;box-shadow:0 8px 32px rgba(0,0,0,.4);`;
  popup.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div style="width:40px;height:40px;background:${col}22;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${data.ico||'🛡️'}</div>
      <div style="flex:1">
        <div style="font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:.08em">${esc(data.label||slot)}</div>
        <div style="font-family:'Cinzel',serif;font-weight:700;font-size:14px;color:var(--text)">${esc(data.name)}</div>
      </div>
    </div>
    ${data.bonus?`<div style="background:${col}22;color:${col};padding:4px 10px;border-radius:5px;font-size:12px;font-weight:600;margin-bottom:8px">${esc(data.bonus)}</div>`:''}
    ${data.desc?`<p style="color:var(--muted);font-size:13px;font-family:'Crimson Pro',serif;line-height:1.6;margin:0">${esc(data.desc)}</p>`:''}
    <div style="margin-top:8px;font-size:11px;color:var(--dim);border-top:1px solid var(--border);padding-top:6px">📦 Occupe 1 case d'inventaire</div>
  `;
  document.body.appendChild(popup);
  const rect = popup.getBoundingClientRect();
  let x = evt.clientX + 12, y = evt.clientY + 12;
  if(x + 270 > window.innerWidth)  x = evt.clientX - 270;
  if(y + rect.height + 10 > window.innerHeight) y = evt.clientY - rect.height - 10;
  popup.style.left = Math.max(8,x)+'px';
  popup.style.top  = Math.max(8,y)+'px';
  setTimeout(()=>document.addEventListener('click', function rm(e){
    if(!popup.contains(e.target)){ popup.remove(); document.removeEventListener('click',rm); }
  }), 10);
}

function showSpellDetail(evt, spObj, idx){
  if(idx !== null && idx !== undefined) spObj = (window._spellCards||[])[idx];
  if(!spObj) return;
  // Supprimer popup existant
  document.getElementById('spell-detail-popup')?.remove();
  const sCol = SCHOOL_COLOR[spObj.school]||'#a5b4fc';
  const popup = document.createElement('div');
  popup.id = 'spell-detail-popup';
  popup.style.cssText = `position:fixed;z-index:9000;background:var(--surface);border:1px solid ${sCol}66;
    border-radius:12px;padding:16px;width:300px;max-width:92vw;box-shadow:0 8px 32px rgba(0,0,0,.4);`;
  popup.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">
      ${spObj.icon?`<img src="${esc(spObj.icon)}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0">`
        :`<div style="width:44px;height:44px;background:${sCol}22;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">✨</div>`}
      <div style="flex:1;min-width:0">
        <div style="font-family:'Cinzel',serif;font-weight:700;font-size:15px;color:var(--text);margin-bottom:4px">${esc(spObj.name)}</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${spObj.level?`<span style="background:${sCol}22;color:${sCol};padding:2px 7px;border-radius:4px;font-size:11px">${esc(spObj.level)}</span>`:''}
          ${spObj.school?`<span style="background:${sCol}22;color:${sCol};padding:2px 7px;border-radius:4px;font-size:11px">${esc(spObj.school)}</span>`:''}
          ${spObj.concentration?`<span style="background:#fbbf2222;color:#fbbf24;padding:2px 7px;border-radius:4px;font-size:11px">Concentration</span>`:''}
          ${spObj.ritual?`<span style="background:#a78bfa22;color:#a78bfa;padding:2px 7px;border-radius:4px;font-size:11px">Rituel</span>`:''}
        </div>
      </div>
    </div>
    ${(spObj.castTime||spObj.range||spObj.duration||spObj.components)?`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;background:var(--surface2);border-radius:8px;padding:8px">
      ${spObj.castTime?`<div><div style="font-size:9px;color:var(--dim);text-transform:uppercase;margin-bottom:1px">Incantation</div><div style="font-size:12px;color:var(--text)">${esc(spObj.castTime)}</div></div>`:''}
      ${spObj.range?`<div><div style="font-size:9px;color:var(--dim);text-transform:uppercase;margin-bottom:1px">Portée</div><div style="font-size:12px;color:var(--text)">${esc(spObj.range)}</div></div>`:''}
      ${spObj.duration?`<div><div style="font-size:9px;color:var(--dim);text-transform:uppercase;margin-bottom:1px">Durée</div><div style="font-size:12px;color:var(--text)">${esc(spObj.duration)}</div></div>`:''}
      ${spObj.components?`<div><div style="font-size:9px;color:var(--dim);text-transform:uppercase;margin-bottom:1px">Composantes</div><div style="font-size:12px;color:var(--text)">${esc(spObj.components)}</div></div>`:''}
    </div>`:'' }
    ${spObj.description?`<p style="color:var(--muted);font-family:'Crimson Pro',serif;font-size:14px;line-height:1.65;margin:0;max-height:160px;overflow-y:auto">${esc(spObj.description)}</p>`:''}
  `;
  // Positionner près du clic
  document.body.appendChild(popup);
  const rect = popup.getBoundingClientRect();
  let x = evt.clientX + 12, y = evt.clientY + 12;
  if(x + 310 > window.innerWidth) x = evt.clientX - 320;
  if(y + rect.height + 10 > window.innerHeight) y = evt.clientY - rect.height - 10;
  popup.style.left = Math.max(8,x)+'px';
  popup.style.top  = Math.max(8,y)+'px';
  setTimeout(()=>document.addEventListener('click', function rm(e){
    if(!popup.contains(e.target)){ popup.remove(); document.removeEventListener('click',rm); }
  }), 10);
}

function showTokenCard(evt, tokenId){
  evt.stopPropagation();
  const map=DB.battlemaps.find(m=>m.id===selectedMapId); if(!map) return;
  const t=map.tokens.find(x=>x.id===tokenId); if(!t) return;
  const linked=t.memberId?DB.members.find(m=>m.id===t.memberId):null;
  const beast=t.beastId?DB.bestiary.find(b=>b.id===t.beastId):null;
  const entity=linked||beast;
  // Remove existing popup
  const old=document.getElementById('token-popup'); if(old) old.remove();
  const px=evt.clientX, py=evt.clientY;
  const popup=document.createElement('div');
  popup.id='token-popup';
  popup.style.cssText=`position:fixed;left:${Math.min(px+10,window.innerWidth-310)}px;top:${Math.min(py-10,window.innerHeight-400)}px;
    width:290px;background:var(--bg);border:1px solid var(--indigo);border-radius:10px;
    padding:14px;z-index:999;box-shadow:0 10px 40px rgba(0,0,0,.8);font-family:'Exo 2',sans-serif`;
  const hpPct=t.hpMax>0?Math.round(t.hpCur/t.hpMax*100):null;
  const hpCol=hpPct>=50?'#4ade80':hpPct>=25?'#fbbf24':'#f87171';
  popup.innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div style="width:42px;height:42px;border-radius:50%;background:${t.color}44;border:2px solid ${t.color};
        display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
        ${(t.image||entity?.avatarImg)?`<img src="${t.image||entity.avatarImg}" style="width:100%;height:100%;object-fit:cover">`:
          `<span style="font-size:18px">${t.icon||t.label.slice(0,2)||'?'}</span>`}
      </div>
      <div style="flex:1">
        <div style="font-family:'Cinzel',serif;font-weight:700;color:var(--text);font-size:14px">${esc(entity?.name||t.label)}</div>
        <div style="font-size:11px;color:var(--dim)">${entity?esc(linked?linked.clazz+' Niv.'+linked.level:beast?.type||'Créature'):'Token libre'}</div>
      </div>
      <button onclick="document.getElementById('token-popup').remove()" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:16px">✕</button>
    </div>
    ${t.hpMax>0?`<div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:3px">
        <span>PV</span><span style="color:${hpCol};font-weight:700">${t.hpCur}/${t.hpMax} (${hpPct}%)</span>
      </div>
      <div style="height:6px;background:var(--surface2);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${hpPct}%;background:${hpCol};transition:width .3s"></div>
      </div>
    </div>`:''}
    ${linked?`
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:8px">
        ${['str','dex','con','int','wis','cha'].map(k=>`
          <div style="background:var(--surface2);border-radius:5px;padding:4px;text-align:center">
            <div style="font-size:8px;color:var(--dim);text-transform:uppercase">${k.toUpperCase()}</div>
            <div style="font-size:13px;font-weight:700;color:var(--text)">${linked.stats?.[k]||10}</div>
            <div style="font-size:9px;color:var(--indigo)">${modStr(linked.stats?.[k]||10)}</div>
          </div>`).join('')}
      </div>
      <div style="display:flex;gap:8px;font-size:11px;color:var(--muted)">
        <span>CA: <strong style="color:var(--text)">${linked.ac}</strong></span>
        <span>Init: <strong style="color:var(--text)">${linked.initiative}</strong></span>
        <span>Vit: <strong style="color:var(--text)">${linked.speed}</strong></span>
      </div>
      ${linked.weapons?.length?`<div style="margin-top:6px;font-size:11px;color:var(--dim)">
        ${linked.weapons.map(w=>`<div style="color:var(--text)">${esc(w.name)} <span style="color:var(--indigo)">${esc(w.atk)}</span> <span style="color:var(--muted)">${esc(w.dmg)}</span></div>`).join('')}
      </div>`:''}
    `:''}
    ${beast&&!linked?`
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px">
        ${beast.cr?`<span style="background:var(--surface2);padding:2px 7px;border-radius:4px;font-size:11px;color:var(--gold)">⚔️ FP ${beast.cr}</span>`:''}
        ${beast.hp?`<span style="background:var(--surface2);padding:2px 7px;border-radius:4px;font-size:11px;color:var(--green)">❤️ ${beast.hp}</span>`:''}
        ${beast.ac?`<span style="background:var(--surface2);padding:2px 7px;border-radius:4px;font-size:11px;color:var(--muted)">🛡️ CA ${beast.ac}</span>`:''}
        ${beast.speed?`<span style="background:var(--surface2);padding:2px 7px;border-radius:4px;font-size:11px;color:var(--muted)">💨 ${beast.speed}</span>`:''}
      </div>
      ${beast.actionsList?.length?`
        <div style="font-size:10px;color:var(--indigo);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">Actions</div>
        <div style="display:flex;flex-direction:column;gap:5px;max-height:130px;overflow-y:auto">
          ${beast.actionsList.map(a=>`
            <div style="background:var(--surface2);border-radius:5px;padding:6px 8px">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span style="font-weight:700;color:var(--text);font-size:12px">${esc(a.name)}</span>
                ${a.atk?`<span style="color:var(--green);font-size:11px">+${esc(a.atk)}</span>`:''}
                ${a.dmg?`<span style="color:#f87171;font-size:11px">${esc(a.dmg)}</span>`:''}
              </div>
              ${a.desc?`<div style="color:var(--dim);font-size:10px;line-height:1.4;margin-top:2px">${esc(a.desc)}</div>`:''}
            </div>`).join('')}
        </div>`
      :beast.actions?`<div style="font-size:11px;color:var(--muted);border-top:1px solid var(--border);padding-top:5px;max-height:80px;overflow-y:auto">${esc(beast.actions)}</div>`:''}
    `:''}  
  `;
  document.body.appendChild(popup);
  setTimeout(()=>document.addEventListener('click',function rm(e){if(!popup.contains(e.target)){popup.remove();document.removeEventListener('click',rm);}},true),100);
}

let _playlistCurrentId=null, _playlistLoop=false;

function playlistPlay(mediaId){
  const m=DB.media.find(x=>x.id==mediaId||x.id===+mediaId);
  if(!m||!m.data) return;
  const audio=document.getElementById('map-audio');
  if(!audio) return;
  _playlistCurrentId=m.id;
  audio.src=m.data;
  audio.onended=()=>playlistNext();
  audio.play().catch(()=>{});
  // Update icons
  document.querySelectorAll('[id^="pl-icon-"]').forEach(el=>{el.textContent='▶';el.style.color='var(--dim)';});
  const ic=document.getElementById('pl-icon-'+m.id);
  if(ic){ic.textContent='⏸';ic.style.color='var(--indigo)';}
  const pp=document.getElementById('playlist-pp'); if(pp) pp.textContent='⏸';
}

function playlistPlayPause(){
  const audio=document.getElementById('map-audio'); if(!audio) return;
  if(audio.paused){
    if(!_playlistCurrentId){
      const first=DB.media.find(m=>m.type==='audio');
      if(first) playlistPlay(first.id);
    } else {
      audio.play().catch(()=>{});
      const ic=document.getElementById('pl-icon-'+_playlistCurrentId);
      if(ic){ic.textContent='⏸';ic.style.color='var(--indigo)';}
      const pp=document.getElementById('playlist-pp'); if(pp) pp.textContent='⏸';
    }
  } else {
    audio.pause();
    const ic=document.getElementById('pl-icon-'+_playlistCurrentId);
    if(ic){ic.textContent='▶';ic.style.color='var(--dim)';}
    const pp=document.getElementById('playlist-pp'); if(pp) pp.textContent='▶';
  }
}

function playlistNext(){
  const audios=DB.media.filter(m=>m.type==='audio');
  if(!audios.length) return;
  const idx=audios.findIndex(m=>m.id==_playlistCurrentId);
  const next=audios[(idx+1)%audios.length];
  if(next) playlistPlay(next.id);
}

function playlistPrev(){
  const audios=DB.media.filter(m=>m.type==='audio');
  if(!audios.length) return;
  const idx=audios.findIndex(m=>m.id==_playlistCurrentId);
  const prev=audios[(idx-1+audios.length)%audios.length];
  if(prev) playlistPlay(prev.id);
}

function togglePlaylistLoop(){
  _playlistLoop=!_playlistLoop;
  const btn=document.getElementById('playlist-loop');
  if(btn) btn.style.color=_playlistLoop?'var(--indigo)':'var(--dim)';
  const audio=document.getElementById('map-audio');
  if(audio) audio.loop=_playlistLoop;
}

// Legacy compat
function playMapMedia(mediaId){ playlistPlay(mediaId); }

function updateSelTokenProp(prop, val){
  if(!selectedTokenId) return;
  const map=DB.battlemaps.find(m=>m.id===selectedMapId);
  if(!map) return;
  const tok=map.tokens.find(t=>t.id===selectedTokenId);
  if(!tok) return;
  tok[prop]=val;
  save();
  renderMapCanvas();
  // keep selection
  setTimeout(()=>{ selectedTokenId=tok.id; refreshSelTokenPanel(); },0);
}

function refreshSelTokenPanel(){
  const panel=document.getElementById('sel-token-panel');
  if(!panel) return;
  if(!selectedTokenId){ panel.style.display='none'; return; }
  const map=DB.battlemaps.find(m=>m.id===selectedMapId);
  if(!map) return;
  const tok=map.tokens.find(t=>t.id===selectedTokenId);
  if(!tok){ panel.style.display='none'; return; }
  panel.style.display='block';
  const sizeIn=document.getElementById('tok-size-input');
  const hpCur=document.getElementById('tok-hp-cur');
  const hpMax=document.getElementById('tok-hp-max');
  if(sizeIn) sizeIn.value=tok.size||1;
  if(hpCur) hpCur.value=tok.hpCur||0;
  if(hpMax) hpMax.value=tok.hpMax||0;
}
function setTool(t){
  activeTool=t;
  // Reset measure state when switching away
  if(t!=='measure'){ _measureStart=null; const ml=document.getElementById('measure-line'); if(ml) ml.remove(); const mt=document.getElementById('measure-tooltip'); if(mt) mt.remove(); }
  document.querySelectorAll('[id^="tool-"]').forEach(b=>{
    const id=b.id.replace('tool-','');
    b.className='btn btn-sm '+(id===t?'btn-primary':'btn-ghost');
    b.style.justifyContent='flex-start'; b.style.gap='8px'; b.style.textAlign='left';
  });
  updateToolLabel();
  const grid=document.getElementById('map-grid');
  if(grid) grid.style.cursor=t==='select'?'default':'crosshair';
  refreshSelTokenPanel();
}
function updateToolLabel(){
  const el=document.getElementById('tool-label');
  if(el) el.textContent={select:'Sélection',token:'Placer Token',effect:'Placer Effet',erase:'Effacer',measure:'Mesurer',note:'Placer Note'}[activeTool]||activeTool;
}

// ── Measure tool state ────────────────────────────────────────
let _measureStart = null; // {x,y} in cell coords

function mapMouseDown(e){
  const grid=document.getElementById('map-grid');
  if(!grid) return;
  const rect=grid.getBoundingClientRect();
  const cx=Math.floor((e.clientX-rect.left)/CELL);
  const cy=Math.floor((e.clientY-rect.top)/CELL);
  const map=DB.battlemaps.find(m=>m.id===selectedMapId);
  if(!map) return;

  if(activeTool==='erase'){
    const tok=map.tokens.find(t=>t.x===cx&&t.y===cy);
    if(tok){map.tokens=map.tokens.filter(t=>t.id!==tok.id);save();renderMapCanvas();}
    return;
  }
  if(activeTool==='token'){
    const tok=e.target.closest('.token');
    if(tok){selectedTokenId=tok.dataset.id;return;}
    openAddTokenModal(cx,cy,'ally');
    return;
  }
  if(activeTool==='effect'){
    const tok=e.target.closest('.token');
    if(tok){selectedTokenId=tok.dataset.id;return;}
    openAddTokenModal(cx,cy,'effect');
    return;
  }
  if(activeTool==='measure'){
    if(!_measureStart){
      _measureStart={x:cx,y:cy};
      toast('📏 Cliquez sur la case d\'arrivée');
    } else {
      const dx=Math.abs(cx-_measureStart.x), dy=Math.abs(cy-_measureStart.y);
      const dist=Math.max(dx,dy); // D&D 5e diagonal = max(dx,dy) in cells
      const distM = dist * 1.5; // 1 case = 1.5m
      // Draw visual line
      showMeasureLine(grid, rect, _measureStart.x, _measureStart.y, cx, cy, dist, distM);
      _measureStart=null;
    }
    return;
  }
  if(activeTool==='note'){
    const noteText=prompt('📝 Texte de la note :');
    if(!noteText||!noteText.trim()) return;
    if(!map.pins) map.pins=[];
    map.pins.push({id:'n'+uid(),x:cx,y:cy,text:noteText.trim()});
    save(); renderMapCanvas();
    toast('📝 Note ajoutée !');
    return;
  }
  // select tool (default)
  const tok=e.target.closest('.token');
  if(tok){
    isDragging=true;
    dragTokenId=tok.dataset.id;
    selectedTokenId=dragTokenId;
    const t=map.tokens.find(x=>x.id===dragTokenId);
    if(t){
      dragOffset.x=(e.clientX-rect.left)-t.x*CELL;
      dragOffset.y=(e.clientY-rect.top)-t.y*CELL;
    }
    e.preventDefault();
  } else {
    selectedTokenId=null;
    // Check if clicked on a note pin to edit/delete
    if(map.pins){
      const note=map.pins.find(n=>n.x===cx&&n.y===cy);
      if(note){
        const action=prompt(`📝 "${note.text}"\n\nModifier le texte (ou tapez SUPPR pour supprimer) :`, note.text);
        if(action===null) return;
        if(action.trim().toUpperCase()==='SUPPR'){ map.pins=map.pins.filter(n=>n.id!==note.id); }
        else { note.text=action.trim(); }
        save(); renderMapCanvas();
      }
    }
  }
}

function showMeasureLine(grid, rect, x1, y1, x2, y2, distCells, distM){
  // Remove old
  document.getElementById('measure-line')?.remove();
  document.getElementById('measure-tooltip')?.remove();
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.id='measure-line';
  svg.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50';
  const line=document.createElementNS('http://www.w3.org/2000/svg','line');
  line.setAttribute('x1',(x1+.5)*CELL); line.setAttribute('y1',(y1+.5)*CELL);
  line.setAttribute('x2',(x2+.5)*CELL); line.setAttribute('y2',(y2+.5)*CELL);
  line.setAttribute('stroke','#fbbf24'); line.setAttribute('stroke-width','3');
  line.setAttribute('stroke-dasharray','6,4'); line.setAttribute('stroke-linecap','round');
  svg.appendChild(line);
  // Circles at endpoints
  [x1,y1,x2,y2].forEach((v,i)=>{
    if(i%2===0){ const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx',(i===0?x1:x2)*CELL+CELL/2); c.setAttribute('cy',(i===0?y1:y2)*CELL+CELL/2);
      c.setAttribute('r','5'); c.setAttribute('fill','#fbbf24'); svg.appendChild(c); }
  });
  grid.style.position='relative';
  grid.appendChild(svg);
  // Distance tooltip
  const tip=document.createElement('div');
  tip.id='measure-tooltip';
  tip.style.cssText=`position:absolute;z-index:55;background:#1a1a2eee;color:#fbbf24;padding:5px 10px;border-radius:6px;font-size:13px;font-weight:700;border:1px solid #fbbf2466;pointer-events:none;`;
  tip.style.left=((x1+x2)/2+.5)*CELL+'px';
  tip.style.top=((y1+y2)/2)*CELL-12+'px';
  tip.textContent=`${distCells} case${distCells>1?'s':''} · ${distM}m`;
  grid.appendChild(tip);
  // Auto-remove after 6s
  setTimeout(()=>{svg.remove();tip.remove();},6000);
}

function mapMouseMove(e){
  if(!isDragging||!dragTokenId) return;
  const grid=document.getElementById('map-grid');
  if(!grid) return;
  const rect=grid.getBoundingClientRect();
  const map=DB.battlemaps.find(m=>m.id===selectedMapId);
  if(!map) return;
  const nx=Math.floor((e.clientX-rect.left-dragOffset.x/2)/CELL);
  const ny=Math.floor((e.clientY-rect.top-dragOffset.y/2)/CELL);
  const cx=Math.max(0,Math.min(map.width-1,nx));
  const cy=Math.max(0,Math.min(map.height-1,ny));
  const t=map.tokens.find(x=>x.id===dragTokenId);
  if(t&&(t.x!==cx||t.y!==cy)){
    t.x=cx;t.y=cy;
    const el=document.getElementById('tok-'+dragTokenId);
    if(el){el.style.left=cx*CELL+2+'px';el.style.top=cy*CELL+2+'px';}
  }
}

function mapMouseUp(e){
  if(isDragging){save();}
  isDragging=false;dragTokenId=null;
}

function openAddTokenModal(cx,cy,initType){
  const _initType=initType||'ally'; const _initColor=_initType==='effect'?'#c084fc':_initType==='enemy'?'#f87171':'#4ade80';
  window._newTok={label:'?',color:_initColor,type:_initType,image:null,memberId:null,beastId:null,size:1,hpCur:0,hpMax:0,icon:'✨'};
  openModal(`<div class="modal modal-wide" onclick="event.stopPropagation()">
    <div class="modal-header"><span class="modal-title">🪙 Placer un Token (${cx},${cy})</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="grid2">
        <div class="field"><label>Nom / Label</label><input value="?" oninput="window._newTok.label=this.value" placeholder="Gobelin, Héros, E1..."></div>
        <div class="field"><label>Type</label><select onchange="window._newTok.type=this.value;window._newTok.color=this.value==='ally'?'#4ade80':this.value==='enemy'?'#f87171':'#fbbf24'">
          <option value="ally">Allié</option><option value="enemy">Ennemi</option><option value="neutral">Neutre</option><option value="effect">Effet/Sort</option>
        </select></div>
        <div class="field"><label>Couleur</label><input type="color" value="#4ade80" oninput="window._newTok.color=this.value" style="width:60px;height:34px;background:none;border:none;cursor:pointer"></div>
        <div class="field"><label>Taille (en cases)</label><input type="number" value="1" min="1" max="6" oninput="window._newTok.size=+this.value"></div>
        <div class="field"><label>🩸 HP Max (0 = pas de barre)</label><input type="number" value="0" min="0" oninput="window._newTok.hpMax=+this.value;window._newTok.hpCur=+this.value"></div>
        <div class="field"><label>Icône (effets seulement)</label><input value="✨" oninput="window._newTok.icon=this.value" style="font-size:20px;width:60px;text-align:center"></div>
        <div class="field"><label>Lier à un Personnage (optionnel)</label>
          <select onchange="const v=this.value;if(v===''){window._newTok.memberId=null;}else{window._newTok.memberId=+v;const m=DB.members.find(x=>x.id===+v);if(m&&m.name)window._newTok.label=m.name.slice(0,8);}">
            <option value="">— Aucun —</option>
            ${DB.members.map(m=>`<option value="${m.id}">${m.avatar} ${esc(m.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Lier à une Créature (Bestiaire)</label>
          <select onchange="const v=this.value;if(v===''){window._newTok.beastId=null;}else{window._newTok.beastId=+v;const b=DB.bestiary.find(x=>x.id===+v);if(b&&b.name)window._newTok.label=b.name.slice(0,8);}">
            <option value="">— Aucun —</option>
            ${(DB.bestiary||[]).map(b=>`<option value="${b.id}">${b.icon||'👾'} ${esc(b.name)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field">
        <label>🖼️ Image personnalisée (optionnel, remplace avatar lié)</label>
        <label class="img-upload-btn" style="min-height:70px">
          <span style="font-size:22px">🖼️</span><span>Image optionnelle</span>
          <input type="file" accept="image/*" style="display:none" onchange="readFile(this.files[0],d=>{window._newTok.image=d;this.closest('label').innerHTML='<img src=\''+d+'\' style=\'max-height:60px;border-radius:50%\'><input type=\'file\' accept=\'image/*\' style=\'display:none\' onchange=\'readFile(this.files[0],d2=>{window._newTok.image=d2})\'>'})">
        </label>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="placeToken(${cx},${cy})">Placer</button>
      </div>
    </div>
  </div>`);
}

function placeToken(cx,cy){
  const map=DB.battlemaps.find(m=>m.id===selectedMapId);
  if(!map) return;
  const tok={id:'t'+uid(),...window._newTok,x:cx,y:cy,size:window._newTok.size||1,hpCur:window._newTok.hpCur||0,hpMax:window._newTok.hpMax||0}; map.tokens.push(tok);
  save();closeModal();renderMapCanvas();
}

function saveMapNotes(v){
  const map=DB.battlemaps.find(m=>m.id===selectedMapId);
  if(map){map.notes=v;save();}
}

function uploadMapBg(input){
  if(!input.files[0]) return;
  readFile(input.files[0],data=>{
    const map=DB.battlemaps.find(m=>m.id===selectedMapId);
    if(!map) return;
    map.bgImage=data;save();renderMapCanvas();toast('Image de fond appliquée !');
  });
}

function clearMapBg(){
  const map=DB.battlemaps.find(m=>m.id===selectedMapId);
  if(!map) return;
  deleteBlob('bm_bg_'+map.id);
  map.bgImage=null;save();renderMapCanvas();
}

function openMapModal(){
  window._newMap={name:'',width:20,height:14,terrain:'urban',notes:''};
  openModal(`<div class="modal" onclick="event.stopPropagation()" style="max-width:420px">
    <div class="modal-header"><span class="modal-title">🗺️ Nouvelle Battlemap</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="field"><label>Nom</label><input oninput="window._newMap.name=this.value" placeholder="Caverne des Ombres..."></div>
      <div class="grid2">
        <div class="field"><label>Largeur</label><input type="number" value="20" min="5" max="40" oninput="window._newMap.width=+this.value"></div>
        <div class="field"><label>Hauteur</label><input type="number" value="14" min="5" max="40" oninput="window._newMap.height=+this.value"></div>
      </div>
      <div class="field"><label>Terrain</label><select onchange="window._newMap.terrain=this.value">
        <option value="urban">Urbain</option><option value="astral">Astral</option>
        <option value="forest">Forêt</option><option value="dungeon">Donjon</option>
      </select></div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="createMap()">Créer</button>
      </div>
    </div>
  </div>`);
}

function createMap(){
  const m=window._newMap;
  if(!m.name.trim()) return;
  const map={id:uid(),...m,tokens:[],bgImage:null};
  DB.battlemaps.push(map);selectedMapId=map.id;
  save();closeModal();renderBattlemap();toast('Map créée !');
}

function deleteMap(id){
  if(!confirm('Supprimer cette map ?')) return;
  deleteBlob('bm_bg_'+id);
  DB.battlemaps=DB.battlemaps.filter(m=>m.id!==id);
  selectedMapId=DB.battlemaps[0]?.id||null;
  save();renderBattlemap();
}

