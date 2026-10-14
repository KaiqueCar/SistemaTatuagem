
const API = 'http://127.0.0.1:8000';

const formEstilo = document.getElementById('form-estilo');
const campoDescricao = document.getElementById('descricao');
const botaoSubmit = document.getElementById('btn-submit-estilo');
const corpoTabela = document.getElementById('corpo-tabela');

// Limpa o formulário e volta ao modo de cadastro.
function limparFormulario() {
  formEstilo.reset();
  delete formEstilo.dataset.idEstilo;

  botaoSubmit.textContent = 'Cadastrar';
  botaoSubmit.classList.remove('btn-success');
  botaoSubmit.classList.add('btn-primary');
}

// Lista os estilos cadastrados no banco.
async function listarEstilos() {
  try {
    const resposta = await fetch(`${API}/estilos`);

    if (!resposta.ok) {
      throw new Error('Não foi possível carregar os estilos.');
    }

    const estilos = await resposta.json();

    corpoTabela.innerHTML = '';

    estilos.forEach((estilo) => {
      const linha = document.createElement('tr');

      const colunaId = document.createElement('td');
      colunaId.textContent = estilo.idestilo;

      const colunaDescricao = document.createElement('td');
      colunaDescricao.textContent = estilo.descricao;

      const colunaAcoes = document.createElement('td');

      const botaoEditar = document.createElement('button');
      botaoEditar.textContent = 'Editar';
      botaoEditar.className = 'btn btn-sm btn-warning me-2';
      botaoEditar.addEventListener('click', () => {
        editarEstilo(estilo.idestilo, estilo.descricao);
      });

      const botaoExcluir = document.createElement('button');
      botaoExcluir.textContent = 'Excluir';
      botaoExcluir.className = 'btn btn-sm btn-danger';
      botaoExcluir.addEventListener('click', () => {
        deletarEstilo(estilo.idestilo);
      });

      colunaAcoes.append(botaoEditar, botaoExcluir);
      linha.append(colunaId, colunaDescricao, colunaAcoes);
      corpoTabela.appendChild(linha);
    });
  } catch (erro) {
    alert(`Erro ao listar estilos: ${erro.message}`);
  }
}

// Prepara o formulário para editar um estilo.
function editarEstilo(id, descricao) {
  campoDescricao.value = descricao;
  formEstilo.dataset.idEstilo = id;

  botaoSubmit.textContent = 'Salvar alterações';
  botaoSubmit.classList.remove('btn-primary');
  botaoSubmit.classList.add('btn-success');

  campoDescricao.focus();
}

// Cadastra um estilo novo ou atualiza um existente.
formEstilo.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const descricao = campoDescricao.value.trim();

  if (!descricao) {
    alert('Digite a descrição do estilo.');
    return;
  }

  const id = formEstilo.dataset.idEstilo;

  const url = id
    ? `${API}/estilos/${id}`
    : `${API}/estilos`;

  const metodo = id ? 'PUT' : 'POST';

  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ descricao })
    });

    const resultado = await resposta.json();

    if (!resposta.ok || resultado.erro) {
      throw new Error(resultado.erro || 'Não foi possível salvar o estilo.');
    }

    alert(resultado.mensagem || 'Estilo salvo com sucesso!');

    limparFormulario();
    await listarEstilos();
  } catch (erro) {
    alert(`Erro ao salvar: ${erro.message}`);
  }
});

// Exclui um estilo.
async function deletarEstilo(id) {
  const confirmar = confirm(
    `Tem certeza de que deseja excluir o estilo ${id}?`
  );

  if (!confirmar) {
    return;
  }

  try {
    const resposta = await fetch(`${API}/estilos/${id}`, {
      method: 'DELETE'
    });

    const resultado = await resposta.json();

    if (!resposta.ok || resultado.erro) {
      throw new Error(resultado.erro || 'Não foi possível excluir o estilo.');
    }

    alert(resultado.mensagem || 'Estilo excluído com sucesso!');

    if (formEstilo.dataset.idEstilo === String(id)) {
      limparFormulario();
    }

    await listarEstilos();
  } catch (erro) {
    alert(`Erro ao excluir: ${erro.message}`);
  }
}

// Carrega a tabela quando a página abre.
listarEstilos();
