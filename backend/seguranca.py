
import os

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITMO = "HS256"

esquema_token = HTTPBearer()


def verificar_token(
    credenciais: HTTPAuthorizationCredentials = Depends(esquema_token)
):
    if not SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="A SECRET_KEY não está configurada."
        )

    token = credenciais.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITMO]
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token expirado, faça login de novo."
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Token inválido."
        )



def verificar_admin(payload: dict = Depends(verificar_token)):
    if payload.get("tipo") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Acesso restrito a administradores"
        )
    return payload
