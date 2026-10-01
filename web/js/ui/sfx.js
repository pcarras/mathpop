// Efeitos sonoros sintetizados (WebAudio), sem ficheiros. Desligaveis no perfil.
import { estado, gravar } from '../store.js';
let ctx = null;
function ac() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } } if (ctx.state === 'suspended') ctx.resume(); return ctx; }
function nota(f, t0, dur, { tipo = 'triangle', vol = 0.12, fim = null } = {}) {
  const c = ac(); if (!c) return; const o = c.createOscillator(), g = c.createGain(); const t = c.currentTime + t0;
  o.type = tipo; o.frequency.setValueAtTime(f, t); if (fim) o.frequency.exponentialRampToValueAtTime(fim, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
}
const ligado = () => estado().som !== false;
export const sfx = {
  clique() { if (ligado()) nota(620, 0, 0.05, { tipo: 'square', vol: 0.04 }); },
  certo() { if (!ligado()) return; nota(660, 0, 0.12); nota(880, 0.09, 0.12); nota(1320, 0.18, 0.22, { vol: 0.14 }); },
  erro() { if (!ligado()) return; nota(220, 0, 0.22, { tipo: 'sawtooth', vol: 0.09, fim: 140 }); },
  xp() { if (ligado()) { nota(1040, 0, 0.06, { tipo: 'square', vol: 0.05 }); nota(1560, 0.05, 0.08, { tipo: 'square', vol: 0.05 }); } },
  nivel() { if (!ligado()) return; [523, 659, 784, 1047, 1319].forEach((f, i) => nota(f, i * 0.11, 0.3, { vol: 0.13 })); },
  bau() { if (!ligado()) return; [392, 523, 659, 784].forEach((f, i) => nota(f, i * 0.07, 0.2, { vol: 0.12 })); },
  vibrar(ms = 18) { try { if (ligado() && navigator.vibrate) navigator.vibrate(ms); } catch { /* ok */ } },
};
export function alternarSom() { const s = estado(); s.som = s.som === false; gravar(); return s.som; }
