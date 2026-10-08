from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from database import conectar

router = APIRouter()

class Agendamento(BaseModel):
    idcliente: int
    idtatuador: int
    dataagendamento: str
    horaagendamento: str
    descricaotatuagem: Optional[str] = None
    valortatuagem: Optional[float] = None
    status: Optional[str] = None
@router.post("/agendamentos")
def criar_agendamento(agendamento: Agendamento):
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """INSERT INTO agendamento
           (idcliente, idtatuador, dataagendamento, horaagendamento,
            descricaotatuagem, valortatuagem)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        (
            agendamento.idcliente,
            agendamento.idtatuador,
            agendamento.dataagendamento,
            agendamento.horaagendamento,
            agendamento.descricaotatuagem,
            agendamento.valortatuagem
        )
    )

    conn.commit()
    conn.close()

    return {"mensagem": "Agendamento cadastrado com sucesso"}


@router.get("/agendamentos")
def listar_agendamentos():
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT agendamento.*,
               cliente.nome AS cliente,
               tatuador.nometatuador AS tatuador
        FROM agendamento
        JOIN cliente
            ON agendamento.idcliente = cliente.idcliente
        JOIN tatuador
            ON agendamento.idtatuador = tatuador.idtatuador
    """)

    agendamentos = cursor.fetchall()
    conn.close()

    for a in agendamentos:
        total_segundos = int(a["horaagendamento"].total_seconds())
        horas, resto = divmod(total_segundos, 3600)
        minutos, segundos = divmod(resto, 60)
        a["horaagendamento"] = f"{horas:02d}:{minutos:02d}:{segundos:02d}"

    return agendamentos


@router.get("/agendamentos/{id}")
def buscar_agendamento(id: int):
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM agendamento WHERE idagendamento = %s",
        (id,)
    )

    agendamento = cursor.fetchone()
    conn.close()

    if not agendamento:
        return {"erro": "Agendamento não encontrado"}

    total_segundos = int(agendamento["horaagendamento"].total_seconds())
    horas, resto = divmod(total_segundos, 3600)
    minutos, segundos = divmod(resto, 60)

    agendamento["horaagendamento"] = f"{horas:02d}:{minutos:02d}:{segundos:02d}"

    return agendamento


@router.put("/agendamentos/{id}")
def atualizar_agendamento(id: int, agendamento: Agendamento):
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        """UPDATE agendamento
           SET idcliente=%s, idtatuador=%s, dataagendamento=%s, horaagendamento=%s,
               descricaotatuagem=%s, valortatuagem=%s, status=%s
           WHERE idagendamento=%s""",
        (
            agendamento.idcliente,
            agendamento.idtatuador,
            agendamento.dataagendamento,
            agendamento.horaagendamento,
            agendamento.descricaotatuagem,
            agendamento.valortatuagem,
            agendamento.status,
            id
        )
    )

    conn.commit()
    conn.close()

    return {"mensagem": "Agendamento atualizado com sucesso"}


@router.delete("/agendamentos/{id}")
def deletar_agendamento(id: int):
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM agendamento WHERE idagendamento = %s",
        (id,)
    )

    conn.commit()
    conn.close()

    return {"mensagem": "Agendamento deletado com sucesso"}


