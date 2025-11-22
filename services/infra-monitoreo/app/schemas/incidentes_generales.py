from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class IncidenteGeneralBase(BaseModel):
    descripcion: str = Field(..., min_length=5, max_length=255)
    fecha_hora: datetime
    id_finca: int
    esta_resuelta: bool = Field(default=False)

class IncidenteGeneralCreate(IncidenteGeneralBase):
    pass

class IncidenteGeneralUpdate(BaseModel):
    descripcion: Optional[str] = Field(default=None, min_length=5, max_length=255)
    fecha_hora: Optional[datetime] = None
    id_finca: Optional[int] = None
    esta_resuelta: Optional[bool] = None

class IncidenteGeneralOut(IncidenteGeneralBase):
    id_incidente: int
