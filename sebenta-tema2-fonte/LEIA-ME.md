# Sebenta do Tema 2 (Programação Linear): fonte

Gerador em Python com uma fonte única e dois resultados: PDF (XeLaTeX) e Word (pandoc com `reference.docx`).

- `sebgen.py`: nós do documento (Part, Chapter, Sec, P, Eq, Box, Margin, QR, Tab, Fig, Quadro, Exercise, ...) e os dois backends.
- `auto.py`: resoluções automáticas a partir do motor exato `apresentacao-tema2-fonte/pl/plengine.py` (modelo, forma standard, gráfico, método algébrico, Simplex com M grande, dual).
- `ch_teoria.py` (Parte I), `ch_ex.py` (Partes II, III e V), `ch_testes.py` (Parte IV e resoluções dos testes).
- `build.py` compila tudo: `python3 build.py` (precisa de Libertinus 7.051 e Lato em ~/.fonts, XeLaTeX e pandoc). `mkref.py` refaz o `reference.docx`; `cover.py` refaz a imagem da capa.

Cada número do livro sai do motor com frações exatas e é confirmado com `scipy.optimize.linprog` (asserts no código).
