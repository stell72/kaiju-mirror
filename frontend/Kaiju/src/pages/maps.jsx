import React, { useState, useRef, useEffect } from "react";
import { getQuarters, getQuarterStock } from "../utileDb/maps.jsx"
import { Commande } from "../composant/commande.jsx";
import { Catastrophe, NIVEAUX } from "../composant/catastrophe.jsx";


const DISTRICTS = [
  {
    id: "A",
    nom: "Apex",
    d: "M32,195 L24,213 L25,257 L88,310 L97,329 L99,361 L120,361 L124,365 L149,368 L185,365 L252,369 L262,376 L282,381 L287,389 L336,393 L337,381 L346,381 L352,400 L352,425 L364,450 L398,477 L406,473 L403,466 L384,459 L384,441 L362,402 L362,393 L349,374 L332,377 L305,340 L298,323 L298,305 L312,281 L355,251 L381,238 L419,229 L427,222 L428,204 L414,188 L355,157 L303,145 L286,134 L279,118 L269,110 L205,108 L189,114 L169,132 L125,132 L82,149 L62,163 Z",
  },
  {
    id: "E",
    nom: "Echo",
    d: "M293,100 L295,131 L353,139 L377,149 L398,169 L423,175 L438,189 L451,225 L463,233 L504,240 L534,268 L584,282 L631,325 L655,329 L645,321 L647,306 L667,312 L695,336 L695,362 L678,363 L697,404 L712,405 L722,424 L761,421 L759,447 L727,454 L735,470 L775,472 L779,490 L831,511 L903,477 L905,466 L930,450 L928,433 L909,435 L889,423 L899,405 L932,405 L927,388 L932,354 L927,341 L913,332 L910,310 L895,310 L879,293 L877,258 L861,244 L872,220 L855,198 L844,197 L838,168 L829,168 L824,159 L829,146 L816,127 L818,106 L827,96 L821,82 L795,84 L776,71 L746,74 L735,58 L733,39 L658,42 L649,37 L647,18 L635,7 L623,6 L574,18 L569,25 L549,25 L562,57 L559,100 L460,101 L448,86 L356,86 Z",
  },
  {
    id: "X",
    nom: "Xeno",
    d: "M313,291 L310,321 L320,338 L333,345 L336,358 L374,382 L371,401 L395,426 L391,454 L409,459 L436,486 L468,491 L488,483 L485,477 L487,460 L496,458 L494,444 L506,429 L512,413 L529,416 L542,405 L557,404 L558,398 L564,396 L565,378 L581,383 L581,391 L569,397 L573,406 L569,424 L574,427 L574,436 L544,459 L544,465 L551,477 L563,480 L582,477 L583,486 L577,493 L586,504 L604,491 L602,484 L587,481 L587,473 L606,465 L628,465 L630,474 L700,475 L704,423 L670,352 L658,343 L650,330 L631,327 L616,314 L611,314 L605,297 L599,297 L577,280 L531,268 L503,242 L475,241 L446,225 L428,253 L419,253 L415,247 L402,247 L368,258 L355,274 L343,276 L327,292 Z M668,500 L667,501 L667,523 L668,524 L668,526 L678,526 L680,528 L680,529 L681,530 L681,533 L682,534 L682,536 L683,537 L683,538 L684,539 L684,550 L685,551 L691,551 L691,543 L692,542 L692,533 L693,532 L693,522 L694,521 L694,509 L695,508 L695,499 L694,498 L686,498 L685,499 L674,499 L673,500 Z",
  },
  {
    id: "W",
    nom: "Warden",
    d: "M91,362 L99,431 L99,488 L94,512 L81,537 L81,550 L97,591 L142,602 L180,620 L214,645 L236,675 L270,676 L280,668 L282,645 L275,639 L276,620 L279,617 L307,607 L313,591 L320,586 L330,586 L338,592 L344,592 L357,584 L381,579 L383,571 L379,567 L378,547 L383,542 L383,537 L369,528 L369,519 L379,509 L378,493 L394,492 L401,472 L379,454 L346,377 L337,380 L335,394 L305,389 L287,389 L284,382 L262,376 L250,367 L192,368 L177,364 L173,368 L124,365 L120,361 Z",
  },
  {
    id: "Z",
    nom: "Zion",
    d: "M412,479 L398,500 L388,500 L388,511 L378,521 L378,525 L392,533 L392,543 L387,549 L390,582 L375,591 L362,591 L344,602 L329,598 L317,600 L310,621 L293,621 L284,626 L283,636 L291,642 L288,674 L279,677 L273,686 L242,685 L242,694 L296,752 L296,761 L331,790 L331,810 L325,830 L330,849 L350,857 L349,843 L356,839 L366,839 L367,850 L382,856 L413,840 L448,835 L513,834 L553,850 L595,843 L637,795 L573,700 L520,700 L519,692 L506,697 L495,695 L493,682 L504,665 L529,658 L529,654 L523,653 L523,640 L534,629 L534,624 L502,565 L497,537 L468,539 L465,536 L466,527 L481,524 L481,515 L477,515 L475,521 L467,521 L463,498 L431,494 Z M615,578 L610,583 L607,588 L602,593 L602,594 L589,609 L589,613 L601,613 L602,614 L602,624 L610,632 L611,632 L618,638 L624,638 L627,636 L627,634 L628,633 L636,633 L638,637 L642,641 L648,651 L652,651 L656,647 L657,647 L660,644 L661,644 L668,638 L669,638 L669,632 L667,628 L665,626 L660,616 L658,614 L657,611 L655,609 L654,606 L652,604 L651,601 L649,599 L646,593 L642,593 L631,602 L623,602 L622,601 L622,593 L631,585 L631,579 L622,579 L621,578 Z",
  },
];


const ANCRES = {
  A: [196, 250],
  E: [668, 170],
  X: [462, 355],
  W: [230, 500],
  Z: [420, 700],
};



// const NIVEAUX = [
//   { texte: "Calme", teinte: "#4f8a5b" },
//   { texte: "Vigilance", teinte: "#8a9a3d" },
//   { texte: "Alerte", teinte: "#c99326" },
//   { texte: "Alerte renforcée", teinte: "#d2651f" },
//   { texte: "Évacuation", teinte: "#b8332c" },
// ];

// function Jauge({ niveau, compact = false, interactif = false, onChange }) {
//   const t = NIVEAUX[niveau - 1];
//   return (
//     <div className="tk-jauge">
//       <div className="tk-jauge-barres" aria-hidden={!interactif}>

//         {[1, 2, 3, 4, 5].map((n) => {
//           const rempli = n <= niveau;
//           const props = {
//             className: `tk-cran${interactif ? " est-cliquable" : ""}`,
//             style: {
//               background: rempli ? t.teinte : "transparent",
//               borderColor: rempli ? t.teinte : "rgba(22,34,44,.25)",
//               width: compact ? 14 : 22,
//             },
//           };

//           if (interactif) {
//             return (
//               <button
//                 key={n}
//                 {...props}
//                 type="button"
//                 aria-label={`Régler le niveau de catastrophe à ${n}`}
//                 onClick={() => onChange(n)}
//               />
//             );
//           }
//           return <span key={n} {...props} />;
//         })}
//       </div>
//       <span className="tk-jauge-texte" style={{ color: t.teinte }}>
//         {t.texte} · {niveau}/5
//       </span>
//     </div>
//   );
// }

export function Maps() {
  const [niveau, setNiveau] = useState(1);
  const [survol, setSurvol] = useState(null);
  const [selection, setSelection] = useState(null);
  const [curseur, setCurseur] = useState({ x: 0, y: 0 });
  const cadre = useRef(null);


  const [quartiers, setQuartiers] = useState([]);
  const [ressources, setRessources] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    getQuarters()
      .then(setQuartiers)
      .catch((err) => setErreur(err.message));
  }, []);

  useEffect(() => {
    if (!selection) {
      setRessources([]);
      return;
    }

    const quartier = quartiers.find((q) => q.code === selection);
    if (!quartier) return;

    setChargement(true);
    setErreur('');

    getQuarterStock(quartier.id)
      .then((data) => {
        const formatees = data.map((r) => {

          const quantiteDisponible = Math.max(0, r.currentQuantity - r.retentionMin);

          const pourcentageActuel = r.initialQuantity > 0
            ? Math.max(0, Math.min(100, Math.round((r.currentQuantity / r.initialQuantity) * 100)))
            : 0;
          return {
            nom: r.resourceName,
            quantiteActuelle: r.currentQuantity,
            quantiteInitiale: r.initialQuantity,
            seuilMin: r.retentionMin,
            quantiteDisponible,
            pourcentageActuel,
            estCritique: r.currentQuantity <= r.retentionMin,
          };
        });

        setRessources(formatees);
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, [selection, quartiers]);


  const teinte = NIVEAUX[niveau - 1].teinte;
  const district = DISTRICTS.find((d) => d.id === selection) || null;
  const districtSurvole = DISTRICTS.find((d) => d.id === survol) || null;


  const suivreSouris = (e) => {
    const r = cadre.current?.getBoundingClientRect();
    if (!r) return;
    setCurseur({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <div className="tk">
      <style>{css}</style>

      <header className="tk-entete">
        <h1>Tokyork</h1>
      </header>

      <div className="tk-reglage">
        <span className="tk-reglage-label">Niveau de catastrophe (toute la carte)</span>
        <Catastrophe onNiveauChange={setNiveau}/>
      </div>

      <div className="tk-corps">
        <div className="tk-carte" ref={cadre} onMouseMove={suivreSouris}>
          <svg viewBox="0 0 976 972" role="group" aria-label="Carte des districts de Tokyork">
            {DISTRICTS.map((d) => {
              const estSelectionne = selection === d.id;
              const attenue = selection && !estSelectionne;
              return (
                <path
                  key={d.id}
                  d={d.d}
                  className={`tk-zone${estSelectionne ? " est-actif" : ""}${attenue ? " est-attenue" : ""}`}
                  fill={teinte}
                  tabIndex={0}
                  role="button"
                  aria-pressed={estSelectionne}
                  aria-label={`${d.nom}. Cliquer pour voir les ressources.`}
                  onMouseEnter={() => setSurvol(d.id)}
                  onMouseLeave={() => setSurvol(null)}
                  onFocus={() => setSurvol(d.id)}
                  onBlur={() => setSurvol(null)}
                  onClick={() => setSelection(selection === d.id ? null : d.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelection(selection === d.id ? null : d.id);
                    }
                  }}
                />
              );
            })}

            {DISTRICTS.map((d) => (
              <text
                key={d.id}
                x={ANCRES[d.id][0]}
                y={ANCRES[d.id][1]}
                className="tk-lettre"
                pointerEvents="none"
              >
                {d.id}
              </text>
            ))}

            <g className="tk-echelle-dist" pointerEvents="none">
              <line x1="20" y1="940" x2="235" y2="940" />
              <text x="66" y="925">10 km</text>
            </g>
          </svg>

          {districtSurvole && (
            <div
              className="tk-bulle"
              style={{ left: curseur.x, top: curseur.y }}
              role="status"
            >
              <span className="tk-bulle-nom">{districtSurvole.nom}</span>
              <span className="tk-bulle-aide">Cliquer pour les ressources</span>
            </div>
          )}
        </div>

        <aside className="tk-fiche">
          {!district && (
            <div className="tk-vide">
              <p>Aucun district sélectionné.</p>
              <p className="tk-vide-aide">
                Cliquez sur une zone de la carte (ou tabulez jusqu'à elle et
                appuyez sur Entrée) pour afficher ses ressources.
              </p>
            </div>
          )}

          {district && (
            <div key={district.id} className="tk-detail">
              <div className="tk-detail-tete">
                <span className="tk-pastille" style={{ background: teinte }} />
                <h2>{district.nom}</h2>
                <span className="tk-code">District {district.id}</span>
              </div>

              <dl className="tk-meta">
                <div>
                  <dt>Niveau de catastrophe</dt>
                  <dd>{NIVEAUX[niveau - 1].texte} · {niveau}/5</dd>
                </div>
              </dl>

              <div className="tk-bloc">
                <h3>Ressources</h3>

                {chargement && <p className="tk-vide-aide">Chargement des ressources...</p>}
                {erreur && <p className="tk-vide-aide" style={{ color: "#b8332c" }}>{erreur}</p>}

                {!chargement && !erreur && (

                  <ul className="tk-ressources">
                    {ressources.map((r) => (
                      <li key={r.nom} style={{ marginBottom: "12px", display: "block" }}>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                          <span className="tk-res-nom" style={{ fontWeight: r.estCritique ? "bold" : "normal" }}>
                            {r.nom} {r.estCritique && <span style={{ color: "#b8332c", fontSize: "11px" }}>(Seuil critique atteint)</span>}
                          </span>
                          <span className="tk-res-val">
                            <strong>{r.quantiteActuelle}</strong>
                          </span>
                        </div>

                        <span className="tk-res-piste" style={{ marginTop: "5px", marginBottom: "5px" }}>
                          <span
                            className="tk-res-jauge"
                            style={{
                              width: `${r.pourcentageActuel}%`,
                              background: r.estCritique ? "#b8332c" : teinte
                            }}
                          />
                        </span>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#6b7880" }}>
                          <span>Seuil min : {r.seuilMin}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="tk-note">{district.note}</p>

              <button className="tk-bouton" onClick={() => setSelection(null)}>
                Fermer la fiche
              </button>
            </div>
          )}
        </aside>
      </div>
      <Commande />
    </div>
  );
}

const css = `
.tk {
  --encre: #16222c;
  --papier: #f3f1ec;
  --trait: #cdc9bf;
  --eau: #dce6f4;
  font-family: ui-sans-serif, "Helvetica Neue", Arial, sans-serif;
  color: var(--encre);
  background: var(--papier);
  padding: 28px clamp(16px, 4vw, 48px) 40px;
  min-height: 100%;
  box-sizing: border-box;
}
.tk *, .tk *::before, .tk *::after { box-sizing: border-box; }

.tk-entete { max-width: 62ch; margin-bottom: 22px; }
.tk-entete h1 {
  font-family: "Iowan Old Style", Palatino, "Palatino Linotype", Georgia, serif;
  font-size: clamp(34px, 5vw, 52px);
  font-weight: 400;
  letter-spacing: -0.015em;
  margin: 0 0 8px;
}
.tk-entete p { margin: 0; font-size: 15px; line-height: 1.55; color: #46555f; }

.tk-reglage {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  border: 1px solid var(--trait);
  background: #fbfaf7;
  padding: 12px 16px;
  margin-bottom: 22px;
}
.tk-reglage-label { font-size: 12.5px; color: #46555f; }

.tk-corps {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 1fr);
  gap: clamp(16px, 3vw, 40px);
  align-items: start;
}
@media (max-width: 860px) { .tk-corps { grid-template-columns: 1fr; } }

.tk-carte {
  position: relative;
  background: var(--eau);
  border: 1px solid var(--trait);
}
.tk-carte svg { display: block; width: 100%; height: auto; }

.tk-zone {
  stroke: var(--encre);
  stroke-width: 3;
  stroke-linejoin: round;
  cursor: pointer;
  transition: opacity .18s ease, filter .18s ease;
  outline: none;
}
.tk-zone.est-attenue { opacity: .35; }
.tk-zone.est-actif { filter: drop-shadow(0 6px 10px rgba(22,34,44,.45)); }
.tk-zone:focus-visible { stroke-width: 7; }
.tk-zone:hover { filter: brightness(1.08); }

.tk-lettre {
  font-family: "Iowan Old Style", Palatino, Georgia, serif;
  font-size: 86px;
  text-anchor: middle;
  dominant-baseline: middle;
  fill: rgba(255,255,255,.85);
  paint-order: stroke;
  stroke: rgba(22,34,44,.35);
  stroke-width: 1px;
}
.tk-echelle-dist line { stroke: var(--encre); stroke-width: 9; }
.tk-echelle-dist text { font-size: 30px; fill: var(--encre); text-anchor: middle; }

.tk-bulle {
  position: absolute;
  transform: translate(14px, -50%);
  pointer-events: none;
  background: var(--encre);
  color: #f6f5f1;
  padding: 8px 12px 9px;
  min-width: 176px;
  box-shadow: 0 8px 18px rgba(22,34,44,.28);
}
.tk-bulle-nom {
  display: block;
  font-family: "Iowan Old Style", Palatino, Georgia, serif;
  font-size: 17px;
}
.tk-bulle-aide {
  display: block;
  margin-top: 5px;
  font-size: 11px;
  color: rgba(246,245,241,.65);
}

.tk-jauge { display: flex; flex-direction: column; gap: 5px; }
.tk-jauge-barres { display: flex; gap: 3px; }
.tk-cran { height: 8px; border: 1px solid; display: block; padding: 0; }
.tk-cran.est-cliquable { cursor: pointer; height: 16px; }
.tk-cran.est-cliquable:hover { filter: brightness(1.15); }
.tk-cran:focus-visible { outline: 2px solid var(--encre); outline-offset: 2px; }
.tk-jauge-texte { font-size: 12.5px; letter-spacing: .01em; }

.tk-fiche {
  border: 1px solid var(--trait);
  background: #fbfaf7;
  padding: 20px 22px 22px;
  min-height: 320px;
}
.tk-vide { color: #6b7880; font-size: 14px; }
.tk-vide p { margin: 0 0 6px; }
.tk-vide-aide { font-size: 13px; color: #8c979d; }

.tk-detail-tete { display: flex; align-items: baseline; gap: 9px; flex-wrap: wrap; }
.tk-pastille { width: 11px; height: 11px; border: 1px solid var(--encre); display: block; }
.tk-detail-tete h2 {
  font-family: "Iowan Old Style", Palatino, Georgia, serif;
  font-weight: 400;
  font-size: 27px;
  margin: 0;
}
.tk-code { font-size: 12.5px; color: #8c979d; margin-left: auto; }

.tk-meta { display: flex; gap: 26px; margin: 16px 0 0; padding: 12px 0; border-top: 1px solid var(--trait); border-bottom: 1px solid var(--trait); }
.tk-meta dt { font-size: 12px; color: #7d888f; margin-bottom: 3px; }
.tk-meta dd { margin: 0; font-size: 15px; }

.tk-bloc { margin-top: 18px; }
.tk-bloc h3 { font-size: 13px; font-weight: 600; margin: 0 0 8px; color: #46555f; }

.tk-ressources { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.tk-ressources li { display: grid; grid-template-columns: 1fr 96px 28px; align-items: center; gap: 10px; font-size: 14px; }
.tk-res-piste { height: 7px; background: rgba(22,34,44,.1); display: block; }
.tk-res-jauge { display: block; height: 100%; }
.tk-res-val { font-size: 13px; text-align: right; color: #46555f; font-variant-numeric: tabular-nums; }

.tk-note { font-size: 13.5px; line-height: 1.6; color: #55636b; margin: 18px 0 0; }

.tk-bouton {
  margin-top: 18px;
  font: inherit;
  font-size: 13.5px;
  background: transparent;
  color: var(--encre);
  border: 1px solid var(--encre);
  padding: 8px 14px;
  cursor: pointer;
}
.tk-bouton:hover { background: var(--encre); color: var(--papier); }
.tk-bouton:focus-visible { outline: 2px solid var(--encre); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) { .tk-zone { transition: none; } }
`;