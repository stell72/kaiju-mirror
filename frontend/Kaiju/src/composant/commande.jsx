import { useState, useEffect, useCallback } from 'react';
import { CommandeForm } from './commandeForm.jsx';
import { CommandeList } from './commandeList.jsx';
import { getQuartersQ, getQuartiersAdjacents } from '../utileDb/quarter.jsx';
import { getTransfers, createTransfers, valideTransfers, refuseTransfers } from '../utileDb/transfers.jsx';
import { getResourceR } from '../utileDb/ressource.jsx';
import { getCurrentUser } from '../utileDb/auth.jsx';
import './commande.css';


export function Commande() {
    const [quartiersAdjacents, setQuartiersAdjacents] = useState([]);
    const [ressources, setRessources] = useState([]);
    const [commandes, setCommandes] = useState([]);
    const [brouillon, setBrouillon] = useState(null);
    const [erreur, setErreur] = useState('');


    const user = getCurrentUser();


    const chargerCommandes = useCallback(() => {
        getTransfers()
            .then(setCommandes)
            .catch((err) => setErreur(err.message));
    }, []);

    useEffect(() => {
        chargerCommandes();

        getResourceR()
            .then(setRessources)
            .catch((err) => setErreur(err.message));

        if (user?.quarterId) {
            getQuartiersAdjacents(user.quarterId)
                .then(setQuartiersAdjacents)
                .catch((err) => setErreur(err.message));
        } else {
            getQuartersQ()
                .then(setQuartiersAdjacents)
                .catch((err) => setErreur(err.message));
        }
    }, [chargerCommandes, user?.quarterId]);


    async function handleSubmit(data) {
        try {
            await createTransfers({
                resourceTypeId: data.resourceTypeId,
                quantite: data.quantite,
                quartierCibleId: data.quartierCible.id,
                quartierDemandeurId: user?.quarterId,
            });
            setBrouillon(null);
            chargerCommandes();
        } catch (err) {
            setErreur(err.message);
        }
    }

    async function handleValidate(id) {
        try {
            await valideTransfers(id);
            chargerCommandes();
        } catch (err) {
            setErreur(err.message);
        }
    }


    async function handleRefuse(id) {
        try {
            await refuseTransfers(id);
            chargerCommandes();
        } catch (err) {
            setErreur(err.message);
        }
    }

    function reTryCommande(commande) {
        setBrouillon({
            resourceTypeId: commande.resourceTypeId,
            quantite: commande.quantity,
            quartierExclureId: commande.fromQuarterId,
        });
    }


    return (
        <div className="commande-page">
            <div className="commande-container">
                <h1 className="commande-title">Commandes de ressources</h1>

                {erreur && <p className="commande-erreur">{erreur}</p>}

                <section className="commande-section">
                    <h2 className="commande-section-titre">Nouvelle commande</h2>
                    <CommandeForm
                        ressources={ressources}
                        quartiers={quartiersAdjacents}
                        initialValues={brouillon}
                        onSubmit={handleSubmit}
                    />
                </section>

                <section className="commande-section">
                    <h2 className="commande-section-titre">Suivi des commandes</h2>
                    <CommandeList
                        commandes={commandes}
                        onAccepter={handleValidate}
                        onRefuser={handleRefuse}
                        onRessayer={reTryCommande}
                    />
                </section>
            </div>
        </div>
    );
}

