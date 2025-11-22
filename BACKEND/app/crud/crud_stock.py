from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from typing import Optional
from app.schemas.stock import StockCreate, StockUpdate  # Ajusta si usas también StockUpdate


def create_stock(db: Session, stock: StockCreate) -> Optional[bool]:
    try:
        sentencia = text("""
            INSERT INTO stock (
                unidad_medida, id_produccion, cantidad_disponible
            ) VALUES (
                :unidad_medida, :id_produccion, :cantidad_disponible
            )
        """)
        db.execute(sentencia, stock.model_dump())
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Error de base de datos al crear stock: {e}")

def get_stock_by_id(db: Session, id_producto: int):
    try:
        query = text("""
            SELECT id_producto, unidad_medida, id_produccion, cantidad_disponible
            FROM stock
            WHERE id_producto = :id_producto
        """)
        result = db.execute(query, {"id_producto": id_producto}).mappings().first()
        return result
    except SQLAlchemyError as e:
        raise Exception(f"Error de base de datos al obtener stock por ID: {e}")

def get_all_stock(db: Session):
    try:
        query = text("""
            SELECT id_producto, unidad_medida, id_produccion, cantidad_disponible
            FROM stock
        """)
        result = db.execute(query).mappings().all()
        return result
    except SQLAlchemyError as e:
        raise Exception(f"Error de base de datos al obtener todos los stocks: {e}")

def update_stock_by_id(db: Session, id_producto: int, stock: StockUpdate) -> Optional[bool]:
    try:
        stock_data = stock.model_dump(exclude_unset=True)
        if not stock_data:
            return False
        
        set_clauses = ", ".join([f"{key} = :{key}" for key in stock_data.keys()])
        sentencia = text(f"""
            UPDATE stock
            SET {set_clauses}
            WHERE id_producto = :id_producto
        """)
        stock_data["id_producto"] = id_producto
        result = db.execute(sentencia, stock_data)
        db.commit()
        return result.rowcount > 0
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Error de base de datos al actualizar stock {id_producto}: {e}")
