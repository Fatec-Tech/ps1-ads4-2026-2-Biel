// ============================================================
// URL da API
// Em desenvolvimento usa o servidor local; publicado, usa o Render.
// >>> TROQUE "SEU-NOME" PELA URL REAL DO SEU WEB SERVICE NO RENDER <<<
// ============================================================
const URL_RENDER = 'https://api-clinica-SEU-NOME.onrender.com';
const URL_LOCAL = 'http://localhost:3000';

const rodandoLocal =
	location.hostname === 'localhost' ||
	location.hostname === '127.0.0.1' ||
	location.protocol === 'file:';

const URL_API = `${rodandoLocal ? URL_LOCAL : URL_RENDER}/pacientes`;

// Elementos da página
const formulario = document.getElementById('form-paciente');
const tabela = document.getElementById('tabela-pacientes');
const mensagemCarregando = document.getElementById('carregando');
const caixaMensagem = document.getElementById('mensagem');
const tituloFormulario = document.getElementById('titulo-formulario');
const botaoSalvar = document.getElementById('btn-salvar');
const botaoCancelar = document.getElementById('btn-cancelar');

const campoId = document.getElementById('id-paciente');
const campoNome = document.getElementById('nome');
const campoEmail = document.getElementById('email');
const campoNascimento = document.getElementById('nascimento');

// ------------------------------------------------------------
// Utilitários
// ------------------------------------------------------------
function formatarData(dataISO) {
	const [ano, mes, dia] = dataISO.split('-');
	return `${dia}/${mes}/${ano}`;
}

function mostrarMensagem(texto, tipo = 'success') {
	caixaMensagem.textContent = texto;
	caixaMensagem.className = `alert alert-${tipo}`;
	clearTimeout(mostrarMensagem.timer);
	mostrarMensagem.timer = setTimeout(() => {
		caixaMensagem.className = 'alert d-none';
	}, 4000);
}

// Lê a mensagem de erro enviada pela API (ex.: { erro: '...' })
async function lerErro(resposta) {
	try {
		const corpo = await resposta.json();
		return corpo.erro || `Erro HTTP: ${resposta.status}`;
	} catch {
		return `Erro HTTP: ${resposta.status}`;
	}
}

// ------------------------------------------------------------
// Renderização da tabela
// ------------------------------------------------------------
function criarCelula(texto) {
	const celula = document.createElement('td');
	celula.textContent = texto; // textContent evita injeção de HTML
	return celula;
}

function renderizarTabela(pacientes) {
	tabela.innerHTML = '';

	if (pacientes.length === 0) {
		const linha = document.createElement('tr');
		const celula = criarCelula('Nenhum paciente cadastrado. Use o formulário acima para adicionar.');
		celula.colSpan = 4;
		celula.className = 'text-muted text-center';
		linha.appendChild(celula);
		tabela.appendChild(linha);
		return;
	}

	pacientes.forEach((paciente) => {
		const linha = document.createElement('tr');
		if (String(paciente.id) === campoId.value) {
			linha.classList.add('em-edicao');
		}

		linha.appendChild(criarCelula(paciente.nome));
		linha.appendChild(criarCelula(paciente.email));
		linha.appendChild(criarCelula(formatarData(paciente.nascimento)));

		const acoes = document.createElement('td');
		acoes.className = 'text-end coluna-acoes';

		const botaoEditar = document.createElement('button');
		botaoEditar.type = 'button';
		botaoEditar.className = 'btn btn-sm btn-outline-primary me-2';
		botaoEditar.textContent = 'Editar';
		botaoEditar.addEventListener('click', () => iniciarEdicao(paciente.id));

		const botaoExcluir = document.createElement('button');
		botaoExcluir.type = 'button';
		botaoExcluir.className = 'btn btn-sm btn-outline-danger';
		botaoExcluir.textContent = 'Excluir';
		botaoExcluir.addEventListener('click', () => excluirPaciente(paciente));

		acoes.append(botaoEditar, botaoExcluir);
		linha.appendChild(acoes);
		tabela.appendChild(linha);
	});
}

// ------------------------------------------------------------
// GET /pacientes - carrega a lista do backend
// ------------------------------------------------------------
async function carregarPacientes() {
	try {
		const resposta = await fetch(URL_API);

		if (!resposta.ok) {
			throw new Error(await lerErro(resposta));
		}

		const pacientes = await resposta.json();
		renderizarTabela(pacientes);
		mensagemCarregando.style.display = 'none';
	} catch (erro) {
		console.error('Não foi possível carregar os pacientes:', erro);
		mensagemCarregando.style.display = 'block';
		mensagemCarregando.textContent =
			'Não foi possível carregar os pacientes. Verifique se o servidor está rodando e recarregue a página.';
	}
}

// ------------------------------------------------------------
// Modo edição do formulário
// ------------------------------------------------------------
// GET /pacientes/:id - busca o paciente e preenche o formulário
async function iniciarEdicao(id) {
	try {
		const resposta = await fetch(`${URL_API}/${id}`);

		if (!resposta.ok) {
			throw new Error(await lerErro(resposta));
		}

		const paciente = await resposta.json();

		campoId.value = paciente.id;
		campoNome.value = paciente.nome;
		campoEmail.value = paciente.email;
		campoNascimento.value = paciente.nascimento;

		tituloFormulario.textContent = `Editando: ${paciente.nome}`;
		botaoSalvar.textContent = 'Salvar alterações';
		botaoCancelar.classList.remove('d-none');

		campoNome.focus();
		window.scrollTo({ top: 0, behavior: 'smooth' });
		carregarPacientes(); // destaca a linha em edição
	} catch (erro) {
		mostrarMensagem(erro.message, 'danger');
		carregarPacientes();
	}
}

function sairDoModoEdicao() {
	formulario.reset();
	campoId.value = '';
	tituloFormulario.textContent = 'Novo paciente';
	botaoSalvar.textContent = 'Cadastrar';
	botaoCancelar.classList.add('d-none');
}

botaoCancelar.addEventListener('click', () => {
	sairDoModoEdicao();
	carregarPacientes();
});

// ------------------------------------------------------------
// POST /pacientes (novo) ou PUT /pacientes/:id (edição)
// ------------------------------------------------------------
formulario.addEventListener('submit', async (event) => {
	event.preventDefault();

	const paciente = {
		nome: campoNome.value.trim(),
		email: campoEmail.value.trim(),
		nascimento: campoNascimento.value,
	};

	const id = campoId.value;
	const editando = id !== '';

	botaoSalvar.disabled = true;

	try {
		const resposta = await fetch(editando ? `${URL_API}/${id}` : URL_API, {
			method: editando ? 'PUT' : 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(paciente),
		});

		if (!resposta.ok) {
			throw new Error(await lerErro(resposta));
		}

		mostrarMensagem(editando ? 'Paciente atualizado.' : 'Paciente cadastrado.');
		sairDoModoEdicao();
		await carregarPacientes();
	} catch (erro) {
		console.error('Erro ao salvar paciente:', erro);
		mostrarMensagem(`Não foi possível salvar: ${erro.message}`, 'danger');
	} finally {
		botaoSalvar.disabled = false;
	}
});

// ------------------------------------------------------------
// DELETE /pacientes/:id
// ------------------------------------------------------------
async function excluirPaciente(paciente) {
	if (!confirm(`Excluir o paciente "${paciente.nome}"?`)) {
		return;
	}

	try {
		const resposta = await fetch(`${URL_API}/${paciente.id}`, { method: 'DELETE' });

		// 204 No Content: sucesso sem corpo na resposta
		if (resposta.status !== 204) {
			throw new Error(await lerErro(resposta));
		}

		if (String(paciente.id) === campoId.value) {
			sairDoModoEdicao();
		}

		mostrarMensagem('Paciente excluído.');
		await carregarPacientes();
	} catch (erro) {
		console.error('Erro ao excluir paciente:', erro);
		mostrarMensagem(`Não foi possível excluir: ${erro.message}`, 'danger');
	}
}

// Assim que o script carrega, já busca os dados
carregarPacientes();
