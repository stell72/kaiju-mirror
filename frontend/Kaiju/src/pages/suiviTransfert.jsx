import { useState, useEffect } from 'react';
import { TransfertListCommande } from '../composant/transfertListCommande';
import { TransfertDetail } from '../composant/transfertDetail';
import { NonAdjacent } from '../composant/nonAdjacent';
import { getTransfers } from '../utileDb/transfers';
import './suiviTransfert.css';


const STATUT_MAP = {
  PENDING: 'en_attente',
  READY_TO_EXECUTE: 'en_attente',
  COMPLETED: 'accepte',
  REJECTED: 'refuse',
};


function mapTransfert(t) {
  return {
    id: t.id,
    quartier: t.toQuarter.name,
    ressource: t.resourceType.name,
    statut: STATUT_MAP[t.status] || 'en_attente',
    mode: t.routeType === 'MARITIME' ? 'bateau' : 'camion',
    dateDepart: t.scheduledStartAt,
    dateArrivee: t.scheduledEndAt,
  };
}



export function SuiviTransfert() {
  const [demandes, setDemandes] = useState([]);
  const [selection, setSelection] = useState(null);
  const [erreur, setErreur] = useState('');



  useEffect(() => {
    getTransfers()
      .then((data) => setDemandes(data.map(mapTransfert)))
      .catch((err) => setErreur(err.message));
  }, []);


  const demande = demandes.find((d) => d.id === selection) || null;

  return (
    <div className="suivi-page">
      {erreur && <p className="commande-erreur">{erreur}</p>}

      <section className="suivi-detail">
        {demande ? (
          <TransfertDetail demande={demande} />
        ) : (
          <p className="suivi-vide">Sélectionne une demande pour voir le trajet.</p>
        )}
      </section>

      <section className="suivi-liste">
        <TransfertListCommande
          demandes={demandes}
          selection={selection}
          onSelect={setSelection}
        />
      </section>

      <div className="suivi-transit">
        <NonAdjacent />
      </div>

    </div>

  );
}


