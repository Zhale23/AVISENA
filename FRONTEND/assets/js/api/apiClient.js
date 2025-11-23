import { request } from './apiclient.js';

export const userService = {
    async getUsers() {
        try {
            console.log('🔍 [userService] Iniciando getUsers...');
            
            // Verificar si hay token
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }
            
            console.log('🔍 [userService] Token encontrado, haciendo request...');
            
            const response = await request('/users/get-by-centro?centro_id=1');
            
            // Validar que la respuesta no sea undefined
            if (response === undefined || response === null) {
                throw new Error('Respuesta undefined del servidor');
            }
            
            console.log('✅ [userService] Respuesta exitosa:', typeof response, response);
            return response;
            
        } catch (error) {
            console.error('❌ [userService] Error crítico en getUsers:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            
            // Mostrar alerta al usuario
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de conexión',
                    text: 'No se pudieron cargar los usuarios. Verifique la conexión.',
                    confirmButtonColor: '#d33'
                });
            }
            
            throw error;
        }
    },

    async getUsersByCentro(centroId) {
        try {
            if (!centroId) {
                throw new Error('centroId es requerido');
            }

            const response = await request(`/users/get-by-centro?centro_id=${centroId}`);
            
            // Validar respuesta
            if (response === undefined) {
                console.warn('⚠️ Respuesta undefined, retornando array vacío');
                return [];
            }
            
            return response;
            
        } catch (error) {
            console.error(`Error en getUsersByCentro(${centroId}):`, error);
            
            // En caso de error, retornar array vacío para que la UI no se rompa
            return [];
        }
    }
};

export default userService;
