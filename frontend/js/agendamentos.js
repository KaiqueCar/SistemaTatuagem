
const API = 'http://127.0.0.1:8000';

const formAgendamento = document.getElementById('form-agendamento');
const botaoSubmit = document.getElementById('btn-submit-agendamento');
const blocoStatus = document.getElementById('bloco-status');

protegerPagina();

function limparFormulario() {
    formAgendamento.reset();
    delete formAgendamento.dataset.idAgendamento;

    botaoSubmit.textContent = 'Cadastrar';
    botaoSubmit.classList.remove('btn-success');
    botaoSubmit.classList.add('btn-primary');

    blocoStatus.style.display = 'none';
}

async function requisicaoAutenticada(url, opcoes = {}) {
    const resposta = await fetchAutenticado(url, opcoes);

    if (resposta.status === 401) {
        throw new Error('Sua sessão expirou. Entre novamente.');
    }

    return resposta;
}

async function lerResposta(resposta) {
    const texto = await resposta.text();

    if (!texto) {
        return {};
    }

    try {
        return JSON.parse(texto);
    } catch {
        return { detail: texto };
    }
}

function mensagemErro(resultado, mensagemPadrao) {
    return resultado.detail || resultado.erro || mensagemPadrao;
}

async function carregarClientes() {
    try {
        const resposta = await requisicaoAutenticada(`${API}/clientes`);
        const clientes = await lerResposta(resposta);

        if (!resposta.ok) {
            throw new Error(mensagemErro(clientes, 'Não foi possível carregar os clientes.'));
        }

        const select = document.getElementById('idcliente');
        select.innerHTML = '<option value="">Cliente...</option>';

        clientes.forEach(c => {
            const opcao = document.createElement('option');
            opcao.value = c.idcliente;
            opcao.textContent = c.nome;
            select.appendChild(opcao);
        });
    } catch (erro) {
        console.error(erro);

        if (localStorage.getItem('token')) {
            alert(erro.message || 'Erro ao carregar os clientes.');
        }
    }
}

async function carregarTatuadores() {
    try {
        const resposta = await requisicaoAutenticada(`${API}/tatuadores`);
        const tatuadores = await lerResposta(resposta);

        if (!resposta.ok) {
            throw new Error(mensagemErro(tatuadores, 'Não foi possível carregar os tatuadores.'));
        }

        const select = document.getElementById('idtatuador');
        select.innerHTML = '<option value="">Tatuador...</option>';

        tatuadores.forEach(t => {
            const opcao = document.createElement('option');
            opcao.value = t.idtatuador;
            opcao.textContent = t.nometatuador;
            select.appendChild(opcao);
        });
    } catch (erro) {
        console.error(erro);

        if (localStorage.getItem('token')) {
            alert(erro.message || 'Erro ao carregar os tatuadores.');
        }
    }
}

async function listarAgendamentos() {
    try {
        const resposta = await requisicaoAutenticada(`${API}/agendamentos`);
        const agendamentos = await lerResposta(resposta);

        if (!resposta.ok) {
            throw new Error(mensagemErro(agendamentos, 'Não foi possível listar os agendamentos.'));
        }

        const corpo = document.getElementById('corpo-tabela');
        corpo.innerHTML = '';

        agendamentos.forEach(a => {
            const imagemHtml = a.desenhoaprovado
                ? `<a href="${API}/uploads/${encodeURIComponent(a.desenhoaprovado)}" target="_blank" rel="noopener noreferrer">
                       <img
                           src="${API}/uploads/${encodeURIComponent(a.desenhoaprovado)}"
                           alt="Desenho aprovado"
                           style="max-width: 60px; max-height: 60px; object-fit: contain;"
                       >
                   </a>`
                : '-';

            const linha = document.createElement('tr');

            linha.innerHTML = `
                <td>${a.idagendamento}</td>
                <td>${a.cliente ?? '-'}</td>
                <td>${a.tatuador ?? '-'}</td>
                <td>${a.dataagendamento ?? '-'}</td>
                <td>${a.horaagendamento ?? '-'}</td>
                <td>${a.valortatuagem ?? '-'}</td>
                <td>${a.status ?? '-'}</td>
                <td>${imagemHtml}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-warning me-2">
                        Editar
                    </button>
                    <button type="button" class="btn btn-sm btn-danger">
                        Excluir
                    </button>
                </td>
            `;

            const botoes = linha.querySelectorAll('button');

            botoes[0].addEventListener('click', () => {
                preencherFormularioEdicao(a);
            });

            botoes[1].addEventListener('click', () => {
                deletarAgendamento(a.idagendamento);
            });

            corpo.appendChild(linha);
        });
    } catch (erro) {
        console.error(erro);

        if (localStorage.getItem('token')) {
            alert(erro.message || 'Erro ao carregar os agendamentos.');
        }
    }
}

async function iniciarPagina() {
    await carregarClientes();
    await carregarTatuadores();
    await listarAgendamentos();
}

iniciarPagina();

formAgendamento.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const agendamento = {
            idcliente: Number(document.getElementById('idcliente').value),
            idtatuador: Number(document.getElementById('idtatuador').value),
            dataagendamento: document.getElementById('dataagendamento').value,
            horaagendamento: document.getElementById('horaagendamento').value,
            descricaotatuagem: document.getElementById('descricaotatuagem').value || null,
            valortatuagem: document.getElementById('valortatuagem').value
                ? Number(document.getElementById('valortatuagem').value)
                : null,
            status: document.getElementById('status').value
        };

        const arquivo = document.getElementById('desenho').files[0];
        const idExistente = formAgendamento.dataset.idAgendamento;

        let idParaUpload;

        if (idExistente) {
            const resposta = await requisicaoAutenticada(
                `${API}/agendamentos/${idExistente}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(agendamento)
                }
            );

            const resultado = await lerResposta(resposta);

            if (!resposta.ok) {
                throw new Error(mensagemErro(resultado, 'Erro ao atualizar o agendamento.'));
            }

            idParaUpload = idExistente;
        } else {
            const resposta = await requisicaoAutenticada(
                `${API}/agendamentos`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(agendamento)
                }
            );

            const resultado = await lerResposta(resposta);

            if (!resposta.ok) {
                throw new Error(mensagemErro(resultado, 'Erro ao cadastrar o agendamento.'));
            }

            idParaUpload = resultado.idagendamento;
        }

        if (arquivo) {
            if (!idParaUpload) {
                throw new Error(
                    'O agendamento foi salvo, mas a API não retornou o ID necessário para enviar a imagem.'
                );
            }

            const dadosImagem = new FormData();
            dadosImagem.append('arquivo', arquivo);

            const respostaImagem = await requisicaoAutenticada(
                `${API}/agendamentos/${idParaUpload}/desenho`,
                {
                    method: 'POST',
                    body: dadosImagem
                }
            );

            const resultadoImagem = await lerResposta(respostaImagem);

            if (!respostaImagem.ok) {
                throw new Error(
                    mensagemErro(
                        resultadoImagem,
                        'O agendamento foi salvo, mas houve um erro ao enviar a imagem.'
                    )
                );
            }
        }

        alert('Agendamento salvo com sucesso!');

        limparFormulario();
        await listarAgendamentos();

    } catch (erro) {
        console.error(erro);
        alert(erro.message || 'Ocorreu um erro ao salvar o agendamento.');
    }
});

function preencherFormularioEdicao(agendamento) {
    document.getElementById('idcliente').value = agendamento.idcliente;
    document.getElementById('idtatuador').value = agendamento.idtatuador;
    document.getElementById('dataagendamento').value = agendamento.dataagendamento;
    document.getElementById('horaagendamento').value = agendamento.horaagendamento;
    document.getElementById('descricaotatuagem').value = agendamento.descricaotatuagem || '';
    document.getElementById('valortatuagem').value = agendamento.valortatuagem ?? '';
    document.getElementById('status').value = agendamento.status ?? 'pendente';

    // O navegador não permite preencher automaticamente um campo de arquivo.
    document.getElementById('desenho').value = '';

    blocoStatus.style.display = 'block';
    formAgendamento.dataset.idAgendamento = agendamento.idagendamento;

    botaoSubmit.textContent = 'Salvar alteração';
    botaoSubmit.classList.remove('btn-primary');
    botaoSubmit.classList.add('btn-success');

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

async function deletarAgendamento(id) {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) {
        return;
    }

    try {
        const resposta = await requisicaoAutenticada(
            `${API}/agendamentos/${id}`,
            {
                method: 'DELETE'
            }
        );

        const resultado = await lerResposta(resposta);

        if (!resposta.ok) {
            throw new Error(mensagemErro(resultado, 'Erro ao excluir o agendamento.'));
        }

        alert('Agendamento excluído com sucesso!');
        await listarAgendamentos();

    } catch (erro) {
        console.error(erro);
        alert(erro.message || 'Erro ao excluir o agendamento.');
    }
}
