from pydantic import BaseModel
from typing import List, Optional

class ConsumoBase(BaseModel):
    id_alimento: int
    cantidad_alimento: int
    unidad_medida: str
    id_galpon: Optional[int] = None

class ConsumoCreate(ConsumoBase):
    pass

class ConsumoUpdate(BaseModel):
    id_alimento: Optional[int] = None
    cantidad_alimento: Optional[int] = None
    unidad_medida: Optional[str] = None
    id_galpon: Optional[int] = None

class ConsumoOut(ConsumoBase):
    id_consumo: int
    alimento: str
    galpon: Optional[str] = None

class ConsumoPaginated(BaseModel):
    page: int
    page_size: int
    total_record_consumo: int
    total_pages: int
    record_consumo: List[ConsumoOut]