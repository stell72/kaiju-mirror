import api from "./api";

export async function login(email, password) {
    try {
        const response = await api.post('/auth/login', { email, password });
        const token = response.data.token || response.data.access_token;
        const user = response.data.user;

        if (token) {
            localStorage.setItem('token', token);
        }
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('isAuthenticated', 'true');
        }

        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Erreur de connexion');
        }
        throw new Error('Impossible de contacter le serveur');
    }
}

export function getCurrentUser() {
    const user = localStorage.getItem('user');
    if (!user) return null;
    try {
        return JSON.parse(user);
    } catch {
        return null;
    }
}

export function getToken() {
    return localStorage.getItem('token');
}

export function getRole() {
    return getCurrentUser()?.role || null;
}

export function hasRole(...roles) {
    const role = getRole();
    return role ? roles.includes(role) : false;
}

export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
}