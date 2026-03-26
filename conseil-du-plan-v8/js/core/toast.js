/**
 * Toast notifications
 * Extrait de V7_6.html lignes 1398-1406
 */
// ================================================================
// TOAST
// ================================================================
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2200);
}

