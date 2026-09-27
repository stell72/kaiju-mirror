import { Reserve } from '../composant/reserve'; 
import './reservation.css';

export function Reservation() {
  return (
    <div className="page-reservation">
      <div className="reservation-container">
        <h1 className="reservation-title">Réservation de ressources</h1>
        <Reserve />
      </div>
    </div>
  );
}
