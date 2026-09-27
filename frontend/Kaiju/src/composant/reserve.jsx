import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, hasRole } from '../utileDb/auth.jsx';
import { getDisasterLevel, getQuarterStock } from '../utileDb/quarter.jsx';
import { createReservation } from '../utileDb/reserve.jsx';
import './reserve.css';

const NIVEAU_MIN_RESERVATION = 2;

export function Reserve() {
  const user = getCurrentUser();
  const estQC = hasRole('QC');

  const [niveau, setNiveau] = useState(1);
  const [stock, setStock] = useState([]);
  const [resourceTypeId, setResourceTypeId] = useState('');
  const [quantite, setQuantite] = useState('');
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const charger = useCallback(() => {
    if (!user?.quarterId) {
      setChargement(false);
      return;
    }
    setErreur('');
    Promise.all([getDisasterLevel(), getQuarterStock(user.quarterId)])
      .then(([niveauData, stockData]) => {
        setNiveau(niveauData.level);
        setStock(stockData);
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, [user?.quarterId]);

  useEffect(() => {
    charger();
  }, [charger]);

  const ressourcesDisponibles = stock.filter((r) => r.currentQuantity > r.retentionMin);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setSucces('');

    if (!resourceTypeId || !quantite) {
      setErreur('Merci de choisir une ressource et une quantité.');
      return;
    }
    if (Number(quantite) <= 0) {
      setErreur('La quantité doit être supérieure à 0.');
      return;
    }

    setEnCours(true);
    try {
      await createReservation({
        resourceTypeId: Number(resourceTypeId),
        quantity: Number(quantite),
      });
      setSucces('Réservation effectuée.');
      setResourceTypeId('');
      setQuantite('');
      charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(false);
    }
  }

  if (!user?.quarterId || !estQC) {
    return (
      <div className="reserve-panneau">
        <p className="reserve-note">
          Seuls les Quarter Coordinators peuvent réserver des ressources pour leur propre quartier.
        </p>
      </div>
    );
  }

  if (chargement) {
    return (
      <div className="reserve-panneau">
        <p className="reserve-chargement">Chargement...</p>
      </div>
    );
  }

  if (niveau < NIVEAU_MIN_RESERVATION) {
    return (
      <div className="reserve-panneau">
        <p className="reserve-note">
          La réservation de ressources est disponible à partir du niveau de catastrophe {NIVEAU_MIN_RESERVATION}.
          Niveau actuel : {niveau}/5.
        </p>
      </div>
    );
  }

  return (
    <div className="reserve-panneau">
      <h2>Réserver une ressource pour mon quartier</h2>

      <form className="reserve-form" onSubmit={handleSubmit}>
        <div className="reserve-champ">
          <label>Ressource</label>
          <select value={resourceTypeId} onChange={(e) => setResourceTypeId(e.target.value)}>
            <option value="">-- Choisir une ressource --</option>
            {ressourcesDisponibles.length === 0 && (
              <option value="" disabled>Aucune ressource réservable actuellement</option>
            )}
            {ressourcesDisponibles.map((r) => (
              <option key={r.resourceTypeId} value={r.resourceTypeId}>
                {r.resourceName} ({r.currentQuantity - r.retentionMin} disponible{r.currentQuantity - r.retentionMin > 1 ? 's' : ''})
              </option>
            ))}
          </select>
        </div>

        <div className="reserve-champ">
          <label>Quantité</label>
          <input
            type="number"
            min="1"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            disabled={enCours}
          />
        </div>

        {erreur && <p className="reserve-erreur">{erreur}</p>}
        {succes && <p className="reserve-succes">{succes}</p>}

        <button className="reserve-bouton" type="submit" disabled={enCours}>
          {enCours ? 'Réservation...' : 'Réserver'}
        </button>
      </form>

      <div className="reserve-stock">
        <h3>Stock actuel de mon quartier</h3>
        <ul className="reserve-liste-stock">
          {stock.map((r) => (
            <li key={r.resourceTypeId} className={r.currentQuantity <= r.retentionMin ? 'est-critique' : ''}>
              <span>{r.resourceName}</span>
              <span>
                {r.currentQuantity} <small>(seuil min : {r.retentionMin})</small>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
