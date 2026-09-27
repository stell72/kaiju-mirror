import { useNavigate } from 'react-router-dom';
import { logout } from '../utileDb/auth';
import './sideBare.css';

export function SideBare() {
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/');
    }

    return (
        <div className="button-container">
            <ul className='list-button'>
                <li onClick={() => navigate('/maps')}>maps</li>
                <li onClick={() => navigate('/monStock')}>mon Stock</li>
                <li onClick={() => navigate('/transfert')}>transferts</li>
                <li onClick={() => navigate('/reservation')}>reservation</li>
                <li onClick={handleLogout}>Déconnexion</li>
            </ul>
        </div>
    );
}