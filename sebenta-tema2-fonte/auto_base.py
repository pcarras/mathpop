import sys; sys.path.insert(0,'/home/claude/t2deck/pl')
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
          'mult':{str(k):ftex(v) for k,v in (q.get('ops') or {}).get('mult',{}).items()},'retira':q.get('retira')})
    return out
