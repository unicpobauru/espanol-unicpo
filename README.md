# Clases de Español · UniCPO

Dashboard do professor de espanhol para as turmas internas da UniCPO: turmas, cronograma semanal (com cancelamento, remarcação e aula extra por data), chamada com observações e gráficos de presença e falta.

- Página única (`index.html`), sem build. Os gráficos usam Chart.js.
- Os dados ficam salvos no navegador de quem usa (localStorage). Na primeira vez, restaure o arquivo de dados iniciais (.json). Depois, use **Dados & ajustes → Baixar backup** com frequência.
- Nenhum dado de aluno fica neste repositório (`*.json` está no `.gitignore`).
