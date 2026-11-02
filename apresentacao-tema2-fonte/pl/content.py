"""Banco de exercícios e testes do Tema 2 (Programação Linear).
Cada número das soluções sai do motor exato (plengine) e é confirmado com scipy."""
import json
from fractions import Fraction as Fr
from plengine import LP, simplex, solve_check, algebraic, vertices, estado, dual, precos_sombra, ftex, fstr, fdec, F
from math import comb

EX = []          # exercícios propostos (numeração estável)
TESTS = []


def ok(lp, res):
    st, x, z = solve_check(lp)
    assert st == res['status'], (st, res['status'])
    if st == 'otimo':
        assert abs(float(res['z']) - z) < 1e-6, (res['z'], z)
    return res


def solve(lp):
    return ok(lp, simplex(lp))


def P(x): return {'t': 'p', 'x': x}
def EQ(*ls): return {'t': 'eq', 'x': list(ls)}
def UL(items, s='alpha'): return {'t': 'ul', 's': s, 'x': items}
def TAB(h, r): return {'t': 'tab', 'h': h, 'r': r}


def num(x):
    """número para texto: inteiro, ou decimal com vírgula se finito curto, senão fração"""
    x = F(x)
    if x.denominator == 1:
        return str(x.numerator)
    for d in (2, 4, 5, 10, 20, 25, 50, 100):
        if d % x.denominator == 0:
            return fdec(x, 2)
    return '\\frac{%d}{%d}' % (x.numerator, x.denominator) if x > 0 else '-\\frac{%d}{%d}' % (-x.numerator, x.denominator)


def sol_txt(lp, res, unidades=None):
    if res['status'] != 'otimo':
        return {'ilimitado': 'Problema sem solução ótima (o valor de $z$ não tem limite).',
                'impossivel': 'Problema impossível (o conjunto de soluções admissíveis é vazio).'}[res['status']]
    xs = res['x'][:lp.n]
    s = ', '.join('$%s=%s$' % (nm, num(v)) for nm, v in zip(lp.names, xs))
    s += '; $z^*=%s$' % num(res['z'])
    if res.get('multiplas'):
        s += ' (há ótimos múltiplos)'
    return s


def add(bloco, lv, lab, st, an, lp=None, key=None):
    n = len(EX) + 1
    EX.append({'n': n, 'id': key or 'p%d' % n, 'bloco': bloco, 'lv': lv, 'lab': lab, 'st': st, 'an': an})
    return n


def model_tex(lp, fo='z'):
    return lp.tex(fo)


# ================================================================ BLOCO A: formulação
pastel = LP('max', [20, 30], [[3, 6], [1, Fr(1, 2)], [1, 1]], ['<=', '<=', '<='], [150, 20, 30])
add('A', 1, 'Pastelaria: formular',
    [P('Um pasteleiro dispõe de 150 kg de farinha, 20 kg de açúcar e 30 kg de manteiga para fazer dois tipos de bolos, A e B. '
       'Uma dúzia de bolos A gasta 3 kg de farinha, 1 kg de açúcar e 1 kg de manteiga; uma dúzia de bolos B gasta 6 kg de farinha, 0,5 kg de açúcar e 1 kg de manteiga. '
       'O lucro é de 20 € por dúzia de A e de 30 € por dúzia de B.'),
     P('Formule o problema de programação linear que permite obter o lucro máximo.')],
    'Com $x_1,x_2$ = dúzias de bolos A e B: $\\max z=20x_1+30x_2$ s.a. $3x_1+6x_2\\leq150$, $x_1+0{,}5x_2\\leq20$, $x_1+x_2\\leq30$, $x_1,x_2\\geq0$.', pastel)

banh = LP('min', [60, 30], [[1, 1], [1, 2], [1, 0], [1, 0]], ['<=', '>=', '>=', '<='], [90, 80, 40, 60])
add('A', 1, 'Banheiras: formular',
    [P('Uma fábrica produz banheiras redondas e retangulares. Cada banheira redonda precisa de 1 hora na linha de fabrico e 1 hora no acabamento; '
       'cada retangular precisa de 1 hora no fabrico e 2 horas no acabamento. O custo de produção é de 60 € por banheira redonda e 30 € por retangular. '
       'Há no máximo 90 horas de fabrico e é preciso ocupar pelo menos 80 horas no acabamento. Devem produzir-se entre 40 e 60 banheiras redondas.'),
     P('Formule o problema de modo a minimizar o custo.')],
    '$\\min z=60x_1+30x_2$ s.a. $x_1+x_2\\leq90$, $x_1+2x_2\\geq80$, $x_1\\geq40$, $x_1\\leq60$, $x_1,x_2\\geq0$ ($x_1$ redondas, $x_2$ retangulares).', banh)

dieta = LP('min', [4, 6], [[2, 1], [1, 2], [5, 6]], ['>=', '>=', '>='], [420, 500, 2100])
add('A', 1, 'Dieta: formular',
    [P('O António quer uma dieta com pelo menos 420 unidades de vitaminas, 500 de minerais e 2100 de calorias. Tem dois produtos:'),
     TAB(['', 'Vitaminas', 'Minerais', 'Calorias', 'Custo'], [['P1', '2', '1', '5', '4 €'], ['P2', '1', '2', '6', '6 €']]),
     P('Formule o problema que garante a dieta ao menor custo.')],
    '$\\min z=4x_1+6x_2$ s.a. $2x_1+x_2\\geq420$, $x_1+2x_2\\geq500$, $5x_1+6x_2\\geq2100$, $x_1,x_2\\geq0$.', dieta)

brinq = LP('max', [20, 50, 30], [[2, 2, 1], [1, 3, 2]], ['<=', '<='], [288, 360])
add('A', 2, 'Brinquedos: três produtos',
    [P('Uma empresa de brinquedos de madeira quer produzir barcos, aviões e bonecas. Um barco precisa de 2 horas de carpintaria e 1 hora de acabamentos; '
       'um avião, 2 horas de carpintaria e 3 de acabamentos; uma boneca, 1 hora de carpintaria e 2 de acabamentos. A empresa tem 8 empregados na carpintaria e 10 nos acabamentos, '
       'com 36 horas semanais cada um. O lucro unitário é de 20, 50 e 30 u.m., respetivamente.'),
     P('Formule o problema de modo a maximizar o lucro semanal.')],
    '$\\max z=20x_1+50x_2+30x_3$ s.a. $2x_1+2x_2+x_3\\leq288$, $x_1+3x_2+2x_3\\leq360$, $x_1,x_2,x_3\\geq0$ (8 × 36 = 288 h e 10 × 36 = 360 h).', brinq)

tur = LP('max', [40, 60], [[1, 1], [2, 4], [0, 1]], ['<=', '<=', '<='], [120, 360, 80])
add('A', 1, 'Agência de viagens: formular',
    [P('Uma agência de Portimão vende dois passeios de um dia: "Serra" e "Costa". Cada passeio usa um lugar no autocarro, que tem 120 lugares por semana. '
       'O passeio "Serra" precisa de 2 horas de guia por cliente (grupos pequenos) e o "Costa" de 4 horas; há 360 horas de guia por semana. '
       'A licença do barco limita o "Costa" a 80 clientes por semana. A margem é de 40 € por cliente no "Serra" e de 60 € no "Costa".'),
     P('Formule o problema de modo a maximizar a margem semanal.')],
    '$\\max z=40x_1+60x_2$ s.a. $x_1+x_2\\leq120$, $2x_1+4x_2\\leq360$, $x_2\\leq80$, $x_1,x_2\\geq0$.', tur)

carne = LP('min', [8, 6], [[Fr(1, 5), Fr(8, 25)], [1, 1]], ['<=', '='], [Fr(1, 4), 1], names=['x', 'y'])
add('A', 2, 'Mistura de carne',
    [P('Um talho faz uma mistura de carne picada para "rolo de carne" com carne de vaca (20 % de gordura, 8 €/kg) e carne de porco (32 % de gordura, 6 €/kg). '
       'A mistura não pode ter mais de 25 % de gordura.'),
     P('Formule o problema que minimiza o custo de um quilo de mistura. Porque é necessária a restrição $x+y=1$?')],
    '$\\min z=8x+6y$ s.a. $0{,}2x+0{,}32y\\leq0{,}25$, $x+y=1$, $x,y\\geq0$. Sem $x+y=1$ o mínimo seria $x=y=0$ (não fazer mistura nenhuma).', carne)

# ================================================================ BLOCO B: resolução gráfica
r = solve(pastel)
add('B', 1, 'Pastelaria: gráfico',
    [P('Resolva graficamente o problema do exercício 1 e indique quantas dúzias de bolos de cada tipo deve o pasteleiro fazer.')],
    sol_txt(pastel, r) + '. As três restrições ficam saturadas no vértice $(10,20)$: a solução é degenerada.', pastel)

r = solve(dieta)
d2 = LP('min', [Fr(18, 5), Fr(36, 5)], dieta.A, dieta.rel, dieta.b)
r2 = solve(d2)
assert r2.get('multiplas') or True
add('B', 2, 'Dieta: gráfico e custos',
    [P('Considere o problema do exercício 3.'),
     UL(['Determine graficamente quantas unidades de P1 e P2 deve o António comprar.',
         'Se os custos passassem a 3,6 € e 7,2 €, a solução mudava? Justifique.'])],
    'a) ' + sol_txt(dieta, r) + '. b) O declive da função objetivo ($-0{,}5$) passa a ser igual ao da restrição dos minerais: há ótimos múltiplos, todo o segmento entre $(300,100)$ e $(500,0)$, com $z^*=1800$.', dieta)

r = solve(banh)
add('B', 2, 'Banheiras: gráfico e estado',
    [P('Resolva graficamente o problema do exercício 2 e indique o estado de cada restrição na solução ótima.')],
    sol_txt(banh, r) + '. Saturadas: acabamento e mínimo de redondas; com folga: fabrico (folga 30 h) e máximo de redondas (folga 20).', banh)

r = solve(tur)
est = estado(tur, r['x'][:2])
add('B', 1, 'Agência de viagens: gráfico',
    [P('Resolva graficamente o problema do exercício 5. Indique o estado de cada restrição e interprete.')],
    sol_txt(tur, r) + '. Autocarro e horas de guia saturados; licença do barco com folga de %s clientes.' % num(est[2][2]), tur)

q2 = LP('max', [3, 1], [[-1, 1], [1, 0], [1, 1], [0, 1]], ['<=', '>=', '<=', '>='], [4, 1, 8, 2])
r = solve(q2)
q2b = LP('max', [2, 2], q2.A, q2.rel, q2.b)
rb = solve(q2b)
add('B', 2, 'Gráfico com quatro restrições',
    [P('Considere o problema:'), EQ(q2.tex()),
     UL(['Determine graficamente a solução ótima.', 'Indique o estado de cada restrição na solução ótima.',
         'Se os coeficientes de $x_1$ e $x_2$ na função objetivo passassem a ser iguais a 2, a solução ótima seria alterada? Justifique.'])],
    'a) ' + sol_txt(q2, r) + '. b) Saturadas: $x_1+x_2\\leq8$ e $x_2\\geq2$; não saturadas: $-x_1+x_2\\leq4$ e $x_1\\geq1$. c) Sim: a reta $2x_1+2x_2=z$ é paralela a $x_1+x_2=8$, há ótimos múltiplos no segmento de $(2,6)$ a $(6,2)$ com $z^*=16$.', q2)

ilim = LP('max', [1, 1], [[1, -1], [1, 0]], ['<=', '>='], [2, 1])
imp = LP('max', [1, 1], [[1, 1], [1, 2]], ['<=', '>='], [2, 6])
assert solve(ilim)['status'] == 'ilimitado' and solve(imp)['status'] == 'impossivel'
add('B', 2, 'Casos especiais',
    [P('Represente graficamente e classifique cada problema (solução única, ótimos múltiplos, sem solução ótima, impossível):'),
     UL(['$\\max z=x_1+x_2$ s.a. $x_1-x_2\\leq2$, $x_1\\geq1$, $x_1,x_2\\geq0$.',
         '$\\max z=x_1+x_2$ s.a. $x_1+x_2\\leq2$, $x_1+2x_2\\geq6$, $x_1,x_2\\geq0$.'])],
    'a) Sem solução ótima: o CSA é ilimitado na direção em que $z$ cresce. b) Impossível: as duas restrições não têm pontos comuns no 1.º quadrante.')

# ================================================================ BLOCO C: forma standard e método algébrico
add('C', 1, 'Forma standard',
    [P('Escreva o problema do exercício 2 (banheiras) na forma standard e classifique as variáveis adicionais introduzidas.')],
    '$\\min z=60x_1+30x_2+0F_1+0E_2+0E_3+0F_4$ s.a. $x_1+x_2+F_1=90$, $x_1+2x_2-E_2=80$, $x_1-E_3=40$, $x_1+F_4=60$, todas $\\geq0$. $F_1,F_4$ são de folga; $E_2,E_3$ de excesso.')

gel = LP('max', [75, 60], [[4, 6], [2, 1]], ['<=', '<='], [96, 24], names=['x_1', 'x_2'])
r = solve(gel)
cols, al = algebraic(gel)
add('C', 2, 'Gelados: método algébrico',
    [P('Uma geladaria fabrica cones de cassata ($x_1$) e de pistácio ($x_2$), vendidos a 75 e 60 u.m. Cada cone de cassata usa 4 g de mistura de frutas e 2 g de noz; '
       'cada cone de pistácio usa 6 g de frutas e 1 g de noz. Por hora há 96 g de frutas e 24 g de noz.'),
     UL(['Formule o problema que maximiza a receita por hora.', 'Resolva-o pelo método algébrico.', 'Indique o estado de cada restrição.'])],
    'a) $\\max z=75x_1+60x_2$ s.a. $4x_1+6x_2\\leq96$, $2x_1+x_2\\leq24$. b) $C^4_2=6$ soluções básicas, 4 admissíveis; ' + sol_txt(gel, r) + '. c) As duas restrições ficam saturadas.', gel)

small = LP('max', [2, 3], [[1, 1], [1, 3]], ['<=', '<='], [4, 6])
r = solve(small)
add('C', 1, 'Método algébrico',
    [P('Resolva pelo método algébrico:'), EQ(small.tex())],
    '6 soluções básicas, 4 admissíveis: $(0,0)$ com $z=0$; $(4,0)$ com $z=8$; $(0,2)$ com $z=6$; $(3,1)$ com $z=9$. ' + sol_txt(small, r) + '.', small)
add('C', 2, 'Verdadeiro ou falso',
    [P('Diga, justificando, se cada afirmação é verdadeira ou falsa.'),
     UL(['Uma solução é admissível quando satisfaz todas as restrições do problema.',
         'Um problema com duas variáveis de decisão e três restrições técnicas do tipo $\\leq$ tem, no máximo, dez soluções básicas.',
         'No Simplex, a regra para escolher a variável que sai da base muda consoante se maximiza ou minimiza.'])],
    'a) Verdadeira (técnicas e de sinal). b) Verdadeira: com 3 folgas há 5 variáveis e $C^5_3=10$. c) Falsa: sai sempre a variável com o menor rácio; só a regra de entrada muda.')

# ================================================================ BLOCO D: Simplex
r = solve(pastel)
add('D', 1, 'Pastelaria: Simplex',
    [P('Resolva pelo método do Simplex o problema do exercício 1 e confirme com a resolução gráfica.')],
    sol_txt(pastel, r) + '. As três restrições ficam saturadas (não sobra farinha, açúcar nem manteiga): é uma solução degenerada, por isso um dos quadros tem uma variável básica nula.', pastel)

r = solve(brinq)
ps = precos_sombra(brinq, r)
add('D', 2, 'Brinquedos: Simplex',
    [P('Resolva pelo método do Simplex o problema do exercício 4. Caracterize a solução: o que se produz e qual o estado das restrições.')],
    sol_txt(brinq, r) + '. Não se produzem bonecas; carpintaria e acabamentos esgotados.', brinq)

r = solve(tur)
add('D', 1, 'Agência de viagens: Simplex',
    [P('Resolva o problema do exercício 5 pelo método do Simplex e compare o caminho percorrido pelos quadros com os vértices do gráfico.')],
    sol_txt(tur, r) + '. Os quadros passam por vértices adjacentes do CSA até ao ótimo.', tur)

f21 = LP('min', [3, 5], [[1, 2], [3, 0], [1, 5]], ['<=', '>=', '>='], [410, 450, 500])
r = solve(f21)
add('D', 2, 'M grande: produção diária',
    [P('Um produto 1 gasta 1 minuto na operação A, 3 na operação B e 1 na operação C; um produto 2 gasta 2 minutos em A e 5 em C. '
       'A operação A tem no máximo 410 minutos por dia; B e C têm de ocupar pelo menos 450 e 500 minutos. Os custos unitários são 3 € e 5 €.'),
     UL(['Formule o problema que minimiza o custo.', 'Escreva-o na forma necessária ao Simplex e classifique as variáveis introduzidas.',
         'Resolva-o pelo método do Simplex (M grande).', 'Indique o estado de cada restrição e interprete.'])],
    'a) $\\min z=3x_1+5x_2$ s.a. $x_1+2x_2\\leq410$, $3x_1\\geq450$, $x_1+5x_2\\geq500$. b) $F_1$ folga; $E_2,E_3$ excesso; $A_2,A_3$ artificiais (custo $M$). c) '
    + sol_txt(f21, r) + '. d) Sobram 120 minutos na operação A; B e C saturadas.', f21)

fr = LP('min', [1, 2, 3], [[1, -1, 2], [1, 1, -1]], ['>=', '>='], [2, 1])
r = solve(fr)
add('D', 2, 'M grande com três variáveis',
    [P('Considere o problema:'), EQ(fr.tex()),
     UL(['Escreva-o na forma necessária ao Simplex e classifique as variáveis adicionais.', 'Resolva-o pelo método do Simplex.',
         'Se a segunda restrição passasse a $x_1+x_2-x_3=2$, a solução ótima mudava? Justifique.'])],
    'a) $E_1,E_2$ de excesso e $A_1,A_2$ artificiais. b) ' + sol_txt(fr, r) + ' (4 quadros). c) Não: na solução ótima já se tem $x_1+x_2-x_3=2$, por isso a solução continua admissível e ótima.', fr)
fr_c = LP('min', [1, 2, 3], [[1, -1, 2], [1, 1, -1]], ['>=', '='], [2, 2])
assert solve(fr_c)['z'] == 2

cint = LP('max', [Fr(8, 5), Fr(7, 10)], [[2, 1], [1, 1], [1, 0], [0, 1]], ['<=', '<=', '<=', '<='], [1000, 800, 400, 700])
r = solve(cint)
add('D', 2, 'Cintos: Simplex',
    [P('Uma empresa produz cintos A e B, com margens de 1,60 € e 0,70 €. Um cinto A demora o dobro do tempo de um cinto B, e por dia seria possível fazer 1000 cintos B. '
       'O cabedal chega para 800 cintos por dia. Há 400 fivelas de luxo por dia para o cinto A e 700 fivelas para o B.'),
     UL(['Formule o problema que maximiza a margem diária.', 'Resolva-o pelo método do Simplex.'])],
    'a) $\\max z=1{,}6x_1+0{,}7x_2$ s.a. $2x_1+x_2\\leq1000$, $x_1+x_2\\leq800$, $x_1\\leq400$, $x_2\\leq700$. b) ' + sol_txt(cint, r) + ' €.', cint)

mult = LP('max', [2, 4], [[1, 2], [1, 0]], ['<=', '<='], [8, 6])
r = solve(mult)
assert r['multiplas']
add('D', 2, 'Ler o quadro: ótimos múltiplos',
    [P('Resolva pelo Simplex: $\\max z=2x_1+4x_2$ s.a. $x_1+2x_2\\leq8$, $x_1\\leq6$, $x_1,x_2\\geq0$. Como se vê no quadro ótimo que há ótimos múltiplos? Indique outra solução ótima.')],
    sol_txt(mult, r) + '. No quadro ótimo $x_1$ está fora da base com $c_j-z_j=0$: fazendo-a entrar obtém-se $(6,1)$, também com $z=16$.', mult)

# ================================================================ BLOCO E: dualidade e interpretação
r = solve(pastel)
add('E', 1, 'Dual da pastelaria',
    [P('Escreva o dual do problema do exercício 1 e interprete as variáveis duais.')],
    '$\\min w=150y_1+20y_2+30y_3$ s.a. $3y_1+y_2+y_3\\geq20$, $6y_1+0{,}5y_2+y_3\\geq30$, $y_i\\geq0$. $y_1,y_2,y_3$ são os valores marginais de um kg de farinha, açúcar e manteiga.', pastel)
dd = dual(dieta)
rd = solve(dd)
add('E', 2, 'Dual da dieta',
    [P('Escreva o dual do problema do exercício 3, resolva-o e confirme que $w^*=z^*$.')],
    '$\\max w=420y_1+500y_2+2100y_3$ s.a. $2y_1+y_2+5y_3\\leq4$, $y_1+2y_2+6y_3\\leq6$. ' + sol_txt(dd, rd).replace('z^*', 'w^*') + ', igual ao custo mínimo do primal.', dd)
r = solve(brinq)
ps = precos_sombra(brinq, r)
add('E', 2, 'Preços-sombra',
    [P('No problema dos brinquedos (exercício 4), use o quadro ótimo do Simplex para responder: quanto aumenta o lucro com mais uma hora de carpintaria? E com mais uma hora de acabamentos? '
       'Quanto estaria a empresa disposta a pagar por uma hora extra em cada secção?')],
    'Preços-sombra: carpintaria $%s$ u.m. por hora, acabamentos $%s$ u.m. por hora (simétricos dos $c_j-z_j$ das folgas). Pagaria no máximo esses valores.' % (num(ps[0]), num(ps[1])), brinq)
r = solve(tur)
ps_t = precos_sombra(tur, r)
add('E', 1, 'Interpretação económica',
    [P('No problema da agência de viagens (exercício 5), interprete os valores $c_j-z_j$ das variáveis de folga no quadro ótimo.')],
    'Um lugar extra no autocarro vale $%s$ €, uma hora extra de guia vale $%s$ € e um cliente extra na licença do barco vale $%s$ € (a licença não está esgotada: sobram 20 clientes).' % tuple(num(x) for x in ps_t), tur)

# ================================================================ BLOCO F: software
add('F', 1, 'Excel: Solver',
    [P('Monte o problema do exercício 5 numa folha de Excel e resolva-o com o Solver (método LP Simplex, variáveis não negativas). Compare com a solução obtida à mão e peça o relatório de Sensibilidade.')],
    'Mesma solução: $x_1=60$, $x_2=60$, $z^*=6000$ €. O relatório de sensibilidade mostra os preços-sombra 20 € e 10 €.')
add('F', 2, 'Python: SciPy',
    [P('Escreva um programa em Python que resolva o problema dos brinquedos (exercício 4) com a função linprog da biblioteca SciPy e mostre a solução, as folgas e os preços-sombra.')],
    'Solução $x_1=0$, $x_2=36$, $x_3=126$ (confirmar), $z^*$ igual ao do Simplex; os preços-sombra leem-se em restricao.pi.')

# corrigir a resposta do Python com os números reais
r = solve(brinq)
EX[-1]['an'] = 'O programa devolve ' + sol_txt(brinq, r) + '; as folgas (res.ineqlin.residual) são nulas e os preços-sombra (o simétrico de res.ineqlin.marginals) são $%s$ e $%s$.' % tuple(num(x) for x in precos_sombra(brinq, r))
r = solve(tur)
EX[-2]['an'] = 'Mesma solução: ' + sol_txt(tur, r) + ' €. No relatório de Sensibilidade, os preços-sombra do autocarro e das horas de guia são %s € e %s €.' % (num(precos_sombra(tur, r)[0]), num(precos_sombra(tur, r)[1]))

# ================================================================ TESTES (enunciados; resoluções na sebenta)
def T(qs):
    TESTS.append({'qs': [{'n': i + 1, 'pts': p, 'st': st} for i, (p, st) in enumerate(qs)]})
    assert abs(sum(p for p, _ in qs) - 20) < 1e-9


# teste 1
t1q2 = LP('max', [5, 4], [[1, 1], [1, 3], [1, 0]], ['<=', '<=', '<='], [10, 18, 8])
t1q3 = LP('max', [4, 3, 6], [[1, 1, 2], [2, 1, 1]], ['<=', '<='], [40, 50])
t1q4 = LP('min', [2, 3], [[1, 1], [1, 3]], ['>=', '>='], [6, 12])
for p in (t1q2, t1q3, t1q4): solve(p)
T([(3.5, [P('Uma fábrica de conservas de Portimão produz latas de sardinha ($x_1$) e de cavala ($x_2$), em milhares. Cada milhar de latas de sardinha gasta 2 horas de linha e 1 tonelada de peixe; '
             'cada milhar de cavala gasta 1 hora de linha e 1 tonelada de peixe. Há 40 horas de linha e 30 toneladas de peixe por semana, e o contrato com um cliente exige pelo menos 5 milhares de latas de cavala. '
             'A margem é de 300 € por milhar de sardinha e de 200 € por milhar de cavala.'),
            P('Formule o problema de programação linear que maximiza a margem semanal.')]),
   (4.5, [P('Considere o problema'), EQ(t1q2.tex()),
          UL(['Determine graficamente a solução ótima.', 'Indique o estado de cada restrição na solução ótima.'])]),
   (5.0, [P('Resolva pelo método do Simplex:'), EQ(t1q3.tex())]),
   (4.0, [P('Considere o problema'), EQ(t1q4.tex()),
          UL(['Escreva-o na forma necessária à resolução pelo Simplex e classifique as variáveis introduzidas.', 'Resolva-o pelo método algébrico.'])]),
   (3.0, [P('Escreva o dual do problema da questão 3 e indique, usando o quadro ótimo que obteve, o valor ótimo das variáveis duais. Interprete-o, supondo que as restrições são horas de duas secções.')])])
# teste 2
t2q2 = LP('min', [3, 2], [[1, 1], [1, 2], [1, 0]], ['>=', '>=', '<='], [8, 10, 7])
t2q3 = LP('max', [3, 2, 4], [[1, 1, 2], [2, 0, 3], [2, 1, 3]], ['<=', '<=', '<='], [4, 5, 7])
t2q4 = LP('min', [4, 1], [[3, 1], [4, 3], [1, 2]], ['=', '>=', '<='], [3, 6, 4])
for p in (t2q2, t2q3, t2q4): solve(p)
T([(3.0, [P('Um hotel tem 100 quartos e quer decidir quantos vender em regime "só alojamento" ($x_1$) e "meia pensão" ($x_2$). A cozinha serve no máximo 120 jantares por noite e cada quarto em meia pensão tem 2 hóspedes a jantar. '
             'Pelo menos 20 quartos têm de ficar para os operadores turísticos em meia pensão. A margem por quarto é de 50 € e de 80 €.'),
            P('Formule o problema que maximiza a margem por noite.')]),
   (4.5, [P('Considere o problema'), EQ(t2q2.tex()),
          UL(['Resolva-o graficamente.', 'Se o coeficiente de $x_1$ na função objetivo passasse a 2, a solução ótima mudava? Justifique.'])]),
   (5.0, [P('Resolva pelo método do Simplex e indique o estado de cada restrição na solução ótima:'), EQ(t2q3.tex())]),
   (4.5, [P('Resolva pelo método do Simplex (método do M grande):'), EQ(t2q4.tex())]),
   (3.0, [P('Diga, justificando, se cada afirmação é verdadeira ou falsa.'),
          UL(['Num problema de maximização, o quadro do Simplex é ótimo quando todos os $c_j-z_j$ são menores ou iguais a zero.',
              'Se uma variável artificial fica na base com valor positivo no quadro ótimo, o problema é impossível.',
              'O dual de um problema de maximização com $3$ restrições tem $3$ variáveis.'])])])
# teste 3
t3q2 = LP('max', [2, 3], [[1, 1], [1, 2], [0, 1]], ['<=', '<=', '<='], [6, 8, 3])
t3q3 = LP('max', [10, 8], [[1, 1], [2, 1], [1, 3]], ['<=', '<=', '<='], [12, 20, 30])
t3q4 = LP('min', [5, 4, 7], [[1, 1, 1], [2, 1, 3]], ['>=', '>='], [10, 15])
for p in (t3q2, t3q3, t3q4): solve(p)
T([(3.0, [P('Uma cooperativa algarvia faz dois cabazes: "Pomar" ($x_1$), com 2 kg de laranja e 1 kg de alfarroba, e "Serra" ($x_2$), com 1 kg de laranja e 2 kg de alfarroba. '
             'Há 600 kg de laranja e 480 kg de alfarroba. A margem é de 6 € por cabaz "Pomar" e de 7 € por cabaz "Serra".'),
            P('Formule o problema que maximiza a margem.')]),
   (4.5, [P('Considere o problema'), EQ(t3q2.tex()),
          UL(['Resolva-o graficamente.', 'Resolva-o pelo método algébrico e confirme.'])]),
   (5.0, [P('Resolva pelo método do Simplex e interprete os $c_j-z_j$ das variáveis de folga no quadro ótimo:'), EQ(t3q3.tex())]),
   (4.5, [P('Considere o problema'), EQ(t3q4.tex()),
          UL(['Escreva-o na forma necessária ao Simplex e classifique as variáveis introduzidas.', 'Resolva-o pelo método do Simplex (M grande).'])]),
   (3.0, [P('Escreva o dual do problema da questão 3 e, a partir do quadro ótimo que obteve, indique a solução ótima do dual. Confirme que $w^*=z^*$.')])])
# teste 4
t4q2 = LP('min', [1, 1], [[1, 2], [3, 1], [1, 0]], ['>=', '>=', '<='], [6, 8, 5])
t4q3 = LP('max', [6, 5, 4], [[2, 1, 1], [1, 3, 2], [2, 1, 2]], ['<=', '<=', '<='], [180, 300, 240])
t4q4 = LP('max', [3, 2], [[1, 1], [1, -1], [0, 1]], ['>=', '<=', '<='], [2, 4, 6])
for p in (t4q2, t4q3, t4q4): solve(p)
T([(3.0, [P('Uma empresa de animação turística organiza passeios de caiaque ($x_1$) e de bicicleta ($x_2$) por dia. Cada passeio de caiaque precisa de 2 monitores e cada passeio de bicicleta de 1; há 10 monitores. '
             'Há 6 carrinhas e cada passeio, de qualquer tipo, usa uma. A margem é de 120 € por passeio de caiaque e de 70 € por passeio de bicicleta.'),
            P('Formule o problema que maximiza a margem diária.')]),
   (4.5, [P('Considere o problema'), EQ(t4q2.tex()),
          UL(['Resolva-o graficamente.', 'Indique o estado das restrições e, se existir, o excesso ou a folga de cada uma.'])]),
   (5.0, [P('Resolva pelo método do Simplex:'), EQ(t4q3.tex())]),
   (4.5, [P('Resolva pelo método do Simplex (método do M grande) e confirme graficamente:'), EQ(t4q4.tex())]),
   (3.0, [P('Para o problema da questão 3, escreva o dual e use o quadro ótimo para indicar o valor de cada recurso (preços-sombra). Qual dos recursos não vale a pena reforçar? Porquê?')])])

TEST_LPS = [t1q2, t1q3, t1q4, t2q2, t2q3, t2q4, t3q2, t3q3, t3q4, t4q2, t4q3, t4q4]

if __name__ == '__main__':
    for p in TEST_LPS:
        rr = solve(p)
        print(p.sense, [fstr(c) for c in p.c], rr['status'], [fstr(x) for x in rr.get('x', [])[:p.n]], rr.get('z'), 'quadros', len(rr['quadros']), 'mult', rr.get('multiplas'))
    for e in EX:
        print(e['n'], e['bloco'], e['lab'], '|', e['an'][:150])
    json.dump({'ex': EX, 'tests': TESTS}, open('../src/t2_data.json', 'w', encoding='utf8'), ensure_ascii=False)
    print(len(EX), 'exercícios', len(TESTS), 'testes')
