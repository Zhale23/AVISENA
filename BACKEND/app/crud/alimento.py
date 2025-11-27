from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional
import logging

from app.schemas.alimento import AlimentoCreate, AlimentoUpdate, AlimentoOut

logger = logging.getLogger(__name__)

def create_type_alimento(db: Session, alimento: AlimentoCreate) -> Optional[bool]:
    try:
        
        check_query = text("""
            SELECT COUNT(*) AS total
            FROM alimento
            WHERE nombre = :nombre
        """)

        result = db.execute(check_query, {
            "nombre": alimento.nombre
        }).scalar()

        if result > 0:
            return False  # Ya existe, no crear

        # Crear nuevo registro
        insert_query = text("""
            INSERT INTO alimento (nombre)
            VALUES (:nombre)
        """)

        db.execute(insert_query, alimento.model_dump())
        db.commit()

        return True

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error al crear el tipo de alimento: {e}")
        raise Exception("Error de base de datos al crear el tipo de alimento")

def get_type_alimento_by_id(db: Session, id_alimento: int):
    try:
        query = text("""SELECT * FROM alimento
                    WHERE id_alimento = :id_alimento""")
        result = db.execute(query, {"id_alimento": id_alimento}).mappings().first()
        return result
    except SQLAlchemyError as e:
        logger.error(f"Error al obtener el tipo de alimento por id: {e}")
        raise Exception("Error de base de datos al obtener el tipo de alimento")

def get_all_type_alimentos(db: Session):
    try:
        query = text("""SELECT * FROM alimento""")
        result = db.execute(query).mappings().all()
        return result
    except SQLAlchemyError as e:
        logger.error(f"Error al obtener los tipos de alimentos: {e}")
        raise Exception("Error de base de datos al obtener los tipos de alimentos")

def update_type_alimento_by_id(db: Session, id_alimento: int, alimento: AlimentoUpdate) -> Optional[bool]:
    try:
        # Solo los campos enviados por el cliente
        alimento_data = alimento.model_dump(exclude_unset=True)
        if not alimento_data:
            return False  # nada que actualizar

        # Construir dinámicamente la sentencia UPDATE
        set_clauses = ", ".join([f"{key} = :{key}" for key in alimento_data.keys()])
        sentencia = text(f"""
            UPDATE alimento 
            SET {set_clauses}
            WHERE id_alimento = :id_alimento
        """)

        alimento_data["id_alimento"] = id_alimento

        result = db.execute(sentencia, alimento_data)
        db.commit()
        return result.rowcount > 0
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error al actualizar el tipo de alimento {id_alimento}: {e}")
        raise Exception("Error de base de datos al actualizar el tipo de alimento")
    
