from unittest import skip
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from typing import Optional
import logging

from app.schemas.users import UserCreate, UserUpdate
from core.security import get_hashed_password

logger = logging.getLogger(__name__)

def create_user(db: Session, user: UserCreate) -> Optional[bool]:
    try:
        pass_encript = get_hashed_password(user.pass_hash)
        user.pass_hash = pass_encript

        sentencia = text("""
            INSERT INTO usuarios (
                nombre, documento, id_rol,
                email, pass_hash,
                telefono, estado
            ) VALUES (
                :nombre, :documento, :id_rol,
                :email, :pass_hash,
                :telefono, :estado
            )
        """)
        db.execute(sentencia, user.model_dump())
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error al crear usuario: {e}")
        raise Exception("Error de base de datos al crear el usuario")


def get_user_by_email_for_login(db: Session, email: str):
    try:
        query = text("""SELECT id_usuario, nombre, documento, usuarios.id_rol, email, telefono, estado, nombre_rol, pass_hash
                     FROM usuarios
                     JOIN roles ON usuarios.id_rol = roles.id_rol 
                     WHERE email = :correo
                """)
        result = db.execute(query, {"correo": email}).mappings().first()
        return result
    except SQLAlchemyError as e:
        logger.error(f"Error al obtener usuario por email: {e}")
        raise Exception("Error de base de datos al obtener el usuario")


def get_user_by_email(db: Session, email: str):
    try:
        query = text("""SELECT id_usuario, nombre, documento, usuarios.id_rol, email, telefono, estado, nombre_rol
                     FROM usuarios
                     JOIN roles ON usuarios.id_rol = roles.id_rol 
                     WHERE email = :correo
                """)
        result = db.execute(query, {"correo": email}).mappings().first()
        return result
    except SQLAlchemyError as e:
        logger.error(f"Error al obtener usuario por email: {e}")
        raise Exception("Error de base de datos al obtener el usuario")


def get_all_user_except_admins(db: Session):
    try:
        query = text("""SELECT id_usuario, nombre, documento, usuarios.id_rol, email, telefono, estado, nombre_rol
                     FROM usuarios
                     JOIN roles ON usuarios.id_rol = roles.id_rol 
                     WHERE usuarios.id_rol NOT IN (1,2)
                """)
        result = db.execute(query).mappings().all()
        return result
    except SQLAlchemyError as e:
        logger.error(f"Error al obtener los usuarios: {e}")
        raise Exception("Error de base de datos al obtener los usuarios")


def update_user_by_id(db: Session, user_id: int, user: UserUpdate) -> Optional[bool]:
    try:
        # Solo los campos enviados por el cliente
        user_data = user.model_dump(exclude_unset=True)
        if not user_data:
            return False  # nada que actualizar


        # Construir dinámicamente la sentencia UPDATE
        set_clauses = ", ".join([f"{key} = :{key}" for key in user_data.keys()])
        sentencia = text(f"""
            UPDATE usuarios 
            SET {set_clauses}
            WHERE id_usuario = :id_usuario
        """)

        # Agregar el id_usuario
        user_data["id_usuario"] = user_id

        result = db.execute(sentencia, user_data)
        db.commit()

        return result.rowcount > 0
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error al actualizar usuario {user_id}: {e}")
        raise Exception("Error de base de datos al actualizar el usuario")


def get_user_by_id(db: Session, id: int):
    try:
        query = text("""SELECT id_usuario, nombre, documento, usuarios.id_rol, email, telefono, estado, nombre_rol
                     FROM usuarios
                     JOIN roles ON usuarios.id_rol = roles.id_rol 
                     WHERE id_usuario = :id_user
                """)
        result = db.execute(query, {"id_user": id}).mappings().first()
        return result
    except SQLAlchemyError as e:
        logger.error(f"Error al obtener usuario por id: {e}")
        raise Exception("Error de base de datos al obtener el usuario")
    
def get_all_user_except_admins_pag(db: Session, skip: int = 0, limit: int = 10):
    """
    Obtiene los usuarios (excepto los administradores) con paginación.
    También realiza una segunda consulta para contar el total de usuarios.
    Compatible con PostgreSQL, MySQL y SQLite.
    """
    try:
        # 1. Contar el total de usuarios excepto los administradores
        count_query = text("""
            SELECT COUNT(id_usuario) AS total 
            FROM usuarios 
            WHERE id_rol NOT IN (1, 2)
        """)
        total_result = db.execute(count_query).scalar()  # <-- le faltaban los paréntesis

        # 2. Consultar usuarios paginados
        data_query = text("""
            SELECT id_usuario, nombre, documento, usuarios.id_rol,
                   email, telefono, estado, nombre_rol
            FROM usuarios
            JOIN roles ON usuarios.id_rol = roles.id_rol
            WHERE usuarios.id_rol NOT IN (1, 2)
            ORDER BY id_usuario
            LIMIT :limit OFFSET :skip
        """)

        result = db.execute(data_query, {'skip': skip, 'limit': limit}).mappings().all()

        # 3. Retornar resultados
        return {
            "total": total_result or 0,
            "users": [dict(row) for row in result]
        }

    except SQLAlchemyError as e:
        logger.error(f"Error al obtener los usuarios: {e}", exc_info=True)
        raise Exception("Error de base de datos al obtener los usuarios")

    
    
    
    