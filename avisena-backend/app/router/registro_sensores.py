from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.crud import registro_sensores as crud_registro
from app.crud.permisos import verify_permissions
from app.router.dependencies import get_current_user
from app.schemas.users import UserOut
from app.schemas.registro_sensores import RegistroSensorCreate, RegistroSensorOut
from core.database import get_db

router = APIRouter()
modulo = 1

# Crear registro de sensor
@router.post("/crear", status_code=status.HTTP_201_CREATED)
def create_registro_sensor(
    registro: RegistroSensorCreate,
    db: Session = Depends(get_db),
    user_token: UserOut = Depends(get_current_user)
):
    try:
        id_rol = user_token.id_rol
        if not verify_permissions(db, id_rol, modulo, "insertar"):
            raise HTTPException(status_code=401, detail="Usuario no autorizado")

        crud_registro.create_registro(db, registro)
        return {"message": "Registro de sensor creado correctamente"}

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# Listar todos los registros
@router.get("/all", response_model=list[RegistroSensorOut])
def get_all_registros_sensor(
    db: Session = Depends(get_db),
    user_token: UserOut = Depends(get_current_user)
):
    try:
        id_rol = user_token.id_rol
        if not verify_permissions(db, id_rol, modulo, "seleccionar"):
            raise HTTPException(status_code=401, detail="Usuario no autorizado")

        registros = crud_registro.get_all_registros(db)
        return registros

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
