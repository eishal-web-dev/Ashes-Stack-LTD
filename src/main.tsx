import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './card-image-size.css';
import './performance.css';
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
