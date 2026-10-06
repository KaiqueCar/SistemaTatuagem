from fastapi import APIRouter
from pydantic import BaseModel
from database import conectar

router = APIRouter()

class Senioridade(BaseModel):
    nome: str

@router.get("/senioridade")
def listar_senioridade():
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM senioridade")
    senioridades = cursor.fetchall()

    conn.close()
    return senioridades

@router.get("/senioridade/{id}")
def buscar_senioridade(id: int):
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM senioridade WHERE idsenioridade = %s",
        (id,)
    )

    senioridade = cursor.fetchone()

    conn.close()

    if not senioridade:
        return {"erro": "Senioridade não encontrada"}

    return senioridade

@router.post("/senioridade")
def criar_senioridade(senioridade: Senioridade):
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO senioridade (nome) VALUES (%s)",
        (senioridade.nome,)
    )

    conn.commit()
    conn.close()

    return {"mensagem": "Senioridade cadastrada com sucesso"}

@router.put("/senioridade/{id}")
def atualizar_senioridade(id: int, senioridade: Senioridade):
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE senioridade SET nome=%s WHERE idsenioridade=%s",
        (senioridade.nome, id)
    )

    conn.commit()
    conn.close()

    return {"mensagem": "Senioridade atualizada com sucesso"}

@router.delete("/senioridade/{id}")
def deletar_senioridade(id: int):
    conn = conectar()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "DELETE FROM senioridade WHERE idsenioridade = %s",
            (id,)
        )

        conn.commit()
        conn.close()

        return {"mensagem": "Senioridade deletada com sucesso"}

    except Exception:
        conn.rollback()
        conn.close()

        return {
            "erro": "Não foi possível excluir esta senioridade. "
                    "Verifique se ela está sendo usada por algum tatuador."
        }