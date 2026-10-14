
const API = 'http://127.0.0.1:8000'

const formAgendamento = document.getElementById('form-agendamento')
const botaoSubmit = document.getElementById('btn-submit-agendamento')
const blocoStatus = document.getElementById('bloco-status')

function limparFormulario() {
    formAgendamento.reset()
    delete formAgendamento.dataset.idAgendamento

    botaoSubmit.textContent = 'Cadastrar'
    botaoSubmit.classList.remove('btn-success')
    botaoSubmit.classList.add('btn-primary')

    blocoStatus.style.display = 'none'
}

async function carregarClientes() {
    try {
        const resposta = await fetch(`${API}/clientes`)

        if (!resposta.ok) {
            throw new Error('Não foi possível carregar os clientes.')
        }

        const clientes = await resposta.json()
        const select = document.getElementById('idcliente')

        select.innerHTML = '<option value="">Cliente...</option>'

        clientes.forEach(c => {
            select.innerHTML += `
                <option value="${c.idcliente}">
                    ${c.nome}
                </option>
            `
        })
    } catch (erro) {
        console.error(erro)
        alert('Erro ao carregar os clientes.')
    }
}

async function carregarTatuadores() {
    try {
        const resposta = await fetch(`${API}/tatuadores`)

        if (!resposta.ok) {
            throw new Error('Não foi possível carregar os tatuadores.')
        }

        const tatuadores = await resposta.json()
        const select = document.getElementById('idtatuador')

        select.innerHTML = '<option value="">Tatuador...</option>'

        tatuadores.forEach(t => {
            select.innerHTML += `
                <option value="${t.idtatuador}">
                    ${t.nometatuador}
                </option>
            `
        })
    } catch (erro) {
        console.error(erro)
        alert('Erro ao carregar os tatuadores.')
    }
}

async function listarAgendamentos() {
    try {
        const resposta = await fetch(`${API}/agendamentos`)

        if (!resposta.ok) {
            throw new Error('Não foi possível listar os agendamentos.')
        }

        const agendamentos = await resposta.json()
        const corpo = document.getElementById('corpo-tabela')

        corpo.innerHTML = ''

        agendamentos.forEach(a => {
            const imagemHtml = a.desenhoaprovado
                ? `<a href="${API}/uploads/${encodeURIComponent(a.desenhoaprovado)}" target="_blank" rel="noopener noreferrer">
                       <img
                           src="${API}/uploads/${encodeURIComponent(a.desenhoaprovado)}"
                           alt="Desenho aprovado"
                           style="max-width: 60px; max-height: 60px; object-fit: contain;"
                       >
                   </a>`
                : '-'

            corpo.innerHTML += `
                <tr>
                    <td>${a.idagendamento}</td>
                    <td>${a.cliente ?? '-'}</td>
                    <td>${a.tatuador ?? '-'}</td>
                    <td>${a.dataagendamento ?? '-'}</td>
                    <td>${a.horaagendamento ?? '-'}</td>
                    <td>${a.valortatuagem ?? '-'}</td>
                    <td>${a.status ?? '-'}</td>
                    <td>${imagemHtml}</td>
                    <td>
                        <button
                            class="btn btn-sm btn-warning me-2"
                            onclick='preencherFormularioEdicao(${JSON.stringify(a)})'
                        >
                            Editar
                        </button>

                        <button
                            class="btn btn-sm btn-danger"
                            onclick="deletarAgendamento(${a.idagendamento})"
                        >
                            Excluir
                        </button>
                    </td>
                </tr>
            `
        })
    } catch (erro) {
        console.error(erro)
        alert('Erro ao carregar os agendamentos.')
    }
}

carregarClientes()
carregarTatuadores()
listarAgendamentos()

formAgendamento.addEventListener('submit', async (e) => {
    e.preventDefault()

    try {
        const agendamento = {
            idcliente: Number(document.getElementById('idcliente').value),
            idtatuador: Number(document.getElementById('idtatuador').value),

            dataagendamento:
                document.getElementById('dataagendamento').value,

            horaagendamento:
                document.getElementById('horaagendamento').value,

            descricaotatuagem:
                document.getElementById('descricaotatuagem').value || null,

            valortatuagem:
                document.getElementById('valortatuagem').value
                    ? Number(document.getElementById('valortatuagem').value)
                    : null,

            status: document.getElementById('status').value
        }

        const arquivo = document.getElementById('desenho').files[0]
        const idExistente = formAgendamento.dataset.idAgendamento

        let idParaUpload

        if (idExistente) {
            // Atualiza um agendamento existente
            const resposta = await fetch(
                `${API}/agendamentos/${idExistente}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(agendamento)
                }
            )

            const resultado = await resposta.json()

            if (!resposta.ok) {
                throw new Error(resultado.detail || resultado.erro || 'Erro ao atualizar o agendamento.')
            }

            idParaUpload = idExistente
        } else {
            // Cadastra um novo agendamento
            const resposta = await fetch(`${API}/agendamentos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(agendamento)
            })

            const resultado = await resposta.json()

            if (!resposta.ok) {
                throw new Error(resultado.detail || resultado.erro || 'Erro ao cadastrar o agendamento.')
            }

            idParaUpload = resultado.idagendamento
        }

        // Envia a imagem, caso uma tenha sido selecionada
        if (arquivo) {
            const dadosImagem = new FormData()
            dadosImagem.append('arquivo', arquivo)

            const respostaImagem = await fetch(
                `${API}/agendamentos/${idParaUpload}/desenho`,
                {
                    method: 'POST',
                    body: dadosImagem
                }
            )

            const resultadoImagem = await respostaImagem.json()

            if (!respostaImagem.ok) {
                throw new Error(
                    resultadoImagem.detail ||
                    resultadoImagem.erro ||
                    'O agendamento foi salvo, mas houve um erro ao enviar a imagem.'
                )
            }
        }

        alert('Agendamento salvo com sucesso!')

        limparFormulario()
        await listarAgendamentos()

    } catch (erro) {
        console.error(erro)
        alert(erro.message || 'Ocorreu um erro ao salvar o agendamento.')
    }
})

function preencherFormularioEdicao(agendamento) {
    document.getElementById('idcliente').value =
        agendamento.idcliente

    document.getElementById('idtatuador').value =
        agendamento.idtatuador

    document.getElementById('dataagendamento').value =
        agendamento.dataagendamento

    document.getElementById('horaagendamento').value =
        agendamento.horaagendamento

    document.getElementById('descricaotatuagem').value =
        agendamento.descricaotatuagem || ''

    document.getElementById('valortatuagem').value =
        agendamento.valortatuagem ?? ''

    document.getElementById('status').value =
        agendamento.status ?? ''

    // Ao editar, o usuário pode escolher uma nova imagem.
    // O navegador não permite preencher automaticamente um input file.
    document.getElementById('desenho').value = ''

    blocoStatus.style.display = 'block'

    formAgendamento.dataset.idAgendamento =
        agendamento.idagendamento

    botaoSubmit.textContent = 'Salvar alteração'
    botaoSubmit.classList.remove('btn-primary')
    botaoSubmit.classList.add('btn-success')
}

async function deletarAgendamento(id) {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) {
        return
    }

    try {
        const resposta = await fetch(`${API}/agendamentos/${id}`, {
            method: 'DELETE'
        })

        const resultado = await resposta.json()

        if (!resposta.ok) {
            throw new Error(resultado.detail || resultado.erro || 'Erro ao excluir o agendamento.')
        }

        await listarAgendamentos()
    } catch (erro) {
        console.error(erro)
        alert(erro.message || 'Erro ao excluir o agendamento.')
    }
}
