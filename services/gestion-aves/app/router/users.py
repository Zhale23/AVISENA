from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.params import Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.crud.permisos import verify_permissions
from app.router.dependencies import get_current_user
from core.database import get_db
from app.schemas.users import UserCreate, UserOut, UserUpdate
from app.crud import users as crud_users

router = APIRouter()
modulo = 1

@router.post("/crear", status_code=status.HTTP_201_CREATED)
def create_user(
    user: UserCreate, 
    db: Session = Depends(get_db),
    user_token: UserOut = Depends(get_current_user)
):
    try:
        # El rol de quien usa el endpoint
        id_rol = user_token.id_rol

        if (user.id_rol == 1 or user.id_rol == 2):
            modulo = 2
        else:
            modulo = 1

        if not verify_permissions(db, id_rol, modulo, 'insertar'):
            raise HTTPException(status_code=401, detail="Usuario no autorizado")

        crud_users.create_user(db, user)
        return {"message": "Usuario creado correctamente"}

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-email", response_model=UserOut)
def get_user(
    email: str, 
    db: Session = Depends(get_db),
    user_token: UserOut = Depends(get_current_user)
):
    try:
        # El rol de quien usa el endpoint
        id_rol = user_token.id_rol

        if not email == user_token.email:
            if not verify_permissions(db, id_rol, modulo, 'seleccionar'):
                raise HTTPException(status_code=401, detail="Usuario no autorizado")

        user = crud_users.get_user_by_email(db, email)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return user
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/all-except-admins", response_model=List[UserOut])
def get_users(
    db: Session = Depends(get_db),
    user_token: UserOut = Depends(get_current_user)
):
    try:
        id_rol = user_token.id_rol  # El rol del usuario actual

        if not verify_permissions(db, id_rol, modulo, 'seleccionar'):
            raise HTTPException(status_code=401, detail="Usuario no autorizado")
        
        users = crud_users.get_all_user_except_admins(db)
        if not users:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return users

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/by-id/{user_id}")
def update_user(
    user_id: int, 
    user: UserUpdate, 
    db: Session = Depends(get_db),
    user_token: UserOut = Depends(get_current_user)
):
    try:
        success = crud_users.update_user_by_id(db, user_id, user)
        if not success:
            raise HTTPException(status_code=400, detail="No se pudo actualizar el usuario")
        return {"message": "Usuario actualizado correctamente"}
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/all-except-admins-pag", response_model=dict)
def get_users_pag(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    try:
        skip = (page - 1) * page_size
        data = crud_users.get_all_user_except_admins_pag(db, skip=skip, limit=page_size)
        
        total = data['total']
        users = data['users']
        
        return {
            'page': page,
            'page_size': page_size,
            'total_users': total,
            'total_pages': (total + page_size - 1) // page_size,
            'users': users
        }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))