/**
 * TABLEAU DE CHASSE
 * Extrait de V7_6.html lignes 7844-7889
 */
// ================================================================
// TABLEAU DE CHASSE
// ================================================================
function openAddKillModal(memberId){
  const beasts = DB.bestiary||[];
  openModal(`<div class="modal">
    <div class="modal-header"><span class="modal-title">☠️ Ajouter un Kill</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      ${beasts.length?`<div class="field"><label>Depuis le Bestiaire</label>
        <select onchange="const b=DB.bestiary.find(x=>x.id==+this.value);window._killBeastId=b?b.id:null;if(b){document.getElementById('kill-name-in').value=b.name;document.getElementById('kill-icon-in').value=b.icon;window._killBeastImg=b.image||null||'☠️';}" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px 12px">
          <option value="">— Choisir —</option>
          ${beasts.map(b=>`<option value="${b.id}">${b.icon||'☠️'} ${esc(b.name)}</option>`).join('')}
        </select>
      </div>`:''}
      <div class="field"><label>Nom de l'ennemi</label><input id="kill-name-in" class="field" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px 12px" placeholder="Githyanki, Dragon rouge..."></div>
      <div class="field"><label>Icône</label><input id="kill-icon-in" class="field" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px 12px" placeholder="☠️" value="☠️"></div>
      <button class="btn btn-primary" onclick="
        const name=document.getElementById('kill-name-in').value.trim();
        if(!name){alert('Nom requis');return;}
        const icon=document.getElementById('kill-icon-in').value.trim()||'☠️';
        const m=DB.members.find(x=>x.id===${memberId});
        if(!m)return;
        if(!m.kills)m.kills=[];
        const ex=m.kills.find(k=>k.name===name);
        if(ex){ex.count=(ex.count||1)+1;}else{m.kills.push({name,icon,count:1,beastId:window._killBeastId||null,image:window._killBeastImg||null});}
        window._killBeastId=null;window._killBeastImg=null;
        save();closeModal();renderMemberDetail();
        toast('Kill enregistré !');
      ">Confirmer</button>
    </div>
  </div>`);
}

function memberKillDelta(memberId, killIdx, delta){
  const m=DB.members.find(x=>x.id===memberId); if(!m||!m.kills) return;
  m.kills[killIdx].count=Math.max(0,(m.kills[killIdx].count||1)+delta);
  if(m.kills[killIdx].count===0) m.kills.splice(killIdx,1);
  save(); renderMemberDetail();
}

function memberKillRemove(memberId, killIdx){
  const m=DB.members.find(x=>x.id===memberId); if(!m||!m.kills) return;
  m.kills.splice(killIdx,1);
  save(); renderMemberDetail();
}

