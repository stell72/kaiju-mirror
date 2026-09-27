import api from "./api";

export async function getResourceR() {
    try {
        const response = await api.get('/resource-types');
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Erreur lors du chargement des ressources.');
        }
        throw new Error('Impossible de contacter le serveur.');
    }
}