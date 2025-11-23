// Este archivo tendrá una única función request que se encargará de todo el trabajo estandar: 
// añadir la URL base, poner el token, y manejar los errores 401. Esto evita repetir código en cada servicio.

// Importamos las dependencias necesarias
import { authService } from './auth.service.js';

// Configuración de la URL base - IMPORTANTE: Cambiar a HTTPS para producción
const API_BASE_URL = 'http://avisenabackend.20.168.14.245.sslip.io:10000';
// Para producción en Render, necesitarías:
// const API_BASE_URL = 'https://tu-backend-con-ssl.com';

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
        const response = await fetch(url, { 
            ...options, 
            headers,
            // Añadir mode 'cors' para mejor manejo de CORS
            mode: 'cors',
            credentials: 'omit'
        });

        // Manejo centralizado del error 401 (No autorizado)
        if (response.status === 401) {
            await Swal.fire({
                icon: 'error',
                title: 'Sesión expirada',
                text: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
                confirmButtonColor: '#d33'
            });
            authService.logout();
            return Promise.reject(new Error('Sesión expirada.'));
        }

        // Manejo del error 403 (Prohibido)
        if (response.status === 403) {
            await Swal.fire({
                icon: 'error',
                title: 'Acceso denegado',
                text: 'No tiene permisos para realizar esta acción.',
                confirmButtonColor: '#d33'
            });
            return Promise.reject(new Error('Acceso denegado.'));
        }

        // Si la respuesta no es exitosa, manejamos el error
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = { 
                    detail: `Error ${response.status}: ${response.statusText}` 
                };
            }
            throw new Error(errorData.detail || 'Ocurrió un error en la petición.');
        }
        
        // Si la respuesta no tiene contenido (ej. status 204), devolvemos un objeto vacío.
        return response.status === 204 ? {} : await response.json();

    } catch (error) {
        console.error(`Error en la petición a ${endpoint}:`, error);
        
        // Mostrar alerta para errores de red/CORS
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            await Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor. Verifique su conexión o contacte al administrador.',
                confirmButtonColor: '#d33'
            });
        }
        
        throw error;
    }
}

// Exportación por defecto para facilitar la importación
export default { request };
