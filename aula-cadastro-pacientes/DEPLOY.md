# Como rodar e publicar

## Rodar localmente

```bash
cd backend
npm install
npm start          # API em http://localhost:3000/pacientes
```

Abra `frontend/index.html` com o Live Server. Em `localhost` o `app.js` usa a API local automaticamente.

## Publicar no GitHub

Na raiz do projeto (o `.gitignore` já exclui `node_modules/`):

```bash
git init
git add .
git commit -m "CRUD de pacientes com Express + frontend"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

Confira no GitHub que a pasta `node_modules` NÃO aparece.

## Render: backend (Web Service)

| Campo | Valor |
|---|---|
| Name | `api-clinica-SEU-NOME` |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |

Teste: `https://api-clinica-SEU-NOME.onrender.com/pacientes`

## Ajustar o frontend

Em `frontend/js/app.js`, troque a constante `URL_RENDER` pela URL do seu Web Service
(sem `/pacientes` no final). Faça commit e push.

## Render: frontend (Static Site)

| Campo | Valor |
|---|---|
| Name | `app-clinica-SEU-NOME` |
| Root Directory | `frontend` |
| Build Command | (vazio) |
| Publish Directory | `.` |

## Observações

- No plano gratuito o backend "dorme" após ~15 min sem uso; a primeira requisição pode demorar até ~1 min.
- Os dados ficam em memória: sempre que o servidor reinicia, voltam os 3 pacientes iniciais.
