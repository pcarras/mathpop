"""Partes II (exercícios resolvidos), III (exercícios propostos e soluções) e V (resoluções detalhadas dos propostos)."""
import os, sys
from auto import *
_cwd = os.getcwd(); os.chdir('/home/claude/t2deck/pl')
import content as C
os.chdir(_cwd)


def conv(st, lp=None):
    """blocos do banco de exercícios da apresentação -> nós da sebenta"""
    out = []
    for b in st:
        if b['t'] == 'p':
            out.append(P(b['x']))
        elif b['t'] == 'eq':
            out.append(Eq(model(lp)) if lp is not None else Eq(*b['x']))
        elif b['t'] == 'ul':
            out.append(Ul(b['x'], 'alpha' if b['s'] == 'alpha' else 'bullet'))
        elif b['t'] == 'tab':
            out.append(Tab(b['h'], b['r']))
    return out


def vars_txt(*items):
    return P('**Variáveis de decisão:** ' + '; '.join(items) + '.')


def alinea(letra, blocks):
    return [P('**%s)**' % letra)] + blocks


def estado_ul(lp, res):
    return Ul(estado_blocks(lp, res['x'][:lp.n]))


def ps_ul(lp, res, nomes, unid, obj='o lucro', moeda='€'):
    ps = precos_sombra(lp, res)
    out = []
    for nm, u, v in zip(nomes, unid, ps):
        if v == 0:
            out.append('%s: preço-sombra 0 (a restrição não está saturada; mais %s não melhora %s).' % (nm, u, obj))
        else:
            out.append('%s: preço-sombra $%s$ %s por %s.' % (nm, dn(abs(v)), moeda, u))
    return Ul(out)


# ======================================================================= propostos da apresentação (1 a 29)
EXD = {e['n']: e for e in C.EX}
LPS = {1: C.pastel, 2: C.banh, 3: C.dieta, 4: C.brinq, 5: C.tur, 6: C.racao, 7: C.pastel, 8: C.dieta, 9: C.banh, 10: C.tur, 11: C.q2,
       13: C.banh, 14: C.gel, 15: C.small, 17: C.pastel, 18: C.brinq, 19: C.tur, 20: C.f21, 21: C.fr, 22: C.cint, 23: C.mult,
       24: C.pastel, 25: C.dieta, 26: C.brinq, 27: C.tur, 28: C.tur, 29: C.brinq}

FIGBOX = {'pastel': (32, 30), 'dieta': (520, 520), 'banh': (100, 100), 'tur': (130, 130), 'q2': (9, 9), 'gel': (26, 26)}


def r1():
    lp = C.pastel
    return [vars_txt('$x_1$ = dúzias de bolos A', '$x_2$ = dúzias de bolos B'), P('O lucro é $20x_1+30x_2$ euros. Cada recurso dá uma restrição: farinha $3x_1+6x_2\\leq150$, açúcar $x_1+0{,}5x_2\\leq20$, manteiga $x_1+x_2\\leq30$ (em kg).'), Eq(model(lp))]


def r2():
    return [vars_txt('$x_1$ = banheiras redondas', '$x_2$ = banheiras retangulares'),
            P('Custo: $60x_1+30x_2$. Fabrico: no máximo 90 horas, $x_1+x_2\\leq90$. Acabamento: pelo menos 80 horas ocupadas, $x_1+2x_2\\geq80$. Entre 40 e 60 redondas dá duas restrições, $x_1\\geq40$ e $x_1\\leq60$.'), Eq(model(C.banh))]


def r3():
    return [vars_txt('$x_1$ = unidades de P1', '$x_2$ = unidades de P2'), P('Cada nutriente dá uma exigência mínima, lida por colunas na tabela: vitaminas $2x_1+x_2\\geq420$, minerais $x_1+2x_2\\geq500$, calorias $5x_1+6x_2\\geq2100$. O custo é $4x_1+6x_2$.'), Eq(model(C.dieta))]


def r4():
    return [vars_txt('$x_1$ = barcos', '$x_2$ = aviões', '$x_3$ = bonecas (por semana)'),
            P('As horas disponíveis são $8\\cdot36=288$ na carpintaria e $10\\cdot36=360$ nos acabamentos.'), Eq(model(C.brinq))]


def r5():
    return [vars_txt('$x_1$ = clientes do passeio "Serra"', '$x_2$ = clientes do passeio "Costa" (por semana)'),
            P('Lugares no autocarro: $x_1+x_2\\leq120$. Horas de guia: $2x_1+4x_2\\leq360$. Licença do barco: $x_2\\leq80$.'), Eq(model(C.tur))]


def r6():
    return [vars_txt('$x$ = kg de milho', '$y$ = kg de soja (por dia)'),
            P('Custo: $0{,}3x+0{,}9y$. Quantidade: $x+y\\geq800$. A proteína da ração, $0{,}09x+0{,}6y$, tem de ser pelo menos 30 % do total, $0{,}3(x+y)$; passando tudo para a esquerda, $-0{,}21x+0{,}3y\\geq0$. A fibra, $0{,}02x+0{,}06y$, não pode passar de $0{,}05(x+y)$, o que dá $-0{,}03x+0{,}01y\\leq0$.'),
            Eq(model(C.racao))]


def r7():
    b, i = graf(C.pastel, 'p7', (32, 32), labels=['$3x_1+6x_2=150$', '$x_1+0{,}5x_2=20$', '$x_1+x_2=30$'], labpos=[(1, 22.5), (17.2, 12), (2, 29)], ticks=(range(0, 33, 5), range(0, 33, 5)))
    return b + [P('Em $(10,20)$ as três retas cruzam-se: $3\\cdot10+6\\cdot20=150$, $10+0{,}5\\cdot20=20$ e $10+20=30$. As três restrições ficam saturadas, o que torna a solução **degenerada** (num quadro do Simplex uma variável básica será nula). O pasteleiro deve fazer 10 dúzias de A e 20 de B, com lucro de 800 €.')]


def r8():
    b, i = graf(C.dieta, 'p8', (520, 520), labels=['$2x_1+x_2=420$', '$x_1+2x_2=500$', '$5x_1+6x_2=2100$'], labpos=[(60, 330), (330, 70), (20, 380)], ticks=(range(0, 521, 100), range(0, 521, 100)))
    d2 = LP('min', [Fr(18, 5), Fr(36, 5)], C.dieta.A, C.dieta.rel, C.dieta.b)
    b2, i2 = graf(d2, 'p8b', (520, 520), labels=['$2x_1+x_2=420$', '$x_1+2x_2=500$', '$5x_1+6x_2=2100$'], labpos=[(60, 330), (330, 70), (20, 380)], intro=False, ticks=(range(0, 521, 100), range(0, 521, 100)))
    return alinea('a', b + [P('O António deve comprar 300 unidades de P1 e 100 de P2, com custo mínimo de 1800 €. Repare que o CSA é ilimitado, mas o mínimo existe.')]) + alinea('b', [
        P('Com os novos custos, $z=3{,}6x_1+7{,}2x_2$, as retas de nível têm declive $-\\frac{3{,}6}{7{,}2}=-\\frac12$, igual ao da reta $x_1+2x_2=500$.')] + b2)


def r9():
    b, i = graf(C.banh, 'p9', (100, 100), labels=['$x_1+x_2=90$', '$x_1+2x_2=80$', '$x_1=40$', '$x_1=60$'], labpos=[(8, 84), (2, 41), (41, 92), (61, 92)])
    r = simplex(C.banh)
    return b + [P('Estado das restrições na solução ótima $(40,20)$:'), estado_ul(C.banh, r)]


def r10():
    b, i = graf(C.tur, 'p10', (130, 130), labels=['$x_1+x_2=120$', '$2x_1+4x_2=360$', '$x_2=80$'], labpos=[(8, 115), (90, 42), (95, 83)])
    r = simplex(C.tur)
    return b + [P('Estado das restrições:'), estado_ul(C.tur, r), P('**Interpretação:** a agência enche o autocarro e usa todas as horas de guia; a licença do barco permitia mais 20 clientes no "Costa", mas não há guias para eles.')]


def r11():
    b, i = graf(C.q2, 'p11', (9, 9), labels=['$-x_1+x_2=4$', '$x_1=1$', '$x_1+x_2=8$', '$x_2=2$'], labpos=[(0.2, 4.4), (1.05, 8.4), (6.3, 1.2), (7.2, 2.15)])
    r = simplex(C.q2)
    q2b = LP('max', [2, 2], C.q2.A, C.q2.rel, C.q2.b)
    b2, _ = graf(q2b, 'p11b', (9, 9), labels=['$-x_1+x_2=4$', '$x_1=1$', '$x_1+x_2=8$', '$x_2=2$'], labpos=[(0.2, 4.4), (1.05, 8.4), (6.3, 1.2), (7.2, 2.15)], intro=False)
    return alinea('a', b) + alinea('b', [estado_ul(C.q2, r)]) + alinea('c', [P('Sim. Com $z=2x_1+2x_2$ as retas de nível ficam paralelas a $x_1+x_2=8$, que é um lado do CSA:')] + b2)


def r12():
    lp_figure('p12a', C.ilim, (8, 8), labels=['$x_1-x_2=2$', '$x_1=1$'], labpos=[(4.6, 1.8), (1.1, 7.2)], size=(3.6, 3.1), iso=6)
    lp_figure('p12b', C.imp, (7, 5), labels=['$x_1+x_2=2$', '$x_1+2x_2=6$'], labpos=[(0.2, 1.9), (2.5, 1.9)], size=(3.6, 3.1), csa=False)
    return alinea('a', [Fig('p12a', 'CSA ilimitado; a reta $x_1+x_2=k$ sobe sem limite.', 0.5),
                        P('O CSA é a região acima de $x_2=x_1-2$ e à direita de $x_1=1$, ilimitada para cima. A função $z=x_1+x_2$ cresce nessa direção (por exemplo, $(1,k)$ é admissível para todo o $k\\geq0$ e dá $z=1+k$). **Sem solução ótima.**')]) + \
        alinea('b', [Fig('p12b', 'Os dois semiplanos não se intersetam no primeiro quadrante.', 0.5),
                     P('Os pontos com $x_1+x_2\\leq2$ e $x_1,x_2\\geq0$ têm $x_1+2x_2\\leq2(x_1+x_2)\\leq4<6$. Não há soluções admissíveis: o problema é **impossível**.')])


def r13():
    return [Eq(std_noart(C.banh)), Ul(['$F_1$ e $F_4$: variáveis de folga das restrições $\\leq$ (horas de fabrico por usar; redondas que ainda se podiam fazer até 60).',
                                                                            '$E_2$ e $E_3$: variáveis de excesso das restrições $\\geq$ (horas de acabamento acima de 80; redondas acima de 40).']),
            P('Para resolver pelo Simplex seriam ainda precisas variáveis artificiais $A_2$ e $A_3$ nas restrições $\\geq$ (capítulo 6).')]


def r14():
    r = simplex(C.gel)
    b, _ = algeb(C.gel)
    return alinea('a', [vars_txt('$x_1$ = cones de cassata', '$x_2$ = cones de pistácio (por hora)'), Eq(model(C.gel))]) + alinea('b', [Eq(std_model(C.gel))] + b) + alinea('c', [estado_ul(C.gel, r)])


def r15():
    b, _ = algeb(C.small)
    return [Eq(std_model(C.small))] + b


def r16():
    return [Ul(['**Verdadeira.** Admissível quer dizer que cumpre todas as restrições, técnicas e de sinal.',
                '**Verdadeira.** Na forma standard há $2+3=5$ variáveis e 3 equações; o número máximo de soluções básicas é $C^5_3=\\frac{5!}{3!\\,2!}=10$.',
                '**Falsa.** A variável que sai é sempre a do menor rácio $\\text{RHS}/a_{ij}$ (com $a_{ij}>0$), em Max e em Min. Só a regra de entrada muda: maior $c_j-z_j$ positivo em Max, mais negativo em Min.'], 'alpha')]


def r17():
    b, r = simplex_blocks(C.pastel)
    return b + [P('**Confirmação:** é a solução $(10,20)$ obtida graficamente no exercício 7. A degenerescência vê-se no empate dos rácios e na variável básica nula.')]


def r18():
    b, r = simplex_blocks(C.brinq)
    return b + [P('**Caracterização:** fazem-se 36 barcos e 108 aviões por semana e nenhuma boneca, com lucro de 6120 u.m. As folgas $F_1$ e $F_2$ são nulas: carpintaria e acabamentos ficam esgotados.')]


def r19():
    b, r = simplex_blocks(C.tur)
    pts = path(C.tur, r)
    zs = [C.tur.c[0] * p[0] + C.tur.c[1] * p[1] for p in pts]
    return b + [P('**Comparação com o gráfico do exercício 10:** os quadros correspondem aos pontos %s, com $z$ igual a %s. São vértices do CSA, cada um vizinho do anterior (ligados por um lado do CSA), e $z$ aumenta a cada passo até ao ótimo $(60,60)$, com $z^*=6000$ €.' % (', '.join('$%s$' % ptxt(p) for p in pts), ', '.join('$%s$' % dn(z) for z in zs)))]


def r20():
    b, r = simplex_blocks(C.f21, intro=False)
    return alinea('a', [vars_txt('$x_1$ = unidades do produto 1', '$x_2$ = unidades do produto 2 (por dia)'), Eq(model(C.f21))]) + \
        alinea('b', [Eq(std_model(C.f21)), Ul(classify(C.f21))]) + alinea('c', b) + \
        alinea('d', [estado_ul(C.f21, r), P('**Interpretação:** produzem-se 150 unidades do produto 1 e 70 do produto 2, ao custo mínimo de 800 €. A operação A fica com 120 minutos livres; as operações B e C são ocupadas exatamente no mínimo exigido.')])


def r21():
    b, r = simplex_blocks(C.fr, intro=False)
    return alinea('a', [Eq(std_model(C.fr)), Ul(classify(C.fr))]) + alinea('b', b) + \
        alinea('c', [P('Na solução ótima $x_1=2$, $x_2=0$, $x_3=0$ temos $x_1+x_2-x_3=2$, por isso a solução continua admissível com a igualdade. Como o novo CSA está contido no antigo e a solução antiga lhe pertence, continua ótima: $z^*=2$.')])


def r22():
    b, r = simplex_blocks(C.cint, intro=False)
    return alinea('a', [vars_txt('$x_1$ = cintos A', '$x_2$ = cintos B (por dia)'), P('Se um cinto A demora o dobro de um cinto B e por dia se fariam 1000 cintos B, o tempo dá $2x_1+x_2\\leq1000$ (em "tempos de cinto B"). Cabedal: $x_1+x_2\\leq800$. Fivelas: $x_1\\leq400$ e $x_2\\leq700$.'), Eq(model(C.cint))]) + \
        alinea('b', [Eq(std_model(C.cint))] + b + [P('Produzem-se %s cintos A e %s cintos B por dia, com margem máxima de $1{,}6\\cdot%s+0{,}7\\cdot%s=%s$ €.' % (dn(r['x'][0]), dn(r['x'][1]), dn(r['x'][0]), dn(r['x'][1]), dm(r['z'])))])


def r23():
    b, r = simplex_blocks(C.mult)
    last = r['quadros'][-1]
    return b + [P('Para obter a outra solução ótima fazemos entrar $x_1$ (com $c_j-z_j=0$). O único rácio válido é o da linha de $F_2$, porque na linha de $x_2$ o elemento é $\\frac12$ e na de $F_2$ é 1: rácios $\\frac{4}{\\frac12}=8$ e $\\frac{6}{1}=6$; sai $F_2$. O novo vértice é $(6,1)$, com $z=2\\cdot6+4\\cdot1=16$. Todos os pontos do segmento entre $(0,4)$ e $(6,1)$ são ótimos.')]


def r24():
    d, t = dual_model(C.pastel)
    r = simplex(C.pastel)
    return [P('O primal é um problema de Max com restrições $\\leq$ (forma canónica). Transpondo a matriz dos coeficientes e trocando os papéis de $b$ e $c$:'), Eq(t),
            P('$y_1$, $y_2$ e $y_3$ são os valores marginais (preços-sombra) de um kg de farinha, de açúcar e de manteiga: quanto aumentaria o lucro máximo com mais um kg de cada.')]


def r25():
    d, t = dual_model(C.dieta)
    b, rd = simplex_blocks(d, fo='w')
    return [Eq(t)] + b + [P('$w^*=1800=z^*$, como diz o teorema da dualidade forte. Os valores $y_1=0$, $y_2=\\frac32$, $y_3=\\frac12$ são os custos marginais das exigências: mais uma unidade de minerais custaria 1,50 € e mais uma caloria 0,50 €; a exigência de vitaminas não está saturada ($y_1=0$).')]


def r26():
    r = simplex(C.brinq)
    q = qjson(C.brinq, r)[-1]
    return [P('No quadro ótimo do exercício 18:'), Quadro(q, {'sol': 1}, 'Quadro ótimo dos brinquedos'),
            P('Os $c_j-z_j$ das folgas são $%s$ (carpintaria) e $%s$ (acabamentos). Os preços-sombra são os simétricos:' % tuple(mv_tex(q2) for q2 in [r['quadros'][-1]['cz'][3], r['quadros'][-1]['cz'][4]])),
            ps_ul(C.brinq, r, ['Carpintaria', 'Acabamentos'], ['hora', 'hora'], moeda='u.m.'),
            P('A empresa estaria disposta a pagar, no máximo, esses valores por uma hora extra em cada secção (além do custo normal já incluído no lucro).')]


def r27():
    r = simplex(C.tur)
    q = qjson(C.tur, r)[-1]
    return [Quadro(q, {'sol': 1}, 'Quadro ótimo da agência de viagens'),
            ps_ul(C.tur, r, ['Lugares no autocarro', 'Horas de guia', 'Licença do barco'], ['lugar', 'hora', 'cliente']),
            P('A licença do barco tem preço-sombra 0 porque não está esgotada (folga $F_3=20$).')]


def r28():
    return [P('Uma organização possível da folha:'),
            Tab(['', 'A', 'B', 'C', 'D', 'E'], [['1', '', 'Serra', 'Costa', 'Usado', 'Limite'], ['2', 'Clientes', '0', '0', '', ''],
                                              ['3', 'Margem', '40', '60', '`=SOMARPRODUTO(B2:C2;B3:C3)`', ''],
                                              ['4', 'Autocarro', '1', '1', '`=SOMARPRODUTO($B$2:$C$2;B4:C4)`', '120'],
                                              ['5', 'Guias', '2', '4', '`=SOMARPRODUTO($B$2:$C$2;B5:C5)`', '360'],
                                              ['6', 'Barco', '0', '1', '`=SOMARPRODUTO($B$2:$C$2;B6:C6)`', '80']], align='llllll', small=True),
            P('No Solver: Definir Objetivo \\$D\\$3, Máximo; Alterando as Células de Variável \\$B\\$2:\\$C\\$2; restrição \\$D\\$4:\\$D\\$6 <= \\$E\\$4:\\$E\\$6; variáveis não negativas; método LP Simplex.'),
            P('O Solver devolve 60 clientes em cada passeio e 6000 € de margem, a solução do exercício 10. No relatório de Sensibilidade, os preços-sombra são 20 € (autocarro), 10 € (horas de guia) e 0 € (barco), os mesmos do exercício 27.')]


def r29():
    code = r'''from scipy.optimize import linprog

c = [-20, -50, -30]               # Max -> Min: trocar o sinal
A = [[2, 2, 1],                   # carpintaria
     [1, 3, 2]]                   # acabamentos
b = [288, 360]
res = linprog(c, A_ub=A, b_ub=b, bounds=[(0, None)] * 3, method="highs")
print("produção:", res.x)                     # [ 36. 108.   0.]
print("lucro:", -res.fun)                     # 6120.0
print("folgas:", res.ineqlin.residual)        # [0. 0.]
print("preços-sombra:", -res.ineqlin.marginals)'''
    r = simplex(C.brinq)
    ps = precos_sombra(C.brinq, r)
    return [Raw(tex=r'\begin{tcolorbox}[enhanced,colback=bnota,colframe=bnota,arc=1pt,left=6pt,right=6pt,top=4pt,bottom=4pt,fontupper=\ttfamily\footnotesize]\begin{verbatim}' + '\n' + code + '\n' + r'\end{verbatim}' + '\n' + r'\end{tcolorbox}', md='```python\n' + code + '\n```\n'),
            P('O programa mostra a produção $(36,108,0)$, o lucro 6120, folgas nulas e preços-sombra $%s$ e $%s$, iguais aos lidos no quadro ótimo (exercício 26).' % (dn(ps[0]), dn(ps[1])))]


RESOL = {1: r1, 2: r2, 3: r3, 4: r4, 5: r5, 6: r6, 7: r7, 8: r8, 9: r9, 10: r10, 11: r11, 12: r12, 13: r13, 14: r14, 15: r15, 16: r16,
         17: r17, 18: r18, 19: r19, 20: r20, 21: r21, 22: r22, 23: r23, 24: r24, 25: r25, 26: r26, 27: r27, 28: r28, 29: r29}

# ======================================================================= propostos novos (30 a 45)
X = {}
X['padaria'] = LP('max', [40, 50], [[1, 2], [3, 2], [0, 1]], ['<='] * 3, [40, 60, 15])
X['rentacar'] = LP('min', [30, 40], [[1, 1], [1, 3], [1, 0]], ['>=', '>=', '<='], [10, 18, 12])
X['vinho'] = LP('max', [3, 4], [[1, 1], [1, 3], [2, 1]], ['<='] * 3, [12, 24, 20])
X['eventos'] = LP('min', [200, 300], [[50, 100], [1, 0], [0, 1]], ['>=', '<=', '<='], [1000, 15, 8])
X['alg3'] = LP('max', [3, 5], [[1, 0], [0, 2], [3, 2]], ['<='] * 3, [4, 12, 18])
X['praia'] = LP('max', [15, 10], [[1, 1], [2, 1], [1, 0]], ['<=', '<=', '>='], [50, 80, 10])
X['deg'] = LP('max', [3, 2], [[1, 1], [1, 0], [2, 1]], ['<='] * 3, [4, 2, 6])
X['ilim2'] = LP('max', [1, 2], [[-1, 1], [1, -2]], ['<=', '<='], [3, 2])
X['golfe'] = LP('max', [2, 3, 4], [[1, 1, 1], [1, 2, 3], [2, 1, 1]], ['<='] * 3, [100, 240, 150])
X['moveis'] = LP('max', [60, 30, 20], [[8, 6, 1], [4, 2, Fr(3, 2)], [2, Fr(3, 2), Fr(1, 2)]], ['<='] * 3, [48, 20, 8])
X['mgr'] = LP('max', [2, 3], [[1, 1], [1, 2], [1, 0]], ['<=', '>=', '='], [10, 12, 4])
X['mgr2'] = LP('min', [3, 2, 4], [[1, 1, 1], [2, 1, 0], [0, 1, 2]], ['>=', '>=', '>='], [6, 4, 5])
X['imp2'] = LP('min', [2, 3], [[1, 1], [2, 3]], ['<=', '>='], [4, 15])
X['dual3'] = LP('min', [10, 15], [[1, 2], [3, 2]], ['>=', '>='], [8, 12])
X['catering'] = LP('min', [5, 4], [[2, 1], [1, 1], [1, 2]], ['>='] * 3, [10, 7, 10])
X['turnos'] = LP('min', [1, 1, 1], [[1, 0, 1], [1, 1, 0], [0, 1, 1]], ['>='] * 3, [6, 8, 10])
RX = {k: simplex(v) for k, v in X.items()}
for k, v in X.items():
    st, x, z = solve_check(v)
    assert st == RX[k]['status'], k
    if st == 'otimo':
        assert abs(z - float(RX[k]['z'])) < 1e-6, k
assert RX['padaria']['z'] == 1150 and RX['moveis']['z'] == 280 and RX['golfe']['multiplas']

NEW = []   # (chave, título, nível, enunciado, solução curta, resolução)


def newex(key, title, lv, stmt, sol, res):
    NEW.append(dict(key=key, title=title, lv=lv, stmt=stmt, sol=sol, res=res))


L = X
newex('padaria', 'Padaria de Lagos', 1,
      [P('Uma padaria de Lagos faz fornadas de broas ($x_1$) e de bolos de amêndoa ($x_2$). Uma fornada de broas gasta 1 kg de farinha e 3 horas de forno; uma de bolos de amêndoa gasta 2 kg de farinha e 2 horas de forno. '
         'Por semana há 40 kg de farinha e 60 horas de forno, e não se vendem mais de 15 fornadas de bolos de amêndoa. O lucro é de 40 € por fornada de broas e de 50 € por fornada de bolos.'),
       Ul(['Formule o problema que maximiza o lucro semanal.', 'Resolva-o graficamente.', 'Indique o estado das restrições.'], 'alpha')],
      sol_line(L['padaria'], RX['padaria']) + ' €; farinha e forno esgotados, procura de bolos saturada (solução degenerada).',
      lambda: alinea('a', [Eq(model(L['padaria']))]) + alinea('b', graf(L['padaria'], 'n30', (24, 24), labels=['$x_1+2x_2=40$', '$3x_1+2x_2=60$', '$x_2=15$'], labpos=[(1, 20.3), (16, 3), (17, 15.3)])[0]) +
      alinea('c', [estado_ul(L['padaria'], RX['padaria']), P('As três retas passam por $(10,15)$: a solução é degenerada.')]))
newex('rentacar', 'Frota de um rent-a-car', 2,
      [P('Um rent-a-car de Portimão vai comprar carros pequenos ($x_1$, 30 mil € cada) e carrinhas ($x_2$, 40 mil € cada). Precisa de pelo menos 10 viaturas; para os clientes com bagagem, cada carro pequeno leva 1 mala grande e cada carrinha 3, e é preciso transportar pelo menos 18 malas grandes ao mesmo tempo. '
         'O parque só tem lugar para 12 carros pequenos.'),
       Ul(['Formule o problema que minimiza o investimento.', 'Resolva-o graficamente e interprete.'], 'alpha')],
      sol_line(L['rentacar'], RX['rentacar']) + ' (milhares de euros).',
      lambda: alinea('a', [Eq(model(L['rentacar']))]) + alinea('b', graf(L['rentacar'], 'n31', (14, 12), labels=['$x_1+x_2=10$', '$x_1+3x_2=18$', '$x_1=12$'], labpos=[(1, 9.3), (8.5, 3.4), (12.1, 10.5)])[0] +
                                                                [P('Compram-se 6 carros pequenos e 4 carrinhas, investimento de 340 mil €. As duas exigências mínimas ficam saturadas e sobram 6 lugares de estacionamento.')]))
newex('vinho', 'Adega: gráfico e algébrico', 2,
      [P('Considere o problema'), Eq(model(L['vinho'])), Ul(['Resolva-o graficamente.', 'Quantas soluções básicas tem, no máximo, a forma standard? Identifique as que correspondem aos vértices do CSA.'], 'alpha')],
      sol_line(L['vinho'], RX['vinho']) + '. Até $C^5_3=10$ soluções básicas; 5 são admissíveis (os 5 vértices).',
      lambda: alinea('a', graf(L['vinho'], 'n32', (13, 13), labels=['$x_1+x_2=12$', '$x_1+3x_2=24$', '$2x_1+x_2=20$'], labpos=[(0.5, 11.7), (9.5, 4.9), (9.6, 0.4)])[0]) + alinea('b', [Eq(std_model(L['vinho']))] + algeb(L['vinho'])[0]))
newex('eventos', 'Tendas para um congresso', 2,
      [P('Uma empresa de eventos precisa de pelo menos 1000 lugares sentados para um congresso em Vilamoura. Pode alugar tendas pequenas (50 lugares, 200 €) e grandes (100 lugares, 300 €). O fornecedor só tem 15 tendas pequenas e 8 grandes.'),
       Ul(['Formule o problema que minimiza o custo do aluguer.', 'Resolva-o graficamente.', 'Indique a folga ou o excesso de cada restrição.'], 'alpha')],
      sol_line(L['eventos'], RX['eventos']) + ' €; lugares à justa, tendas grandes esgotadas, sobram 11 tendas pequenas.',
      lambda: alinea('a', [vars_txt('$x_1$ = tendas pequenas', '$x_2$ = tendas grandes'), Eq(model(L['eventos']))]) + alinea('b', graf(L['eventos'], 'n33', (17, 11), labels=['$50x_1+100x_2=1000$', '$x_1=15$', '$x_2=8$'], labpos=[(0.5, 10.2), (15.1, 1), (1, 8.2)])[0]) + alinea('c', [estado_ul(L['eventos'], RX['eventos'])]))
newex('alg3', 'Método algébrico com três restrições', 2,
      [P('Resolva pelo método algébrico e confirme graficamente:'), Eq(model(L['alg3']))],
      sol_line(L['alg3'], RX['alg3']) + '; 5 soluções básicas admissíveis em 10.',
      lambda: [Eq(std_model(L['alg3']))] + algeb(L['alg3'])[0] + graf(L['alg3'], 'n34', (7, 10), labels=['$x_1=4$', '$2x_2=12$', '$3x_1+2x_2=18$'], labpos=[(4.05, 8.5), (0.3, 6.15), (5.0, 0.6)], intro=False)[0])
newex('praia', 'Concessão de praia', 2,
      [P('Uma concessão de praia aluga, por dia, kits "Duplo" ($x_1$: um chapéu e duas espreguiçadeiras) e kits "Simples" ($x_2$: um chapéu e uma espreguiçadeira). Tem 50 chapéus e 80 espreguiçadeiras, e um acordo com um hotel obriga a ter pelo menos 10 kits "Duplo". '
         'O lucro é de 15 € por kit "Duplo" e de 10 € por kit "Simples".'),
       Ul(['Formule o problema.', 'Resolva-o pelo método do Simplex.', 'Interprete a solução e o estado das restrições.'], 'alpha')],
      sol_line(L['praia'], RX['praia']) + ' €; chapéus e espreguiçadeiras esgotados; 20 kits "Duplo" acima do mínimo.',
      lambda: alinea('a', [Eq(model(L['praia']))]) + alinea('b', simplex_blocks(L['praia'])[0]) + alinea('c', [estado_ul(L['praia'], RX['praia'])]))
newex('deg', 'Degenerescência', 2,
      [P('Resolva pelo método do Simplex e identifique o quadro em que a solução é degenerada. Explique o que acontece no gráfico.'), Eq(model(L['deg']))],
      sol_line(L['deg'], RX['deg']) + '; há empate nos rácios e as três retas passam por $(2,2)$.',
      lambda: simplex_blocks(L['deg'])[0] + [P('No gráfico, as retas $x_1+x_2=4$, $x_1=2$ e $2x_1+x_2=6$ passam todas por $(2,2)$. Um vértice onde se cruzam mais retas do que o necessário dá soluções básicas degeneradas.')])
newex('ilim2', 'Simplex sem solução ótima', 2,
      [P('Aplique o método do Simplex ao problema seguinte e conclua:'), Eq(model(L['ilim2']))],
      'Sem solução ótima finita: no 2.º quadro a coluna que entra não tem elementos positivos.',
      lambda: simplex_blocks(L['ilim2'])[0])
newex('golfe', 'Pacotes de um resort', 3,
      [P('Um resort vende três pacotes semanais: "Golfe" ($x_1$), "Spa" ($x_2$) e "Família" ($x_3$), com margens de 2, 3 e 4 centenas de euros. Cada pacote ocupa um quarto (há 100), precisa de 1, 2 e 3 horas de animação (há 240) e de 2, 1 e 1 refeições especiais por dia (há 150).'),
       Ul(['Formule o problema e resolva-o pelo método do Simplex.', 'Mostre que há ótimos múltiplos e indique outra solução ótima.'], 'alpha')],
      '$x_1=30$, $x_2=0$, $x_3=70$; $z^*=340$ centenas de €; ótimos múltiplos, outra solução ótima: $x_1=0$, $x_2=60$, $x_3=40$.',
      None)
newex('moveis', 'Carpintaria de Monchique', 3,
      [P('Uma carpintaria de Monchique faz secretárias ($x_1$), mesas ($x_2$) e cadeiras ($x_3$), com lucros de 60, 30 e 20 €. Cada secretária gasta 8 unidades de madeira, 4 horas de acabamento e 2 horas de carpintaria; '
         'cada mesa, 6 de madeira, 2 h de acabamento e 1,5 h de carpintaria; cada cadeira, 1 de madeira, 1,5 h de acabamento e 0,5 h de carpintaria. Há 48 unidades de madeira, 20 horas de acabamento e 8 horas de carpintaria.'),
       Ul(['Formule e resolva pelo método do Simplex.', 'Indique os preços-sombra e interprete-os.', 'Quanto teria de aumentar o lucro de uma mesa para valer a pena produzi-las?'], 'alpha')],
      sol_line(L['moveis'], RX['moveis']) + ' €; preços-sombra 0, 10 e 10 €; o lucro da mesa teria de subir mais de 5 €.',
      None)
newex('mgr', 'M grande com uma igualdade', 2,
      [P('Resolva pelo método do M grande:'), Eq(model(L['mgr']))], sol_line(L['mgr'], RX['mgr']) + '.', lambda: simplex_blocks(L['mgr'])[0])
newex('mgr2', 'M grande com três artificiais', 3,
      [P('Resolva pelo método do M grande e indique o estado das restrições:'), Eq(model(L['mgr2']))],
      sol_line(L['mgr2'], RX['mgr2']) + '; excessos $E_2=2$, $E_3=1$.', lambda: simplex_blocks(L['mgr2'])[0] + [estado_ul(L['mgr2'], RX['mgr2'])])
newex('imp2', 'Simplex e problema impossível', 2,
      [P('Mostre, pelo método do M grande, que o problema é impossível, e confirme graficamente:'), Eq(model(L['imp2']))],
      'Impossível: a variável artificial $A_2$ fica na base com valor 3.',
      lambda: simplex_blocks(L['imp2'])[0] + [P('Graficamente: com $x_1+x_2\\leq4$ o maior valor de $2x_1+3x_2$ é $3\\cdot4=12<15$, por isso o CSA é vazio.')])
newex('dual3', 'Dual e folgas complementares', 2,
      [P('Considere o problema'), Eq(model(L['dual3'])), Ul(['Escreva o dual.', 'Resolva o primal pelo método do M grande e leia no quadro ótimo a solução do dual.', 'Verifique as folgas complementares.'], 'alpha')],
      sol_line(L['dual3'], RX['dual3']) + '; dual: $y_1=\\frac{15}{2}$, $y_2=\\frac{5}{6}$? (ver resolução), $w^*=65$.',
      None)
newex('catering', 'Caixas de almoço', 3,
      [P('Uma empresa de catering combina dois tipos de caixa, A ($x_1$, 5 €) e B ($x_2$, 4 €), para um grupo de turistas. Cada caixa A tem 2 unidades de proteína, 1 de hidratos e 1 de fibra; cada caixa B tem 1, 1 e 2. O grupo precisa de pelo menos 10 unidades de proteína, 7 de hidratos e 10 de fibra.'),
       Ul(['Formule e resolva graficamente.', 'Escreva o dual e interprete as variáveis duais.'], 'alpha')],
      sol_line(L['catering'], RX['catering']) + ' €.',
      None)
newex('turnos', 'Nadadores-salvadores', 3,
      [P('Uma praia precisa de nadadores-salvadores em três períodos do dia: manhã (pelo menos 6), tarde (8) e fim de tarde (10). Cada nadador-salvador faz dois períodos: manhã e tarde ($x_1$), tarde e fim de tarde ($x_2$) ou fim de tarde e, no dia seguinte, manhã ($x_3$).'),
       Ul(['Formule o problema que minimiza o número de nadadores-salvadores.', 'Resolva-o pelo método do M grande.'], 'alpha')],
      sol_line(L['turnos'], RX['turnos']) + '.',
      lambda: alinea('a', [P('Manhã: $x_1+x_3\\geq6$; tarde: $x_1+x_2\\geq8$; fim de tarde: $x_2+x_3\\geq10$.'), Eq(model(L['turnos']))]) + alinea('b', simplex_blocks(L['turnos'])[0]))


def _golfe():
    lp = L['golfe']; b, r = simplex_blocks(lp)
    cols, al = algebraic(lp)
    alts = [a for a in al if a['adm'] and a['z'] == r['z']]
    sols = sorted(set(tuple(a['vals'][:3]) for a in alts))
    assert (0, 60, 40) in sols
    return alinea('a', [Eq(model(lp))] + b) + alinea('b', [P('No quadro ótimo há uma variável de decisão não básica com $c_j-z_j=0$. Fazendo-a entrar na base obtém-se outra solução básica com o mesmo valor $z^*=%s$. As soluções básicas ótimas são %s; qualquer combinação convexa delas também é ótima.' % (dn(r['z']), ' e '.join('$(%s)$' % ','.join(dn(v) for v in s) for s in sols)))])


def _moveis():
    lp = L['moveis']; b, r = simplex_blocks(lp)
    q = r['quadros'][-1]
    cr = q['cz'][1].a
    assert cr == -5
    return alinea('a', [Eq(model(lp))] + b) + alinea('b', [ps_ul(lp, r, ['Madeira', 'Acabamento', 'Carpintaria'], ['unidade', 'hora', 'hora']),
                                                         P('Sobram 24 unidades de madeira, por isso mais madeira não vale nada. Cada hora extra de acabamento ou de carpintaria aumentaria o lucro em 10 €.')]) + \
        alinea('c', [P('As mesas ($x_2$) são não básicas com $c_j-z_j=-5$: cada mesa produzida baixaria o lucro em 5 €. Só vale a pena produzi-las se o lucro unitário passar de 30 € para mais de 35 €.')])


def _dual3():
    lp = L['dual3']; d, t = dual_model(lp); b, r = simplex_blocks(lp)
    q = r['quadros'][-1]
    ys = precos_sombra(lp, r)
    rd = simplex(d)
    assert rd['z'] == r['z'] and [rd['x'][0], rd['x'][1]] == ys
    NEW[[k['key'] for k in NEW].index('dual3')]['sol'] = sol_line(lp, r) + '; dual: $y_1=%s$, $y_2=%s$, $w^*=%s$.' % (dn(ys[0]), dn(ys[1]), dn(rd['z']))
    return alinea('a', [Eq(t)]) + alinea('b', b + [P('Os $c_j-z_j$ dos excessos $E_1$ e $E_2$ no quadro ótimo dão $y_1=%s$ e $y_2=%s$, com $w^*=8\\cdot%s+12\\cdot%s=%s=z^*$.' % (dn(ys[0]), dn(ys[1]), dn(ys[0]), dn(ys[1]), dn(r['z'])))]) + \
        alinea('c', [P('No primal, as duas restrições estão saturadas ($E_1=E_2=0$), o que é compatível com $y_1,y_2>0$. No dual, $x_1=2>0$ e $x_2=3>0$ obrigam as duas restrições duais a ficar saturadas: $%s+3\\cdot%s=10$ e $2\\cdot%s+2\\cdot%s=15$. Confirma-se.' % (dn(ys[0]), dn(ys[1]), dn(ys[0]), dn(ys[1])))])


def _catering():
    lp = L['catering']; d, t = dual_model(lp); r = RX['catering']; ys = precos_sombra(lp, r)
    rd = simplex(d); assert rd['z'] == r['z']
    NEW[[k['key'] for k in NEW].index('catering')]['sol'] = sol_line(lp, r) + '; dual $y=(%s)$, $w^*=%s$.' % (','.join(dn(y) for y in ys), dn(rd['z']))
    g, _ = graf(lp, 'n44', (11, 11), labels=['$2x_1+x_2=10$', '$x_1+x_2=7$', '$x_1+2x_2=10$'], labpos=[(0.2, 10.3), (6.7, 0.6), (8.8, 0.3)])
    return alinea('a', [vars_txt('$x_1$ = caixas A', '$x_2$ = caixas B'), Eq(model(lp))] + g) + alinea('b', [Eq(t), P('A solução do dual (preços-sombra das exigências) é $y_1=%s$, $y_2=%s$, $y_3=%s$, com $w^*=%s=z^*$. Cada unidade a mais de proteína exigida custaria $%s$ €, cada unidade de hidratos $%s$ €; a fibra está em excesso, por isso $y_3=0$.' % (dn(ys[0]), dn(ys[1]), dn(ys[2]), dn(rd['z']), dn(ys[0]), dn(ys[1])))])


def _sol_fix():
    for key in ('dual3', 'catering'):
        lp = L[key]; r = RX[key]; ys = precos_sombra(lp, r); rd = simplex(dual(lp)); assert rd['z'] == r['z']
        NEW[[k['key'] for k in NEW].index(key)]['sol'] = sol_line(lp, r) + '; dual: ' + ', '.join('$y_%d=%s$' % (i + 1, dn(y)) for i, y in enumerate(ys)) + ', $w^*=%s$.' % dn(rd['z'])


_sol_fix()
for k, f in (('golfe', _golfe), ('moveis', _moveis), ('dual3', _dual3), ('catering', _catering)):
    NEW[[e['key'] for e in NEW].index(k)]['res'] = f
assert RX['catering']['x'][4] == 1   # fibra em excesso (E3=1)

# ======================================================================= Parte II: exercícios resolvidos
R = {}
R['r2'] = LP('max', [5, 4], [[6, 4], [1, 2], [-1, 1], [0, 1]], ['<='] * 4, [24, 6, 1, 2])
R['r3'] = LP('min', [3, 2], [[1, 1], [3, 1], [1, 3]], ['>='] * 3, [4, 6, 6])
R['r4'] = LP('max', [2, 4], [[1, 2], [3, 1], [1, 0]], ['<='] * 3, [16, 18, 5])
R['r5'] = LP('max', [3, 2], [[1, 1], [2, 1], [1, 3]], ['<='] * 3, [8, 12, 18])
R['r7'] = LP('max', [12, 8, 10], [[2, 1, 1], [1, 1, 2], [3, 2, 2]], ['<='] * 3, [40, 30, 72])
R['r8'] = LP('min', [4, 3], [[1, 1], [2, 1], [1, 2]], ['>=', '>=', '<='], [6, 8, 10])
R['r9'] = LP('max', [5, 3], [[1, 1], [2, 1], [1, 0]], ['=', '<=', '>='], [8, 12, 2])
R['r10a'] = LP('max', [2, 1], [[1, 1], [1, -1]], ['>=', '<='], [3, 2])
R['r10b'] = LP('min', [1, 1], [[1, 2], [1, 1]], ['<=', '>='], [4, 6])
RR = {k: simplex(v) for k, v in R.items()}
assert RR['r2']['z'] == 21 and RR['r7']['z'] == 280 and RR['r10a']['status'] == 'ilimitado' and RR['r10b']['status'] == 'impossivel'

RESOLVED = []


def resolved(title, lv, stmt, res):
    RESOLVED.append(dict(title=title, lv=lv, stmt=stmt, res=res))


resolved('Formular com três variáveis e percentagens', 2,
         [P('Um operador turístico de Faro organiza três circuitos de um dia: "Ria Formosa" ($x_1$), "Serra do Caldeirão" ($x_2$) e "Sagres" ($x_3$), com margens de 25, 30 e 40 € por cliente. Cada circuito "Ria" usa 1 hora de guia por cliente, o "Serra" 2 horas e o "Sagres" 3 horas; há 600 horas de guia por mês. '
            'Os autocarros fazem no máximo 400 lugares-dia por mês. O circuito "Sagres" não pode ter mais de 40 % dos clientes e o "Ria" tem de ter pelo menos 50 clientes.'),
          P('Formule o problema que maximiza a margem mensal.')],
         lambda: [vars_txt('$x_1,x_2,x_3$ = clientes por mês dos circuitos "Ria Formosa", "Serra do Caldeirão" e "Sagres"'),
                  P('**Função objetivo:** margem $z=25x_1+30x_2+40x_3$, a maximizar.'),
                  P('**Restrições:** horas de guia $x_1+2x_2+3x_3\\leq600$; lugares $x_1+x_2+x_3\\leq400$; "Ria" $x_1\\geq50$. A percentagem lê-se assim: os clientes do "Sagres" não podem passar de 40 % do total,'),
                  Eq(r'x_3\leq0{,}4(x_1+x_2+x_3)\iff -0{,}4x_1-0{,}4x_2+0{,}6x_3\leq0.'),
                  Eq(model(LP('max', [25, 30, 40], [[1, 2, 3], [1, 1, 1], [Fr(-2, 5), Fr(-2, 5), Fr(3, 5)], [1, 0, 0]], ['<=', '<=', '<=', '>='], [600, 400, 0, 50], names=['x_1', 'x_2', 'x_3']))),
                  Box('atencao', '', [P('Um erro frequente é escrever $x_3\\leq0{,}4$ ou $x_3\\leq40$. A percentagem refere-se ao total de clientes, que também é uma incógnita.')])])
resolved('Resolução gráfica com quatro restrições', 1,
         [P('Uma fábrica de tintas produz tinta de exterior ($x_1$) e de interior ($x_2$), em toneladas por dia, com lucros de 5 e 4 milhares de euros. Usa duas matérias-primas: 6 e 4 toneladas por tonelada de tinta de exterior e de interior da primeira (há 24 t), 1 e 2 toneladas da segunda (há 6 t). '
            'A procura de tinta de interior não passa de 2 t por dia, nem de mais 1 t do que a de exterior.'),
          Ul(['Formule e resolva graficamente.', 'Indique o estado de cada restrição.'], 'alpha')],
         lambda: alinea('a', [Eq(model(R['r2']))] + graf(R['r2'], 'r2', (5, 3.5), labels=['$6x_1+4x_2=24$', '$x_1+2x_2=6$', '$-x_1+x_2=1$', '$x_2=2$'], labpos=[(3.25, 1.4), (0.1, 3.1), (0.05, 1.3), (4.2, 2.05)])[0]) +
         alinea('b', [estado_ul(R['r2'], RR['r2']), P('A fábrica usa toda a matéria-prima; a procura de tinta de interior fica abaixo dos dois limites.')]))
resolved('Minimização com CSA ilimitado', 2,
         [P('Resolva graficamente e indique o excesso de cada restrição na solução ótima:'), Eq(model(R['r3']))],
         lambda: graf(R['r3'], 'r3', (7, 7), labels=['$x_1+x_2=4$', '$3x_1+x_2=6$', '$x_1+3x_2=6$'], labpos=[(3.3, 1), (0.1, 6.3), (5.2, 0.4)])[0] + [estado_ul(R['r3'], RR['r3']),
                  P('O CSA é ilimitado, mas como $z=3x_1+2x_2$ cresce quando nos afastamos da origem, o mínimo existe e está na fronteira mais próxima da origem.')])
resolved('Ótimos múltiplos e intervalo de otimalidade', 3,
         [P('Considere o problema'), Eq(model(R['r4'])), Ul(['Resolva graficamente.', 'Para que valores de $c_1$ (coeficiente de $x_1$, com $c_2=4$) o vértice $(4,6)$ é a única solução ótima?'], 'alpha')],
         lambda: alinea('a', graf(R['r4'], 'r4', (7, 10), labels=['$x_1+2x_2=16$', '$3x_1+x_2=18$', '$x_1=5$'], labpos=[(0.2, 8.2), (6.1, 0.4), (5.05, 9)])[0]) +
         alinea('b', [P('O vértice $(4,6)$ é a interseção de $x_1+2x_2=16$ (declive $-\\frac12$) com $3x_1+x_2=18$ (declive $-3$). A reta de nível $c_1x_1+4x_2=k$ tem declive $-\\frac{c_1}{4}$. O vértice é o único ótimo se esse declive ficar estritamente entre os dois:'),
                      Eq(r'-3<-\frac{c_1}{4}<-\frac12\iff 2<c_1<12.'),
                      P('Para $c_1=2$ há ótimos múltiplos no lado de $(0,8)$ a $(4,6)$ (o caso da alínea a); para $c_1=12$ há ótimos múltiplos no lado de $(4,6)$ a $(5,3)$.')]))
resolved('Método algébrico', 2,
         [P('Resolva pelo método algébrico:'), Eq(model(R['r5']))],
         lambda: [Eq(std_model(R['r5']))] + algeb(R['r5'])[0] + [P('**Confirmação:** $4+4=8$, $2\\cdot4+4=12$ e $4+3\\cdot4=16\\leq18$.')])
resolved('Simplex e caminho no gráfico', 2,
         [P('Resolva pelo método do Simplex o problema do exercício resolvido 2 e indique a que vértice do gráfico corresponde cada quadro.')],
         lambda: simplex_blocks(R['r2'])[0] + [P('Os quadros correspondem aos vértices $(0,0)$, $(4,0)$ e $(3,\\frac32)$ do gráfico. O Simplex não precisou de passar pelos vértices de cima, porque em cada passo escolheu a variável com maior ganho.')])
resolved('Simplex com três variáveis e interpretação', 3,
         [P('Uma empresa de Olhão faz três conservas: atum ($x_1$), sardinha ($x_2$) e cavala ($x_3$), em milhares de latas, com margens de 12, 8 e 10 centenas de euros. Usa três recursos por semana: 40 horas de linha de enchimento, 30 horas de esterilização e 72 toneladas de peixe. '
            'Os consumos por milhar de latas são: enchimento 2, 1 e 1 h; esterilização 1, 1 e 2 h; peixe 3, 2 e 2 t.'),
          Ul(['Resolva pelo método do Simplex.', 'Indique o estado dos recursos e os preços-sombra.', 'A cavala não é produzida. Quanto teria de valer a sua margem para entrar no plano?'], 'alpha')],
         lambda: alinea('a', [Eq(model(R['r7']))] + simplex_blocks(R['r7'])[0]) +
         alinea('b', [estado_ul(R['r7'], RR['r7']), ps_ul(R['r7'], RR['r7'], ['Enchimento', 'Esterilização', 'Peixe'], ['hora', 'hora', 'tonelada'], moeda='centenas de €')]) +
         alinea('c', [P('A cavala ($x_3$) é não básica com $c_j-z_j=-2$: cada milhar de latas de cavala baixaria a margem em 2 centenas de euros. Só entraria no plano com margem superior a $10+2=12$ centenas de euros por milhar.')]))
resolved('M grande num problema de Min', 2,
         [P('Resolva pelo método do M grande e interprete as variáveis de excesso e de folga no quadro ótimo:'), Eq(model(R['r8']))],
         lambda: [Ul(classify(R['r8']))] + simplex_blocks(R['r8'])[0] + [estado_ul(R['r8'], RR['r8'])])
resolved('M grande com uma igualdade', 2,
         [P('Resolva pelo método do M grande:'), Eq(model(R['r9']))],
         lambda: [Ul(classify(R['r9']))] + simplex_blocks(R['r9'])[0] + [P('**Confirmação:** $4+4=8$; $2\\cdot4+4=12$; $4\\geq2$. $z=5\\cdot4+3\\cdot4=32$.')])
resolved('O Simplex classifica o problema', 2,
         [P('Use o método do Simplex para classificar cada problema:'), Ul([[Eq(model(R['r10a']))], [Eq(model(R['r10b']))]], 'alpha')],
         lambda: alinea('a', simplex_blocks(R['r10a'])[0]) + alinea('b', simplex_blocks(R['r10b'])[0]))
resolved('Dual e folgas complementares', 2,
         [P('Escreva o dual do problema do exercício resolvido 5, leia a sua solução no quadro ótimo do primal e verifique as folgas complementares.')],
         lambda: _r11())
resolved('Resolver no computador', 2,
         [P('Resolva em Python, com a função `linprog`, o problema do exercício resolvido 7, e explique como se obtêm do resultado os preços-sombra.')],
         lambda: _r12())


def _r11():
    lp = R['r5']; d, t = dual_model(lp); r = RR['r5']
    b, _ = simplex_blocks(lp, intro=False, verbose=False)
    ys = precos_sombra(lp, r); rd = simplex(d)
    assert rd['z'] == r['z'] and [rd['x'][i] for i in range(3)] == ys
    return [P('O primal (Max com $\\leq$) tem dual'), Eq(t), P('O quadro ótimo do primal pelo Simplex é:'), b[-2],
            P('Os $c_j-z_j$ das folgas são $%s$, $%s$ e $%s$; os seus simétricos dão $y_1=%s$, $y_2=%s$, $y_3=%s$, com $w^*=8\\cdot%s+12\\cdot%s+18\\cdot%s=%s=z^*$.' % (
                mv_tex(r['quadros'][-1]['cz'][2]), mv_tex(r['quadros'][-1]['cz'][3]), mv_tex(r['quadros'][-1]['cz'][4]), dn(ys[0]), dn(ys[1]), dn(ys[2]), dn(ys[0]), dn(ys[1]), dn(ys[2]), dn(rd['z']))),
            P('**Folgas complementares.** A terceira restrição do primal tem folga $F_3=2>0$, por isso $y_3=0$; as duas primeiras estão saturadas, compatível com $y_1,y_2>0$. Como $x_1=4>0$ e $x_2=4>0$, as duas restrições do dual ficam saturadas: $1+2\\cdot1+0=3$ e $1+1+0=2$.')]


def _r12():
    code = r'''from scipy.optimize import linprog

c = [-12, -8, -10]                # Max -> Min
A = [[2, 1, 1],                   # enchimento (h)
     [1, 1, 2],                   # esterilização (h)
     [3, 2, 2]]                   # peixe (t)
b = [40, 30, 72]
res = linprog(c, A_ub=A, b_ub=b, bounds=[(0, None)] * 3, method="highs")
print(res.x, -res.fun)            # [10. 20.  0.] 280.0
print(res.ineqlin.residual)       # [0. 0. 2.]
print(-res.ineqlin.marginals)     # [4. 4. 0.]'''
    return [Raw(tex=r'\begin{tcolorbox}[enhanced,colback=bnota,colframe=bnota,arc=1pt,left=6pt,right=6pt,top=4pt,bottom=4pt,fontupper=\ttfamily\footnotesize]\begin{verbatim}' + '\n' + code + '\n' + r'\end{verbatim}' + '\n' + r'\end{tcolorbox}', md='```python\n' + code + '\n```\n'),
            P('A função `linprog` minimiza, por isso usamos $-c$ e trocamos o sinal de `res.fun`. O atributo `res.ineqlin.residual` dá as folgas e `res.ineqlin.marginals` dá a variação do valor minimizado por unidade de $b_i$: trocando o sinal, obtêm-se os preços-sombra do problema de Max, 4, 4 e 0, iguais aos do quadro ótimo do exercício resolvido 7.')]


# confirmação numérica do código Python do r12
from scipy.optimize import linprog as _lp
_res = _lp([-12, -8, -10], A_ub=[[2, 1, 1], [1, 1, 2], [3, 2, 2]], b_ub=[40, 30, 72], bounds=[(0, None)] * 3, method='highs')
assert [round(v, 6) for v in _res.x] == [10, 20, 0] and round(-_res.fun, 6) == 280 and [round(-v, 6) for v in _res.ineqlin.marginals] == [4, 4, 0]
_res = _lp([-20, -50, -30], A_ub=[[2, 2, 1], [1, 3, 2]], b_ub=[288, 360], bounds=[(0, None)] * 3, method='highs')
assert [round(v, 6) for v in _res.x] == [36, 108, 0]
_res = _lp([-30, -20], A_ub=[[3, 1], [1, 2]], b_ub=[150, 100], bounds=[(0, None)] * 2, method='highs')
assert [round(-v, 6) for v in _res.ineqlin.marginals] == [8, 6]


# ======================================================================= exercícios das fichas e frequências antigas
R['r13'] = LP('min', [3, -1, 1], [[1, 1, 0], [1, 2, 1], [2, 1, -1]], ['>=', '>=', '<='], [1, 1, 1])
RR['r13'] = simplex(R['r13'])
assert RR['r13']['z'] == -1 and RR['r13']['x'][:3] == [0, 1, 0]
resolved('M grande com um custo negativo', 3,
         [P('Resolva pelo método do Simplex (método do M grande) e interprete o valor ótimo:'), Eq(model(R['r13']))],
         lambda: [Ul(classify(R['r13']))] + simplex_blocks(R['r13'])[0] +
         [P('O custo mínimo é negativo porque $x_2$ tem coeficiente $-1$: cada unidade de $x_2$ **baixa** o valor de $z$. Por isso $x_2$ entra na base logo que as artificiais o permitem. O valor $z^*=-1$ não tem nada de estranho: num problema de mínimo a função objetivo pode tomar valores negativos (pense num custo líquido, depois de descontar uma receita).'),
          Box('nota', 'Origem', [P('Exercício 2 da prova de 18 de janeiro de 2021 (versão 1).')])])
cols_b, al_b = algebraic(C.brinq)
assert len(al_b) == 10
resolved('Método algébrico com três variáveis', 3,
         [P('Uma empresa de brinquedos de madeira quer produzir barcos ($x_1$), aviões ($x_2$) e bonecas ($x_3$). Um barco precisa de 2 horas de carpintaria e 1 de acabamentos; um avião, 2 e 3 horas; uma boneca, 1 e 2 horas. Há 8 empregados na carpintaria e 10 nos acabamentos, com 36 horas semanais cada um. O lucro unitário é de 20, 50 e 30 u.m.'),
          Ul(['Formule o problema.', 'Resolva-o pelo método algébrico.', 'Caracterize a solução ótima: o que se produz e qual o estado das restrições.'], 'alpha')],
         lambda: alinea('a', [Eq(model(C.brinq))]) + alinea('b', [Eq(std_model(C.brinq))] + algeb(C.brinq)[0] +
                                                              [P('Com três variáveis de decisão não há gráfico, mas o método algébrico continua a funcionar: só é preciso resolver mais sistemas ($C^5_2=10$).')]) +
         alinea('c', [P('Produzem-se 36 barcos e 108 aviões por semana e nenhuma boneca, com lucro de 6120 u.m.'), estado_ul(C.brinq, simplex(C.brinq))]) +
         [Box('nota', 'Origem', [P('Questão 3 da 2.ª frequência de 2017/18 (Portimão, noturno). O mesmo problema aparece pelo Simplex no exercício proposto 18.')])])

# ligações aos applets (código QR nas resoluções)
PLINK = {7: ('pl-grafico', C.pastel), 8: ('pl-grafico', C.dieta), 9: ('pl-grafico', C.banh), 10: ('pl-grafico', C.tur), 11: ('pl-grafico', C.q2),
         14: ('pl-algebrico', C.gel), 15: ('pl-algebrico', C.small), 17: ('pl-simplex', C.pastel), 18: ('pl-simplex', C.brinq), 19: ('pl-simplex', C.tur),
         20: ('pl-simplex', C.f21), 21: ('pl-simplex', C.fr), 22: ('pl-simplex', C.cint), 23: ('pl-simplex', C.mult), 24: ('pl-dual', C.pastel),
         25: ('pl-dual', C.dieta), 26: ('pl-dual', C.brinq), 27: ('pl-dual', C.tur)}
NLINK = {'padaria': 'pl-grafico', 'rentacar': 'pl-grafico', 'vinho': 'pl-grafico', 'eventos': 'pl-grafico', 'alg3': 'pl-algebrico', 'praia': 'pl-simplex',
         'deg': 'pl-simplex', 'ilim2': 'pl-simplex', 'golfe': 'pl-simplex', 'moveis': 'pl-simplex', 'mgr': 'pl-simplex', 'mgr2': 'pl-simplex',
         'imp2': 'pl-simplex', 'dual3': 'pl-dual', 'catering': 'pl-dual', 'turnos': 'pl-simplex'}
for i, k in enumerate(NEW):
    PLINK[30 + i] = (NLINK[k['key']], X[k['key']])
RLINK = {2: ('pl-grafico', R['r2']), 3: ('pl-grafico', R['r3']), 4: ('pl-sensibilidade', R['r4']), 5: ('pl-algebrico', R['r5']), 6: ('pl-simplex', R['r2']),
         7: ('pl-simplex', R['r7']), 8: ('pl-simplex', R['r8']), 9: ('pl-simplex', R['r9']), 11: ('pl-dual', R['r5']), 13: ('pl-simplex', R['r13']), 14: ('pl-algebrico', C.brinq)}
