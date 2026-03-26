/**
 * MODULE MÉDIAS
 * Extrait de V7_6.html lignes 7049-7349
 */
// ================================================================
// MODULE MÉDIAS
// ================================================================
let mediaFilter = 'all';
let mediaSearch = '';

var mediaSubTab = 'media';

function renderMedia(){
  if(mediaSubTab === 'grimoire') { renderGrimoire(); return; }

  const el=document.getElementById('module-media');
  const counts={};
  (DB.media||[]).forEach(m=>{ counts[m.type]=(counts[m.type]||0)+1; });
  el.innerHTML=`
  <div class="module-header">
    <span style="font-size:26px">🎵</span>
    <div><div class="module-title">Bibliothèque de Médias</div><div class="module-bar"></div></div>
    <div style="flex:1"></div>
    <button class="btn btn-primary" onclick="openMediaModal()">+ Ajouter</button>
    <button class="btn btn-outline btn-sm" onclick="mediaSubTab='grimoire';renderMedia()" style="margin-left:8px">📖 Grimoire</button>
  </div>
  <div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;align-items:center">
    <button class="btn btn-sm ${mediaFilter==='all'?'btn-primary':'btn-ghost'}" onclick="mediaFilter='all';renderMedia()">Tout (${(DB.media||[]).length})</button>
    ${Object.entries(MEDIA_TYPES).map(([t,icon])=>`
      <button class="btn btn-sm ${mediaFilter===t?'btn-primary':'btn-ghost'}" onclick="mediaFilter='${t}';renderMedia()">
        ${icon} ${t.charAt(0).toUpperCase()+t.slice(1)} ${counts[t]?`(${counts[t]})`:''}
      </button>`).join('')}
    <input placeholder="🔍 Rechercher..." value="${esc(mediaSearch)}" oninput="mediaSearch=this.value;renderMediaGrid()"
      style="background:var(--surface);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:6px 14px;font-size:13px;width:200px;margin-left:auto">
  </div>
  <div id="media-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px"></div>`;
  renderMediaGrid();
}


// ══════════════════════════════════════════════════════════════
// GRIMOIRE (V7.6) — 490 sorts AideDD avec tri/filtre + assignation
// ══════════════════════════════════════════════════════════════
var grimoireSearch = '';
var grimoireSchool = '';
var grimoireLevel  = '';
var grimoireConc   = '';

function renderGrimoire() {
  var el = document.getElementById('module-media');
  var SCHOOLS = ['Abjuration','Conjuration','Divination','Enchantement','Évocation','Illusion','Invocation','Nécromancie','Transmutation'];
  var LEVELS  = ['Tour de magie','Niveau 1','Niveau 2','Niveau 3','Niveau 4','Niveau 5','Niveau 6','Niveau 7','Niveau 8','Niveau 9'];

  var filtered = AIDEDD_SPELLS.filter(function(sp) {
    if(grimoireSearch && sp.name.toLowerCase().indexOf(grimoireSearch.toLowerCase()) < 0 &&
       sp.description.toLowerCase().indexOf(grimoireSearch.toLowerCase()) < 0) return false;
    if(grimoireSchool && sp.school !== grimoireSchool) return false;
    if(grimoireLevel && sp.level !== grimoireLevel) return false;
    if(grimoireConc === 'oui' && !sp.concentration) return false;
    if(grimoireConc === 'non' && sp.concentration) return false;
    return true;
  });

  var schoolOpts = '<option value="">Toutes les écoles</option>'
    + SCHOOLS.map(function(s){ return '<option value="'+s+'" '+(grimoireSchool===s?'selected':'')+'>'+s+'</option>'; }).join('');
  var levelOpts = '<option value="">Tous les niveaux</option>'
    + LEVELS.map(function(l){ return '<option value="'+l+'" '+(grimoireLevel===l?'selected':'')+'>'+l+'</option>'; }).join('');

  var spellCards = filtered.slice(0, 120).map(function(sp) {
    var SCHOOL_COLOR = {'Abjuration':'#60a5fa','Conjuration':'#4ade80','Divination':'#a78bfa',
      'Enchantement':'#f472b6','Évocation':'#fb923c','Illusion':'#818cf8',
      'Invocation':'#f59e0b','Nécromancie':'#6b7280','Transmutation':'#34d399'};
    var sc = SCHOOL_COLOR[sp.school] || '#a5b4fc';
    return '<div style="background:var(--surface);border:1px solid '+sc+'33;border-radius:10px;padding:14px;cursor:pointer;transition:border-color .15s,transform .12s" '
      + 'onmouseover="this.style.borderColor=\''+sc+'\';this.style.transform=\'translateY(-2px)\'" '
      + 'onmouseout="this.style.borderColor=\''+sc+'33\';this.style.transform=\'\'" '
      + 'onclick="openGrimoireSpellModal('+sp.id+')">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
      + '<div style="flex:1;font-weight:700;font-size:13px;color:var(--text)">' + esc(sp.name) + '</div>'
      + (sp.concentration ? '<span style="font-size:9px;background:#fbbf2222;color:#fbbf24;padding:1px 5px;border-radius:3px">Conc.</span>' : '')
      + (sp.ritual ? '<span style="font-size:9px;background:#a78bfa22;color:#a78bfa;padding:1px 5px;border-radius:3px">Rituel</span>' : '')
      + '</div>'
      + '<div style="font-size:11px;color:'+sc+';margin-bottom:4px">'+esc(sp.school)+' · '+esc(sp.level)+'</div>'
      + '<div style="font-size:11px;color:var(--dim)">'+esc(sp.castTime)+(sp.range?' · '+esc(sp.range):'')+'</div>'
      + '</div>';
  }).join('');

  var moreCount = filtered.length > 120 ? filtered.length - 120 : 0;

  el.innerHTML = '<div style="display:flex;flex-direction:column;gap:0">'
    + '<div class="module-header">'
    + '<span style="font-size:26px">📖</span>'
    + '<div><div class="module-title">Grimoire — ' + filtered.length + ' sorts</div><div class="module-bar"></div></div>'
    + '<div style="flex:1"></div>'
    + '<button class="btn btn-ghost btn-sm" onclick="mediaSubTab=\'media\';renderMedia()">← Médias</button>'
    + '</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">'
    + '<input placeholder="🔍 Rechercher un sort..." value="'+esc(grimoireSearch)+'" oninput="grimoireSearch=this.value;renderGrimoire()" style="background:var(--surface);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:7px 14px;font-size:13px;flex:1;min-width:180px">'
    + '<select onchange="grimoireSchool=this.value;renderGrimoire()" style="background:var(--surface);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:7px 10px;font-size:12px">'+schoolOpts+'</select>'
    + '<select onchange="grimoireLevel=this.value;renderGrimoire()" style="background:var(--surface);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:7px 10px;font-size:12px">'+levelOpts+'</select>'
    + '<select onchange="grimoireConc=this.value;renderGrimoire()" style="background:var(--surface);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:7px 10px;font-size:12px">'
    + '<option value="">Concentration ?</option><option value="oui">Concentration</option><option value="non">Sans concentration</option>'
    + '</select>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">' + spellCards + '</div>'
    + (moreCount ? '<div style="text-align:center;color:var(--dim);padding:16px;font-size:13px">... et ' + moreCount + ' sorts supplémentaires — affinez la recherche</div>' : '')
    + '</div>';
}

function openGrimoireSpellModal(spellId) {
  var sp = AIDEDD_SPELLS.find(function(s){ return s.id === spellId; });
  if(!sp) return;
  var SCHOOL_COLOR = {'Abjuration':'#60a5fa','Conjuration':'#4ade80','Divination':'#a78bfa',
    'Enchantement':'#f472b6','Évocation':'#fb923c','Illusion':'#818cf8',
    'Invocation':'#f59e0b','Nécromancie':'#6b7280','Transmutation':'#34d399'};
  var sc = SCHOOL_COLOR[sp.school] || '#a5b4fc';

  var memberOpts = '<option value="">— Choisir un aventurier —</option>'
    + (DB.members||[]).map(function(m){
        return '<option value="'+m.id+'">'+( m.avatar||'⚔️')+' '+esc(m.name)+'</option>';
      }).join('');

  var html = '<div class="modal" onclick="event.stopPropagation()" style="max-width:560px">'
    + '<div class="modal-header" style="border-bottom:2px solid '+sc+'">'
    + '<span class="modal-title">'+esc(sp.name)+'</span>'
    + '<button class="modal-close" onclick="closeModal()">&#x2715;</button></div>'
    + '<div class="modal-body">'
    + '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">'
    + '<span style="background:'+sc+'22;color:'+sc+';padding:2px 10px;border-radius:8px;font-size:12px;font-weight:700">'+esc(sp.school)+'</span>'
    + '<span style="background:var(--surface2);color:var(--muted);padding:2px 10px;border-radius:8px;font-size:12px">'+esc(sp.level)+'</span>'
    + (sp.concentration ? '<span style="background:#fbbf2222;color:#fbbf24;padding:2px 10px;border-radius:8px;font-size:11px">Concentration</span>' : '')
    + (sp.ritual ? '<span style="background:#a78bfa22;color:#a78bfa;padding:2px 10px;border-radius:8px;font-size:11px">Rituel</span>' : '')
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px">'
    + [['⏱ Temps','castTime'],['🎯 Portée','range'],['🧪 Composantes','components'],['⏳ Durée','duration']].map(function(kv){
        return sp[kv[1]] ? '<div style="background:var(--surface2);border-radius:6px;padding:7px 10px"><div style="font-size:9px;color:var(--dim);text-transform:uppercase;margin-bottom:2px">'+kv[0]+'</div><div style="font-size:12px;color:var(--text)">'+esc(sp[kv[1]])+'</div></div>' : '';
      }).join('')
    + '</div>'
    + (sp.description ? '<p style="color:var(--muted);font-family:\'Crimson Pro\',serif;font-size:14px;line-height:1.7;margin-bottom:16px">'+esc(sp.description)+'</p>' : '')
    + '<div style="background:var(--surface2);border-radius:8px;padding:12px;border:1px solid var(--border2)">'
    + '<div style="font-size:11px;color:var(--indigo);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">⚔️ Donner ce sort à un aventurier</div>'
    + '<div style="display:flex;gap:8px">'
    + '<select id="grimoire-member-select" style="flex:1;background:var(--surface);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:7px 10px;font-size:13px">'+memberOpts+'</select>'
    + '<button class="btn btn-primary" onclick="assignSpellToMember('+sp.id+')">✅ Assigner</button>'
    + '</div></div>'
    + '</div></div>';
  openModal(html);
}

function assignSpellToMember(spellId) {
  var memberId = +(document.getElementById('grimoire-member-select').value);
  if(!memberId) { toast('Choisissez un aventurier !'); return; }
  var sp = AIDEDD_SPELLS.find(function(s){ return s.id === spellId; });
  if(!sp) return;
  var m = DB.members.find(function(x){ return x.id === memberId; });
  if(!m) return;
  if(!m.spells) m.spells = [];
  // Check if already has this spell
  if(m.spells.find(function(s){ return s.name === sp.name; })) {
    toast('⚠️ ' + m.name + ' connaît déjà ' + sp.name + ' !');
    return;
  }
  m.spells.push({
    id: uid(), name: sp.name, level: sp.level, school: sp.school,
    castTime: sp.castTime, range: sp.range, components: sp.components,
    duration: sp.duration, concentration: sp.concentration, ritual: sp.ritual,
    description: sp.description, icon: null
  });
  save(); closeModal();
  toast('✅ ' + sp.name + ' appris par ' + m.name + ' !');
}

function renderMediaGrid(){
  const el=document.getElementById('media-grid');
  if(!el) return;
  const q=mediaSearch.toLowerCase();
  const items=(DB.media||[]).filter(m=>
    (mediaFilter==='all'||m.type===mediaFilter) &&
    (!q||(m.title||'').toLowerCase().includes(q)||(m.description||'').toLowerCase().includes(q))
  );
  if(!items.length){
    el.innerHTML=`<div style="grid-column:1/-1;text-align:center;color:var(--dim);padding:60px 0;font-style:italic">
      <div style="font-size:48px;margin-bottom:12px">🎵</div>Aucun média trouvé. Ajoutez des sons d'ambiance, cartes, illustrations...</div>`;
    return;
  }
  el.innerHTML=items.map(m=>renderMediaCard(m)).join('');
}

function renderMediaCard(m){
  const icon=MEDIA_TYPES[m.type]||'📎';
  const isAudio=m.type==='audio';
  const isImage=m.type==='image'||m.type==='map';
  return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;display:flex;flex-direction:column">
    <!-- Preview -->
    <div style="height:120px;background:var(--bg);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
      ${isImage&&m.data?`<img src="${m.data}" style="width:100%;height:100%;object-fit:cover">`:
        m.thumbnail?`<img src="${m.thumbnail}" style="width:100%;height:100%;object-fit:cover">`:
        `<span style="font-size:48px;opacity:.3">${icon}</span>`}
      <div style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,.6);padding:2px 8px;border-radius:4px;font-size:10px;color:var(--text)">${icon} ${m.type}</div>
    </div>
    <!-- Info -->
    <div style="padding:12px;flex:1;display:flex;flex-direction:column;gap:6px">
      <div style="font-weight:700;font-size:14px;color:var(--text)">${esc(m.title||'Sans titre')}</div>
      ${m.description?`<div style="font-size:12px;color:var(--dim);line-height:1.4">${esc(m.description)}</div>`:''}
      <!-- Audio player -->
      ${isAudio&&m.data?`<audio controls style="width:100%;height:32px;margin-top:4px"><source src="${m.data}"></audio>`:''}
      <!-- Image/Map fullview -->
      ${isImage&&m.data?`<button class="btn btn-outline btn-xs" onclick="mediaFullView(${m.id})" style="width:100%;justify-content:center">🔍 Plein écran</button>`:''}
      <!-- Document download -->
      ${m.type==='document'&&m.data?`<a href="${m.data}" download="${esc(m.fileName||m.title||'fichier')}" class="btn btn-outline btn-xs" style="text-decoration:none;justify-content:center">⬇️ Télécharger</a>`:''}
    </div>
    <!-- Actions -->
    <div style="padding:8px 12px;border-top:1px solid var(--border);display:flex;gap:6px;justify-content:flex-end">
      <button class="btn btn-outline btn-xs" onclick="openMediaModal(${m.id})">✏️</button>
      <button class="btn btn-danger btn-xs" onclick="deleteMedia(${m.id})">✕</button>
    </div>
  </div>`;
}

function mediaFullView(id){
  const m=DB.media.find(x=>x.id===id);
  if(!m||!m.data) return;
  openModal(`<div class="modal" style="max-width:95vw;max-height:95vh;height:95vh" onclick="event.stopPropagation()">
    <div class="modal-header"><span class="modal-title">${MEDIA_TYPES[m.type]||'📎'} ${esc(m.title)}</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div style="height:calc(100% - 60px);overflow:auto;display:flex;align-items:center;justify-content:center;background:var(--bg)">
      <img src="${m.data}" style="max-width:100%;max-height:100%;object-fit:contain">
    </div>
  </div>`);
}

function openMediaModal(editId){
  const src=editId?DB.media.find(m=>m.id===editId):null;
  const m=src?JSON.parse(JSON.stringify(src)):{id:uid(),title:'',type:'audio',description:'',data:null,fileName:null,thumbnail:null};
  window._editMedia=m; window._imgUploads['media-file']=null; window._imgUploads['media-thumb']=null;
  openModal(`<div class="modal modal-wide" onclick="event.stopPropagation()">
    <div class="modal-header"><span class="modal-title">${editId?'✏️ Modifier':'+ Ajouter'} un Média</span><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="grid2">
        <div class="field"><label>Titre</label><input value="${esc(m.title)}" oninput="window._editMedia.title=this.value" placeholder="Ambiance Taverne Sombre..."></div>
        <div class="field"><label>Type</label>
          <select onchange="window._editMedia.type=this.value;document.getElementById('media-file-hint').textContent=mediaFileHint(this.value)">
            ${Object.entries(MEDIA_TYPES).map(([t,icon])=>`<option value="${t}"${m.type===t?' selected':''}>${icon} ${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field"><label>Description / Notes</label><textarea rows="2" oninput="window._editMedia.description=this.value" placeholder="Notes sur ce média...">${esc(m.description||'')}</textarea></div>
      <div class="field">
        <label>Fichier <span id="media-file-hint" style="opacity:.6;font-weight:400;text-transform:none">${mediaFileHint(m.type)}</span></label>
        <label class="img-upload-btn" style="${m.data?'border-style:solid;border-color:var(--indigo)':''}">
          ${m.data?`<span style="font-size:20px">✅</span><span>Fichier chargé${m.fileName?' : '+esc(m.fileName):''}</span>`:
            `<span style="font-size:28px">📁</span><span>Cliquer pour choisir un fichier</span>`}
          <input type="file" id="media-file-inp" style="display:none"
            accept="${mediaAccept(m.type)}"
            onchange="handleMediaFile(this)">
        </label>
      </div>
      <div class="field">
        <label>Miniature (optionnel, image)</label>
        <label class="img-upload-btn">
          ${m.thumbnail?`<img src="${m.thumbnail}" style="max-height:60px;border-radius:4px">`:`<span style="font-size:20px">🖼️</span><span>Miniature optionnelle</span>`}
          <input type="file" accept="image/*" style="display:none" onchange="handleImgUpload('media-thumb',this)">
        </label>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="saveMedia(${editId||'null'})">${editId?'Sauvegarder':'Ajouter'}</button>
      </div>
    </div>
  </div>`);
}

function mediaFileHint(type){
  return {audio:'(.mp3, .ogg, .wav)',image:'(.jpg, .png, .webp)',map:'(.jpg, .png, .webp)',document:'(.pdf, .txt)',video:'(.mp4)',other:'(tout format)'}[type]||'';
}
function mediaAccept(type){
  return {audio:'audio/*',image:'image/*',map:'image/*',document:'.pdf,.txt,.docx',video:'video/*',other:'*'}[type]||'*';
}

function handleMediaFile(input){
  if(!input.files[0]) return;
  const file=input.files[0];
  window._editMedia.fileName=file.name;
  readFile(file, data=>{
    window._editMedia.data=data;
    const label=input.closest('label');
    label.innerHTML=`<span style="font-size:20px">✅</span><span>Chargé : ${esc(file.name)}</span><input type="file" id="media-file-inp" style="display:none" accept="${mediaAccept(window._editMedia.type)}" onchange="handleMediaFile(this)">`;
  });
}

function saveMedia(editId){
  const m=window._editMedia;
  if(!m||!m.title.trim()) return;
  if(window._imgUploads['media-thumb']) m.thumbnail=window._imgUploads['media-thumb'];
  if(editId&&editId!=='null') DB.media=DB.media.map(x=>x.id===editId?m:x);
  else DB.media.push(m);
  save(); closeModal(); renderMedia(); toast('Média sauvegardé !');
}

function deleteMedia(id){
  if(!confirm('Supprimer ce média ?')) return;
  deleteBlob('med_'+id);
  DB.media=DB.media.filter(m=>m.id!==id);
  save(); renderMedia();
}

