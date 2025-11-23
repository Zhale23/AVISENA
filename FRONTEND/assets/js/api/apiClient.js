import { authService } from './auth.service.js';

const PROXIES = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?", 
    "https://proxy.cors.sh/",
    "https://noki-cors.herokuapp.com/"
];

const BACKEND_URL = 'http://avisenabackend.20.168.14.245.sslip.io:10000';

export async function request(endpoint, options = {}) {
    const targetUrl = `${BACKEND_URL}${endpoint}`;
    const token = localStorage.getItem('access_token');

    console.log(`🔍 [apiclient] Request a: ${endpoint}`);

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
        // Usar proxies directamente (sin intentar conexión directa)
        const response = await tryWithProxies(targetUrl, fetchOptions);

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
        
        await Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se puede conectar con el servidor. Todos los métodos fallaron.',
            confirmButtonColor: '#d33'
        });
        
        throw error;
    }
}

async function tryWithProxies(url, options) {
    for (let proxy of PROXIES) {
        try {
            const proxyUrl = proxy + encodeURIComponent(url);
            console.log(`🔄 [apiclient] Intentando proxy: ${proxy}`);
            
            const response = await fetch(proxyUrl, options);
            if (response.ok) {
                console.log(`✅ [apiclient] Éxito con proxy: ${proxy}`);
                return response;
            }
        } catch (error) {
            console.log(`❌ [apiclient] Proxy falló: ${proxy}`);
            continue;
        }
    }
    throw new Error('Todos los proxies fallaron');
}

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

export default { request };
