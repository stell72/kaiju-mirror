import { useState, useEffect, useCallback } from 'react';
import { getDisasterLevel, updateDisasterLevel } from '../utileDb/quarter.jsx';
import { getCurrentUser, hasRole } from '../utileDb/auth.jsx';
import './catastrophe.css';

export const NIVEAUX = [
  { texte: 'Calme', teinte: '#4f8a5b' },
  { texte: 'Vigilance', teinte: '#8a9a3d' },
  { texte: 'Alerte', teinte: '#c99326' },
  { texte: 'Alerte renforcée', teinte: '#d2651f' },
  { texte: 'Évacuation', teinte: '#b8332c' },
];


export function Catastrophe({ onNiveauChange }) {
  const [niveau, setNiveau] = useState(1);
  const [changePar, setChangePar] = useState(null);
  const [changeLe, setChangeLe] = useState(null);
  const [raison, setRaison] = useState('');
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  
  const estCD = hasRole('CD');
 
  const charger = useCallback(() => {
    setErreur('');
    getDisasterLevel()
      .then((data) => {
        setNiveau(data.level);
        setChangePar(data.changedBy);
        setChangeLe(data.changedAt);
        onNiveauChange?.(data.level);
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, []);
 
  useEffect(() => {
    charger();
  }, [charger]);
 
  async function handleChange(nouveauNiveau) {
    if (!estCD || enCours || nouveauNiveau === niveau) return;
    setErreur('');
    setEnCours(true);
    try {
      await updateDisasterLevel(nouveauNiveau, raison || undefined);
      setRaison('');
      charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(false);
    }
  }
 
  const t = NIVEAUX[niveau - 1];
 
  return (
    <div className="catastrophe-panneau">
      <div className="catastrophe-entete">
        <h2>Niveau de catastrophe</h2>
        {chargement ? (
          <span className="catastrophe-chargement">Chargement...</span>
        ) : (
          <span className="catastrophe-badge" style={{ background: t.teinte }}>
            {t.texte} · {niveau}/5
          </span>
        )}
      </div>
 
      <div className="catastrophe-jauge" role="group" aria-label="Niveau de catastrophe">
        {[1, 2, 3, 4, 5].map((n) => {
          const rempli = n <= niveau;
          const couleur = NIVEAUX[n - 1].teinte;
 
          if (estCD) {
            return (
              <button
                key={n}
                type="button"
                disabled={enCours || chargement}
                className="catastrophe-cran est-cliquable"
                style={{
                  background: rempli ? couleur : 'transparent',
                  borderColor: couleur,
                }}
                aria-label={`Régler le niveau de catastrophe à ${n}`}
                aria-pressed={n === niveau}
                onClick={() => handleChange(n)}
              />
            );
          }
 
          return (
            <span
              key={n}
              className="catastrophe-cran"
              style={{
                background: rempli ? couleur : 'transparent',
                borderColor: couleur,
              }}
            />
          );
        })}
      </div>
 
      {estCD ? (
        <div className="catastrophe-form">
          <label htmlFor="catastrophe-raison">Motif du changement (optionnel)</label>
          <input
            id="catastrophe-raison"
            type="text"
            value={raison}
            onChange={(e) => setRaison(e.target.value)}
            placeholder="Ex : Aggravation de la situation à Zion"
            disabled={enCours}
          />
          <p className="catastrophe-aide">
            Clique sur un cran pour appliquer immédiatement le nouveau niveau.
          </p>
        </div>
      ) : (
        <p className="catastrophe-note">
          Seul le City Director peut modifier le niveau de catastrophe.
        </p>
      )}
 
      {changePar && (
        <p className="catastrophe-historique">
          Dernier changement par {changePar.email} ({changePar.role})
          {changeLe && ` le ${new Date(changeLe).toLocaleString('fr-FR')}`}
        </p>
      )}
 
      {erreur && <p className="catastrophe-erreur">{erreur}</p>}
    </div>
  );
}
 
