// Avatar: biblioteca Avataaars (Pablo Stanley, uso livre) via DiceBear, offline. Itens desbloqueados por nivel (0 a 5).
import { createAvatar, avataaars } from '../../vendor/dicebear.js';
import { estado, AVATAR_PADRAO } from '../store.js';
import { nivelDe, NIVEIS, NIVEL_DA_RARIDADE } from '../rules.js';
import { icon } from './icons.js';

// Cada item: [id, nome, nivelMinimo]. Nivel 0 = livre desde o inicio; so os itens mais radicais ou com adereços engraçados ficam para ganhar.
const O = (lista) => lista.map(([id, nome, nivel = 0]) => ({ id, nome, nivel }));
const C = (lista) => lista.map(([hex, nome, nivel = 0]) => ({ id: hex, nome, hex: '#' + hex, nivel }));

export const CATEGORIAS = [
  { id: 'top', nome: 'Cabelo', tipo: 'opcao', opcoes: O([
    ['shortFlat', 'Curto liso'], ['shortRound', 'Curto redondo'], ['shortCurly', 'Curto encaracolado'], ['shortWaved', 'Curto ondulado'], ['sides', 'Lados'], ['straight01', 'Liso'], ['bob', 'Bob'], ['bun', 'Carrapito'],
    ['theCaesar', 'César'], ['theCaesarAndSidePart', 'César com risco'], ['curly', 'Caracóis'], ['curvy', 'Ondulado'], ['longButNotTooLong', 'Médio'], ['straight02', 'Liso 2'], ['straightAndStrand', 'Liso com madeixa'],
    ['frida', 'Frida'], ['miaWallace', 'Franja'], ['shavedSides', 'Laterais rapadas'], ['shaggy', 'Desgrenhado'], ['shaggyMullet', 'Mullet', 3], ['frizzle', 'Crespo'], ['fro', 'Afro'], ['froBand', 'Afro com fita', 2],
    ['dreads01', 'Rastas 1'], ['dreads02', 'Rastas 2'], ['dreads', 'Rastas longas'], ['bigHair', 'Volume', 2], ['hat', 'Chapéu'], ['winterHat1', 'Gorro 1'], ['winterHat02', 'Gorro 2'], ['winterHat03', 'Gorro 3', 1],
    ['winterHat04', 'Gorro 4', 1], ['turban', 'Turbante'], ['hijab', 'Hijab'], ['none', 'Careca'] ]) },
  { id: 'hairColor', nome: 'Cor do cabelo', tipo: 'cor', opcoes: C([['2c1b18', 'Preto'], ['4a312c', 'Castanho escuro'], ['724133', 'Castanho'], ['a55728', 'Ruivo escuro'], ['b58143', 'Louro escuro'], ['d6b370', 'Louro'], ['ecdcbf', 'Platinado'], ['e8e1e1', 'Grisalho'], ['c93305', 'Ruivo'], ['f59797', 'Rosa', 2]]) },
  { id: 'hatColor', nome: 'Cor do gorro', tipo: 'cor', opcoes: C([['25557c', 'Azul'], ['262e33', 'Preto'], ['3c4f5c', 'Cinza azulado'], ['929598', 'Cinza'], ['65c9ff', 'Azul claro'], ['e6e6e6', 'Branco'], ['ff5c5c', 'Vermelho'], ['a7ffc4', 'Verde menta'], ['ffafb9', 'Rosa'], ['ff488e', 'Pink', 1], ['ffffb1', 'Amarelo']]) },
  { id: 'facialHair', nome: 'Barba', tipo: 'opcao', opcoes: O([['none', 'Sem barba'], ['beardLight', 'Barba curta'], ['beardMedium', 'Barba média'], ['moustacheFancy', 'Bigode fino'], ['beardMajestic', 'Barba majestosa', 1], ['moustacheMagnum', 'Bigode grosso', 2]]) },
  { id: 'eyes', nome: 'Olhos', tipo: 'opcao', opcoes: O([['default', 'Normais'], ['happy', 'Felizes'], ['side', 'De lado'], ['squint', 'Semicerrados'], ['wink', 'Piscadela'], ['surprised', 'Surpresos'], ['closed', 'Fechados'], ['eyeRoll', 'Revirar', 1], ['cry', 'A chorar', 2], ['winkWacky', 'Piscadela maluca', 2], ['hearts', 'Corações', 3], ['xDizzy', 'Tontos', 4]]) },
  { id: 'eyebrows', nome: 'Sobrancelhas', tipo: 'opcao', opcoes: O([['defaultNatural', 'Naturais'], ['default', 'Normais'], ['flatNatural', 'Retas'], ['raisedExcited', 'Animadas'], ['raisedExcitedNatural', 'Animadas naturais'], ['upDown', 'Cima baixo'], ['upDownNatural', 'Cima baixo natural'], ['angry', 'Zangadas'], ['angryNatural', 'Zangadas naturais'], ['sadConcerned', 'Preocupadas'], ['sadConcernedNatural', 'Preocupadas naturais'], ['frownNatural', 'Franzidas'], ['unibrowNatural', 'Monocelha', 2]]) },
  { id: 'mouth', nome: 'Boca', tipo: 'opcao', opcoes: O([['smile', 'Sorriso'], ['default', 'Normal'], ['twinkle', 'Brilho'], ['serious', 'Séria'], ['concerned', 'Preocupada'], ['disbelief', 'Descrente'], ['sad', 'Triste'], ['grimace', 'Careta'], ['tongue', 'Língua', 1], ['eating', 'A comer', 2], ['screamOpen', 'Grito', 3], ['vomit', 'Enjoo', 4]]) },
  { id: 'accessories', nome: 'Óculos', tipo: 'opcao', opcoes: O([['none', 'Sem óculos'], ['round', 'Redondos'], ['prescription01', 'Graduados 1'], ['prescription02', 'Graduados 2'], ['wayfarers', 'Wayfarer'], ['sunglasses', 'De sol'], ['kurt', 'Kurt', 1], ['eyepatch', 'Tapa-olho', 3]]) },
  { id: 'accessoriesColor', nome: 'Cor dos óculos', tipo: 'cor', opcoes: C([['262e33', 'Preto'], ['3c4f5c', 'Cinza azulado'], ['e6e6e6', 'Branco'], ['65c9ff', 'Azul claro'], ['5199e4', 'Azul'], ['ff5c5c', 'Vermelho'], ['ffafb9', 'Rosa'], ['a7ffc4', 'Verde menta'], ['ffdeb5', 'Pêssego'], ['ff488e', 'Pink']]) },
  { id: 'clothing', nome: 'Roupa', tipo: 'opcao', opcoes: O([['shirtCrewNeck', 'T-shirt'], ['shirtVNeck', 'T-shirt em V'], ['shirtScoopNeck', 'T-shirt decote'], ['hoodie', 'Hoodie'], ['collarAndSweater', 'Gola e camisola'], ['graphicShirt', 'T-shirt estampada'], ['blazerAndShirt', 'Blazer e camisa'], ['blazerAndSweater', 'Blazer e camisola', 1], ['overall', 'Jardineiras', 2]]) },
  { id: 'clothingGraphic', nome: 'Estampa', tipo: 'opcao', opcoes: O([['diamond', 'Diamante'], ['bear', 'Urso'], ['deer', 'Veado'], ['pizza', 'Pizza'], ['hola', 'Hola'], ['bat', 'Morcego', 1], ['cumbia', 'Cumbia', 2], ['resist', 'Resist', 2], ['skullOutline', 'Caveira contorno', 3], ['skull', 'Caveira', 4]]), nota: 'Só aparece na «T-shirt estampada».' },
  { id: 'clothesColor', nome: 'Cor da roupa', tipo: 'cor', opcoes: C([['3c4f5c', 'Cinza azulado'], ['25557c', 'Azul escuro'], ['262e33', 'Preto'], ['e6e6e6', 'Branco'], ['5199e4', 'Azul'], ['65c9ff', 'Azul claro'], ['929598', 'Cinza'], ['ff5c5c', 'Vermelho'], ['a7ffc4', 'Verde menta'], ['ffafb9', 'Rosa'], ['ff488e', 'Pink', 1], ['ffffb1', 'Amarelo'], ['b1e2ff', 'Gelo'], ['ffffff', 'Branco puro']]) },
  { id: 'skinColor', nome: 'Pele', tipo: 'cor', opcoes: C([['ffdbb4', 'Clara'], ['edb98a', 'Média clara'], ['d08b5b', 'Média'], ['ae5d29', 'Morena'], ['614335', 'Escura'], ['fd9841', 'Laranja', 3], ['f8d25c', 'Amarela', 3]]) },
  { id: 'fundo', nome: 'Fundo', tipo: 'fundo', opcoes: [{ id: 0, nome: 'Quadro', nivel: 0 }, { id: 1, nome: 'Lagoa', nivel: 0 }, { id: 2, nome: 'Aurora', nivel: 0 }, { id: 3, nome: 'Pôr do sol', nivel: 1 }, { id: 4, nome: 'Crepúsculo', nivel: 2 }, { id: 5, nome: 'Espectro', nivel: 3 }, { id: 6, nome: 'Ouro', nivel: 5 }] },
  { id: 'moldura', nome: 'Moldura', tipo: 'moldura', opcoes: [{ id: 0, nome: 'Giz', nivel: 0 }, { id: 1, nome: 'Bronze', nivel: 1 }, { id: 2, nome: 'Prata', nivel: 2 }, { id: 3, nome: 'Ouro', nivel: 3 }, { id: 4, nome: 'Energia', nivel: 4 }, { id: 5, nome: 'Redutor lendário', nivel: 5 }] },
];
// listas por genero (o Avataaars nao tem genero: agrupamos os penteados pela aparencia mais comum)
export const CABELOS = {
  h: ['shortFlat', 'shortRound', 'shortCurly', 'shortWaved', 'sides', 'theCaesar', 'theCaesarAndSidePart', 'shavedSides', 'shaggy', 'shaggyMullet', 'frizzle', 'fro', 'froBand', 'dreads01', 'dreads02', 'bun', 'none'],
  m: ['shortCurly', 'shortWaved', 'shortRound', 'bob', 'bun', 'straight01', 'straight02', 'straightAndStrand', 'longButNotTooLong', 'curly', 'curvy', 'frida', 'miaWallace', 'bigHair', 'dreads', 'fro', 'froBand', 'frizzle', 'none'],
};
export const CHAPEUS = { h: ['hat', 'winterHat1', 'winterHat02', 'winterHat03', 'winterHat04', 'turban'], m: ['hat', 'winterHat1', 'winterHat02', 'winterHat03', 'winterHat04', 'turban', 'hijab'] };
export const PENTEADO_INICIAL = { h: 'shortFlat', m: 'bob' };
export const RARIDADE = ['Comum', 'Incomum', 'Rara', 'Épica', 'Lendária', 'Mítica'];
export const categoria = (id) => CATEGORIAS.find((c) => c.id === id);
export const nivelDoItem = (item) => NIVEL_DA_RARIDADE[Math.min(5, item.nivel)];
export const nomeNivelDoItem = (item) => NIVEIS[nivelDoItem(item)][1];
export const desbloqueado = (item, nivelIdx) => !!estado().liga.prof || nivelDoItem(item) <= nivelIdx;
export const nivelAtual = () => nivelDe(estado().xp).indice;
export function desbloqueiosDoNivel(idx) {
  const out = []; for (const c of CATEGORIAS) for (const o of c.opcoes) if (nivelDoItem(o) === idx && !(c.tipo === 'cor')) out.push(`${c.nome}: ${o.nome}`);
  const cores = CATEGORIAS.filter((c) => c.tipo === 'cor').reduce((n, c) => n + c.opcoes.filter((o) => nivelDoItem(o) === idx).length, 0); if (cores) out.push(`${cores} cores novas`);
  return out;
}
const cache = new Map();
export function svgAvatar(cfg) {
  const k = JSON.stringify(cfg); if (cache.has(k)) return cache.get(k);
  const o = { seed: 'mat1', top: [cfg.top === 'none' ? 'shortFlat' : cfg.top], topProbability: cfg.top === 'none' ? 0 : 100, hairColor: [cfg.hairColor], hatColor: [cfg.hatColor],
    accessories: [cfg.accessories === 'none' ? 'round' : cfg.accessories], accessoriesProbability: cfg.accessories === 'none' ? 0 : 100, accessoriesColor: [cfg.accessoriesColor],
    facialHair: [cfg.facialHair === 'none' ? 'beardLight' : cfg.facialHair], facialHairProbability: cfg.facialHair === 'none' ? 0 : 100, facialHairColor: [cfg.hairColor],
    clothing: [cfg.clothing], clothesColor: [cfg.clothesColor], clothingGraphic: [cfg.clothingGraphic], eyebrows: [cfg.eyebrows], eyes: [cfg.eyes], mouth: [cfg.mouth], skinColor: [cfg.skinColor] };
  let svg = createAvatar(avataaars, o).toString(); svg = svg.replace('<g transform="translate(76 90)">', '<g class="av-olhos" transform="translate(76 90)">').replace('<g transform="translate(76 82)">', '<g class="av-sobr" transform="translate(76 82)">'); if (cache.size > 400) cache.clear(); cache.set(k, svg); return svg;
}
// HTML do avatar com fundo e moldura. opcoes: {s: tamanho px, quadrado, nivel: mostra distintivo}
let semente = 0;
export function avatarHTML(cfg = estado().avatar, { s = 48, quadrado = false, nivel = null, anim = false, selo = false } = {}) {
  const c = { ...AVATAR_PADRAO, ...cfg };
  const d = anim ? ` anima" style="--s:${s}px;--d:${-((semente++ * 2.3) % 7).toFixed(1)}s;--d2:${-((semente * 3.7) % 9).toFixed(1)}s` : `" style="--s:${s}px`;
  return `<span class="av ${quadrado ? 'quadrado' : ''}${d}"><span class="av-arte av-fundo-${c.fundo}">${svgAvatar(c)}</span><span class="moldura m${c.moldura}"></span>${nivel != null ? `<span class="nivel-badge">${nivel}</span>` : ''}${selo ? `<span class="selo-prof" title="Professor">${icon('capelo')}</span>` : ''}</span>`;
}
export function avatarAleatorio(nivelIdx, rng = Math.random, genero = estado().avatar.genero || 'h') {
  const cfg = { ...AVATAR_PADRAO, genero };
  for (const c of CATEGORIAS) {
    let ok = c.opcoes.filter((o) => desbloqueado(o, nivelIdx));
    if (c.id === 'top') { const lista = rng() < 0.85 ? CABELOS[genero] : CHAPEUS[genero]; ok = ok.filter((o) => lista.includes(o.id)); }
    if (c.id === 'facialHair' && genero === 'm') ok = ok.filter((o) => o.id === 'none');
    cfg[c.id] = ok[Math.floor(rng() * ok.length)].id;
  }
  return cfg;
}
