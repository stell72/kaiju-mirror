import { getCurrentUser } from '../utileDb/auth.jsx';

const STATUTS = {
    PENDING: { label: 'En attente', classe: 'statut-attente' },
    READY_TO_EXECUTE: { label: 'En attente (transit)', classe: 'statut-attente' },
    COMPLETED: { label: 'Acceptée', classe: 'statut-acceptee' },
    REJECTED: { label: 'Refusée', classe: 'statut-refusee' },
};

export function CommandeCard({ commande, onAccepter, onRefuser, onRessayer }) {
    // const statut = STATUTS[commande.status];
    const user = getCurrentUser();
    const userQuarterId = user?.quarterId;

    const estFournisseur = userQuarterId === commande.fromQuarterId; // Quartier qui reçoit la demande
    const estDemandeur = userQuarterId === commande.toQuarterId;


    // const estDemandeur = user?.quarterId === commande.toQuarterId;
    const statutInfo = STATUTS[commande.status] || { label: commande.status, classe: '' };

    return (
        <div className="commande-carte">
            <div className="commande-carte-entete">
                <span className={`commande-badge ${statutInfo.classe}`}>{statutInfo.label}</span>
                <span className="commande-carte-date">
                    {new Date(commande.createdAt).toLocaleString()}
                </span>
            </div>

            <div className="commande-carte-corps">
                <p>
                    <strong>{commande.quantity}</strong> × {commande.resourceType?.name}
                </p>
                <p>
                    {estDemandeur ? (
                        <>Demandé au quartier <strong>{commande.fromQuarter?.name}</strong></>
                    ) : (
                        <>Reçu du quartier <strong>{commande.toQuarter?.name}</strong></>
                    )}
                    {' — '}
                    <span>{commande.routeType === 'MARITIME' ? 'voie maritime' : 'voie terrestre'}</span>
               </p>
            </div>

            {commande.status === 'PENDING' && estFournisseur && (
                <div className="commande-carte-actions">
                    <button
                        className="commande-bouton commande-bouton-accepter"
                        onClick={() => onAccepter(commande.id)}
                    >
                        Accepter
                    </button>
                    <button
                        className="commande-bouton commande-bouton-refuser"
                        onClick={() => onRefuser(commande.id)}
                    >
                        Refuser
                    </button>
                </div>
            )}

            {commande.status === 'PENDING' && estDemandeur && (
                <p className="commande-carte-note">
                    En attente de validation par le quartier <strong>{commande.fromQuarter?.name}</strong>.
                </p>
            )}

            {(commande.status === 'COMPLETED' || commande.status === 'READY_TO_EXECUTE') && (
                <p className="commande-carte-note commande-carte-note-ok">
                    Commande validée ! Transfert transmis au Logistics Coordinator.
                </p>
            )}

            {commande.status === 'REJECTED' && (
                <div className="commande-carte-note commande-carte-note-refus">
                    <p>La commande a été refusée par le quartier fournisseur.</p>
                    {estDemandeur && onRessayer && (
                        <button 
                            className="commande-bouton commande-bouton-ressayer"
                            onClick={() => onRessayer(commande)}
                        >
                            Ressayer auprès d'un autre quartier
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

