import { TransfertTime } from "./transfertTime";
import TruckImg from '../assets/truck.gif'
import CargoImg from '../assets/cargo.gif'
import './transfertDetail.css'

export function TransfertDetail({ demande }) {
   if (demande.statut === 'en_attente') {
    return (
      <div className="detail-transfert">
        <h2>Temps de trajet</h2>
        <p className="detail-attente">
          En attente de la réponse du quartier "{demande.quartier}"...
        </p>
      </div>
    );
  }


    if (demande.statut === 'refuse') {
    return (
      <div className="detail-transfert">
        <h2>Temps de trajet</h2>
        <p className="detail-refuse">
          Demande refusée par le quartier "{demande.quartier}".
        </p>
      </div>
    );
  }


  return (
    <div className="detail-transfert">
      <h2>Temps de trajet</h2>

      <div className="detail-trajet">
        <div className="detail-etape">
          <span className="detail-label">Date de départ</span>
          <span className="detail-valeur">
            {new Date(demande.dateDepart).toLocaleString('fr-FR')}
          </span>
        </div>

        <span className="detail-mode">
          {demande.mode === 'bateau' ? (
            <img src={CargoImg} alt="Cargo" className="icone-mode" />
          ) : (
            <img src={TruckImg} alt="truck" className="icone-mode" />
          )}
        </span>

        <div className="detail-etape">
          <span className="detail-label">Date d'arrivée</span>
          <span className="detail-valeur">
            {new Date(demande.dateArrivee).toLocaleString('fr-FR')}
          </span>
        </div>
      </div>

      <TransfertTime dateArrivee={demande.dateArrivee} />
    </div>
  );
}

