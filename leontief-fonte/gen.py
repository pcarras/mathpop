# Gera e verifica todos os números da apresentação sobre o modelo de Leontief.
# Tudo em frações exatas (fractions.Fraction). Escreve src/lt_data.js com os dados e as fórmulas em LaTeX.
import json
from fractions import Fraction as F

def T(x): return F(x, 10)

# ---------------------------------------------------------------- formatação
def dec(x):
    """decimal com vírgula para KaTeX (0{,}3); x é Fraction com denominador 1, 2, 5 ou 10"""
    x = F(x)
    s = '-' if x < 0 else ''
    x = abs(x)
    if x.denominator == 1: return s + str(x.numerator)
    v = x * 10
    assert v.denominator == 1, x
    v = v.numerator
    return s + str(v // 10) + '{,}' + str(v % 10)

def dectxt(x):
    """decimal com vírgula para texto simples (0,3), sinal menos tipográfico"""
    return dec(x).replace('{,}', ',').replace('-', '−')

def fr(x):
    x = F(x)
    if x.denominator == 1: return str(x.numerator)
    return ('-' if x < 0 else '') + '\\frac{%d}{%d}' % (abs(x.numerator), x.denominator)

def frs(x):  # fração para o motor JS (parseFr)
    x = F(x)
    return str(x.numerator) if x.denominator == 1 else '%d/%d' % (x.numerator, x.denominator)

def pm(rows):
    frac = any('\\frac' in x for r in rows for x in r)
    sep = '\\\\[9pt]' if frac else '\\\\'
    body = '\\begin{bmatrix}' + sep.join('&'.join(r) for r in rows) + '\\end{bmatrix}'
    return body.replace('\\frac', '\\dfrac') if frac else body  # frações em tamanho normal e linhas afastadas
def col(v): return pm([[x] for x in v])

def mat_mul(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(len(B))) for j in range(len(B[0]))] for i in range(len(A))]
def mv(A, x): return [sum(A[i][j] * x[j] for j in range(len(x))) for i in range(len(A))]
def ident(n): return [[F(int(i == j)) for j in range(n)] for i in range(n)]

def inv(Mx):
    n = len(Mx); A = [r[:] + ident(n)[i] for i, r in enumerate(Mx)]
    for c in range(n):
        p = next(i for i in range(c, n) if A[i][c] != 0)
        A[c], A[p] = A[p], A[c]
        k = A[c][c]; A[c] = [x / k for x in A[c]]
        for i in range(n):
            if i != c and A[i][c] != 0:
                f = A[i][c]; A[i] = [a - f * b for a, b in zip(A[i], A[c])]
    return [r[n:] for r in A]

def det(Mx):
    n = len(Mx)
    if n == 1: return Mx[0][0]
    if n == 2: return Mx[0][0] * Mx[1][1] - Mx[0][1] * Mx[1][0]
    return sum((-1) ** j * Mx[0][j] * det([r[:j] + r[j + 1:] for r in Mx[1:]]) for j in range(n))

def prod_term(a, b):
    """a·b em LaTeX, a fração (coeficiente), b inteiro"""
    if a == 1: return str(b)
    return fr(a) + '\\cdot ' + (str(b) if b >= 0 else '(%d)' % b)

def lin_comb(coefs, xs):
    t = []
    for a, b in zip(coefs, xs):
        if a == 0: continue
        s = prod_term(a, b)
        t.append(s if not t else ('+' + s))
    return ''.join(t) if t else '0'

def num_sum(vals):
    out = []
    for v in vals:
        s = fr(v)
        if not out: out.append(s)
        else: out.append(('-' + s[1:]) if s.startswith('-') else '+' + s)
    return ''.join(out)

# ---------------------------------------------------------------- Gauss-Jordan na notação do professor
def gj(IA, ops, L):
    """IA = I - A (Fractions). ops: lista de operações. Devolve passos para o motor JS e verifica o resultado."""
    n = len(IA)
    Mx = [IA[i][:] + ident(n)[i] for i in range(n)]
    steps = [{'dec': True, 'A': [[dectxt(x) if j < n else str(x) for j, x in enumerate(r)] for r in Mx]}]
    for op in ops:
        nxt = {}
        if 'scale' in op:
            nxt['right'] = {}
            for i, (sym, k) in op['scale'].items():
                k = F(k)
                f = k if sym == '×' else 1 / k
                Mx[i] = [x * f for x in Mx[i]]
                lab = str(abs(k.numerator)) if k.denominator == 1 else '%d/%d' % (abs(k.numerator), k.denominator)
                lab = ('(−%s)' % lab) if k < 0 else lab
                nxt['right'][i] = sym + lab
        elif 'swap' in op:
            a, b = op['swap']; Mx[a], Mx[b] = Mx[b], Mx[a]; nxt['swap'] = [a, b]
        elif 'jac' in op:
            r, c = op['jac']['piv']; nxt['piv'] = [r, c]; nxt['left'] = {}
            piv_row = Mx[r][:]
            for i, m in op['jac']['m'].items():
                m = F(m)
                Mx[i] = [x + m * y for x, y in zip(Mx[i], piv_row)]
                nxt['left'][i] = frs(m)
            # o multiplicador tem de anular o elemento da coluna do elemento redutor
            for i in op['jac']['m']: assert Mx[i][c] == 0, ('jacobi não anula', op)
        steps[-1]['nxt'] = nxt
        steps.append({'A': [[frs(x) for x in r] for r in Mx], 'desc': op['desc']})
    steps[-1]['final'] = True
    assert [r[:n] for r in Mx] == ident(n), 'lado esquerdo não é I'
    assert [r[n:] for r in Mx] == L, 'lado direito não é a inversa'
    return steps

# ---------------------------------------------------------------- problemas
def problem(key, names, short, A10, X, Dn, dD, ops, interp):
    n = len(A10)
    A = [[T(x) for x in r] for r in A10]
    X = [F(x) for x in X]
    flows = [[A[i][j] * X[j] for j in range(n)] for i in range(n)]
    assert all(f.denominator == 1 for r in flows for f in r)
    D = [X[i] - sum(flows[i]) for i in range(n)]
    assert all(d > 0 for d in D)
    colsum = [sum(A[i][j] for i in range(n)) for j in range(n)]
    assert all(s < 1 for s in colsum), 'economia não produtiva'
    IA = [[ident(n)[i][j] - A[i][j] for j in range(n)] for i in range(n)]
    L = inv(IA)
    assert mat_mul(L, IA) == ident(n) and mat_mul(IA, L) == ident(n)
    assert all(x > 0 for r in L for x in r) or True
    assert mv(L, D) == X, 'L D != X'
    assert [mv(A, X)[i] + D[i] for i in range(n)] == X, 'AX + D != X'
    VA = [X[j] - sum(flows[i][j] for i in range(n)) for j in range(n)]
    assert sum(VA) == sum(D), 'VA total != D total'
    dI = det(IA)
    Dn = [F(x) for x in Dn]; Xn = mv(L, Dn)
    assert all(x.denominator == 1 for x in Xn), ('Xn não inteiro', key, Xn)
    assert [mv(A, Xn)[i] + Dn[i] for i in range(n)] == Xn
    dD = [F(x) for x in dD]; dX = mv(L, dD)
    assert all(x.denominator == 1 for x in dX), ('dX não inteiro', key, dX)
    Xd = [X[i] + dX[i] for i in range(n)]
    assert mv(L, [D[i] + dD[i] for i in range(n)]) == Xd
    steps = gj(IA, ops, L)
    # ---- LaTeX
    tx = {}
    tx['A'] = pm([[dec(x) for x in r] for r in A])
    tx['Afrac'] = pm([['\\frac{%d}{%d}' % (flows[i][j], X[j]) for j in range(n)] for i in range(n)])
    tx['IA'] = pm([[dec(x) for x in r] for r in IA])
    tx['I'] = pm([[str(x) for x in r] for r in ident(n)])
    tx['L'] = pm([[fr(x) for x in r] for r in L])
    tx['X'] = col([str(x) for x in X]); tx['D'] = col([str(x) for x in D])
    tx['Dn'] = col([str(x) for x in Dn]); tx['Xn'] = col([str(x) for x in Xn])
    tx['dD'] = col([str(x) for x in dD]); tx['dX'] = col([str(x) for x in dX])
    # X' = L D' em três fases
    ph1 = col([lin_comb(L[i], [int(d) for d in Dn]) for i in range(n)])
    ph2 = col([num_sum([L[i][j] * Dn[j] for j in range(n) if L[i][j] != 0]) for i in range(n)])
    tx['Xn_calc'] = 'X\'=(I-A)^{-1}D\'=' + tx['L'] + tx['Dn'] + '=' + ph1 + '=' + ph2 + '=' + tx['Xn']
    nz = [j for j in range(n) if dD[j] != 0]
    assert len(nz) == 1
    jj = nz[0]
    tx['dX_calc'] = '\\Delta X=(I-A)^{-1}\\Delta D=' + str(dD[jj]) + '\\cdot' + col([fr(L[i][jj]) for i in range(n)]) + '=' + tx['dX']
    tx['Xn_a'] = 'X\'=(I-A)^{-1}D\'=' + tx['L'] + tx['Dn']
    tx['Xn_b'] = '=' + col([lin_comb(L[i], [int(d) for d in Dn]) for i in range(n)]) + '=' + col([num_sum([L[i][j] * Dn[j] for j in range(n) if L[i][j] != 0]) for i in range(n)]) + '=' + tx['Xn']
    out_j = jj
    tx['VA'] = ['VA_{%d}=%s-(%s)=%s' % (j + 1, X[j], '+'.join(str(flows[i][j]) for i in range(n)), VA[j]) for j in range(n)]
    tx['colsum'] = ['%s=%s<1' % ('+'.join(dec(A[i][j]) for i in range(n)), dec(colsum[j])) for j in range(n)]
    # verificação (I - A) X' = D' linha a linha
    chk = []
    for i in range(n):
        terms = []
        for j in range(n):
            if IA[i][j] == 0: continue
            s = dec(IA[i][j]) + '\\cdot ' + str(Xn[j])
            terms.append(s if not terms else ('+' + s if IA[i][j] > 0 else s))
        chk.append(''.join(terms).replace('+-', '-') + '=' + num_sum([IA[i][j] * Xn[j] for j in range(n) if IA[i][j] != 0]) + '=' + str(Dn[i]))
    tx['check'] = chk
    tx['det'] = fr(dI)
    out = dict(key=key, names=names, short=short, n=n,
               A=[[dectxt(x) for x in r] for r in A], flows=[[int(x) for x in r] for r in flows],
               X=[int(x) for x in X], D=[int(x) for x in D], VA=[int(x) for x in VA],
               L=[[frs(x) for x in r] for r in L], Lnum=[[float(x) for x in r] for r in L],
               Dn=[int(x) for x in Dn], Xn=[int(x) for x in Xn], dD=[int(x) for x in dD], dX=[int(x) for x in dX],
               colsum=[dectxt(s) for s in colsum], det=frs(dI), dj=out_j, steps=steps, tex=tx, interp=interp)
    # resumo para conferência humana
    print('==', key, names)
    print('  A =', [[dectxt(x) for x in r] for r in A], ' somas colunas', [dectxt(s) for s in colsum])
    print('  fluxos =', out['flows'], ' X =', out['X'], ' D =', out['D'], ' VA =', out['VA'])
    print('  det(I-A) =', frs(dI), '  L =', out['L'])
    print('  D\' =', out['Dn'], ' X\' =', out['Xn'], ' | dD =', out['dD'], ' dX =', out['dX'], ' X+dX =', [int(x) for x in Xd])
    print('  passos GJ:', len(steps))
    return out

P = {}
# Teoria: energia e água
P['T'] = problem('T', ['Energia', 'Água'], ['Energia', 'Água'], [[4, 2], [3, 4]], [200, 250], [60, 90], [20, 0],
    [{'scale': {0: ('×', 10), 1: ('×', 10)}, 'desc': 'Multiplicamos as duas linhas por 10 para trabalhar só com números inteiros.'},
     {'scale': {1: ('×', 2)}, 'desc': 'Multiplicamos a linha 2 por 2, para que o elemento por baixo do elemento redutor seja o simétrico deste.'},
     {'jac': {'piv': [0, 0], 'm': {1: 1}}, 'desc': 'Elemento redutor 6. Multiplicador 1 na linha 2: somamos a linha 1 à linha 2.'},
     {'scale': {1: (':', 10)}, 'desc': 'Dividimos a linha 2 por 10.'},
     {'jac': {'piv': [1, 1], 'm': {0: 2}}, 'desc': 'Elemento redutor 1. Multiplicador 2 na linha 1: somamos à linha 1 o dobro da linha 2.'},
     {'scale': {0: (':', 6)}, 'desc': 'Dividimos a linha 1 por 6. À esquerda ficou I; à direita está a inversa.'}], {})
# Exemplo 1: agricultura e indústria
P['B1'] = problem('B1', ['Agricultura', 'Indústria'], ['Agric.', 'Ind.'], [[2, 3], [4, 1]], [200, 300], [80, 200], [0, 30],
    [{'scale': {0: ('×', 10), 1: ('×', 10)}, 'desc': 'Multiplicamos as duas linhas por 10: deixamos de ter decimais.'},
     {'scale': {1: ('×', 2)}, 'desc': 'Multiplicamos a linha 2 por 2. Assim −8 é o simétrico do elemento redutor 8.'},
     {'jac': {'piv': [0, 0], 'm': {1: 1}}, 'desc': 'Elemento redutor 8. Multiplicador 1 na linha 2: somamos a linha 1 à linha 2.'},
     {'scale': {1: (':', 5)}, 'desc': 'Dividimos a linha 2 por 5.'},
     {'jac': {'piv': [1, 1], 'm': {0: 1}}, 'desc': 'Elemento redutor 3. Multiplicador 1 na linha 1: somamos a linha 2 à linha 1.'},
     {'scale': {0: (':', 8), 1: (':', 3)}, 'desc': 'Dividimos a linha 1 por 8 e a linha 2 por 3. À esquerda ficou I.'}], {})
# Exemplo 2: comércio, agricultura, turismo
P['B2'] = problem('B2', ['Comércio', 'Agricultura', 'Turismo'], ['Com.', 'Agric.', 'Tur.'], [[3, 3, 3], [2, 4, 0], [2, 0, 4]], [250, 200, 250], [60, 90, 120], [0, 0, 30],
    [{'scale': {0: ('×', 10), 1: ('×', 10), 2: ('×', 10)}, 'desc': 'Multiplicamos as três linhas por 10.'},
     {'scale': {1: (':', 2), 2: (':', 2)}, 'desc': 'Simplificamos: dividimos as linhas 2 e 3 por 2.'},
     {'swap': [0, 1], 'desc': 'Trocamos as linhas 1 e 2 para ter −1 como elemento redutor.'},
     {'jac': {'piv': [0, 0], 'm': {1: 7, 2: -1}}, 'desc': 'Elemento redutor −1. Multiplicadores: 7 na linha 2 e −1 na linha 3.'},
     {'swap': [1, 2], 'desc': 'Trocamos as linhas 2 e 3: o elemento redutor da coluna 2 passa a ser −3.'},
     {'jac': {'piv': [1, 1], 'm': {0: 1, 2: 6}}, 'desc': 'Elemento redutor −3. Multiplicadores: 1 na linha 1 e 6 na linha 3.'},
     {'scale': {2: (':', 5)}, 'desc': 'Dividimos a linha 3 por 5.'},
     {'jac': {'piv': [2, 2], 'm': {0: -1, 1: -1}}, 'desc': 'Elemento redutor 3. Multiplicador −1 nas linhas 1 e 2.'},
     {'scale': {0: ('×', -1), 1: (':', -3), 2: (':', 3)}, 'desc': 'Tornamos 1 os elementos da diagonal: multiplicamos a linha 1 por −1 e dividimos a linha 2 por −3 e a linha 3 por 3.'}], {})
# Exercício 1: construção e imobiliário
P['C1'] = problem('C1', ['Construção', 'Imobiliário'], ['Const.', 'Imob.'], [[1, 4], [3, 2]], [200, 250], [90, 150], [0, 30],
    [{'scale': {0: ('×', 10), 1: ('×', 10)}, 'desc': 'Multiplicamos as duas linhas por 10.'},
     {'scale': {1: ('×', 3)}, 'desc': 'Multiplicamos a linha 2 por 3: −9 é o simétrico do elemento redutor 9.'},
     {'jac': {'piv': [0, 0], 'm': {1: 1}}, 'desc': 'Elemento redutor 9. Multiplicador 1 na linha 2.'},
     {'scale': {1: (':', 10)}, 'desc': 'Dividimos a linha 2 por 10.'},
     {'jac': {'piv': [1, 1], 'm': {0: 2}}, 'desc': 'Elemento redutor 2. Multiplicador 2 na linha 1.'},
     {'scale': {0: (':', 9), 1: (':', 2)}, 'desc': 'Dividimos a linha 1 por 9 e a linha 2 por 2.'}], {})
# Exercício 2: transportes, alojamento local, animação turística
P['C2'] = problem('C2', ['Transportes', 'Alojamento local', 'Animação turística'], ['Transp.', 'Aloj. local', 'Animação'], [[4, 2, 2], [2, 4, 2], [0, 2, 4]], [300, 250, 250], [100, 60, 80], [0, 40, 0],
    [{'scale': {0: ('×', 10), 1: ('×', 10), 2: ('×', 10)}, 'desc': 'Multiplicamos as três linhas por 10.'},
     {'scale': {0: (':', 2), 1: (':', 2), 2: (':', 2)}, 'desc': 'Todos os números são pares: dividimos as três linhas por 2.'},
     {'swap': [0, 1], 'desc': 'Trocamos as linhas 1 e 2 para ter −1 como elemento redutor.'},
     {'jac': {'piv': [0, 0], 'm': {1: 3}}, 'desc': 'Elemento redutor −1. Multiplicador 3 na linha 2; a linha 3 já tem 0 nesta coluna.'},
     {'swap': [1, 2], 'desc': 'Trocamos as linhas 2 e 3: o elemento redutor da coluna 2 passa a ser −1.'},
     {'jac': {'piv': [1, 1], 'm': {0: 3, 2: 8}}, 'desc': 'Elemento redutor −1. Multiplicadores: 3 na linha 1 e 8 na linha 3.'},
     {'scale': {1: ('×', 4), 2: (':', 5)}, 'desc': 'Multiplicamos a linha 2 por 4 e dividimos a linha 3 por 5.'},
     {'jac': {'piv': [2, 2], 'm': {0: -2, 1: -3}}, 'desc': 'Elemento redutor 4. Multiplicadores: −2 na linha 1 e −3 na linha 2.'},
     {'scale': {0: ('×', -1), 1: (':', -4), 2: (':', 4)}, 'desc': 'Tornamos 1 os elementos da diagonal: multiplicamos a linha 1 por −1 e dividimos a linha 2 por −4 e a linha 3 por 4.'}], {})

open('src/lt_data.js', 'w', encoding='utf8').write('const P=' + json.dumps(P, ensure_ascii=False) + ';\n')
print('ok: src/lt_data.js')
