# Fonte da apresentação do Tema 2 (Programação Linear)

- `pl/plengine.py`: motor exato de PL (frações, Simplex com M grande, método algébrico, dual).
- `pl/content.py`: exercícios recomendados e testes de exemplo; cada solução é calculada pelo motor e confirmada com scipy. Gera `src/t2_data.json`.
- `pl/export.py`: quadros do Simplex e tabela do método algébrico usados nos slides (`src/t2_extra.json`).
- `src/`: motor dos slides (lib.js, core.js, estilos, KaTeX e fontes embebidos) e os slides do Tema 2 (`t2_comp.js`, `t2_slides1.js` a `t2_slides3.js`). Os ficheiros `t1_*` são os slides do Tema 1, recuperados do HTML publicado.
- Construir: `cd pl && python3 content.py && python3 export.py && cd .. && python3 build_t2.py` (gera `out/Matematica1_Tema2_Apresentacao.html`; criar a pasta `out` antes).
- Publicado em https://matematica1-carrasco-esght.netlify.app/apresentacao-tema2/ (pasta `site/apresentacao-tema2/`).
