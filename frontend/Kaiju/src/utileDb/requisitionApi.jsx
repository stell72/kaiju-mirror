import api from "./api";

export async function getQuartiers() {
  const response = await api.get("/quarters");
  return response.data;
}

export async function getTypesRessources() {
  const response = await api.get("/resource-types");
  return response.data;
}


export async function demanderRequisition({ fromQuarterId, toQuarterId, resourceTypeId, quantity }) {
  try {
    const response = await api.post("/requisition", {
      fromQuarterId,
      toQuarterId,
      resourceTypeId,
      quantity,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      const { code, message } = error.response.data || {};
      const err = new Error(message || "La réquisition a échoué.");
      err.code = code;
      err.status = error.response.status;
      throw err;
    }
    throw new Error("Impossible de contacter le serveur");
  }
}
