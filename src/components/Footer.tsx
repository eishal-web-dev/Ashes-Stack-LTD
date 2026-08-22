import { Link } from 'react-router-dom';
import PwaInstallButton from './PwaInstallButton';

export default function Footer() {
  return (
    <footer>
      <div className="footer-brand"><span>ASHES</span><p>Software that refuses<br/>to be forgettable.</p></div>
      <div className="footer-contact"><span>START SOMETHING</span><a href="mailto:hello@ashes.studio">hello@ashes.studio ↗</a></div>
      <nav>
        <a href="https://www.instagram.com/ashes.stack?igsh=djliMm9nMTd0NHVi" target="_blank" rel="noreferrer">INSTAGRAM</a>
        <a href="https://www.linkedin.com/in/eishal-9679a42b9?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noreferrer">LINKEDIN</a>
        <a href="https://www.tiktok.com/@eishal_4a?_r=1&_t=ZS-98ygYWaw3L3" target="_blank" rel="noreferrer">TIKTOK</a>
        <Link to="/workspace">BRAIN</Link>
        <Link to="/pricing">PRICING</Link>
        <Link to="/guides">GUIDES</Link>
        <Link to="/reviews">REVIEWS</Link>
        <Link to="/privacy">PRIVACY</Link>
        <Link to="/terms">TERMS</Link>
        <PwaInstallButton />
        <a href="#top">BACK TO TOP ↑</a>
      </nav>
      <small>© 2026 ASHES · LONDON / EVERYWHERE</small>
    </footer>
  );
}
