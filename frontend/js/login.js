
const API = 'http://127.0.0.1:8000';

const formLogin = document.getElementById('form-login');

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dados = {
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value
    };

    try {
        const resposta = await fetch(`${API}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            localStorage.setItem('token', resultado.access_token);
            window.location.href = 'dashboard.html';
        } else {
            alert(
                'Erro ao entrar: ' +
                (resultado.detail || resultado.erro || 'Confira seu e-mail e senha.')
            );
        }
    } catch (erro) {
        alert('Não foi possível conectar à API. Confira se o servidor está ligado.');
        console.error(erro);
    }
});
