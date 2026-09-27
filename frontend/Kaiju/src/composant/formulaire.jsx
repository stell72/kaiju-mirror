
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getCurrentUser, logout } from '../utileDb/auth.jsx';

const routeRole = {
    QC: '/maps',
    LC: '/transfert',
    CD: '/monStock',
};


export function Formulaire() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [erreur, setErreur] = useState('');
    const navigate = useNavigate();



    async function infoSubmit(e) {
        e.preventDefault();
        setErreur('');

        try {
            await login(email, password);

            const user = getCurrentUser();

            // localStorage.setItem('token', data.token);
            // localStorage.setItem("user", data.user);



            if (!user || !user.role) {
                localStorage.clear();
                // logout();
                setErreur("Impossible de récupérer le rôle de l'utilisateur.");
                return;
            }

            navigate(routeRole[user.role] || '/');

        } catch (error) {
            setErreur(error.message);
        }
    }

    return (
        <div className="formulaire-wrapper">
            <div className="formulaire-container">
                <section className="formulaire-section">
                    <form className="formulaire" onSubmit={infoSubmit}>
                        <input
                            className="formulaire-champ"
                            type="text"
                            placeholder="User"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <input
                            className="formulaire-champ"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {erreur && <p className="formulaire-erreur">{erreur}</p>}

                        <button className="formulaire-bouton" type="submit">
                            Se connecter
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}