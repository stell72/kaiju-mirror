import './tableauStock.css';



export function TableauStock({stock =[]}) {
    if (stock.length === 0) {
        return <p className="tableau-stock-vide">Aucune ressource en stock.</p>;
    }

    const quartiers = [...new Set(stock.map(item => item.quartier))];
    const ressources = [...new Set(stock.map(item => item.ressource))];

    const getQuantite = (ressource, quartier) => {
        const item = stock.find(
            d => d.ressource === ressource && d.quartier === quartier
        );
        return item ? item.quantite : '-';
    };

    return (
        <table className="tableau-stock">
            <thead>
                <tr>
                    <th>ressource</th>
                    {quartiers.map((quartier, index) => (
                        <th key={index}>{quartier}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {ressources.map((ressource, rIndex) => (
                    <tr key={rIndex}>
                        <td className="tableau-stock-ressource">{ressource}</td>
                        {quartiers.map((quartier, qIndex) => (
                            <td key={qIndex}>{getQuantite(ressource, quartier)}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}