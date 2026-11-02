"""Motor exato de Programação Linear para a sebenta e a apresentação do Tema 2.
Frações exatas (fractions.Fraction), quadros do Simplex com o método do M grande,
método algébrico (soluções básicas), resolução gráfica (2 variáveis) e problema dual.
Notação do professor: variáveis de folga F_i, de excesso E_i, artificiais A_i (i = número da restrição);
critério de entrada: maximização, cj - zj mais positivo; minimização, mais negativo; rácio mínimo para a saída.
"""
from fractions import Fraction as Fr
from itertools import combinations


def F(x):
    if isinstance(x, Fr):
        return x
    if isinstance(x, float):
        return Fr(x).limit_denominator(10000)
    if isinstance(x, str):
        return Fr(x.replace(',', '.'))
    return Fr(x)


class MV:
    """valor a + b*M (M muito grande)"""
    __slots__ = ('a', 'b')

    def __init__(self, a=0, b=0):
        self.a = F(a); self.b = F(b)

    def __add__(self, o):
        o = o if isinstance(o, MV) else MV(o)
        return MV(self.a + o.a, self.b + o.b)

    def __sub__(self, o):
        o = o if isinstance(o, MV) else MV(o)
        return MV(self.a - o.a, self.b - o.b)

    def __mul__(self, k):
        k = F(k)
        return MV(self.a * k, self.b * k)
    __rmul__ = __mul__

    def key(self):
        return (self.b, self.a)

    def __lt__(self, o): return self.key() < (o if isinstance(o, MV) else MV(o)).key()
    def __gt__(self, o): return self.key() > (o if isinstance(o, MV) else MV(o)).key()
    def __le__(self, o): return self.key() <= (o if isinstance(o, MV) else MV(o)).key()
    def __ge__(self, o): return self.key() >= (o if isinstance(o, MV) else MV(o)).key()

    def __eq__(self, o):
        o = o if isinstance(o, MV) else MV(o)
        return self.a == o.a and self.b == o.b

    def __hash__(self): return hash((self.a, self.b))

    def iszero(self): return self.a == 0 and self.b == 0

    def tex(self):
        return mv_tex(self)

    def __repr__(self): return 'MV(%s,%s)' % (self.a, self.b)


def ftex(x, sign_plus=False):
    """fração em LaTeX: -3/4 -> -\\frac{3}{4}"""
    x = F(x)
    s = '-' if x < 0 else ('+' if sign_plus else '')
    a = abs(x)
    if a.denominator == 1:
        return s + str(a.numerator)
    return s + r'\frac{%d}{%d}' % (a.numerator, a.denominator)


def fstr(x):
    x = F(x)
    if x.denominator == 1:
        return str(x.numerator)
    return '%d/%d' % (x.numerator, x.denominator)


def fdec(x, nd=2):
    """decimal com vírgula (para textos de gestão)"""
    x = F(x)
    if x.denominator == 1:
        return '{:,}'.format(x.numerator).replace(',', ' ')
    v = round(float(x), nd)
    s = ('%.' + str(nd) + 'f') % v
    s = s.rstrip('0').rstrip('.')
    return s.replace('.', ',')


def mv_tex(v):
    if not isinstance(v, MV):
        return ftex(v)
    a, b = v.a, v.b
    if b == 0:
        return ftex(a)
    if b == 1:
        mt = 'M'
    elif b == -1:
        mt = '-M'
    else:
        mt = ftex(b) + 'M'
    if a == 0:
        return mt
    return mt + ftex(a, sign_plus=True)


# ------------------------------------------------------------------ modelo
class LP:
    """sense: 'max' ou 'min'; c: lista; A: lista de linhas; rel: lista de '<=', '>=', '='; b: lista.
    names: nomes das variáveis de decisão (por omissão x1..xn)."""

    def __init__(self, sense, c, A, rel, b, names=None):
        self.sense = sense
        self.c = [F(x) for x in c]
        self.A = [[F(x) for x in r] for r in A]
        self.rel = list(rel)
        self.b = [F(x) for x in b]
        self.n = len(c)
        self.m = len(A)
        self.names = names or ['x_%d' % (j + 1) for j in range(self.n)]
        for i in range(self.m):
            if self.b[i] < 0:   # normaliza RHS negativo
                self.A[i] = [-x for x in self.A[i]]
                self.b[i] = -self.b[i]
                self.rel[i] = {'<=': '>=', '>=': '<=', '=': '='}[self.rel[i]]

    def tex(self, fo='z', align=True):
        """modelo em LaTeX (array)"""
        def lin(coefs):
            out = ''
            first = True
            for j, a in enumerate(coefs):
                if a == 0:
                    continue
                nm = self.names[j]
                if a == 1:
                    t = nm
                elif a == -1:
                    t = '-' + nm
                else:
                    t = ftex(a) + nm
                if not first and not t.startswith('-'):
                    t = '+' + t
                out += t
                first = False
            return out or '0'
        R = {'<=': r'\leq', '>=': r'\geq', '=': '='}
        s = (r'\text{%s } %s=%s\\' % ('Maximizar' if self.sense == 'max' else 'Minimizar', fo, lin(self.c)))
        s += r'\text{sujeito a: }\left\{\begin{array}{l}'
        s += r'\\'.join(lin(r) + R[rl] + ftex(bb) for r, rl, bb in zip(self.A, self.rel, self.b))
        s += r'\\' + ','.join(self.names) + r'\geq 0\end{array}\right.'
        return s


# ------------------------------------------------------------------ forma standard
def standard(lp):
    """devolve colunas (nomes, tipos), matriz, rhs, custos (MV), base inicial.
    Folgas F_i para <=, excesso E_i e artificial A_i para >=, artificial A_i para =."""
    cols = [(nm, 'x') for nm in lp.names]
    cost = [MV(c) for c in lp.c]
    rows = [r[:] for r in lp.A]
    basis = [None] * lp.m
    bigM = MV(0, -1) if lp.sense == 'max' else MV(0, 1)
    # folgas e excessos
    for i, rl in enumerate(lp.rel):
        if rl == '<=':
            cols.append(('F_%d' % (i + 1), 'F')); cost.append(MV(0))
            for k in range(lp.m):
                rows[k].append(F(1) if k == i else F(0))
            basis[i] = len(cols) - 1
        elif rl == '>=':
            cols.append(('E_%d' % (i + 1), 'E')); cost.append(MV(0))
            for k in range(lp.m):
                rows[k].append(F(-1) if k == i else F(0))
    for i, rl in enumerate(lp.rel):
        if rl in ('>=', '='):
            cols.append(('A_%d' % (i + 1), 'A')); cost.append(bigM)
            for k in range(lp.m):
                rows[k].append(F(1) if k == i else F(0))
            basis[i] = len(cols) - 1
    return dict(cols=cols, cost=cost, rows=rows, rhs=lp.b[:], basis=basis)


def zrow(T):
    """zj e cj - zj (MV) para cada coluna e valor da FO"""
    nc = len(T['cols'])
    z = []
    for j in range(nc):
        s = MV(0)
        for i, bi in enumerate(T['basis']):
            s = s + T['cost'][bi] * T['rows'][i][j]
        z.append(s)
    cz = [T['cost'][j] - z[j] for j in range(nc)]
    val = MV(0)
    for i, bi in enumerate(T['basis']):
        val = val + T['cost'][bi] * T['rhs'][i]
    return z, cz, val


def simplex(lp, maxit=20, drop_art=True):
    """devolve dict com a lista de quadros (iterações) e o resultado.
    Cada quadro: cols, rows, rhs, basis, cost, cz, val, entra, sai, ratios, piv, ops."""
    T = standard(lp)
    quadros = []
    status = None
    for it in range(maxit):
        z, cz, val = zrow(T)
        q = dict(cols=list(T['cols']), cost=list(T['cost']), rows=[r[:] for r in T['rows']], rhs=T['rhs'][:],
                 basis=T['basis'][:], cz=cz, val=val, entra=None, sai=None, ratios=None, piv=None)
        quadros.append(q)
        # variável que entra
        cand = [j for j in range(len(cz)) if j not in T['basis']]
        if lp.sense == 'max':
            best = max(cand, key=lambda j: cz[j].key())
            if not cz[best] > MV(0):
                status = 'otimo'; break
        else:
            best = min(cand, key=lambda j: cz[j].key())
            if not cz[best] < MV(0):
                status = 'otimo'; break
        # empate: escolhe a de menor índice (já garantido por max/min estável? garantir)
        if lp.sense == 'max':
            vbest = cz[best]
            best = min(j for j in cand if cz[j] == vbest)
        else:
            vbest = cz[best]
            best = min(j for j in cand if cz[j] == vbest)
        ratios = []
        for i in range(len(T['rows'])):
            a = T['rows'][i][best]
            ratios.append(T['rhs'][i] / a if a > 0 else None)
        valid = [r for r in ratios if r is not None]
        q['entra'] = best
        q['ratios'] = ratios
        if not valid:
            status = 'ilimitado'; break
        rmin = min(valid)
        r = min(i for i, x in enumerate(ratios) if x is not None and x == rmin)
        q['sai'] = r
        p = T['rows'][r][best]
        q['piv'] = (r, best)
        # operações: divide a linha do elemento redutor; multiplicadores (linha já dividida)
        newp = [x / p for x in T['rows'][r]]
        newb = T['rhs'][r] / p
        ops = {'div': {r: p}, 'mult': {}}
        newrows, newrhs = [], []
        for i in range(len(T['rows'])):
            if i == r:
                newrows.append(newp); newrhs.append(newb); continue
            mlt = -T['rows'][i][best]
            if mlt != 0:
                ops['mult'][i] = mlt
            newrows.append([x + mlt * y for x, y in zip(T['rows'][i], newp)])
            newrhs.append(T['rhs'][i] + mlt * newb)
        q['ops'] = ops
        T['rows'], T['rhs'] = newrows, newrhs
        leaving = T['basis'][r]
        T['basis'][r] = best
        if drop_art and T['cols'][leaving][1] == 'A':
            # a variável artificial que sai da base deixa de ser precisa: retira-se a coluna
            q['retira'] = T['cols'][leaving][0]
            T['cols'].pop(leaving); T['cost'].pop(leaving)
            T['rows'] = [row[:leaving] + row[leaving + 1:] for row in T['rows']]
            T['basis'] = [b - 1 if b > leaving else b for b in T['basis']]
    res = dict(quadros=quadros, status=status)
    last = quadros[-1]
    if status == 'otimo':
        art_in = [i for i, b in enumerate(last['basis']) if last['cols'][b][1] == 'A' and last['rhs'][i] != 0]
        if art_in:
            res['status'] = 'impossivel'
        else:
            x = [F(0)] * len(last['cols'])
            for i, b in enumerate(last['basis']):
                x[b] = last['rhs'][i]
            res['x'] = x
            res['z'] = last['val'].a
            nb = [j for j in range(len(last['cols'])) if j not in last['basis'] and last['cols'][j][1] != 'A']
            res['multiplas'] = any(last['cz'][j].iszero() for j in nb)
    return res


def solve_check(lp):
    """resolve com scipy (verificação independente, em vírgula flutuante)"""
    from scipy.optimize import linprog
    import numpy as np
    c = [float(x) for x in lp.c]
    if lp.sense == 'max':
        c = [-x for x in c]
    Aub, bub, Aeq, beq = [], [], [], []
    for r, rl, bb in zip(lp.A, lp.rel, lp.b):
        r = [float(x) for x in r]
        if rl == '<=':
            Aub.append(r); bub.append(float(bb))
        elif rl == '>=':
            Aub.append([-x for x in r]); bub.append(-float(bb))
        else:
            Aeq.append(r); beq.append(float(bb))
    out = linprog(c, A_ub=Aub or None, b_ub=bub or None, A_eq=Aeq or None, b_eq=beq or None,
                  bounds=[(0, None)] * lp.n, method='highs')
    if out.status == 2:
        return ('impossivel', None, None)
    if out.status == 3:
        return ('ilimitado', None, None)
    z = out.fun if lp.sense == 'min' else -out.fun
    return ('otimo', list(out.x), z)


# ------------------------------------------------------------------ método algébrico
def algebraic(lp):
    """todas as soluções básicas da forma standard (só folgas/excessos, sem artificiais).
    devolve (nomes, linhas) com linhas = dict(vals, admissivel, z, base)."""
    cols = list(lp.names)
    rows = [r[:] for r in lp.A]
    for i, rl in enumerate(lp.rel):
        if rl == '=':
            continue
        cols.append(('F_%d' if rl == '<=' else 'E_%d') % (i + 1))
        for k in range(lp.m):
            rows[k].append(F(0) if k != i else (F(1) if rl == '<=' else F(-1)))
    N = len(cols); m = lp.m
    out = []
    for base in combinations(range(N), m):
        B = [[rows[i][j] for j in base] for i in range(m)]
        sol = solve_square(B, lp.b[:])
        if sol is None:
            out.append(dict(base=base, vals=None, adm=False, z=None))
            continue
        vals = [F(0)] * N
        for k, j in enumerate(base):
            vals[j] = sol[k]
        adm = all(v >= 0 for v in vals)
        z = sum(lp.c[j] * vals[j] for j in range(lp.n)) if adm else None
        out.append(dict(base=base, vals=vals, adm=adm, z=z))
    return cols, out


def solve_square(B, b):
    n = len(B)
    M = [B[i][:] + [b[i]] for i in range(n)]
    for c in range(n):
        p = next((i for i in range(c, n) if M[i][c] != 0), None)
        if p is None:
            return None
        M[c], M[p] = M[p], M[c]
        pv = M[c][c]
        M[c] = [x / pv for x in M[c]]
        for i in range(n):
            if i != c and M[i][c] != 0:
                f = M[i][c]
                M[i] = [x - f * y for x, y in zip(M[i], M[c])]
    return [M[i][n] for i in range(n)]


# ------------------------------------------------------------------ resolução gráfica (2 variáveis)
def vertices(lp):
    """vértices do conjunto de soluções admissíveis (2 variáveis), ordenados no sentido anti-horário"""
    assert lp.n == 2
    lines = [(r[0], r[1], bb) for r, bb in zip(lp.A, lp.b)] + [(F(1), F(0), F(0)), (F(0), F(1), F(0))]
    pts = set()
    for (a1, b1, c1), (a2, b2, c2) in combinations(lines, 2):
        d = a1 * b2 - a2 * b1
        if d == 0:
            continue
        x = (c1 * b2 - c2 * b1) / d
        y = (a1 * c2 - a2 * c1) / d
        if feasible(lp, (x, y)):
            pts.add((x, y))
    pts = list(pts)
    if len(pts) > 2:
        import math
        cx = sum(float(p[0]) for p in pts) / len(pts); cy = sum(float(p[1]) for p in pts) / len(pts)
        pts.sort(key=lambda p: math.atan2(float(p[1]) - cy, float(p[0]) - cx))
    return pts


def feasible(lp, p):
    if p[0] < 0 or p[1] < 0:
        return False
    for r, rl, bb in zip(lp.A, lp.rel, lp.b):
        v = r[0] * p[0] + r[1] * p[1]
        if rl == '<=' and v > bb: return False
        if rl == '>=' and v < bb: return False
        if rl == '=' and v != bb: return False
    return True


def estado(lp, x):
    """estado de cada restrição técnica na solução x (lista de decisão)"""
    out = []
    for i, (r, rl, bb) in enumerate(zip(lp.A, lp.rel, lp.b)):
        v = sum(a * xx for a, xx in zip(r, x))
        if rl == '<=':
            fol = bb - v
            out.append(('saturada' if fol == 0 else 'não saturada', 'F_%d' % (i + 1), fol))
        elif rl == '>=':
            exc = v - bb
            out.append(('saturada' if exc == 0 else 'não saturada', 'E_%d' % (i + 1), exc))
        else:
            out.append(('saturada', None, F(0)))
    return out


# ------------------------------------------------------------------ dual
def dual(lp):
    """dual de um problema na forma canónica (max com <=, ou min com >=). Para formas mistas usa a regra geral.
    devolve LP do dual com variáveis y1..ym."""
    m, n = lp.m, lp.n
    At = [[lp.A[i][j] for i in range(m)] for j in range(n)]
    if lp.sense == 'max':
        rel = ['>='] * n
        d = LP('min', lp.b, At, rel, lp.c, names=['y_%d' % (i + 1) for i in range(m)])
    else:
        rel = ['<='] * n
        d = LP('max', lp.b, At, rel, lp.c, names=['y_%d' % (i + 1) for i in range(m)])
    return d


def precos_sombra(lp, res):
    """valores das variáveis duais lidos no quadro ótimo: -(cj - zj) das folgas (max, <=)
    ou -(cj - zj) do excesso ... devolvidos como valor marginal de cada restrição (aumento de z por unidade de b_i)."""
    last = res['quadros'][-1]
    out = []
    for i, rl in enumerate(lp.rel):
        if rl == '<=':
            j = next(k for k, c in enumerate(last['cols']) if c[0] == 'F_%d' % (i + 1))
            out.append(-last['cz'][j].a)
        elif rl == '>=':
            j = next(k for k, c in enumerate(last['cols']) if c[0] == 'E_%d' % (i + 1))
            out.append(last['cz'][j].a)
        else:
            out.append(None)
    return out
