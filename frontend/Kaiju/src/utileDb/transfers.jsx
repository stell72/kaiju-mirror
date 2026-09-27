import api from "./api";


function handleError(error, fallback) {
    if (error.response) {
        throw new Error(error.response.data.message || fallback);
    }
    throw new Error('Impossible de contacter le serveur.');
}

export async function getTransfers(filters = {}) {
    try {
        const response = await api.get('/transfers', { params: filters });
        return response.data;
    } catch (error) {
        handleError(error, 'Erreur lors du chargement des commandes.');
    }
}

export async function createTransfers({ resourceTypeId, quantite, quartierCibleId, quartierDemandeurId, scheduledStartAt }) {
    const payload = {
        fromQuarterId: quartierCibleId,
        toQuarterId: quartierDemandeurId,
        resourceTypeId,
        quantity: quantite,
        scheduledStartAt,
    };

    try {
        const response = await api.post('/transfers/request-transfer', payload);
        return response.data;
    } catch (error) {
        handleError(error, "Erreur lors de l'envoi de la commande.");
    }
}

export async function valideTransfers(id) {
    try {
        const response = await api.patch(`/transfers/${id}/approve`, {});
        return response.data;
    } catch (error) {
        handleError(error, 'Erreur lors de la validation de la commande.');
    }
}

export async function refuseTransfers(id, reason) {
    try {
        const response = await api.patch(`/transfers/${id}/reject-transfer`, { reason });
        return response.data;
    } catch (error) {
        handleError(error, 'Erreur lors du refus de la commande.');
    }
}

export async function approuverTransit(id) {
    try {
        const response = await api.patch(`/transfers/${id}/approve-transit`, {});
        return response.data;
    } catch (error) {
        handleError(error, 'Erreur lors de la validation du transit.');
    }
}