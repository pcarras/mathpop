import json
from plengine import *
def qjson(lp, res):
    out=[]
    for q in res['quadros']:
        out.append({'cols':[c[0] for c in q['cols']],'types':[c[1] for c in q['cols']],
          'cost':[mv_tex(c) for c in q['cost']],
          'rows':[[ftex(x) for x in r] for r in q['rows']],'rhs':[ftex(x) for x in q['rhs']],
          'basis':q['basis'],'cz':[mv_tex(c) for c in q['cz']],'val':mv_tex(q['val']),
          'entra':q['entra'],'sai':q['sai'],'ratios':[ftex(r) if r is not None else None for r in (q['ratios'] or [])],
          'piv':q['piv'],'div':{str(k):ftex(v) for k,v in (q.get('ops') or {}).get('div',{}).items()},
          'mult':{str(k):ftex(v) for k,v in (q.get('ops') or {}).get('mult',{}).items()},'retira':q.get('retira'),
          'x':None})
    return out
ex1=LP('max',[30,20],[[3,1],[1,2]],['<=','<='],[150,100])
f21=LP('min',[3,5],[[1,2],[3,0],[1,5]],['<=','>=','>='],[410,450,500])
cols,al=algebraic(ex1)
D={'QX1':qjson(ex1,simplex(ex1)),'QM':qjson(f21,simplex(f21)),
   'ALG1':{'cols':cols,'rows':[{'vals':[ftex(v) for v in a['vals']] if a['vals'] else None,'adm':a['adm'],'z':ftex(a['z']) if a['z'] is not None else None,'zero':[j for j in range(4) if j not in a['base']]} for a in al]}}
json.dump(D,open('../src/t2_extra.json','w'),ensure_ascii=False)
print(json.dumps(D['QM'][0])[:600])
print([ (r['zero'],r['vals'],r['adm'],r['z']) for r in D['ALG1']['rows']])
