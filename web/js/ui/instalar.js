// Instalar a app no ecra principal (PWA): ecra inteiro, sem barra do navegador, abre mais depressa.
// Telemovel, tablet e computador. Chrome/Edge/Android: botao que abre o pedido do sistema. iPhone/iPad e Safari no Mac: so instrucoes.
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
const firefox = /Firefox\/|FxiOS\//.test(ua);
const safariMac = !ios && /Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome\/|Chromium\/|Edg\/|OPR\/|Firefox\//.test(ua);
const edge = /Edg\//.test(ua);
const portatil = !ios && !android;
export const plataforma = () => (ios ? 'ios' : android ? 'android' : 'outra');
export const ehTelemovel = () => ios || android;
function ler() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } }
function gravar(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch { /* sem armazenamento */ } }
export function dispensar() { const o = ler(); gravar({ n: (o.n || 0) + 1, t: Date.now() }); }
// o cartao da pagina inicial: so aparece se ainda nao esta instalada e nao foi dispensado ha pouco
export function deveSugerir() {
  if (instalada()) return false;
  const o = ler(); if ((o.n || 0) >= 3) return false;
  return !o.t || Date.now() - o.t > 2 * 86400000;
}
const ICO_PARTILHA = '<svg class="ico-p" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICO_MENU = '<svg class="ico-p" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/></svg>';

// devolve o conteudo (HTML) do pedido, conforme o aparelho
export function conteudo({ comDispensar = true } = {}) {
  const sub = portatil ? 'Abre numa janela própria, sem separadores nem barra de endereços, com o ícone no ambiente de trabalho ou na barra de tarefas.' : 'Abre em ecrã inteiro, sem a barra do navegador, com o teu ícone no ecrã principal.';
  const base = `<b class="inst-t">Instala a app</b><p class="nota" style="margin:2px 0 8px">${sub}</p>`;
  const nao = (txt) => (comDispensar ? `<div class="inst-acoes"><button class="btn fantasma peq" data-inst="nao">${txt}</button></div>` : '');
  if (instalada()) return `<b class="inst-t">App instalada</b><p class="nota" style="margin:2px 0 0">Estás a usar a app ${portatil ? 'na janela própria' : 'em ecrã inteiro'}.</p>`;
  if (embutido()) return `${base}<p class="inst-p">Este link foi aberto dentro de outra aplicação. Abre-o primeiro no <b>${ios ? 'Safari' : 'Chrome'}</b> (menu ${ICO_MENU} ou «Abrir no navegador») e depois instala.</p>${nao('Agora não')}`;
  if (ios) return `${base}<ol class="inst-l"><li>Toca em <b>Partilhar</b> ${ICO_PARTILHA} na barra do Safari.</li><li>Escolhe <b>Adicionar ao ecrã principal</b>.</li><li>Toca em <b>Adicionar</b>.</li></ol>${nao('Já percebi')}`;
  if (evento) return `${base}<div class="inst-acoes"><button class="btn peq" data-inst="sim">Instalar</button>${comDispensar ? '<button class="btn fantasma peq" data-inst="nao">Agora não</button>' : ''}</div>`;
  if (safariMac) return `${base}<ol class="inst-l"><li>No menu <b>Ficheiro</b> do Safari, escolhe <b>Adicionar ao Dock</b>.</li><li>Confirma em <b>Adicionar</b>.</li></ol><p class="nota" style="margin:6px 0 0">Precisa do macOS Sonoma (14) ou mais recente.</p>${nao('Já percebi')}`;
  if (firefox && portatil) return `${base}<p class="inst-p">O Firefox no computador não instala aplicações. Abre este link no <b>Chrome</b> ou no <b>Edge</b> e instala a partir daí.</p>${nao('Agora não')}`;
  if (portatil) return `${base}<ol class="inst-l"><li>Na barra de endereços, clica no <b>ícone de instalar</b> (um ecrã com uma seta).</li><li>${edge ? 'Se não o vires, abre o menu <b>...</b>, <b>Aplicações</b>, <b>Instalar este site como uma aplicação</b>.' : 'Se não o vires, abre o menu <b>⋮</b>, <b>Guardar e partilhar</b>, <b>Instalar página como aplicação</b>.'}</li><li>Confirma em <b>Instalar</b>.</li></ol>${nao('Agora não')}`;
  return `${base}<ol class="inst-l"><li>Abre o menu do navegador ${ICO_MENU}.</li><li>Toca em <b>Instalar aplicação</b> ou <b>Adicionar ao ecrã principal</b>.</li></ol>${nao('Agora não')}`;
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
