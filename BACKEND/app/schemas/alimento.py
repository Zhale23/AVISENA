from pydantic import BaseModel, Field

class AlimentoBase(BaseModel):
    nombre: str  
  
class AlimentoCreate(AlimentoBase):
    pass

class AlimentoUpdate(BaseModel):
    nombre: str  
    
class AlimentoOut(AlimentoBase):
    id_alimento: int
