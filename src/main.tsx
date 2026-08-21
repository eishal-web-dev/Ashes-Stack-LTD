import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ProcessScrollFlight from './ProcessScrollFlight';
import LowerPageSocials from './LowerPageSocials';
import { setupAshesPwa } from './pwa';
import './tailwind.css';
import './index.css';
import './tablet-responsive.css';
import './card-image-size.css';
import './performance.css';
import './selected-work.css';
import './philosophy.css';
import './process-section.css';
import './final-sections.css';
import './about-section.css';
import './standalone-pages.css';
import './portal/portal.css';
import './portal/portal-responsive.css';
import './pwa.css';

const Login = lazy(() => import('./portal/Login'));
const Signup = lazy(() => import('./portal/Signup'));
const Portal = lazy(() => import('./portal/Portal'));
const AdminHome = lazy(() => import('./portal/AdminHome'));
const AdminClientDetail = lazy(() => import('./portal/AdminClientDetail'));
const AdminAccount = lazy(() => import('./portal/AdminAccount'));
const AdminDashboard = lazy(() => import('./portal/AdminDashboard'));
const AdminReviews = lazy(() => import('./portal/AdminReviews'));
const AdminFinance = lazy(() => import('./portal/AdminFinance'));
const AdminTeam = lazy(() => import('./portal/AdminTeam'));
const TeamPortal = lazy(() => import('./portal/TeamPortal'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const WorkPage = lazy(() => import('./pages/WorkPage'));
const ExpertisePage = lazy(() => import('./pages/ExpertisePage'));
const ProcessPage = lazy(() => import('./pages/ProcessPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const Workspace = lazy(() => import('./workspace/Workspace'));
const WorkspaceLogin = lazy(() => import('./workspace/WorkspaceLogin'));
const WorkspaceShare = lazy(() => import('./workspace/WorkspaceShare'));

setupAshesPwa();

function Home() {
  return <><App/><ProcessScrollFlight/><LowerPageSocials/></>;
}

function RouteFallback() {
  return <div style={{ minHeight: '100vh', background: '#080909' }} aria-hidden="true" />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<RouteFallback/>}>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/about" element={<AboutPage/>} />
          <Route path="/work" element={<WorkPage/>} />
          <Route path="/expertise" element={<ExpertisePage/>} />
          <Route path="/process" element={<ProcessPage/>} />
          <Route path="/contact" element={<ContactPage/>} />
          <Route path="/reviews" element={<ReviewsPage/>} />
          <Route path="/workspace" element={<Workspace/>} />
          <Route path="/workspace/login" element={<WorkspaceLogin/>} />
          <Route path="/workspace/share/:token" element={<WorkspaceShare/>} />
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
      </Suspense>
    </BrowserRouter>
  </StrictMode>
);
