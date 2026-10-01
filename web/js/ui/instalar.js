// Instalar a app no ecra principal (PWA): ecra inteiro, sem barra do navegador, abre mais depressa.
// Android/Chrome: botao que abre o pedido do sistema. iPhone/iPad: o Safari nao tem pedido, so as instrucoes.
const KEY = 'mat1.pwa';
let evento = null;
const ouvintes = new Set();
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); evento = e; ouvintes.forEach((f) => f()); });
addEventListener('appinstalled', () => { evento = null; ouvintes.forEach((f) => f()); });
export const aoMudar = (f) => { ouvintes.add(f); return () => ouvintes.delete(f); };

const ua = navigator.userAgent || '';
const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const android = /Android/i.test(ua);
export const instalada = () => { try { return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: minimal-ui)').matches || navigator.standalone === true; } catch { return false; } };
// navegadores dentro de outras apps (Facebook, Instagram, WhatsApp...) nao permitem instalar
const embutido = () => (ios ? !/Safari\//.test(ua) : /; wv\)|FBAN|FBAV|Instagram|Line\/|Snapchat|Telegram|MicroMessenger|GSA\//.test(ua));
export const plataforma = () => (ios ? 'ios' : android ? 'android' : 'outra');
export const ehTelemovel = () => ios || android;
function ler() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } }
function gravar(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch { /* sem armazenamento */ } }
export function dispensar() { const o = ler(); gravar({ n: (o.n || 0) + 1, t: Date.now() }); }
// o cartao da pagina inicial: so aparece se ainda nao esta instalada, num telemovel, e nao foi dispensado ha pouco
export function deveSugerir() {
  if (instalada() || !ehTelemovel()) return false;
  const o = ler(); if ((o.n || 0) >= 3) return false;
  return !o.t || Date.now() - o.t > 2 * 86400000;
}
const ICO_PARTILHA = '<svg class="ico-p" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICO_MENU = '<svg class="ico-p" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/></svg>';

// devolve o conteudo (HTML) do pedido, conforme o aparelho
export function conteudo({ comDispensar = true } = {}) {
  const base = '<b class="inst-t">Instala a app no telemóvel</b><p class="nota" style="margin:2px 0 8px">Abre em ecrã inteiro, sem a barra do navegador, com o teu ícone no ecrã principal.</p>';
  if (instalada()) return '<b class="inst-t">App instalada</b><p class="nota" style="margin:2px 0 0">Estás a usar a app em ecrã inteiro.</p>';
  if (embutido()) return `${base}<p class="inst-p">Este link foi aberto dentro de outra aplicação. Abre-o primeiro no <b>${ios ? 'Safari' : 'Chrome'}</b> (menu ${ICO_MENU} ou «Abrir no navegador») e depois instala.</p>${comDispensar ? '<div class="inst-acoes"><button class="btn fantasma peq" data-inst="nao">Agora não</button></div>' : ''}`;
  if (ios) return `${base}<ol class="inst-l"><li>Toca em <b>Partilhar</b> ${ICO_PARTILHA} na barra do Safari.</li><li>Escolhe <b>Adicionar ao ecrã principal</b>.</li><li>Toca em <b>Adicionar</b>.</li></ol>${comDispensar ? '<div class="inst-acoes"><button class="btn fantasma peq" data-inst="nao">Já percebi</button></div>' : ''}`;
  if (evento) return `${base}<div class="inst-acoes"><button class="btn peq" data-inst="sim">Instalar</button>${comDispensar ? '<button class="btn fantasma peq" data-inst="nao">Agora não</button>' : ''}</div>`;
  return `${base}<ol class="inst-l"><li>Abre o menu do navegador ${ICO_MENU}.</li><li>Toca em <b>Instalar aplicação</b> ou <b>Adicionar ao ecrã principal</b>.</li></ol>${comDispensar ? '<div class="inst-acoes"><button class="btn fantasma peq" data-inst="nao">Agora não</button></div>' : ''}`;
}
// liga os botoes dentro de "raiz"; aoFim() redesenha
export function ligar(raiz, aoFim) {
  raiz.querySelectorAll('[data-inst]').forEach((b) => b.addEventListener('click', async () => {
    if (b.dataset.inst === 'nao') { dispensar(); aoFim(); return; }
    if (!evento) return; evento.prompt(); try { const r = await evento.userChoice; if (r && r.outcome === 'accepted') gravar({ n: 99, t: Date.now() }); } catch { /* ignorado */ } evento = null; aoFim();
  }));
}
export function registarSW() {
  if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return;
  const reg = () => navigator.serviceWorker.register('/sw.js').catch(() => { /* sem funcionamento offline */ });
  if (document.readyState === 'complete') reg(); else addEventListener('load', reg);
}
