import { useState, useEffect } from 'react';
import { TableauStock } from '../composant/tableauStock.jsx';
import { RequisitionForm } from '../composant/RequisitionForm.jsx';
import { RetentionCD } from '../composant/retentionCd.jsx';
import { getStockComplet, getStockUtilisateur } from "../utileDb/stock.jsx";
import { getQuartiers, getTypesRessources, demanderRequisition } from "../utileDb/requisitionApi.jsx";
import { hasRole } from "../utileDb/auth.jsx";
import './monStock.css';

export function MonStock() {
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const estDirecteur = hasRole('CD');
    const [quartiers, setQuartiers] = useState([]);
    const [typesRessources, setTypesRessources] = useState([]);
    const [requisitionLoading, setRequisitionLoading] = useState(true);
    const [requisitionError, setRequisitionError] = useState(null);
    const [requisitionSucces, setRequisitionSucces] = useState(null)

    useEffect(() => {
        getStockUtilisateur()
            .then(setStock)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!estDirecteur) {
            setRequisitionLoading(false);
            return;
        }
        Promise.all([getQuartiers(), getTypesRessources()])
            .then(([quartiersData, typesRessourcesData]) => {
                setQuartiers(quartiersData);
                setTypesRessources(typesRessourcesData);
            })
            .catch((err) => setRequisitionError(err.message))
            .finally(() => setRequisitionLoading(false));
    }, [estDirecteur]);


    return (
        <>
            <div className="page-stock">
                <div className="stock-page-container">
                    <h1 className="stock-title">mon stock:</h1>

                    <section className="stock-table-section">
                        {loading && <p>Chargement...</p>}
                        {error && <p className="stock-error">Erreur : {error}</p>}
                        {!loading && !error && <TableauStock stock={stock} />}
                    </section>
                    {estDirecteur && (
                        <section className="stock-requisition-section">
                            <h2 className="stock-requisition-title">Réquisition</h2>
                            {requisitionLoading && <p>Chargement...</p>}
                            {requisitionError && <p className="stock-error">Erreur : {requisitionError}</p>}
                            {requisitionSucces && <p className="requisition-succes">{requisitionSucces}</p>}
                            {!requisitionLoading && !requisitionError && (
                                <RequisitionForm
                                    quartiers={quartiers}
                                    typesRessources={typesRessources}
                                    onSuccess={(resultat) =>
                                        setRequisitionSucces(
                                            `Réquisition effectuée — ${resultat.quantity} unité(s) déplacée(s).`
                                        )
                                    }
                                />
                            )}
                        </section>
                    )}
                    <section className="stock-retention-section">
                        <RetentionCD />
                    </section>

                </div>
            </div>
        </>
    )
}