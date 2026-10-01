// Avatar: biblioteca Avataaars (Pablo Stanley, uso livre) via DiceBear, offline. Itens desbloqueados por nivel (0 a 5).
import { createAvatar, avataaars } from '../../vendor/dicebear.js';
import { estado, AVATAR_PADRAO } from '../store.js';
import { nivelDe } from '../rules.js';

// [id, nome, nivelMinimo]
const L = (lista, livres) => lista.map(([id, nome], i) => ({ id, nome, nivel: i < livres ? 0 : 1 + Math.floor(((i - livres) * 5) / Math.max(1, lista.length - livres)) }));
const cor = (lista, livres) => lista.map(([hex, nome], i) => ({ id: hex, nome, hex: '#' + hex, nivel: i < livres ? 0 : 1 + Math.floor(((i - livres) * 5) / Math.max(1, lista.length - livres)) }));

export const CATEGORIAS = [
  { id: 'top', nome: 'Cabelo', tipo: 'opcao', opcoes: L([
    ['shortFlat', 'Curto liso'], ['shortRound', 'Curto redondo'], ['shortCurly', 'Curto encaracolado'], ['shortWaved', 'Curto ondulado'], ['sides', 'Lados'], ['straight01', 'Liso'], ['bob', 'Bob'], ['bun', 'Carrapito'],
    ['theCaesar', 'César'], ['theCaesarAndSidePart', 'César com risco'], ['curly', 'Caracóis'], ['curvy', 'Ondulado'], ['longButNotTooLong', 'Médio'], ['straight02', 'Liso 2'], ['straightAndStrand', 'Liso com madeixa'],
    ['frida', 'Frida'], ['miaWallace', 'Franja'], ['shavedSides', 'Laterais rapadas'], ['shaggy', 'Desgrenhado'], ['shaggyMullet', 'Mullet'], ['frizzle', 'Crespo'], ['fro', 'Afro'], ['froBand', 'Afro com fita'],
    ['dreads01', 'Rastas 1'], ['dreads02', 'Rastas 2'], ['dreads', 'Rastas longas'], ['bigHair', 'Volume'], ['hat', 'Chapéu'], ['winterHat1', 'Gorro 1'], ['winterHat02', 'Gorro 2'], ['winterHat03', 'Gorro 3'],
    ['winterHat04', 'Gorro 4'], ['turban', 'Turbante'], ['hijab', 'Hijab'] ], 8).concat([{ id: 'none', nome: 'Careca', nivel: 1 }]) },
  { id: 'hairColor', nome: 'Cor do cabelo', tipo: 'cor', opcoes: cor([['2c1b18', 'Preto'], ['4a312c', 'Castanho escuro'], ['724133', 'Castanho'], ['a55728', 'Ruivo escuro'], ['b58143', 'Louro escuro'], ['d6b370', 'Louro'], ['ecdcbf', 'Platinado'], ['e8e1e1', 'Grisalho'], ['c93305', 'Ruivo'], ['f59797', 'Rosa']], 5) },
  { id: 'hatColor', nome: 'Cor do gorro', tipo: 'cor', opcoes: cor([['25557c', 'Azul'], ['262e33', 'Preto'], ['3c4f5c', 'Cinza azulado'], ['929598', 'Cinza'], ['65c9ff', 'Azul claro'], ['e6e6e6', 'Branco'], ['ff5c5c', 'Vermelho'], ['a7ffc4', 'Verde menta'], ['ffafb9', 'Rosa'], ['ff488e', 'Pink'], ['ffffb1', 'Amarelo']], 5) },
  { id: 'facialHair', nome: 'Barba', tipo: 'opcao', opcoes: L([['none', 'Sem barba'], ['beardLight', 'Barba curta'], ['beardMedium', 'Barba média'], ['moustacheFancy', 'Bigode fino'], ['beardMajestic', 'Barba majestosa'], ['moustacheMagnum', 'Bigode grosso']], 2) },
  { id: 'eyes', nome: 'Olhos', tipo: 'opcao', opcoes: L([['default', 'Normais'], ['happy', 'Felizes'], ['side', 'De lado'], ['squint', 'Semicerrados'], ['wink', 'Piscadela'], ['surprised', 'Surpresos'], ['closed', 'Fechados'], ['eyeRoll', 'Revirar'], ['winkWacky', 'Piscadela maluca'], ['hearts', 'Corações'], ['cry', 'A chorar'], ['xDizzy', 'Tontos']], 4) },
  { id: 'eyebrows', nome: 'Sobrancelhas', tipo: 'opcao', opcoes: L([['defaultNatural', 'Naturais'], ['default', 'Normais'], ['flatNatural', 'Retas'], ['raisedExcited', 'Animadas'], ['raisedExcitedNatural', 'Animadas naturais'], ['upDown', 'Cima baixo'], ['upDownNatural', 'Cima baixo natural'], ['angry', 'Zangadas'], ['angryNatural', 'Zangadas naturais'], ['sadConcerned', 'Preocupadas'], ['sadConcernedNatural', 'Preocupadas naturais'], ['frownNatural', 'Franzidas'], ['unibrowNatural', 'Monocelha']], 4) },
  { id: 'mouth', nome: 'Boca', tipo: 'opcao', opcoes: L([['smile', 'Sorriso'], ['default', 'Normal'], ['twinkle', 'Brilho'], ['serious', 'Séria'], ['concerned', 'Preocupada'], ['disbelief', 'Descrente'], ['grimace', 'Careta'], ['sad', 'Triste'], ['tongue', 'Língua'], ['eating', 'A comer'], ['screamOpen', 'Grito'], ['vomit', 'Enjoo']], 4) },
  { id: 'accessories', nome: 'Óculos', tipo: 'opcao', opcoes: L([['none', 'Sem óculos'], ['round', 'Redondos'], ['prescription01', 'Graduados 1'], ['prescription02', 'Graduados 2'], ['wayfarers', 'Wayfarer'], ['kurt', 'Kurt'], ['sunglasses', 'De sol'], ['eyepatch', 'Tapa-olho']], 2) },
  { id: 'accessoriesColor', nome: 'Cor dos óculos', tipo: 'cor', opcoes: cor([['262e33', 'Preto'], ['3c4f5c', 'Cinza azulado'], ['e6e6e6', 'Branco'], ['65c9ff', 'Azul claro'], ['5199e4', 'Azul'], ['ff5c5c', 'Vermelho'], ['ffafb9', 'Rosa'], ['a7ffc4', 'Verde menta'], ['ffdeb5', 'Pêssego'], ['ff488e', 'Pink']], 4) },
  { id: 'clothing', nome: 'Roupa', tipo: 'opcao', opcoes: L([['shirtCrewNeck', 'T-shirt'], ['shirtVNeck', 'T-shirt em V'], ['shirtScoopNeck', 'T-shirt decote'], ['hoodie', 'Hoodie'], ['collarAndSweater', 'Gola e camisola'], ['graphicShirt', 'T-shirt estampada'], ['blazerAndShirt', 'Blazer e camisa'], ['blazerAndSweater', 'Blazer e camisola'], ['overall', 'Jardineiras']], 3) },
  { id: 'clothingGraphic', nome: 'Estampa', tipo: 'opcao', opcoes: L([['diamond', 'Diamante'], ['bear', 'Urso'], ['deer', 'Veado'], ['pizza', 'Pizza'], ['hola', 'Hola'], ['bat', 'Morcego'], ['cumbia', 'Cumbia'], ['resist', 'Resist'], ['skullOutline', 'Caveira contorno'], ['skull', 'Caveira']], 3), nota: 'Só aparece na «T-shirt estampada».' },
  { id: 'clothesColor', nome: 'Cor da roupa', tipo: 'cor', opcoes: cor([['3c4f5c', 'Cinza azulado'], ['25557c', 'Azul escuro'], ['262e33', 'Preto'], ['e6e6e6', 'Branco'], ['5199e4', 'Azul'], ['65c9ff', 'Azul claro'], ['929598', 'Cinza'], ['ff5c5c', 'Vermelho'], ['a7ffc4', 'Verde menta'], ['ffafb9', 'Rosa'], ['ff488e', 'Pink'], ['ffffb1', 'Amarelo'], ['b1e2ff', 'Gelo'], ['ffffff', 'Branco puro']], 5) },
  { id: 'skinColor', nome: 'Pele', tipo: 'cor', opcoes: cor([['ffdbb4', 'Clara'], ['edb98a', 'Média clara'], ['d08b5b', 'Média'], ['ae5d29', 'Morena'], ['614335', 'Escura'], ['fd9841', 'Laranja'], ['f8d25c', 'Amarela']], 5) },
  { id: 'fundo', nome: 'Fundo', tipo: 'fundo', opcoes: [{ id: 0, nome: 'Quadro', nivel: 0 }, { id: 1, nome: 'Lagoa', nivel: 0 }, { id: 2, nome: 'Aurora', nivel: 1 }, { id: 3, nome: 'Pôr do sol', nivel: 2 }, { id: 4, nome: 'Crepúsculo', nivel: 3 }, { id: 5, nome: 'Espectro', nivel: 4 }, { id: 6, nome: 'Ouro', nivel: 5 }] },
  { id: 'moldura', nome: 'Moldura', tipo: 'moldura', opcoes: [{ id: 0, nome: 'Giz', nivel: 0 }, { id: 1, nome: 'Bronze', nivel: 1 }, { id: 2, nome: 'Prata', nivel: 2 }, { id: 3, nome: 'Ouro', nivel: 3 }, { id: 4, nome: 'Energia', nivel: 4 }, { id: 5, nome: 'Redutor lendário', nivel: 5 }] },
];
export const RARIDADE = ['Comum', 'Incomum', 'Rara', 'Épica', 'Lendária', 'Mítica'];
export const categoria = (id) => CATEGORIAS.find((c) => c.id === id);
export const desbloqueado = (item, nivelIdx) => item.nivel <= nivelIdx;
export const nivelAtual = () => nivelDe(estado().xp).indice;
export function desbloqueiosDoNivel(idx) {
  const out = []; for (const c of CATEGORIAS) for (const o of c.opcoes) if (o.nivel === idx && !(c.tipo === 'cor')) out.push(`${c.nome}: ${o.nome}`);
  const cores = CATEGORIAS.filter((c) => c.tipo === 'cor').reduce((n, c) => n + c.opcoes.filter((o) => o.nivel === idx).length, 0); if (cores) out.push(`${cores} cores novas`);
  return out;
}
const cache = new Map();
export function svgAvatar(cfg) {
  const k = JSON.stringify(cfg); if (cache.has(k)) return cache.get(k);
  const o = { seed: 'mat1', top: [cfg.top === 'none' ? 'shortFlat' : cfg.top], topProbability: cfg.top === 'none' ? 0 : 100, hairColor: [cfg.hairColor], hatColor: [cfg.hatColor],
    accessories: [cfg.accessories === 'none' ? 'round' : cfg.accessories], accessoriesProbability: cfg.accessories === 'none' ? 0 : 100, accessoriesColor: [cfg.accessoriesColor],
    facialHair: [cfg.facialHair === 'none' ? 'beardLight' : cfg.facialHair], facialHairProbability: cfg.facialHair === 'none' ? 0 : 100, facialHairColor: [cfg.hairColor],
    clothing: [cfg.clothing], clothesColor: [cfg.clothesColor], clothingGraphic: [cfg.clothingGraphic], eyebrows: [cfg.eyebrows], eyes: [cfg.eyes], mouth: [cfg.mouth], skinColor: [cfg.skinColor] };
  const svg = createAvatar(avataaars, o).toString(); if (cache.size > 400) cache.clear(); cache.set(k, svg); return svg;
}
// HTML do avatar com fundo e moldura. opcoes: {s: tamanho px, quadrado, nivel: mostra distintivo}
export function avatarHTML(cfg = estado().avatar, { s = 48, quadrado = false, nivel = null } = {}) {
  const c = { ...AVATAR_PADRAO, ...cfg };
  return `<span class="av ${quadrado ? 'quadrado' : ''}" style="--s:${s}px"><span class="av-arte av-fundo-${c.fundo}">${svgAvatar(c)}</span><span class="moldura m${c.moldura}"></span>${nivel != null ? `<span class="nivel-badge">${nivel}</span>` : ''}</span>`;
}
export function avatarAleatorio(nivelIdx, rng = Math.random) {
  const cfg = { ...AVATAR_PADRAO };
  for (const c of CATEGORIAS) { const ok = c.opcoes.filter((o) => desbloqueado(o, nivelIdx)); cfg[c.id] = ok[Math.floor(rng() * ok.length)].id; }
  return cfg;
}
