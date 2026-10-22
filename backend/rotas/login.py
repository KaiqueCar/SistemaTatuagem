
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
from database import conectar
from dotenv import load_dotenv
import bcrypt
import jwt
import os
import logging

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITMO = "HS256"


class Login(BaseModel):
    email: EmailStr
    senha: str


@router.post("/login")
def fazer_login(dados: Login):
    if not SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="A chave secreta do JWT não está configurada."
        )

    conn = None

    try:
        conn = conectar()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT email, senha, tipo FROM usuario WHERE email = %s",
            (str(dados.email),)
        )

        usuario = cursor.fetchone()

    except Exception:
        logger.exception("Erro ao consultar usuário no banco de dados")
        raise HTTPException(
            status_code=500,
            detail="Erro ao consultar o usuário no banco de dados."
        )

    finally:
        if conn is not None:
            conn.close()

    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha inválidos."
        )

    try:
        hash_senha = usuario["senha"]

        if isinstance(hash_senha, bytes):
            hash_senha = hash_senha.decode("utf-8")
        elif isinstance(hash_senha, str):
            pass
        else:
            raise ValueError("Formato de hash inesperado")

        senha_confere = bcrypt.checkpw(
            dados.senha.encode("utf-8"),
            hash_senha.encode("utf-8")
        )

    except (ValueError, TypeError, KeyError, UnicodeError):
        logger.exception("Hash de senha inválido ou incompatível")
        raise HTTPException(
            status_code=500,
            detail="Não foi possível validar a senha cadastrada."
        )

    if not senha_confere:
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha inválidos."
        )

    try:
        expira_em = datetime.now(timezone.utc) + timedelta(hours=2)

        payload = {
            "sub": usuario["email"],
            "tipo": usuario["tipo"],
            "exp": expira_em
        }

        token = jwt.encode(
            payload,
            SECRET_KEY,
            algorithm=ALGORITMO
        )

    except Exception:
        logger.exception("Erro ao gerar token JWT")
        raise HTTPException(
            status_code=500,
            detail="Erro ao gerar o token de autenticação."
        )

    return {
        "access_token": token,
        "token_type": "bearer"
    }
