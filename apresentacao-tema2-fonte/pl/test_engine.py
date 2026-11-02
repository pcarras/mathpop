from plengine import *
def show(res):
    for k,q in enumerate(res['quadros']):
        print('Q%d base'%(k+1),[q['cols'][b][0] for b in q['basis']],'rhs',[fstr(x) for x in q['rhs']],'cz',[mv_tex(x) for x in q['cz']],'z',mv_tex(q['val']),
              'entra',q['cols'][q['entra']][0] if q['entra'] is not None else None,'sai',q['sai'],'ratios',[fstr(r) if r is not None else '-' for r in (q['ratios'] or [])], 'ops',{k2:{i:fstr(v) for i,v in d.items()} for k2,d in (q.get('ops') or {}).items()})
    print(res['status'],[fstr(x) for x in res.get('x',[])],res.get('z'))
ex1=LP('max',[30,20],[[3,1],[1,2]],['<=','<='],[150,100])
r=simplex(ex1);show(r);print(solve_check(ex1));print('sombra',[fstr(x) for x in precos_sombra(ex1,r)])
print(vertices(ex1));print(estado(ex1,r['x'][:2]))
cols,al=algebraic(ex1);print(cols);[print([fstr(v) for v in a['vals']] if a['vals'] else None,a['adm'],a['z']) for a in al]
f21=LP('min',[3,5],[[1,2],[3,0],[1,5]],['<=','>=','>='],[410,450,500]);r=simplex(f21);show(r);print(solve_check(f21))
print('sombra',[fstr(x) if x is not None else None for x in precos_sombra(f21,r)])
# perturbacao
for i in range(3):
    b=f21.b[:];b[i]+=1;print(i,solve_check(LP('min',[3,5],[[1,2],[3,0],[1,5]],['<=','>=','>='],b))[2]-800)
fr=LP('min',[1,2,3],[[1,-1,2],[1,1,-1]],['>=','>='],[2,1]);r=simplex(fr);show(r);print(solve_check(fr))
d=dual(ex1);print(d.tex());rd=simplex(d);print(rd['status'],rd['z'],[fstr(x) for x in rd['x'][:2]])
