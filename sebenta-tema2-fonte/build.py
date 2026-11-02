import sys, os
from ch_teoria import *
import ch_teoria
COVER = r"""\begin{titlepage}\thispagestyle{empty}
\begin{tikzpicture}[remember picture,overlay]
\node[anchor=north,inner sep=0] (img) at ([yshift=-1.6cm]current page.north) {\tikz\node[inner sep=0,rounded corners=10pt,path picture={\node at (path picture bounding box.center){\includegraphics[width=17.4cm]{FIG/capa.png}};}] {\phantom{\rule{17.4cm}{10.8cm}}};};
\node[anchor=north west,text width=15cm,inner sep=0] at ([xshift=2.4cm,yshift=-13.4cm]current page.north west) {%
{\sffamily\scriptsize\bfseries\color{teal}UNIVERSIDADE DO ALGARVE\enspace$\cdot$\enspace ESCOLA SUPERIOR DE GESTÃO, HOTELARIA E TURISMO}\par\vspace{0.8cm}
{\sffamily\fontsize{46}{50}\selectfont\color{navy}Matemática I}\par\vspace{0.3cm}
{\color{teal}\rule{2cm}{2pt}}\par\vspace{0.4cm}
{\sffamily\LARGE\color{teal}Tema 2: Programação Linear}\par\vspace{0.8cm}
{\sffamily\small\color{cinza}Sebenta de teoria, exercícios resolvidos, exercícios propostos e testes de exemplo}};
\node[anchor=south west,text width=12cm,inner sep=0] at ([xshift=2.4cm,yshift=2.6cm]current page.south west) {%
{\sffamily\small\bfseries\color{navy}Licenciatura em Gestão\enspace$\cdot$\enspace Portimão}\par\smallskip
{\small\color{cinza}Paulo Carrasco\enspace$\cdot$\enspace Núcleo de Métodos Quantitativos}\par
{\footnotesize\color{cinza}Ano letivo 2026/27}};
\draw[navy,line width=1pt] ([xshift=-2.4cm,yshift=2.4cm]current page.south east) -- ++(0,4.2cm);
\end{tikzpicture}
\end{titlepage}
\setcounter{page}{2}
{\sffamily\color{navy}\tableofcontents}
"""
COVER = COVER.replace('FIG', FIG)

from ch_testes import *
import ch_teoria

GROUPS = [('Formulação', 'A'), ('Resolução gráfica', 'B'), ('Forma standard e método algébrico', 'C'), ('Método do Simplex e M grande', 'D'),
          ('Dualidade e interpretação económica', 'E'), ('Programação linear no computador', 'F')]
NEWKEYS = [e['key'] for e in NEW]
NUM = {k: 30 + i for i, k in enumerate(NEWKEYS)}
PRAT = {
    1: 'exercícios propostos 1 a 6.',
    2: 'exercício resolvido 1; exercícios propostos 1 a 6.',
    3: 'exercícios resolvidos 2 a 4; exercícios propostos 7 a 12 e 30 a 33.',
    4: 'exercício resolvido 5; exercícios propostos 13 a 16, 32 (alínea b) e 34.',
    5: 'exercícios resolvidos 6, 7 e 10 (alínea a); exercícios propostos 17 a 19, 22, 23 e 35 a 39.',
    6: 'exercícios resolvidos 8 a 10; exercícios propostos 20, 21 e 40 a 42.',
    7: 'exercício resolvido 7; exercícios propostos 26, 27 e 39.',
    8: 'exercício resolvido 11; exercícios propostos 24, 25, 43 e 44.',
    9: 'exercício resolvido 12; exercícios propostos 28 e 29.',
    10: 'exercícios propostos 30, 31, 33, 38, 39, 44 e 45.'}
ch_teoria.PRAT.update(PRAT)

INTRO = [P('Esta sebenta acompanha o Tema 2 de Matemática I. A **Parte I** expõe a teoria, com exemplos resolvidos em cada capítulo e notas na margem. A **Parte II** tem doze exercícios resolvidos, um por cada tipo de problema. A **Parte III** reúne 45 exercícios propostos, com grau de dificuldade (de uma a três estrelas) e soluções no fim. A **Parte IV** tem quatro testes de exemplo e a **Parte V** as resoluções detalhadas de todos os exercícios propostos e testes. A **Parte VI** indica os applets de apoio, com código QR.'),
         P('Nos quadros do Simplex usamos sempre a mesma notação: o elemento redutor é marcado com um círculo vermelho, a divisão da sua linha escreve-se $:k$ à direita e os multiplicadores das operações de Jacobi escrevem-se à esquerda das linhas que mudam. Todos os números foram calculados com frações exatas e confirmados por computador.')]


def part2():
    out = [Part('Exercícios resolvidos', 'Problemas tipo resolvidos passo a passo, no estilo das aulas.', wide=True, roman='II')]
    for i, e in enumerate(RESOLVED):
        out.append(Exercise(str(i + 1), e['title'], e['lv'], e['stmt'], e['res'](), kind='res'))
    return out


def stmt_of(n):
    if n <= 29:
        e = EXD[n]; return e['lab'], e['lv'], conv(e['st'], LPS.get(n) if any(b['t'] == 'eq' for b in e['st']) else None)
    e = NEW[n - 30]; return e['title'], e['lv'], e['stmt']


def sol_of(n):
    return EXD[n]['an'] if n <= 29 else NEW[n - 30]['sol']


def part3():
    out = [Part('Exercícios propostos', 'Exercícios por assunto e problemas de revisão, com soluções no fim.', wide=True, roman='III')]
    for gname, bl in GROUPS:
        out.append(SecU(gname))
        for n in [e['n'] for e in C.EX if e['bloco'] == bl]:
            t, lv, st = stmt_of(n); out.append(Exercise(str(n), t, lv, st))
    out.append(SecU('Problemas de revisão e aplicação'))
    for n in range(30, 30 + len(NEW)):
        t, lv, st = stmt_of(n); out.append(Exercise(str(n), t, lv, st))
    out.append(SecU('Soluções', newpage=True))
    out.append(P('Soluções finais. As resoluções completas estão na Parte V.', 'small'))
    out.append(AnswerList([(str(n), sol_of(n)) for n in range(1, 30 + len(NEW))]))
    return out


def part4():
    out = [Part('Testes de exemplo', 'Quatro testes com cinco questões, para treinar nas condições reais.', wide=True, roman='IV')]
    for k, t in enumerate(['T1', 'T2', 'T3', 'T4']):
        if k: out.append(PageBreak())
        out.append(TestHeader(k + 1))
        for q in range(1, 6):
            st, pts = stmt(t, q); out.append(Question(q, pts, st))
    return out


def part5():
    out = [Part('Resoluções detalhadas', 'Resolução passo a passo dos exercícios propostos e dos testes de exemplo.', wide=True, roman='V')]
    out.append(SecU('Exercícios propostos'))
    for n in range(1, 30 + len(NEW)):
        t, lv, st = stmt_of(n)
        res = RESOL[n]() if n <= 29 else NEW[n - 30]['res']()
        out.append(Exercise(str(n), 'Exercício %d  %s' % (n, t), lv, st, res, kind='sol'))
    for k, t in enumerate(['T1', 'T2', 'T3', 'T4']):
        out.append(SecU('Teste de exemplo %d' % (k + 1), newpage=True))
        rs = RES_T[t]()
        for q in range(1, 6):
            st, pts = stmt(t, q)
            out.append(Exercise('', 'Questão %d (%s val.)' % (q, str(pts).replace('.', ',')), 0, st, rs[q], kind='sol'))
    return out


def part6():
    items = [('apresentacao-tema2', 'Apresentação do Tema 2', 'Os 44 diapositivos das aulas, com exercícios recomendados por bloco.', '1 a 10'),
             ('pl-grafico', 'Resolução gráfica', 'Desenhe o CSA, arraste a reta da função objetivo e veja os casos especiais.', '3'),
             ('pl-algebrico', 'Método algébrico', 'Todas as soluções básicas, com o ponto de cada uma no gráfico.', '4'),
             ('pl-simplex', 'Simplex passo a passo', 'Quadros com elemento redutor, multiplicadores e M grande.', '5 e 6'),
             ('pl-sensibilidade', 'Coeficientes da função objetivo', 'Intervalos de otimalidade e perguntas típicas de teste.', '3 e 7'),
             ('pl-dual', 'Primal e dual', 'Correspondências entre os dois problemas e preços-sombra.', '8')]
    return [Part('Applets de apoio', 'Ferramentas interativas para explorar cada capítulo.', wide=True, roman='VI'),
            P('Aponte a câmara do telemóvel ao código ou escreva o endereço no navegador. Todos os applets usam a notação desta sebenta.'),
            Applets(items)]


def main(word=True):
    doc = [Raw(tex=r'\section*{Como está organizada esta sebenta}', md='## Como está organizada esta sebenta {.unnumbered}\n')] + INTRO
    doc += [Part('Teoria', 'Os conceitos e os métodos, com exemplos resolvidos.', roman='I')] + teoria()
    doc += part2() + part3() + part4() + part5() + part6()
    p = build_tex(doc, COVER, 'sebenta_t2')
    print('pdf', compile_tex(p))
    if word:
        md = build_md(doc, 'sebenta_t2')
        print('md', md)
    return doc


if __name__ == '__main__':
    main('--noword' not in sys.argv)
