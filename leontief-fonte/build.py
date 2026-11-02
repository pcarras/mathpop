# Junta o motor do Tema 1 (copiado para src/) e os slides do modelo de Leontief num único ficheiro offline.
import json, io, os, subprocess, sys, segno
os.chdir(os.path.dirname(os.path.abspath(__file__)))
S = 'src/'
subprocess.run([sys.executable, 'gen.py'], check=True, stdout=subprocess.DEVNULL)  # gera e verifica os números
URL = 'https://matematica1-carrasco-esght.netlify.app/leontief/'
q = segno.make(URL, error='m')
N = q.symbol_size(border=1)[0]
buf = io.BytesIO()
q.save(buf, kind='svg', xmldecl=False, svgns=True, nl=False, scale=1, border=1, dark='#0A1A2C', light='#FFFFFF')
svg = buf.getvalue().decode().replace('<svg ', '<svg viewBox="0 0 %d %d" style="width:100%%;height:auto;display:block" ' % (N, N), 1)
DECK = {'tema': 'Ficha prática · Modelo de Leontief', 'key': 'm1lt', 'solref': '',
        'blocos': [{'k': 'A', 'nome': 'O modelo'}, {'k': 'B', 'nome': 'Exemplos resolvidos'},
                   {'k': 'C', 'nome': 'Exercícios'}, {'k': 'D', 'nome': 'Síntese'}]}
DATA = {'ex': [], 'tests': []}
rd = lambda f: open(S + f, encoding='utf8').read()
js = ['const DATA=' + json.dumps(DATA) + ';', 'const DECK=' + json.dumps(DECK, ensure_ascii=False) + ';',
      'const QR_SVG=' + json.dumps(svg) + ';', rd('lt_data.js')]
for f in ['lib.js', 'core.js', 'lt_slides.js']:
    js.append(rd(f))
shell = rd('shell.html').replace('Matemática I · Tema 1 · Matrizes e Sistemas de Equações Lineares',
                                 'Matemática I · Ficha prática · O modelo input-output de Leontief')
out = (shell.replace('/*FONTS*/', rd('fonts.css'))
       .replace('/*KATEXCSS*/', rd('katex.css'))
       .replace('/*CSS*/', rd('style.css') + '\n' + rd('lt_style.css'))
       .replace('/*KATEXJS*/', rd('katex.min.js').replace('</script>', '<\\/script>'))
       .replace('/*DATA*/', '/* dados: ver o script seguinte */')
       .replace('/*JS*/', '\n'.join(js).replace('</script>', '<\\/script>')))
os.makedirs('out', exist_ok=True)
open('out/index.html', 'w', encoding='utf8').write(out)
print('out/index.html', len(out) // 1024, 'KB')
