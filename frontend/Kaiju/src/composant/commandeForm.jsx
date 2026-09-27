import { useState, useEffect } from 'react';


export function CommandeForm({ ressources, quartiers, initialValues, onSubmit }) {
    const [resourceTypeId, setResourceTypeId] = useState('');
    const [quantite, setQuantite] = useState('');
    const [quartierId, setQuartierId] = useState('');
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        if (initialValues) {
            setResourceTypeId(initialValues.resourceTypeId || '');
            setQuantite(initialValues.quantite || '');
            setQuartierId('');
        }
    }, [initialValues]);

    const quartiersDisponibles = initialValues?.quartierExclureId
        ? quartiers.filter((q) => q.id !== initialValues.quartierExclureId)
        : quartiers;

    function handleSubmit(e) {
        e.preventDefault();
        setErreur('');

        if (!resourceTypeId || !quantite || !quartierId) {
            setErreur('Merci de remplir tous les champs.');
            return;
        }
        if (Number(quantite) <= 0) {
            setErreur('La quantité doit être supérieure à 0.');
            return;
        }


        const quartierCible = quartiers.find((q) => q.id === Number(quartierId));

        onSubmit({
            resourceTypeId: Number(resourceTypeId),
            quantite: Number(quantite),
            quartierCible,
        });

        setResourceTypeId('');
        setQuantite('');
        setQuartierId('');
    }


    return (
        <form className="formulaire-commande" onSubmit={handleSubmit}>
            <div className="formulaire-commande-champ">
                <label>Ressource</label>
                <select value={resourceTypeId} onChange={(e) => setResourceTypeId(e.target.value)}>
                    <option value="">-- Choisir une ressource --</option>
                    {ressources.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
            </div>

            <div className="formulaire-commande-champ">
                <label>Quantité</label>
                <input
                    type="number"
                    min="1"
                    value={quantite}
                    onChange={(e) => setQuantite(e.target.value)}
                />
            </div>

            <div className="formulaire-commande-champ">
                <label>Commander au quartier</label>
                <select value={quartierId} onChange={(e) => setQuartierId(e.target.value)}>
                    <option value="">-- Choisir un quartier --</option>
                    {quartiersDisponibles.length === 0 && (
                        <option value="" disabled>Aucun quartier adjacent disponible</option>
                    )}
                    {quartiersDisponibles.map((q) => (
                        <option key={q.id} value={q.id}>{q.name}</option>
                    ))}
                </select>
            </div>

            {erreur && <p className="formulaire-commande-erreur">{erreur}</p>}

            <button className="formulaire-commande-bouton" type="submit">
                Envoyer la commande
            </button>
        </form>
    );
}





