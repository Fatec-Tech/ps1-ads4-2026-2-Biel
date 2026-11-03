const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());          // libera o acesso de outras origens (inclui o preflight OPTIONS de PUT/DELETE)
app.use(express.json());  // converte o corpo JSON das requisições em req.body

// "Banco de dados" em memória
let pacientes = [
  { id: 1, nome: 'Maria Silva', email: 'maria.silva@email.com', nascimento: '1990-04-12' },
  { id: 2, nome: 'João Pereira', email: 'joao.pereira@email.com', nascimento: '1985-11-30' },
  { id: 3, nome: 'Ana Costa', email: 'ana.costa@email.com', nascimento: '2001-07-08' },
];
let proximoId = 4;

// Valida os campos obrigatórios; devolve uma mensagem de erro ou null
function validarPaciente({ nome, email, nascimento } = {}) {
  if (!nome || !email || !nascimento) {
    return 'Os campos nome, email e nascimento são obrigatórios.';
  }
  return null;
}

// Rota raiz, útil para conferir se a API está no ar
app.get('/', (req, res) => {
  res.status(200).json({ mensagem: 'API da Clínica funcionando. Use /pacientes.' });
});

// GET /pacientes - lista todos
app.get('/pacientes', (req, res) => {
  res.status(200).json(pacientes);
});

// GET /pacientes/:id - busca por ID
app.get('/pacientes/:id', (req, res) => {
  const id = Number(req.params.id);
  const paciente = pacientes.find((p) => p.id === id);

  if (!paciente) {
    return res.status(404).json({ erro: `Paciente ${req.params.id} não encontrado.` });
  }
  res.status(200).json(paciente);
});

// POST /pacientes - cadastra
app.post('/pacientes', (req, res) => {
  const erro = validarPaciente(req.body);
  if (erro) {
    return res.status(400).json({ erro });
  }

  const { nome, email, nascimento } = req.body;
  const novoPaciente = { id: proximoId++, nome, email, nascimento };
  pacientes.push(novoPaciente);

  res.status(201).json(novoPaciente);
});

// PUT /pacientes/:id - atualiza
app.put('/pacientes/:id', (req, res) => {
  const id = Number(req.params.id);
  const indice = pacientes.findIndex((p) => p.id === id);

  if (indice === -1) {
    return res.status(404).json({ erro: `Paciente ${req.params.id} não encontrado.` });
  }

  const erro = validarPaciente(req.body);
  if (erro) {
    return res.status(400).json({ erro });
  }

  const { nome, email, nascimento } = req.body;
  pacientes[indice] = { id, nome, email, nascimento };

  res.status(200).json(pacientes[indice]);
});

// DELETE /pacientes/:id - exclui
app.delete('/pacientes/:id', (req, res) => {
  const id = Number(req.params.id);
  const existe = pacientes.some((p) => p.id === id);

  if (!existe) {
    return res.status(404).json({ erro: `Paciente ${req.params.id} não encontrado.` });
  }

  pacientes = pacientes.filter((p) => p.id !== id);
  res.status(204).send();
});

// Qualquer outra rota cai aqui
app.use((req, res) => {
  res.status(404).json({ erro: `Rota ${req.method} ${req.originalUrl} não encontrada.` });
});

// Porta dinâmica: o Render define process.env.PORT
const PORTA = process.env.PORT || 3000;

app.listen(PORTA, () => {
  console.log(`Servidor rodando na porta ${PORTA}`);
});
