import api from "./api";

export async function getQuartersQ() {
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

export async function getQuartiersAdjacents(quarterId) {
    try {
        const response = await api.get(`/quarters/${quarterId}/adjacent`);
        return response.data.map((q) => ({
            id: q.quarterId,
            code: q.code,
            name: q.name,
            routeType: q.routeType,
        }));
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Erreur de chargement des quartiers adjacents.');
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

export async function updateDisasterLevel(level, reason) {
    try {
        const response = await api.post('/disaster-level/update_level', { level, reason });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Erreur lors de la mise à jour du niveau.');
        }
        throw new Error('Impossible de contacter le serveur.');
    }
}

export async function getDisasterLevelHistory() {
    try {
        const response = await api.get('/disaster-level/history');
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.message || "Erreur lors du chargement de l'historique.");
        }
        throw new Error('Impossible de contacter le serveur.');
    }
}

export async function getMapData() {
    const [quarters, disasterLevel] = await Promise.all([
        getQuartersQ(),
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