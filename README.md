# Arena Mat I (versão local de teste, v0.2: novo visual)

App de gamificação de Matemática I, Tema 1 (Matrizes e SEL). Esta versão corre só no navegador, sem servidor nem IA.

## Correr
```
node scripts/build-web.mjs     # copia o motor para web/js/engine
node scripts/serve.mjs         # abre http://localhost:8090
node --test mat1-engine/test/engine.test.js   # testes do motor (23)
```
Precisa de Node 20 ou superior. No telemóvel, na mesma rede Wi-Fi, abrir http://IP-do-computador:8090.

## O que já faz
- Treinar: produto, determinante, inversa, característica e sistemas, com exercícios novos de cada vez (semente), verificação exata em frações, pistas (−25% cada) e resolução passo a passo.
- Por passos: escreve cada operação (Jacobi com o multiplicador à esquerda da linha que muda, ×k, :k, troca) e a matriz; o motor aponta o primeiro passo errado, distingue método de cálculo, nomeia erros típicos e dá pontos (método 40%, cálculos 40%, resposta 20%).
- Visual "Noite de estudo": quadro azul-noite, botões em relevo, folha de resultado que sobe do fundo, confetes, sons sintetizados, teclado no ecrã no telemóvel, mapa de temas com estrelas e o teste de 28 de outubro como chefe final.
- Avatar: compositor com cabelo, cores, barba, olhos, sobrancelhas, boca, óculos, roupa, estampa, pele, fundo e moldura. Os itens desbloqueiam-se por nível (6 níveis). Só galeria, sem fotografias.
- Missões diárias com baú, 15 conquistas com raridade, liga da turma (nesta versão, com colegas simulados).
- XP, níveis temáticos, sequência de dias, retornos decrescentes por dia, nível do exercício que sobe e desce com o desempenho, contagem decrescente para 28 de outubro.

## O que falta (semanas 2 a 4)
Servidor (Cloudflare Worker, D1), entrada com nome, email e código da turma (MAT12026), ranking e ligas, correção por fotografia (imagem só em memória), geradores de discussão com parâmetros, enunciados de gestão por IA, painel do professor, modo teste, PWA instalável e notificações.

## Créditos
Avatares: Avataaars, de Pablo Stanley, via DiceBear (uso livre, com crédito). KaTeX, canvas-confetti. Tipos Big Shoulders Display, Figtree e Caveat (licença OFL). Tudo incluído localmente em `web/vendor`, sem pedidos externos.

## Estrutura
- `mat1-engine/`: frações BigInt, matrizes, operações elementares, geradores com semente, verificador de passos e testes.
- `web/`: interface (JavaScript em módulos, sem framework), KaTeX local.
- `scripts/`: build, servidor local e teste de fumo (`python3 scripts/smoke.py pasta`, Playwright).
- `vendor-src/`: como se geraram `web/vendor/dicebear.js` e `confetti.js` (esbuild).
