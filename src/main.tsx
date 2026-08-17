import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ProcessScrollFlight from './ProcessScrollFlight';
import LowerPageSocials from './LowerPageSocials';
import Login from './portal/Login';
import Signup from './portal/Signup';
import Portal from './portal/Portal';
import AdminHome from './portal/AdminHome';
import AdminClientDetail from './portal/AdminClientDetail';
import AdminAccount from './portal/AdminAccount';
import './index.css';
import './card-image-size.css';
import './performance.css';
import './selected-work.css';
import './philosophy.css';
import './process-section.css';
import './final-sections.css';
import './about-section.css';
import './portal/portal.css';

function Home() {
  return <><App/><ProcessScrollFlight/><LowerPageSocials/></>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/portal" element={<Portal/>} />
        <Route path="/admin" element={<AdminHome/>} />
        <Route path="/admin/account" element={<AdminAccount/>} />
        <Route path="/admin/client/:id" element={<AdminClientDetail/>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
