from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.crud.permisos import verify_permissions
from app.router.dependencies import get_current_user
from core.database import get_db
from app.schemas.alimento import AlimentoCreate, AlimentoUpdate, AlimentoOut
from app.crud import alimento as crud_type_alimento
from app.schemas.users import UserOut


router = APIRouter()
modulo = 28

@router.post("/crear", status_code=status.HTTP_201_CREATED)
def create_type_alimento(
    alimento: AlimentoCreate, 
    db: Session = Depends(get_db),
    user_token: UserOut = Depends(get_current_user)
):
    try:
        # El rol de quien usa el endpoint
        id_rol = user_token.id_rol

        if not verify_permissions(db, id_rol, modulo, 'insertar'):
            raise HTTPException(status_code=401, detail="Usuario no autorizado")

        created = crud_type_alimento.create_type_alimento(db, alimento)

        if created is False:
            raise HTTPException(
                status_code=400,
                detail="El tipo de alimento con ese nombre ya existe."
            )

        return {"message": "Registro de tipo de alimento creado correctamente"}

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/by-id", response_model=AlimentoOut)
def get__type_alimento(
    id_alimento: int, 
    db: Session = Depends(get_db),
    user_token: UserOut = Depends(get_current_user)
):
    try:
        # El rol de quien usa el endpoint
        id_rol = user_token.id_rol
        if not verify_permissions(db, id_rol, modulo, 'seleccionar'):
            raise HTTPException(status_code=401, detail="Usuario no autorizado")

        type_alimento = crud_type_alimento.get_type_alimento_by_id(db, id_alimento)
        if not type_alimento:
            raise HTTPException(status_code=404, detail="Tipo de alimento no encontrado")
        return type_alimento
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/all-type-alimentos", response_model=List[AlimentoOut])
def get_type_alimentos(
    db: Session = Depends(get_db),
    user_token: UserOut = Depends(get_current_user)
):
    try:
        id_rol = user_token.id_rol  # El rol del usuario actual

        if not verify_permissions(db, id_rol, modulo, 'seleccionar'):
            raise HTTPException(status_code=401, detail="Usuario no autorizado")
        
        type_alimento = crud_type_alimento.get_all_type_alimentos(db)
        if not type_alimento:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        return type_alimento
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/by-id/{id_alimento}")
def update_alimento(
    id_alimento: int, 
    type_alimento: AlimentoUpdate, 
    db: Session = Depends(get_db),
    user_token: UserOut = Depends(get_current_user)
):
    try:
        id_rol = user_token.id_rol  # El rol del usuario actual

        if not verify_permissions(db, id_rol, modulo, 'actualizar'):
            raise HTTPException(status_code=401, detail="Usuario no autorizado")

        success = crud_type_alimento.update_type_alimento_by_id(db, id_alimento, type_alimento)
        if not success:
            raise HTTPException(status_code=400, detail="No se pudo actualizar el registro")
        return {"message": "Registro actualizado correctamente"}
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
