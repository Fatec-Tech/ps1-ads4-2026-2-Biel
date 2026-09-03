// Array que guarda os pacientes cadastrados (em memória, só nesta sessão)
const pacientes = [];

// Referências aos elementos do DOM que vamos usar
const formulario = document.getElementById('form-paciente');
const tabela = document.getElementById('tabela-pacientes');

// FUNÇÃO: Calcula a idade exata com base na data de nascimento (AAAA-MM-DD)
function calcularIdade(dataNascimento) {
    if (!dataNascimento) return ''; 

    const hoje = new Date();
    
    // Adiciona 'T00:00:00' para forçar a leitura correta no fuso local do navegador
    const nascimento = new Date(dataNascimento + 'T00:00:00');

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    
    const mesAtual = hoje.getMonth();
    const diaAtual = hoje.getDate();
    
    const mesNascimento = nascimento.getMonth();
    const diaNascimento = nascimento.getDate();

    // Se ainda não chegou o aniversário este ano, subtrai 1
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && diaAtual < diaNascimento)) {
        idade--;
    }

    return idade;
}

// Função responsável por adicionar um paciente ao array
function adicionarPaciente(nome, email, nascimento, telefone, idade) {
    const novoPaciente = { nome, email, nascimento, telefone, idade };
    pacientes.push(novoPaciente);
}

// Função responsável por desenhar a tabela inteira a partir do array
function renderizarTabela() {
    tabela.innerHTML = ''; // limpa a tabela antes de redesenhar

    pacientes.forEach((paciente) => {
        const linha = document.createElement('tr');

        linha.innerHTML = `
      <td>${paciente.nome}</td>
      <td>${paciente.email}</td>
      <td>${formatarData(paciente.nascimento)}</td>
      <td>${paciente.telefone}</td>
      <td>${paciente.idade}</td>
    `;

        tabela.appendChild(linha);
    });
}

// Função utilitária só para formatar a data no padrão dd/mm/aaaa
function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}



// Evento disparado quando o formulário é enviado
formulario.addEventListener('submit', (event) => {
    event.preventDefault(); // evita o recarregamento da página

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const nascimento = document.getElementById('nascimento').value;
    const telefone = document.getElementById('telefone').value;
    const contPaciente = document.getElementById('contador');

    // CALCULA DIRETAMENTE AQUI: Gera a idade usando a função e a data inserida
    const idade = calcularIdade(nascimento);

    // Adiciona e renderiza normalmente
    adicionarPaciente(nome, email, nascimento, telefone, idade);
    renderizarTabela();

    formulario.reset(); // limpa os campos do formulário

    contPaciente.textContent = pacientes.length;

});