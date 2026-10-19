
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import conectar
import os

router = APIRouter()

# Pasta onde as imagens serão salvas
PASTA_UPLOADS = "uploads"
os.makedirs(PASTA_UPLOADS, exist_ok=True)


# Modelo dos dados do agendamento
class Agendamento(BaseModel):
    idcliente: int
    idtatuador: int
    dataagendamento: str
    horaagendamento: str
    descricaotatuagem: Optional[str] = None
    valortatuagem: Optional[float] = None
    status: Optional[str] = None


# POST /agendamentos — cadastra um agendamento
@router.post("")
def criar_agendamento(agendamento: Agendamento):
    conn = conectar()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO agendamento (
                idcliente,
                idtatuador,
                dataagendamento,
                horaagendamento,
                descricaotatuagem,
                valortatuagem
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                agendamento.idcliente,
                agendamento.idtatuador,
                agendamento.dataagendamento,
                agendamento.horaagendamento,
                agendamento.descricaotatuagem,
                agendamento.valortatuagem
            )
        )

        novo_id = cursor.lastrowid
        conn.commit()

        return {
            "mensagem": "Agendamento cadastrado com sucesso",
            "idagendamento": novo_id
        }

    finally:
        cursor.close()
        conn.close()


# GET /agendamentos — lista todos os agendamentos
@router.get("")
def listar_agendamentos():
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT
                agendamento.*,
                cliente.nome AS cliente,
                tatuador.nometatuador AS tatuador
            FROM agendamento
            JOIN cliente
                ON agendamento.idcliente = cliente.idcliente
            JOIN tatuador
                ON agendamento.idtatuador = tatuador.idtatuador
            """
        )

        agendamentos = cursor.fetchall()

        for agendamento in agendamentos:
            hora = agendamento["horaagendamento"]

            if hasattr(hora, "total_seconds"):
                total_segundos = int(hora.total_seconds())
                horas, resto = divmod(total_segundos, 3600)
                minutos, segundos = divmod(resto, 60)

                agendamento["horaagendamento"] = (
                    f"{horas:02d}:{minutos:02d}:{segundos:02d}"
                )

        return agendamentos

    finally:
        cursor.close()
        conn.close()


# GET /agendamentos/{id} — busca um agendamento
@router.get("/{id}")
def buscar_agendamento(id: int):
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT * FROM agendamento WHERE idagendamento = %s",
            (id,)
        )

        agendamento = cursor.fetchone()

        if not agendamento:
            raise HTTPException(
                status_code=404,
                detail="Agendamento não encontrado"
            )

        hora = agendamento["horaagendamento"]

        if hasattr(hora, "total_seconds"):
            total_segundos = int(hora.total_seconds())
            horas, resto = divmod(total_segundos, 3600)
            minutos, segundos = divmod(resto, 60)

            agendamento["horaagendamento"] = (
                f"{horas:02d}:{minutos:02d}:{segundos:02d}"
            )

        return agendamento

    finally:
        cursor.close()
        conn.close()


# PUT /agendamentos/{id} — atualiza um agendamento
@router.put("/{id}")
def atualizar_agendamento(id: int, agendamento: Agendamento):
    conn = conectar()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            UPDATE agendamento
            SET
                idcliente = %s,
                idtatuador = %s,
                dataagendamento = %s,
                horaagendamento = %s,
                descricaotatuagem = %s,
                valortatuagem = %s,
                status = %s
            WHERE idagendamento = %s
            """,
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

        if cursor.rowcount == 0:
            cursor.execute(
                "SELECT idagendamento FROM agendamento WHERE idagendamento = %s",
                (id,)
            )

            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Agendamento não encontrado"
                )

        conn.commit()

        return {"mensagem": "Agendamento atualizado com sucesso"}

    finally:
        cursor.close()
        conn.close()


# DELETE /agendamentos/{id} — exclui um agendamento
@router.delete("/{id}")
def deletar_agendamento(id: int):
    conn = conectar()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "DELETE FROM agendamento WHERE idagendamento = %s",
            (id,)
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Agendamento não encontrado"
            )

        conn.commit()

        return {"mensagem": "Agendamento deletado com sucesso"}

    finally:
        cursor.close()
        conn.close()


# POST /agendamentos/{id}/desenho — envia a imagem do desenho
@router.post("/{id}/desenho")
async def upload_desenho(
    id: int,
    arquivo: UploadFile = File(...)
):
    if (
        not arquivo.content_type
        or not arquivo.content_type.startswith("image/")
    ):
        await arquivo.close()
        raise HTTPException(
            status_code=400,
            detail="Envie um arquivo de imagem"
        )

    conn = conectar()
    cursor = conn.cursor()

    try:
        # Verifica se o agendamento existe
        cursor.execute(
            "SELECT idagendamento FROM agendamento WHERE idagendamento = %s",
            (id,)
        )

        if not cursor.fetchone():
            raise HTTPException(
                status_code=404,
                detail="Agendamento não encontrado"
            )

        # Evita caminhos enviados no nome do arquivo
        nome_original = os.path.basename(arquivo.filename or "desenho")

        extensao = os.path.splitext(nome_original)[1].lower()
        nome_arquivo = f"{id}_desenho{extensao}"
        caminho = os.path.join(PASTA_UPLOADS, nome_arquivo)

        conteudo = await arquivo.read()

        if not conteudo:
            raise HTTPException(
                status_code=400,
                detail="O arquivo enviado está vazio"
            )

        with open(caminho, "wb") as imagem:
            imagem.write(conteudo)

        cursor.execute(
            """
            UPDATE agendamento
            SET desenhoaprovado = %s
            WHERE idagendamento = %s
            """,
            (nome_arquivo, id)
        )

        conn.commit()

        return {
            "mensagem": "Desenho enviado com sucesso",
            "arquivo": nome_arquivo,
            "url": f"/uploads/{nome_arquivo}"
        }

    finally:
        cursor.close()
        conn.close()
        await arquivo.close()
