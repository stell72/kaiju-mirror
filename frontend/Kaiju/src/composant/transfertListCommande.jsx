const LABEL_STATUT = {
  en_attente: 'En attente',
  accepte: 'Acceptée',
  refuse: 'Refusée',
};

export function TransfertListCommande({ demandes, selection, onSelect }) {
  return (
    <div className="liste-demandes">
      <h2>Valider l'envoi de la commande</h2>

      {demandes.map((d) => (
        <button
          key={d.id}
          className={`carte-demande${selection === d.id ? ' est-selectionnee' : ''} statut-${d.statut}`}
          onClick={() => onSelect(d.id)}
        >
          <span>demande : "{d.quartier}"</span>
          <span>commande : "{d.ressource}"</span>
          <span className="carte-statut">{LABEL_STATUT[d.statut]}</span>
        </button>
      ))}
    </div>
  );
}


