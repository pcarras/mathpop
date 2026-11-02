"""Parte I da sebenta do Tema 2: teoria (capítulos 1 a 10)."""
from auto import *

# ---------------------------------------------------------------- problemas de referência
EX1 = LP('max', [30, 20], [[3, 1], [1, 2]], ['<=', '<='], [150, 100])
CARNE = LP('min', [8, 6], [[Fr(1, 5), Fr(8, 25)], [1, 1]], ['<=', '='], [Fr(1, 4), 1], names=['x', 'y'])
CHV = LP('max', [5, 4, 3], [[2, 3, 1], [4, 1, 2], [3, 4, 2]], ['<='] * 3, [5, 11, 8])
MULT = LP('max', [10, 20], [[3, 1], [1, 2]], ['<=', '<='], [150, 100])
ILIM = LP('max', [2, 1], [[1, -1], [1, 0]], ['<=', '>='], [2, 1])
IMP = LP('max', [1, 1], [[1, 1], [1, 2]], ['<=', '>='], [2, 6])
M1 = LP('min', [2, 3], [[2, 1], [1, 2], [1, 1]], ['>=', '>=', '<='], [8, 10, 10])
MEQ = LP('max', [3, 2], [[1, 1], [1, 0], [0, 1]], ['=', '<=', '>='], [4, 3, 1])
DEX = LP('min', [2, 3], [[1, 1], [1, 3]], ['>=', '>='], [4, 6])

R_EX1 = simplex(EX1)
assert R_EX1['z'] == 1800 and R_EX1['x'][:2] == [40, 30]
assert precos_sombra(EX1, R_EX1) == [8, 6]
assert simplex(LP('max', [30, 20], [[3, 1], [1, 2]], ['<=', '<='], [151, 100]))['z'] == 1808
assert simplex(LP('max', [30, 20], [[3, 1], [1, 2]], ['<=', '<='], [150, 101]))['z'] == 1806
assert simplex(CHV)['z'] == 13 and simplex(M1)['z'] == 16 and simplex(MEQ)['z'] == 11 and simplex(DEX)['z'] == 9
assert simplex(CARNE)['z'] == Fr(43, 6)
assert simplex(MULT)['multiplas'] and simplex(ILIM)['status'] == 'ilimitado' and simplex(IMP)['status'] == 'impossivel'
for p in (EX1, CARNE, CHV, M1, MEQ, DEX):
    st, x, z = solve_check(p); assert abs(z - float(simplex(p)['z'])) < 1e-7

PRAT = {}   # capítulo -> texto "Para praticar" (preenchido pelo construtor)


def praticar(k):
    return P('**Para praticar:** ' + PRAT.get(k, ''))


def cap1():
    return [
        Chapter('Introdução à programação linear',
                'Decidir quanto produzir, quantos quartos vender em cada tarifa ou como gastar um orçamento de publicidade são escolhas com recursos limitados. A programação linear transforma este tipo de escolha num modelo matemático que se resolve com um método exato.',
                ['O que é um problema de programação linear e de onde vem o nome.', 'Onde se usa em gestão, hotelaria e turismo.', 'Os quatro ingredientes de um modelo: variáveis de decisão, função objetivo, restrições técnicas e restrições de sinal.', 'As hipóteses que tornam um modelo linear.', 'Soluções admissíveis e solução ótima.']),
        Sec('O que é programar?'),
        P('Em programação linear, **programar** quer dizer **planear**: escolher os níveis de um conjunto de atividades (produzir, comprar, transportar, investir) de modo a obter o melhor resultado possível sem ultrapassar os recursos disponíveis. A palavra vem dos planos militares e industriais dos anos 40, muito antes dos programas de computador.'),
        P('O método que vamos estudar, o **método do Simplex**, foi proposto por George Dantzig em 1947, quando trabalhava no planeamento da Força Aérea dos Estados Unidos. Alguns anos antes, em 1939, o matemático soviético Leonid Kantorovich tinha já formulado problemas de planeamento da produção com a mesma estrutura. Kantorovich e Tjalling Koopmans receberam em 1975 o Prémio Nobel da Economia pelos seus contributos para a teoria da afetação ótima de recursos.'),
        Margin('nota', 'Linear', 'O adjetivo diz respeito à forma das expressões: todas são somas de constantes vezes variáveis, sem produtos entre variáveis nem potências.'),
        Sec('Onde se usa'),
        P('A programação linear é uma das ferramentas mais usadas em gestão. Alguns exemplos:'),
        Ul(['**Plano de produção:** quanto fabricar de cada produto, com matérias-primas e horas de trabalho limitadas.',
            '**Mistura:** a ração, a dieta ou o lote de café mais barato que cumpre requisitos de qualidade.',
            '**Hotelaria:** quantos quartos reservar para cada canal de venda (operadores, agências, venda direta) com capacidade fixa.',
            '**Afetação de pessoal:** quantos funcionários pôr em cada turno para cobrir a procura ao menor custo.',
            '**Transportes:** quanto enviar de cada armazém para cada cliente, ao menor custo.',
            '**Investimento:** como dividir um capital por várias aplicações, com limites de risco e de liquidez.']),
        Sec('Os ingredientes de um modelo'),
        P('Todos os problemas deste tema têm a mesma estrutura. Vejamos primeiro um caso concreto, que nos vai acompanhar ao longo de todo o tema.'),
        Box('exemplo', 'Produtos A e B', [
            P('Uma empresa produz semanalmente dois produtos, A e B, que usam matéria-prima e horas de trabalho:'),
            Tab(['', 'Matéria-prima', 'Horas de trabalho', 'Lucro unitário'], [['Produto A', '3 kg', '1 h', '30 €'], ['Produto B', '1 kg', '2 h', '20 €'], ['Disponível', '150 kg', '100 h', '']]),
            P('Quanto deve produzir de cada produto para obter o maior lucro?'),
            P('Designando por $x_1$ e $x_2$ as unidades de A e de B produzidas por semana, o lucro é $30x_1+20x_2$; a matéria-prima gasta é $3x_1+x_2$ e não pode passar de 150 kg; as horas usadas são $x_1+2x_2$ e não podem passar de 100 horas. As quantidades não podem ser negativas. O modelo é'),
            Eq(model(EX1))]),
        P('Neste modelo encontramos os quatro ingredientes de qualquer problema de programação linear.'),
        Box('def', 'Problema de programação linear', [
            P('Um **problema de programação linear** (PL) consiste em maximizar ou minimizar uma função linear de $n$ variáveis, sujeita a um conjunto de restrições lineares:'),
            Eq(r'\begin{array}{ll}\text{Max (ou Min)} & z=c_1x_1+c_2x_2+\cdots+c_nx_n\\[3pt]\text{s.a.} & a_{11}x_1+a_{12}x_2+\cdots+a_{1n}x_n\;(\leq,=,\geq)\;b_1\\ & \qquad\vdots\\ & a_{m1}x_1+a_{m2}x_2+\cdots+a_{mn}x_n\;(\leq,=,\geq)\;b_m\\ & x_1,x_2,\dots,x_n\geq0\end{array}'),
            Ul(['$x_1,\\dots,x_n$ são as **variáveis de decisão**: o que queremos determinar.',
                '$z$ é a **função objetivo**; $c_j$ é o contributo de uma unidade de $x_j$ (lucro, custo, receita).',
                'As $m$ desigualdades ou igualdades são as **restrições técnicas**; $b_i$ é o **termo independente** (recurso disponível ou exigência mínima) e $a_{ij}$ é o consumo do recurso $i$ por unidade de $x_j$.',
                '$x_j\\geq0$ são as **restrições de sinal** (ou de não negatividade).'])]),
        Margin('notacao', 'Notação', '"s.a." lê-se "sujeito a". Nos testes escreva sempre Max ou Min, a função objetivo, as restrições técnicas e as restrições de sinal.'),
        P('A função objetivo diz **o que queremos**; as restrições dizem **o que podemos**. Um modelo sem restrições não tem interesse: o lucro cresceria sem limite.'),
        Sec('Hipóteses do modelo linear'),
        P('Escrever um problema real como um modelo linear supõe quatro hipóteses. Vale a pena confirmá-las antes de confiar na solução.'),
        Box('prop', 'Hipóteses da programação linear', [
            Ul(['**Proporcionalidade:** o contributo de cada variável para a função objetivo e para cada restrição é proporcional ao seu valor (o dobro de bolos gasta o dobro da farinha e dá o dobro do lucro).',
                '**Aditividade:** o total é a soma dos contributos de cada variável (não há efeitos de interação).',
                '**Divisibilidade:** as variáveis podem tomar valores fracionários (40,5 kg de café faz sentido; 40,5 autocarros não).',
                '**Certeza:** os coeficientes $c_j$, $a_{ij}$ e $b_i$ são conhecidos e constantes.'])]),
        Box('atencao', 'O que não é linear', [
            P('Não são lineares, por exemplo, $x_1x_2$, $x_1^2$, $\\sqrt{x_2}$, $\\dfrac{x_1}{x_2}$ ou $|x_1|$. Uma restrição como $\\dfrac{x_1}{x_1+x_2}\\geq0{,}3$ parece não linear, mas multiplicando pelo denominador (positivo) obtém-se $x_1\\geq0{,}3(x_1+x_2)$, isto é, $0{,}7x_1-0{,}3x_2\\geq0$, que já é linear.')]),
        P('Quando a divisibilidade falha (unidades que só podem ser inteiras), o problema passa a ser de **programação inteira**, que não estudamos aqui. Em muitos casos práticos a solução do modelo linear, arredondada com cuidado, é uma boa aproximação.'),
        Sec('Soluções admissíveis e solução ótima'),
        Box('def', 'Solução admissível e solução ótima', [
            P('Uma **solução** é qualquer conjunto de valores $(x_1,\\dots,x_n)$. É **admissível** se satisfaz todas as restrições (técnicas e de sinal). O conjunto de todas as soluções admissíveis chama-se **conjunto das soluções admissíveis** (CSA). Uma **solução ótima** é uma solução admissível com o melhor valor possível da função objetivo; esse valor representa-se por $z^*$.')]),
        P('No exemplo dos produtos A e B, $(x_1,x_2)=(20,20)$ é admissível: gasta $3\\cdot20+20=80\\leq150$ kg e $20+2\\cdot20=60\\leq100$ horas, com lucro $z=1000$ €. Já $(60,10)$ não é admissível, porque gasta $190$ kg de matéria-prima. Veremos no capítulo 3 que a solução ótima é $(40,30)$, com $z^*=1800$ €.'),
        Box('resumo', 'Capítulo 1', [Ul([
            'Um problema de PL maximiza ou minimiza uma função linear sujeita a restrições lineares.',
            'Ingredientes: variáveis de decisão, função objetivo, restrições técnicas, restrições de sinal.',
            'Hipóteses: proporcionalidade, aditividade, divisibilidade e certeza.',
            'Solução admissível: cumpre todas as restrições. Solução ótima: a melhor das admissíveis.'])]),
        praticar(1),
    ]


def cap2():
    return [
        Chapter('Formulação de problemas',
                'Formular é traduzir um enunciado para a linguagem do modelo. É o passo que exige mais atenção, porque um erro aqui estraga tudo o que vem a seguir, mesmo que as contas estejam certas.',
                ['Um método em quatro passos para formular.', 'Problemas de maximização e de minimização.', 'Como traduzir as frases mais comuns dos enunciados ("no máximo", "pelo menos", "o dobro de", percentagens).', 'Problemas com três ou mais variáveis.']),
        Sec('Um método em quatro passos'),
        Box('metodo', 'Formular um problema de PL', [Ul([
            '**Variáveis de decisão.** Pergunte "o que tenho de decidir?" e defina cada variável com a sua unidade (unidades por semana, kg por lote, quartos por noite).',
            '**Função objetivo.** Identifique o que se quer maximizar (lucro, receita, margem) ou minimizar (custo, tempo) e escreva-o como soma de $c_jx_j$.',
            '**Restrições técnicas.** Para cada recurso ou exigência, escreva "o que se usa" $\\leq$, $\\geq$ ou $=$ "o que há ou o que se exige". Confirme que as unidades dos dois lados são iguais.',
            '**Restrições de sinal.** Acrescente $x_j\\geq0$ para todas as variáveis.'], 'num')]),
        Margin('dica', 'Dica', 'Uma tabela com uma linha por produto e uma coluna por recurso ajuda a ler o enunciado. As restrições leem-se depois por colunas.'),
        P('Voltemos ao exemplo dos produtos A e B do capítulo 1, agora com o método.'),
        Box('exemplo', 'Produtos A e B, passo a passo', [Ul([
            '**Variáveis:** $x_1$ = unidades de A produzidas por semana; $x_2$ = unidades de B produzidas por semana.',
            '**Objetivo:** lucro semanal, $z=30x_1+20x_2$ (em euros), a maximizar.',
            '**Restrições técnicas:** matéria-prima $3x_1+x_2\\leq150$ (kg); horas de trabalho $x_1+2x_2\\leq100$ (h).',
            '**Sinal:** $x_1,x_2\\geq0$.'], 'num'), Eq(model(EX1))]),
        Sec('Minimizar também é otimizar'),
        P('Nos problemas de custo o objetivo é minimizar. As restrições costumam ser de "pelo menos" (exigências de qualidade ou de procura), e é preciso cuidado para não aceitar a solução trivial de não fazer nada.'),
        Box('exemplo', 'Mistura de carne', [
            P('Um talho faz uma mistura de carne picada com carne de vaca (20 % de gordura, 8 €/kg) e carne de porco (32 % de gordura, 6 €/kg). A mistura não pode ter mais de 25 % de gordura. Qual é a composição mais barata de um quilo de mistura?'),
            P('Sejam $x$ e $y$ os kg de vaca e de porco em cada kg de mistura. O custo é $8x+6y$. A gordura da mistura é $0{,}2x+0{,}32y$ kg e não pode passar de $0{,}25$ kg. Como se trata de um quilo de mistura, $x+y=1$:'),
            Eq(model(CARNE)),
            P('Sem a igualdade $x+y=1$ o mínimo seria $x=y=0$, com custo zero: não fazer mistura nenhuma. É a restrição que obriga a produzir.')]),
        Margin('atencao', 'Atenção', 'Num problema de minimização, pergunte sempre: o que impede a solução $x=0$? Se nada a impede, falta uma restrição.'),
        Sec('Traduzir frases dos enunciados'),
        P('Algumas expressões aparecem muitas vezes. A tabela seguinte mostra como se traduzem, supondo $x_1$ e $x_2$ as quantidades de dois produtos.'),
        Tab(['Frase do enunciado', 'Restrição'], [
            ['Há no máximo 40 horas', '$\\cdots\\leq40$'], ['É preciso pelo menos 20 unidades de B', '$x_2\\geq20$'],
            ['Devem produzir-se exatamente 100 unidades no total', '$x_1+x_2=100$'],
            ['A produção de A não pode exceder o dobro da de B', '$x_1\\leq2x_2$, ou seja, $x_1-2x_2\\leq0$'],
            ['A produz-se em quantidade igual à de B', '$x_1-x_2=0$'],
            ['A representa pelo menos 30 % do total', '$x_1\\geq0{,}3(x_1+x_2)$, ou seja, $0{,}7x_1-0{,}3x_2\\geq0$'],
            ['Entre 40 e 60 unidades de A', '$x_1\\geq40$ e $x_1\\leq60$ (duas restrições)']], align='ll'),
        Box('atencao', 'Variáveis dos dois lados', [P('No modelo, cada restrição escreve-se com as variáveis à esquerda e uma constante à direita. "$x_1\\leq2x_2$" está certo como ideia, mas deve passar a $x_1-2x_2\\leq0$ antes de resolver.')]),
        Sec('Problemas com mais variáveis'),
        P('O método não muda com o número de variáveis. Só a resolução gráfica fica limitada a duas.'),
        Box('exemplo', 'Orçamento de publicidade', [
            P('Um hotel de Albufeira tem 6000 € para uma campanha na rádio, num jornal regional e nas redes sociais. Cada anúncio custa 300 €, 400 € e 100 €, e chega, em média, a 5000, 6000 e 2000 pessoas. O hotel quer pelo menos 4 anúncios na rádio, e as redes sociais não podem ter mais de 20 anúncios. Como distribuir os anúncios para chegar ao maior número de pessoas?'),
            P('Com $x_1,x_2,x_3$ os números de anúncios na rádio, no jornal e nas redes sociais (e $z$ em milhares de pessoas):'),
            Eq(model(LP('max', [5, 6, 2], [[300, 400, 100], [1, 0, 0], [0, 0, 1]], ['<=', '>=', '<='], [6000, 4, 20], names=['x_1', 'x_2', 'x_3']))),
            P('Este modelo resolve-se pelo método do Simplex (capítulos 5 e 6) ou no computador (capítulo 9).')]),
        Box('resumo', 'Capítulo 2', [Ul([
            'Variáveis com unidades; função objetivo; restrições técnicas; restrições de sinal.',
            '"No máximo" dá $\\leq$, "pelo menos" dá $\\geq$, "exatamente" dá $=$.',
            'Relações entre variáveis e percentagens passam-se para a forma "variáveis à esquerda, constante à direita".',
            'Em minimização, confirme que o modelo não aceita a solução de não fazer nada.'])]),
        praticar(2),
    ]


def cap3():
    b_ex1, i_ex1 = graf(EX1, 'g_ex1', (110, 110), labels=['$3x_1+x_2=150$', '$x_1+2x_2=100$'], labpos=[(18, 96), (82, 13)], ticks=([0, 20, 40, 60, 80, 100], [0, 20, 40, 60, 80, 100]))
    b_car, i_car = graf(CARNE, 'g_carne', (1.05, 1.05), labels=['$0{,}2x+0{,}32y=0{,}25$', '$x+y=1$'], labpos=[(0.02, 0.86), (0.1, 0.93)])
    b_mul, _ = graf(MULT, 'g_mult', (110, 110), labels=['$3x_1+x_2=150$', '$x_1+2x_2=100$'], labpos=[(18, 96), (82, 13)], intro=False)
    lp_figure('g_ilim', ILIM, (8, 8), labels=['$x_1-x_2=2$', '$x_1=1$'], labpos=[(4.6, 1.8), (1.1, 7.2)], size=(3.6, 3.1), iso=6)
    lp_figure('g_imp', IMP, (7, 5), labels=['$x_1+x_2=2$', '$x_1+2x_2=6$'], labpos=[(0.2, 1.9), (2.5, 1.9)], size=(3.6, 3.1), csa=False)
    xs = i_car['opt'][0]
    return [
        Chapter('Resolução gráfica',
                'Com duas variáveis, cada solução é um ponto do plano. Podemos desenhar o conjunto das soluções admissíveis e ver onde a função objetivo é melhor. Além de resolver problemas pequenos, o gráfico dá a intuição de tudo o que vem depois.',
                ['Como representar uma restrição e o conjunto das soluções admissíveis (CSA).', 'As retas de nível da função objetivo.', 'Porque é que o ótimo está num vértice.', 'O estado de cada restrição: saturada ou não saturada.', 'Os casos especiais: ótimos múltiplos, sem solução ótima e problema impossível.', 'O que acontece quando muda um coeficiente da função objetivo.']),
        Sec('Representar uma restrição'),
        P('Uma restrição $a_1x_1+a_2x_2\\leq b$ (ou $\\geq b$) representa-se em dois passos. Primeiro desenhamos a reta $a_1x_1+a_2x_2=b$, por exemplo pelos pontos em que corta os eixos. Depois escolhemos o semiplano certo: basta testar um ponto que não esteja sobre a reta, em geral a origem $(0,0)$. Se a origem satisfaz a restrição, o semiplano é o que a contém; se não, é o outro.'),
        P('As restrições de sinal $x_1,x_2\\geq0$ limitam o gráfico ao primeiro quadrante. Uma igualdade, como $x+y=1$, não dá um semiplano mas a própria reta.'),
        QR('pl-grafico', 'Resolução gráfica', 'Edite as restrições, arraste a reta da função objetivo e veja o ótimo.'),
        Box('def', 'Conjunto das soluções admissíveis', [P('O **conjunto das soluções admissíveis** (CSA) é a interseção dos semiplanos de todas as restrições, técnicas e de sinal. Num problema de PL é sempre um polígono **convexo** (o segmento entre dois pontos do CSA está todo no CSA), que pode ser limitado, ilimitado ou vazio. Os seus "cantos" chamam-se **vértices**.')]),
        Sec('Retas de nível da função objetivo'),
        P('Fixando um valor $k$ para a função objetivo, os pontos com $c_1x_1+c_2x_2=k$ formam uma reta. Para valores diferentes de $k$ obtêm-se **retas paralelas** (todas com declive $-c_1/c_2$), chamadas **retas de nível** (de isolucro, num lucro; de isocusto, num custo). Ao deslocar a reta no sentido do vetor $(c_1,c_2)$ o valor de $z$ aumenta; no sentido contrário, diminui.'),
        Box('teo', 'Teorema fundamental da programação linear', [P('Se um problema de PL tem solução ótima, então há pelo menos um **vértice** do CSA que é solução ótima.')]),
        P('A razão vê-se no gráfico: deslocamos a reta de nível no sentido em que $z$ melhora até ao último ponto em que ainda toca o CSA. Esse último contacto é um vértice ou, se a reta for paralela a um lado, um lado inteiro (e então os dois vértices desse lado são ótimos). Por isso basta comparar os vértices.'),
        Box('metodo', 'Resolução gráfica', [Ul([
            'Desenhar cada restrição técnica (reta e semiplano) no primeiro quadrante.',
            'Identificar o CSA e os seus vértices.',
            'Calcular as coordenadas de cada vértice, resolvendo o sistema das duas retas que nele se cruzam.',
            'Calcular $z$ em cada vértice e escolher o maior (Max) ou o menor (Min). Em alternativa, deslocar a reta de nível até ao último vértice.',
            'Escrever a solução: valores das variáveis e $z^*$.'], 'num')]),
        Box('exemplo', 'Produtos A e B, resolução gráfica', [P('Resolvamos graficamente:'), Eq(model(EX1))] + b_ex1 + [
            P('O vértice B resulta do sistema $3x_1+x_2=150$, $x_1+2x_2=100$. Da primeira, $x_2=150-3x_1$; substituindo na segunda, $x_1+300-6x_1=100$, logo $x_1=40$ e $x_2=30$.'),
            P('**Interpretação:** a empresa deve produzir 40 unidades de A e 30 de B por semana, com lucro máximo de 1800 €. **Confirmação:** $3\\cdot40+30=150$ e $40+2\\cdot30=100$, as duas restrições são cumpridas.')]),
        Box('exemplo', 'Mistura de carne, um CSA que é um segmento', [Eq(model(CARNE))] + b_car + [
            P('Como $x+y=1$ é uma igualdade, o CSA reduz-se à parte da reta $x+y=1$ que cumpre a restrição da gordura. Substituindo $y=1-x$ em $0{,}2x+0{,}32y\\leq0{,}25$ obtém-se $0{,}32-0{,}12x\\leq0{,}25$, isto é, $x\\geq\\frac{7}{12}$. O custo $8x+6(1-x)=6+2x$ cresce com $x$, por isso o mínimo está em $x=\\frac{7}{12}$: a mistura mais barata tem $\\frac{7}{12}$ kg de vaca e $\\frac{5}{12}$ kg de porco, e custa $\\frac{43}{6}\\approx7{,}17$ € por kg.')]),
        Sec('Estado das restrições'),
        Box('def', 'Restrição saturada', [P('Na solução ótima, uma restrição está **saturada** (ou ativa) quando se verifica com igualdade: o recurso foi todo usado ou a exigência foi cumprida à justa. Caso contrário está **não saturada**: sobra recurso (**folga**) ou a exigência é ultrapassada (**excesso**).')]),
        P('No exemplo dos produtos A e B, as duas restrições estão saturadas em $(40,30)$: não sobra matéria-prima nem horas. Se houvesse também um limite de procura $x_1\\leq45$, essa restrição ficaria não saturada, com folga $45-40=5$ unidades.'),
        Margin('dica', 'Dica de exame', 'Quando o enunciado pede o "estado das restrições", diga se cada uma está saturada e indique o valor da folga ou do excesso, com unidades.'),
        Sec('Casos especiais'),
        P('Nem todos os problemas têm uma solução ótima única. Há quatro situações a reconhecer.'),
        Sub('Ótimos múltiplos'),
        P('Se a reta de nível for paralela a um lado do CSA que é o último a ser tocado, todos os pontos desse lado são ótimos. Com o lucro de A a passar para 10 € no exemplo dos produtos, temos $z=10x_1+20x_2$, cujas retas de nível são paralelas a $x_1+2x_2=100$:')] + b_mul + [
        Sub('Sem solução ótima (solução ilimitada)'),
        P('Se o CSA é ilimitado na direção em que $z$ melhora, a reta de nível pode afastar-se sem limite e $z$ cresce indefinidamente. Por exemplo, $\\max z=2x_1+x_2$ s.a. $x_1-x_2\\leq2$, $x_1\\geq1$: o CSA estende-se para cima sem fim.'),
        Fig('g_ilim', 'CSA ilimitado: a reta $2x_1+x_2=k$ pode subir sem limite.', 0.5),
        Margin('atencao', 'Atenção', 'Um CSA ilimitado não implica falta de solução ótima. Num problema de minimização com coeficientes positivos é comum o CSA ser ilimitado e o mínimo existir.'),
        Sub('Problema impossível'),
        P('Se as restrições forem incompatíveis, o CSA é vazio e o problema é **impossível**. Por exemplo, $x_1+x_2\\leq2$ e $x_1+2x_2\\geq6$ não têm pontos comuns no primeiro quadrante: o maior valor de $x_1+2x_2$ com $x_1+x_2\\leq2$ é 4.'),
        Fig('g_imp', 'As duas regiões não se intersetam no primeiro quadrante.', 0.5),
        Sub('Resumo dos casos'),
        Tab(['Caso', 'No gráfico', 'Conclusão'], [
            ['Solução ótima única', 'A reta de nível toca o CSA num só vértice', 'Um ponto ótimo'],
            ['Ótimos múltiplos', 'A reta de nível coincide com um lado', 'Um segmento (ou semirreta) de ótimos'],
            ['Sem solução ótima', 'CSA ilimitado no sentido em que $z$ melhora', '$z$ sem limite'],
            ['Impossível', 'CSA vazio', 'Não há soluções admissíveis']], align='lll'),
        Sec('E se o lucro mudar?'),
        P('A solução ótima mantém-se enquanto a reta de nível continuar a "sair" do CSA pelo mesmo vértice, isto é, enquanto o seu declive $-c_1/c_2$ ficar entre os declives das duas retas que formam esse vértice.'),
        Box('exemplo', 'Intervalo de otimalidade do lucro de A', [
            P('No exemplo dos produtos, o vértice ótimo $B=(40,30)$ é formado pelas retas $3x_1+x_2=150$ (declive $-3$) e $x_1+2x_2=100$ (declive $-\\frac12$). Mantendo $c_2=20$, a solução continua ótima se'),
            Eq(r'-3\leq-\frac{c_1}{20}\leq-\frac{1}{2}\iff 10\leq c_1\leq60.'),
            P('Assim, se o lucro unitário de A passar a 50 €, a produção ótima continua a ser $(40,30)$ e o lucro sobe para $50\\cdot40+20\\cdot30=2600$ €. Se passar a 10 €, há ótimos múltiplos (o caso visto acima). Abaixo de 10 € o ótimo muda para o vértice $C=(0,50)$; acima de 60 € muda para $A=(50,0)$.')]),
        QR('pl-sensibilidade', 'E se o lucro mudar?', 'Mova os coeficientes da função objetivo e veja quando o ótimo muda de vértice.'),
        Box('resumo', 'Capítulo 3', [Ul([
            'Cada restrição é uma reta e um semiplano; o CSA é a interseção de todos.',
            'As retas de nível são paralelas; deslocam-se no sentido de $(c_1,c_2)$ para aumentar $z$.',
            'Se há ótimo, há um vértice ótimo: basta comparar os vértices.',
            'Saturada: cumpre-se com igualdade. Não saturada: há folga ou excesso.',
            'Casos especiais: ótimos múltiplos, sem solução ótima, impossível.'])]),
        praticar(3),
    ]


def cap4():
    b_alg, _ = algeb(EX1)
    return [
        Chapter('Forma standard e método algébrico',
                'O gráfico só serve para duas variáveis. Para ir mais longe precisamos de uma linguagem algébrica: transformar as desigualdades em igualdades e descrever os vértices como soluções de sistemas de equações.',
                ['Variáveis de folga e de excesso.', 'A forma standard de um problema de PL.', 'Soluções básicas, admissíveis e degeneradas.', 'O método algébrico e a sua ligação aos vértices.']),
        Sec('Folgas e excessos'),
        P('Uma desigualdade transforma-se numa igualdade acrescentando uma variável não negativa que mede "o que falta" ou "o que sobra".'),
        Box('def', 'Variáveis de folga e de excesso', [
            P('Numa restrição $\\leq$, a **variável de folga** $F_i\\geq0$ é a quantidade de recurso que fica por usar: $a_{i1}x_1+\\cdots+a_{in}x_n+F_i=b_i$.'),
            P('Numa restrição $\\geq$, a **variável de excesso** $E_i\\geq0$ é o quanto se ultrapassa a exigência mínima: $a_{i1}x_1+\\cdots+a_{in}x_n-E_i=b_i$.'),
            P('Folgas e excessos entram na função objetivo com coeficiente 0, porque não dão lucro nem custo.')]),
        Margin('notacao', 'Notação', 'Usamos $F_i$ para as folgas, $E_i$ para os excessos e, no capítulo 6, $A_i$ para as variáveis artificiais. O índice é o número da restrição.'),
        Box('def', 'Forma standard', [P('Um problema de PL está na **forma standard** quando todas as restrições técnicas são igualdades com termo independente não negativo e todas as variáveis são não negativas.')]),
        Box('exemplo', 'Forma standard dos produtos A e B', [Eq(std_model(EX1)),
            P('$F_1$ é a matéria-prima que sobra (kg) e $F_2$ as horas que sobram. Na solução ótima $(40,30)$ temos $F_1=150-3\\cdot40-30=0$ e $F_2=100-40-2\\cdot30=0$: as duas restrições estão saturadas, como vimos no capítulo 3.')]),
        Box('atencao', 'Termo independente negativo', [P('Se uma restrição tiver $b_i<0$, multiplique-a primeiro por $-1$, trocando o sentido da desigualdade. Por exemplo, $x_1-2x_2\\geq-4$ passa a $-x_1+2x_2\\leq4$, que leva uma folga.')]),
        Sec('Soluções básicas'),
        P('Na forma standard temos $m$ equações e $n$ variáveis (de decisão, de folga e de excesso), com $n>m$. O sistema é possível e indeterminado. Dando o valor 0 a $n-m$ variáveis, ficam $m$ equações com $m$ incógnitas, que em geral têm uma só solução.'),
        Box('def', 'Solução básica', [
            P('Uma **solução básica** obtém-se anulando $n-m$ variáveis (as **variáveis não básicas**) e resolvendo o sistema nas $m$ restantes (as **variáveis básicas**). É uma **solução básica admissível** se todas as variáveis forem não negativas. É **degenerada** se alguma variável básica for nula.'),
            P('O número máximo de soluções básicas é o número de maneiras de escolher as $m$ variáveis básicas: $C^n_m=\\dfrac{n!}{m!\\,(n-m)!}$.')]),
        Box('teo', 'Vértices e soluções básicas', [P('As soluções básicas admissíveis correspondem aos **vértices** do CSA. As soluções básicas não admissíveis correspondem a interseções de retas fora do CSA.')]),
        Sec('O método algébrico'),
        Box('metodo', 'Método algébrico', [Ul([
            'Escrever o problema na forma standard e contar $n$ e $m$.',
            'Para cada escolha de $n-m$ variáveis nulas, resolver o sistema nas restantes.',
            'Eliminar as soluções com alguma variável negativa (não admissíveis).',
            'Calcular $z$ nas soluções básicas admissíveis e escolher a melhor.'], 'num')]),
        QR('pl-algebrico', 'Método algébrico', 'Veja todas as soluções básicas e o vértice de cada uma no gráfico.'),
        Box('exemplo', 'Produtos A e B, método algébrico', [Eq(std_model(EX1))] + b_alg + [
            P('**Confirmação:** as quatro soluções admissíveis são os vértices O, A, B e C do gráfico do capítulo 3, e a ótima é a mesma, $(40,30)$ com $z^*=1800$. As duas soluções não admissíveis são os pontos $(100,0)$ e $(0,150)$, onde uma reta corta o eixo fora do CSA.')]),
        Box('atencao', 'Porque não chega', [P('O método algébrico calcula todas as soluções básicas, mesmo as que não interessam. Com 10 restrições e 20 variáveis seriam até $C^{20}_{10}=184\\,756$ sistemas. O método do Simplex, a seguir, visita apenas algumas soluções básicas admissíveis, sempre a melhorar.')]),
        Box('resumo', 'Capítulo 4', [Ul([
            'Folga $F_i$ nas restrições $\\leq$ (recurso por usar); excesso $E_i$ nas $\\geq$ (quanto se ultrapassa).',
            'Forma standard: restrições em igualdade, termos independentes e variáveis não negativos.',
            'Solução básica: $n-m$ variáveis nulas; até $C^n_m$ soluções básicas.',
            'Soluções básicas admissíveis são os vértices do CSA.'])]),
        praticar(4),
    ]


def cap5():
    b_ex1, _ = simplex_blocks(EX1)
    b_chv, r_chv = simplex_blocks(CHV)
    b_mul, _ = simplex_blocks(MULT, intro=False)
    b_ili, _ = simplex_blocks(ILIM)
    return [
        Chapter('O método do Simplex',
                'O Simplex percorre os vértices do CSA de forma organizada: parte de um vértice, passa para um vértice vizinho melhor e para quando nenhum vizinho melhora. Tudo isto se faz com operações sobre linhas num quadro, como na condensação do Tema 1.',
                ['A ideia do método.', 'O quadro do Simplex e a linha $c_j-z_j$.', 'Os critérios de entrada, de saída e de paragem.', 'Como ler o quadro ótimo.', 'Ótimos múltiplos, solução ilimitada e degenerescência no quadro.']),
        Sec('A ideia'),
        P('O Simplex começa numa solução básica admissível, em geral a origem (todas as variáveis de decisão nulas e as folgas iguais aos recursos). Em cada iteração escolhe uma variável não básica para **entrar** na base, a que melhora mais $z$ por unidade, e uma variável básica para **sair**, a que primeiro se anula quando a que entra aumenta. Isto corresponde a andar ao longo de uma aresta do CSA até ao vértice seguinte.'),
        Sec('O quadro do Simplex'),
        P('Cada solução básica representa-se num quadro com as colunas seguintes: $X_b$ (variáveis básicas), $c_j^b$ (os seus coeficientes na função objetivo), os coeficientes de todas as variáveis nas restrições, o termo independente (RHS) e a coluna dos rácios $r$. Por cima das colunas das variáveis escreve-se o seu coeficiente $c_j$ na função objetivo. A última linha tem os valores $c_j-z_j$, com'),
        Eq(r'z_j=\sum_i c^b_i\,a_{ij}\qquad\text{e}\qquad z=\sum_i c^b_i\,\text{RHS}_i.'),
        P('O valor $c_j-z_j$ diz quanto varia $z$ por cada unidade de $x_j$ que entra na solução: é o **ganho marginal** da variável $j$. Para as variáveis básicas é sempre 0.'),
        Box('notacao', 'Como escrevemos as operações no quadro', [Ul([
            'O **elemento redutor** (na interseção da coluna que entra com a linha que sai) marca-se com um **círculo vermelho**.',
            'A linha do elemento redutor divide-se por ele: escreve-se $:k$ **à direita** dessa linha.',
            'Para anular os outros elementos da coluna escreve-se, **à esquerda** de cada linha que muda, o **multiplicador**: multiplica-se a nova linha do elemento redutor por esse número e soma-se à linha que muda (operação de Jacobi, como no Tema 1).'])]),
        Sec('Quem entra, quem sai e quando parar'),
        Box('metodo', 'Algoritmo do Simplex', [Ul([
            '**Quadro inicial.** Escrever o problema na forma standard; a base inicial é formada pelas folgas (e, no capítulo 6, pelas artificiais). Calcular a linha $c_j-z_j$.',
            '**Paragem.** Num problema de Max, o quadro é ótimo se todos os $c_j-z_j\\leq0$; num problema de Min, se todos os $c_j-z_j\\geq0$.',
            '**Entrada.** Entra na base a variável com o **maior $c_j-z_j$ positivo** (Max) ou com o **$c_j-z_j$ mais negativo** (Min).',
            '**Saída.** Para cada linha com elemento **positivo** na coluna que entra, calcular o rácio $r=\\text{RHS}/a_{ij}$. Sai a variável básica da linha com o **menor rácio**. A regra de saída é a mesma em Max e em Min.',
            '**Novo quadro.** Dividir a linha do elemento redutor por ele ($:k$) e anular os restantes elementos da coluna com os multiplicadores. Atualizar $X_b$, $c_j^b$ e a linha $c_j-z_j$. Voltar ao passo 2.'], 'num')]),
        Margin('dica', 'Dica de exame', 'Calcule sempre os rácios só com os elementos positivos da coluna. Um zero ou um negativo não limitam o crescimento da variável que entra; escreva um traço.'),
        QR('pl-simplex', 'Simplex passo a passo', 'Resolva qualquer problema com 2 a 4 variáveis e veja cada quadro com a notação das aulas.'),
        Box('exemplo', 'Produtos A e B pelo Simplex', [Eq(model(EX1))] + b_ex1 + [
            P('**Confirmação com o gráfico:** o quadro 1 é o vértice $O=(0,0)$, o quadro 2 é $A=(50,0)$ e o quadro 3 é $B=(40,30)$. O Simplex visitou 3 dos 4 vértices, sempre com $z$ a aumentar: $0$, $1500$, $1800$.')]),
        Sec('Ler o quadro ótimo'),
        P('No quadro ótimo, as variáveis básicas têm o valor da coluna RHS e as não básicas valem 0. O valor de $z$ está no canto inferior. Das folgas e excessos lê-se o estado das restrições: uma folga básica e positiva indica uma restrição não saturada; uma folga não básica (nula) indica uma restrição saturada. Os $c_j-z_j$ das folgas têm também uma leitura económica, que veremos no capítulo 7.'),
        Box('exemplo', 'Um problema com três variáveis', [Eq(model(CHV))] + b_chv + [
            P('**Leitura:** produz-se $x_1=2$ e $x_3=1$, não se produz $x_2$; a segunda restrição tem folga $F_2=1$ e as outras duas estão saturadas. **Confirmação:** $2\\cdot2+0+1=5$, $4\\cdot2+0+2\\cdot1=10\\leq11$, $3\\cdot2+0+2\\cdot1=8$, e $z=5\\cdot2+3\\cdot1=13$.')]),
        Sec('Casos especiais no quadro'),
        Sub('Ótimos múltiplos'),
        P('Se no quadro ótimo uma variável **não básica** tem $c_j-z_j=0$, fazê-la entrar na base não altera $z$: há outra solução ótima. Voltemos ao exemplo com lucro $z=10x_1+20x_2$:')] + b_mul + [
        P('Fazendo entrar $x_1$ (rácios $\\frac{100}{\\frac52}=40$ e $\\frac{50}{\\frac12}=100$, sai $F_1$) obtém-se o vértice $(40,30)$, também com $z=1000$. Todos os pontos do segmento entre $(0,50)$ e $(40,30)$ são ótimos, como no gráfico do capítulo 3.'),
        Sub('Solução ilimitada'),
        P('Se a variável que deve entrar não tem nenhum elemento positivo na sua coluna, não há rácios: pode crescer sem limite e $z$ também. Por exemplo:'),
        Eq(model(ILIM))] + b_ili + [
        Sub('Degenerescência'),
        P('Quando há empate no menor rácio, a variável que fica na base em vez da que sai passa a valer 0: a solução seguinte é **degenerada**. O Simplex continua normalmente (escolhe-se uma das linhas empatadas, por exemplo a de cima). Geometricamente, mais de duas retas passam pelo mesmo vértice. Pode acontecer uma iteração em que $z$ não aumenta, mas nos problemas destas aulas o método termina sempre.'),
        Sub('Empate na entrada'),
        P('Se duas variáveis têm o mesmo $c_j-z_j$ de entrada, pode escolher-se qualquer uma; por convenção escolhemos a mais à esquerda. O ótimo final é o mesmo, embora o caminho possa ter mais ou menos quadros.'),
        Box('resumo', 'Capítulo 5', [Ul([
            'Quadro: $X_b$, $c_j^b$, coeficientes, RHS, rácios; última linha $c_j-z_j$.',
            'Entra: maior $c_j-z_j$ positivo (Max) ou mais negativo (Min). Sai: menor rácio com $a_{ij}>0$.',
            'Elemento redutor circulado, $:k$ à direita, multiplicadores à esquerda.',
            'Ótimo: todos $c_j-z_j\\leq0$ (Max) ou $\\geq0$ (Min).',
            '$c_j-z_j=0$ numa não básica: ótimos múltiplos. Coluna sem positivos: solução ilimitada.'])]),
        praticar(5),
    ]


def cap6():
    b_m1, _ = simplex_blocks(M1)
    b_meq, _ = simplex_blocks(MEQ)
    b_imp, _ = simplex_blocks(IMP)
    return [
        Chapter('Variáveis artificiais: o método do M grande',
                'Quando há restrições do tipo $\\geq$ ou $=$, a origem deixa de ser admissível e não há uma base inicial evidente. O método do M grande cria uma base provisória com variáveis artificiais e penaliza-as na função objetivo até desaparecerem.',
                ['Porque são precisas as variáveis artificiais.', 'A penalização $M$ e a comparação de valores com $M$.', 'O método do M grande em problemas de Min e de Max.', 'Como o Simplex deteta um problema impossível.']),
        Sec('O problema da base inicial'),
        P('Numa restrição $\\leq$, a folga $F_i$ entra na base inicial com valor $b_i$. Numa restrição $\\geq$, o excesso tem coeficiente $-1$: se fosse básico valeria $-b_i<0$, o que não é admissível. Numa igualdade não há folga nem excesso. Em ambos os casos falta uma variável para a base.'),
        Box('def', 'Variável artificial', [P('Uma **variável artificial** $A_i\\geq0$ é uma variável sem significado económico que se soma a uma restrição $\\geq$ ou $=$ só para obter uma base inicial: $a_{i1}x_1+\\cdots-E_i+A_i=b_i$ ou $a_{i1}x_1+\\cdots+A_i=b_i$. Uma solução só é admissível para o problema original se todas as artificiais valerem 0.')]),
        Sec('A penalização M'),
        P('Para que o Simplex "expulse" as variáveis artificiais, damos-lhes um coeficiente muito desfavorável na função objetivo: $-M$ num problema de maximização, $+M$ num problema de minimização, sendo $M$ um número positivo tão grande quanto se queira.'),
        Box('atencao', 'Comparar valores com M', [P('Os valores $c_j-z_j$ passam a ter a forma $aM+b$. Como $M$ é muito grande, compara-se primeiro o coeficiente de $M$ e só em caso de empate a parte constante. Por exemplo, $-3M+2<-2M+10<-2M+12<5$. Num problema de Min entra a variável com o $c_j-z_j$ mais negativo, logo aquela com o coeficiente de $M$ mais negativo.')]),
        Box('metodo', 'Método do M grande', [Ul([
            'Forma standard: folga $F_i$ nas $\\leq$; excesso $E_i$ e artificial $A_i$ nas $\\geq$; artificial $A_i$ nas $=$.',
            'Na função objetivo: $-MA_i$ (Max) ou $+MA_i$ (Min).',
            'Base inicial: folgas e artificiais. Calcular $c_j-z_j$ com $M$.',
            'Aplicar o Simplex. Quando uma artificial sai da base, retira-se a sua coluna dos quadros seguintes.',
            'No fim: se alguma artificial ficar na base com valor positivo, o problema é **impossível**.'], 'num')]),
        Box('exemplo', 'Minimização com restrições $\\geq$', [Eq(model(M1))] + b_m1 + [
            P('**Leitura:** $x_1=2$, $x_2=4$, custo mínimo $z^*=16$. As duas exigências mínimas são cumpridas à justa ($E_1=E_2=0$) e a terceira restrição tem folga $F_3=4$. **Confirmação:** $2\\cdot2+4=8$, $2+2\\cdot4=10$ e $2+4=6\\leq10$.')]),
        Box('exemplo', 'Maximização com uma igualdade', [Eq(model(MEQ))] + b_meq + [
            P('**Confirmação:** $3+1=4$, $3\\leq3$ e $1\\geq1$; $z=3\\cdot3+2\\cdot1=11$.')]),
        Sec('Problema impossível'),
        P('O método do M grande também mostra quando o CSA é vazio. Retomemos o problema impossível do capítulo 3:'),
        Eq(model(IMP))] + b_imp + [
        P('O valor de $A_2$ na base é 2: não há maneira de cumprir $x_1+2x_2\\geq6$ com $x_1+x_2\\leq2$, como o gráfico já mostrava.'),
        Box('resumo', 'Capítulo 6', [Ul([
            'Restrição $\\geq$: $-E_i+A_i$. Restrição $=$: $+A_i$.',
            'Custo da artificial: $-M$ em Max, $+M$ em Min.',
            'Com $M$, compara-se primeiro o coeficiente de $M$.',
            'Artificial que sai da base: retira-se a coluna.',
            'Artificial positiva no quadro ótimo: problema impossível.'])]),
        praticar(6),
    ]


def cap7():
    r = R_EX1
    last = qjson(EX1, r)[-1]
    return [
        Chapter('Interpretação económica e alteração de coeficientes',
                'O quadro ótimo não diz só o que produzir. Diz também quanto vale cada recurso e quanto custa produzir o que não está no plano. São estas respostas que mais interessam a um gestor.',
                ['O valor de cada recurso: preços-sombra.', 'O custo reduzido das variáveis não básicas.', 'O efeito de alterar um recurso $b_i$.', 'O efeito de alterar um coeficiente $c_j$ da função objetivo.']),
        Sec('O quadro ótimo, outra vez'),
        P('Recordemos o quadro ótimo do exemplo dos produtos A e B:'),
        Quadro(last, {'sol': 1}, 'Quadro ótimo dos produtos A e B'),
        P('As folgas $F_1$ e $F_2$ são não básicas, com $c_j-z_j=-8$ e $-6$. Se obrigássemos a sobrar 1 kg de matéria-prima ($F_1=1$), o lucro diminuía 8 €. Lido ao contrário: **mais 1 kg de matéria-prima aumentava o lucro em 8 €**.'),
        Box('def', 'Preço-sombra', [P('O **preço-sombra** (ou valor marginal) de um recurso $i$ é a variação do valor ótimo $z^*$ por cada unidade a mais de $b_i$. Num problema de Max com restrições $\\leq$, é o simétrico do $c_j-z_j$ da folga $F_i$ no quadro ótimo. Num problema de Min com restrições $\\geq$, é o $c_j-z_j$ do excesso $E_i$ (o aumento do custo mínimo por cada unidade a mais exigida).')]),
        Box('exemplo', 'Quanto vale um recurso', [
            P('No exemplo, o preço-sombra da matéria-prima é 8 € por kg e o das horas de trabalho é 6 € por hora. **Confirmação:** resolvendo o problema com 151 kg obtém-se $z^*=1808$, e com 101 horas $z^*=1806$.'),
            P('**Interpretação:** a empresa não deve pagar mais de 8 € por um kg extra de matéria-prima (acima do preço que já paga), nem mais de 6 € por uma hora extra de trabalho. Uma restrição **não saturada** tem preço-sombra 0: aumentar um recurso que já sobra não melhora nada.')]),
        Margin('atencao', 'Validade', 'O preço-sombra só é válido numa certa gama de valores de $b_i$, enquanto a mesma base continuar ótima. O relatório de sensibilidade do Solver (capítulo 9) indica essa gama.'),
        Sec('Custo reduzido'),
        P('Para uma variável de decisão **não básica** no quadro ótimo, $|c_j-z_j|$ é o **custo reduzido**: quanto pioraria $z$ por cada unidade produzida dessa variável. É também quanto o seu coeficiente $c_j$ teria de melhorar para valer a pena produzi-la.'),
        Box('exemplo', 'Um produto que não se faz', [P('No problema com três variáveis do capítulo 5, $x_2$ é não básica no quadro ótimo com $c_j-z_j=-3$. Cada unidade de $x_2$ produzida baixaria $z$ em 3. Só valeria a pena produzi-la se o seu lucro unitário subisse de 4 para mais de $4+3=7$.')]),
        Sec('Alterar um recurso'),
        P('Se $b_i$ mudar $\\Delta$ unidades e a base ótima se mantiver, o novo valor ótimo é $z^*+\\text{(preço-sombra)}\\cdot\\Delta$. Por exemplo, com mais 10 horas de trabalho o lucro passaria a $1800+6\\cdot10=1860$ €, se a base continuar ótima (o que se confirma resolvendo de novo: $x_1=38$, $x_2=36$, $z^*=1860$).'),
        Sec('Alterar um coeficiente da função objetivo'),
        P('Mudar o lucro unitário $c_j$ não altera o CSA, só a inclinação das retas de nível. A solução ótima mantém-se enquanto o vértice ótimo continuar a ser o último tocado, e só o valor de $z^*$ muda. Com duas variáveis, o intervalo calcula-se pelos declives, como no capítulo 3 ($10\\leq c_1\\leq60$ no exemplo). Com mais variáveis, o relatório de sensibilidade do Solver dá esse intervalo diretamente (aumento e diminuição permitidos).'),
        Box('dica', '', [P('Nos testes aparece muitas vezes: "Se o lucro unitário de A passar a 50 €, a solução ótima mantém-se?". Responda com o intervalo de otimalidade, diga se a solução muda e calcule o novo $z^*$.')]),
        Box('resumo', 'Capítulo 7', [Ul([
            'Preço-sombra de um recurso: simétrico do $c_j-z_j$ da folga (Max) ou $c_j-z_j$ do excesso (Min).',
            'Restrição não saturada: preço-sombra nulo.',
            'Custo reduzido: $|c_j-z_j|$ de uma variável de decisão não básica.',
            'Novo recurso: $z^*$ varia preço-sombra vezes $\\Delta$, enquanto a base se mantiver.',
            'Novo $c_j$: a solução mantém-se dentro do intervalo de otimalidade.'])]),
        praticar(7),
    ]


def cap8():
    d, dtex = dual_model(EX1)
    rd = simplex(d)
    assert rd['z'] == 1800 and rd['x'][:2] == [8, 6]
    d2, d2tex = dual_model(DEX)
    rd2 = simplex(d2)
    assert rd2['z'] == 9 and rd2['x'][:2] == [Fr(3, 2), Fr(1, 2)]
    b_dex, r_dex = simplex_blocks(DEX, intro=False, verbose=False)
    return [
        Chapter('Dualidade',
                'Cada problema de programação linear tem um problema "gémeo", o dual, que olha para os mesmos números do lado dos recursos. Resolver um é resolver o outro, e as variáveis do dual são exatamente os preços-sombra.',
                ['O dual do exemplo dos produtos A e B e a sua interpretação.', 'As regras de construção do dual.', 'Os teoremas da dualidade.', 'Como ler a solução do dual no quadro ótimo do primal.']),
        Sec('Um problema visto do outro lado'),
        P('Suponhamos que alguém quer comprar à empresa dos produtos A e B toda a matéria-prima e todas as horas de trabalho. Que preços $y_1$ (por kg) e $y_2$ (por hora) deve oferecer? A empresa só vende se ganhar pelo menos o mesmo que a produzir: os recursos de uma unidade de A ($3$ kg e $1$ h) têm de valer pelo menos 30 €, e os de uma unidade de B ($1$ kg e $2$ h) pelo menos 20 €. O comprador quer pagar o mínimo:'),
        Eq(dtex),
        P('A solução deste problema é $y_1=8$, $y_2=6$, com $w^*=1800$: os preços-sombra do capítulo 7 e o mesmo valor do lucro máximo.'),
        Sec('Construir o dual'),
        Box('def', 'Problema dual (forma canónica)', [
            P('Ao problema **primal** $\\max z=\\sum c_jx_j$ s.a. $\\sum_j a_{ij}x_j\\leq b_i$ ($i=1,\\dots,m$), $x_j\\geq0$, corresponde o **dual**'),
            Eq(r'\begin{array}{ll}\text{Min} & w=b_1y_1+b_2y_2+\cdots+b_my_m\\[3pt]\text{s.a.} & a_{1j}y_1+a_{2j}y_2+\cdots+a_{mj}y_m\geq c_j\quad(j=1,\dots,n)\\ & y_1,\dots,y_m\geq0\end{array}'),
            P('O dual de um problema de Min com restrições $\\geq$ constrói-se da mesma maneira, trocando Min por Max e $\\geq$ por $\\leq$. O dual do dual é o primal.')]),
        Tab(['Primal (Max)', 'Dual (Min)'], [
            ['$n$ variáveis $x_j$', '$n$ restrições'], ['$m$ restrições', '$m$ variáveis $y_i$'],
            ['Coeficientes $c_j$ da função objetivo', 'Termos independentes das restrições'],
            ['Termos independentes $b_i$', 'Coeficientes da função objetivo'],
            ['Matriz $A$ dos coeficientes', 'Matriz transposta $A^{\\mathrm T}$'], ['Restrições $\\leq$', 'Restrições $\\geq$']], align='ll'),
        Margin('dica', 'Dica', 'Escreva a matriz dos coeficientes do primal e leia-a por colunas: cada coluna dá uma restrição do dual.'),
        QR('pl-dual', 'Primal e dual', 'Veja as correspondências entre os dois problemas e os preços-sombra no quadro ótimo.'),
        Sec('Os teoremas da dualidade'),
        Box('teo', 'Teoremas da dualidade', [Ul([
            '**Dualidade fraca.** Para quaisquer soluções admissíveis do primal (Max) e do dual (Min), $z\\leq w$.',
            '**Dualidade forte.** Se um dos problemas tem solução ótima, o outro também tem, e $z^*=w^*$.',
            '**Folgas complementares.** Na solução ótima, se uma restrição do primal tem folga positiva, a variável dual correspondente é nula; se $y_i>0$, a restrição $i$ do primal está saturada.',
            'Se o primal não tem solução ótima (ilimitado), o dual é impossível.'])]),
        Sec('A solução do dual no quadro do primal'),
        P('Não é preciso resolver o dual à parte. No quadro ótimo do primal (Max com $\\leq$), o valor ótimo de $y_i$ é o simétrico do $c_j-z_j$ da folga $F_i$. Num primal de Min com restrições $\\geq$, $y_i$ é o $c_j-z_j$ do excesso $E_i$.'),
        Box('exemplo', 'Dual de uma minimização', [
            P('Consideremos'), Eq(model(DEX)), P('O seu dual é'), Eq(d2tex),
            P('Resolvendo o primal pelo método do M grande, o quadro ótimo é:'), b_dex[-2],
            P('Os $c_j-z_j$ dos excessos $E_1$ e $E_2$ são $\\frac32$ e $\\frac12$: a solução do dual é $y_1=\\frac32$, $y_2=\\frac12$, com $w^*=4\\cdot\\frac32+6\\cdot\\frac12=9=z^*$. **Confirmação:** $\\frac32+\\frac12=2\\leq2$ e $\\frac32+3\\cdot\\frac12=3\\leq3$.')]),
        Box('resumo', 'Capítulo 8', [Ul([
            'Max com $\\leq$ tem dual Min com $\\geq$: transpor $A$, trocar $b$ com $c$.',
            'Uma variável dual por restrição do primal; uma restrição dual por variável do primal.',
            'Dualidade forte: $z^*=w^*$.',
            'Solução do dual: simétrico do $c_j-z_j$ das folgas (Max) ou $c_j-z_j$ dos excessos (Min) no quadro ótimo.',
            'As variáveis duais ótimas são os preços-sombra.'])]),
        praticar(8),
    ]


def cap9():
    code = r'''from scipy.optimize import linprog

c = [-30, -20]            # linprog minimiza: Max 30x1+20x2 = Min -30x1-20x2
A = [[3, 1],              # matéria-prima
     [1, 2]]              # horas de trabalho
b = [150, 100]
res = linprog(c, A_ub=A, b_ub=b, bounds=[(0, None)] * 2, method="highs")

print(res.x)                      # [40. 30.]
print(-res.fun)                   # 1800.0
print(res.ineqlin.residual)       # folgas: [0. 0.]
print(-res.ineqlin.marginals)     # preços-sombra: [8. 6.]'''
    tex_code = r'\begin{tcolorbox}[enhanced,colback=bnota,colframe=bnota,arc=1pt,left=6pt,right=6pt,top=4pt,bottom=4pt,fontupper=\ttfamily\footnotesize]\begin{verbatim}' + '\n' + code + '\n' + r'\end{verbatim}' + '\n' + r'\end{tcolorbox}'
    md_code = '```python\n' + code + '\n```\n'
    return [
        Chapter('Programação linear no computador: Excel e Python',
                'Na prática, os problemas têm dezenas ou milhares de variáveis e resolvem-se no computador. Saber montar o modelo numa folha de cálculo ou num programa é tão importante como saber fazer um quadro à mão, e permite confirmar as resoluções.',
                ['Montar e resolver um problema com o Solver do Excel.', 'Ler o relatório de sensibilidade.', 'Resolver o mesmo problema em Python com a biblioteca SciPy.']),
        Sec('O Solver do Excel'),
        P('O Solver é um suplemento gratuito do Excel. Se não aparecer no separador **Dados**, grupo **Análise**, ative-o em Ficheiro, Opções, Suplementos (Suplementos do Excel, botão Ir, opção Suplemento Solver).'),
        Sub('Montar a folha'),
        P('A folha deve separar os dados das decisões. Para o exemplo dos produtos A e B:'),
        Tab(['', 'A', 'B', 'C', 'D', 'E'], [
            ['1', '', 'Produto A', 'Produto B', 'Usado', 'Disponível'],
            ['2', 'Quantidades', '0', '0', '', ''],
            ['3', 'Lucro unitário', '30', '20', '`=SOMARPRODUTO(B2:C2;B3:C3)`', ''],
            ['4', 'Matéria-prima', '3', '1', '`=SOMARPRODUTO($B$2:$C$2;B4:C4)`', '150'],
            ['5', 'Horas', '1', '2', '`=SOMARPRODUTO($B$2:$C$2;B5:C5)`', '100']], align='llllll', small=True),
        P('As células B2:C2 são as **células de variável** (o Solver vai mudá-las); D3 é a **célula objetivo**; D4:D5 são o lado esquerdo das restrições, a comparar com E4:E5.'),
        Sub('Os parâmetros do Solver'),
        Box('excel', '', [Ul([
            '**Definir Objetivo:** \\$D\\$3; **Para:** Máximo.',
            '**Alterando as Células de Variável:** \\$B\\$2:\\$C\\$2.',
            '**Sujeito às Restrições:** botão Adicionar, \\$D\\$4:\\$D\\$5 <= \\$E\\$4:\\$E\\$5.',
            'Marcar a opção que torna não negativas as variáveis sem restrições (é o $x_j\\geq0$).',
            '**Selecionar um Método de Resolução:** LP Simplex. Clicar em Resolver.'])]),
        P('O Solver devolve $B2=40$, $C2=30$ e $D3=1800$. Na janela de resultados pode pedir o relatório de **Sensibilidade**.'),
        Sub('O relatório de sensibilidade'),
        P('O relatório tem duas tabelas. Na das células de variável aparecem o valor final, o **custo reduzido** (o $c_j-z_j$ do capítulo 7), o coeficiente objetivo e quanto esse coeficiente pode **aumentar** ou **diminuir** sem a solução mudar. Na das restrições aparecem o valor final, o **preço-sombra** e a gama de variação do lado direito em que esse preço é válido. Os nomes exatos das colunas variam um pouco entre versões do Excel.'),
        Tab(['Célula', 'Valor final', 'Custo reduzido', 'Coeficiente', 'Aumento permitido', 'Diminuição permitida'], [
            ['Produto A', '40', '0', '30', '30', '20'], ['Produto B', '30', '0', '20', '40', '10']], align='lccccc', small=True),
        P('O coeficiente de A pode ir de $30-20=10$ a $30+30=60$, e o de B de $20-10=10$ a $20+40=60$, tal como se obtém pelos declives. Os preços-sombra das restrições são 8 e 6.'),
        Margin('atencao', 'Atenção', 'Escolha sempre o método LP Simplex. Com o método não linear (GRG) o Solver não produz o relatório de sensibilidade com preços-sombra.'),
        Sec('Python com SciPy'),
        P('Em Python, a função `linprog` da biblioteca SciPy resolve problemas de PL. Três cuidados: a função **minimiza** (para maximizar, troca-se o sinal dos $c_j$); as restrições escrevem-se na forma $\\leq$ (uma restrição $\\geq$ multiplica-se por $-1$) e as igualdades passam em `A_eq` e `b_eq`; os limites $x_j\\geq0$ indicam-se em `bounds`.'),
        Raw(tex=tex_code, md=md_code),
        P('Os marginais devolvidos pelo SciPy referem-se ao problema minimizado, por isso trocamos o sinal para obter os preços-sombra do problema de Max. A vantagem do Python é poder integrar a resolução noutros programas, por exemplo ler dados de um ficheiro, resolver muitos cenários e desenhar gráficos com os resultados.'),
        Box('atencao', 'Decimais', [P('O computador trabalha com números decimais e pode mostrar valores como $39{,}999999$ ou $-0{,}0$. Arredonde com bom senso e confirme as restrições.')]),
        Box('resumo', 'Capítulo 9', [Ul([
            'Excel: células de variável, célula objetivo com SOMARPRODUTO, restrições, método LP Simplex.',
            'Relatório de sensibilidade: custos reduzidos, intervalos dos coeficientes e preços-sombra.',
            'Python: `linprog` minimiza; restrições $\\leq$ em `A_ub`, igualdades em `A_eq`.',
            'Use o computador para confirmar as resoluções à mão.'])]),
        praticar(9),
    ]


# ---------------------------------------------------------------- capítulo 10: aplicações
CAFE = LP('min', [12, 8], [[90, 70], [1, 1], [1, 0]], ['>=', '=', '>='], [78, 1, Fr(3, 10)], names=['x_1', 'x_2'])
TURNOS = LP('min', [1, 1, 1, 1], [[1, 0, 0, 1], [1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1]], ['>='] * 4, [4, 7, 6, 3], names=['x_1', 'x_2', 'x_3', 'x_4'])
TRANSP = LP('min', [4, 6, 9, 5, 3, 7], [[1, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 1], [1, 0, 0, 1, 0, 0], [0, 1, 0, 0, 1, 0], [0, 0, 1, 0, 0, 1]], ['<=', '<=', '>=', '>=', '>='], [300, 250, 150, 200, 180], names=['x_{11}', 'x_{12}', 'x_{13}', 'x_{21}', 'x_{22}', 'x_{23}'])
INV = LP('max', [Fr(3, 100), Fr(5, 100), Fr(8, 100)], [[1, 1, 1], [0, 0, 1], [1, 0, 0], [-1, -1, 1]], ['=', '<=', '>=', '<='], [100000, 30000, 20000, 0], names=['x_1', 'x_2', 'x_3'])
HOTEL = LP('max', [60, 90, 75], [[1, 1, 1], [0, 1, 0], [1, 0, 0]], ['<=', '<=', '>='], [120, 40, 30], names=['x_1', 'x_2', 'x_3'])


def cap10():
    out = []
    rc = simplex(CAFE); rt = simplex(TURNOS); rtr = simplex(TRANSP); ri = simplex(INV); rh = simplex(HOTEL)
    for p, r in ((CAFE, rc), (TURNOS, rt), (TRANSP, rtr), (INV, ri), (HOTEL, rh)):
        assert r['status'] == 'otimo'
        st, x, z = solve_check(p); assert abs(z - float(r['z'])) < 1e-6, (p.c, z, r['z'])
    out += [
        Chapter('Aplicações à gestão e ao turismo',
                'Este capítulo reúne modelos típicos de gestão. Em todos, o trabalho principal é a formulação; a resolução faz-se pelo Simplex ou no computador, e o mais importante no fim é interpretar a solução.',
                ['Problemas de mistura.', 'Afetação de pessoal por turnos.', 'Problema de transportes.', 'Carteira de investimento.', 'Gestão de quartos de um hotel por canal de venda.']),
        Sec('Problemas de mistura'),
        Box('exemplo', 'Lote de café', [
            P('Uma torrefação faz um lote com café arábica (12 €/kg, qualidade 90 pontos) e robusta (8 €/kg, 70 pontos). O lote deve ter pelo menos 78 pontos de qualidade média e pelo menos 30 % de arábica. Qual a composição mais barata de 1 kg de lote?'),
            P('Com $x_1$ e $x_2$ os kg de arábica e robusta em 1 kg de lote, a qualidade média é $90x_1+70x_2$:'),
            Eq(model(CAFE)),
            P('Solução: %s. O lote mais barato tem 40 %% de arábica e custa 9,60 € por kg. A exigência de qualidade está saturada; a de 30 %% de arábica fica com excesso de 0,1 kg.' % sol_line(CAFE, rc))]),
        Sec('Afetação de pessoal'),
        Box('exemplo', 'Rececionistas por turnos', [
            P('A receção de um hotel funciona 24 horas em quatro períodos de 6 horas, com necessidades mínimas de 4, 7, 6 e 3 rececionistas. Cada rececionista faz 12 horas seguidas, começando no início de um período (o turno que começa no 4.º período continua no 1.º do dia seguinte). Quantos rececionistas devem começar em cada período, para o número total ser mínimo?'),
            P('Com $x_i$ o número de rececionistas que começam no período $i$, o período 1 é coberto por quem começa no 1 ou no 4, o período 2 por quem começa no 1 ou no 2, e assim por diante:'),
            Eq(model(TURNOS)),
            P('Solução: %s. Bastam %s rececionistas. Repare que a solução é inteira; nem sempre é assim, e quando não é o problema passa a ser de programação inteira.' % (sol_line(TURNOS, rt), dn(rt['z'])))]),
        Sec('Problema de transportes'),
        Box('exemplo', 'Abastecer três hotéis', [
            P('Uma lavandaria industrial tem duas unidades, com capacidade de 300 e 250 sacos de roupa por dia, e serve três hotéis que precisam de 150, 200 e 180 sacos. O custo de transporte por saco (€) é:'),
            Tab(['', 'Hotel 1', 'Hotel 2', 'Hotel 3', 'Capacidade'], [['Unidade 1', '4', '6', '9', '300'], ['Unidade 2', '5', '3', '7', '250'], ['Procura', '150', '200', '180', '']]),
            P('Com $x_{ij}$ os sacos enviados da unidade $i$ para o hotel $j$:'),
            Eq(model(TRANSP)),
            P('Solução: %s. A unidade 1 abastece o hotel 1 e parte do 3; a unidade 2, que tem o transporte mais barato para o hotel 2, envia-lhe 200 sacos e os restantes 50 para o hotel 3. O custo mínimo é de %s € por dia.' % (sol_line(TRANSP, rtr), dn(rtr['z'])))]),
        Sec('Carteira de investimento'),
        Box('exemplo', 'Aplicar 100 000 €', [
            P('Um investidor quer aplicar 100 000 € em depósitos (3 % ao ano), obrigações (5 %) e ações (8 %). Por prudência, não quer mais de 30 000 € em ações, quer pelo menos 20 000 € em depósitos e o montante em ações não pode ultrapassar o montante em depósitos e obrigações juntos.'),
            Eq(model(INV)),
            P('Solução: %s €. O rendimento máximo é de %s € por ano. O limite das ações e o mínimo dos depósitos estão saturados; tudo o resto vai para obrigações.' % (sol_line(INV, ri).replace('{,}', ','), dn(ri['z'])))]),
        Sec('Gestão de quartos por canal'),
        Box('exemplo', 'Vender 120 quartos', [
            P('Um hotel tem 120 quartos e vende-os por três canais: operadores turísticos ($x_1$, margem 60 € por noite), venda direta ($x_2$, 90 €) e agências online ($x_3$, 75 €). A procura em venda direta não passa de 40 quartos e o contrato com os operadores obriga a reservar-lhes pelo menos 30 quartos.'),
            Eq(model(HOTEL)),
            P('Solução: %s €. O hotel vende toda a procura direta (40 quartos), cumpre à justa o contrato com os operadores (30) e coloca os restantes 50 nas agências online. **Preços-sombra:** um quarto a mais vale 75 € (iria para as agências); um quarto a mais de procura direta vale $90-75=15$ €; cada quarto a mais exigido pelos operadores custa $75-60=15$ €.' % sol_line(HOTEL, rh))]),
        Box('resumo', 'Capítulo 10', [Ul([
            'Mistura: variáveis em proporção de um total, com $x_1+x_2=1$.',
            'Turnos: cada período é coberto por quem começou antes e ainda está a trabalhar.',
            'Transportes: uma variável por par origem e destino; capacidade $\\leq$, procura $\\geq$.',
            'Investimento e quartos de hotel: o mesmo modelo de afetação de um recurso limitado.',
            'A solução só interessa interpretada na linguagem do problema.'])]),
        praticar(10),
    ]
    assert rh['z'] == 40 * 90 + 30 * 60 + 50 * 75 and [rh['x'][j] for j in range(3)] == [30, 40, 50]
    return out


def teoria():
    out = []
    for f in (cap1, cap2, cap3, cap4, cap5, cap6, cap7, cap8, cap9, cap10):
        out += f()
    return out
