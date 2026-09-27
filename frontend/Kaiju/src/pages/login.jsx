import { Formulaire } from '../composant/formulaire.jsx'
import './login.css';

export function Login({}){
    

    
    return(
        <>
            <div className="page">
                <div className="login-page-container">
                    <section className="login-form-section">
                        <Formulaire/>
                    </section>
                </div>
            </div>
        </>
    )
}