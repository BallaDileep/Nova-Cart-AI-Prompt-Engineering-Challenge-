const $=s=>document.querySelector(s),money=n=>'₹'+n.toLocaleString('en-IN');
const CATS=['All','Fruits & Veg','Dairy & Eggs','Groceries','Snacks','Drinks','Personal Care','Home','Stationery'];
const COL={Red:'#d24d57',Green:'#2f9e6a',Yellow:'#e0a82e',Blue:'#3d6fd1',White:'#9aa5b8',Black:'#2b3140',Orange:'#e07a35',Pink:'#d6709f'};
const SEED=[['Fuji Apples 1kg','Fruits & Veg','Red',180,220,24,'Fresh Basket'],['Spinach Bunch','Fruits & Veg','Green',30,40,0,'Fresh Basket'],['Bananas 12 pc','Fruits & Veg','Yellow',60,60,40,'Green Mart'],['Full Cream Milk 1L','Dairy & Eggs','White',68,72,3,'Daily Dairy'],['Farm Eggs 12 pc','Dairy & Eggs','White',96,120,18,'Daily Dairy'],['Basmati Rice 5kg','Groceries','White',540,690,12,'Green Mart'],['Tomato Ketchup','Groceries','Red',110,140,30,'Green Mart'],['Masala Chips','Snacks','Orange',20,25,60,'Snack Shack'],['Dark Chocolate','Snacks','Black',150,200,2,'Snack Shack'],['Blue Berry Soda','Drinks','Blue',45,60,35,'Cool Corner'],['Orange Juice 1L','Drinks','Orange',120,150,0,'Cool Corner'],['Rose Face Wash','Personal Care','Pink',210,320,15,'Glow Care'],['Charcoal Soap','Personal Care','Black',85,110,22,'Glow Care'],['Dish Wash Gel','Home','Green',130,190,27,'HomeEase'],['Floor Cleaner','Home','Blue',165,230,9,'HomeEase'],['Gel Pens (5)','Stationery','Blue',75,100,44,'Paper Pal']].map((p,i)=>({id:i,n:p[0],c:p[1],col:p[2],p:p[3],m:p[4],s:p[5],st:p[6]}));
let P=[];
let ORD=[];
const STEPS=['Order placed','Packed','Out for delivery','Delivered'];
const CAMP=[['First-order discount','FIRST20: 20% off a first order (up to ₹100)',1],['Referral rewards','Both friends get ₹75 credit',1],['Social media advertising','Instagram and Facebook local ads',0],['Influencer promotions','Local creator codes',0],['Festival coupons','FEST10: 10% off during festivals',1],['Free-delivery campaigns','FREEDEL: free delivery over ₹399',0]];
const S={user:null,view:'shop',cat:'All',f:{col:'',max:700,disc:0,stock:false,q:''},cart:{},my:[],tab:'Orders',coupon:'',msg:'',signup:false};

// ---------- login ----------
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=t=>new Date(t).toDateString()===new Date().toDateString();
const STORES=[...new Set(SEED.map(p=>p.st))];
async function refresh(){const d=await DB.load(S.user,SEED,CAMP.map(c=>c[2]));P=d.products;ORD=d.orders;CAMP.forEach((c,i)=>{if(d.camps[i]!==undefined)c[2]=d.camps[i]})}
function setMode(){const s=S.signup,loc=DB.mode==='local';$('#nameBox').style.display=s?'block':'none';$('#roleBox').style.display=s&&loc?'block':'none';$('#storeBox').style.display=s&&loc&&$('#role').value==='partner'?'block':'none';$('#lgo').textContent=s?'Create an Account':'Sign In';$('#ltxt').textContent=s?'Already have an account?':'New here?';$('#ltog').textContent=s?'Sign In':'Create an Account';$('#lsub').textContent=s?'Join Nova Cart in under a minute.':'Sign in to get groceries and essentials in minutes.'}
$('#ltog').onclick=()=>{S.signup=!S.signup;setMode()};
$('#lgo').onclick=async()=>{const e=$('#em').value.trim().toLowerCase(),p=$('#pw').value,er=$('#lerr');let m='';
 if(!/^\S+@\S+\.\S+$/.test(e))m='Enter a valid email address, like you@example.com.';else if(p.length<6)m='Your password needs at least 6 characters.';else if(S.signup&&!$('#nm').value.trim())m='Tell us your name so stores know who to deliver to.';
 if(!m)try{S.user=S.signup?await DB.signUp(e,p,$('#nm').value.trim(),$('#role').value,$('#store').value):await DB.signIn(e,p);return enter()}catch(x){m=x.message}
 er.textContent=m;er.style.display='block'};
async function enter(){await refresh();try{S.cart=JSON.parse(localStorage.getItem('nc_cart_'+S.user.uid)||'{}')}catch{S.cart={}}$('#login').style.display='none';$('#app').style.display='grid';S.view='shop';draw()}
function signOut(){DB.signOut().then(()=>location.reload())}
['em','pw','nm'].forEach(i=>$('#'+i).addEventListener('keydown',e=>{if(e.key==='Enter')$('#lgo').click()}));

// ---------- helpers ----------
const disc=p=>Math.round((1-p.p/p.m)*100);
const stTag=p=>p.s===0?'<span class="tag t-out">Out of stock</span>':p.s<=5?`<span class="tag t-low">Only ${p.s} left</span>`:'<span class="tag t-ok">In stock</span>';
const cartN=()=>Object.values(S.cart).reduce((a,b)=>a+b,0);
function nav(v){S.view=v;S.msg='';draw()}
window.nav=nav;
function side(){localStorage.setItem('nc_cart_'+S.user.uid,JSON.stringify(S.cart));const partner=S.user.role==='partner';
 const items=[['shop','Shop'],['cart','My Cart'+(cartN()?` (${cartN()})`:'')],['orders','My Orders']];
 if(partner)items.push(['dash','Store Dashboard'],['ins','Insights & Growth']);
 $('#side').innerHTML=`<div class="logo">Nova <span>Cart</span></div>`+items.map(([k,l])=>`<button class="nav ${S.view===k?'on':''}" onclick="nav('${k}')">${l}</button>`).join('')+`<div class="who">${esc(S.user.name)}<br>${esc(S.user.email)}<br><button class="link" style="color:#3fd9aa" onclick="signOut()">Sign Out</button></div>`}
function draw(){side();({shop,cart,orders,dash,ins})[S.view]()}

// ---------- shop ----------
function shop(){const f=S.f;
 const list=P.filter(p=>(S.cat==='All'||p.c===S.cat)&&(!f.col||p.col===f.col)&&p.p<=f.max&&disc(p)>=f.disc&&(!f.stock||p.s>0)&&p.n.toLowerCase().includes(f.q.toLowerCase()));
 $('#main').innerHTML=`<h2>What do you need today?</h2>
 <div class="cats">${CATS.map(c=>`<button class="chip ${S.cat===c?'on':''}" onclick="S.cat='${c.replace("'","\\'")}';shop()">${c}</button>`).join('')}</div>
 <div class="filters">
  <div><label for="fq">Search</label><input id="fq" value="${f.q}" placeholder="Search items"></div>
  <div><label for="fc">Colour</label><select id="fc"><option value="">Any colour</option>${Object.keys(COL).map(c=>`<option ${f.col===c?'selected':''}>${c}</option>`).join('')}</select></div>
  <div><label for="fp">Price up to ${money(f.max)}</label><input id="fp" type="range" min="20" max="700" step="10" value="${f.max}"></div>
  <div><label for="fd">Discount</label><select id="fd">${[0,10,20,30].map(d=>`<option value="${d}" ${f.disc===d?'selected':''}>${d?d+'% off or more':'Any discount'}</option>`).join('')}</select></div>
  <label class="chk"><input id="fs" type="checkbox" ${f.stock?'checked':''}>In stock only</label>
  <button class="btn sec" id="fr">Clear filters</button></div>
 ${S.msg?`<div class="msg ok">${S.msg}</div>`:''}
 <div class="grid">${list.map(p=>`<div class="card"><div class="pimg" style="background:${COL[p.col]}">${p.n[0]}</div>
  <div class="pn">${p.n}</div><div class="sub">${p.st} · ${p.col}</div>
  <div class="row" style="margin:8px 0"><div><span class="price">${money(p.p)}</span>${p.m>p.p?`<span class="mrp">${money(p.m)}</span>`:''}</div>${p.m>p.p?`<span class="tag t-blue">${disc(p)}% off</span>`:''}</div>
  <div class="row">${stTag(p)}<button class="btn sm" ${p.s?'':'disabled'} onclick="add(${p.id})">Add</button></div></div>`).join('')||'<p>No items match these filters. Try clearing a filter.</p>'}</div>`;
 $('#fq').oninput=e=>{f.q=e.target.value;shop();$('#fq').focus();$('#fq').setSelectionRange(f.q.length,f.q.length)};
 $('#fc').onchange=e=>{f.col=e.target.value;shop()};$('#fp').onchange=e=>{f.max=+e.target.value;shop()};
 $('#fp').oninput=e=>e.target.previousElementSibling.textContent='Price up to '+money(+e.target.value);
 $('#fd').onchange=e=>{f.disc=+e.target.value;shop()};$('#fs').onchange=e=>{f.stock=e.target.checked;shop()};
 $('#fr').onclick=()=>{S.f={col:'',max:700,disc:0,stock:false,q:''};S.cat='All';shop()}}
function add(id){const p=P[id];if((S.cart[id]||0)>=p.s){S.msg=`Only ${p.s} of ${p.n} available right now.`;return shop()}S.cart[id]=(S.cart[id]||0)+1;S.msg=`${p.n} added to your cart.`;side();shop()}
window.add=add;

// ---------- cart ----------
function totals(){let sub=0;for(const id in S.cart)sub+=P[id].p*S.cart[id];
 const first=S.coupon==='FIRST20'?Math.min(100,Math.round(sub*.2)):0,fest=S.coupon==='FEST10'?Math.round(sub*.1):0;
 const free=S.coupon==='FREEDEL'&&sub>=399||sub>=499;return{sub,d:first+fest,fee:free||!sub?0:30}}
function cart(){const ids=Object.keys(S.cart);const t=totals();
 $('#main').innerHTML=`<h2>My Cart</h2>${S.msg?`<div class="msg ${S.msg.startsWith('Order')?'ok':''}">${S.msg}</div>`:''}
 ${!ids.length?'<p>Your cart is empty. Browse the shop to add items.</p>':`<div class="two"><div class="scroll"><table>${ids.map(i=>{const p=P[i];return`<tr><td><b>${p.n}</b><div class="sub">${p.st}</div></td><td><div class="qty"><button onclick="qty(${i},-1)" aria-label="Less">−</button>${S.cart[i]}<button onclick="qty(${i},1)" aria-label="More">+</button></div></td><td>${money(p.p*S.cart[i])}</td></tr>`}).join('')}</table></div>
 <div class="card"><h3>Order summary</h3>
 <div class="row"><span>Subtotal</span><span>${money(t.sub)}</span></div><div class="row"><span>Discount</span><span class="good">−${money(t.d)}</span></div><div class="row"><span>Delivery</span><span>${t.fee?money(t.fee):'Free'}</span></div><hr style="border:0;border-top:1px solid var(--line)"><div class="row"><b>Total</b><b>${money(t.sub-t.d+t.fee)}</b></div>
 <label for="cp">Coupon code</label><div class="row"><input id="cp" value="${S.coupon}" placeholder="FIRST20, FEST10, FREEDEL"><button class="btn sec" onclick="S.coupon=$('#cp').value.trim().toUpperCase();cart()">Apply</button></div>
 <label for="pm">Pay with</label><select id="pm"><option>UPI</option><option>Card</option><option>Cash on delivery</option></select>
 <button class="btn" style="width:100%;margin-top:14px" onclick="checkout()">Place Order</button></div></div>`}`}
function qty(i,d){const n=(S.cart[i]||0)+d;if(n<=0)delete S.cart[i];else if(n>P[i].s){S.msg=`Only ${P[i].s} of ${P[i].n} left.`;return cart()}else S.cart[i]=n;side();cart()}
window.qty=qty;

// ---------- orders ----------
const track=o=>o.st<0?`<span class="tag t-out">Cancelled: ${esc(o.why)}</span>`:`<div class="steps">${STEPS.map((s,i)=>`<i class="${i<=o.st?'d':''}" title="${s}"></i>`).join('')}</div><div class="sub">${STEPS[o.st]}${o.st<3?` · about ${o.eta} min`:''}</div>`;
function orders(){const my=ORD.filter(o=>o.uid===S.user.uid);$('#main').innerHTML=`<h2>My Orders</h2>${S.msg?`<div class="msg ok">${S.msg}</div>`:''}${my.length?my.map(o=>`<div class="card" style="margin-bottom:12px"><div class="row"><b>${esc(o.id)}</b><span>${money(o.amt)}</span></div><div class="sub">${esc(o.pay)} · ${esc(o.ps)}</div>${track(o)}</div>`).join(''):'<p>No orders yet. Your orders and live tracking will show up here.</p>'}`}
function checkout(){const m=$('#pm').value;if(m==='Cash on delivery')return place(m,'Pay on delivery');const t=totals();
 $('#main').innerHTML=`<h2>Payment</h2><div class="card" style="max-width:420px"><p class="sub">Test payment screen. No real money moves.</p><div class="row"><b>${m}</b><b>${money(t.sub-t.d+t.fee)}</b></div><button class="btn" style="width:100%;margin-top:14px" onclick="place('${m}','Paid')">Pay now</button><button class="btn sec" style="width:100%;margin-top:8px" onclick="cart()">Cancel</button></div>`}
async function place(m,ps){const t=totals(),items=Object.keys(S.cart).map(i=>[+i,S.cart[i]]);
 const o={id:'NC-'+Date.now().toString(36).toUpperCase().slice(-6),uid:S.user.uid,cu:S.user.name,email:S.user.email,amt:t.sub-t.d+t.fee,st:0,pay:m,ps,rider:'Unassigned',eta:28,ts:Date.now(),stores:[...new Set(items.map(([i])=>P[i].st))],lines:items.map(([i,q])=>[i,q,P[i].p,P[i].st])};
 try{await DB.placeOrder(o,items)}catch(e){await refresh();if(e.id!==undefined){const p=P[e.id],alt=P.find(x=>x.c===p.c&&x.id!==p.id&&x.s>0);S.msg=`${p.n} just ran out. ${alt?`Try ${alt.n} instead.`:'Remove it to continue.'}`}else S.msg='Something went wrong. Please try again.';return cart()}
 S.cart={};S.coupon='';await refresh();S.msg=`Order ${o.id} placed. Stock is confirmed, so it won't be cancelled for availability.`;nav('orders')}

// ---------- partner dashboard ----------
const share=o=>(o.lines||[]).filter(l=>l[3]===S.user.store).reduce((a,l)=>a+l[1]*l[2],0);
function dash(){const st=S.user.store;if(!st){$('#main').innerHTML='<h2>Store Dashboard</h2><p>Your account isn\'t linked to a store yet. Ask an admin to set your store.</p>';return}
 const O=ORD.filter(o=>(o.stores||[]).includes(st)),MP=P.filter(p=>p.st===st),T=['Orders','Inventory','Customers','Deliveries','Payments'];let body='';
 const cu={};O.forEach(o=>{const c=cu[o.uid]=cu[o.uid]||{n:o.cu,e:o.email,k:0};c.k++});
 if(S.tab==='Orders')body=`<table><tr><th>Order</th><th>Customer</th><th>Your items</th><th>Status</th><th></th></tr>${O.map(o=>`<tr><td>${esc(o.id)}</td><td>${esc(o.cu)}</td><td>${money(share(o))}</td><td>${o.st<0?'Cancelled':STEPS[o.st]}</td><td>${o.st>=0&&o.st<3?`<button class="btn sm" onclick="adv('${o.id}')">Mark ${STEPS[o.st+1].toLowerCase()}</button>`:''}</td></tr>`).join('')}</table>`;
 if(S.tab==='Inventory')body=`<div class="msg">Out-of-stock items are hidden from ordering instantly, so customers never pay for something you can't ship.</div><table><tr><th>Item</th><th>Status</th><th>Stock</th></tr>${MP.map(p=>`<tr><td>${esc(p.n)}</td><td>${stTag(p)}</td><td><div class="qty"><button onclick="stk(${p.id},-1)" aria-label="Less">−</button><span>${p.s}</span><button onclick="stk(${p.id},5)" aria-label="Add 5">+5</button></div></td></tr>`).join('')}</table>`;
 if(S.tab==='Customers')body=`<table><tr><th>Name</th><th>Email</th><th>Orders</th><th>Segment</th></tr>${Object.values(cu).map(c=>`<tr><td>${esc(c.n)}</td><td>${esc(c.e)}</td><td>${c.k}</td><td><span class="tag ${c.k>=3?'t-ok':c.k===1?'t-blue':'t-gray'}">${c.k>=3?'Repeat':c.k===1?'New':'Returning'}</span></td></tr>`).join('')}</table>`;
 if(S.tab==='Deliveries')body=`<table><tr><th>Order</th><th>Rider</th><th>Progress</th></tr>${O.map(o=>`<tr><td>${esc(o.id)}</td><td>${esc(o.rider)}</td><td style="min-width:180px">${track(o)}</td></tr>`).join('')}</table>`;
 if(S.tab==='Payments')body=`<table><tr><th>Order</th><th>Method</th><th>Your share</th><th>Status</th></tr>${O.map(o=>`<tr><td>${esc(o.id)}</td><td>${esc(o.pay)}</td><td>${money(share(o))}</td><td><span class="tag ${o.st<0?'t-out':o.ps==='Paid'?'t-ok':'t-gray'}">${o.st<0?'Refund due':esc(o.ps)}</span></td></tr>`).join('')}</table>`;
 if(!O.length&&S.tab!=='Inventory')body='<p style="padding:14px">No orders yet. New orders for your store will appear here.</p>';
 const td=O.filter(o=>today(o.ts)),low=MP.filter(p=>p.s<=5).length;
 $('#main').innerHTML=`<h2>${esc(st)} Dashboard</h2><div class="kpis"><div class="card kpi"><span class="sub">Orders today</span><b>${td.length}</b></div><div class="card kpi"><span class="sub">Revenue today</span><b>${money(td.filter(o=>o.st>=0).reduce((a,o)=>a+share(o),0))}</b></div><div class="card kpi"><span class="sub">Items low or out</span><b class="${low?'bad':''}">${low}</b></div></div>
 <div class="tabs">${T.map(t=>`<button class="chip ${S.tab===t?'on':''}" onclick="S.tab='${t}';dash()">${t}</button>`).join('')}</div><div class="scroll">${body}</div>`}
function adv(id){const o=ORD.find(x=>x.id===id);o.st++;if(o.st===2&&o.rider==='Unassigned')o.rider='Neha';o.eta=Math.max(0,o.eta-10);DB.updateOrder(id,{st:o.st,rider:o.rider,eta:o.eta});dash()}
function stk(i,d){P[i].s=Math.max(0,P[i].s+d);DB.updateStock(i,P[i].s);dash()}
function setCamp(i,v){CAMP[i][2]=v?1:0;DB.saveCamps(CAMP.map(c=>c[2]))}
window.adv=adv;window.stk=stk;window.setCamp=setCamp;window.place=place;window.signOut=signOut;

// ---------- insights ----------
function ins(){const K=[['Repeat purchase','41%','27%'],['Delivery time','29 min','37 min'],['Cancellations','6%','11%'],['Support tickets / month','3,100','5,900']];
 $('#main').innerHTML=`<h2>Insights & Growth</h2><div class="kpis">${K.map(k=>`<div class="card kpi"><span class="sub">${k[0]}</span><b>${k[1]} → <span class="bad">${k[2]}</span></b></div>`).join('')}</div>
 <div class="two"><div class="card"><h3>Why orders go wrong</h3><p>29% of customers say items became unavailable after ordering, and 35% of cancellations come from missing stock. Partner stores find inventory upkeep hard, so stock goes stale.</p><h3>What Nova Cart does about it</h3><ul><li>Live stock counts, with low-stock and out-of-stock labels</li><li>Stock re-checked at checkout, with a similar item suggested</li><li>Quick stock buttons for partner stores</li><li>Cart limits that never exceed stock</li></ul></div>
 <div class="card"><h3>Growth campaigns</h3>${CAMP.map((c,i)=>`<div class="row" style="margin-bottom:12px"><div><b>${c[0]}</b><div class="sub">${c[1]}</div></div><label class="sw"><input type="checkbox" ${c[2]?'checked':''} onchange="setCamp(${i},this.checked)" aria-label="${c[0]}"><span></span></label></div>`).join('')}</div></div>`}
$('#store').innerHTML=STORES.map(s=>`<option>${esc(s)}</option>`).join('');$('#role').onchange=setMode;setMode();
DB.restore().then(u=>{if(u){S.user=u;enter()}}).catch(()=>{});
