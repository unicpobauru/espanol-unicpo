# Ligar o site à Planilha Google

1. Entre no Google Drive com a conta da UniCPO e crie uma planilha nova chamada **Clases de Español – Dados**.
2. Na planilha, abra **Extensões → Apps Script**.
3. Apague o código que aparece, cole todo o conteúdo de `Codigo.gs` e troque `TROQUE_ESTA_SENHA` pela senha que o professor vai usar.
4. Clique no ícone de disquete para salvar.
5. Clique em **Implantar → Nova implantação**. Na engrenagem, escolha **App da Web** e preencha:
   - Descrição: `site espanhol`
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
6. Clique em **Implantar** e autorize com a conta da UniCPO. Se aparecer "O Google não verificou este app", clique em **Avançado → Acessar (não seguro)**. O app é de vocês mesmos.
7. Copie a **URL do app da Web** (termina em `/exec`) e mande para o Claude colocar no site.

Mesmo com "Qualquer pessoa" marcado, nada é lido nem gravado sem a senha. A planilha em si continua privada no Drive.

**Para trocar a senha depois:** mude a senha no código, salve e vá em **Implantar → Gerenciar implantações → editar (lápis) → Versão: Nova versão → Implantar**. A URL continua a mesma.
