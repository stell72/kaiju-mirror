import { useState, useEffect, useCallback } from 'react';
import { hasRole } from '../utileDb/auth.jsx';
import { getQuartersQ } from '../utileDb/quarter.jsx';
import { getTransfersEnTransit, approuverTransit } from '../utileDb/nonAdjacent.jsx';
import './nonAdjacent.css';

export function NonAdjacent() {
  const estLC = hasRole('LC', 'CD');

  const [transferts, setTransferts] = useState([]);
  const [quartiersParId, setQuartiersParId] = useState({});
  const [chargement, setChargement] = useState(true);
  const [enCoursId, setEnCoursId] = useState(null);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(() => {
    setErreur('');
    Promise.all([getTransfersEnTransit(), getQuartersQ()])
      .then(([transfertsData, quartiersData]) => {
        setTransferts(transfertsData || []);
        const map = {};
        (quartiersData || []).forEach((q) => { map[q.id] = q.name; });
        setQuartiersParId(map);
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function handleApprouver(id) {
    setErreur('');
    setEnCoursId(id);
    try {
      await approuverTransit(id);
      charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCoursId(null);
    }
  }

  if (!estLC) {
    return (
      <div className="non-adjacent-panneau">
        <p className="non-adjacent-note">
          Seul le Logistics Coordinator (ou le City Director) peut organiser les transferts vers un quartier non adjacent.
        </p>
      </div>
    );
  }

  if (chargement) {
    return (
      <div className="non-adjacent-panneau">
        <p className="non-adjacent-chargement">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="non-adjacent-panneau">
      <h2>Transferts vers un quartier non adjacent</h2>

      {erreur && <p className="non-adjacent-erreur">{erreur}</p>}

      {transferts.length === 0 ? (
        <p className="non-adjacent-vide">Aucun transfert en attente de transit.</p>
      ) : (
        <ul className="non-adjacent-liste">
          {transferts.map((t) => (
            <li key={t.id} className="non-adjacent-carte">
              <div className="non-adjacent-carte-entete">
                <span className="non-adjacent-badge">
                  {t.routeType === 'MARITIME' ? 'Voie maritime' : 'Transit terrestre'}
                </span>
                <span className="non-adjacent-date">
                  {new Date(t.createdAt).toLocaleString('fr-FR')}
                </span>
              </div>

              <p className="non-adjacent-trajet">
                <strong>{t.fromQuarter?.name}</strong> → via{' '}
                <strong>{quartiersParId[t.transitQuarterId] || '—'}</strong> →{' '}
                <strong>{t.toQuarter?.name}</strong>
              </p>

              <p className="non-adjacent-detail">
                <strong>{t.quantity}</strong> × {t.resourceType?.name}
              </p>

              <button
                className="non-adjacent-bouton"
                disabled={enCoursId === t.id}
                onClick={() => handleApprouver(t.id)}
              >
                {enCoursId === t.id ? 'Validation...' : 'Approuver le transit'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}