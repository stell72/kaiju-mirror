import api from './api.jsx';
import { getToken } from './auth.jsx'; 

function decodeToken() {
    const token = getToken();
    if (!token) return null;
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

export async function getQuarters() {
    const res = await api.get('/quarters');
    return res.data;
}

export async function getQuarterStock(quarterId) {
    const res = await api.get(`/quarters/${quarterId}/stock`);
    return res.data;
}

export async function getStockComplet() {
    const quarters = await getQuarters();

    const parQuartier = await Promise.all(
        quarters.map(async (quarter) => {
            const stock = await getQuarterStock(quarter.id);
            return stock.map((s) => ({
                quartier: quarter.name,
                ressource: s.resourceName,
                quantite: s.currentQuantity,
            }));
        })
    );

    return parQuartier.flat();
}

export async function getStockUtilisateur() {
    const payload = decodeToken();
    const quarterId = payload?.quarterId;

    if (!quarterId) {
        return getStockComplet();
    }

    const quarters = await getQuarters();
    const quarter = quarters.find((q) => q.id === quarterId);
    const stock = await getQuarterStock(quarterId);

    return stock.map((s) => ({
        quartier: quarter ? quarter.name : `Quartier ${quarterId}`,
        ressource: s.resourceName,
        quantite: s.currentQuantity,
    }));
}