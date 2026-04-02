/**
 * SAUVEGARDER LE MEMBRE
 * Extrait de V7_6.html lignes 4101-4120
 */
// ================================================================
// SAUVEGARDER LE MEMBRE
// ================================================================
function saveMember(editId){
  const em=window._editMember;
  if(!em) return;
  if(window._imgUploads['em-avatar-img']) em.avatarImg=window._imgUploads['em-avatar-img'];
  if(!em.name.trim()){alert('Un nom est requis.');return;}
  if(editId&&editId!=='null'){
    const idx=DB.members.findIndex(m=>m.id===editId);
    if(idx>=0) DB.members[idx]=em;
  } else {
    DB.members.push(em);
    selectedMemberId=em.id;
  }
  save(); closeModal(); renderMembers(); renderMemberDetail();
  toast(editId&&editId!=='null'?'Aventurier mis à jour !':'Aventurier recruté !');
}

// MODULE INVENTAIRE
