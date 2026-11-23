# Quiz ao Vivo

Quiz em tempo real (estilo Kahoot) com personagens, PIN/QR, temporizador, ranking e reconexão.

## Testar local
```
cd server
npm install
node server.js        # senha padrão: admin123  (mude com ADMIN_PASSWORD)
```
- Host (admin): http://localhost:3000/host.html
- Jogadores: http://localhost:3000/  (no celular, use o IP do PC na rede: http://SEU-IP:3000)

## Formato das perguntas
**TXT** (linha em branco separa perguntas; `*` marca a correta; `tempo:` opcional):
```
Qual a capital do Brasil?
São Paulo
*Brasília
Rio de Janeiro
Salvador
tempo: 20

O Sol é uma estrela.
*Verdadeiro
Falso
```
**JSON**: `[{ "q": "...", "options": ["a","b"], "correct": 2, "time": 20 }]` (`correct` = posição da correta, começando em 1; 2 a 4 opções).

## Publicar (grátis)
1. **Servidor no Render** (precisa do código num repositório GitHub)
   - New → Web Service → repositório → *Root Directory*: `quiz_ao_vivo/server`
   - Build: `npm install` · Start: `node server.js` · Plan: Free
   - Environment: `ADMIN_PASSWORD` = sua senha
   - Copie a URL gerada (ex: `https://meu-quiz.onrender.com`)
2. **Site no Netlify**
   - Edite `client/config.js`: `window.SERVER_URL = 'https://meu-quiz.onrender.com';`
   - Arraste a pasta `client` em app.netlify.com/drop (ou conecte o repositório, publish dir `client`).
3. **Antes do evento**: abra `https://meu-quiz.onrender.com/health` uns 5 min antes para o servidor acordar.
4. O host abre `https://SEU-SITE.netlify.app/host.html`; os jogadores usam o QR/PIN.
