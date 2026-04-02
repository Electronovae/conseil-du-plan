/**
 * MODULE SWITCHING — navigation
 * Extrait de V7_6.html lignes 1419-1438
 */
// ================================================================
// MODULE SWITCHING
// ================================================================
function switchModule(id, btn){
  document.querySelectorAll('.module').forEach(m=>m.style.display='none');
  document.getElementById('module-'+id).style.display='block';
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderModule(id);
}

function renderModule(id){
  if(id==='members') renderMembers();
  else if(id==='inventory') renderInventory();
  else if(id==='battlemap') renderBattlemap();
  else if(id==='media') renderMedia();
  else if(id==='adventure') renderAdventure();
  else if(id==='bestiary') renderBestiary();
}

