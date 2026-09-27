import { useEffect, useState } from 'react';

function restCompute(dateArrivee) {
  const diff = new Date(dateArrivee).getTime() - Date.now();
  if (diff <= 0) return 'Arrivé';

  const heures = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return `${heures}h ${minutes}min restantes`;
}

export function TransfertTime({ dateArrivee }) {
  const [texte, setTexte] = useState(() => restCompute(dateArrivee));

  useEffect(() => {
    const intervalle = setInterval(() => {
      setTexte(restCompute(dateArrivee));
    }, 60000);

    return () => clearInterval(intervalle);
  }, [dateArrivee]);

  return <p className="temps-restant">{texte}</p>;
}


