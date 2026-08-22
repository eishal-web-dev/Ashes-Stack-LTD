import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useSEO } from '../useSEO';

export default function ContactPage() {
  useSEO({
    title: 'Contact Ashes Stack — Software House in London, United Kingdom',
    description: 'Get in touch with Ashes Stack. Email, WhatsApp, Instagram, LinkedIn and TikTok — reach Eishal and the team to start a web design, AI, or 3D website project.',
    path: '/contact',
  });

  return (
    <>
      <Nav />
      <div className="standalone-page">
        <div className="page-kicker">START SOMETHING UNIGNORABLE</div>
        <h1>GOT A WILD IDEA?<br/><span>GOOD. WE LIKE THOSE.</span></h1>
        <p className="page-lede">
          Whether it's a landing page, a full product, or something nobody's built before —
          reach out and let's talk about it.
        </p>

        <div className="page-body">
          <div className="contact-methods">
            <a className="contact-method" href="mailto:hello@ashes.studio">
              <b>EMAIL</b>
              <span>hello@ashes.studio</span>
              <small>Best for project briefs</small>
            </a>
            <a className="contact-method" href="https://wa.me/923305315817?text=Hi%2C%20I%20found%20you%20through%20Ashes." target="_blank" rel="noreferrer">
              <b>WHATSAPP</b>
              <span>0330 5315817</span>
              <small>Fastest response</small>
            </a>
            <a className="contact-method" href="https://www.instagram.com/ashes.stack?igsh=djliMm9nMTd0NHVi" target="_blank" rel="noreferrer">
              <b>INSTAGRAM</b>
              <span>@ashes.stack</span>
              <small>Visual work & studio drops</small>
            </a>
            <a className="contact-method" href="https://www.linkedin.com/in/eishal-9679a42b9?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noreferrer">
              <b>LINKEDIN</b>
              <span>Eishal</span>
              <small>Professional network</small>
            </a>
            <a className="contact-method" href="https://www.tiktok.com/@eishal_4a?_r=1&_t=ZS-98ygYWaw3L3" target="_blank" rel="noreferrer">
              <b>TIKTOK</b>
              <span>@eishal_4a</span>
              <small>Behind the builds</small>
            </a>
            <a className="contact-method" href="/login">
              <b>ALREADY A CLIENT?</b>
              <span>Client Portal</span>
              <small>Sign in for invoices & documents</small>
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
