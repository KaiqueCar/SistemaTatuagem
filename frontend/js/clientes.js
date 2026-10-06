const API = 'http://127.0.0.1:8000'

const formCliente = document.getElementById('form-cliente')
const botaoSubmit = document.getElementById('btn-submit-cliente')

function limparFormulario() {
    formCliente.reset()
    delete formCliente.dataset.idCliente

    botaoSubmit.textContent = 'Cadastrar'
    botaoSubmit.classList.remove('btn-success')
    botaoSubmit.classList.add('btn-primary')
}


async function listarClientes() {
    const resposta = await fetch(`${API}/clientes`)
    const clientes = await resposta.json()

    const corpo = document.getElementById('corpo-tabela')
    corpo.innerHTML = ''

    clientes.forEach(c => {
        corpo.innerHTML += `
            <tr>
                <td>${c.idcliente}</td>
                <td>${c.nome}</td>
                <td>${c.cpf}</td>
                <td>${c.telefone ?? '-'}</td>
                <td>${c.cidade ?? '-'}</td>
                <td>${c.uf ?? '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-2"
                        onclick='preencherFormularioEdicao(${JSON.stringify(c)})'>
                        Editar
                    </button>

                    <button class="btn btn-sm btn-danger"
                        onclick="deletarCliente(${c.idcliente})">
                        Excluir
                    </button>
                </td>
            </tr>
        `
    })
}

listarClientes()


formCliente.addEventListener('submit', async (e) => {
    e.preventDefault()

    const id = formCliente.dataset.idCliente

    const cliente = {
        nome: document.getElementById('nome').value,
        cpf: document.getElementById('cpf').value,
        telefone: document.getElementById('telefone').value || null,
        datacadastro: document.getElementById('datacadastro').value || null,
        cidade: document.getElementById('cidade').value || null,
        uf: document.getElementById('uf').value || null
    }

    const url = id ? `${API}/clientes/${id}` : `${API}/clientes`
    const metodo = id ? 'PUT' : 'POST'

    const resposta = await fetch(url, {
        method: metodo,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(cliente)
    })

    if (resposta.ok) {
        alert(id ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!')

        limparFormulario()
        listarClientes()
    } else {
        alert('Erro ao salvar cliente.')
    }
})




function preencherFormularioEdicao(cliente) {
    document.getElementById('nome').value = cliente.nome
    document.getElementById('cpf').value = cliente.cpf
    document.getElementById('telefone').value = cliente.telefone ?? ''
    document.getElementById('datacadastro').value = cliente.datacadastro ?? ''
    document.getElementById('cidade').value = cliente.cidade ?? ''
    document.getElementById('uf').value = cliente.uf ?? ''

    formCliente.dataset.idCliente = cliente.idcliente

    botaoSubmit.textContent = 'Atualizar'
    botaoSubmit.classList.remove('btn-primary')
    botaoSubmit.classList.add('btn-success')
}



async function deletarCliente(id) {
    const confirmar = confirm('Tem certeza que deseja excluir este cliente?')

    if (!confirmar) {
        return
    }

    const resposta = await fetch(`${API}/clientes/${id}`, {
        method: 'DELETE'
    })

    if (resposta.ok) {
        alert('Cliente excluído com sucesso!')
        listarClientes()
    } else {
        alert('Não foi possível excluir o cliente.')
    }
}


