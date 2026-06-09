// Render the registry index into a single self-contained static HTML page —
// a browsable, searchable skill gallery. Zero deps, no backend; deploy the
// output folder to GitHub Pages. Pure function so it's easy to test.

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function card(s) {
  const repo = esc(s.repo || '');
  const path = s.path ? '/' + esc(s.path) : '';
  const kw = (s.keywords || []).map((k) => `<span class="tag">${esc(k)}</span>`).join('');
  const hay = esc([s.name, s.description, ...(s.keywords || [])].join(' ').toLowerCase());
  const repoLink = s.repo
    ? `<a class="repo" href="https://github.com/${repo}${s.path ? '/tree/' + esc(s.ref || 'main') + '/' + esc(s.path) : ''}" target="_blank" rel="noopener">${repo}${path} ↗</a>`
    : '';
  return `<article class="card" data-search="${hay}">
  <header><h3>${esc(s.name)}</h3>${s.license ? `<span class="lic">${esc(s.license)}</span>` : ''}</header>
  <p class="desc">${esc(s.description || '')}</p>
  <div class="tags">${kw}</div>
  <div class="add"><code>npx skillet add ${esc(s.name)}</code><button class="copy" data-cmd="npx skillet add ${esc(s.name)}" aria-label="copy">copy</button></div>
  ${repoLink}
</article>`;
}

export function generateGallery(index, { title = 'skillet', repoUrl = 'https://github.com/USER/skillet' } = {}) {
  const skills = (index.skills || [])
    .filter((s) => s && s.name) // skip malformed entries so one bad PR can't break the build
    .slice()
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const cards = skills.map(card).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} — AI agent skills registry</title>
<meta name="description" content="Browse and install AI agent skills (SKILL.md) with one command. ${skills.length} skills in the registry." />
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><text y='14' font-size='14'>🍳</text></svg>" />
<style>
:root{--bg:#0b0d12;--elev:#12151c;--elev2:#171b24;--border:#232838;--text:#e6e9f0;--muted:#8b93a7;--accent:#34d399;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.wrap{max-width:1040px;margin:0 auto;padding:48px 20px 80px}
.hero{text-align:center;margin-bottom:32px}
.hero h1{font-size:40px;margin:0 0 6px;letter-spacing:-0.5px}
.hero .sub{color:var(--muted);font-size:17px;margin:0 0 18px}
.hero code{background:var(--elev2);border:1px solid var(--border);border-radius:8px;padding:8px 14px;font-family:var(--mono);color:var(--accent);display:inline-block}
.bar{display:flex;gap:12px;align-items:center;margin:24px 0 20px;flex-wrap:wrap;justify-content:center}
#q{flex:1;min-width:240px;max-width:520px;background:var(--elev);border:1px solid var(--border);border-radius:10px;padding:11px 14px;color:var(--text);font-size:15px}
#q:focus{outline:none;border-color:var(--accent)}
.count{color:var(--muted);font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.card{background:var(--elev);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px}
.card header{display:flex;align-items:center;justify-content:space-between;gap:8px}
.card h3{margin:0;font-size:17px;color:var(--accent)}
.lic{color:var(--muted);font-size:11px;border:1px solid var(--border);border-radius:6px;padding:1px 6px}
.desc{margin:0;color:#cdd6f4;font-size:14px;flex:1}
.tags{display:flex;flex-wrap:wrap;gap:5px}
.tag{font-size:11px;color:var(--muted);background:var(--elev2);border-radius:5px;padding:1px 7px}
.add{display:flex;gap:6px;align-items:stretch}
.add code{flex:1;background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:7px 9px;font-family:var(--mono);font-size:12.5px;color:var(--text);overflow:auto;white-space:nowrap}
.copy{background:var(--elev2);border:1px solid var(--border);color:var(--text);border-radius:7px;padding:0 10px;font-size:12px;cursor:pointer}
.copy:hover{border-color:var(--accent)}
.copy.done{color:var(--accent);border-color:var(--accent)}
.repo{color:var(--muted);font-size:12px;text-decoration:none;font-family:var(--mono)}
.repo:hover{color:var(--accent)}
.empty{text-align:center;color:var(--muted);padding:40px;display:none}
footer{text-align:center;color:var(--muted);font-size:13px;margin-top:40px}
footer a{color:var(--accent);text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="hero">
    <h1>🍳 ${esc(title)}</h1>
    <p class="sub">A package manager for AI agent skills. Install any of these with one command.</p>
    <code>npx skillet add &lt;name&gt;</code>
  </div>
  <div class="bar">
    <input id="q" type="search" placeholder="Search ${skills.length} skills…" autocomplete="off" autofocus />
    <span class="count" id="count">${skills.length} skills</span>
  </div>
  <div class="grid" id="grid">
${cards}
  </div>
  <div class="empty" id="empty">No skills match your search.</div>
  <footer>
    Want yours here? <a href="${esc(repoUrl)}/blob/main/docs/SPEC.md">Add it with a one-line PR</a>.
    · <a href="${esc(repoUrl)}">${esc(title)} on GitHub</a>
  </footer>
</div>
<script>
const q=document.getElementById('q'),grid=document.getElementById('grid'),empty=document.getElementById('empty'),count=document.getElementById('count');
const cards=[...grid.querySelectorAll('.card')];
function filter(){const t=q.value.trim().toLowerCase();let n=0;for(const c of cards){const m=!t||c.dataset.search.includes(t);c.style.display=m?'':'none';if(m)n++;}empty.style.display=n?'none':'block';count.textContent=n+(n===1?' skill':' skills');}
q.addEventListener('input',filter);
grid.addEventListener('click',async e=>{const b=e.target.closest('.copy');if(!b)return;try{await navigator.clipboard.writeText(b.dataset.cmd);b.textContent='copied';b.classList.add('done');setTimeout(()=>{b.textContent='copy';b.classList.remove('done');},1200);}catch{}});
</script>
</body>
</html>
`;
}
