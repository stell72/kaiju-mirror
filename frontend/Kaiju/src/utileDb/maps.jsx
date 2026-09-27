import api from "./api";

export async function getQuarters() {
    try {
        const response = await api.get('/quarters');
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Erreur de chargement des quartiers.');
        }
        throw new Error('Impossible de contacter le serveur.');
    }
}

export async function getQuarterStock(quarterId) {
    try {
        const response = await api.get(`/quarters/${quarterId}/stock`);
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Erreur de chargement du stock.');
        }
        throw new Error('Impossible de contacter le serveur.');
    }
}

export async function getResourceTypes() {
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

export async function getDisasterLevel() {
    try {
        const response = await api.get('/disaster-level/current_level');
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Erreur du chargement du niveau de catastrophe.');
        }
        throw new Error('Impossible de contacter le serveur.');
    }
}

export async function getMapData() {
    const [quarters, disasterLevel] = await Promise.all([
        getQuarters(),
        getDisasterLevel(),
    ]);

    const quartersWithStock = await Promise.all(
        quarters.map(async (quarter) => {
            const stock = await getQuarterStock(quarter.id);
            return { ...quarter, stock };
        })
    );

    return { quarters: quartersWithStock, disasterLevel };
}