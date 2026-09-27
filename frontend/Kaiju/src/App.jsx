import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Maps } from './pages/maps';
import { Login } from './pages/login';
import { SideBare } from './composant/sideBare';
import { MonStock } from "./pages/monStock";
import { SuiviTransfert } from "./pages/suiviTransfert";
import { Reservation } from "./pages/reservation";

import './App.css';

function MainApp() {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const notSidebar = location.pathname === '/' || !isAuthenticated;

  return (
    <div className='body-container'>
      <div className='side-bar-size'>
        {!notSidebar && <SideBare />}
      </div>

      <div className='body-size'>
        <Routes>
          <Route path='/' element={<Login/>} />
          <Route path='/maps' element={< Maps/>} />
          <Route path='/monStock' element={<MonStock />} />
          <Route path='/transfert' element={<SuiviTransfert />} />
          <Route path='/reservation' element={<Reservation />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <MainApp/>
    </Router>
  );
}

export default App;