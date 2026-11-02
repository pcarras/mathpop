"""Gerador da sebenta do Tema 2: uma fonte (DSL em Python), dois resultados (XeLaTeX para o PDF, pandoc para o Word).
Regras de estilo: ESTILO-SEBENTA-MATEMATICA-I.md (projeto)."""
import re, os, subprocess, json, shutil
from fractions import Fraction

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
FIG = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'figs')
os.makedirs(OUT, exist_ok=True); os.makedirs(FIG, exist_ok=True)


# ============================================================ nós
class Node:
    pass


class Part(Node):
    def __init__(self, title, intro='', wide=False, roman=''): self.title, self.intro, self.wide, self.roman = title, intro, wide, roman


class Chapter(Node):
    def __init__(self, title, lead='', neste=None, label=None, wide=False):
        self.title, self.lead, self.neste, self.label, self.wide = title, lead, neste or [], label, wide


class Sec(Node):
    def __init__(self, title, label=None): self.title, self.label = title, label


class SecU(Node):
    def __init__(self, title, newpage=False): self.title, self.newpage = title, newpage


class Sub(Node):
    def __init__(self, title): self.title = title


class P(Node):
    def __init__(self, text, cls=None): self.text, self.cls = text, cls


class Eq(Node):
    def __init__(self, *lines, tag=None): self.lines, self.tag = lines, tag


class Ul(Node):
    def __init__(self, items, kind='bullet'): self.items, self.kind = items, kind


class Box(Node):
    def __init__(self, kind, title='', blocks=None, label=None):
        self.kind, self.title, self.blocks, self.label = kind, title, blocks or [], label


class Margin(Node):
    def __init__(self, kind, title, text): self.kind, self.title, self.text = kind, title, text


class QR(Node):
    def __init__(self, slug, title, text): self.slug, self.title, self.text = slug, title, text


class Tab(Node):
    def __init__(self, header, rows, align=None, best=None, small=False):
        self.header, self.rows, self.align, self.best, self.small = header, rows, align, best, small


class Fig(Node):
    def __init__(self, name, caption, width=0.72): self.name, self.caption, self.width = name, caption, width


class Quadro(Node):
    """q: dicionário de quadro (do motor), o: opções {entra, ratios, piv, ops, sol}"""
    def __init__(self, q, o=None, caption=None): self.q, self.o, self.caption = q, o or {}, caption


class Exercise(Node):
    """kind: 'res' (resolvido, enunciado + resolução), 'prop' (só enunciado), 'sol' (enunciado repetido + resolução)"""
    def __init__(self, n, title, lv, stmt, res=None, kind='prop', pts=None):
        self.n, self.title, self.lv, self.stmt, self.res, self.kind, self.pts = n, title, lv, stmt, res or [], kind, pts


class TestHeader(Node):
    def __init__(self, n): self.n = n


class Question(Node):
    def __init__(self, n, pts, blocks): self.n, self.pts, self.blocks = n, pts, blocks


class AnswerList(Node):
    def __init__(self, items): self.items = items  # (n, texto)


class Raw(Node):
    def __init__(self, tex='', md=''): self.tex, self.md = tex, md


class PageBreak(Node):
    pass


class Applets(Node):
    def __init__(self, items): self.items = items  # (slug, título, texto, capítulo)


BOXLAB = {'def': 'Definição', 'prop': 'Propriedades', 'teo': 'Teorema', 'metodo': 'Método', 'exemplo': 'Exemplo',
          'nota': 'Nota', 'atencao': 'Atenção', 'dica': 'Dica de exame', 'notacao': 'Notação', 'excel': 'No Excel',
          'python': 'Em Python', 'resumo': 'Em resumo'}
NUMBERED = {'def', 'prop', 'teo', 'metodo', 'exemplo'}


# ============================================================ texto inline
def split_math(s):
    """divide em pedaços (é_math, texto)"""
    out = []
    i = 0
    for m in re.finditer(r'\$([^$]+)\$', s):
        if m.start() > i:
            out.append((False, s[i:m.start()]))
        out.append((True, m.group(1)))
        i = m.end()
    if i < len(s):
        out.append((False, s[i:]))
    return out


def tex_text(t):
    t = t.replace('\\', r'\textbackslash{}') if False else t
    t = t.replace('&', r'\&').replace('%', r'\%').replace('#', r'\#')
    t = re.sub(r'\*\*(.+?)\*\*', r'\\textbf{\1}', t)
    t = re.sub(r'(?<![\w*])\*([^*\s][^*]*?)\*(?![\w*])', r'\\emph{\1}', t)
    t = t.replace('_', r'\_')
    t = re.sub(r'`([^`]+)`', lambda m: r'\texttt{' + m.group(1) + '}', t)
    return t


def inl(s):
    codes = []
    def keep(m):
        codes.append(m.group(1)); return '\x00%d\x00' % (len(codes) - 1)
    s = re.sub(r'`([^`]+)`', keep, s)
    s = s.replace('\\$', '\x01')
    out = ''.join(('$' + x + '$') if m else tex_text(x) for m, x in split_math(s))
    out = out.replace('\x01', '\\$')
    def put(m):
        c = codes[int(m.group(1))]
        c = c.replace('\\', '\\textbackslash{}').replace('$', '\\$').replace('_', '\\_').replace('&', '\\&').replace('%', '\\%').replace('#', '\\#').replace('{', '\\{').replace('}', '\\}').replace('\\textbackslash\\{\\}', '\\textbackslash{}')
        return '\\texttt{\\small ' + c + '}'
    return re.sub('\x00(\\d+)\x00', put, out)


def md_text(s):
    return s


# ============================================================ figuras de PL
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager
for f in os.listdir(os.path.expanduser('~/.fonts')):
    if f.endswith(('.ttf', '.otf')):
        try:
            font_manager.fontManager.addfont(os.path.join(os.path.expanduser('~/.fonts'), f))
        except Exception:
            pass
plt.rcParams.update({'font.family': 'Lato', 'mathtext.fontset': 'stix', 'font.size': 10, 'axes.spines.top': False, 'axes.spines.right': False})
NAVY, TEAL, AMBER, GREEN, RED, VIOLET, GRAY = '#1F3A5F', '#0F7B8A', '#B7791F', '#2E7D5B', '#C62828', '#5B4B9A', '#5F6B7A'
PAL = [TEAL, AMBER, VIOLET, GREEN, '#3B6EA8', '#A0522D']


def _clip(poly, a, b, le):
    out = []
    f = lambda p: a[0] * p[0] + a[1] * p[1] - b
    ins = (lambda p: f(p) <= 1e-9) if le else (lambda p: f(p) >= -1e-9)
    for i in range(len(poly)):
        P, Q = poly[i], poly[(i + 1) % len(poly)]
        pi, qi = ins(P), ins(Q)
        if pi: out.append(P)
        if pi != qi:
            fp, fq = f(P), f(Q); t = fp / (fp - fq)
            out.append((P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])))
    return out


def lp_figure(name, lp, box, pts=(), iso=None, labels=None, csa=True, arrow=True, size=(5.2, 4.3), labpos=None, segment=None, ticks=None, names=('x_1', 'x_2')):
    """desenha o CSA de um problema com 2 variáveis. pts: [(x,y,rotulo,cor)], iso: valor de z para a reta da FO"""
    X, Y = box
    fig, ax = plt.subplots(figsize=size)
    poly = [(0, 0), (X, 0), (X, Y), (0, Y)]
    for r, rl, bb in zip(lp.A, lp.rel, lp.b):
        a = (float(r[0]), float(r[1])); b = float(bb)
        if rl != '>=': poly = _clip(poly, a, b, True)
        if rl != '<=' and poly: poly = _clip(poly, a, b, False)
    if csa and len(poly) >= 2 and '=' in lp.rel:
        P_ = sorted(poly)
        ax.plot([P_[0][0], P_[-1][0]], [P_[0][1], P_[-1][1]], color=TEAL, lw=6, alpha=.45, solid_capstyle='round', zorder=4)
    elif csa and len(poly) >= 2:
        xs, ys = zip(*poly)
        ax.fill(xs, ys, color=TEAL, alpha=0.18, lw=0)
        ax.plot(list(xs) + [xs[0]], list(ys) + [ys[0]], color=TEAL, lw=1.6 if len(poly) > 2 else 4)
    for i, (r, rl, bb) in enumerate(zip(lp.A, lp.rel, lp.b)):
        a0, a1, b = float(r[0]), float(r[1]), float(bb)
        col = PAL[i % len(PAL)]
        if a1 != 0:
            xs = [0, X]; ys = [(b - a0 * x) / a1 for x in xs]
        else:
            xs = [b / a0, b / a0]; ys = [0, Y]
        ax.plot(xs, ys, color=col, lw=1.6)
        lab = (labels[i] if labels else None)
        if lab:
            if labpos and labpos[i]:
                lx, ly = labpos[i]
            else:
                # ponto da reta dentro da caixa, perto do topo ou da direita
                cand = []
                for t in [0.15, 0.3, 0.5, 0.7, 0.85]:
                    x = xs[0] + t * (xs[1] - xs[0]); y = ys[0] + t * (ys[1] - ys[0])
                    if 0 <= x <= X and 0 <= y <= Y: cand.append((x, y))
                lx, ly = cand[0] if cand else (X * .6, Y * .6)
            ax.annotate(lab, (lx, ly), color=col, fontsize=8.5, xytext=(4, 4), textcoords='offset points')
    if iso is not None and lp.c:
        c0, c1 = float(lp.c[0]), float(lp.c[1])
        if c1 != 0:
            xs = [0, X]; ys = [(iso - c0 * x) / c1 for x in xs]
        else:
            xs = [iso / c0] * 2; ys = [0, Y]
        ax.plot(xs, ys, color=RED, lw=1.5, ls=(0, (5, 3)))
        if arrow:
            n = (c0 ** 2 / X ** 2 + c1 ** 2 / Y ** 2) ** .5
            sg = 1 if lp.sense == 'max' else -1
            mx = X * .12; my = (iso - c0 * mx) / c1 if c1 else Y / 2
            if not (0 <= my <= Y):
                my = Y * .12; mx = (iso - c1 * my) / c0 if c0 else X / 2
            ax.annotate('', xy=(mx + sg * c0 / X / n * .08 * X, my + sg * c1 / Y / n * .08 * Y), xytext=(mx, my), arrowprops=dict(arrowstyle='->', color=RED, lw=1.5))
    if segment:
        (x0, y0), (x1, y1) = segment
        ax.plot([x0, x1], [y0, y1], color=RED, lw=3.5, solid_capstyle='round')
    for p in pts:
        x, y, lab, col = (list(p) + [None, NAVY])[:4]
        ax.plot([x], [y], 'o', color=col or NAVY, ms=5.5, zorder=5, mec='white', mew=1)
        if lab:
            ax.annotate(lab, (x, y), xytext=(5, 5), textcoords='offset points', fontsize=8.5, color=col or NAVY, weight='bold')
    ax.set_xlim(0, X); ax.set_ylim(0, Y)
    if ticks:
        ax.set_xticks(ticks[0]); ax.set_yticks(ticks[1])
    ax.set_xlabel('$%s$' % names[0], loc='right'); ax.set_ylabel('$%s$' % names[1], loc='top', rotation=0)
    ax.grid(alpha=.25, lw=.5)
    ax.tick_params(labelsize=8.5, colors=GRAY)
    fig.tight_layout()
    fig.savefig(os.path.join(FIG, name + '.pdf')); fig.savefig(os.path.join(FIG, name + '.png'), dpi=200)
    plt.close(fig)
    return name


# ============================================================ backend LaTeX
PREAMBLE = r"""\documentclass[11pt,a4paper,twoside,openany]{book}
\usepackage[a4paper,top=2.4cm,bottom=2.6cm,inner=2.4cm,outer=6.0cm,footskip=1.1cm,marginparsep=0.6cm,marginparwidth=4.0cm,asymmetric]{geometry}
\usepackage{fontspec}
\usepackage{unicode-math}
\setmainfont{Libertinus Serif}
\setsansfont{Lato}[BoldFont=Lato-Bold.ttf,ItalicFont=Lato-Italic.ttf,UprightFont=Lato-Regular.ttf,BoldItalicFont=Lato-BoldItalic.ttf,Path=FONTPATH/]
\setmonofont{DejaVu Sans Mono}[Scale=0.85]
\setmathfont{Libertinus Math}
\usepackage{polyglossia}\setmainlanguage{portuguese}
\usepackage{amsmath}
\usepackage{xcolor}
\definecolor{navy}{HTML}{1F3A5F}\definecolor{teal}{HTML}{0F7B8A}\definecolor{amber}{HTML}{B7791F}\definecolor{verde}{HTML}{2E7D5B}
\definecolor{vermelho}{HTML}{C62828}\definecolor{violeta}{HTML}{5B4B9A}\definecolor{cinza}{HTML}{5F6B7A}\definecolor{cinzaazul}{HTML}{7A8CA3}
\definecolor{bdef}{HTML}{EAF1F8}\definecolor{bprop}{HTML}{E6F4F1}\definecolor{bmet}{HTML}{E8F5EE}\definecolor{bnota}{HTML}{F1F3F5}
\definecolor{baten}{HTML}{FFF4E0}\definecolor{bdica}{HTML}{EEEAF7}\definecolor{bexcel}{HTML}{EAF6EE}
\usepackage[most]{tcolorbox}
\usepackage{tikz}
\usepackage{graphicx}
\usepackage{array,colortbl,booktabs,tabularx}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{fancyhdr}
\usepackage{needspace}
\usepackage{marginnote}
\usepackage{qrcode}
\usepackage[hidelinks,pdftitle={Matemática I: Tema 2, Programação Linear},pdfauthor={Paulo Carrasco}]{hyperref}
\raggedbottom\setlength{\parindent}{0pt}\setlength{\parskip}{5pt plus 1pt}
\linespread{1.06}
\newcommand{\R}{\mathbb{R}}
% ---------- títulos
\titleformat{\chapter}[display]{\sffamily}{}{0pt}{\chapterhead}
\titlespacing*{\chapter}{0pt}{-10pt}{18pt}
\titleformat{name=\chapter,numberless}[display]{\sffamily}{}{0pt}{\chapterheadstar}
\titlespacing*{name=\chapter,numberless}{0pt}{-10pt}{18pt}
\newcommand{\chapterheadstar}[1]{{\color{navy}\fontsize{25}{30}\selectfont\bfseries #1}\\[-4pt]{\color{teal}\rule{\textwidth}{1.4pt}}}
\newcommand{\mtx}{\dimexpr1in+\hoffset+\oddsidemargin+\textwidth+\marginparsep\relax}
\newcommand{\mnoteput}[1]{\par\begingroup\dimen0=\prevdepth\nointerlineskip\vbox to0pt{\noindent\begin{tikzpicture}[remember picture,overlay]\node[anchor=north west,inner sep=0pt,text width=\marginparwidth] at ([xshift=\mtx,yshift=0.75em]current page.west |- 0,0) {#1};\end{tikzpicture}\vss}\prevdepth=\dimen0\endgroup}
\newcommand{\chapterhead}[1]{%
 \begin{tikzpicture}[remember picture,overlay]
 \def\chx{\dimexpr1in+\hoffset+\oddsidemargin+\textwidth\relax}\node[anchor=north east,inner sep=0,text=teal!14] at ([xshift=\chx,yshift=-1.5cm]current page.north west){\fontsize{110}{110}\selectfont\bfseries\thechapter};
 \end{tikzpicture}%
 {\color{teal}\small\bfseries CAPÍTULO \thechapter}\\[8pt]{\color{navy}\fontsize{25}{30}\selectfont\bfseries #1}\\[-4pt]{\color{teal}\rule{\textwidth}{1.4pt}}}
\titleformat{\section}{\sffamily\Large\color{navy}}{\color{teal}\thesection}{0.7em}{}
\titleformat{\subsection}{\sffamily\large\color{teal}}{\thesubsection}{0.7em}{}
\titlespacing*{\section}{0pt}{16pt}{6pt}\titlespacing*{\subsection}{0pt}{10pt}{4pt}
% ---------- cabeçalho e rodapé
\pagestyle{fancy}\fancyhf{}\renewcommand{\headrulewidth}{0pt}
\fancyfoot[LE,LO]{\sffamily\footnotesize\color{cinza}Núcleo de Métodos Quantitativos $\cdot$ ESGHT $\cdot$ Universidade do Algarve}
\fancyfoot[RE,RO]{\tikz\node[circle,fill=navy,text=white,inner sep=1.6pt,minimum size=17pt,font=\sffamily\footnotesize\bfseries]{\thepage};}
\fancypagestyle{plain}{\fancyhf{}\fancyfoot[LE,LO]{\sffamily\footnotesize\color{cinza}Núcleo de Métodos Quantitativos $\cdot$ ESGHT $\cdot$ Universidade do Algarve}\fancyfoot[RE,RO]{\tikz\node[circle,fill=navy,text=white,inner sep=1.6pt,minimum size=17pt,font=\sffamily\footnotesize\bfseries]{\thepage};}}
% ---------- caixas
\newcounter{bx}[chapter]\renewcommand{\thebx}{\thechapter.\arabic{bx}}
\tcbset{bxs/.style={enhanced,colframe=#1,boxrule=0pt,leftrule=3pt,arc=1pt,outer arc=1pt,left=8pt,right=8pt,top=5pt,bottom=5pt,before skip=8pt,after skip=8pt,fonttitle=\sffamily\bfseries\small,coltitle=#1,attach title to upper,title after break={}}}
\newtcolorbox{bdef}[1]{bxs=navy,colback=bdef,title={\textcolor{navy}{DEFINIÇÃO #1}\par\smallskip}}
\newtcolorbox{bprop}[1]{bxs=teal,colback=bprop,title={\textcolor{teal}{#1}\par\smallskip}}
\newtcolorbox{bmet}[1]{bxs=verde,colback=bmet,title={\textcolor{verde}{MÉTODO #1}\par\smallskip}}
\newtcolorbox{bnota}[1]{bxs=cinza,colback=bnota,title={\textcolor{cinza}{#1}\par\smallskip}}
\newtcolorbox{baten}[1]{bxs=amber,colback=baten,title={\textcolor{amber}{#1}\par\smallskip}}
\newtcolorbox{bdica}[1]{bxs=violeta,colback=bdica,title={\textcolor{violeta}{#1}\par\smallskip}}
\newtcolorbox{bexcel}[1]{bxs=verde,colback=bexcel,title={\textcolor{verde}{#1}\par\smallskip}}
\newtcolorbox{bresumo}[1]{bxs=navy,colback=bdef,title={\textcolor{navy}{EM RESUMO\quad #1}\par\smallskip}}
\newtcolorbox{bex}[1]{enhanced,breakable,colback=white,colframe=cinzaazul,boxrule=0.5pt,leftrule=3pt,arc=1pt,left=8pt,right=8pt,top=5pt,bottom=5pt,before skip=8pt,after skip=8pt,
  title={\sffamily\bfseries\small\colorbox{navy}{\textcolor{white}{EXEMPLO \thebx}}\quad\textcolor{navy}{#1}},attach title to upper,after title={\par\smallskip},title after break={}}
% exercícios
\newcommand{\stars}[1]{\ifcase#1\or\textcolor{amber}{★}\textcolor{gray!40}{★★}\or\textcolor{amber}{★★}\textcolor{gray!40}{★}\or\textcolor{amber}{★★★}\fi}
\newtcolorbox{exprop}[2]{enhanced,breakable,colback=white,colframe=navy!35,boxrule=0.5pt,arc=2pt,left=9pt,right=9pt,top=6pt,bottom=6pt,before skip=7pt,after skip=3pt,
  colbacktitle=navy,coltitle=white,fonttitle=\sffamily\bfseries\small,toptitle=2pt,bottomtitle=2pt,title={#1\hfill #2}}
\newtcolorbox{enunc}{enhanced,breakable,colback=bnota,colframe=bnota,boxrule=0pt,arc=1pt,left=8pt,right=8pt,top=5pt,bottom=5pt,before skip=4pt,after skip=4pt,
  title={\sffamily\bfseries\scriptsize\textcolor{cinza}{ENUNCIADO}},attach title to upper,after title={\par}}
\newtcolorbox{resol}{enhanced,breakable,colback=white,colframe=verde,boxrule=0pt,leftrule=2.5pt,arc=0pt,left=9pt,right=4pt,top=5pt,bottom=5pt,before skip=4pt,after skip=10pt,
  title={\sffamily\bfseries\scriptsize\textcolor{verde}{RESOLUÇÃO}},attach title to upper,after title={\par}}
\newtcolorbox{testhead}[1]{enhanced,colback=navy,colframe=navy,arc=4pt,left=12pt,right=12pt,top=9pt,bottom=9pt,boxrule=0pt,fontupper=\color{white}}
% notas na margem
\newcommand{\mnote}[3]{\marginnote{\setlength{\fboxsep}{0pt}\begin{tcolorbox}[enhanced,colback=#1,colframe=#1,boxrule=0pt,arc=1pt,left=4pt,right=4pt,top=3pt,bottom=3pt,fontupper=\sffamily\scriptsize]{\bfseries\color{#2}#3}\par\vspace{1pt}}
\newcommand{\mnoteend}{\end{tcolorbox}}}
% elemento redutor
\newcommand{\red}[1]{\tikz[baseline=(c.base)]\node[draw=vermelho,circle,line width=0.9pt,inner sep=0.6pt,minimum size=1.15em](c){$#1$};}
\newcommand{\mult}[1]{\textcolor{teal}{$#1$}}
\setlist{itemsep=1pt,topsep=3pt}
\setlist[itemize]{label={\color{teal}\textbullet}}
\newcommand{\enunciadoteste}{}
\begin{document}
"""


class TexBackend:
    def __init__(self):
        self.o = []
        self.in_wide = False

    def emit(self, s):
        self.o.append(s)

    def blocks(self, bl):
        for b in bl:
            getattr(self, 'r_' + type(b).__name__)(b)

    def r_Part(self, p):
        if p.wide and not self.in_wide:
            self.emit(r'\clearpage\newgeometry{top=2.4cm,bottom=2.6cm,inner=2.4cm,outer=2.4cm,footskip=1.1cm}')
        self.in_wide = p.wide
        self.emit(r'\cleardoublepage\thispagestyle{empty}\vspace*{6cm}{\sffamily\color{teal}\Large\bfseries PARTE %s}\par{\sffamily\color{navy}\fontsize{34}{40}\selectfont\bfseries %s}\par\medskip{\color{teal}\rule{0.6\textwidth}{1.5pt}}\par\bigskip{\large\itshape\color{cinza} %s}\par\addcontentsline{toc}{part}{Parte %s: %s}\clearpage' % (p.roman, inl(p.title), inl(p.intro), p.roman, inl(p.title)))

    def r_Chapter(self, c):
        self.emit(r'\chapter{%s}' % inl(c.title))
        if c.lead:
            self.emit(r'{\large\itshape\color{cinza} %s}\par\medskip' % inl(c.lead))
        if c.neste:
            self.emit(r'\begin{bnota}{NESTE CAPÍTULO}\begin{itemize}' + ''.join(r'\item ' + inl(x) for x in c.neste) + r'\end{itemize}\end{bnota}')

    def r_Sec(self, s):
        self.emit(r'\Needspace{6\baselineskip}\section{%s}' % inl(s.title))

    def r_Sub(self, s):
        self.emit(r'\Needspace{5\baselineskip}\subsection{%s}' % inl(s.title))

    def r_SecU(self, s):
        self.emit((r'\clearpage' if s.newpage else r'\Needspace{8\baselineskip}') + r'\section*{%s}\addcontentsline{toc}{section}{%s}' % (inl(s.title), inl(s.title)))

    def r_P(self, p):
        if p.cls == 'lead':
            self.emit(r'{\itshape\color{cinza} %s}\par' % inl(p.text))
        elif p.cls == 'small':
            self.emit(r'{\small %s}\par' % inl(p.text))
        else:
            self.emit(inl(p.text) + r'\par')

    def r_Eq(self, e):
        if len(e.lines) == 1:
            self.emit(r'\[%s\]' % e.lines[0])
        else:
            self.emit(r'\begin{gather*}' + r'\\'.join(e.lines) + r'\end{gather*}')

    def r_Ul(self, u):
        env = {'bullet': 'itemize', 'num': 'enumerate', 'alpha': 'enumerate'}[u.kind]
        opt = r'[label=\textbf{\sffamily\alph*)},leftmargin=2em]' if u.kind == 'alpha' else (r'[label=\textbf{\sffamily\arabic*.}]' if u.kind == 'num' else '')
        self.emit(r'\begin{%s}%s' % (env, opt))
        for it in u.items:
            if isinstance(it, list):
                self.emit(r'\item ')
                self.blocks(it)
            else:
                self.emit(r'\item ' + inl(it))
        self.emit(r'\end{%s}' % env)

    def r_Box(self, b):
        k = b.kind
        sub = TexBackend(); sub.blocks(b.blocks); body = '\n'.join(sub.o)
        if k in NUMBERED:
            self.emit(r'\refstepcounter{bx}')
        num = r'\thebx'
        t = inl(b.title)
        if k == 'def':
            self.emit(r'\begin{bdef}{%s\quad\textmd{%s}}%s\end{bdef}' % (num, t, body))
        elif k in ('prop', 'teo'):
            self.emit(r'\begin{bprop}{%s %s\quad\textmd{%s}}%s\end{bprop}' % (BOXLAB[k].upper(), num, t, body))
        elif k == 'metodo':
            self.emit(r'\begin{bmet}{%s\quad\textmd{%s}}%s\end{bmet}' % (num, t, body))
        elif k == 'exemplo':
            self.emit(r'\begin{bex}{%s}%s\end{bex}' % (t, body))
        elif k == 'nota':
            self.emit(r'\begin{bnota}{NOTA%s}%s\end{bnota}' % (r'\quad\textmd{' + t + '}' if t else '', body))
        elif k == 'atencao':
            self.emit(r'\begin{baten}{ATENÇÃO%s}%s\end{baten}' % (r'\quad\textmd{' + t + '}' if t else '', body))
        elif k in ('dica', 'notacao'):
            self.emit(r'\begin{bdica}{%s%s}%s\end{bdica}' % (BOXLAB[k].upper(), r'\quad\textmd{' + t + '}' if t else '', body))
        elif k in ('excel', 'python'):
            self.emit(r'\begin{bexcel}{%s%s}%s\end{bexcel}' % (BOXLAB[k].upper(), r'\quad\textmd{' + t + '}' if t else '', body))
        elif k == 'resumo':
            self.emit(r'\begin{bresumo}{%s}%s\end{bresumo}' % (t, body))

    def r_Margin(self, m):
        col = {'nota': ('bnota', 'cinza'), 'atencao': ('baten', 'amber'), 'dica': ('bdica', 'violeta'), 'notacao': ('bdica', 'violeta'), 'def': ('bdef', 'navy')}[m.kind]
        if self.in_wide:
            self.r_Box(Box(m.kind if m.kind != 'def' else 'nota', m.title, [P(m.text)]))
            return
        self.emit(r'\mnoteput{\begin{tcolorbox}[enhanced,colback=%s,colframe=%s,boxrule=0pt,arc=1pt,left=4pt,right=4pt,top=3pt,bottom=3pt,fontupper=\sffamily\scriptsize\raggedright]{\bfseries\color{%s}%s}\par %s\end{tcolorbox}}' % (col[0], col[0], col[1], inl(m.title).upper(), inl(m.text)))

    def r_QR(self, q):
        url = 'https://matematica1-carrasco-esght.netlify.app/' + q.slug + '/'
        if self.in_wide:
            return
        self.emit(r'\mnoteput{\begin{tcolorbox}[enhanced,colback=white,colframe=teal,boxrule=0.4pt,arc=1pt,left=4pt,right=4pt,top=3pt,bottom=3pt,fontupper=\sffamily\scriptsize]{\bfseries\color{teal}EXPLORAR ONLINE}\par\smallskip\centering\textcolor{black}{\qrcode[height=2cm]{%s}}\par\smallskip\raggedright{\bfseries %s}\par %s\end{tcolorbox}}' % (url, inl(q.title), inl(q.text)))

    def r_Tab(self, t):
        n = len(t.header)
        al = t.align or ('l' + 'c' * (n - 1))
        plain = lambda c: len(re.sub(r'\\[a-zA-Z]+|[{}$^_]', '', c)) + (len(c) // 2 if '`' in c else 0)
        widths = [max(plain(r[j]) for r in [t.header] + t.rows) for j in range(n)]
        wide = sum(widths) > (70 if not t.small else 85)
        if wide:
            al2 = ''.join(r'>{\raggedright\arraybackslash}X' if (a == 'l' and widths[j] > 12) else a for j, a in enumerate(al))
            if 'X' not in al2:
                j = max(range(n), key=lambda k: widths[k]); al2 = ''.join(r'>{\raggedright\arraybackslash}X' if k == j else a for k, a in enumerate(al))
            self.emit(r'\par\smallskip{\centering%s\begin{tabularx}{\linewidth}{%s}\rowcolor{navy}' % (r'\small' if t.small else '', al2))
        else:
            self.emit(r'\par\smallskip{\centering%s\begin{tabular}{%s}\rowcolor{navy}' % (r'\small' if t.small else '', al))
        self.emit(' & '.join(r'\textcolor{white}{\sffamily\bfseries\footnotesize %s}' % inl(h) for h in t.header) + r'\\')
        for i, r in enumerate(t.rows):
            pre = r'\rowcolor{verde!14}' if t.best is not None and i == t.best else (r'\rowcolor{bdef!60}' if i % 2 else '')
            self.emit(pre + ' & '.join(r'\textcolor{black}{%s}' % inl(c) for c in r) + r'\\')
        self.emit((r'\end{tabularx}' if wide else r'\end{tabular}') + r'\par}\smallskip')

    def r_Fig(self, f):
        self.emit(r'\begin{center}\includegraphics[width=%.2f\linewidth]{%s/%s.pdf}\par{\sffamily\footnotesize\color{cinza} %s}\end{center}' % (f.width, FIG, f.name, inl(f.caption)))

    def r_Quadro(self, Q):
        self.emit(quadro_tex(Q.q, Q.o, Q.caption))

    def r_Exercise(self, e):
        sub = TexBackend(); sub.in_wide = True; sub.blocks(e.stmt); st = '\n'.join(sub.o)
        if e.kind == 'prop':
            right = r'\stars{%d}' % e.lv if e.lv else ''
            if e.pts:
                right = r'\textmd{(%s val.)}' % e.pts
            self.emit(r'\begin{exprop}{Exercício %s%s}{%s}%s\end{exprop}' % (e.n, (r'\quad\textmd{' + inl(e.title) + '}') if e.title else '', right, st))
        else:
            sub2 = TexBackend(); sub2.in_wide = True; sub2.blocks(e.res); rs = '\n'.join(sub2.o)
            if e.kind == 'res':
                self.emit(r'\begin{exprop}{Exercício resolvido %s%s}{\stars{%d}}%s\end{exprop}\begin{resol}%s\end{resol}' % (e.n, (r'\quad\textmd{' + inl(e.title) + '}') if e.title else '', e.lv, st, rs))
            else:
                self.emit(r'\Needspace{8\baselineskip}{\sffamily\bfseries\color{teal} %s}\par\begin{enunc}%s\end{enunc}\begin{resol}%s\end{resol}' % (inl(e.title), st, rs))

    def r_TestHeader(self, h):
        self.emit(r'\Needspace{10\baselineskip}\begin{testhead}{\sffamily\bfseries\Large Teste de exemplo %d}\par\smallskip{\sffamily\small Duração: 120 minutos $\cdot$ Cotação total: 20 valores $\cdot$ Sem consulta}\par\smallskip{\sffamily\footnotesize\textcolor{white!80!navy}{Justifique todas as respostas e apresente os cálculos. Nos quadros do Simplex, assinale o elemento redutor com um círculo e escreva o multiplicador à esquerda da linha que muda.}}\end{testhead}' % h.n)

    def r_Question(self, q):
        sub = TexBackend(); sub.in_wide = True; sub.blocks(q.blocks)
        self.emit(r'\begin{exprop}{Questão %d}{\textmd{(%s val.)}}%s\end{exprop}' % (q.n, str(q.pts).replace('.', ','), '\n'.join(sub.o)))

    def r_AnswerList(self, a):
        self.emit(r'\begin{small}\setlength{\columnsep}{18pt}')
        for n, t in a.items:
            self.emit(r'\noindent\textcolor{navy}{\sffamily\bfseries %s.}\ \textcolor{black}{%s}\par\smallskip' % (n, inl(t)))
        self.emit(r'\end{small}')

    def r_Raw(self, r):
        if r.tex: self.emit(r.tex)

    def r_PageBreak(self, p):
        self.emit(r'\clearpage')

    def r_Applets(self, a):
        self.emit(r'\begin{center}')
        for i, (slug, t, d, cap) in enumerate(a.items):
            url = 'https://matematica1-carrasco-esght.netlify.app/' + slug + '/'
            self.emit(r'\begin{minipage}[t]{0.31\textwidth}\centering\textcolor{black}{\qrcode[height=2.3cm]{%s}}\par\smallskip{\sffamily\bfseries\small\textcolor{navy}{%s}}\par\textcolor{black}{\footnotesize %s}\par\textcolor{gray}{\scriptsize\texttt{%s}}\end{minipage}%s' % (url, inl(t), inl(d), 'matematica1-carrasco-esght.netlify.app/' + slug, r'\hfill' if i % 3 != 2 else r'\par\bigskip'))
        self.emit(r'\end{center}')


def qcell(x):
    return '$' + x + '$'


def quadro_tex(q, o, caption=None):
    nv = len(q['cols'])
    ent = q['entra'] if o.get('entra') else None
    sai = q['sai'] if o.get('piv') else None
    showR = bool(o.get('ratios') and q.get('ratios'))
    ncore = 2 + nv + 1 + (1 if showR else 0)
    cols = 'r|c|c|' + 'c' * nv + '|c|' + ('c|' if showR else '') + 'l'
    L = [r'\par\smallskip\begin{center}{\renewcommand{\arraystretch}{1.28}\setlength{\tabcolsep}{4.4pt}\begin{tabular}{%s}' % cols]
    L.append(r'\cline{2-%d}' % (ncore + 1))
    hc = lambda j: r'\cellcolor{teal!22}' if j == ent else r'\cellcolor{bdef}'
    L.append(' & ' + r'\multicolumn{2}{|r|}{\cellcolor{bdef}\footnotesize $c_j$}' + ' & ' + ' & '.join(hc(j) + qcell(c) for j, c in enumerate(q['cost'])) + r' & \cellcolor{bdef}' + (r' & \cellcolor{bdef}' if showR else '') + r' & \\')
    L.append(' & ' + r'\cellcolor{bdef}$X_b$ & \cellcolor{bdef}$c_j^b$ & ' + ' & '.join(hc(j) + r'$\mathbf{%s}$' % c for j, c in enumerate(q['cols'])) + r' & \cellcolor{bdef}{\sffamily\footnotesize RHS}' + (r' & \cellcolor{bdef}$r$' if showR else '') + r' & \\\cline{2-%d}' % (ncore + 1))
    for i, r in enumerate(q['rows']):
        left = (r'\mult{%s}' % q['mult'][str(i)]) if o.get('ops') and str(i) in q['mult'] else ''
        dv = q['div'].get(str(i)) if o.get('ops') else None
        right = ''
        if dv and dv != '1':
            right = r'\mult{:%s}' % (dv if not (dv.startswith('-') or dv.startswith('\\frac')) else r'\left(' + dv + r'\right)')
        pre_r = r'\cellcolor{amber!12}' if i == sai else ''
        cells = []
        for j, x in enumerate(r):
            c = qcell(x)
            if o.get('piv') and q.get('piv') and q['piv'][0] == i and q['piv'][1] == j:
                c = r'\red{%s}' % x
            pre = r'\cellcolor{amber!28}' if (i == sai and j == ent) else (r'\cellcolor{teal!10}' if j == ent else pre_r)
            cells.append(pre + c)
        rat = []
        if showR:
            rv = q['ratios'][i]
            rat = [pre_r + ('$-$' if rv is None else qcell(rv)) + (r'\,{\tiny\sffamily\color{amber}mín.}' if i == sai else '')]
        L.append(' & '.join([left, pre_r + r'$%s$' % q['cols'][q['basis'][i]], pre_r + qcell(q['cost'][q['basis'][i]])] + cells + [pre_r + qcell(q['rhs'][i])] + rat + [right]) + r'\\')
    L.append(r'\cline{2-%d}' % (ncore + 1))
    czc = [(r'\cellcolor{teal!30}' if j == ent else r'\cellcolor{bnota}') + qcell(c) for j, c in enumerate(q['cz'])]
    L.append(' & ' + r'\multicolumn{2}{|c|}{\cellcolor{bnota}$c_j-z_j$} & ' + ' & '.join(czc) + r' & \cellcolor{bnota}\textcolor{vermelho}{$' + ('z^*=' if o.get('sol') else 'z=') + q['val'] + r'$}' + (r' & \cellcolor{bnota}' if showR else '') + r' & \\\cline{2-%d}' % (ncore + 1))
    L.append(r'\end{tabular}}\par')
    if caption:
        L.append(r'{\sffamily\footnotesize\color{cinza} %s}\par' % inl(caption))
    L.append(r'\end{center}')
    return '\n'.join(L)


# ============================================================ backend Markdown (pandoc → Word)
class MdBackend:
    def __init__(self):
        self.o = []
        self.chap = 0
        self.bx = 0

    def emit(self, s):
        self.o.append(s)

    def blocks(self, bl):
        for b in bl:
            getattr(self, 'r_' + type(b).__name__)(b)

    def r_Part(self, p):
        self.emit('\n```{=openxml}\n<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n```\n')
        self.emit('# Parte: %s {.unnumbered}\n\n*%s*\n' % (p.title, p.intro))

    def r_Chapter(self, c):
        self.chap += 1; self.bx = 0
        self.emit('\n```{=openxml}\n<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n```\n')
        self.emit('# %d. %s {.unnumbered}\n' % (self.chap, c.title))
        if c.lead:
            self.emit('*%s*\n' % c.lead)
        if c.neste:
            self.emit('::: {custom-style="Caixa Nota"}\n**NESTE CAPÍTULO**\n\n' + '\n'.join('- ' + x for x in c.neste) + '\n:::\n')

    def r_Sec(self, s):
        self.emit('## %s {.unnumbered}\n' % s.title)

    def r_Sub(self, s):
        self.emit('### %s {.unnumbered}\n' % s.title)

    def r_SecU(self, s):
        if s.newpage:
            self.r_PageBreak(None)
        self.emit('## %s {.unnumbered}\n' % s.title)

    def r_P(self, p):
        self.emit(('*%s*' % p.text if p.cls == 'lead' else p.text) + '\n')

    def r_Eq(self, e):
        for l in e.lines:
            self.emit('$$%s$$\n' % l)

    def r_Ul(self, u):
        for k, it in enumerate(u.items):
            mark = '- ' if u.kind == 'bullet' else ('%d. ' % (k + 1) if u.kind == 'num' else '%s) ' % 'abcdefghij'[k])
            if isinstance(it, list):
                sub = MdBackend(); sub.chap = self.chap; sub.blocks(it)
                txt = '\n'.join(sub.o).strip()
                self.emit(mark + txt.replace('\n', '\n   ') + '\n')
            else:
                self.emit(mark + it + '\n')
        self.emit('')

    def r_Box(self, b):
        style = {'def': 'Caixa Definicao', 'prop': 'Caixa Propriedade', 'teo': 'Caixa Propriedade', 'metodo': 'Caixa Metodo',
                 'exemplo': 'Caixa Exemplo', 'nota': 'Caixa Nota', 'atencao': 'Caixa Atencao', 'dica': 'Caixa Dica', 'notacao': 'Caixa Dica',
                 'excel': 'Caixa Metodo', 'python': 'Caixa Metodo', 'resumo': 'Caixa Definicao'}[b.kind]
        lab = BOXLAB[b.kind].upper()
        if b.kind in NUMBERED:
            self.bx += 1; lab += ' %d.%d' % (self.chap, self.bx)
        sub = MdBackend(); sub.chap = self.chap; sub.blocks(b.blocks)
        self.emit('::: {custom-style="%s"}\n**%s**%s\n\n%s\n:::\n' % (style, lab, ('  ' + b.title) if b.title else '', '\n'.join(sub.o)))

    def r_Margin(self, m):
        self.r_Box(Box(m.kind if m.kind != 'def' else 'nota', m.title, [P(m.text)]))

    def r_QR(self, q):
        self.emit('::: {custom-style="Caixa Nota"}\n**EXPLORAR ONLINE**  %s: %s <https://matematica1-carrasco-esght.netlify.app/%s/>\n:::\n' % (q.title, q.text, q.slug))

    def r_Tab(self, t):
        self.emit('| ' + ' | '.join(t.header) + ' |')
        self.emit('|' + '|'.join([':--'] + [':-:'] * (len(t.header) - 1)) + '|')
        for i, r in enumerate(t.rows):
            cells = [('**%s**' % c if (t.best is not None and i == t.best and c.strip() and '$' not in c) else c) for c in r]
            self.emit('| ' + ' | '.join(c.replace('|', '\\|') for c in cells) + ' |')
        self.emit('')

    def r_Fig(self, f):
        self.emit('![%s](%s/%s.png){width=%d%%}\n' % (f.caption, FIG, f.name, int(f.width * 100)))

    def r_Quadro(self, Q):
        self.emit(quadro_md(Q.q, Q.o, Q.caption))

    def r_Exercise(self, e):
        sub = MdBackend(); sub.chap = self.chap; sub.blocks(e.stmt)
        head = ('Exercício resolvido %s' if e.kind == 'res' else 'Exercício %s') % e.n
        if e.kind == 'sol':
            head = e.title
        else:
            head += ('  ' + e.title if e.title else '') + ('  ' + '★' * e.lv + '☆' * (3 - e.lv) if e.lv and not e.pts else '') + ('  (%s val.)' % e.pts if e.pts else '')
        self.emit('::: {custom-style="Caixa Enunciado"}\n**%s**\n\n%s\n:::\n' % (head, '\n'.join(sub.o)))
        if e.res:
            sub2 = MdBackend(); sub2.chap = self.chap; sub2.blocks(e.res)
            self.emit('::: {custom-style="Caixa Resolucao"}\n**RESOLUÇÃO**\n\n%s\n:::\n' % '\n'.join(sub2.o))

    def r_TestHeader(self, h):
        self.emit('\n```{=openxml}\n<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n```\n')
        self.emit('::: {custom-style="Caixa Teste"}\n**Teste de exemplo %d**\n\nDuração: 120 minutos · Cotação total: 20 valores · Sem consulta\n\nJustifique todas as respostas e apresente os cálculos. Nos quadros do Simplex, assinale o elemento redutor com um círculo e escreva o multiplicador à esquerda da linha que muda.\n:::\n' % h.n)

    def r_Question(self, q):
        sub = MdBackend(); sub.chap = self.chap; sub.blocks(q.blocks)
        self.emit('::: {custom-style="Caixa Enunciado"}\n**Questão %d** (%s val.)\n\n%s\n:::\n' % (q.n, str(q.pts).replace('.', ','), '\n'.join(sub.o)))

    def r_AnswerList(self, a):
        for n, t in a.items:
            self.emit('**%s.** %s\n' % (n, t))

    def r_Raw(self, r):
        if r.md: self.emit(r.md)

    def r_PageBreak(self, p):
        self.emit('\n```{=openxml}\n<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n```\n')

    def r_Applets(self, a):
        for slug, t, d, cap in a.items:
            self.emit('- **%s** (capítulo %s): %s <https://matematica1-carrasco-esght.netlify.app/%s/>\n' % (t, cap, d, slug))


def quadro_md(q, o, caption=None):
    nv = len(q['cols'])
    ent = q['entra'] if o.get('entra') else None
    sai = q['sai'] if o.get('piv') else None
    showR = o.get('ratios') and q.get('ratios')
    m = lambda x: '$' + x + '$'
    h = ['', '$X_b$', '$c_j^b$'] + [m(c) for c in q['cols']] + ['RHS'] + (['$r$'] if showR else []) + ['']
    rows = [h, ['', '', ''] + [m(c) for c in q['cost']] + [''] + ([''] if showR else []) + ['']]
    for i, r in enumerate(q['rows']):
        left = '[%s]{custom-style="Multiplicador"}' % q['mult'][str(i)].replace('\\frac', 'frac') if o.get('ops') and str(i) in q['mult'] else ''
        if left:
            left = m(q['mult'][str(i)])
        dv = q['div'].get(str(i)) if o.get('ops') else None
        right = m(':' + dv) if dv and dv != '1' else ''
        cells = []
        for j, x in enumerate(r):
            if o.get('piv') and q.get('piv') and q['piv'][0] == i and q['piv'][1] == j:
                cells.append('[%s]{custom-style="Redutor"}' % re.sub(r'\\frac\{(\d+)\}\{(\d+)\}', r'\1/\2', x).replace('-', '−'))
            else:
                cells.append(m(x))
        rat = ''
        if showR:
            rv = q['ratios'][i]
            rat = '–' if rv is None else m(rv) + (' mín.' if i == sai else '')
        rows.append([left, '**' + m(q['cols'][q['basis'][i]]) + '**', m(q['cost'][q['basis'][i]])] + cells + [m(q['rhs'][i])] + ([rat] if showR else []) + [right])
    rows.append(['', '$c_j-z_j$', ''] + [m(c) for c in q['cz']] + [m(('z^*=' if o.get('sol') else 'z=') + q['val'])] + ([''] if showR else []) + [''])
    out = ['| ' + ' | '.join(rows[0]) + ' |', '|' + '|'.join([':-:'] * len(rows[0])) + '|']
    out += ['| ' + ' | '.join(r) + ' |' for r in rows[1:]]
    s = '\n'.join(out) + '\n'
    if caption:
        s += '\n*%s*\n' % caption
    return s + '\n'


# ============================================================ construção
def build_tex(doc, cover_tex, name='sebenta'):
    tb = TexBackend()
    tb.emit(PREAMBLE.replace('FONTPATH', os.path.expanduser('~/.fonts')))
    tb.emit(cover_tex)
    tb.blocks(doc)
    tb.emit(r'\end{document}')
    p = os.path.join(OUT, name + '.tex')
    open(p, 'w', encoding='utf8').write('\n'.join(tb.o))
    return p


def compile_tex(p):
    d = os.path.dirname(p)
    for k in range(2):
        r = subprocess.run(['xelatex', '-interaction=nonstopmode', '-halt-on-error', os.path.basename(p)], cwd=d, capture_output=True, text=True)
    ok = r.returncode == 0
    if not ok:
        print(r.stdout[-3000:])
    return ok


def build_md(doc, name='sebenta'):
    mb = MdBackend()
    mb.emit('---\ntitle: "Matemática I: Tema 2, Programação Linear"\nsubtitle: "Sebenta de teoria, exercícios resolvidos, exercícios propostos e testes de exemplo"\nauthor: "Paulo Carrasco · Núcleo de Métodos Quantitativos · ESGHT · Universidade do Algarve"\nlang: pt-PT\n---\n')
    mb.emit('```{=openxml}\n<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n```\n')
    mb.blocks(doc)
    p = os.path.join(OUT, name + '.md')
    open(p, 'w', encoding='utf8').write('\n'.join(mb.o))
    return p


def compile_docx(md, ref):
    out = md[:-3] + '.docx'
    r = subprocess.run(['pandoc', md, '-f', 'markdown+tex_math_dollars+pipe_tables+fenced_divs+bracketed_spans+raw_attribute', '-o', out, '--reference-doc', ref, '--resource-path', FIG], capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-2000:])
    return out
