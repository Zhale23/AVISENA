from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional
import logging

from app.schemas.registro_sensores import RegistroSensorCreate

logger = logging.getLogger(__name__)

# Crear registro de sensor
def create_registro(db: Session, registro: RegistroSensorCreate) -> Optional[bool]:
    try:
        query = text("""
            INSERT INTO registro_sensores (id_sensor, dato_sensor, fecha_hora, u_medida)
            VALUES (:id_sensor, :dato_sensor, :fecha_hora, :u_medida)
        """)
        db.execute(query, registro.model_dump())
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error al registrar datos del sensor: {e}")
        raise Exception("Error de base de datos al crear registro de sensor")

# Listar registros con JOIN a sensores
def get_all_registros(db: Session):
    try:
        query = text("""
            SELECT 
                rs.id_registro,
                rs.id_sensor,
                s.nombre AS nombre_sensor,
                rs.dato_sensor,
                rs.fecha_hora,
                rs.u_medida
            FROM registro_sensores rs
            LEFT JOIN sensores s ON rs.id_sensor = s.id_sensor
            ORDER BY rs.fecha_hora DESC
        """)
        result = db.execute(query).mappings().all()
        return result
    except SQLAlchemyError as e:
        logger.error(f"Error al obtener registros de sensores: {e}")
        raise Exception("Error al listar registros de sensores")

