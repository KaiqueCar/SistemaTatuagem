
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from database import conectar

router = APIRouter()


# Modelo de dados do tatuador
class Tatuador(BaseModel):
    nometatuador: str
    cpf: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    datacontratacao: Optional[str] = None
    idsenioridade: int


# Modelo com os IDs dos estilos selecionados
class EstilosDoTatuador(BaseModel):
    idestilos: List[int]


# GET /tatuadores — lista tatuadores e suas senioridades e estilos
@router.get("")
def listar_tatuadores():
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            tatuador.*,
            senioridade.nome AS senioridade,
            GROUP_CONCAT(
                DISTINCT estilo.descricao
                ORDER BY estilo.descricao
                SEPARATOR ', '
            ) AS estilos
        FROM tatuador
        JOIN senioridade
            ON tatuador.idsenioridade = senioridade.idsenioridade
        LEFT JOIN tatuador_estilo
            ON tatuador.idtatuador = tatuador_estilo.idtatuador
        LEFT JOIN estilo
            ON tatuador_estilo.idestilo = estilo.idestilo
        GROUP BY tatuador.idtatuador
    """)

    tatuadores = cursor.fetchall()
    conn.close()

    return tatuadores


# GET /tatuadores/{id} — busca um tatuador pelo ID
@router.get("/{id}")
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


# POST /tatuadores — cadastra e retorna o ID
@router.post("")
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

    novo_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return {
        "mensagem": "Tatuador cadastrado com sucesso",
        "idtatuador": novo_id
    }


# PUT /tatuadores/{id} — atualiza os dados
@router.put("/{id}")
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


# DELETE /tatuadores/{id} — exclui um tatuador
@router.delete("/{id}")
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


# GET /tatuadores/{id}/estilos — lista os estilos do tatuador
@router.get("/{id}/estilos")
def listar_estilos_do_tatuador(id: int):
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT estilo.idestilo, estilo.descricao
        FROM tatuador_estilo
        JOIN estilo
            ON tatuador_estilo.idestilo = estilo.idestilo
        WHERE tatuador_estilo.idtatuador = %s
    """, (id,))

    estilos = cursor.fetchall()
    conn.close()

    return estilos


# PUT /tatuadores/{id}/estilos — atualiza os estilos do tatuador
@router.put("/{id}/estilos")
def atualizar_estilos_do_tatuador(
    id: int,
    dados: EstilosDoTatuador
):
    conn = conectar()
    cursor = conn.cursor()

    try:
        # Remove as associações anteriores
        cursor.execute(
            "DELETE FROM tatuador_estilo WHERE idtatuador = %s",
            (id,)
        )

        # Insere as novas associações
        for idestilo in dados.idestilos:
            cursor.execute(
                """INSERT INTO tatuador_estilo
                (idtatuador, idestilo, dataestilo)
                VALUES (%s, %s, CURDATE())""",
                (id, idestilo)
            )

        conn.commit()
        conn.close()

        return {"mensagem": "Estilos atualizados com sucesso"}

    except Exception:
        conn.rollback()
        conn.close()

        return {
            "erro": "Não foi possível atualizar os estilos. "
                    "Confira se o tatuador e os estilos existem."
        }
