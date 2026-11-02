import sys; sys.path.insert(0,'/home/claude/t2deck/pl')
from sebgen import *
from plengine import *
from auto_base import qjson
ex1=LP('max',[30,20],[[3,1],[1,2]],['<=','<='],[150,100])
Q=qjson(ex1,simplex(ex1))
lp_figure('t_ex1',ex1,(110,110),pts=[(0,0,'O'),(50,0,'A'),(40,30,'B',RED),(0,50,'C')],iso=1800,labels=['$3x_1+x_2=150$','$x_1+2x_2=100$'])
doc=[Chapter('Introdução à programação linear','Lead text aqui.',['a','b $x_1$']),Sec('Primeira secção'),
 P('Texto com $x_1+x_2\\leq 4$ e **negrito** e *itálico*.'),Margin('dica','Dica','Uma nota na margem com $z$.'),
 Box('def','Programa linear',[P('Um problema é...'),Eq(ex1.tex())]),Box('exemplo','Fábrica',[P('ola')]),
 Fig('t_ex1','Figura 1.1 CSA'),Quadro(Q[0],{'entra':1,'ratios':1,'piv':1,'ops':1}),Quadro(Q[1],{'entra':1,'ratios':1,'piv':1,'ops':1}),Quadro(Q[2],{'sol':1}),
 Exercise('1','Formular',2,[P('Enunciado'),Ul(['a','b'],'alpha')],[P('Resolução')],kind='res'),Exercise('2','',1,[P('Proposto')]),
 TestHeader(1),Question(1,3.5,[P('q')]),QR('pl-simplex','Simplex passo a passo','Experimente.'),Tab(['a','b'],[['1','2'],['3','4']],best=1)]
p=build_tex(doc,'','smoke'); print(compile_tex(p))
