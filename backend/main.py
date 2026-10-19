
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from rotas.rotas import clientes
from rotas import (
    login,
    usuarios,
    senioridade,
    estilos,
    tatuadores,
    agendamentos
)

import os

app = FastAPI(
    title="SistemaTatuagem API",
    description="API de gerenciamento do estúdio de tatuagem"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

# Login e cadastro primeiro na documentação
app.include_router(
    login.router,
    tags=["Login"]
)

app.include_router(
    usuarios.router,
    prefix="/usuarios",
    tags=["Usuários"]
)

# Demais rotas
app.include_router(
    clientes.router,
    prefix="/clientes",
    tags=["Clientes"]
)

app.include_router(
    senioridade.router,
    prefix="/senioridade",
    tags=["Senioridade"]
)

app.include_router(
    estilos.router,
    prefix="/estilos",
    tags=["Estilos"]
)

app.include_router(
    tatuadores.router,
    prefix="/tatuadores",
    tags=["Tatuadores"]
)

app.include_router(
    agendamentos.router,
    prefix="/agendamentos",
    tags=["Agendamentos"]
)


@app.get("/")
def inicio():
    return {
        "mensagem": "API do estúdio de tatuagem funcionando!"
    }
