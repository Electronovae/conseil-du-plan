/**
 * MEMBER MODAL — formulaire d'édition multi-onglets
 * Extrait de V7_6.html lignes 3313-3707
 */
// ================================================================
// MEMBER MODAL — Formulaire d'édition multi-onglets
// ================================================================
// NOTE: Les sous-modales (sorts, inventaire) ne relancent JAMAIS
// openMemberModal(). Elles modifient window._editMember directement
// et appellent refreshSpellList() ou refreshMemberInvList().
// ================================================================

function openMemberModal(id){
  const isEdit = !!id;
  const src = isEdit ? DB.members.find(m=>m.id===id) : null;
  const m = isEdit ? JSON.parse(JSON.stringify(src)) : {
    id:uid(), name:'', clazz:'', level:1, plane:'Plan Matériel',
    avatar:'⚔️', avatarImg:null, pdf:null, pdfName:null,
    isNpc:false, linkedNpcId:null,
    stats:{str:10,dex:10,con:10,int:10,wis:10,cha:10},
    hp:{current:10,max:10}, ac:10, speed:'9m', profBonus:2, initiative:'+0',
    gold:{pp:0,po:0,pa:0,pc:0},
    bank:{pp:0,po:0,pa:0,pc:0},
    saveProficiencies:[], skillProficiencies:[], skillExpertise:[],
    extraFields:[], weapons:[], spells:[], inventory:[], pocket:[], pocketSize:6,
    equipment:{armor:'',shield:'',helmet:'',boots:'',gloves:'',ring1:'',ring2:'',cloak:'',amulet:'',bag:'none'},
    features:[], specializations:[],
    languages:'', armorProf:'', weaponProf:'', toolProf:'',
    kills:[],
    armorType:'none', bagType:'none',
    // V6 : identité étendue
    race:'', alignment:'', background:'', age:'',
    // V6 : ressources limitées (Ki, Inspiration, etc.)
    resources:[],
    // V6 : ordre des panneaux dans le résumé
    panelOrder:[],
    // V6 : taille du sac à dos (capacité en cases)
    bagSize:20
  };
  // Ensure all new fields exist on old records
  if(!m.saveProficiencies) m.saveProficiencies=[];
  if(!m.skillProficiencies) m.skillProficiencies=[];
  if(!m.skillExpertise) m.skillExpertise=[];
  if(!m.equipment) m.equipment={armor:'',shield:'',helmet:'',boots:'',gloves:'',ring1:'',ring2:'',cloak:'',amulet:'',bag:'none'};
  if(m.equipment&&m.equipment.bag===undefined) m.equipment.bag='none';
  if(!m.bank) m.bank={pp:0,po:0,pa:0,pc:0};
  if(!m.features) m.features=[];
  if(!m.specializations) m.specializations=[];
  if(!m.kills) m.kills=[];
  if(!m.armorType) m.armorType='none';
  if(!m.bagType) m.bagType='none';
  if(!m.resources) m.resources=[];
  if(!m.loreBackground) m.loreBackground=''; if(!m.lorePersonality) m.lorePersonality='';
  if(!m.loreBonds) m.loreBonds=''; if(!m.loreFlaws) m.loreFlaws=''; if(!m.loreDmSecrets) m.loreDmSecrets='';

  window._editMember = m;  // Note: pas de JSON.parse ici, on travaille directement sur cette copie
  window._imgUploads = {};

  openModal(`
  <div class="modal modal-wide" onclick="event.stopPropagation()">
    <div class="modal-header">
      <span class="modal-title">${isEdit?'✏️ Modifier':'+ Recruter'} un Aventurier</span>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <!-- ONGLETS DU FORMULAIRE -->
      <div style="display:flex;gap:3px;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:10px;flex-wrap:wrap" id="mem-tabs">
        ${['Identité','Stats','Combat','Sorts','Inventaire','Capacités','Lore'].map((t,i)=>`
          <button class="btn btn-sm ${i===0?'btn-primary':'btn-ghost'}" onclick="switchMemTab(${i})" id="mem-tab-${i}">${t}</button>`).join('')}
      </div>

      <!-- PANEL 0: IDENTITÉ -->
      <div id="mem-panel-0">
        <div class="grid2">
          <div class="field"><label>Nom</label><input value="${esc(m.name)}" oninput="window._editMember.name=this.value"></div>
          <div class="field"><label>Classe</label><input value="${esc(m.clazz)}" oninput="window._editMember.clazz=this.value"></div>
          <div class="field"><label>Niveau</label><input type="number" value="${m.level}" oninput="window._editMember.level=+this.value" min="1" max="20"></div>
          <div class="field"><label>Plan actuel</label><select onchange="window._editMember.plane=this.value">${getPlanes().map(p=>`<option${p===m.plane?' selected':''}>${p}</option>`).join('')}</select></div>
        </div>
        <div class="field" style="margin:8px 0">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;text-transform:none;font-size:13px;font-weight:600">
            <input type="checkbox" ${m.isNpc?'checked':''} onchange="window._editMember.isNpc=this.checked;document.getElementById('em-npc-link').style.display=this.checked?'block':'none'" style="width:16px;height:16px">
            Ce personnage est un PNJ
          </label>
        </div>
        <div id="em-npc-link" style="display:${m.isNpc?'block':'none'}">
          <div class="field"><label>Fiche PNJ associée</label>
            <select onchange="window._editMember.linkedNpcId=this.value===''?null:+this.value">
              <option value="">— Aucun lien —</option>
              ${DB.npcs.map(n=>`<option value="${n.id}"${m.linkedNpcId===n.id?' selected':''}>${n.avatar} ${esc(n.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <!-- Avatar emoji: saisie libre depuis le clavier -->
        <div class="field">
          <label>Avatar (emoji — colle ou tape directement)</label>
          <div style="display:flex;align-items:center;gap:12px;margin-top:6px">
            <div id="em-avatar-preview" style="width:52px;height:52px;background:var(--surface2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:32px;border:1px solid var(--border2)">${m.avatar||'⚔️'}</div>
            <input value="${esc(m.avatar||'⚔️')}" maxlength="8"
              style="width:80px;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px;font-size:24px;text-align:center"
              oninput="window._editMember.avatar=this.value;document.getElementById('em-avatar-preview').textContent=this.value">
            <div style="font-size:12px;color:var(--dim)">Raccourcis rapides :<br>
              <span style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
                ${["⚔️","🧙","🧙‍♀️","🛡️","🏹","🔮","🗡️","🌿","🔥","⚡","🐉","🦅"].map(e=>`<span onclick="window._editMember.avatar='${e}';document.getElementById('em-avatar-preview').textContent='${e}';this.parentElement.previousElementSibling.previousElementSibling.previousElementSibling.value='${e}'" style="cursor:pointer;font-size:20px;padding:2px" title="${e}">${e}</span>`).join('')}
              </span>
            </div>
          </div>
        </div>
        ${imgUploadField('em-avatar-img', m.avatarImg, "Image personnalisée (remplace l'emoji)")}
      </div>

      <!-- PANEL 1: STATS + MAÎTRISES -->
      <div id="mem-panel-1" style="display:none">
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:16px">
          ${ABILITIES.map(a=>`
            <div style="text-align:center">
              <div style="font-size:10px;color:var(--dim);text-transform:uppercase;margin-bottom:4px">${a.name}</div>
              <input type="number" value="${m.stats[a.key]||10}" min="1" max="30"
                style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:6px;font-size:16px;font-weight:700;text-align:center"
                oninput="em_stat('${a.key}',+this.value)">
              <div id="mod-${a.key}" style="font-size:12px;color:var(--indigo);margin-top:3px">${modStr(m.stats[a.key]||10)}</div>
            </div>`).join('')}
        </div>
        <div class="grid2">
          <div class="field"><label>PV actuels</label><input type="number" value="${m.hp.current}" oninput="window._editMember.hp.current=+this.value"></div>
          <div class="field"><label>PV maximum</label><input type="number" value="${m.hp.max}" oninput="window._editMember.hp.max=+this.value"></div>
          <div class="field"><label>Classe d'Armure</label><input type="number" value="${m.ac}" oninput="window._editMember.ac=+this.value"></div>
          <div class="field"><label>Vitesse</label><input value="${esc(m.speed)}" oninput="window._editMember.speed=this.value"></div>
          <div class="field"><label>Bonus de Maîtrise</label><input type="number" value="${m.profBonus}" oninput="window._editMember.profBonus=+this.value" min="2" max="6"></div>
          <div class="field"><label>Initiative</label><input value="${esc(m.initiative)}" oninput="window._editMember.initiative=this.value"></div>
        </div>
        <!-- ARGENT -->
        <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin:12px 0 8px">💰 Bourse</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
          ${[['pp','PP','#c084fc'],['po','PO','#fbbf24'],['pa','PA','#9ca3af'],['pc','PC','#b45309']].map(([k,l,col])=>`
            <div style="text-align:center">
              <div style="font-size:11px;font-weight:700;color:${col};margin-bottom:4px">${l}</div>
              <input type="number" min="0" value="${m.gold?.[k]||0}"
                style="width:100%;background:var(--surface2);border:1px solid ${col}44;border-radius:6px;color:${col};padding:6px;font-size:15px;font-weight:700;text-align:center"
                oninput="if(!window._editMember.gold)window._editMember.gold={pp:0,po:0,pa:0,pc:0};window._editMember.gold['${k}']=+this.value">
            </div>`).join('')}
        </div>
        <!-- JETS DE SAUVEGARDE (maîtrises) -->
        <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">Maîtrises de Jets de Sauvegarde</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
          ${SAVES.map(k=>`
            <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:13px;color:var(--text)">
              <input type="checkbox" ${(m.saveProficiencies||[]).includes(k)?'checked':''} onchange="em_toggleArray('saveProficiencies','${k}',this.checked)" style="width:14px;height:14px">
              ${SAVE_LABELS[k]}
            </label>`).join('')}
        </div>
        <!-- COMPÉTENCES -->
        <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">Maîtrises de Compétences</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px 12px">
          ${SKILLS.map(sk=>`
            <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;color:var(--text);padding:2px 0">
              <input type="checkbox" ${(m.skillProficiencies||[]).includes(sk.name)?'checked':''}
                onchange="em_toggleArray('skillProficiencies','${sk.name}',this.checked)" style="width:12px;height:12px">
              ${esc(sk.name)}
            </label>`).join('')}
        </div>
        <!-- MAÎTRISES & LANGUES -->
        <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin:16px 0 8px">Autres Maîtrises & Langues</div>
        <div class="grid2">
          <div class="field"><label>Langues</label><input value="${esc(m.languages||'')}" oninput="window._editMember.languages=this.value" placeholder="Commun, Elfique, Draconique..."></div>
          <div class="field"><label>Maîtrises d'Armures</label><input value="${esc(m.armorProf||'')}" oninput="window._editMember.armorProf=this.value" placeholder="Légères, intermédiaires, boucliers..."></div>
          <div class="field"><label>Maîtrises d'Armes</label><input value="${esc(m.weaponProf||'')}" oninput="window._editMember.weaponProf=this.value" placeholder="Armes courantes, de guerre..."></div>
          <div class="field"><label>Maîtrises d'Outils</label><input value="${esc(m.toolProf||'')}" oninput="window._editMember.toolProf=this.value" placeholder="Instruments de musique..."></div>
        </div>
      </div>

      <!-- PANEL 2: COMBAT (armes + équipement + champs libres) -->
      <div id="mem-panel-2" style="display:none">
        <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">⚔️ Armes</div>
        <div id="weapons-list">
          ${(m.weapons||[]).map((w,i)=>`
            <div style="display:grid;grid-template-columns:32px 1fr 70px 90px 26px 26px;gap:6px;align-items:center;margin-bottom:8px">
              <div style="width:28px;height:28px;background:var(--surface2);border-radius:4px;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer" onclick="this.nextElementSibling.nextElementSibling.nextElementSibling.nextElementSibling.nextElementSibling.nextElementSibling && null" id="wicon-${i}">
                ${w.icon?`<img src="${w.icon}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-size:14px">⚔️</span>`}
              </div>
              <input value="${esc(w.name)}" placeholder="Nom arme" oninput="window._editMember.weapons[${i}].name=this.value"
                style="background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 8px;font-size:13px">
              <input value="${esc(w.atk)}" placeholder="+5" style="background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 8px;font-size:13px" oninput="window._editMember.weapons[${i}].atk=this.value">
              <input value="${esc(w.dmg)}" placeholder="1d8+3" style="background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 8px;font-size:13px" oninput="window._editMember.weapons[${i}].dmg=this.value">
              <label style="cursor:pointer;font-size:14px;text-align:center" title="Icône">🖼️<input type="file" accept="image/*" style="display:none" onchange="em_weaponIcon(${i},this)"></label>
              <button class="btn btn-danger btn-xs" onclick="em_removeWeapon(${i})" style="padding:4px 6px">✕</button>
            </div>`).join('')}
        </div>
        <button class="btn btn-outline btn-sm" onclick="em_addWeapon()">+ Arme</button>


        <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">🛡️ Équipement Porté</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
          ${[['armor','Armure'],['shield','Bouclier'],['helmet','Casque'],['boots','Bottes'],['gloves','Gants'],['ring1','Anneau 1'],['ring2','Anneau 2'],['cloak','Cape'],['amulet','Amulette']].map(([k,l])=>`
            <div class="field" style="margin-bottom:0">
              <label>${l}</label>
              <input value="${esc(m.equipment?.[k]||'')}" oninput="if(!window._editMember.equipment)window._editMember.equipment={};window._editMember.equipment['${k}']=this.value" placeholder="—">
            </div>`).join('')}
        </div>


        <hr style="border:none;border-top:1px solid var(--border);margin:16px 0">
        <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">Champs Personnalisés</div>
        <div id="extra-list">
          ${(m.extraFields||[]).map((f,i)=>`
            <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px">
              <input value="${esc(f.key)}" placeholder="Champ" oninput="window._editMember.extraFields[${i}].key=this.value"
                style="background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 8px;font-size:13px">
              <input value="${esc(f.val)}" placeholder="Valeur" oninput="window._editMember.extraFields[${i}].val=this.value"
                style="background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 8px;font-size:13px">
              <button class="btn btn-danger btn-xs" onclick="em_removeExtra(${i})">✕</button>
            </div>`).join('')}
        </div>
        <button class="btn btn-outline btn-sm" onclick="em_addExtra()">+ Champ libre</button>
      </div>

      <!-- PANEL 3: SORTS -->
      <div id="mem-panel-3" style="display:none">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-size:11px;color:var(--dim)">${(m.spells||[]).length} sort(s) · <a href="https://www.aidedd.org/dnd/sorts.php" target="_blank" style="color:var(--indigo)">Base de données sorts</a></div>
          <button class="btn btn-primary btn-sm" onclick="openSpellModal()">✨ Ajouter un sort</button>
        </div>
        <div id="spell-list">
          ${(m.spells||[]).map((sp,i)=>renderSpellRow(sp,i)).join('')}
        </div>
        ${!(m.spells||[]).length?`<div style="text-align:center;color:var(--dim);padding:30px;font-style:italic">Aucun sort. Cliquez sur "+ Ajouter un sort" pour commencer.</div>`:''}
      </div>

      <!-- PANEL 4: INVENTAIRE PERSO -->
      <div id="mem-panel-4" style="display:none">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-size:11px;color:var(--dim)">${(m.inventory||[]).length} objet(s)</div>
          <button class="btn btn-primary btn-sm" onclick="openMemberInvModal()">+ Ajouter un objet</button>
        </div>
        <div id="member-inv-list">
          ${renderMemberInvItems(m.inventory||[])}
        </div>
      </div>

      <!-- PANEL 5: CAPACITÉS & SPÉCIALISATIONS -->
      <div id="mem-panel-5" style="display:none">
        <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">🔮 Spécialisations de Classe</div>
        <div id="spec-list">
          ${(m.specializations||[]).map((s,i)=>`
            <div style="background:var(--surface2);border:1px solid var(--border2);border-radius:6px;padding:10px 12px;margin-bottom:8px">
              <input value="${esc(s.name)}" placeholder="Nom de la spécialisation" oninput="window._editMember.specializations[${i}].name=this.value"
                style="width:100%;background:transparent;border:none;border-bottom:1px solid var(--border2);color:var(--purple);padding:4px 0;font-size:14px;font-weight:700;margin-bottom:6px">
              <textarea rows="2" oninput="window._editMember.specializations[${i}].description=this.value"
                style="width:100%;background:transparent;border:none;color:var(--muted);font-size:12px;resize:vertical;font-family:'Crimson Pro',serif"
                placeholder="Description...">${esc(s.description||'')}</textarea>
              <button class="btn btn-danger btn-xs" onclick="em_removeSpec(${i})" style="margin-top:4px">✕ Supprimer</button>
            </div>`).join('')}
        </div>
        <button class="btn btn-outline btn-sm" onclick="em_addSpec()">+ Spécialisation</button>

        <hr style="border:none;border-top:1px solid var(--border);margin:16px 0">
        <div style="font-size:11px;color:var(--indigo);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">⚡ Capacités & Traits</div>
        <div id="features-list">
          ${(m.features||[]).map((f,i)=>`
            <div style="background:var(--surface2);border:1px solid var(--border2);border-radius:6px;padding:10px 12px;margin-bottom:8px">
              <input value="${esc(f.name)}" placeholder="Nom de la capacité" oninput="window._editMember.features[${i}].name=this.value"
                style="width:100%;background:transparent;border:none;border-bottom:1px solid var(--border2);color:var(--text);padding:4px 0;font-size:14px;font-weight:700;margin-bottom:6px">
              <textarea rows="3" oninput="window._editMember.features[${i}].description=this.value"
                style="width:100%;background:transparent;border:none;color:var(--muted);font-size:13px;resize:vertical;font-family:'Crimson Pro',serif;line-height:1.5"
                placeholder="Décrivez la capacité, ses effets, ses conditions d'utilisation...">${esc(f.description||'')}</textarea>
              <button class="btn btn-danger btn-xs" onclick="em_removeFeature(${i})" style="margin-top:4px">✕ Supprimer</button>
            </div>`).join('')}
        </div>
        <button class="btn btn-outline btn-sm" onclick="em_addFeature()">+ Capacité / Trait</button>
      </div>

      <!-- PANEL 6: LORE -->
      <div id="mem-panel-6" style="display:none">
        <div class="field">
          <label>📖 Historique / Background</label>
          <textarea rows="6" oninput="window._editMember.loreBackground=this.value"
            style="font-family:'Crimson Pro',serif;font-size:15px;line-height:1.7"
            placeholder="L'histoire du personnage, ses origines, son parcours...">${esc(m.loreBackground||'')}</textarea>
        </div>
        <div class="field">
          <label>🎭 Personnalité & Idéaux</label>
          <textarea rows="3" oninput="window._editMember.lorePersonality=this.value"
            style="font-family:'Crimson Pro',serif;font-size:14px;line-height:1.6"
            placeholder="Traits de personnalité, idéaux, motivations...">${esc(m.lorePersonality||'')}</textarea>
        </div>
        <div class="grid2">
          <div class="field">
            <label>🔗 Liens</label>
            <textarea rows="3" oninput="window._editMember.loreBonds=this.value"
              style="font-family:'Crimson Pro',serif;font-size:14px;line-height:1.6"
              placeholder="Personnes, lieux ou idéaux auxquels le personnage tient...">${esc(m.loreBonds||'')}</textarea>
          </div>
          <div class="field">
            <label>💀 Défauts & Secrets</label>
            <textarea rows="3" oninput="window._editMember.loreFlaws=this.value"
              style="font-family:'Crimson Pro',serif;font-size:14px;line-height:1.6"
              placeholder="Faiblesses, vices, secrets honteux...">${esc(m.loreFlaws||'')}</textarea>
          </div>
        </div>
        <div class="field">
          <label>🔒 Secrets MJ (non visible par les joueurs)</label>
          <textarea rows="3" oninput="window._editMember.loreDmSecrets=this.value"
            style="font-family:'Crimson Pro',serif;font-size:14px;line-height:1.6;border-color:#78350f55"
            placeholder="Ce que seul le MJ sait sur ce personnage...">${esc(m.loreDmSecrets||'')}</textarea>
        </div>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="saveMember(${isEdit?id:'null'})">${isEdit?'Sauvegarder':'Recruter'}</button>
      </div>
    </div>
  </div>`);
}

// --- Helpers onglets ---
function switchMemTab(idx){
  for(let i=0;i<7;i++){
    const p=document.getElementById('mem-panel-'+i); if(p) p.style.display=i===idx?'block':'none';
    const t=document.getElementById('mem-tab-'+i); if(t) t.className='btn btn-sm '+(i===idx?'btn-primary':'btn-ghost');
  }
}

// --- Mutations directes sur _editMember ---
function em_stat(k,v){
  if(window._editMember){ window._editMember.stats[k]=v; const el=document.getElementById('mod-'+k); if(el)el.textContent=modStr(v); }
}
function em_toggleArray(field, val, checked){
  if(!window._editMember) return;
  if(!window._editMember[field]) window._editMember[field]=[];
  if(checked){ if(!window._editMember[field].includes(val)) window._editMember[field].push(val); }
  else { window._editMember[field]=window._editMember[field].filter(x=>x!==val); }
}
function em_addWeapon(){
  if(!window._editMember) return;
  window._editMember.weapons.push({name:'',atk:'+0',dmg:'1d6',icon:null});
  const i=window._editMember.weapons.length-1;
  const list=document.getElementById('weapons-list');
  const div=document.createElement('div');
  div.style.cssText='display:grid;grid-template-columns:32px 1fr 70px 90px 26px 26px;gap:6px;align-items:center;margin-bottom:8px';
  div.innerHTML=`<div style="width:28px;height:28px;background:var(--surface2);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:14px">⚔️</div>
    <input placeholder="Nom arme" oninput="window._editMember.weapons[${i}].name=this.value" style="background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 8px;font-size:13px">
    <input value="+0" placeholder="+5" style="background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 8px;font-size:13px" oninput="window._editMember.weapons[${i}].atk=this.value">
    <input value="1d6" placeholder="1d8+3" style="background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 8px;font-size:13px" oninput="window._editMember.weapons[${i}].dmg=this.value">
    <label style="cursor:pointer;font-size:14px;text-align:center" title="Icône">🖼️<input type="file" accept="image/*" style="display:none" onchange="em_weaponIcon(${i},this)"></label>
    <button class="btn btn-danger btn-xs" onclick="em_removeWeapon(${i})" style="padding:4px 6px">✕</button>`;
  list.appendChild(div);
}
function em_removeWeapon(i){ if(window._editMember){ window._editMember.weapons.splice(i,1); document.querySelector('#weapons-list')?.children[i]?.remove(); } }
function em_weaponIcon(i, input){
  if(!input.files[0]) return;
  readFile(input.files[0], data=>{
    if(window._editMember) window._editMember.weapons[i].icon=data;
    const prev=document.getElementById('wicon-'+i);
    if(prev) prev.innerHTML=`<img src="${data}" style="width:100%;height:100%;object-fit:cover">`;
  });
}
function em_addExtra(){
  if(!window._editMember) return;
  window._editMember.extraFields.push({key:'',val:''});
  const i=window._editMember.extraFields.length-1;
  const list=document.getElementById('extra-list');
  const div=document.createElement('div');
  div.style.cssText='display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px';
  div.innerHTML=`<input placeholder="Champ" oninput="window._editMember.extraFields[${i}].key=this.value" style="background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 8px;font-size:13px">
    <input placeholder="Valeur" oninput="window._editMember.extraFields[${i}].val=this.value" style="background:var(--surface2);border:1px solid var(--border2);border-radius:5px;color:var(--text);padding:6px 8px;font-size:13px">
    <button class="btn btn-danger btn-xs" onclick="em_removeExtra(${i})">✕</button>`;
  list.appendChild(div);
}
function em_removeExtra(i){ if(window._editMember) window._editMember.extraFields.splice(i,1); }
function em_addSpec(){
  if(!window._editMember) return;
  if(!window._editMember.specializations) window._editMember.specializations=[];
  window._editMember.specializations.push({name:'',description:''});
  const i=window._editMember.specializations.length-1;
  const list=document.getElementById('spec-list');
  const div=document.createElement('div');
  div.style.cssText='background:var(--surface2);border:1px solid var(--border2);border-radius:6px;padding:10px 12px;margin-bottom:8px';
  div.innerHTML=`<input placeholder="Nom de la spécialisation" oninput="window._editMember.specializations[${i}].name=this.value" style="width:100%;background:transparent;border:none;border-bottom:1px solid var(--border2);color:var(--purple);padding:4px 0;font-size:14px;font-weight:700;margin-bottom:6px">
    <textarea rows="2" oninput="window._editMember.specializations[${i}].description=this.value" style="width:100%;background:transparent;border:none;color:var(--muted);font-size:12px;resize:vertical;font-family:'Crimson Pro',serif" placeholder="Description..."></textarea>
    <button class="btn btn-danger btn-xs" onclick="em_removeSpec(${i})" style="margin-top:4px">✕ Supprimer</button>`;
  list.appendChild(div);
}
function em_removeSpec(i){ if(window._editMember&&window._editMember.specializations) window._editMember.specializations.splice(i,1); }
function em_addFeature(){
  if(!window._editMember) return;
  if(!window._editMember.features) window._editMember.features=[];
  window._editMember.features.push({name:'',description:''});
  const i=window._editMember.features.length-1;
  const list=document.getElementById('features-list');
  const div=document.createElement('div');
  div.style.cssText='background:var(--surface2);border:1px solid var(--border2);border-radius:6px;padding:10px 12px;margin-bottom:8px';
  div.innerHTML=`<input placeholder="Nom de la capacité" oninput="window._editMember.features[${i}].name=this.value" style="width:100%;background:transparent;border:none;border-bottom:1px solid var(--border2);color:var(--text);padding:4px 0;font-size:14px;font-weight:700;margin-bottom:6px">
    <textarea rows="3" oninput="window._editMember.features[${i}].description=this.value" style="width:100%;background:transparent;border:none;color:var(--muted);font-size:13px;resize:vertical;font-family:'Crimson Pro',serif;line-height:1.5" placeholder="Effets, conditions..."></textarea>
    <button class="btn btn-danger btn-xs" onclick="em_removeFeature(${i})" style="margin-top:4px">✕ Supprimer</button>`;
  list.appendChild(div);
}
function em_removeFeature(i){ if(window._editMember&&window._editMember.features) window._editMember.features.splice(i,1); }

