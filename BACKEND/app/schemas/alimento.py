from datetime import date
from typing import Optional
from pydantic import BaseModel

class AlimentoBase(BaseModel):
    nombre: str
    cantidad: int
    fecha_ingreso: date
  
class AlimentoCreate(AlimentoBase):
    pass

class AlimentoUpdate(BaseModel):
    nombre: Optional[str] = None
    cantidad: Optional[int] = None
    fecha_ingreso: Optional[date] = None
    
class AlimentoOut(AlimentoBase):
    id_alimento: int
