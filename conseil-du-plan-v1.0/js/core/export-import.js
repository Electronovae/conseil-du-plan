/**
 * EXPORT / IMPORT données
 * Extrait de V7_6.html lignes 8982-9052
 */
// ================================================================
// EXPORT / IMPORT données
// ================================================================
// Export : DB complet avec blobs réintégrés
async function exportData(){
  toast('⏳ Préparation de l\'export…');
  try {
    const blobs = await idbGetAll();
    const full = JSON.parse(JSON.stringify(DB));
    _mergeBlobs(full, blobs);
    const json = JSON.stringify(full);
    const blob = new Blob([json],{type:'application/json'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const date = new Date().toISOString().slice(0,10);
    a.href=url; a.download=`conseil-du-plan-${date}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast('✅ Données exportées !');
  } catch(e){ toast('❌ Erreur export : '+e.message); }
}

// Import : texte → localStorage, blobs → IndexedDB, puis reload
function importData(){
  const input=document.createElement('input');
  input.type='file'; input.accept='.json';
  input.onchange=e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      try{
        const parsed=JSON.parse(ev.target.result);
        if(!parsed.members&&!parsed.journal){alert('Fichier invalide.');return;}
        if(!confirm('⚠️ Remplacer TOUTES les données actuelles par ce fichier ?')) return;
        toast('⏳ Import en cours…');
        // Séparer blobs et texte
        const {text, blobs} = _splitBlobs(parsed);
        localStorage.setItem(STORE_KEY, JSON.stringify(text));
        // Effacer anciens blobs et écrire les nouveaux
        const db = await openIDB();
        await new Promise((res,rej)=>{
          const tx=db.transaction(IDB_STORE,'readwrite');
          tx.objectStore(IDB_STORE).clear();
          tx.oncomplete=res; tx.onerror=rej;
        });
        for(const [k,v] of Object.entries(blobs)){
          if(v) await idbPut(k,v);
        }
        toast('✅ Import terminé, rechargement…');
        setTimeout(()=>location.reload(), 800);
      }catch(e){alert('Erreur de lecture du fichier JSON : '+e.message);}
    };
    reader.readAsText(file);
  };
  input.click();
}

// Supprime un blob (ex: quand on supprime un avatar)
function deleteBlob(key){ idbDelete(key); }


// ── DONNÉES IMPORTÉES (premier lancement uniquement) ──
async function _bootImport(){
  // Si localStorage déjà peuplé → skip
  if(localStorage.getItem(STORE_KEY)) return;
  localStorage.setItem(STORE_KEY, JSON.stringify(_BOOT_TEXT));
  for(const [k,v] of Object.entries(_BOOT_BLOBS)){
    if(v) await idbPut(k,v);
  }
  console.log('[CDP] Données initiales injectées ✅');
}

