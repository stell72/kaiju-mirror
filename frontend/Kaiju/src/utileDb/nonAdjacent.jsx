import api from "./api";

function handleError(error, fallback) {
  if (error.response) {
    throw new Error(error.response.data.message || fallback);
  }
  throw new Error('Impossible de contacter le serveur.');
}

export async function getTransfersEnTransit() {
  try {
    const response = await api.get('/transfers', { params: { status: 'PENDING' } });
    return response.data.filter((t) => t.routeType !== 'DIRECT');
  } catch (error) {
    handleError(error, 'Erreur lors du chargement des transferts en transit.');
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