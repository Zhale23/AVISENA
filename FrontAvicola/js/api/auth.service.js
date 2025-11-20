// Este servicio NO usará nuestro apiClient 'request' porque el login es especial (x-www-form-urlencoded)
// y no necesita token.

export const authService = {
    loginUser: async (username, password) => {
        // La lógica de login se queda igual, ya que es un caso único.
        const url = 'https://backendfastapi-1-1nm3.onrender.com/access/token';
        const body = new URLSearchParams({
            username,
            password,
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Usuario o contraseña incorrectos.' }));
            throw new Error(errorData.detail);
        }
        return await response.json();
    },

    logout: () => {
        console.log('Cerrando sesión...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/authentication-login.html';
    },
};