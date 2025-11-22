from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class UserBase(BaseModel):
    nombre: str = Field(min_length=3, max_length=70)
    id_rol: int
    email: EmailStr
    # tipo_contrato: str = Field(min_length=6, max_length=50)
    telefono: str = Field(min_length=7, max_length=15)
    documento: str = Field(min_length=8, max_length=20)
    estado: bool

class UserCreate(UserBase):
    pass_hash: str = Field(min_length=8)

class UserUpdate(BaseModel):
    nombre: Optional [str] = Field(default=None,min_length=3, max_length=70)
    email: Optional [EmailStr]=None
    telefono: Optional [str] = Field(default=None, min_length=7, max_length=15)
    documento: Optional [str] = Field(default=None, min_length=8, max_length=20)

class UserEstado(BaseModel):
    estado: Optional[bool] = None

class UserOut(UserBase):
    id_usuario: int
    nombre_rol:str

class PaginatedUsers(BaseModel):
    page: int
    page_size: int
    total_users: int
    users: List[UserOut]
