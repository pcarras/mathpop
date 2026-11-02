import json, io, segno, sys
S = 'src/'
URL = 'https://matematica1-carrasco-esght.netlify.app/apresentacao-tema2/'
q = segno.make(URL, error='m')
N = q.symbol_size(border=1)[0]
buf = io.BytesIO(); q.save(buf, kind='svg', xmldecl=False, svgns=True, nl=False, scale=1, border=1, dark='#0A1A2C', light='#FFFFFF')
svg = buf.getvalue().decode().replace('<svg ', '<svg viewBox="0 0 %d %d" style="width:100%%;height:auto;display:block" ' % (N, N), 1)
data = json.load(open(S + 't2_data.json', encoding='utf8'))
data.update(json.load(open(S + 't2_extra.json', encoding='utf8')))
DECK = {'tema': 'Tema 2', 'key': 'm1t2', 'solref': 'Resolução detalhada na sebenta do Tema 2.',
        'blocos': [{'k': 'A', 'nome': 'Introdução e formulação'}, {'k': 'B', 'nome': 'Resolução gráfica'},
                   {'k': 'C', 'nome': 'Forma standard e método algébrico'}, {'k': 'D', 'nome': 'Método do Simplex'},
                   {'k': 'E', 'nome': 'Dualidade'}, {'k': 'F', 'nome': 'Software e fecho'}]}
js = ['const DATA=' + json.dumps(data, ensure_ascii=False) + ';', 'const DECK=' + json.dumps(DECK, ensure_ascii=False) + ';', 'const QR_SVG=' + json.dumps(svg) + ';']
for f in ['lib.js', 'core.js', 't2_comp.js', 't2_slides1.js', 't2_slides2.js', 't2_slides3.js']:
    js.append(open(S + f, encoding='utf8').read())
shell = open(S + 'shell.html', encoding='utf8').read().replace('Matemática I · Tema 1 · Matrizes e Sistemas de Equações Lineares', 'Matemática I · Tema 2 · Programação Linear')
out = (shell.replace('/*FONTS*/', open(S + 'fonts.css', encoding='utf8').read())
       .replace('/*KATEXCSS*/', open(S + 'katex.css', encoding='utf8').read())
       .replace('/*CSS*/', open(S + 'style.css', encoding='utf8').read() + '\n' + open(S + 't2_style.css', encoding='utf8').read())
       .replace('/*KATEXJS*/', open(S + 'katex.min.js', encoding='utf8').read().replace('</script>', '<\\/script>'))
       .replace('/*DATA*/', '/* dados */')
       .replace('/*JS*/', '\n'.join(js).replace('</script>', '<\\/script>')))
open('out/Matematica1_Tema2_Apresentacao.html', 'w', encoding='utf8').write(out)
print(len(out) // 1024, 'KB')
