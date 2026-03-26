/**
 * TRÉSORS
 * Extrait de V7_6.html lignes 7807-7843
 */
// ================================================================
// TRÉSORS
// ================================================================
function openAddTreasureModal(){
  if(!DB.treasures) DB.treasures=[];
  openModal(`<div class="modal">
    <div class="modal-header"><span class="modal-title">💎 Ajouter un Trésor</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="field"><label>Nom</label><input id="tr-name" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px 12px" placeholder="Rubis de Sigil, Couronne de Nexus..."></div>
      <div class="grid2">
        <div class="field"><label>Icône</label><input id="tr-icon" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px 12px" placeholder="💎" value="💎"></div>
        <div class="field"><label>Valeur (PO)</label><input id="tr-val" type="number" min="0" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px 12px" placeholder="500"></div>
      </div>
      <div class="field"><label>Quantité</label><input id="tr-qty" type="number" min="1" value="1" style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:8px 12px"></div>
      <button class="btn btn-primary" onclick="
        const name=document.getElementById('tr-name').value.trim();
        if(!name){alert('Nom requis');return;}
        if(!DB.treasures) DB.treasures=[];
        DB.treasures.push({
          name,
          icon:document.getElementById('tr-icon').value.trim()||'💎',
          value:+document.getElementById('tr-val').value||0,
          qty:Math.max(1,+document.getElementById('tr-qty').value||1)
        });
        save();closeModal();renderInventory();
        toast('Trésor ajouté !');
      ">Ajouter</button>
    </div>
  </div>`);
}

function deleteTreasure(idx){
  if(!DB.treasures) return;
  DB.treasures.splice(idx,1);
  save(); renderInventory();
}

