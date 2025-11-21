from core.database import engine
from sqlalchemy import inspect

inspector = inspect(engine)

print("Columnas de la tabla 'registro_sensores':")
columns = inspector.get_columns('registro_sensores')
for col in columns:
    print(f"  - {col['name']} ({col['type']})")

