
import { useState } from 'react';
import { getCurrentUser } from '../utileDb/auth.jsx';
import { CommandeCard } from './commandeCard.jsx';
import './commande.css';


export function CommandeList({ commandes, onAccepter, onRefuser, onRessayer }) {

    const [fromFilter, setFromFilter] = useState('');
    const [toFilter, setToFilter] = useState('');

    const user = getCurrentUser();
    const userQuarterId = user?.quarterId;

    const commandesDuQuartier = commandes.filter((commande) => {
        if (!userQuarterId) return true;
        return commande.fromQuarterId === userQuarterId || commande.toQuarterId === userQuarterId;
    });

    const commandesFiltrees = commandesDuQuartier.filter((commande) => {
        const matchesFrom = fromFilter === '' || commande.fromQuarterId === Number(fromFilter);
        const matchesTo = toFilter === '' || commande.toQuarterId === Number(toFilter);
        return matchesFrom && matchesTo;
    });

    if (commandes.length === 0) {
        return <p className="liste-commandes-vide">Aucune commande pour le moment.</p>;
    }

    return (
        <div className="liste-commandes">
            {commandesFiltrees.length === 0 ? (
                <p className="liste-commandes-vide">Aucune commande ne correspond aux filtres.</p>
            ) : (
                commandesFiltrees.map((commande) => (
                    <CommandeCard
                        key={commande.id}
                        commande={commande}
                        onAccepter={onAccepter}
                        onRefuser={onRefuser}
                        onRessayer={onRessayer}
                    />
                ))
            )}
        </div>
    );
}


