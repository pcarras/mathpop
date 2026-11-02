"""Resoluções automáticas (todas a partir do motor exato plengine): modelo, forma standard, gráfico, método algébrico, Simplex, dual."""
import sys
sys.path.insert(0, '/home/claude/t2deck/pl')
from math import comb
from fractions import Fraction as Fr
from plengine import *
from auto_base import qjson
from sebgen import *

ORD = ['1.ª', '2.ª', '3.ª', '4.ª', '5.ª', '6.ª']


def dn(x):
    """número em LaTeX: inteiro ou fração exata"""
    return ftex(F(x))


def dm(x):
    """número em LaTeX para modelos e enunciados: inteiro, decimal curto (vírgula) ou fração"""
    x = F(x)
    if x.denominator == 1:
        return str(x.numerator)
    t = x.denominator
    while t % 2 == 0: t //= 2
    while t % 5 == 0: t //= 5
    if t == 1 and x.denominator <= 100:
        s = ('%.4f' % float(x)).rstrip('0').rstrip('.')
        return s.replace('.', '{,}')
    return ftex(x)


def tn(x):
    """número para texto corrido: decimal com vírgula se curto, senão fração em $"""
    x = F(x)
    s = dn(x)
    return '$' + s + '$'


def lin(coefs, names, show_zero=False):
    out = ''
    for a, nm in zip(coefs, names):
        a = F(a)
        if a == 0 and not show_zero:
            continue
        if a == 1:
            t = nm
        elif a == -1:
            t = '-' + nm
        else:
            t = dm(a) + nm
        if out and not t.startswith('-'):
            t = '+' + t
        out += t
    return out or '0'


REL = {'<=': r'\leq', '>=': r'\geq', '=': '='}


def model(lp, fo='z'):
    s = r'\begin{array}{ll}\text{%s} & %s=%s\\[3pt]' % ('Max' if lp.sense == 'max' else 'Min', fo, lin(lp.c, lp.names))
    rows = [lin(r, lp.names) + REL[rl] + dm(bb) for r, rl, bb in zip(lp.A, lp.rel, lp.b)]
    rows.append(','.join(lp.names) + r'\geq0')
    s += r'\text{s.a.} & ' + r'\\ & '.join(rows) + r'\end{array}'
    return s


def mvterm(c, nm, first=False):
    if isinstance(c, MV) and c.b != 0:
        sg = '-' if c.b < 0 else '+'
        k = abs(c.b)
        t = ('' if k == 1 else dn(k)) + 'M' + nm
        return (sg if (sg == '-' or not first) else '') + t
    a = c.a if isinstance(c, MV) else F(c)
    t = (('' if abs(a) == 1 else dm(abs(a))) if a != 0 else '0') + nm
    if a < 0:
        return '-' + t
    return ('' if first else '+') + t


def std_model(lp, fo='z'):
    T = standard(lp)
    names = [c[0] for c in T['cols']]
    s = r'\begin{array}{ll}\text{%s} & %s=' % ('Max' if lp.sense == 'max' else 'Min', fo)
    s += ''.join(mvterm(c, nm, j == 0) for j, (c, nm) in enumerate(zip(T['cost'], names)))
    s += r'\\[3pt]\text{s.a.} & '
    rows = [lin(r, names) + '=' + dm(bb) for r, bb in zip(T['rows'], T['rhs'])]
    rows.append(','.join(names) + r'\geq0')
    s += r'\\ & '.join(rows) + r'\end{array}'
    return s


def classify(lp):
    out = []
    for i, rl in enumerate(lp.rel):
        if rl == '<=':
            out.append('$F_%d$: variável de folga da %s restrição ($\\leq$); entra na base inicial.' % (i + 1, ORD[i]))
        elif rl == '>=':
            out.append('$E_%d$: variável de excesso da %s restrição ($\\geq$), com coeficiente $-1$; $A_%d$: variável artificial da mesma restrição, para formar a base inicial.' % (i + 1, ORD[i], i + 1))
        else:
            out.append('$A_%d$: variável artificial da %s restrição ($=$), para formar a base inicial.' % (i + 1, ORD[i]))
    if any(r != '<=' for r in lp.rel):
        out.append('As variáveis artificiais entram na função objetivo com coeficiente %s, sendo $M$ um número positivo muito grande: assim nunca compensa mantê-las na solução.' % ('$-M$ (problema de maximização)' if lp.sense == 'max' else '$+M$ (problema de minimização)'))
    return out


# ------------------------------------------------------------------ gráfico
def line_points(a0, a1, b):
    """dois pontos simples da reta a0 x + a1 y = b"""
    pts = []
    if a1 != 0:
        pts.append((F(0), b / a1))
    if a0 != 0:
        pts.append((b / a0, F(0)))
    if b == 0 or len(pts) < 2 or pts[0] == pts[-1]:
        pts = [p for p in pts if True][:1] if b != 0 else [(F(0), F(0))]
        for k in range(1, 50):
            if a1 != 0:
                y = (b - a0 * k) / a1
                if y >= 0 and y.denominator == 1:
                    pts.append((F(k), y)); break
            else:
                pts.append((b / a0, F(k))); break
    # se algum ponto tem coordenada negativa, procura outro no 1.º quadrante
    if any(p[0] < 0 or p[1] < 0 for p in pts) and a1 != 0:
        good = [p for p in pts if p[0] >= 0 and p[1] >= 0]
        for k in range(1, 50):
            y = (b - a0 * k) / a1
            if y >= 0 and y.denominator == 1 and (F(k), y) not in good:
                good.append((F(k), y))
            if len(good) == 2: break
        pts = good
    return pts[:2]


def pt(p):
    return '(%s,%s)' % (dn(p[0]), dn(p[1]))


def tight(lp, p):
    out = []
    for i, (r, rl, bb) in enumerate(zip(lp.A, lp.rel, lp.b)):
        if r[0] * p[0] + r[1] * p[1] == bb:
            out.append(i)
    if p[0] == 0: out.append('x')
    if p[1] == 0: out.append('y')
    return out


def eqtxt(lp, i):
    if i == 'x': return '%s=0' % lp.names[0]
    if i == 'y': return '%s=0' % lp.names[1]
    return lin(lp.A[i], lp.names) + '=' + dm(lp.b[i])


def graf(lp, name, box, labels=None, labpos=None, ticks=None, iso_at=None, intro=True, fo='z'):
    """resolução gráfica completa; devolve (blocos, dict) com vértices, ótimo, múltiplas"""
    B = []
    V = vertices(lp)
    # nomes: O na origem, depois A, B, C pela ordem anti-horária a partir do eixo x1
    if V:
        import math
        V.sort(key=lambda p: (math.atan2(float(p[1]), float(p[0])) if p != (0, 0) else -9, -float(p[0])))
    names = []
    k = 0
    for p in V:
        if p == (0, 0):
            names.append('O')
        else:
            names.append('ABCDEFGH'[k]); k += 1
    zs = [lp.c[0] * p[0] + lp.c[1] * p[1] for p in V]
    best = (max if lp.sense == 'max' else min)(zs) if zs else None
    res = simplex(lp)
    status = res['status']
    if intro:
        B.append(P('Representamos cada restrição técnica pela reta que lhe corresponde (trocando a desigualdade por igualdade) e escolhemos o semiplano que a satisfaz; o ponto $(0,0)$ serve de teste sempre que não está sobre a reta.'))
        items = []
        for i, (r, rl, bb) in enumerate(zip(lp.A, lp.rel, lp.b)):
            p1, p2 = line_points(r[0], r[1], bb)
            o = r[0] * 0 + r[1] * 0
            ok0 = (o <= bb) if rl == '<=' else ((o >= bb) if rl == '>=' else o == bb)
            sem = ''
            if rl != '=' and bb != 0:
                sem = '; como $(0,0)$ %s a restrição, o semiplano é o %s a origem' % ('satisfaz' if ok0 else 'não satisfaz', 'que contém' if ok0 else 'que não contém')
            items.append('$%s$ passa por $%s$ e $%s$%s.' % (lin(r, lp.names) + '=' + dn(bb), pt(p1), pt(p2), sem))
        B.append(Ul(items))
    pts = []
    for p, nm, zz in zip(V, names, zs):
        pts.append((float(p[0]), float(p[1]), nm, RED if (status == 'otimo' and zz == best) else NAVY))
    iso = float(best) if (status == 'otimo') else (iso_at if iso_at is not None else None)
    opt_pts = [p for p, zz in zip(V, zs) if zz == best] if status == 'otimo' else []
    seg = None
    if status == 'otimo' and len(opt_pts) == 2:
        seg = [(float(opt_pts[0][0]), float(opt_pts[0][1])), (float(opt_pts[1][0]), float(opt_pts[1][1]))]
    lp_figure(name, lp, box, pts=pts, iso=iso, labels=labels or ['$%s$' % eqtxt(lp, i) for i in range(lp.m)], labpos=labpos, ticks=ticks, segment=seg, names=lp.names)
    if status == 'otimo':
        cap = 'Conjunto das soluções admissíveis (a sombreado) e reta da função objetivo que passa pelo ótimo (a tracejado).'
    else:
        cap = 'Conjunto das soluções admissíveis (a sombreado).'
    B.append(Fig(name, cap))
    info = dict(V=V, names=names, zs=zs, best=best, status=status, opt=opt_pts, res=res)
    if status != 'otimo':
        return B, info
    B.append(P('O ótimo, se existir, está num vértice do conjunto das soluções admissíveis (CSA). Calculamos as coordenadas de cada vértice (interseção de duas retas) e o valor de $%s$:' % fo))
    rows = []
    for p, nm, zz in zip(V, names, zs):
        t = tight(lp, p)[:2]
        rows.append([r'\textbf{%s}' % nm if False else nm, '$%s$' % pt(p), '$%s$' % (r'\;\text{e}\;'.join(eqtxt(lp, i) for i in t)), '$%s=%s$' % (fo, dn(zz))])
    bi = [i for i, zz in enumerate(zs) if zz == best]
    B.append(Tab(['Vértice', '$(%s,%s)$' % tuple(lp.names), 'Retas que se cruzam', 'Valor da função objetivo'], rows, align='cccc', best=bi[0] if len(bi) == 1 else None))
    if len(opt_pts) == 1:
        p = opt_pts[0]
        B.append(P('O %s de $%s$ obtém-se no vértice %s: a solução ótima é $%s=%s$, $%s=%s$, com $%s^*=%s$.' % ('máximo' if lp.sense == 'max' else 'mínimo', fo, names[bi[0]], lp.names[0], dn(p[0]), lp.names[1], dn(p[1]), fo, dn(best))))
    else:
        a, b2 = opt_pts
        B.append(P('O %s de $%s$, $%s^*=%s$, é atingido em dois vértices, %s e %s: a reta da função objetivo é paralela a uma das fronteiras do CSA. Há **ótimos múltiplos**: todos os pontos do segmento $[%s%s]$ são soluções ótimas.' % ('máximo' if lp.sense == 'max' else 'mínimo', fo, fo, dn(best), names[bi[0]], names[bi[1]], names[bi[0]], names[bi[1]])))
    return B, info


def estado_blocks(lp, x, unidades=None):
    """lista de frases sobre o estado de cada restrição"""
    out = []
    for i, (st, var, v) in enumerate(estado(lp, x)):
        r = lin(lp.A[i], lp.names) + REL[lp.rel[i]] + dn(lp.b[i])
        if lp.rel[i] == '=':
            out.append('$%s$: saturada (é uma igualdade).' % r)
        elif v == 0:
            out.append('$%s$: saturada (%s $%s=0$).' % (r, 'folga' if lp.rel[i] == '<=' else 'excesso', var))
        else:
            out.append('$%s$: não saturada, com %s $%s=%s$.' % (r, 'folga' if lp.rel[i] == '<=' else 'excesso', var, dn(v)))
    return out


# ------------------------------------------------------------------ método algébrico
def algeb(lp, fo='z'):
    cols, al = algebraic(lp)
    N, m = len(cols), lp.m
    B = []
    B.append(P('Na forma standard há $n=%d$ variáveis e $m=%d$ equações. Cada solução básica obtém-se anulando $n-m=%d$ variáveis (as não básicas) e resolvendo o sistema nas restantes. O número máximo de soluções básicas é $C^{%d}_{%d}=%d$.' % (N, m, N - m, N, m, comb(N, m))))
    rows = []
    zs = [a['z'] for a in al if a['adm']]
    best = (max if lp.sense == 'max' else min)(zs)
    bi = None
    for k, a in enumerate(al):
        zero = [cols[j] for j in range(N) if j not in a['base']]
        if a['vals'] is None:
            rows.append(['$%s$' % ('='.join(zero) + '=0'), 'não existe (sistema sem solução única)', '', ''])
            continue
        vals = ', '.join('%s=%s' % (cols[j], dn(a['vals'][j])) for j in a['base'])
        adm = 'sim' if a['adm'] else 'não ($%s<0$)' % next(cols[j] for j in a['base'] if a['vals'][j] < 0)
        zt = '$%s$' % dn(a['z']) if a['adm'] else ''
        if a['adm'] and a['z'] == best and bi is None:
            bi = len(rows)
        rows.append(['$%s$' % ('='.join(zero) + '=0'), '$%s$' % vals, adm, zt])
    B.append(Tab(['Variáveis não básicas', 'Variáveis básicas', 'Admissível?', '$%s$' % fo], rows, align='cccc', best=bi, small=True))
    nadm = sum(1 for a in al if a['adm'])
    nbest = sum(1 for a in al if a['adm'] and a['z'] == best)
    a = next(a for a in al if a['adm'] and a['z'] == best)
    xs = ', '.join('$%s=%s$' % (lp.names[j], dn(a['vals'][j])) for j in range(lp.n))
    B.append(P('Há %d soluções básicas admissíveis (os vértices do CSA). A melhor é %s, com $%s^*=%s$.%s' % (nadm, xs, fo, dn(best), ' Como há %d soluções básicas admissíveis com o mesmo valor ótimo, há ótimos múltiplos.' % nbest if nbest > 1 else '')))
    return B, dict(al=al, cols=cols, best=best)


# ------------------------------------------------------------------ Simplex
def cztxt(v):
    return mv_tex(v)


def simplex_blocks(lp, fo='z', intro=True, verbose=True, name_rows=None):
    res = simplex(lp)
    Q = qjson(lp, res)
    B = []
    if intro:
        B.append(P('Escrevemos o problema na forma standard%s:' % (', com as variáveis artificiais necessárias (método do M grande)' if any(r != '<=' for r in lp.rel) else '')))
        B.append(Eq(std_model(lp, fo)))
    for k, (q, raw) in enumerate(zip(Q, res['quadros'])):
        last = (k == len(Q) - 1)
        opt = last and res['status'] == 'otimo'
        B.append(Quadro(q, {'entra': not last or res['status'] == 'ilimitado', 'ratios': not last or res['status'] == 'ilimitado', 'piv': not last, 'ops': not last, 'sol': opt},
                        caption='Quadro %d%s' % (k + 1, ' (ótimo)' if opt else '')))
        if not verbose and not last:
            continue
        if raw['entra'] is not None and raw['sai'] is not None:
            j = raw['entra']; i = raw['sai']
            nm_in = raw['cols'][j][0]; nm_out = raw['cols'][raw['basis'][i]][0]
            crit = 'o maior valor positivo' if lp.sense == 'max' else 'o valor mais negativo'
            rats = []
            for ii, rv in enumerate(raw['ratios']):
                if rv is not None:
                    rats.append(r'\frac{%s}{%s}=%s' % (dn(raw['rhs'][ii]), dn(raw['rows'][ii][j]), dn(rv)) if raw['rows'][ii][j] != 1 else r'%s' % dn(rv))
            ties = sum(1 for rv in raw['ratios'] if rv is not None and rv == raw['ratios'][i])
            pv = raw['rows'][i][j]
            txt = 'Entra na base $%s$, com $c_j-z_j=%s$ (%s). Rácios $r=\\text{RHS}/a_{ij}$ para os $a_{ij}>0$ da coluna de $%s$: $%s$. Sai $%s$ (menor rácio). O elemento redutor é $%s$.' % (
                nm_in, cztxt(raw['cz'][j]), crit, nm_in, ';\\ '.join(rats), nm_out, dn(pv))
            if ties > 1:
                txt += ' Há empate no menor rácio: a próxima solução terá uma variável básica nula (solução **degenerada**).'
            ops = raw.get('ops') or {}
            parts = []
            if pv != 1:
                parts.append('dividimos a linha de $%s$ por $%s$' % (nm_out, dn(pv)))
            if ops.get('mult'):
                parts.append('anulamos os outros elementos da coluna de $%s$ com os multiplicadores escritos à esquerda (multiplicar a nova linha do elemento redutor e somar à linha que muda)' % nm_in)
            if parts:
                txt += ' Para obter o quadro seguinte, ' + ' e '.join(parts) + '.'
            if raw.get('retira'):
                txt += ' A variável artificial $%s$ sai da base e não volta a ser precisa: a sua coluna retira-se do quadro seguinte.' % raw['retira']
            B.append(P(txt))
    st = res['status']
    if st == 'otimo':
        last = res['quadros'][-1]
        cmp_ = '\\leq0' if lp.sense == 'max' else '\\geq0'
        x = res['x']
        names = [c[0] for c in last['cols']]
        xs = ', '.join('$%s=%s$' % (nm, dn(v)) for nm, v in zip(names, x) if not nm.startswith('A'))
        txt = 'Todos os $c_j-z_j$ são $%s$: o quadro é ótimo. Solução ótima: %s, com $%s^*=%s$.' % (cmp_, xs, fo, dn(res['z']))
        if res.get('multiplas'):
            nb = [names[j] for j in range(len(names)) if j not in last['basis'] and last['cz'][j].iszero() and not names[j].startswith('A')]
            txt += ' Repare que $%s$ é não básica e tem $c_j-z_j=0$: se entrasse na base, $%s$ não mudava. Há **ótimos múltiplos**.' % (nb[0], fo)
        deg = [names[b] for i, b in enumerate(last['basis']) if last['rhs'][i] == 0]
        if deg:
            txt += ' A variável básica $%s$ vale zero: a solução é **degenerada**.' % deg[0]
        B.append(P(txt))
    elif st == 'ilimitado':
        j = res['quadros'][-1]['entra']
        B.append(P('A variável $%s$ devia entrar na base, mas nenhum elemento da sua coluna é positivo: não há rácios para calcular e $%s$ pode crescer sem limite. O problema não tem solução ótima finita (**solução ilimitada**).' % (res['quadros'][-1]['cols'][j][0], fo)))
    elif st == 'impossivel':
        B.append(P('O quadro satisfaz o critério de paragem, mas uma variável artificial continua na base com valor positivo. O problema é **impossível**: o conjunto das soluções admissíveis é vazio.'))
    return B, res


def sol_line(lp, res, fo='z'):
    if res['status'] != 'otimo':
        return {'ilimitado': 'Sem solução ótima finita (solução ilimitada).', 'impossivel': 'Problema impossível.'}[res['status']]
    s = ', '.join('$%s=%s$' % (nm, dn(v)) for nm, v in zip(lp.names, res['x'][:lp.n]))
    s += '; $%s^*=%s$' % (fo, dn(res['z']))
    if res.get('multiplas'):
        s += ' (ótimos múltiplos)'
    return s


# ------------------------------------------------------------------ dual
def dual_model(lp):
    d = dual(lp)
    return d, model(d, 'w')


def shadow(lp, res):
    return precos_sombra(lp, res)


def std_noart(lp, fo='z'):
    """forma standard só com folgas e excessos (sem artificiais)"""
    names = list(lp.names); cost = list(lp.c); rows = [list(r) for r in lp.A]
    for i, rl in enumerate(lp.rel):
        if rl == '=':
            continue
        names.append(('F_%d' if rl == '<=' else 'E_%d') % (i + 1)); cost.append(F(0))
        for k in range(lp.m):
            rows[k].append(F(0) if k != i else (F(1) if rl == '<=' else F(-1)))
    s = r'\begin{array}{ll}\text{%s} & %s=' % ('Max' if lp.sense == 'max' else 'Min', fo)
    s += ''.join(mvterm(MV(c), nm, j == 0) for j, (c, nm) in enumerate(zip(cost, names)))
    s += r'\\[3pt]\text{s.a.} & ' + r'\\ & '.join([lin(r, names) + '=' + dm(bb) for r, bb in zip(rows, lp.b)] + [','.join(names) + r'\geq0']) + r'\end{array}'
    return s


def path(lp, res=None):
    """pontos (variáveis de decisão) de cada quadro"""
    res = res or simplex(lp)
    out = []
    for q in res['quadros']:
        x = [F(0)] * lp.n
        for i, b in enumerate(q['basis']):
            if q['cols'][b][1] == 'x':
                x[[c[0] for c in q['cols']].index(q['cols'][b][0])] = q['rhs'][i]
        out.append(tuple(x))
    return out


def ptxt(p):
    return '(' + ','.join(dn(v) for v in p) + ')'
