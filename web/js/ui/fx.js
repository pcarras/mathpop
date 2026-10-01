import { icon } from './icons.js';
import { sfx } from './sfx.js';
import { nivelDe, NIVEIS } from '../rules.js';
import { estado } from '../store.js';
import { verificarConquistas } from '../game/achievements.js';
import { desbloqueiosDoNivel } from './avatar.js';
const reduz = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let confetti = null;
async function conf() { if (!confetti) { try { confetti = (await import('../../vendor/confetti.js')).default; } catch { confetti = () => {}; } } return confetti; }
export async function festa(forca = 1, origem = { x: 0.5, y: 0.6 }) {
  if (reduz()) return; const c = await conf();
  const cores = ['#FFC23D', '#27D8E0', '#FF3B4E', '#9B7BFF', '#3DDC97'];
  c({ particleCount: Math.round(90 * forca), spread: 75, startVelocity: 45, origin: origem, colors: cores, ticks: 180, disableForReducedMotion: true });
  if (forca > 1) { setTimeout(() => c({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: cores }), 180); setTimeout(() => c({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: cores }), 280); }
}
export function contar(el, de, para, ms = 900) {
  if (!el) return; if (reduz() || de === para) { el.textContent = para; return; }
  const t0 = performance.now(); const passo = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(de + (para - de) * e); if (k < 1) requestAnimationFrame(passo); }; requestAnimationFrame(passo);
}
// Circulo vermelho do elemento redutor, desenhado a mao em torno de um elemento
export function tintaEm(alvo, pai = alvo.offsetParent || alvo.parentElement) {
  if (!alvo || !pai) return; const a = alvo.getBoundingClientRect(), p = pai.getBoundingClientRect();
  const x = a.left - p.left - 10, y = a.top - p.top - 8, w = a.width + 20, h = a.height + 16, cx = x + w / 2, cy = y + h / 2, rx = w / 2, ry = h / 2;
  const j = (n) => (Math.random() - 0.5) * n;
  const d = `M${cx - rx * 0.2},${cy - ry + j(3)} C${cx + rx * 0.9},${cy - ry * 1.15} ${cx + rx * 1.12},${cy + ry * 0.6} ${cx + rx * 0.1},${cy + ry * 1.05 + j(3)} C${cx - rx * 1.0},${cy + ry * 1.2} ${cx - rx * 1.15},${cy - ry * 0.7} ${cx + rx * 0.35},${cy - ry * 0.98 + j(3)} C${cx + rx * 0.7},${cy - ry * 0.92} ${cx + rx * 0.9},${cy - ry * 0.7} ${cx + rx * 0.98},${cy - ry * 0.3}`;
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'tinta'); s.style.cssText = `left:0;top:0;width:${p.width}px;height:${p.height}px`;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', d); path.setAttribute('pathLength', '1'); s.appendChild(path);
  if (getComputedStyle(pai).position === 'static') pai.style.position = 'relative'; pai.appendChild(s); return s;
}
export function toast(html, ms = 3200) {
  let area = document.querySelector('.toast-area'); if (!area) { area = document.createElement('div'); area.className = 'toast-area'; document.body.appendChild(area); }
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; area.appendChild(t); setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = 0; setTimeout(() => t.remove(), 320); }, ms);
}
export function overlay(html) {
  return new Promise((res) => {
    const o = document.createElement('div'); o.className = 'overlay'; o.innerHTML = `<div class="cartao">${html}<div style="margin-top:22px"><button class="btn ouro grande" data-ok>Continuar</button></div></div>`;
    document.body.appendChild(o); o.querySelector('[data-ok]').focus();
    o.querySelector('[data-ok]').addEventListener('click', () => { o.remove(); res(); });
  });
}
// depois de dar XP: nivel novo, desbloqueios e conquistas
export async function celebrar(antes) {
  const s = estado(); const a = nivelDe(antes.xp), b = nivelDe(s.xp);
  const novas = verificarConquistas();
  for (const c of novas) { setTimeout(() => { sfx.xp(); toast(`<span style="width:34px">${icon(c.ico)}</span><div><b>Conquista desbloqueada</b><br><span class="nota">${c.nome}</span></div>`); }, 500); }
  if (b.indice > a.indice) {
    sfx.nivel(); festa(2);
    const des = desbloqueiosDoNivel(b.indice);
    await overlay(`<div class="giz">Subiste de nível!</div><div class="titulo-lv">${b.titulo}</div>
      <p class="nota" style="margin:12px 0">Nível ${b.indice + 1} de ${NIVEIS.length}</p>
      ${des.length ? `<div class="painel" style="text-align:left"><b>Desbloqueaste</b><ul style="margin:8px 0 0;padding-left:18px">${des.slice(0, 6).map((d) => `<li>${d}</li>`).join('')}${des.length > 6 ? `<li>e mais ${des.length - 6} itens no editor de avatar</li>` : ''}</ul></div>` : ''}`);
  }
}
