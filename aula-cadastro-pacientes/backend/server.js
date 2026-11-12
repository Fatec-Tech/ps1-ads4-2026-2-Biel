// const express = require('express');
// const cors = require('cors');

// const app = express();

// // Middlewares
// app.use(cors());          // libera o acesso de outras origens (inclui o preflight OPTIONS de PUT/DELETE)
// app.use(express.json());  // converte o corpo JSON das requisições em req.body

// // "Banco de dados" em memória
// let pacientes = [
//   { id: 1, nome: 'Maria Silva', email: 'maria.silva@email.com', nascimento: '1990-04-12' },
//   { id: 2, nome: 'João Pereira', email: 'joao.pereira@email.com', nascimento: '1985-11-30' },
//   { id: 3, nome: 'Ana Costa', email: 'ana.costa@email.com', nascimento: '2001-07-08' },
// ];
// let proximoId = 4;

// // Valida os campos obrigatórios; devolve uma mensagem de erro ou null
// function validarPaciente({ nome, email, nascimento } = {}) {
//   if (!nome || !email || !nascimento) {
//     return 'Os campos nome, email e nascimento são obrigatórios.';
//   }
//   return null;
// }

// // Rota raiz, útil para conferir se a API está no ar
// app.get('/', (req, res) => {
//   res.status(200).json({ mensagem: 'API da Clínica funcionando. Use /pacientes.' });
// });

// // GET /pacientes - lista todos
// app.get('/pacientes', (req, res) => {
//   res.status(200).json(pacientes);
// });

// // GET /pacientes/:id - busca por ID
// app.get('/pacientes/:id', (req, res) => {
//   const id = Number(req.params.id);
//   const paciente = pacientes.find((p) => p.id === id);

//   if (!paciente) {
//     return res.status(404).json({ erro: `Paciente ${req.params.id} não encontrado.` });
//   }
//   res.status(200).json(paciente);
// });

// // POST /pacientes - cadastra
// app.post('/pacientes', (req, res) => {
//   const erro = validarPaciente(req.body);
//   if (erro) {
//     return res.status(400).json({ erro });
//   }

//   const { nome, email, nascimento } = req.body;
//   const novoPaciente = { id: proximoId++, nome, email, nascimento };
//   pacientes.push(novoPaciente);

//   res.status(201).json(novoPaciente);
// });

// // PUT /pacientes/:id - atualiza
// app.put('/pacientes/:id', (req, res) => {
//   const id = Number(req.params.id);
//   const indice = pacientes.findIndex((p) => p.id === id);

//   if (indice === -1) {
//     return res.status(404).json({ erro: `Paciente ${req.params.id} não encontrado.` });
//   }

//   const erro = validarPaciente(req.body);
//   if (erro) {
//     return res.status(400).json({ erro });
//   }

//   const { nome, email, nascimento } = req.body;
//   pacientes[indice] = { id, nome, email, nascimento };

//   res.status(200).json(pacientes[indice]);
// });

// // DELETE /pacientes/:id - exclui
// app.delete('/pacientes/:id', (req, res) => {
//   const id = Number(req.params.id);
//   const existe = pacientes.some((p) => p.id === id);

//   if (!existe) {
//     return res.status(404).json({ erro: `Paciente ${req.params.id} não encontrado.` });
//   }

//   pacientes = pacientes.filter((p) => p.id !== id);
//   res.status(204).send();
// });

// // Qualquer outra rota cai aqui
// app.use((req, res) => {
//   res.status(404).json({ erro: `Rota ${req.method} ${req.originalUrl} não encontrada.` });
// });

// // Porta dinâmica: o Render define process.env.PORT
// const PORTA = process.env.PORT || 3000;

// app.listen(PORTA, () => {
//   console.log(`Servidor rodando na porta ${PORTA}`);
// });


const express = require('express');
const cors = require('cors');
const pool = require('./banco');

const app = express();

app.use(cors());
app.use(express.json());

const COLUNAS = 'id, nome, email, nascimento';

function dadosValidos(corpo) {
  const { nome, email, nascimento } = corpo ?? {};
  return Boolean(nome && email && nascimento);
}

function idValido(id) {
  return Number.isInteger(id) && id > 0;
}

function tratarErro(res, erro) {
  console.error(erro);

  if (erro.code === '23505') {
    // violação da restrição UNIQUE (e-mail repetido)
    return res.status(409).json({ erro: 'Já existe um paciente com este e-mail' });
  }

  res.status(500).json({ erro: 'Erro interno do servidor' });
}

// READ (lista) — GET /pacientes
app.get('/pacientes', async (req, res) => {
  try {
    const resultado = await pool.query(`SELECT ${COLUNAS} FROM pacientes ORDER BY id`);
    res.json(resultado.rows);
  } catch (erro) {
    tratarErro(res, erro);
  }
});

// READ (um) — GET /pacientes/:id
app.get('/pacientes/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!idValido(id)) {
    return res.status(400).json({ erro: 'ID inválido' });
  }

  try {
    const resultado = await pool.query(
      `SELECT ${COLUNAS} FROM pacientes WHERE id = $1`,
      [id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    tratarErro(res, erro);
  }
});

// CREATE — POST /pacientes
app.post('/pacientes', async (req, res) => {
  if (!dadosValidos(req.body)) {
    return res.status(400).json({ erro: 'Nome, e-mail e nascimento são obrigatórios' });
  }

  const { nome, email, nascimento } = req.body;

  try {
    const resultado = await pool.query(
      `INSERT INTO pacientes (nome, email, nascimento)
       VALUES ($1, $2, $3)
       RETURNING ${COLUNAS}`,
      [nome, email, nascimento]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    tratarErro(res, erro);
  }
});

// UPDATE — PUT /pacientes/:id
app.put('/pacientes/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!idValido(id)) {
    return res.status(400).json({ erro: 'ID inválido' });
  }

  if (!dadosValidos(req.body)) {
    return res.status(400).json({ erro: 'Nome, e-mail e nascimento são obrigatórios' });
  }

  const { nome, email, nascimento } = req.body;

  try {
    const resultado = await pool.query(
      `UPDATE pacientes
          SET nome = $1, email = $2, nascimento = $3
        WHERE id = $4
        RETURNING ${COLUNAS}`,
      [nome, email, nascimento, id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    tratarErro(res, erro);
  }
});

// DELETE — DELETE /pacientes/:id
app.delete('/pacientes/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!idValido(id)) {
    return res.status(400).json({ erro: 'ID inválido' });
  }

  try {
    const resultado = await pool.query('DELETE FROM pacientes WHERE id = $1', [id]);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    res.status(204).send();
  } catch (erro) {
    tratarErro(res, erro);
  }
});

const PORTA = process.env.PORT || 3000;

app.listen(PORTA, () => {
  console.log(`Servidor rodando na porta ${PORTA}`);
});
