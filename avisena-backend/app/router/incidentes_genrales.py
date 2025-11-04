from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.crud import incidentes_generales as crud_incidentes
from app.crud.permisos import verify_permissions
from app.router.dependencies import get_current_user
from app.schemas.users import UserOut
from app.schemas.incidentes_generales import (
    IncidenteGeneralCreate, IncidenteGeneralUpdate, IncidenteGeneralOut
)
from core.database import get_db

router = APIRouter()
modulo = 8

# Crear incidente general
@router.post("/crear", status_code=status.HTTP_201_CREATED)
def create_incidente(
    incidente: IncidenteGeneralCreate,
    db: Session = Depends(get_db),
    user_token: UserOut = Depends(get_current_user)
):
    try:
        id_rol = user_token.id_rol
        if not verify_permissions(db, id_rol, modulo, "insertar"):
            raise HTTPException(status_code=401, detail="Usuario no autorizado")

        crud_incidentes.create_incidente(db, incidente)
        return {"message": "Incidente general creado correctamente"}

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# Obtener incidente por ID
@router.get("/by-id/{id_incidente}", response_model=IncidenteGeneralOut)
def get_incidente(
    id_incidente: int,
    db: Session = Depends(get_db),
    user_token: UserOut = Depends(get_current_user)
):
    try:
        id_rol = user_token.id_rol
        if not verify_permissions(db, id_rol, modulo, "seleccionar"):
            raise HTTPException(status_code=401, detail="Usuario no autorizado")

        incidente = crud_incidentes.get_incidente_by_id(db, id_incidente)
        if not incidente:
            raise HTTPException(status_code=404, detail="Incidente no encontrado")
        return incidente

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# Listar todos los incidentes
@router.get("/all", response_model=list[IncidenteGeneralOut])
def get_all_incidentes(
    db: Session = Depends(get_db),
    user_token: UserOut = Depends(get_current_user)
):
    try:
        id_rol = user_token.id_rol
        if not verify_permissions(db, id_rol, modulo, "seleccionar"):
            raise HTTPException(status_code=401, detail="Usuario no autorizado")

        incidentes = crud_incidentes.get_all_incidentes(db)
        return incidentes
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# Actualizar incidente
@router.put("/by-id/{id_incidente}")
def update_incidente(
    id_incidente: int,
    incidente: IncidenteGeneralUpdate,
    db: Session = Depends(get_db),
    user_token: UserOut = Depends(get_current_user)
):
    try:
        id_rol = user_token.id_rol
        if not verify_permissions(db, id_rol, modulo, "actualizar"):
            raise HTTPException(status_code=401, detail="Usuario no autorizado")

        success = crud_incidentes.update_incidente_by_id(db, id_incidente, incidente)
        if not success:
            raise HTTPException(status_code=400, detail="No se pudo actualizar el incidente")

        return {"message": "Incidente actualizado correctamente"}

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# Eliminar incidente
@router.put("/cambiar-estado/{id_incidente}")
def cambiar_estado_incidente_general(
    id_incidente: int,
    db: Session = Depends(get_db),
    user_token: UserOut = Depends(get_current_user)
):
    try:
        id_rol = user_token.id_rol
        if not verify_permissions(db, id_rol, modulo, "actualizar"):
            raise HTTPException(status_code=401, detail="Usuario no autorizado")

        actualizado = crud_incidentes.toggle_estado_incidente(db, id_incidente)
        if not actualizado:
            raise HTTPException(status_code=404, detail="Incidente no encontrado")

        return {"message": "Estado del incidente general cambiado correctamente"}

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


