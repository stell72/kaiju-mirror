import api from "./api";

function handleError(error, fallback) {
  if (error.response) {
    throw new Error(error.response.data.message || fallback);
  }
  throw new Error('Impossible de contacter le serveur.');
}

export async function lowerRetention(quarterId, resourceTypeId, percent) {
  try {
    const response = await api.patch(
      `/retention/${quarterId}/stock/${resourceTypeId}/retention`,
      { percent }
    );
    return response.data;
  } catch (error) {
    handleError(error, 'Erreur lors de la mise à jour du seuil de rétention.');
  }
}