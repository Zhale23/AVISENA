from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from typing import Optional
import logging

from app.schemas.sheds import ShedCreate, ShedUpdate

logger = logging.getLogger(__name__)

def create_shed(db: Session, shed: ShedCreate) -> Optional[bool]:
    try:
        sentencia = text("""
            INSERT INTO galpones (
                id_finca, nombre,
                capacidad, cant_actual,
                estado
            ) VALUES (
                :id_finca, :nombre,
                :capacidad, :cant_actual,
                :estado
            )
        """)
        db.execute(sentencia, shed.model_dump())
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error al crear el galpón: {e}")
        raise Exception("Error de base de datos al crear el galpón")

def get_shed_by_id(db: Session, id: int):
    try:
        query = text("""
                     SELECT id_galpon, id_finca, nombre, capacidad, cant_actual, estado
                     FROM galpones
                     WHERE galpones.id_galpon = :id_galpon
                     """)
        result = db.execute(query, {"id_galpon": id}).mappings().first()
        return result
    except SQLAlchemyError as e:
        logger.error(f"Error al obtener galpón por el id: {e}")
        raise Exception("Error de base de datos al obtener el galpón")
    
def get_all_sheds(db: Session):
    try:
        query = text("""
            SELECT id_galpon, id_finca, nombre,
            capacidad, cant_actual, estado
            FROM galpones
        """)
        result = db.execute(query).mappings().all()
        return result
    except SQLAlchemyError as e:
        logger.error(f"Error al obtener tipos de galpones: {e}")
        raise Exception("Error de base de datos al obtener los galpones")

def update_shed_by_id(db: Session, shed_id: int, shed: ShedUpdate) -> Optional[bool]:
    try:
        shed_data = shed.model_dump(exclude_unset=True)
        if not shed_data:
            return False  # nada que actualizar

        set_clauses = ", ".join([f"{key} = :{key}" for key in shed_data.keys()])
        sentencia = text(f"""
            UPDATE galpones 
            SET {set_clauses}
            WHERE id_galpon = :id_galpon
        """)

        # Agregar el id_galpon
        shed_data["id_galpon"] = shed_id

        result = db.execute(sentencia, shed_data)
        db.commit()

        return result.rowcount > 0
    
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error al actualizar galpón {shed_id}: {e}")
        raise Exception("Error de base de datos al actualizar el galpón")
    
def change_shed_status(db: Session, id_galpon: int, nuevo_estado: bool) -> bool:
    try:
        sentencia = text("""
            UPDATE galpones
            SET estado = :estado
            WHERE id_galpon = :id_galpon
        """)
        result = db.execute(sentencia, {"estado": nuevo_estado, "id_galpon": id_galpon})
        db.commit()

        return result.rowcount > 0

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error al cambiar el estado del galpón {id_galpon}: {e}")
        raise Exception("Error de base de datos al cambiar el estado del galpón")
