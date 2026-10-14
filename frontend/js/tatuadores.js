
const API = 'http://127.0.0.1:8000'

const formTatuador = document.getElementById('form-tatuador')
const botaoSubmit = document.getElementById('btn-submit-tatuador')
const listaEstilos = document.getElementById('lista-estilos')

// Realiza requisições à API e trata erros
async function requisicao(url, opcoes = {}) {
    let resposta

    try {
        resposta = await fetch(url, opcoes)
    } catch (erro) {
        console.error('Erro de conexão:', url, erro)
        throw new Error(
            'Não foi possível conectar à API. Confira se o FastAPI está funcionando.'
        )
    }

    const texto = await resposta.text()
    let dados = {}

    try {
        dados = texto ? JSON.parse(texto) : {}
    } catch {
        throw new Error('A API retornou uma resposta inválida.')
    }

    if (!resposta.ok || dados.erro) {
        throw new Error(
            dados.detail || dados.erro || `Erro HTTP ${resposta.status}`
        )
    }

    return dados
}

// Limpa o formulário
function limparFormulario() {
    formTatuador.reset()
    delete formTatuador.dataset.idTatuador

    listaEstilos.querySelectorAll('input[type="checkbox"]').forEach(
        checkbox => {
            checkbox.checked = false
        }
    )

    botaoSubmit.textContent = 'Cadastrar'
    botaoSubmit.classList.remove('btn-success')
    botaoSubmit.classList.add('btn-primary')
}

// Carrega as senioridades
async function carregarSenioridades() {
    try {
        const senioridades = await requisicao(`${API}/senioridade`)
        const select = document.getElementById('idsenioridade')

        select.innerHTML = '<option value="">Senioridade...</option>'

        senioridades.forEach(s => {
            const opcao = document.createElement('option')
            opcao.value = s.idsenioridade
            opcao.textContent = s.nome
            select.appendChild(opcao)
        })
    } catch (erro) {
        console.error(erro)
        alert(`Erro ao carregar senioridades: ${erro.message}`)
    }
}

// Carrega os estilos disponíveis
async function carregarEstilos() {
    try {
        const estilos = await requisicao(`${API}/estilos`)

        listaEstilos.innerHTML = ''

        if (!Array.isArray(estilos) || estilos.length === 0) {
            listaEstilos.textContent =
                'Nenhum estilo cadastrado. Cadastre estilos na página Estilos.'
            return
        }

        estilos.forEach(estilo => {
            const label = document.createElement('label')
            label.className = 'form-check form-check-inline'

            const checkbox = document.createElement('input')
            checkbox.type = 'checkbox'
            checkbox.className = 'form-check-input'
            checkbox.name = 'idestilos'
            checkbox.value = estilo.idestilo

            const texto = document.createElement('span')
            texto.className = 'form-check-label ms-1'
            texto.textContent = estilo.descricao

            label.appendChild(checkbox)
            label.appendChild(texto)
            listaEstilos.appendChild(label)
        })
    } catch (erro) {
        console.error(erro)
        listaEstilos.textContent = 'Erro ao carregar estilos.'
        alert(`Erro ao carregar estilos: ${erro.message}`)
    }
}

// Obtém os IDs dos estilos selecionados
function obterEstilosSelecionados() {
    return Array.from(
        listaEstilos.querySelectorAll(
            'input[name="idestilos"]:checked'
        )
    ).map(checkbox => Number(checkbox.value))
}

// Salva os estilos relacionados ao tatuador
async function salvarEstilosDoTatuador(idTatuador) {
    const idestilos = obterEstilosSelecionados()

    return await requisicao(
        `${API}/tatuadores/${idTatuador}/estilos`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idestilos })
        }
    )
}

// Lista os tatuadores e seus estilos
async function listarTatuadores() {
    try {
        const tatuadores = await requisicao(`${API}/tatuadores`)
        const corpo = document.getElementById('corpo-tabela')

        corpo.innerHTML = ''

        tatuadores.forEach(t => {
            const linha = document.createElement('tr')

            const valores = [
                t.idtatuador,
                t.nometatuador,
                t.cpf,
                t.email || '-',
                t.telefone || '-',
                t.senioridade || '-',
                t.estilos || 'Nenhum estilo'
            ]

            valores.forEach(valor => {
                const celula = document.createElement('td')
                celula.textContent = valor
                linha.appendChild(celula)
            })

            const celulaAcoes = document.createElement('td')

            const editar = document.createElement('button')
            editar.type = 'button'
            editar.className = 'btn btn-sm btn-warning me-2'
            editar.textContent = 'Editar'
            editar.addEventListener('click', () => {
                preencherFormularioEdicao(t)
            })

            const excluir = document.createElement('button')
            excluir.type = 'button'
            excluir.className = 'btn btn-sm btn-danger'
            excluir.textContent = 'Excluir'
            excluir.addEventListener('click', () => {
                deletarTatuador(t.idtatuador)
            })

            celulaAcoes.appendChild(editar)
            celulaAcoes.appendChild(excluir)
            linha.appendChild(celulaAcoes)

            corpo.appendChild(linha)
        })
    } catch (erro) {
        console.error(erro)
        alert(`Erro ao listar tatuadores: ${erro.message}`)
    }
}

// Cadastra ou atualiza um tatuador
formTatuador.addEventListener('submit', async (e) => {
    e.preventDefault()

    const tatuador = {
        nometatuador: document.getElementById('nometatuador').value.trim(),
        cpf: document.getElementById('cpf').value.trim(),
        email: document.getElementById('email').value.trim() || null,
        telefone: document.getElementById('telefone').value.trim() || null,
        datacontratacao: new Date().toISOString().split('T')[0],
        idsenioridade: Number(
            document.getElementById('idsenioridade').value
        )
    }

    const idTatuador = formTatuador.dataset.idTatuador
    const editando = Boolean(idTatuador)

    botaoSubmit.disabled = true

    try {
        const resultado = await requisicao(
            editando
                ? `${API}/tatuadores/${idTatuador}`
                : `${API}/tatuadores`,
            {
                method: editando ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tatuador)
            }
        )

        const idSalvo = editando
            ? Number(idTatuador)
            : resultado.idtatuador

        if (!idSalvo) {
            throw new Error('A API não retornou o ID do tatuador.')
        }

        await salvarEstilosDoTatuador(idSalvo)

        alert(
            editando
                ? 'Tatuador atualizado com sucesso!'
                : 'Tatuador cadastrado com sucesso!'
        )

        limparFormulario()
        await listarTatuadores()
    } catch (erro) {
        console.error('Erro ao salvar tatuador:', erro)
        alert(`Erro ao salvar: ${erro.message}`)
    } finally {
        botaoSubmit.disabled = false
    }
})

// Preenche os campos e marca os estilos existentes
async function preencherFormularioEdicao(tatuador) {
    document.getElementById('nometatuador').value =
        tatuador.nometatuador

    document.getElementById('cpf').value = tatuador.cpf
    document.getElementById('email').value = tatuador.email || ''
    document.getElementById('telefone').value = tatuador.telefone || ''
    document.getElementById('idsenioridade').value =
        tatuador.idsenioridade

    formTatuador.dataset.idTatuador = tatuador.idtatuador

    botaoSubmit.textContent = 'Salvar alteração'
    botaoSubmit.classList.remove('btn-primary')
    botaoSubmit.classList.add('btn-success')

    listaEstilos.querySelectorAll('input[type="checkbox"]').forEach(
        checkbox => {
            checkbox.checked = false
        }
    )

    try {
        const estilos = await requisicao(
            `${API}/tatuadores/${tatuador.idtatuador}/estilos`
        )

        const idsSelecionados = estilos.map(
            estilo => Number(estilo.idestilo)
        )

        listaEstilos.querySelectorAll('input[name="idestilos"]').forEach(
            checkbox => {
                checkbox.checked = idsSelecionados.includes(
                    Number(checkbox.value)
                )
            }
        )

        formTatuador.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        })
    } catch (erro) {
        console.error(erro)
        alert(`Erro ao carregar estilos do tatuador: ${erro.message}`)
    }
}

// Exclui um tatuador
async function deletarTatuador(id) {
    if (!confirm('Tem certeza que deseja excluir este tatuador?')) {
        return
    }

    try {
        const resultado = await requisicao(
            `${API}/tatuadores/${id}`,
            { method: 'DELETE' }
        )

        alert(resultado.mensagem || 'Tatuador excluído com sucesso!')
        await listarTatuadores()
    } catch (erro) {
        console.error(erro)
        alert(`Erro ao excluir: ${erro.message}`)
    }
}

// Inicializa a página
async function inicializarPagina() {
    await Promise.all([
        carregarSenioridades(),
        carregarEstilos()
    ])

    await listarTatuadores()
}

inicializarPagina()
