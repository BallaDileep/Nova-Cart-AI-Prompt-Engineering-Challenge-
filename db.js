// Data layer: Firebase when firebase-config.js is filled in, otherwise browser-local storage with real password checks.
(()=>{
const cfg=window.FIREBASE_CONFIG,FB=!!(cfg&&cfg.apiKey);
const L=(k,d)=>{try{return JSON.parse(localStorage.getItem('nc_'+k))??d}catch{return d}},W=(k,v)=>localStorage.setItem('nc_'+k,JSON.stringify(v));
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('nc:'+s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const load=u=>new Promise((r,j)=>{const s=document.createElement('script');s.src=u;s.onload=r;s.onerror=j;document.head.appendChild(s)});
const V='https://www.gstatic.com/firebasejs/10.12.4/firebase-';
const pub=u=>({uid:u.uid,email:u.email,name:u.name,role:u.role,store:u.store});
const fe=e=>({'auth/email-already-in-use':'An account with this email already exists. Try signing in.','auth/invalid-credential':'Email or password is incorrect.','auth/weak-password':'Choose a stronger password.'}[e.code]||e.message);
let auth,fs;const DB=window.DB={mode:FB?'firebase':'local'};
DB.ready=(async()=>{if(!FB)return;for(const m of['app','auth','firestore'])await load(V+m+'-compat.js');firebase.initializeApp(cfg);auth=firebase.auth();fs=firebase.firestore()})();

DB.restore=async()=>{await DB.ready;
 if(!FB){const U=L('users',{}),s=L('session');return s&&U[s]?pub(U[s]):null}
 const u=await new Promise(r=>{const o=auth.onAuthStateChanged(x=>{o();r(x)})});if(!u)return null;
 const d=(await fs.doc('users/'+u.uid).get()).data()||{};return{uid:u.uid,email:u.email,name:d.name||u.email.split('@')[0],role:d.role||'shopper',store:d.store||''}};
DB.signUp=async(email,pw,name,role,store)=>{await DB.ready;
 if(!FB){const U=L('users',{});if(U[email])throw Error('An account with this email already exists. Try signing in.');
  const u={uid:'u'+Date.now(),email,name,role,store:role==='partner'?store:'',h:await sha(email+':'+pw)};U[email]=u;W('users',U);W('session',email);return pub(u)}
 let c;try{c=await auth.createUserWithEmailAndPassword(email,pw)}catch(e){throw Error(fe(e))}
 const u={name,role:'shopper',store:''};await fs.doc('users/'+c.user.uid).set(u);return{uid:c.user.uid,email,...u}};
DB.signIn=async(email,pw)=>{await DB.ready;
 if(!FB){const u=L('users',{})[email];if(!u||u.h!==await sha(email+':'+pw))throw Error('Email or password is incorrect.');W('session',email);return pub(u)}
 try{await auth.signInWithEmailAndPassword(email,pw)}catch(e){throw Error(fe(e))}return DB.restore()};
DB.signOut=async()=>{if(FB)await auth.signOut();else localStorage.removeItem('nc_session')};

DB.load=async(u,seed,cd)=>{await DB.ready;
 if(!FB){let p=L('products');if(!p){p=seed;W('products',p)}let o=L('orders',[]);if(u.role!=='partner')o=o.filter(x=>x.uid===u.uid);return{products:p,orders:o,camps:L('camps',cd)}}
 let snap=await fs.collection('products').get();
 if(u.role==='partner'&&u.store&&!snap.docs.some(d=>d.data().st===u.store)){const b=fs.batch();seed.filter(p=>p.st===u.store).forEach(p=>b.set(fs.doc('products/'+p.id),p));await b.commit();snap=await fs.collection('products').get()}
 const arr=[];snap.forEach(d=>{const p=d.data();arr[p.id]=p});
 const q=u.role==='partner'?fs.collection('orders').where('stores','array-contains',u.store):fs.collection('orders').where('uid','==',u.uid);
 const os=(await q.get()).docs.map(d=>d.data()).sort((a,b)=>b.ts-a.ts);
 const c=await fs.doc('config/campaigns').get();return{products:arr,orders:os,camps:c.exists?c.data().v:cd}};
// Stock is checked and reduced in one step, so two shoppers can't buy the last item.
DB.placeOrder=async(o,items)=>{const bad=i=>Object.assign(Error('stock'),{id:i});
 if(!FB){const P=L('products');items.forEach(([i,q])=>{if(P[i].s<q)throw bad(i)});items.forEach(([i,q])=>P[i].s-=q);W('products',P);const O=L('orders',[]);O.unshift(o);W('orders',O);return}
 await fs.runTransaction(async t=>{const refs=items.map(([i])=>fs.doc('products/'+i));const sn=await Promise.all(refs.map(r=>t.get(r)));
  sn.forEach((s,k)=>{if(!s.exists||s.data().s<items[k][1])throw bad(items[k][0])});
  sn.forEach((s,k)=>t.update(refs[k],{s:s.data().s-items[k][1]}));t.set(fs.doc('orders/'+o.id),o)})};
DB.updateStock=async(id,s)=>{if(!FB){const P=L('products');P[id].s=s;return W('products',P)}await fs.doc('products/'+id).update({s})};
DB.updateOrder=async(id,patch)=>{if(!FB){const O=L('orders',[]),o=O.find(x=>x.id===id);Object.assign(o,patch);return W('orders',O)}await fs.doc('orders/'+id).update(patch)};
DB.saveCamps=async v=>{if(!FB)return W('camps',v);await fs.doc('config/campaigns').set({v})};
})();
