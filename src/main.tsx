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
import AdminDashboard from './portal/AdminDashboard';
import AdminReviews from './portal/AdminReviews';
import AdminFinance from './portal/AdminFinance';
import AdminTeam from './portal/AdminTeam';
import TeamPortal from './portal/TeamPortal';
import AboutPage from './pages/AboutPage';
import WorkPage from './pages/WorkPage';
import ExpertisePage from './pages/ExpertisePage';
import ProcessPage from './pages/ProcessPage';
import ContactPage from './pages/ContactPage';
import ReviewsPage from './pages/ReviewsPage';
import './index.css';
import './card-image-size.css';
import './performance.css';
import './selected-work.css';
import './philosophy.css';
import './process-section.css';
import './final-sections.css';
import './about-section.css';
import './standalone-pages.css';
import './portal/portal.css';

function Home() {
  return <><App/><ProcessScrollFlight/><LowerPageSocials/></>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/about" element={<AboutPage/>} />
        <Route path="/work" element={<WorkPage/>} />
        <Route path="/expertise" element={<ExpertisePage/>} />
        <Route path="/process" element={<ProcessPage/>} />
        <Route path="/contact" element={<ContactPage/>} />
        <Route path="/reviews" element={<ReviewsPage/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/portal" element={<Portal/>} />
        <Route path="/team" element={<TeamPortal/>} />
        <Route path="/admin" element={<AdminHome/>} />
        <Route path="/admin/dashboard" element={<AdminDashboard/>} />
        <Route path="/admin/team" element={<AdminTeam/>} />
        <Route path="/admin/reviews" element={<AdminReviews/>} />
        <Route path="/admin/finance" element={<AdminFinance/>} />
        <Route path="/admin/account" element={<AdminAccount/>} />
        <Route path="/admin/client/:id" element={<AdminClientDetail/>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
