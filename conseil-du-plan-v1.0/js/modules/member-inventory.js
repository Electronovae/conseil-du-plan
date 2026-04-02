/**
 * INVENTAIRE PERSO — sous-modale
 * Extrait de V7_6.html lignes 3829-4100
 */
// ================================================================
// INVENTAIRE PERSO — même pattern que sorts
// ================================================================
function renderMemberInvItems(inv){
  if(!inv.length) return `<div style="color:var(--dim);font-style:italic;font-size:13px;padding:20px;text-align:center">Aucun objet. Cliquez sur "+ Ajouter un objet".</div>`;
  return inv.map((item,i)=>`
    <div style="background:var(--surface);border:1px solid var(--border2);border-radius:6px;padding:8px 12px;margin-bottom:6px;display:flex;align-items:center;gap:8px">
      <div style="width:28px;height:28px;background:var(--surface2);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:14px;overflow:hidden;flex-shrink:0">
        ${item.emoji?`<span style="font-size:22px">${esc(item.emoji)}</span>`:item.icon?`<img src="${item.icon}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-size:22px">${CAT_ICON[item.category]||'📦'}</span>`}
      </div>
      <span style="flex:1;color:var(--text);font-size:13px">${esc(item.name)}</span>
      ${badge(item.rarity)}
      <span style="background:var(--surface2);padding:2px 7px;border-radius:4px;color:var(--text);font-weight:700;font-size:12px">×${item.qty}</span>
      <button class="btn btn-outline btn-xs" onclick="openMemberInvModal(${i})">✏️</button>
      <button class="btn btn-danger btn-xs" onclick="em_removeInvItem(${i})">✕</button>
    </div>`).join('');
}

function refreshMemberInvList(){
  const el=document.getElementById('member-inv-list');
  if(el) el.innerHTML=renderMemberInvItems(window._editMember?.inventory||[]);
}

function em_removeInvItem(i){
  const em = window._editMember || DB.members.find(x=>x.id===selectedMemberId);
  if(!em) return;
  em.inventory.splice(i,1);
  if(window._editMember){ refreshMemberInvList(); }
  else { save(); renderMemberDetail(); updateStats(); }
}

function openMemberInvModal(invIdx){
  // Support both contexts: within the member modal (_editMember) and from the detail tab (selectedMemberId)
  const em = window._editMember || DB.members.find(x=>x.id===selectedMemberId);
  if(!em) return;
  const src=(invIdx!==undefined&&invIdx!==null)?em.inventory[invIdx]:null;
  const item=src?JSON.parse(JSON.stringify(src)):{id:uid(),name:'',qty:1,category:'Équipement',rarity:'Commun',description:'',icon:null,w:1,h:1};
  window._editMemberInvItem=item; window._editMemberInvIdx=invIdx;

  const mc=document.getElementById('modal-container');
  const overlay=document.createElement('div');
  overlay.className='overlay'; overlay.id='minv-overlay';
  overlay.style.zIndex='600';
  overlay.innerHTML=`<div class="modal" onclick="event.stopPropagation()">
    <div class="modal-header"><span class="modal-title">${src?'✏️ Modifier':'+ Ajouter'} un Objet</span><button class="modal-close" onclick="closeMemberInvModal()">✕</button></div>
    <div class="modal-body">
      <div class="field"><label>Nom</label><input value="${esc(item.name)}" oninput="window._editMemberInvItem.name=this.value" placeholder="Potion de soins..."></div>
      <div class="grid2">
        <div class="field"><label>Quantité</label><input type="number" value="${item.qty}" oninput="window._editMemberInvItem.qty=+this.value||1" min="1" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px"></div>
        <div class="field"><label>Taille (cases occupées)</label>
          <input type="number" value="${item.size!==undefined?item.size:(item.w||1)}" min="0" max="20"
            oninput="window._editMemberInvItem.size=+this.value"
            style="width:80px;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px">
          <span style="color:var(--dim);font-size:11px">case(s) dans le sac</span>
        </div></div>/div>
      <div class="grid2">
        <div class="field"><label>Catégorie</label>
          <select onchange="
  window._editMemberInvItem.category=this.value;
  window._editMemberInvItem.equippedSlot=CAT_TO_SLOT[this.value]||window._editMemberInvItem.equippedSlot||'';
  const _bf=document.getElementById('minv-bag-bonus-field');if(_bf)_bf.style.display=this.value==='Sac'?'block':'none';
  const _wf=document.getElementById('minv-weapon-fields');if(_wf)_wf.style.display=this.value==='Arme'?'block':'none';
  const _apf=document.getElementById('minv-armor-penalty-field');if(_apf)_apf.style.display=this.value==='Armure'?'block':'none';
  const _ef=document.getElementById('minv-equip-bonus-field');
  const _sl=window._editMemberInvItem.equippedSlot||'';
  if(_ef)_ef.style.display=(_sl&&_sl!=='bag'&&!['mainhand','offhand','ranged'].includes(_sl))?'block':'none';
"
            style="width:100%">
            ${ITEM_CATS.map(cat=>`<option value="${cat}"${cat===item.category?' selected':''}>${CAT_ICON[cat]||''} ${cat}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>🎽 Slot équipé</label>
          <select onchange="
  window._editMemberInvItem.equippedSlot=this.value;
  const _bf=document.getElementById('minv-bag-bonus-field');
  const _ef=document.getElementById('minv-equip-bonus-field');
  const _wf=document.getElementById('minv-weapon-fields');
  const _isWeaponSlot=['mainhand','offhand','ranged'].includes(this.value);
  if(_bf) _bf.style.display=(window._editMemberInvItem.category==='Sac')?'block':'none';
  if(_wf) _wf.style.display=(window._editMemberInvItem.category==='Arme'||_isWeaponSlot)?'block':'none';
  if(_ef) _ef.style.display=(this.value&&this.value!=='bag'&&!_isWeaponSlot)?'block':'none';
" style="width:100%">
            <option value="">— Non équipé —</option>
            ${[['mainhand','⚔️ Main Principale'],['offhand','🗡️ Main Secondaire'],['ranged','🏹 Distance'],
               ['bag','🎒 Sac'],['outfit','👘 Tenue complète'],['armor','🛡️ Armure'],['shield','🔰 Bouclier'],['helmet','⛑️ Casque'],
               ['boots','👢 Bottes'],['gloves','🧤 Gants'],['ring1','💍 Anneau 1'],['ring2','💍 Anneau 2'],
               ['cloak','🧥 Cape'],['amulet','📿 Amulette']
              ].map(([v,l])=>`<option value="${v}"${item.equippedSlot===v?' selected':''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>
            <!-- Champs arme (visible si catégorie = Arme) -->
      <div id="minv-weapon-fields" style="display:${item.category==='Arme'?'block':'none'}">
        <div style="background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:12px;margin-bottom:10px">
          <div style="font-size:10px;color:var(--gold);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">⚔️ Statistiques de l'Arme</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
            <div class="field" style="margin:0">
              <label style="font-size:10px">🎲 Bonus d'attaque (ex: +5)</label>
              <input placeholder="+0" value="${item.atkBonus||''}"
                oninput="window._editMemberInvItem.atkBonus=this.value;window._editMemberInvItem.atk=this.value"
                style="width:100%;background:var(--bg);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px">
            </div>
            <div class="field" style="margin:0">
              <label style="font-size:10px">💥 Dés de dégâts (ex: 1d8)</label>
              <input placeholder="1d6" value="${item.dmgDice||''}"
                oninput="window._editMemberInvItem.dmgDice=this.value;window._editMemberInvItem.dmg=(this.value+(window._editMemberInvItem.dmgBonus?'+'+window._editMemberInvItem.dmgBonus:''))"
                style="width:100%;background:var(--bg);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px">
            </div>
            <div class="field" style="margin:0">
              <label style="font-size:10px">➕ Bonus de dégâts (ex: +3)</label>
              <input type="number" placeholder="0" value="${item.dmgBonus!==undefined?item.dmgBonus:''}"
                oninput="window._editMemberInvItem.dmgBonus=this.value!==''?+this.value:undefined;window._editMemberInvItem.dmg=((window._editMemberInvItem.dmgDice||'1d6')+(this.value&&this.value!=='0'?'+'+this.value:''))"
                style="width:100%;background:var(--bg);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px">
            </div>
            <div class="field" style="margin:0">
              <label style="font-size:10px">🔥 Type de dégâts</label>
              <select onchange="window._editMemberInvItem.dmgType=this.value" style="width:100%;background:var(--bg);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px">
                <option value="">—</option>
                ${['Tranchant','Perforant','Contondant','Feu','Froid','Foudre','Acide','Poison','Nécrotique','Radieux','Force','Psionique'].map(t=>`<option value="${t}"${item.dmgType===t?' selected':''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="field" style="margin:0">
            <label style="font-size:10px">📝 Propriétés (finesse, polyvalente, lancer…)</label>
            <input placeholder="ex: finesse, légère" value="${item.weaponProps||''}"
              oninput="window._editMemberInvItem.weaponProps=this.value"
              style="width:100%;background:var(--bg);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px">
          </div>
        </div>
      </div>

            <!-- Pénalité d'encombrement armure (visible si catégorie = Armure) -->
      <div id="minv-armor-penalty-field" style="display:${item.category==='Armure'?'block':'none'}">
        <div style="background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:12px;margin-bottom:10px">
          <div style="font-size:10px;color:#f87171;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">🛡️ Encombrement de l'armure</div>
          <div class="field" style="margin:0">
            <label style="font-size:10px">Pénalité de cases (cases retirées à la capacité)</label>
            <div style="display:flex;align-items:center;gap:8px">
              <select onchange="window._editMemberInvItem.armorPenalty=+this.value"
                style="background:var(--bg);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px">
                <option value="0"${(item.armorPenalty||0)===0?' selected':''}>Aucune (0) — sans armure</option>
                <option value="2"${(item.armorPenalty||0)===2?' selected':''}>Légère (−2 cases)</option>
                <option value="4"${(item.armorPenalty||0)===4?' selected':''}>Intermédiaire (−4 cases)</option>
                <option value="8"${(item.armorPenalty||0)===8?' selected':''}>Lourde (−8 cases)</option>
              </select>
              <span style="color:var(--dim);font-size:11px">portée sur soi</span>
            </div>
          </div>
        </div>
      </div>

            <!-- Bonus équipement (visible selon slot) -->
      <div id="minv-equip-bonus-field" style="display:${item.equippedSlot&&item.equippedSlot!=='bag'?'block':'none'}">
        <div style="background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:12px;margin-bottom:10px">
          <div style="font-size:10px;color:var(--indigo);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">⚡ Bonus conférés par cet équipement</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            <!-- CA Bonus (armure, bouclier, casque) -->
            ${['armor','shield','helmet'].includes(item.equippedSlot)?`
            <div class="field" style="margin:0">
              <label style="font-size:10px">🛡️ Bonus CA</label>
              <input type="number" min="-20" max="20" placeholder="0"
                value="${item.bonusAC!==undefined?item.bonusAC:''}"
                oninput="window._editMemberInvItem.bonusAC=this.value!==''?+this.value:undefined"
                style="width:100%;background:var(--bg);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px">
            </div>`:''}
            <!-- DEX Bonus (bottes, gants) -->
            ${['boots','gloves','ring1','ring2','cloak','amulet'].includes(item.equippedSlot)?`
            <div class="field" style="margin:0">
              <label style="font-size:10px">🎯 Bonus DEX</label>
              <input type="number" min="-20" max="20" placeholder="0"
                value="${item.bonusDEX!==undefined?item.bonusDEX:''}"
                oninput="window._editMemberInvItem.bonusDEX=this.value!==''?+this.value:undefined"
                style="width:100%;background:var(--bg);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px">
            </div>`:''}
            <!-- STR Bonus (gants, armure) -->
            ${['gloves','armor'].includes(item.equippedSlot)?`
            <div class="field" style="margin:0">
              <label style="font-size:10px">💪 Bonus FOR</label>
              <input type="number" min="-20" max="20" placeholder="0"
                value="${item.bonusSTR!==undefined?item.bonusSTR:''}"
                oninput="window._editMemberInvItem.bonusSTR=this.value!==''?+this.value:undefined"
                style="width:100%;background:var(--bg);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px">
            </div>`:''}
            <!-- VIT Bonus (bottes) -->
            ${['boots'].includes(item.equippedSlot)?`
            <div class="field" style="margin:0">
              <label style="font-size:10px">💨 Bonus Vitesse</label>
              <input placeholder="ex: +3m"
                value="${item.bonusSpeed!==undefined?item.bonusSpeed:''}"
                oninput="window._editMemberInvItem.bonusSpeed=this.value||undefined"
                style="width:100%;background:var(--bg);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px">
            </div>`:''}
            <!-- Bonus libre pour tous les slots -->
            <div class="field" style="margin:0">
              <label style="font-size:10px">✨ Bonus libre</label>
              <input placeholder="ex: +2 SAG"
                value="${item.bonusFree||''}"
                oninput="window._editMemberInvItem.bonusFree=this.value||undefined"
                style="width:100%;background:var(--bg);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px">
            </div>
          </div>
        </div>
      </div>

      <!-- Champ bonus cases (visible si catégorie = Sac) -->
      <div id="minv-bag-bonus-field" style="display:${item.category==='Sac'?'block':'none'}">
        <div class="field">
          <label>🎒 Bonus de cases (capacité ajoutée par ce sac)</label>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="number" min="0" max="100"
              value="${item.bagBonus!==undefined&&item.bagBonus!==''?item.bagBonus:''}"
              placeholder="ex: 12"
              oninput="window._editMemberInvItem.bagBonus=this.value!==''?+this.value:undefined"
              style="width:90px;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:5px 8px">
            <span style="color:var(--dim);font-size:12px">cases supplémentaires d'inventaire</span>
          </div>
        </div>
      </div>
      <div class="field"><label>Rareté</label><select onchange="window._editMemberInvItem.rarity=this.value">${Object.keys(RARITY).map(r=>`<option${r===item.rarity?' selected':''}>${r}</option>`).join('')}</select></div>
      <div class="field"><label>Description</label><textarea rows="2" oninput="window._editMemberInvItem.description=this.value">${esc(item.description||'')}</textarea></div>
      <div class="field"><label>Émoji / Icône rapide</label>
        <div style="display:flex;align-items:center;gap:8px">
          <input value="${esc(item.emoji||item.icon||'')}" oninput="window._editMemberInvItem.emoji=this.value.trim()"
            placeholder="📦 ⚗️ 🗡️..."
            style="width:80px;font-size:20px;text-align:center;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:5px">
          <span style="color:var(--dim);font-size:12px">Emoji affiché (optionnel)</span>
        </div>
      </div>
      <div class="field">
        <label>🖼️ Icône</label>
        <label class="img-upload-btn" style="${item.icon?'border-style:solid':''}">
          ${item.icon?`<img src="${item.icon}" style="max-height:60px;border-radius:4px">`:`<span style="font-size:22px">📦</span><span>Image optionnelle</span>`}
          <input type="file" accept="image/*" style="display:none" onchange="handleMInvIconUpload(this)">
        </label>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="closeMemberInvModal()">Annuler</button>
        <button class="btn btn-primary" onclick="saveMemberInvItem()">Sauvegarder</button>
      </div>
    </div>
  </div>`;
  mc.appendChild(overlay);
}

function handleMInvIconUpload(input){
  if(!input.files[0]) return;
  readFile(input.files[0], data=>{
    window._editMemberInvItem.icon=data;
    const label=input.closest('label');
    label.style.borderStyle='solid';
    label.innerHTML=`<img src="${data}" style="max-height:60px;border-radius:4px"><input type="file" accept="image/*" style="display:none" onchange="handleMInvIconUpload(this)">`;
  });
}
function closeMemberInvModal(){ document.getElementById('minv-overlay')?.remove(); }
function saveMemberInvItem(){
  const item=window._editMemberInvItem;
  if(!item||!item.name.trim()) return;
  const em = window._editMember || DB.members.find(x=>x.id===selectedMemberId);
  if(!em) return;
  if(!em.inventory) em.inventory=[];
  if(window._editMemberInvIdx!==undefined&&window._editMemberInvIdx!==null) em.inventory[window._editMemberInvIdx]=item;
  else em.inventory.push(item);
  closeMemberInvModal();
  if(window._editMember){
    // Inside member modal: refresh the inline inv list
    refreshMemberInvList();
  } else {
    // From detail tab: persist + re-render
    save(); renderMemberDetail(); updateStats();
  }
}

