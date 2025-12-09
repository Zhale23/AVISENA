from typing import Annotated
from fastapi import APIRouter, Depends,HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.router.dependencies import authenticate_user
from app.schemas.auth import ResponseLoggin
from core.security import create_access_token
from core.database import get_db
from fastapi.security import OAuth2PasswordRequestForm

 
router = APIRouter()

@router.post("/token", response_model=ResponseLoggin)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db)
):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Datos incorrectos en email o password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.estado:
        raise HTTPException(status_code=403, detail="Usuario inactivo, no autorizado")

    # consultar estado del rol (activo o inactivo)
    sentencia = text("""
                    SELECT estado
                    FROM roles
                    WHERE id_rol = :rol 
                    """)
    res = db.execute(sentencia, {"rol": user.id_rol}).mappings().first()
    
    if not res:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    # Si el estado del rol es inactivo
    if res['estado'] == 0:
        raise HTTPException(status_code=401, detail="Rol inactivo")


    data={"sub": str(user.id_usuario), "rol":user.id_rol}
    access_token = create_access_token(data)   

    return ResponseLoggin(

        user=user,
        access_token=access_token
    )
