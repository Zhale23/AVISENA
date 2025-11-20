import { authService } from './auth.service.js';

const API_BASE_URL = 'https://backendfastapi-1-1nm3.onrender.com';

export async function request(endpoint, options = {}) {

    // --- 👇 NUEVO: manejo de params ------
    if (options.params) {
        const queryString = new URLSearchParams(
            Object.fromEntries(
                Object.entries(options.params)
                    .filter(([_, v]) => v !== null && v !== undefined)
            )
        ).toString();

        endpoint += `?${queryString}`;
    }
    // --------------------------------------

    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('access_token');

    const headers = {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            alert('No tiene permisos');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Ocurrió un error en la petición.' }));
            throw new Error(errorData.detail);
        }

        return response.status === 204 ? {} : await response.json();

    } catch (error) {
        console.error(`Error en la petición a ${endpoint}:`, error);
        throw error;
    }
}
