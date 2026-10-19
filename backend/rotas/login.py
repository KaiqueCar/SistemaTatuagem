
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
from database import conectar
from dotenv import load_dotenv
import bcrypt
import jwt
import os

load_dotenv()

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
            "SELECT * FROM usuario WHERE email = %s",
            (dados.email,)
        )

        usuario = cursor.fetchone()

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Erro ao consultar o usuário no banco de dados."
        )

    finally:
        if conn:
            conn.close()

    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha inválidos."
        )

    senha_confere = bcrypt.checkpw(
        dados.senha.encode("utf-8"),
        usuario["senha"].encode("utf-8")
    )

    if not senha_confere:
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha inválidos."
        )

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

    return {
        "access_token": token,
        "token_type": "bearer"
    }
