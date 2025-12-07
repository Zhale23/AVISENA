// Este archivo tendrá una única función request que se encargará de todo el trabajo estandar: 
// añadir la URL base, poner el token, y manejar los errores 401. Esto evita repetir código en cada servicio.

// La única función que necesitamos importar es la de logout.
// La importamos para usarla en caso de un error 401.
import { authService } from './auth.service.js';

const API_BASE_URL = 'https://api.avisena.store';

/**
 * Cliente central para realizar todas las peticiones a la API.
 * @param {string} endpoint - El endpoint al que se llamará (ej. '/users/get-by-centro').
 * @param {object} [options={}] - Opciones para la petición fetch (method, headers, body).
 * @returns {Promise<any>} - La respuesta de la API en formato JSON.
 */
export async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('access_token');

    // Configuramos las cabeceras por defecto
    const headers = {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        ...options.headers, // Permite sobrescribir o añadir cabeceras
    };

    // Si hay un token, lo añadimos a la cabecera de Authorization
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, { ...options, headers });

        // Manejo de errores 401 (No autorizado) y 403 (Token inválido o expirado)
        if (response.status === 401 || response.status === 403) {

            // Intentamos convertir la respuesta del backend a JSON.
            // Si la respuesta no viene en formato JSON (por ejemplo, viene vacía o viene HTML),
            // evitamos que ocurra un error grave y devolvemos un objeto con un mensaje por defecto.
            const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }));


            // --- Caso 1: El usuario NO tiene permisos para usar este endpoint ---
            //
            // Esto ocurre cuando el backend responde:
            // status: 401
            // detail: "Usuario no autorizado"
            //
            // En este caso: NO cerramos la sesión.
            // Simplemente avisamos al usuario que no tiene permisos
            // y devolvemos un error para que el frontend detenga el proceso.
            if (response.status === 401) {
                await Swal.fire({
                    icon: "warning",
                    title: "Acceso denegado",
                    text: "No tiene permisos para realizar esta acción.",
                    showConfirmButton: false,
                    timer: 1200,
                });
                
                // Rechazamos la promesa con un error para que la función request() termine inmediatamente.
                // Esto es equivalente a un "throw", pero en contexto de promesas.
                return Promise.reject(new Error(errorData.detail));
            }


            // --- Caso 2: El token es inválido o se ha expirado ---
            //
            // Esto cubre:
            // - 403: Token inválido
            // - 401 con detalles diferentes a "Usuario no autorizado"
            //
            // En este caso, SÍ debemos cerrar la sesión porque ya no es válida.
            await Swal.fire({
                icon: "error",
                title: "Sesión expirada",
                text: "Tu sesión ha caducado. Por favor inicia sesión nuevamente.",
            });

            // Eliminamos el token y redirigimos al login.
            authService.logout();

            // Evita que siga ejecutándose el código de request().
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Ocurrió un error en la petición.' }));
            throw new Error(errorData.detail);
        }
        
        // Si la respuesta no tiene contenido (ej. status 204), devolvemos un objeto vacío.
        return response.status === 204 ? {} : await response.json();

    } catch (error) {
        console.error(`Error en la petición a ${endpoint}:`, error);
        throw error;
    }
}
