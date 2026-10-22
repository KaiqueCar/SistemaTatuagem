
from fastapi import APIRouter, HTTPException, Depends
from seguranca import verificar_admin
from pydantic import BaseModel, EmailStr
from database import conectar
import bcrypt

router = APIRouter()


class Usuario(BaseModel):
    nome: str
    email: EmailStr
    senha: str


@router.post("", dependencies=[Depends(verificar_admin)])
def criar_usuario(usuario: Usuario):
    senha_hash = bcrypt.hashpw(
        usuario.senha.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    conn = None

    try:
        conn = conectar()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO usuario (nome, email, senha)
            VALUES (%s, %s, %s)
            """,
            (usuario.nome, usuario.email, senha_hash)
        )

        conn.commit()
        return {"mensagem": "Usuário cadastrado com sucesso"}

    except Exception as erro:
        if conn:
            conn.rollback()

        mensagem = str(erro).lower()

        if "duplicate" in mensagem or "1062" in mensagem:
            raise HTTPException(
                status_code=409,
                detail="Este e-mail já está cadastrado."
            )

        raise HTTPException(
            status_code=500,
            detail="Não foi possível cadastrar o usuário."
        )

    finally:
        if conn:
            conn.close()
