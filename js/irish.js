import { initKit } from '../kit/kit.js?v=1';

const d = document.documentElement, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
d.classList.add('con-js');
const celu = matchMedia('(max-width: 767px)').matches;
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plata = v => v == null ? null : '$ ' + Number(v).toLocaleString('es-AR');

/* ---------- toast ---------- */
let tt;
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); };

/* ---------- intro ---------- */
const intro = $('.intro');
const abrirHero = () => $('.ha')?.classList.add('listo');
if (d.classList.contains('con-intro') && intro) {
  const dura = celu ? 1450 : 1900;
  const listo = Promise.all([document.fonts ? document.fonts.ready : 0, new Promise(r => setTimeout(r, dura))]);
  Promise.race([listo, new Promise(r => setTimeout(r, 2600))]).then(() => {
    intro.classList.add('fin'); abrirHero();
    setTimeout(() => { d.classList.remove('con-intro'); intro.remove(); }, 520);
  });
} else abrirHero();

/* ---------- entradas ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { threshold: .18 });
$$('.rv').forEach(el => io.observe(el));

/* ---------- navegación ---------- */
const tabs = $('.tabs');
new IntersectionObserver(([e]) => tabs.classList.toggle('ver', !e.isIntersecting), { threshold: .02 }).observe($('#hero'));
const cel = $('.cel-bar'), enVista = new Set();
const ocultarIO = new IntersectionObserver(es => {
  es.forEach(e => e.isIntersecting ? enVista.add(e.target) : enVista.delete(e.target));
  cel.classList.toggle('oculto', enVista.size > 0); d.classList.toggle('sin-pill', enVista.size > 0);
}, { threshold: 0 });
$$('.ha .ctas, #tablero, .pintas__ficha').forEach(e => ocultarIO.observe(e));
const menu = $('#menu'), mb = $('.menu-btn');
const cerrarMenu = () => { if (menu.hidden) return; menu.hidden = true; mb.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; mb.focus(); };
mb.addEventListener('click', () => { menu.hidden = false; mb.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; $('.menu__x').focus(); });
$('.menu__x').addEventListener('click', cerrarMenu);
menu.addEventListener('click', e => { if (e.target.closest('a, .menu__res')) cerrarMenu(); });
addEventListener('keydown', e => { if (e.key === 'Escape') { cerrarMenu(); cerrarPos(); } });

/* ---------- reloj del local (zona Buenos Aires) ---------- */
function ahoraBA() {
  const p = new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const h = +p.find(x => x.type === 'hour').value, m = +p.find(x => x.type === 'minute').value;
  return h * 60 + m;
}
function pintarEstados() {
  const t = ahoraBA();
  const hh = $('#happyEstado');
  if (t >= 17 * 60 && t < 20 * 60) { const f = 20 * 60 - t; hh.textContent = `Ahora · termina en ${f >= 60 ? Math.floor(f / 60) + ' h ' : ''}${f % 60} min`; }
  else if (t < 17 * 60) hh.textContent = 'Hoy arranca a las 17:00 hs';
  else hh.textContent = 'Vuelve mañana a las 17:00 hs';
  $('#estadoLocal').textContent = t >= 12 * 60 ? 'Abierto ahora · cierra a las 00:00 hs' : 'Cerrado · abre a las 12:00 hs';
}
pintarEstados(); setInterval(pintarEstados, 60000);

/* ---------- mapa (Leaflet, se carga cerca de la sección) ---------- */
const mapaIO = new IntersectionObserver(([e]) => {
  if (!e.isIntersecting) return; mapaIO.disconnect();
  const armar = () => {
    if (!window.L) return setTimeout(armar, 200);
    const pos = [-34.3950187, -58.6499542];
    const m = L.map('mapa', { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView(pos, 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(m);
    L.marker(pos, { icon: L.divIcon({ className: '', html: '<div class="pin-irish"><img src="img/isotipo.svg" alt="Irish Town" width="40" height="40"></div>', iconSize: [58, 58], iconAnchor: [29, 29] }), title: 'Irish Town' }).addTo(m);
  };
  armar();
}, { rootMargin: '400px' });
mapaIO.observe($('#mapa'));

/* =================== KIT =================== */
const PAGINAS = [
  { id: 'picar', n: 'Para picar', cats: ['entradas', 'snacks', 'papas'] },
  { id: 'cocina', n: 'Cocina', cats: ['clasicos', 'carnes', 'voladores', 'cerdo', 'pescados', 'milangas'] },
  { id: 'burgers', n: 'Burgers', cats: ['burgers'] },
  { id: 'pastas', n: 'Pastas y ensaladas', cats: ['pastas', 'salsas', 'ensaladas'] },
  { id: 'barra', n: 'Barra', cats: ['cervezas', 'porrones', 'tragos', 'sin-alcohol'] },
  { id: 'cava', n: 'Cava', cats: ['gin', 'whiskys', 'americanos', 'vinos', 'espumantes'] },
];
const COLS2 = new Set(['salsas', 'porrones', 'gin', 'whiskys', 'americanos', 'vinos', 'espumantes', 'sin-alcohol']);

function precioTxt(p, ctx) {
  if (p.variantes?.length) return p.variantes.filter(v => v.precio != null).map(v => `${v.nombre} ${plata(v.precio)}`).join(' · ');
  return ctx.money(p.precio) ?? 'Consultar';
}
const template = (p, ctx) => `
  <div class="it__body"><h4 class="it__n">${esc(p.nombre)}${p.foto ? '<span class="punto" title="Tiene foto"></span>' : ''} ${(p.etiquetas || []).map(ctx.etiquetaHTML).join('')}</h4>
  ${p.descripcion ? `<p class="it__d">${esc(p.descripcion)}</p>` : ''}</div>
  <div class="it__side">${p.foto ? '<button type="button" class="it__ver">Ver foto</button>' : ''}<span class="it__p">${esc(precioTxt(p, ctx))}</span>${ctx.pedible(p) ? `<div data-kit-qty="${esc(p.id)}"></div>` : ''}</div>
  ${p.foto ? `<img class="carta__mini" src="${esc(ctx.asset(p.foto))}" alt="${esc(p.nombre)}" width="240" height="240" loading="lazy">` : ''}`;

let kit = null;

/* ---------- ronda en la barra ---------- */
const pintarRonda = (lineas = kit?.carrito?.lineas || []) => {
  const n = lineas.reduce((a, l) => a + (l.cant || 0), 0);
  $$('[data-ronda-n]').forEach(e => e.textContent = n);
  d.classList.toggle('con-ronda', n > 0);
};
document.addEventListener('kit:carrito', e => pintarRonda(e.detail.lineas));

/* ---------- carta ---------- */
let PRODS = [], CATS = [], actual = null;
const kitCarta = $('#kitCarta');
function paginas() {
  const ids = new Set(CATS.filter(c => PRODS.some(p => p.categoria === c.id)).map(c => c.id));
  const ps = PAGINAS.map(p => ({ ...p, cats: p.cats.filter(c => ids.has(c)) })).filter(p => p.cats.length);
  const usadas = new Set(ps.flatMap(p => p.cats));
  const resto = [...ids].filter(c => !usadas.has(c));
  if (resto.length) ps.push({ id: 'mas', n: 'Más', cats: resto });
  return ps;
}
const secuencia = () => paginas().flatMap(p => p.cats);
const catDe = id => CATS.find(c => c.id === id) || { id, nombre: id };
function irA(cat, { scroll = false } = {}) {
  const seq = secuencia(); if (!seq.length) return;
  if (!seq.includes(cat)) cat = seq[0];
  actual = cat;
  kitCarta.querySelector(`.kit-tab[data-cat="${CSS.escape(cat)}"]`)?.click();
  kitCarta.classList.toggle('cols2', COLS2.has(cat));
  const c = catDe(cat), n = PRODS.filter(p => p.categoria === cat).length;
  $('#cartaTit').textContent = c.nombre;
  $('#cartaBaj').innerHTML = `<span class="cuenta">${n} ${n === 1 ? 'opción' : 'opciones'}</span>${c.bajada ? ' · ' + esc(c.bajada) : ''}`;
  const i = seq.indexOf(cat), ant = seq[i - 1], sig = seq[i + 1];
  $('#cartaAnt').hidden = !ant; $('#cartaSig').hidden = !sig;
  if (ant) $('#cartaAntN').textContent = catDe(ant).nombre;
  if (sig) $('#cartaSigN').textContent = catDe(sig).nombre;
  const pag = paginas().find(p => p.cats.includes(cat));
  $$('#cartaPaginas > button').forEach(b => b.setAttribute('aria-selected', b.dataset.pag === pag?.id));
  $$('#cartaPaginas .sub').forEach(s => s.hidden = s.dataset.pag !== pag?.id);
  $$('#cartaPaginas .sub button, #cartaSecciones button').forEach(b => b.setAttribute('aria-current', b.dataset.cat === cat));
  $('#cartaSecciones').innerHTML = pag.cats.length > 1 ? pag.cats.map(x => `<button type="button" data-cat="${esc(x)}" aria-current="${x === cat}">${esc(catDe(x).nombre)}</button>`).join('') : '';
  const fp = PRODS.find(p => p.categoria === cat && p.foto); if (fp) fotoCarta(fp);
  if (scroll) $('#carta').scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'start' });
}
function pintarIndice() {
  $('#cartaPaginas').innerHTML = paginas().map(p => `<button type="button" role="tab" data-pag="${p.id}" aria-selected="false">${esc(p.n)}</button>
    <div class="sub" data-pag="${p.id}" hidden>${p.cats.length > 1 ? p.cats.map(c => `<button type="button" data-cat="${esc(c)}">${esc(catDe(c).nombre)}</button>`).join('') : ''}</div>`).join('');
}
function fotoCarta(p) {
  const img = $('#cartaFoto'); if (!img || !p?.foto) return;
  const src = kit?.asset ? kit.asset(p.foto) : p.foto;
  if (img.getAttribute('src') !== src) { img.style.opacity = .2; img.onload = () => img.style.opacity = 1; img.src = src; }
  img.alt = p.nombre; $('#cartaFotoN').textContent = p.nombre;
}
document.addEventListener('kit:carta', e => {
  if (e.detail.el !== kitCarta) return;
  PRODS = e.detail.productos; CATS = e.detail.categorias;
  pintarIndice(); irA(actual || secuencia()[0]);
  armarDiana(); armarPintas();
});
$('#cartaPaginas').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.cat) return irA(b.dataset.cat);
  const p = paginas().find(x => x.id === b.dataset.pag); if (p) irA(p.cats[0]);
});
$('#cartaSecciones').addEventListener('click', e => { const b = e.target.closest('button[data-cat]'); if (b) irA(b.dataset.cat); });
$('#cartaAnt').addEventListener('click', () => { const s = secuencia(); irA(s[s.indexOf(actual) - 1], { scroll: true }); });
$('#cartaSig').addEventListener('click', () => { const s = secuencia(); irA(s[s.indexOf(actual) + 1], { scroll: true }); });
let rafF = 0;
kitCarta.addEventListener('pointerover', e => {
  const it = e.target.closest('.kit-item'); if (!it || e.pointerType === 'touch') return;
  cancelAnimationFrame(rafF); rafF = requestAnimationFrame(() => { const p = PRODS.find(x => x.id === it.dataset.id); if (p?.foto) fotoCarta(p); });
});
kitCarta.addEventListener('click', e => {
  const b = e.target.closest('.it__ver'); if (!b) return;
  const it = b.closest('.kit-item'); const on = it.classList.toggle('ver-foto'); b.textContent = on ? 'Ocultar' : 'Ver foto';
});

/* ---------- WOW: la diana ---------- */
const ORDEN = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const DIANA = [
  ['muerte-en-dublin', 'muerte'], ['classic-burger', 'classic'], ['rabas', 'rabas'], ['salmon-crocante', 'salmon'], ['bbq-ribs', 'ribs'],
  ['guiso-de-lentejas', 'lentejas'], ['irish-club-sandwich', 'club'], ['sorrentinos-de-jamon-y-queso', 'sorrentinos'], ['pinta-warsteiner', 'warsteiner'], ['gt-bosque-nativo', 'gintonic'],
];
let ITEMS = [];
function armarDiana() {
  ITEMS = DIANA.map(([id, f]) => { const p = PRODS.find(x => x.id === id); if (!p) return null;
    const precio = p.variantes?.length ? p.variantes[0].precio : p.precio;
    return { id, n: (p.categoria === 'gin' ? 'Gin tonic ' : '') + p.nombre, d: p.descripcion || (p.categoria === 'gin' ? 'De la House of Gin Tonic, con más de 40 gins.' : ''), p: precio, f, pedible: p.disponible !== false && precio != null, variante: p.variantes?.length ? p.variantes[0].id : undefined, sufijo: p.variantes?.length ? ' · ' + p.variantes[0].nombre : '' }; }).filter(Boolean);
}
const svg = $('#dianaSvg'), caja = $('#tablero'), pos = $('#pos'), dardo = $('#dardo');
const R = { bull: 6.4, bullE: 16, tri1: 58, tri2: 64, dob1: 93, dob2: 100 };
const segs = [];
let bullE, bull;
(function dibujar() {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a, p = svg) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  const arco = (r1, r2, a1, a2) => { const p = (r, a) => `${(r * Math.sin(a)).toFixed(3)},${(-r * Math.cos(a)).toFixed(3)}`;
    return `M${p(r1, a1)} L${p(r2, a1)} A${r2},${r2} 0 0 1 ${p(r2, a2)} L${p(r1, a2)} A${r1},${r1} 0 0 0 ${p(r1, a1)} Z`; };
  el('circle', { r: 118, fill: '#141414' }); el('circle', { r: 117, fill: 'none', stroke: '#C9A24A', 'stroke-width': 1.4 });
  ORDEN.forEach((n, i) => {
    const a1 = (i - .5) * Math.PI / 10, a2 = (i + .5) * Math.PI / 10, par = i % 2 === 0;
    const base = par ? '#141414' : '#F3EBDD', aro = par ? '#1F7A4D' : '#E5782F';
    const g = el('g', { class: 'seg' });
    el('path', { d: arco(R.bullE, R.tri1, a1, a2), fill: base }, g); el('path', { d: arco(R.tri1, R.tri2, a1, a2), fill: aro }, g);
    el('path', { d: arco(R.tri2, R.dob1, a1, a2), fill: base }, g); el('path', { d: arco(R.dob1, R.dob2, a1, a2), fill: aro }, g);
    segs.push(g);
    const am = i * Math.PI / 10; el('text', { x: (109 * Math.sin(am)).toFixed(2), y: (-109 * Math.cos(am) + 4.5).toFixed(2), 'text-anchor': 'middle' }).textContent = n;
  });
  for (let i = 0; i < 20; i++) { const a = (i + .5) * Math.PI / 10; el('line', { x1: R.bullE * Math.sin(a), y1: -R.bullE * Math.cos(a), x2: R.dob2 * Math.sin(a), y2: -R.dob2 * Math.cos(a), stroke: '#C9A24A', 'stroke-width': .5 }); }
  [R.tri1, R.tri2, R.dob1, R.dob2].forEach(r => el('circle', { r, fill: 'none', stroke: '#C9A24A', 'stroke-width': .5 }));
  bullE = el('circle', { r: R.bullE, fill: '#1F7A4D', stroke: '#C9A24A', 'stroke-width': .5, class: 'seg' });
  bull = el('circle', { r: R.bull, fill: '#E5782F', stroke: '#C9A24A', 'stroke-width': .5, class: 'seg' });
})();
let tiros = 0, sumados = 0, ocupado = false, item = null;
const cuenta = () => $('#cuenta').textContent = `${tiros} ${tiros === 1 ? 'tiro' : 'tiros'} · ${sumados} ${sumados === 1 ? 'sumado' : 'sumados'}`;
function cerrarPos() { pos.classList.remove('on'); }
function resultado(x, y) {
  const r = Math.hypot(x, y); let a = Math.atan2(x, -y); if (a < 0) a += 2 * Math.PI;
  const i = Math.round(a / (Math.PI / 10)) % 20, n = ORDEN[i];
  const de = k => ITEMS.find(t => t.id === k) || ITEMS[0];
  if (r <= R.bull) return { tipo: '¡Bull!', item: de('muerte-en-dublin'), seg: bull };
  if (r <= R.bullE) return { tipo: 'Bull 25', item: de('pinta-warsteiner'), seg: bullE };
  if (r > R.dob2) return { tipo: 'Afuera', item: null };
  const tipo = r >= R.dob1 ? 'Doble ' + n : (r >= R.tri1 && r <= R.tri2) ? 'Triple ' + n : 'Simple ' + n;
  return { tipo, item: ITEMS[(n - 1) % ITEMS.length], seg: segs[i] };
}
function tirar(px, py) {
  if (ocupado || !ITEMS.length) return; ocupado = true; cerrarPos(); caja.classList.add('jugado');
  const b = caja.getBoundingClientRect(), s = b.width / 240, jit = 7 * s;
  const tx = px + (Math.random() - .5) * jit * 2, ty = py + (Math.random() - .5) * jit * 2;
  const res = resultado((tx - b.left) / s - 120, (ty - b.top) / s - 120);
  const dw = dardo.getBoundingClientRect().width || 36, fx = tx - b.left - dw / 2, fy = ty - b.top;
  const desde = `translate(${b.width / 2 - dw / 2}px, ${b.height + 160}px) rotate(0deg) scale(1.7)`, hasta = `translate(${fx}px, ${fy}px) rotate(-28deg) scale(1)`;
  dardo.style.opacity = 1;
  const an = dardo.animate([{ transform: desde }, { transform: hasta }], { duration: reducido ? 1 : 360, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
  an.onfinish = () => {
    if (!reducido) dardo.animate([{ transform: hasta }, { transform: hasta.replace('-28deg', '-34deg') }, { transform: hasta.replace('-28deg', '-24deg') }, { transform: hasta }], { duration: 300, fill: 'forwards' });
    tiros++; cuenta();
    $$('.tablero__svg .hit').forEach(e => e.classList.remove('hit')); res.seg?.classList.add('hit');
    setTimeout(() => {
      if (!res.item) { toast('Afuera. ¡Tirá otra!'); ocupado = false; return; }
      item = res.item;
      $('#posTiro').textContent = res.tipo;
      $('#posImg').src = `img/d-${item.f}.webp`; $('#posImg').alt = item.n;
      $('#posNom').textContent = item.n; $('#posDesc').textContent = item.d;
      $('#posPrecio').textContent = item.p != null ? plata(item.p) + item.sufijo : 'Consultar';
      $('#posSumar').disabled = !item.pedible;
      pos.classList.add('on'); ocupado = false;
    }, reducido ? 0 : 420);
  };
}
const alAzar = () => { const b = caja.getBoundingClientRect(), a = Math.random() * Math.PI * 2, r = Math.random() * .4 * b.width; tirar(b.left + b.width / 2 + r * Math.sin(a), b.top + b.height / 2 - r * Math.cos(a)); };
caja.addEventListener('click', e => { if (e.target.closest('.pos.on')) return; tirar(e.clientX, e.clientY); });
caja.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.pos')) { e.preventDefault(); alAzar(); } });
$('#alAzar').addEventListener('click', alAzar);
$('#posOtra').addEventListener('click', e => { e.stopPropagation(); cerrarPos(); setTimeout(alAzar, 250); });
$('#posSumar').addEventListener('click', e => {
  e.stopPropagation(); if (!item) return;
  kit.carrito.agregar(item.id, 1, { variante: item.variante, origen: e.currentTarget.getBoundingClientRect() });
  sumados++; cuenta(); cerrarPos();
});

/* ---------- pintas tiradas ---------- */
const COLOR = {
  'pinta-warsteiner': ['#F3EBDD', '#C9A24A', '#F6C766', '#D2902A'], 'pinta-imperial': ['#C9A24A', '#141414', '#F2B54E', '#C27718'],
  'pinta-heineken': ['#1F7A4D', '#F3EBDD', '#F4C35A', '#D0911F'], 'pinta-blue-moon': ['#2E4B7A', '#F3EBDD', '#F0B866', '#D98A2B'],
  'pinta-grolsch': ['#F3EBDD', '#1F7A4D', '#F2BE58', '#CF8E22'], 'pinta-gambrinus': ['#B23A2E', '#F3EBDD', '#C8742A', '#7A3C12'], 'pinta-equum': ['#141414', '#E5782F', '#E39A3A', '#A9581A'],
};
const ESTILO = { stout: ['#3A2418', '#140C08'], amber: ['#C8742A', '#7A3C12'], ipa: ['#E39A3A', '#B36618'], scottish: ['#9A4A1C', '#5A240C'] };
let BIRRAS = [], birra = null, tam = 'pinta', estilo = null;
const vaso = $('.pintas__vaso'), liq = $('.liquido');
function armarPintas() {
  BIRRAS = PRODS.filter(p => p.categoria === 'cervezas' && p.disponible !== false);
  const cont = $('#canillas');
  cont.innerHTML = BIRRAS.map((p, i) => { const c = COLOR[p.id] || ['#1F7A4D', '#F3EBDD'];
    return `<button type="button" class="canilla" role="radio" aria-checked="false" data-id="${esc(p.id)}" style="--c1:${c[0]};--c2:${c[1]}"><span class="canilla__mango"></span><span class="canilla__pico"></span><span class="canilla__n">${esc(p.nombre)}</span></button>`; }).join('');
  elegir((BIRRAS.find(b => b.id === birra?.id) || BIRRAS[0])?.id, false);
}
function nivel() {
  const lleno = tam === 'media' ? .5 : .9;
  liq.style.transform = `translateY(${(700 * (1 - lleno)).toFixed(0)}px)`;
}
function colorBirra() {
  const c = (estilo && ESTILO[estilo]) || (COLOR[birra?.id] || []).slice(2);
  if (c?.length) { $('#pintas').style.setProperty('--birra-a', c[0]); $('#pintas').style.setProperty('--birra-b', c[1]); }
}
function servir() {
  liq.style.transition = 'none'; liq.style.transform = 'translateY(700px)'; void liq.getBoundingClientRect(); liq.style.transition = '';
  vaso.classList.add('sirve'); setTimeout(() => vaso.classList.remove('sirve'), reducido ? 0 : 900);
  requestAnimationFrame(nivel);
}
function elegir(id, animar = true) {
  const p = BIRRAS.find(b => b.id === id); if (!p) return;
  const cambio = birra?.id !== id; birra = p;
  $$('.canilla').forEach((b, i) => { const on = b.dataset.id === id; b.setAttribute('aria-checked', on); if (on) $('#pNum').textContent = `Canilla ${i + 1}`; });
  $('#pNom').textContent = p.nombre; $('#pDesc').textContent = p.descripcion || 'Tirada y bien fría.';
  const v = id => p.variantes?.find(x => x.id === id)?.precio;
  $('#pPinta').textContent = plata(v('pinta') ?? p.precio) || ''; $('#pMedia').textContent = plata(v('media')) || '';
  const op = p.opciones?.[0], box = $('#pEstilo');
  if (op) { if (cambio) estilo = op.valores[0].id; box.hidden = false;
    box.innerHTML = op.valores.map(x => `<button type="button" role="radio" aria-checked="${x.id === estilo}" data-estilo="${esc(x.id)}">${esc(x.nombre)}</button>`).join(''); }
  else { estilo = null; box.hidden = true; box.innerHTML = ''; }
  colorBirra();
  if (animar) servir(); else nivel();
}
$('#canillas').addEventListener('click', e => { const b = e.target.closest('.canilla'); if (b) elegir(b.dataset.id); });
$('#pEstilo').addEventListener('click', e => { const b = e.target.closest('[data-estilo]'); if (!b) return; estilo = b.dataset.estilo; $$('#pEstilo button').forEach(x => x.setAttribute('aria-checked', x === b)); colorBirra(); servir(); });
$$('.pintas__tam button').forEach(b => b.addEventListener('click', () => { tam = b.dataset.tam; $$('.pintas__tam button').forEach(x => x.setAttribute('aria-checked', x === b)); nivel(); }));
$('#pSumar').addEventListener('click', e => {
  if (!birra) return;
  const o = { variante: tam, origen: e.currentTarget.getBoundingClientRect() };
  if (birra.opciones?.[0] && estilo) o.opc = { [birra.opciones[0].id]: estilo };
  kit.carrito.agregar(birra.id, 1, o);
});

/* ---------- agenda de música ---------- */
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
async function pintarAgenda(lista) {
  const ul = $('#agenda'), fija = ul.querySelector('.agenda__fija');
  ul.querySelectorAll('.agenda__ev').forEach(x => x.remove());
  for (const ev of (lista || []).slice(0, 4)) {
    const f = new Date(ev.fecha + 'T12:00:00'), dd = `${f.getDate()}/${f.getMonth() + 1}`;
    let quedan = '';
    if (ev.reserva && kit?.reservas?.turnos) { try { const ts = await kit.reservas.turnos(ev.fecha, 1); const t = ts.find(x => x.hora === ev.hora) || ts[0]; if (t && t.libres != null) quedan = t.libres > 0 ? `Quedan ${t.libres} lugares` : 'Completo'; } catch (_) {} }
    const li = document.createElement('li'); li.className = 'agenda__ev';
    li.innerHTML = `<span class="agenda__dia"><b>${DIAS[f.getDay()]} ${dd}</b><small>${esc(ev.hora)} hs</small></span>
      <span class="agenda__q"><b>${esc(ev.nombre)}</b>${ev.descripcion ? `<small>${esc(ev.descripcion)}</small>` : ''}${quedan ? `<small class="agenda__cupo">${quedan}</small>` : ''}</span>
      ${ev.reserva ? `<button type="button" class="btn-pinta" data-ev="${esc(ev.id)}">Reservá tu lugar</button>` : ''}`;
    ul.insertBefore(li, fija);
  }
}
document.addEventListener('kit:eventos', e => pintarAgenda(e.detail.proximos));
$('#agenda').addEventListener('click', e => { const b = e.target.closest('[data-ev]'); if (b) kit.reservas.abrir({ evento: b.dataset.ev }); });

/* ---------- arranque del kit (los listeners ya están puestos) ---------- */
kit = await initKit({
  config: 'cliente.json',
  carta: { template, itemClass: 'it' },
  carrito: { label: 'Tu ronda', icono: '<svg viewBox="0 0 24 24"><path d="M6 4h12l-1.6 15.2a2 2 0 0 1-2 1.8H9.6a2 2 0 0 1-2-1.8Z"/><path d="M6.6 9.5h10.8"/></svg>' },
  badge: true,
  imagenes: { lqip: 'img/lqip.json' },
});
window.kit = kit;
kit.carrito?.listo?.then(() => pintarRonda());
if (kit.eventos) pintarAgenda(kit.eventos.proximos());
