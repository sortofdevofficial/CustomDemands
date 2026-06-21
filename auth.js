/* ================================
   CUSTOM DEMANDS — auth.js
   ================================ */
const firebaseConfig={apiKey:"AIzaSyDuVgf-2jF10A8XQR7RZY7s9Ero8Y4KrII",authDomain:"custom-demands.firebaseapp.com",projectId:"custom-demands",storageBucket:"custom-demands.firebasestorage.app",messagingSenderId:"885129813571",appId:"1:885129813571:web:0891ca8dee84b80bdb3ef6",measurementId:"G-PDWSS8WQEL",databaseURL:"https://custom-demands-default-rtdb.firebaseio.com"};
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth(),db=firebase.database();
const provider=new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({prompt:'select_account'});
const IS_SETTINGS=new URLSearchParams(window.location.search).has('settings');
const $=id=>document.getElementById(id);
const SCREENS=['screenSignIn','screenAlready','screenUsername','screenSettings'];
function showOnly(id){SCREENS.forEach(s=>{const el=$(s);if(el)el.style.display=(s===id)?'':'none'});}
function avatarURL(user){return user.photoURL||`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName||'U')}&background=1a1a1a&color=fff&size=80&bold=true`;}
function validateU(u){if(!u||u.length<3)return'At least 3 characters required.';if(u.length>24)return'24 characters maximum.';if(!/^[a-zA-Z0-9_]+$/.test(u))return'Only letters, numbers, and underscores.';return null;}
function userRef(uid){return db.ref('users/'+uid);}
async function getUserData(uid){const snap=await userRef(uid).once('value');return snap.exists()?snap.val():null;}

auth.onAuthStateChanged(async user=>{
  if(!user){showOnly('screenSignIn');return;}
  try{
    let data=await getUserData(user.uid);
    if(!data){const nd={uid:user.uid,email:user.email||'',displayName:user.displayName||'',photoURL:user.photoURL||'',username:'',createdAt:Date.now()};await userRef(user.uid).set(nd);data=nd;}
    const hasUN=data.username&&data.username.length>=3;
    if(!hasUN){
      $('upAvatar').src=avatarURL(user);$('upName').textContent=user.displayName||'New User';$('upEmail').textContent=user.email||'';$('unInput').value='';$('unError').textContent='';
      showOnly('screenUsername');setTimeout(()=>$('unInput').focus(),280);
    }else if(IS_SETTINGS){fillSettings(user,data);showOnly('screenSettings');}
    else{$('alreadyAvatar').src=avatarURL(user);$('alreadyTitle').textContent='Hey, @'+data.username;$('alreadyEmail').textContent=user.email||'';showOnly('screenAlready');}
  }catch(err){
    console.error('DB:',err);
    if(IS_SETTINGS){fillSettingsFallback(user);showOnly('screenSettings');}
    else if(user){$('alreadyAvatar').src=avatarURL(user);$('alreadyTitle').textContent='Hey, '+(user.displayName||'there');$('alreadyEmail').textContent=user.email||'';showOnly('screenAlready');}
    else showOnly('screenSignIn');
  }
});

const GHTML=$('btnGoogle').innerHTML;
$('btnGoogle').addEventListener('click',async()=>{
  $('signInError').textContent='';$('btnGoogle').disabled=true;$('btnGoogle').innerHTML='<span class="btn-google-spinner"></span>&nbsp; Connecting…';
  try{await auth.signInWithPopup(provider);}
  catch(err){
    $('btnGoogle').disabled=false;$('btnGoogle').innerHTML=GHTML;
    const m={'auth/popup-closed-by-user':'Sign-in cancelled.','auth/popup-blocked':'Popup blocked — allow popups.','auth/network-request-failed':'Network error.','auth/cancelled-popup-request':'Only one sign-in at a time.'};
    $('signInError').textContent=m[err.code]||'Sign-in failed. Try again.';
  }
});

$('btnAlreadySignOut').addEventListener('click',doSignOut);
$('btnSaveUsername').addEventListener('click',saveNewUsername);
$('unInput').addEventListener('keydown',e=>{if(e.key==='Enter')saveNewUsername();});

async function saveNewUsername(){
  const user=auth.currentUser;if(!user)return;
  const val=$('unInput').value.trim().toLowerCase();const ve=validateU(val);
  if(ve){$('unError').textContent=ve;return;}
  $('unError').textContent='';$('btnSaveUsername').disabled=true;$('btnSaveUsername').textContent='Saving…';
  try{
    const snap=await db.ref('users').orderByChild('username').equalTo(val).limitToFirst(1).once('value');
    if(snap.exists()){$('unError').textContent='That username is taken — try another.';$('btnSaveUsername').disabled=false;$('btnSaveUsername').textContent='Save & Continue';return;}
    await userRef(user.uid).update({username:val,updatedAt:Date.now()});
    $('redirOverlay').classList.add('show');window.location.replace('index.html');
  }catch(err){console.error(err);$('unError').textContent='Could not save. Please try again.';$('btnSaveUsername').disabled=false;$('btnSaveUsername').textContent='Save & Continue';}
}

function fillSettings(user,data){
  const u=data.username||user.displayName||'user',p=avatarURL(user);
  $('spAvatar').src=p;$('spUsername').textContent='@'+u;$('spEmail').textContent=user.email||'';
  const ts=data.createdAt?new Date(data.createdAt).toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'}):'—';
  $('spSince').textContent='Member since '+ts;
  $('settingsUsername').value=u;$('infoName').textContent=user.displayName||'—';$('infoEmail').textContent=user.email||'—';$('infoUID').textContent=user.uid;
  $('sError').textContent='';$('sSuccess').textContent='';
}
function fillSettingsFallback(user){fillSettings(user,{username:user.displayName||'user',createdAt:null});}

document.querySelectorAll('.stab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.stab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.spanel').forEach(p=>p.classList.remove('active'));
    tab.classList.add('active');$(tab.dataset.panel).classList.add('active');
  });
});

$('btnSaveSettings').addEventListener('click',saveSettings);
$('settingsUsername').addEventListener('keydown',e=>{if(e.key==='Enter')saveSettings();});

async function saveSettings(){
  const user=auth.currentUser;if(!user)return;
  const val=$('settingsUsername').value.trim().toLowerCase();const ve=validateU(val);
  $('sError').textContent='';$('sSuccess').textContent='';
  if(ve){$('sError').textContent=ve;return;}
  $('btnSaveSettings').disabled=true;$('btnSaveSettings').textContent='Saving…';
  try{
    const data=await getUserData(user.uid),cur=data?data.username:'';
    if(val!==cur){
      const snap=await db.ref('users').orderByChild('username').equalTo(val).limitToFirst(1).once('value');
      if(snap.exists()){$('sError').textContent='Username taken — try another.';$('btnSaveSettings').disabled=false;$('btnSaveSettings').textContent='Save Changes';return;}
    }
    await userRef(user.uid).update({username:val,updatedAt:Date.now()});
    $('spUsername').textContent='@'+val;$('sSuccess').textContent='✓ Saved successfully!';
    setTimeout(()=>{$('sSuccess').textContent='';},3000);
  }catch(err){console.error(err);$('sError').textContent='Could not save. Please try again.';}
  finally{$('btnSaveSettings').disabled=false;$('btnSaveSettings').textContent='Save Changes';}
}

$('btnSignOut').addEventListener('click',doSignOut);
async function doSignOut(){
  $('redirOverlay').classList.add('show');
  try{await auth.signOut();window.location.replace('auth.html');}
  catch(e){$('redirOverlay').classList.remove('show');}
}