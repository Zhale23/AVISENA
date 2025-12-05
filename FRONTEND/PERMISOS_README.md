# Sistema Simple de Permisos

## Cómo Funciona

### 1. Menú Dinámico (index.html)

Al cargar la página, un script revisa el rol del usuario y oculta las opciones del menú a las que no tiene acceso.

**Roles:**

- **SuperAdmin**: Ve TODO
- **Administrador**: Ve TODO (menos puede crear/editar superadmins)
- **Supervisor**: Ve 10 módulos específicos
- **Operario**: Ve 10 módulos específicos

### 2. Botones por Página (permisos.js)

Cuando se carga una página, el sistema oculta botones de crear/editar/eliminar según el rol:

**SuperAdmin**: Puede hacer TODO en todos los módulos

**Administrador**: Puede hacer TODO excepto:

- No puede crear/editar usuarios con rol superadmin

**Supervisor**:

- Tareas: CRUD completo
- Incidentes: CRUD completo
- Inventario: Crear y Editar (NO eliminar)
- Sensores: Crear y Editar (NO eliminar)
- Tipos Gallinas: Crear y Editar (NO eliminar)
- Salvamento: Crear y Editar (NO eliminar)
- Gallinas: Crear y Editar (NO eliminar)
- Incidentes Gallina: Crear y Editar (NO eliminar)
- Producción Huevos: Crear y Editar (NO eliminar)
- Stock: Crear y Editar (NO eliminar)

**Operario**:

- Tareas: Solo Editar
- Galpones: Solo Ver
- Incidentes: Solo Editar
- Inventario: Solo Ver
- Tipos Gallinas: Solo Ver
- Salvamento: Crear y Editar (NO eliminar)
- Gallinas: Crear y Editar (NO eliminar)
- Incidentes Gallina: Crear y Editar (NO eliminar)
- Producción Huevos: Crear y Editar (NO eliminar)
- Stock: Solo Crear y Ver

## Archivos Modificados

1. **index.html** - Script inline al final que oculta opciones del menú
2. **permisos.js** - Función simple que oculta botones según rol
3. **main.js** - Llama a `aplicarPermisos()` después de cargar cada página

## Cómo Funciona Internamente

1. Usuario inicia sesión → Se guarda `user` con `nombre_rol` en localStorage
2. Al cargar index.html → Script lee el rol y oculta items del menú con `display: none`
3. Al cargar una página → `main.js` llama a `aplicarPermisos(nombrePagina)`
4. `aplicarPermisos()` busca botones con data-action o clases específicas y los oculta

## Agregar Nuevos Módulos

En `permisos.js`, agregar el módulo en cada rol:

```javascript
supervisor: {
    nuevo_modulo: { crear: true, editar: true, eliminar: false }
}
```

En el script de index.html, agregar el módulo a los arrays:

```javascript
const permisos = {
    supervisor: [..., 'nuevo_modulo']
}
```

## Notas

- Es un sistema SIMPLE, sin consultas a BD
- Los permisos están hard-coded en el JS
- Para cambiar permisos, editar directamente los objetos en el código
