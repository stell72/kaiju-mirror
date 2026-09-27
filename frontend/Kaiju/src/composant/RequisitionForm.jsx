import { useEffect, useState } from "react";
import { getQuartiers, getTypesRessources, demanderRequisition } from "../utileDb/requisitionApi";
import { hasRole } from "../utileDb/auth";
import "./requisitionForm.css";

const ERROR_MESSAGES = {
  PERMISSION_DENIED: "Requisition requires City Director role at disaster Level 4 or higher.",
  RETENTION_VIOLATION: "This requisition would breach the source quarter's retention minimum.",
  NOT_FOUND: "No matching stock record for one of the selected quarters.",
};

export function RequisitionForm() {
  const [quarters, setQuartiers] = useState([]);
  const [resourceTypes, setResourceTypes] = useState([]);
  const [fromQuarterId, setFromQuarterId] = useState("");
  const [toQuarterId, setToQuarterId] = useState("");
  const [resourceTypeId, setResourceTypeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const isCityDirector = hasRole("CD");

  useEffect(() => {
    async function loadOptions() {
      try {
        const [quartersData, resourceTypesData] = await Promise.all([
          getQuartiers(),
          getTypesRessources(),
        ]);
        setQuartiers(quartersData);
        setResourceTypes(resourceTypesData);
      } catch {
        setLoadError("Could not load quarters or resource types.");
      }
    }
    loadOptions();
  }, []);

  if (!isCityDirector) {
    return (
      <p className="requisition-note" role="alert">
        Requisition is only available to City Director accounts.
      </p>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fromQuarterId || !toQuarterId || !resourceTypeId) {
      setError("Please select a source quarter, destination quarter, and resource type.");
      return;
    }
    if (fromQuarterId === toQuarterId) {
      setError("Source and destination quarters must be different.");
      return;
    }
    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await demanderRequisition({
        fromQuarterId: Number(fromQuarterId),
        toQuarterId: Number(toQuarterId),
        resourceTypeId: Number(resourceTypeId),
        quantity: Number(quantity),
      });
      setSuccess(`Requisition completed — moved ${result.quantity} unit(s).`);
      setQuantity(1);
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="requisition-form" onSubmit={handleSubmit}>
      <p className="requisition-description">
        Déplacer de la marchandise et des ressources entre les quartiers. Limité au niveau d'alerte 4 et plus.
      </p>

      {loadError && <p className="requisition-erreur" role="alert">{loadError}</p>}

      <div className="requisition-champ">
        <label>
          Du quartier
          <select
            value={fromQuarterId}
            onChange={(e) => setFromQuarterId(e.target.value)}
            required
          >
            <option value="">Sélectionner un quartier</option>
            {quarters.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="requisition-champ">
        <label>
          au quartier
          <select
            value={toQuarterId}
            onChange={(e) => setToQuarterId(e.target.value)}
            required
          >
            <option value="">Sélectionner un quartier</option>
            {quarters.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="requisition-champ">
        <label>
          Type de ressource
          <select
            value={resourceTypeId}
            onChange={(e) => setResourceTypeId(e.target.value)}
            required
          >
            <option value="">Sélectionner une ressource</option>
            {resourceTypes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="requisition-champ">
        <label>
          Quantité
          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </label>
      </div>

      {error && <p className="requisition-erreur" role="alert">{error}</p>}
      {success && <p className="requisition-succes" role="status">{success}</p>}

      <button className="requisition-bouton" type="submit" disabled={submitting}>
        {submitting ? "Chargement..." : "Réquisition"}
      </button>
    </form>
  );
}