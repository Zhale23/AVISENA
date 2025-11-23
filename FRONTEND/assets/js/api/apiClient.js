// Cliente HTTP universal para TODOS los módulos
import { authService } from './auth.service.js';

// Configuración
const API_BASE_URL = 'http://avisenabackend.20.168.14.245.sslip.io:10000';
const PROXIES = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?", 
    "https://proxy.cors.sh/",
    "https://noki-cors.herokuapp.com/"
];

/**
 * Función principal que usan TODOS los módulos
 */
export async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('access_token');

    // Configurar headers
    const headers = {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions = {
        ...options,
        headers,
        mode: 'cors'
    };

    // Convertir body a JSON si es objeto
    if (options.body && typeof options.body === 'object') {
        fetchOptions.body = JSON.stringify(options.body);
    }

    try {
        console.log(`🔍 [apiclient] Request a: ${endpoint}`);
        
        // Intentar conexión directa primero
        let response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
            // Si falla, intentar con proxies
            response = await tryWithProxies(url, fetchOptions);
        }

        // Manejar errores HTTP
        if (response.status === 401 || response.status === 403) {
            await handleAuthError(response.status);
            throw new Error('Error de autenticación');
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.status === 204 ? {} : await response.json();

    } catch (error) {
        console.error(`❌ [apiclient] Error en ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Intentar con diferentes proxies
 */
async function tryWithProxies(url, options) {
    for (let proxy of PROXIES) {
        try {
            const proxyUrl = proxy + encodeURIComponent(url);
            console.log(`🔄 [apiclient] Intentando proxy: ${proxy}`);
            
            const response = await fetch(proxyUrl, options);
            if (response.ok) return response;
        } catch (error) {
            continue;
        }
    }
    throw new Error('Todos los proxies fallaron');
}

/**
 * Manejar errores de autenticación
 */
async function handleAuthError(status) {
    const title = status === 401 ? 'Sesión expirada' : 'Acceso denegado';
    const text = status === 401 
        ? 'Su sesión ha expirada. Por favor, inicie sesión nuevamente.'
        : 'No tiene permisos para realizar esta acción.';

    if (typeof Swal !== 'undefined') {
        await Swal.fire({
            icon: 'error',
            title: title,
            text: text,
            confirmButtonColor: '#d33'
        });
    }
    
    if (authService && authService.logout) {
        authService.logout();
    }
}

// Exportación por defecto
export default { request };
