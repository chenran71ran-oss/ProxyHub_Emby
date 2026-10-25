import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const read=n=>fs.readFileSync(path.join(dir,n),'utf8');
function load(source){
 const network=[];
 const scope={console,URL,Request,Response,Headers,TextEncoder,TextDecoder,atob,btoa,ReadableStream,crypto:globalThis.crypto,
  fetch:async(...args)=>{network.push(args);return new Response('mock-stream',{headers:{'Content-Type':'video/mp4'}})}};
 vm.createContext(scope);
 vm.runInContext(source.replace(/export default\s*/,'const __worker = '),scope,{timeout:3000});
 return {worker:vm.runInContext('__worker',scope),scope,network};
}
const base=load(read('.upstream/worker.mjs'));
const fork=load(read('worker.js'));
const env={ADMIN_TOKEN:'qa-only-not-a-real-password'};
const ctx={waitUntil(){}};
const root='https://panel.test';
const baseLogin=await base.worker.fetch(new Request(root+'/api/login',{method:'POST',body:JSON.stringify({pass:env.ADMIN_TOKEN})}),env,ctx);
const forkLogin=await fork.worker.fetch(new Request(root+'/api/login',{method:'POST',body:JSON.stringify({pass:env.ADMIN_TOKEN})}),env,ctx);
assert.equal(forkLogin.status,baseLogin.status);
assert.deepEqual(await forkLogin.clone().json(),await baseLogin.clone().json());
const cookie=forkLogin.headers.get('set-cookie').split(';')[0];
for(const [name,req] of [
 ['landing',new Request(root+'/')],
 ['panel',new Request(root+'/',{headers:{Cookie:cookie}})],
 ['rtt',new Request(root+'/__client_rtt__')],
 ['entry',new Request(root+'/entry')],
 ['unauth-api',new Request(root+'/api/routes')],
 ['version',new Request(root+'/api/version',{headers:{Cookie:cookie}})],
 ['proxy',new Request(root+'/https://example.test/emby/Videos/demo/stream.mp4',{headers:{Range:'bytes=0-1023'}})],
]){
 const a=await base.worker.fetch(req.clone(),env,ctx);
 const b=await fork.worker.fetch(req.clone(),env,ctx);
 assert.equal(b.status,a.status,name);
 const at=await a.text(),bt=await b.text();
 if(name==='landing'||name==='panel'){
  assert(bt.includes('id="fork-dashboard-ui"'),name);
  assert(bt.includes('data.forkTheme')||bt.includes('dataset.forkTheme'));
  assert.equal((bt.match(/id="fork-dashboard-ui"/g)||[]).length,1);
  if(name==='panel'){
   assert(bt.includes('chenran71ran-oss/ProxyHub_Emby/refs/heads/main/worker.js'));
   assert(!bt.includes('MakkaPakka518/ProxyHub_Emby/refs/heads/main/worker.js'));
  }
  // Every original DOM ID, inline handler and form remains in the skinned output.
  for(const m of at.matchAll(/\b(?:id|onclick|onsubmit)="([^\"]*)"/g))assert(bt.includes(m[0]),'Lost '+m[0]);
  let count=0;
  for(const m of bt.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
   if(/\bsrc\s*=/.test(m[1]))continue;
   new vm.Script(m[2],{filename:name+'-script-'+(++count)});
  }
  fs.mkdirSync(path.join(dir,'preview','dist'),{recursive:true});
  const fixture=`<script>window.__qaCalls=[];window.fetch=async function(url,init){window.__qaCalls.push([String(url),init&&init.method||'GET']);if(init&&init.method==='POST'){return new Response(JSON.stringify({success:true}),{headers:{'Content-Type':'application/json'}})}var data={success:true,role:'admin',routes:[{prefix:'demo',target:'https://example.test',remark:'演示节点',mode:'off',cache_img:'on',icon:'',node_user:'',node_pass:''}],results:[],total:0,users:[],isAdmin:true};if(String(url).includes('api/routes'))data={success:true,data:data.routes,routes:data.routes};if(String(url).includes('api/version'))data={success:true,version:'4.0.4',updateNotify:false};return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}})};</script>`;
  const correctedFixture=fixture.replace("data={success:true,data:data.routes,routes:data.routes}","data=data.routes");
  fs.writeFileSync(path.join(dir,'preview','dist',name+'.html'),bt.replace('<head>','<head>'+correctedFixture));
  console.log(name+': script syntax, DOM preservation, skin and update source OK; '+count+' inline scripts');
 }else {assert.equal(bt,at,name+' unexpectedly changed');console.log(name+': unchanged');}
}
const hook='\n_0x1704d2=applyCustomUI(_0x1704d2);\n';
const built=read('worker.js');
const recovered=built.slice(0,built.indexOf('\n// BEGIN PERSONAL_UI_ADAPTER')).replace('// FORK_UI: dashboard-v03\n','').replace('// PINNED_UPSTREAM_COMMIT: 5308d6c6e332d423475280f819d82bef04b55fab\n','').replace(hook,'');
assert.equal(recovered===read('.upstream/worker.mjs') || recovered===read('.upstream/worker.mjs').slice(0,-1),true,'Upstream source restoration differs');
assert.equal(fork.worker.scheduled.toString(),base.worker.scheduled.toString());
console.log('Pinned upstream recovered exactly; fetch/auth/proxy/D1/scheduled source preserved except HTML adapter hook');
console.log('No real CF, D1 or media servers contacted. Database migration not tested.');
