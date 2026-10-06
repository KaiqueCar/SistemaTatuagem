from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from database import conectar

router = APIRouter()


class Tatuador(BaseModel):
    nometatuador: str
    cpf: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    datacontratacao: Optional[str] = None
    idsenioridade: int


@router.get("/tatuadores")
def listar_tatuadores():
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT tatuador.*, senioridade.nome AS senioridade
        FROM tatuador
        JOIN senioridade
            ON tatuador.idsenioridade = senioridade.idsenioridade
    """)

    tatuadores = cursor.fetchall()

    conn.close()

    return tatuadores


@router.get("/tatuadores/{id}")
def buscar_tatuador(id: int):
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM tatuador WHERE idtatuador = %s",
        (id,)
    )

    tatuador = cursor.fetchone()

    conn.close()

    if not tatuador:
        return {"erro": "Tatuador não encontrado"}

    return tatuador


@router.post("/tatuadores")
def criar_tatuador(tatuador: Tatuador):
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """INSERT INTO tatuador
        (nometatuador, cpf, email, telefone, datacontratacao, idsenioridade)
        VALUES (%s, %s, %s, %s, %s, %s)""",
        (
            tatuador.nometatuador,
            tatuador.cpf,
            tatuador.email,
            tatuador.telefone,
            tatuador.datacontratacao,
            tatuador.idsenioridade
        )
    )

    conn.commit()
    conn.close()

    return {"mensagem": "Tatuador cadastrado com sucesso"}


@router.put("/tatuadores/{id}")
def atualizar_tatuador(id: int, tatuador: Tatuador):
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """UPDATE tatuador
        SET nometatuador=%s,
            cpf=%s,
            email=%s,
            telefone=%s,
            datacontratacao=%s,
            idsenioridade=%s
        WHERE idtatuador=%s""",
        (
            tatuador.nometatuador,
            tatuador.cpf,
            tatuador.email,
            tatuador.telefone,
            tatuador.datacontratacao,
            tatuador.idsenioridade,
            id
        )
    )

    conn.commit()
    conn.close()

    return {"mensagem": "Tatuador atualizado com sucesso"}


@router.delete("/tatuadores/{id}")
def deletar_tatuador(id: int):
    conn = conectar()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "DELETE FROM tatuador WHERE idtatuador = %s",
            (id,)
        )

        conn.commit()
        conn.close()

        return {"mensagem": "Tatuador deletado com sucesso"}

    except Exception:
        conn.rollback()
        conn.close()

        return {
            "erro": "Não foi possível excluir este tatuador. "
                    "Verifique se ele possui agendamentos ou estilos cadastrados."
        }


    