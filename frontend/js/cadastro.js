
const API = 'http://127.0.0.1:8000';

// Impede o acesso à página sem login
protegerPagina();

const formCadastro = document.getElementById('form-cadastro');
const mensagem = document.getElementById('mensagem');
const botaoCadastrar = document.getElementById('botao-cadastrar');

formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = {
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        senha: document.getElementById('senha').value
    };

    mensagem.textContent = '';
    botaoCadastrar.disabled = true;
    botaoCadastrar.textContent = 'Cadastrando...';

    try {
        const resposta = await fetchAutenticado(`${API}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(usuario)
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            mensagem.textContent = 'Funcionário cadastrado com sucesso!';
            mensagem.style.color = '#65d98b';

            formCadastro.reset();

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            mensagem.textContent =
                resultado.detail ||
                resultado.erro ||
                'Não foi possível realizar o cadastro.';

            mensagem.style.color = '#ff737d';
        }
    } catch (erro) {
        mensagem.textContent =
            'Não foi possível conectar à API. Verifique se ela está funcionando.';

        mensagem.style.color = '#ff737d';
    } finally {
        botaoCadastrar.disabled = false;
        botaoCadastrar.textContent = 'Criar minha conta';
    }
});
