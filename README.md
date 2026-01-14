# AVISENA

Sistema integral de gestión y monitoreo para granjas avícolas que proporciona control en tiempo real de operaciones, producción y bienestar animal.

## Descripción General

AVISENA es una plataforma web completa diseñada para la administración eficiente de granjas avícolas. El sistema integra múltiples módulos que permiten el seguimiento de inventarios, monitoreo ambiental, gestión de personal, control de producción de huevos y análisis de datos en tiempo real.

## Arquitectura del Sistema

### Backend

API RESTful construida con **FastAPI** y **Python 3.11**, implementando una arquitectura modular basada en microservicios. 

**Tecnologías principales:**
- FastAPI para endpoints REST
- SQLAlchemy como ORM
- MySQL/MariaDB como base de datos
- JWT para autenticación y autorización
- Uvicorn/Gunicorn para servidor ASGI

**Estructura modular:**
```
BACKEND/
├── main.py                 # Punto de entrada de la aplicación
├── core/
│   ├── config.py          # Configuración general y variables de entorno
│   ├── database.py        # Conexión a base de datos
│   └── email. py           # Servicios de correo electrónico
├── app/
│   ├── router/            # Endpoints REST organizados por módulo
│   ├── crud/              # Lógica de acceso a datos
│   ├── schemas/           # Modelos Pydantic para validación
│   └── models/            # Modelos SQLAlchemy
└── services/              # Microservicios especializados
    ├── gestion-aves/
    ├── infra-monitoreo/
    ├── produccion-stock/
    └── seguridad-ventas/
```

### Frontend

Interfaz de usuario responsiva desarrollada con tecnologías web modernas. 

**Tecnologías principales:**
- HTML5 y CSS3/SCSS
- JavaScript modular (ES6+)
- Bootstrap 5 para diseño responsivo
- Chart.js para visualización de datos
- Font Awesome y Bootstrap Icons

**Características:**
- Diseño adaptable a dispositivos móviles
- Single Page Application (SPA) con carga dinámica de contenido
- Sistema de permisos basado en roles
- Panel de control con métricas en tiempo real

## Módulos Principales

### 1. Gestión de Usuarios y Seguridad

- Sistema de autenticación con JWT
- Gestión de roles y permisos granulares (SuperAdmin, Administrador, Supervisor, Operario)
- Recuperación de contraseña mediante correo electrónico
- Control de acceso basado en módulos y acciones

### 2. Infraestructura y Monitoreo

**Fincas y Galpones:**
- Registro de fincas con geolocalización (latitud/longitud)
- Gestión de galpones con capacidad y estado
- Control de ocupación por instalación

**Sensores Ambientales:**
- Monitoreo de temperatura, humedad, CO2 y luminosidad
- Registro histórico de mediciones
- Alertas configurables por tipo de sensor
- Gestión de tipos de sensores y modelos

**Incidentes Generales:**
- Registro de eventos e incidentes por galpón
- Clasificación por severidad
- Seguimiento temporal de resolución

### 3. Gestión Avícola

**Tipos y Razas:**
- Catálogo de tipos de gallinas (Leghorn, Rhode Island, etc.)
- Registro de características por raza

**Ingreso de Gallinas:**
- Control de ingresos por lote
- Asignación a galpones específicos
- Registro de cantidades y fechas

**Incidentes Específicos:**
- Seguimiento de problemas de salud animal
- Gestión de aislamientos por incidente
- Control de gallinas afectadas

**Salvamento:**
- Registro de gallinas recuperadas
- Seguimiento de tratamientos
- Estadísticas de recuperación

### 4. Producción y Stock

**Producción de Huevos:**
- Registro diario de producción por galpón
- Clasificación por tipo de huevo
- Métricas de rendimiento

**Control de Stock:**
- Inventario en tiempo real
- Gestión de tipos de huevos
- Seguimiento de entradas y salidas

### 5. Ventas y Distribución

- Registro de transacciones
- Métodos de pago configurables
- Detalle de productos vendidos
- Reportes de ventas

### 6. Gestión Operativa

**Tareas:**
- Asignación de tareas a usuarios
- Seguimiento de estado (pendiente, en progreso, completada)
- Filtrado por fechas y responsables

**Inventario General:**
- Gestión de insumos y materiales
- Categorización de productos
- Control de stock mínimo

**Alimentos:**
- Catálogo de tipos de alimento
- Registro de consumo por galpón
- Seguimiento de inventario de alimento

### 7. Dashboard Analítico

Panel de control con visualizaciones en tiempo real: 

- Métricas principales (total gallinas, producción diaria, galpones activos)
- Gráficos de producción semanal comparativa
- Distribución de gallinas por tipo
- Ocupación de galpones
- Incidentes recientes
- Lecturas actuales de sensores
- Registro de actividad reciente

## Sistema de Permisos

El sistema implementa un modelo de permisos basado en roles con cuatro niveles:

### SuperAdmin
- Acceso total al sistema
- Gestión de todos los módulos
- Administración de usuarios y roles

### Administrador
- Acceso completo excepto gestión de SuperAdmins
- CRUD completo en todos los módulos operativos

### Supervisor
- Acceso a 10 módulos específicos
- Permisos de creación y edición (sin eliminación) en inventarios, sensores y tipos
- CRUD completo en tareas, incidentes, gallinas y producción

### Operario
- Acceso restringido a operaciones diarias
- Solo edición en tareas e incidentes
- Solo visualización en galpones e inventarios
- Permisos de creación en salvamentos, gallinas y producción

## Configuración del Entorno

### Requisitos del Sistema

**Backend:**
- Python 3.11 o superior
- MySQL 5.7+ o MariaDB 10.3+
- Servidor SMTP para correos

**Frontend:**
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web (Apache, Nginx) o servidor local

### Variables de Entorno

Crear archivo `.env` en el directorio `BACKEND/`:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=usuario_bd
DB_PASSWORD=contraseña_bd
DB_NAME=avisena

# JWT
JWT_SECRET=clave_secreta_segura
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=correo@ejemplo.com
SMTP_PASSWORD=contraseña_correo
EMAILS_FROM_EMAIL=noreply@avisena.com

# Frontend
FRONTEND_URL=https://avisena.store
```

### Instalación

**1. Backend:**

```bash
cd BACKEND
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**2. Frontend:**

Servir los archivos estáticos desde el directorio `FRONTEND/` usando cualquier servidor web.

### Despliegue con Docker

```bash
cd BACKEND
docker build -t avisena-backend . 
docker run -p 8000:8000 avisena-backend
```

## API Endpoints Principales

### Autenticación
- `POST /access/login` - Iniciar sesión
- `POST /access/reset-password` - Recuperar contraseña
- `POST /access/verify-code` - Verificar código de recuperación

### Usuarios
- `GET /users/all-except-admins` - Listar usuarios
- `POST /users/crear` - Crear usuario
- `PUT /users/by-id/{id}` - Actualizar usuario
- `PUT /users/cambiar-estado/{id}` - Cambiar estado

### Galpones
- `GET /sheds/activos` - Listar galpones activos
- `POST /sheds/crear-galpon` - Crear galpón
- `PUT /sheds/actualizar/{id}` - Actualizar galpón

### Gallinas
- `GET /chickens/by-shed/{id}` - Gallinas por galpón
- `POST /chickens/add` - Registrar ingreso
- `GET /chickens/recent` - Ingresos recientes

### Producción
- `GET /produccion-huevos/all` - Producción total
- `POST /produccion-huevos/crear` - Registrar producción
- `GET /produccion-huevos/by-date-range` - Producción por rango

### Dashboard
- `GET /dashboard/metricas` - Métricas principales
- `GET /dashboard/produccion-semanal` - Gráfico semanal
- `GET /dashboard/ocupacion-galpones` - Ocupación actual
- `GET /dashboard/sensores` - Lecturas de sensores

Para documentación completa de la API:  `http://localhost:8000/docs` (Swagger UI)

## Seguridad

- Autenticación mediante tokens JWT
- Contraseñas hasheadas con bcrypt
- Validación de permisos a nivel de endpoint
- Protección CORS configurada
- Sanitización de entradas
- Recuperación segura de contraseñas con códigos de 6 dígitos

## Créditos

- **Plantilla Frontend**: [Portal Bootstrap Admin Dashboard](https://themes.3rdwavemedia.com/) por Xiaoying Riley
- **Framework Backend**: FastAPI
- **Equipo de Desarrollo**:  ADSO 2925889

## Licencia

La plantilla frontend Portal es gratuita siempre que se mantenga el enlace de atribución en el pie de página.  Para uso sin atribución, consultar licencia comercial.

El código del backend y la lógica de negocio son propiedad del proyecto AVISENA. 

## Documentación Adicional

- [API Dashboard](/BACKEND/API_DASHBOARD_README.md) - Documentación específica del módulo de dashboard
- [Sistema de Permisos](/FRONTEND/PERMISOS_README. md) - Detalle del sistema de roles y permisos
