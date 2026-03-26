/**
 * Système de modales
 * Extrait de V7_6.html lignes 1407-1418
 */
// ================================================================
// MODAL
// ================================================================
function openModal(html, onReady){
  const mc = document.getElementById('modal-container');
  mc.innerHTML = `<div class="overlay" id="overlay" onclick="if(event.target===this)closeModal()">${html}</div>`;
  if(onReady) onReady();
}
function closeModal(){
  document.getElementById('modal-container').innerHTML='';
}

