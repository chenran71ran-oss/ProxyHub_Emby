import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
const directory=path.dirname(fileURLToPath(import.meta.url));
const read=p=>fs.readFileSync(path.join(directory,p),'utf8');
const original=read('.upstream/worker.mjs');
const expected='287c4d9d5152017295e651c3c14f0ab9e33e65c2';
const bytes=Buffer.from(original);
const gitSHA=crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
// apply_patch can add a trailing newline to the downloaded blob.
const normalized=gitSHA===expected?original:original.endsWith('\n')?original.slice(0,-1):original;
const normalizedBytes=Buffer.from(normalized);
const actual=crypto.createHash('sha1').update(`blob ${normalizedBytes.length}\0`).update(normalizedBytes).digest('hex');
if(actual!==expected)throw Error('Upstream source differs from pinned Git blob: '+actual);
const hook="function htmlResponse(_0x5ea142,_0x1704d2,_0x4f0dc2,_0x14ab6f){";
if(normalized.split(hook).length!==2)throw Error('Upstream HTML response hook changed; manual adaptation required');
const css=read('ui/dashboard.css');
const boot=read('ui/theme-init.js');
const js=read('ui/dashboard.js');
for(const text of [css,boot,js])if(/<\/script|<\/style/i.test(text))throw Error('Unexpected HTML terminator in UI source');
const head=`<style id="fork-dashboard-ui">${css}</style><script>${boot}</script>`;
const foot=`<script>${js}</script>`;
const additions=`\n// BEGIN PERSONAL_UI_ADAPTER\nconst FORK_UI_REVISION = "dashboard-v03";\nconst FORK_UPDATE_SOURCE = "https://raw.githubusercontent.com/chenran71ran-oss/ProxyHub_Emby/refs/heads/main/worker.js";\nfunction applyCustomUI(html) {\n  if (typeof html !== 'string' || html.includes('id="fork-dashboard-ui"')) return html;\n  if (!html.includes('</head>')) return html;\n  html = html.split('https://raw.githubusercontent.com/MakkaPakka518/ProxyHub_Emby/refs/heads/main/worker.js').join(FORK_UPDATE_SOURCE);\n  html = html.split('https://raw.githubusercontent.com/MakkaPakka518/ProxyHub_Emby/refs/heads/main/changelog.json').join('https://raw.githubusercontent.com/chenran71ran-oss/ProxyHub_Emby/refs/heads/main/changelog.json');\n  html = html.replace('</head>', ${JSON.stringify(head)} + '</head>');\n  return html.includes('</body>') ? html.replace('</body>', ${JSON.stringify(foot)} + '</body>') : html + ${JSON.stringify(foot)};\n}\n// END PERSONAL_UI_ADAPTER\n`;
// The original fetch, auth, proxy, D1 and scheduled handlers remain byte-for-byte.
const modified=normalized.replace(hook,hook+'\n_0x1704d2=applyCustomUI(_0x1704d2);\n');
const header='// FORK_UI: dashboard-v03\n// PINNED_UPSTREAM_COMMIT: 5308d6c6e332d423475280f819d82bef04b55fab\n';
// VERSION must remain the first line for the author\'s version detection.
const split=modified.indexOf('\n')+1;
const out=modified.slice(0,split)+header+modified.slice(split)+additions;
fs.writeFileSync(path.join(directory,'worker.js'),out);
const outputBytes=Buffer.from(out);
fs.writeFileSync(path.join(directory,'build-meta.json'),JSON.stringify({hook,header,additions,gitBlob:crypto.createHash('sha1').update(`blob ${outputBytes.length}\0`).update(outputBytes).digest('hex')}));
console.log(JSON.stringify({upstreamGitBlob:actual,sourceBytes:normalizedBytes.length,buildBytes:Buffer.byteLength(out),ui:FORK_UI()}));
function FORK_UI(){return 'dashboard-v03';}
