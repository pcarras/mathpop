import numpy as np, sys
sys.path.insert(0,'/home/claude/t2deck/pl')
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection, Line3DCollection
from scipy.spatial import HalfspaceIntersection, ConvexHull
from plengine import LP, simplex
A=np.array([[1,1,1],[2,1,0],[0,1,2],[1,0,3]],float); b=np.array([10,14,12,18],float)
lp=LP('max',[3,2,4],A.tolist(),['<=']*4,b.tolist())
res=simplex(lp)
path=[]
for q in res['quadros']:
    x=[0,0,0]
    for i,bi in enumerate(q['basis']):
        if bi<3: x[bi]=float(q['rhs'][i])
    path.append(x)
H=np.vstack([np.hstack([A,-b[:,None]]),np.hstack([-np.eye(3),np.zeros((3,1))])])
hs=HalfspaceIntersection(H,np.array([1.,1.,1.]))
V=hs.intersections; hull=ConvexHull(V)
# faces: agrupa triângulos coplanares
faces={}
for s,eq in zip(hull.simplices,hull.equations):
    k=tuple(np.round(eq,6)); faces.setdefault(k,set()).update(s)
fig=plt.figure(figsize=(10,6.2),dpi=220); fig.patch.set_facecolor('#0A1626')
ax=fig.add_axes([0,0,1,1],projection='3d'); ax.set_facecolor('#0A1626')
rng=np.random.default_rng(3)
fig.add_artist(matplotlib.collections.PathCollection([],))
# estrelas
sx=rng.random(260); sy=rng.random(260)
fig.figimage(np.zeros((1,1,4)))
ax2=fig.add_axes([0,0,1,1],zorder=-1); ax2.set_facecolor('#0A1626'); ax2.axis('off')
ax2.scatter(sx,sy,s=rng.random(260)*3,c='white',alpha=.5,lw=0); ax2.set_xlim(0,1); ax2.set_ylim(0,1)
ax.set_zorder(1); ax.patch.set_alpha(0)
for k,idx in faces.items():
    P=V[list(idx)]; c=P.mean(0); n=np.array(k[:3])
    u=P[0]-c; u/=np.linalg.norm(u); w=np.cross(n,u)
    ang=np.arctan2((P-c)@w,(P-c)@u); P=P[np.argsort(ang)]
    pc=Poly3DCollection([P],facecolor='#0F7B8A',alpha=.20,edgecolor='#6FE3EE',linewidth=1.8)
    ax.add_collection3d(pc)
# pontos interiores (grelha inteira admissível)
g=[(x,y,z) for x in range(0,11) for y in range(0,11) for z in range(0,10) if np.all(A@np.array([x,y,z])<=b+1e-9)]
g=np.array(g,float)
ax.scatter(g[:,0],g[:,1],g[:,2],s=6,c='#7FE7F0',alpha=.55,depthshade=False,lw=0)
p=np.array(path)
for w,a in [(9,.08),(5,.18),(2.4,1)]:
    ax.plot(p[:,0],p[:,1],p[:,2],color='#FFD166',lw=w,alpha=a,solid_capstyle='round')
ax.scatter(p[:-1,0],p[:-1,1],p[:-1,2],s=40,c='#FFD166',depthshade=False,zorder=10)
for s_,a in [(900,.08),(380,.18),(120,1)]:
    ax.scatter([p[-1,0]],[p[-1,1]],[p[-1,2]],s=s_,c='#F25C54',alpha=a,depthshade=False,lw=0)
# plano da função objetivo pelo ótimo
zs=float(res['z']); xx,yy=np.meshgrid(np.linspace(-1,9,12),np.linspace(-1,11,12)); zz=(zs-3*xx-2*yy)/4
m=(zz>-1)&(zz<9)

ax.view_init(elev=22,azim=38); ax.set_box_aspect((1,1.05,.85))
ax.set_xlim(0.5,8); ax.set_ylim(0.5,9.5); ax.set_zlim(0.3,6.6); ax.axis('off')
fig.savefig('figs/capa.png',facecolor=fig.get_facecolor())
print(path, res['z'])
