"""Parte IV (testes de exemplo) e resoluções dos testes."""
from ch_ex import *


def autobox(lp):
    V = vertices(lp)
    xs = [float(p[0]) for p in V] + [float(b / r[0]) for r, b in zip(lp.A, lp.b) if r[0] > 0]
    ys = [float(p[1]) for p in V] + [float(b / r[1]) for r, b in zip(lp.A, lp.b) if r[1] > 0]
    X = max(max(p[0] for p in V) * 1.35, 1); Y = max(max(p[1] for p in V) * 1.35, 1)
    X = min(max(xs + [X]) * 1.08, float(max(p[0] for p in V)) * 1.8 + 2); Y = min(max(ys + [Y]) * 1.08, float(max(p[1] for p in V)) * 1.8 + 2)
    return (round(X + 0.5), round(Y + 0.5))


T1Q1 = LP('max', [300, 200], [[2, 1], [1, 1], [0, 1]], ['<=', '<=', '>='], [40, 30, 5])
T2Q1 = LP('max', [50, 80], [[1, 1], [0, 2], [0, 1]], ['<=', '<=', '>='], [100, 120, 20])
T3Q1 = LP('max', [6, 7], [[2, 1], [1, 2]], ['<=', '<='], [600, 480])
T4Q1 = LP('max', [120, 70], [[2, 1], [1, 1]], ['<=', '<='], [10, 6])
TL = dict(zip(['t1q2', 't1q3', 't1q4', 't2q2', 't2q3', 't2q4', 't3q2', 't3q3', 't3q4', 't4q2', 't4q3', 't4q4'], C.TEST_LPS))
TR = {k: simplex(v) for k, v in TL.items()}

ST = {k: C.TESTS[i]['qs'] for i, k in enumerate(['T1', 'T2', 'T3', 'T4'])}


def stmt(test, q):
    """enunciado da questão q (1..5) do teste, com o modelo no formato da sebenta"""
    qs = ST[test][q - 1]
    key = '%sq%d' % (test.lower(), q)
    lp = TL.get(key)
    return conv(qs['st'], lp), qs['pts']


def form(lp, vars_, extra=''):
    out = [vars_txt(*vars_)]
    if extra:
        out.append(P(extra))
    out.append(Eq(model(lp)))
    return out


def gq(key, name, labels=None, labpos=None):
    lp = TL[key]
    return graf(lp, name, autobox(lp), labels=labels, labpos=labpos)[0]


def dual_read(lp, res, names=None):
    d, t = dual_model(lp)
    ys = precos_sombra(lp, res)
    rd = simplex(d)
    assert rd['z'] == res['z']
    leitura = 'simétricos dos $c_j-z_j$ das folgas' if lp.sense == 'max' else '$c_j-z_j$ dos excessos'
    return [Eq(t), P('No quadro ótimo da questão 3, os valores ótimos das variáveis duais são os %s: %s, com $w^*=%s=z^*$.' % (leitura, ', '.join('$y_%d=%s$' % (i + 1, dn(y)) for i, y in enumerate(ys)), dn(rd['z'])))], ys


def res_T1():
    out = {}
    out[1] = form(T1Q1, ['$x_1$ = milhares de latas de sardinha', '$x_2$ = milhares de latas de cavala (por semana)'],
                  'Horas de linha: $2x_1+x_2\\leq40$; peixe: $x_1+x_2\\leq30$; contrato: $x_2\\geq5$. Margem: $300x_1+200x_2$.')
    r = TR['t1q2']
    out[2] = alinea('a', gq('t1q2', 'T1Q2')) + alinea('b', [estado_ul(TL['t1q2'], r)])
    out[3] = simplex_blocks(TL['t1q3'])[0]
    r4 = TR['t1q4']
    out[4] = alinea('a', [Eq(std_model(TL['t1q4'])), Ul(classify(TL['t1q4']))]) + alinea('b', [P('Para o método algébrico usamos a forma standard só com os excessos (as artificiais servem apenas ao Simplex):'), Eq(std_noart(TL['t1q4']))] + algeb(TL['t1q4'])[0])
    d, ys = dual_read(TL['t1q3'], TR['t1q3'])
    out[5] = d + [P('**Interpretação:** se as restrições forem horas de duas secções, uma hora a mais na primeira secção aumentaria o lucro máximo em $%s$ e uma hora a mais na segunda em $%s$. São os valores máximos a pagar por uma hora extra em cada secção.' % (dn(ys[0]), dn(ys[1])))]
    return out


def res_T2():
    out = {}
    out[1] = form(T2Q1, ['$x_1$ = quartos em "só alojamento"', '$x_2$ = quartos em meia pensão (por noite)'],
                  'Quartos: $x_1+x_2\\leq100$. Jantares: cada quarto em meia pensão dá 2 jantares, $2x_2\\leq120$. Operadores: $x_2\\geq20$. Margem: $50x_1+80x_2$.')
    lp2 = TL['t2q2']; lp2b = LP('min', [2, 2], lp2.A, lp2.rel, lp2.b)
    gb, _ = graf(lp2b, 'T2Q2b', autobox(lp2), intro=False)
    out[2] = alinea('a', gq('t2q2', 'T2Q2')) + alinea('b', [P('Com $z=2x_1+2x_2$, as retas de nível ficam paralelas a $x_1+x_2=8$, um lado do CSA. Comparando os vértices:')] + gb + [P('A solução $(0,8)$ continua ótima, mas deixa de ser única.')])
    out[3] = simplex_blocks(TL['t2q3'])[0] + [estado_ul(TL['t2q3'], TR['t2q3'])]
    out[4] = simplex_blocks(TL['t2q4'])[0]
    out[5] = [Ul(['**Verdadeira.** Num problema de Max, nenhuma variável melhora $z$ se todos os $c_j-z_j\\leq0$: é o critério de paragem.',
                  '**Verdadeira.** No quadro ótimo, uma variável artificial positiva significa que não foi possível cumprir a restrição original; o CSA é vazio.',
                  '**Falsa.** O dual tem uma variável por cada restrição do primal: 3 variáveis (e 2 restrições, uma por cada variável do primal).'], 'alpha')]
    return out


def res_T3():
    out = {}
    out[1] = form(T3Q1, ['$x_1$ = cabazes "Pomar"', '$x_2$ = cabazes "Serra"'], 'Laranja: $2x_1+x_2\\leq600$; alfarroba: $x_1+2x_2\\leq480$. Margem: $6x_1+7x_2$.')
    out[2] = alinea('a', gq('t3q2', 'T3Q2')) + alinea('b', [Eq(std_model(TL['t3q2']))] + algeb(TL['t3q2'])[0])
    r = TR['t3q3']
    out[3] = simplex_blocks(TL['t3q3'])[0] + [ps_ul(TL['t3q3'], r, ['1.ª restrição', '2.ª restrição', '3.ª restrição'], ['unidade de recurso'] * 3, obj='$z$', moeda='')]
    out[4] = alinea('a', [Eq(std_model(TL['t3q4'])), Ul(classify(TL['t3q4']))]) + alinea('b', simplex_blocks(TL['t3q4'], intro=False)[0])
    d, ys = dual_read(TL['t3q3'], TR['t3q3'])
    out[5] = d
    return out


def res_T4():
    out = {}
    out[1] = form(T4Q1, ['$x_1$ = passeios de caiaque', '$x_2$ = passeios de bicicleta (por dia)'], 'Monitores: $2x_1+x_2\\leq10$; carrinhas: $x_1+x_2\\leq6$. Margem: $120x_1+70x_2$.')
    out[2] = alinea('a', gq('t4q2', 'T4Q2')) + alinea('b', [estado_ul(TL['t4q2'], TR['t4q2'])])
    out[3] = simplex_blocks(TL['t4q3'])[0]
    out[4] = simplex_blocks(TL['t4q4'])[0] + [P('**Confirmação gráfica:**')] + graf(TL['t4q4'], 'T4Q4', autobox(TL['t4q4']), intro=False)[0]
    d, ys = dual_read(TL['t4q3'], TR['t4q3'])
    out[5] = d + [P('Os preços-sombra dos três recursos são $%s$, $%s$ e $%s$. O terceiro recurso tem preço-sombra 0: sobram %s unidades ($F_3=%s$ no quadro ótimo), por isso não vale a pena reforçá-lo.' % (dn(ys[0]), dn(ys[1]), dn(ys[2]), dn(TR['t4q3']['x'][5]), dn(TR['t4q3']['x'][5])))]
    return out


RES_T = {'T1': res_T1, 'T2': res_T2, 'T3': res_T3, 'T4': res_T4}

# respostas dos testes confirmadas pelo motor e pelo scipy
for k, lp in TL.items():
    st, x, z = solve_check(lp)
    assert st == 'otimo' and abs(z - float(TR[k]['z'])) < 1e-6, k
for lp in (T1Q1, T2Q1, T3Q1, T4Q1):
    assert simplex(lp)['status'] == 'otimo'
