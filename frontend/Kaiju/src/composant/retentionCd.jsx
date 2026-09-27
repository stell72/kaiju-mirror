import { useState, useEffect, useCallback } from 'react';
import { hasRole } from '../utileDb/auth.jsx';
import { getQuartersQ, getQuarterStock, getDisasterLevel } from '../utileDb/quarter.jsx';
import { lowerRetention } from '../utileDb/retention.jsx';
import './retentionCd.css';

const NIVEAU_MIN_RETENTION = 5;

export function RetentionCD() {
  const estCD = hasRole('CD');

  const [niveau, setNiveau] = useState(1);
  const [quartiers, setQuartiers] = useState([]);
  const [quartierId, setQuartierId] = useState('');
  const [stock, setStock] = useState([]);
  const [pourcentages, setPourcentages] = useState({});
  const [chargement, setChargement] = useState(true);
  const [enCoursId, setEnCoursId] = useState(null);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  useEffect(() => {
    if (!estCD) {
      setChargement(false);
      return;
    }
    setErreur('');
    Promise.all([getDisasterLevel(), getQuartersQ()])
      .then(([niveauData, quartiersData]) => {
        setNiveau(niveauData.level);
        setQuartiers(quartiersData || []);
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, [estCD]);

  const chargerStock = useCallback((id) => {
    if (!id) {
      setStock([]);
      return;
    }
    setErreur('');
    getQuarterStock(id)
      .then(setStock)
      .catch((err) => setErreur(err.message));
  }, []);

  useEffect(() => {
    chargerStock(quartierId ? Number(quartierId) : null);
  }, [quartierId, chargerStock]);

  function handlePourcentageChange(resourceTypeId, value) {
    setPourcentages((prev) => ({ ...prev, [resourceTypeId]: value }));
  }

  async function handleAppliquer(resourceTypeId) {
    setErreur('');
    setSucces('');
    const percent = Number(pourcentages[resourceTypeId]);

    if (Number.isNaN(percent) || percent < 0 || percent > 100) {
      setErreur('Le pourcentage doit être un nombre entre 0 et 100.');
      return;
    }

    setEnCoursId(resourceTypeId);
    try {
      await lowerRetention(Number(quartierId), resourceTypeId, percent);
      setSucces('Seuil de rétention mis à jour.');
      chargerStock(Number(quartierId));
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCoursId(null);
    }
  }

  if (!estCD) {
    return (
      <div className="retention-panneau">
        <p className="retention-note">
          Seul le City Director peut abaisser les seuils de rétention.
        </p>
      </div>
    );
  }

  if (chargement) {
    return (
      <div className="retention-panneau">
        <p className="retention-chargement">Chargement...</p>
      </div>
    );
  }

  if (niveau < NIVEAU_MIN_RETENTION) {
    return (
      <div className="retention-panneau">
        <p className="retention-note">
          L'abaissement des seuils de rétention n'est possible qu'au niveau de catastrophe {NIVEAU_MIN_RETENTION}.
          Niveau actuel : {niveau}/5.
        </p>
      </div>
    );
  }

  return (
    <div className="retention-panneau">
      <h2>Abaisser les seuils de rétention</h2>

      <div className="retention-champ">
        <label>Quartier</label>
        <select value={quartierId} onChange={(e) => setQuartierId(e.target.value)}>
          <option value="">-- Choisir un quartier --</option>
          {quartiers.map((q) => (
            <option key={q.id} value={q.id}>{q.name}</option>
          ))}
        </select>
      </div>

      {erreur && <p className="retention-erreur">{erreur}</p>}
      {succes && <p className="retention-succes">{succes}</p>}

      {quartierId && (
        <table className="retention-tableau">
          <thead>
            <tr>
              <th>Ressource</th>
              <th>Initial</th>
              <th>Seuil actuel</th>
              <th>Nouveau %</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stock.map((r) => (
              <tr key={r.resourceTypeId}>
                <td>{r.resourceName}</td>
                <td>{r.initialQuantity}</td>
                <td>{r.retentionMin}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="%"
                    value={pourcentages[r.resourceTypeId] ?? ''}
                    onChange={(e) => handlePourcentageChange(r.resourceTypeId, e.target.value)}
                  />
                </td>
                <td>
                  <button
                    className="retention-bouton"
                    disabled={enCoursId === r.resourceTypeId}
                    onClick={() => handleAppliquer(r.resourceTypeId)}
                  >
                    {enCoursId === r.resourceTypeId ? '...' : 'Appliquer'}
                  </button>
                </td>
              </tr>
            ))}
            {stock.length === 0 && (
              <tr>
                <td colSpan={5} className="retention-vide">Aucune ressource pour ce quartier.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}