/* ===== 3D VIEWER INITIALIZATION ===== */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import {GLTFLoader} from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

let renderer, scene, camera, controls, curModel;
const cvs = document.getElementById('model-canvas'), 
      viewer = document.getElementById('model-viewer'), 
      vEmpty = document.getElementById('v-empty'), 
      vStatus = document.getElementById('v-status');

function init3D() {
  renderer = new THREE.WebGLRenderer({canvas: cvs, antialias: true, alpha: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
  camera.position.set(0, 1.5, 4);
  
  controls = new OrbitControls(camera, cvs);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 0.4;
  controls.maxDistance = 20;
  
  scene.add(new THREE.AmbientLight(0xffffff, .5));
  const d = new THREE.DirectionalLight(0xffffff, 1.2);
  d.position.set(3, 5, 3);
  scene.add(d);
  
  const bl = new THREE.PointLight(0x00aaff, 2.5, 12);
  bl.position.set(-3, 1, -3);
  scene.add(bl);
  
  resize();
  window.addEventListener('resize', resize);
  
  (function loop() {
    requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
  })();
}

function resize() {
  const w = viewer.clientWidth, h = viewer.clientHeight;
  if (renderer && w > 0 && h > 0) {
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

window._loadModel = function(url, name) {
  vEmpty.style.display = 'none';
  vStatus.textContent = '> LOADING_MODEL...';
  
  if (curModel) {
    scene.remove(curModel);
    curModel = null;
  }
  
  new GLTFLoader().load(url, gltf => {
    curModel = gltf.scene;
    scene.add(curModel);
    
    const box = new THREE.Box3().setFromObject(curModel);
    const c = box.getCenter(new THREE.Vector3());
    const s = box.getSize(new THREE.Vector3());
    const sc = 2 / Math.max(s.x, s.y, s.z);
    
    curModel.scale.setScalar(sc);
    curModel.position.sub(c.multiplyScalar(sc));
    
    camera.position.set(0, 1, 3);
    controls.target.set(0, 0, 0);
    controls.update();
    
    vStatus.textContent = '> MODEL: ' + name.toUpperCase().replace(/\s/g, '_');
  }, p => {
    if (p.total > 0) vStatus.textContent = '> LOADING... ' + Math.round(p.loaded / p.total * 100) + '%';
  }, () => {
    vStatus.textContent = '> ERROR: LOAD_FAILED';
    vEmpty.style.display = 'flex';
  });
};

init3D();

/* ===== MATRIX EFFECT ===== */
(function() {
  const c = document.getElementById('matrix-canvas');
  const x = c.getContext('2d');
  const ch = '01アイウエカキ<>{}[];=+-*/!?∑∇∂∫λΩπ█▓░▒'.split('');
  let cols, drops;
  
  function rs() {
    c.width = innerWidth;
    c.height = innerHeight;
    cols = Math.floor(innerWidth / 16);
    drops = Array(cols).fill(1);
  }
  
  function draw() {
    x.fillStyle = 'rgba(3,5,8,.07)';
    x.fillRect(0, 0, c.width, c.height);
    
    drops.forEach((d, i) => {
      const bright = Math.random() > .88;
      x.fillStyle = bright ? 'rgba(180,235,255,0.92)' : 'rgba(0,170,255,' + (0.15 + Math.random() * .4) + ')';
      x.font = (bright ? 'bold ' : '') + '13px Share Tech Mono';
      x.fillText(ch[Math.floor(Math.random() * ch.length)], i * 16, d * 16);
      
      if (d * 16 > c.height && Math.random() > .975) drops[i] = 0;
      drops[i]++;
    });
  }
  
  rs();
  addEventListener('resize', rs);
  setInterval(draw, 48);
})();

/* ===== TYPING EFFECT ===== */
(function() {
  const el = document.getElementById('tag-text');
  const txt = 'Reality is just another project.';
  let i = 0;
  
  function t() {
    if (i < txt.length) {
      el.textContent += txt[i++];
      setTimeout(t, 52);
    }
  }
  
  setTimeout(t, 1100);
})();

/* ===== SKILL BARS ANIMATION ===== */
const sio = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.sb-fill').forEach(b => b.style.width = b.dataset.w + '%');
      sio.unobserve(e.target);
    }
  });
}, {threshold: .3});

document.querySelectorAll('[data-anim]').forEach(el => sio.observe(el));

/* ===== DATA ===== */
const API = {
  async get(path) {
    const r = await fetch(path);
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': getAdmPw() },
      body: JSON.stringify(body)
    });
    return r.json();
  },
  async del(path) {
    const r = await fetch(path, {
      method: 'DELETE',
      headers: { 'x-admin-password': getAdmPw() }
    });
    return r.json();
  }
};

const DEF_PW = 'GeniusRealms1';
const getAdmPw = () => sessionStorage.getItem('gr_adm_pw') || '';

const DEF_D = {
  org: 'GENIUS_REALMS',
  tag: 'Reality is just another project.',
  h1: 'OMOJASOLA',
  h2: 'SOLOMON',
  fn: 'Omojasola Solomon Oluwadamilare',
  email: 'geniusomojasola@gmail.com',
  phone: '2348119809701',
  yt: 'https://www.youtube.com/@geniusrealms'
};

/* ===== LOAD ALL DATA FROM SERVER ===== */
async function loadAll() {
  try {
    const data = await API.get('/api/data');
    renderVids('gamedev', data.gamedev || []);
    renderVids('animation', data.animation || []);
    renderVids('video', data.video || []);
    renderModels(data.threed || []);
    renderReviews(data.reviews || []);
    applyDetails(data.details || {});
  } catch(e) {
    console.error('Failed to load data:', e);
  }
}

/* ===== APPLY DETAILS ===== */
function applyDetails(d) {
  d = Object.assign({}, DEF_D, d);
  document.getElementById('nav-logo').innerHTML = d.org.replace('_', '<span>_</span>');
  document.getElementById('hero-line1').textContent = d.h1;
  document.getElementById('hero-line2').textContent = d.h2;
  document.getElementById('about-tagline-p').textContent = d.tag;
  document.getElementById('footer-org').textContent = d.org;
  document.getElementById('footer-tag').textContent = d.tag;
  document.getElementById('footer-name').textContent = d.fn;
  document.getElementById('footer-year').textContent = new Date().getFullYear();
  document.getElementById('c-email').textContent = d.email;
  document.getElementById('c-email').href = 'mailto:' + d.email;
  document.getElementById('c-phone').href = 'https://wa.me/' + d.phone;
  document.getElementById('c-yt').textContent = d.yt.replace('https://', '');
  document.getElementById('c-yt').href = d.yt;
  document.getElementById('dt-org').value = d.org;
  document.getElementById('dt-tag').value = d.tag;
  document.getElementById('dt-h1').value = d.h1;
  document.getElementById('dt-h2').value = d.h2;
  document.getElementById('dt-fn').value = d.fn;
  document.getElementById('dt-email').value = d.email;
  document.getElementById('dt-phone').value = d.phone;
  document.getElementById('dt-yt').value = d.yt;
}

window.saveDetails = async () => {
  const body = {
    org: document.getElementById('dt-org').value || DEF_D.org,
    tag: document.getElementById('dt-tag').value || DEF_D.tag,
    h1: (document.getElementById('dt-h1').value || DEF_D.h1).toUpperCase(),
    h2: (document.getElementById('dt-h2').value || DEF_D.h2).toUpperCase(),
    fn: document.getElementById('dt-fn').value || DEF_D.fn,
    email: document.getElementById('dt-email').value || DEF_D.email,
    phone: (document.getElementById('dt-phone').value || DEF_D.phone).replace(/\D/g, ''),
    yt: document.getElementById('dt-yt').value || DEF_D.yt,
  };
  const res = await API.post('/api/details', body);
  if (res._id) {
    applyDetails(res);
    const m = document.getElementById('dt-msg');
    m.style.display = 'block';
    m.style.color = 'var(--blue)';
    m.textContent = '> DETAILS_SAVED ✓';
    setTimeout(() => m.style.display = 'none', 2500);
  }
};

/* ===== URL PARSER ===== */
function parseUrl(url) {
  url = url.trim();
  
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_\-]{11})/);
  if (yt) return { kind: 'yt', embed: `https://www.youtube.com/embed/${yt[1]}?autoplay=1`, thumb: `https://img.youtube.com/vi/${yt[1]}/mqdefault.jpg` };
  
  const yte = url.match(/youtube\.com\/embed\/([A-Za-z0-9_\-]{11})/);
  if (yte) return { kind: 'yt', embed: url + (url.includes('?') ? '&' : '?') + 'autoplay=1', thumb: `https://img.youtube.com/vi/${yte[1]}/mqdefault.jpg` };
  
  const gd = url.match(/drive\.google\.com\/file\/d\/([^\/\?]+)/);
  if (gd) return { kind: 'iframe', embed: `https://drive.google.com/file/d/${gd[1]}/preview`, thumb: null };
  
  return { kind: 'direct', embed: url, thumb: null };
}

/* ===== RENDER VIDEOS ===== */
const ICONS = { gamedev: '🎮', animation: '🎞️', video: '🎬' };

function renderVids(sec, items) {
  const gid = { gamedev: 'gd-grid', animation: 'an-grid', video: 've-grid' }[sec];
  const eid = { gamedev: 'gd-empty', animation: 'an-empty', video: 've-empty' }[sec];
  const grid = document.getElementById(gid);
  
  grid.querySelectorAll('.vcard').forEach(c => c.remove());
  document.getElementById(eid).style.display = items.length ? 'none' : 'block';
  
  items.forEach(item => {
    const p = parseUrl(item.url);
    const card = document.createElement('div');
    card.className = 'vcard';
    card.innerHTML = `
      <div class="vthumb">
        ${p.thumb ? `<img src="${p.thumb}" alt="">` : `<div class="vthumb-ph"><span>${ICONS[sec]}</span></div>`}
        <div class="voverlay"><div class="play-ring">▶</div></div>
      </div>
      <div class="vinfo"><div class="vtitle">${item.title}</div>${item.desc ? `<div class="vdesc">${item.desc}</div>` : ''}</div>
      <div class="adel-wrap"><button class="adel-btn" onclick="delItem('video','${item._id}','${sec}');event.stopPropagation()">✕ DEL</button></div>`;
    
    card.addEventListener('click', () => openVid(item.title, item.desc, p.embed, p.kind));
    grid.insertBefore(card, grid.querySelector('.adm-add'));
  });
}

/* ===== RENDER 3D ===== */
function renderModels(items) {
  const list = document.getElementById('model-list');
  list.querySelectorAll('.mitem').forEach(m => m.remove());
  document.getElementById('model-empty').style.display = items.length ? 'none' : 'block';
  
  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'mitem';
    el.innerHTML = `
      <div class="mitem-icon">🧊</div>
      <div class="mitem-info"><div class="mitem-title">${item.title}</div><div class="mitem-desc">${item.desc || '.glb model'}</div></div>
      <button class="adel-btn" onclick="delItem('model','${item._id}');event.stopPropagation()">✕</button>`;
    
    el.addEventListener('click', () => {
      document.querySelectorAll('.mitem').forEach(m => m.classList.remove('act'));
      el.classList.add('act');
      window._loadModel && window._loadModel(item.url, item.title);
    });
    
    list.appendChild(el);
  });
}

/* ===== RENDER REVIEWS ===== */
function renderReviews(items) {
  const grid = document.getElementById('rv-grid');
  grid.querySelectorAll('.rcard').forEach(c => c.remove());
  document.getElementById('rv-empty').style.display = items.length ? 'none' : 'block';
  
  items.forEach(item => {
    const s = item.stars || 5;
    const card = document.createElement('div');
    card.className = 'rcard';
    card.innerHTML = `
      <div class="rcard-stars">${'★'.repeat(s)}${'☆'.repeat(5 - s)}</div>
      <div class="rcard-quote">"</div>
      <div class="rcard-text">${item.text}</div>
      <div class="rcard-author">${item.name}</div>
      ${item.role ? `<div class="rcard-role">${item.role}</div>` : ''}
      <div class="adel-wrap"><button class="adel-btn" onclick="delItem('review','${item._id}')">✕ DEL</button></div>`;
    
    grid.insertBefore(card, document.getElementById('rv-addbtn'));
  });
}

/* ===== VIDEO MODAL ===== */
function openVid(title, desc, embed, kind) {
  document.getElementById('mod-title').textContent = title.toUpperCase();
  document.getElementById('mod-desc').textContent = desc || '';
  document.getElementById('mod-embed').innerHTML = kind === 'direct'
    ? `<video controls autoplay style="width:100%;height:100%"><source src="${embed}"></video>`
    : `<iframe src="${embed}" allowfullscreen allow="autoplay;encrypted-media"></iframe>`;
  document.getElementById('vid-modal').classList.add('open');
}

window.closeVid = () => {
  document.getElementById('vid-modal').classList.remove('open');
  document.getElementById('mod-embed').innerHTML = '';
};

document.getElementById('vid-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('vid-modal')) window.closeVid();
});

/* ===== HIRE ME ===== */
window.hireSend = ch => {
  const d = DEF_D;
  const name = document.getElementById('hf-name').value.trim() || '(not provided)';
  const svc = document.getElementById('hf-service').value || '(not specified)';
  const budget = document.getElementById('hf-budget').value.trim() || 'Not mentioned';
  const desc = document.getElementById('hf-desc').value.trim() || '(no description)';
  const msg = `Hi Genius! I found you through your portfolio.\n\nName: ${name}\nService: ${svc}\nBudget: ${budget}\n\nProject:\n${desc}`;
  
  if (ch === 'wa') window.open('https://wa.me/' + d.phone + '?text=' + encodeURIComponent(msg), '_blank');
  else if (ch === 'em') window.open('mailto:' + d.email + '?subject=' + encodeURIComponent('Project Inquiry — ' + svc) + '&body=' + encodeURIComponent(msg), '_blank');
  else window.open('https://wa.me/' + d.phone, '_blank');
};

/* ===== AUTH ===== */
let isAdm = false;

window.openAuth = () => {
  if (isAdm) { toggleAdmin(); return; }
  document.getElementById('pw-modal').classList.add('open');
  setTimeout(() => document.getElementById('pw-in').focus(), 50);
};

window.closePw = () => {
  document.getElementById('pw-modal').classList.remove('open');
  document.getElementById('pw-in').value = '';
  document.getElementById('pw-err').style.display = 'none';
};

window.authCheck = async () => {
  const pw = document.getElementById('pw-in').value;
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    
    if (res.ok) {
      sessionStorage.setItem('gr_adm_pw', pw);
      isAdm = true;
      closePw();
      document.body.classList.add('adm');
      document.getElementById('admin-btn').classList.add('on');
      document.getElementById('admin-panel').classList.add('open');
      loadAll();
    } else {
      document.getElementById('pw-err').style.display = 'block';
      document.getElementById('pw-in').value = '';
    }
  } catch(e) {
    document.getElementById('pw-err').style.display = 'block';
  }
};

function toggleAdmin() {
  document.getElementById('admin-panel').classList.toggle('open');
}

window.closeAdmin = () => {
  document.getElementById('admin-panel').classList.remove('open');
  document.body.classList.remove('adm');
  isAdm = false;
  document.getElementById('admin-btn').classList.remove('on');
};

window.openAdminTo = tab => {
  if (!isAdm) { window.openAuth(); return; }
  document.getElementById('admin-panel').classList.add('open');
  apTab(tab);
};

/* ===== ADMIN TABS ===== */
window.apTab = tab => {
  const tabs = ['gamedev', 'threed', 'animation', 'video', 'reviews', 'details', 'data'];
  document.querySelectorAll('.ap-tab').forEach((t, i) => t.classList.toggle('on', tabs[i] === tab));
  document.querySelectorAll('.ap-sec').forEach(s => s.classList.remove('on'));
  document.getElementById('ap-' + tab).classList.add('on');
  if (tab === 'details') loadAll();
};

/* ===== ADD ITEMS ===== */
window.addVid = async sec => {
  const p = { gamedev: 'gd', animation: 'an', video: 've' }[sec];
  const t = document.getElementById(p + '-t').value.trim();
  const d = document.getElementById(p + '-d').value.trim();
  const u = document.getElementById(p + '-u').value.trim();
  
  if (!t || !u) { alert('Title and URL are required.'); return; }
  
  const res = await API.post('/api/videos', { section: sec, title: t, desc: d, url: u });
  if (res._id) {
    document.getElementById(p + '-t').value = '';
    document.getElementById(p + '-d').value = '';
    document.getElementById(p + '-u').value = '';
    loadAll();
  }
};

window.addModel = async () => {
  const t = document.getElementById('td-t').value.trim();
  const d = document.getElementById('td-d').value.trim();
  const u = document.getElementById('td-u').value.trim();
  
  if (!t || !u) { alert('Name and URL are required.'); return; }
  
  const res = await API.post('/api/models', { title: t, desc: d, url: u });
  if (res._id) {
    document.getElementById('td-t').value = '';
    document.getElementById('td-d').value = '';
    document.getElementById('td-u').value = '';
    loadAll();
  }
};

window.addReview = async () => {
  const name = document.getElementById('rv-name').value.trim();
  const role = document.getElementById('rv-role').value.trim();
  const text = document.getElementById('rv-text').value.trim();
  
  if (!name || !text) { alert('Name and review text are required.'); return; }
  
  const res = await API.post('/api/reviews', { name, role, text, stars: curStar });
  if (res._id) {
    document.getElementById('rv-name').value = '';
    document.getElementById('rv-role').value = '';
    document.getElementById('rv-text').value = '';
    setStar(5);
    loadAll();
  }
};

window.delItem = async (type, id, sec) => {
  if (!confirm('Delete this item?')) return;
  if (type === 'video') await API.del('/api/videos/' + id);
  else if (type === 'model') await API.del('/api/models/' + id);
  else if (type === 'review') await API.del('/api/reviews/' + id);
  loadAll();
};

/* ===== CHANGE PASSWORD ===== */
window.changePw = () => {
  const np = document.getElementById('np-in').value;
  const cp = document.getElementById('cp-in').value;
  const msg = document.getElementById('pw-chg-msg');
  msg.style.display = 'block';
  
  if (!np) { msg.textContent = 'ERROR: password cannot be empty'; msg.style.color = '#ff4466'; return; }
  if (np !== cp) { msg.textContent = 'ERROR: passwords do not match'; msg.style.color = '#ff4466'; return; }
  
  msg.textContent = '> To change password, update ADMIN_PASSWORD in your .env file and redeploy.';
  msg.style.color = 'var(--blue)';
};

/* ===== STARS ===== */
let curStar = 5;
window.setStar = v => {
  curStar = v;
  document.querySelectorAll('.star-btn').forEach(b => b.classList.toggle('on', parseInt(b.dataset.v) <= v));
};
setStar(5);

/* ===== ESC KEY ===== */
addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    window.closeVid();
    window.closePw();
  }
});

/* ===== MOBILE NAV ===== */
window.toggleMobileNav = () => {
  document.getElementById('mobile-nav').classList.toggle('open');
  document.getElementById('ham-btn').classList.toggle('open');
};

window.closeMobileNav = () => {
  document.getElementById('mobile-nav').classList.remove('open');
  document.getElementById('ham-btn').classList.remove('open');
};

/* ===== INITIALIZE ===== */
loadAll();
