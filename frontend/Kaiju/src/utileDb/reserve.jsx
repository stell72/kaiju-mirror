import api from "./api";

function handleError(error, fallback) {
  if (error.response) {
    throw new Error(error.response.data.message || fallback);
  }
  throw new Error('Impossible de contacter le serveur.');
}


export async function createReservation({ resourceTypeId, quantity }) {
  try {
    const response = await api.post('/reservation', { resourceTypeId, quantity });
    return response.data;
  } catch (error) {
    handleError(error, 'Erreur lors de la réservation.');
  }
}
