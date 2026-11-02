from auto import *
ex1=LP('max',[30,20],[[3,1],[1,2]],['<=','<='],[150,100])
f21=LP('min',[3,5],[[1,2],[3,0],[1,5]],['<=','>=','>='],[410,450,500])
b1,i1=graf(ex1,'tg1',(110,110),labpos=[(18,96),(80,12)])
b2,_=algeb(ex1); b3,_=simplex_blocks(ex1); b4,_=simplex_blocks(f21)
doc=[Chapter('Teste'),Eq(model(ex1)),Eq(std_model(f21)),Ul(classify(f21))]+b1+b2+b3+b4
print(compile_tex(build_tex(doc,'','tauto')))
