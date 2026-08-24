import { Link } from 'react-router-dom';
import AdSenseBootstrap from '../ads/AdSenseBootstrap';

const guides = [
  { slug: 'convert-product-image-to-3d-model', label: 'IMAGE → 3D', title: 'How to convert a product image into a 3D model for ecommerce', desc: 'From source photos and reconstruction to a lightweight GLB and interactive store viewer.' },
  { slug: '3d-product-viewer-for-shopify', label: 'SHOPIFY 3D', title: '3D product viewer for Shopify: what merchants need to know', desc: 'Prepare, publish and measure interactive 3D without sacrificing the product-page experience.' },
  { slug: '3d-product-photography-vs-interactive-3d', label: 'ECOMMERCE VISUALS', title: 'Product photography vs interactive 3D: which should your store use?', desc: 'A practical comparison of photography, 360 spins and true interactive product models.' },
  { slug: 'how-3d-commerce-helps-furniture-stores', label: 'FURNITURE 3D', title: 'How interactive 3D helps furniture stores sell online', desc: 'Choose the right first SKU and launch a fast, measurable store-ready 3D pilot.' },
  { slug: 'shared-ai-memory-chatgpt-claude-gemini', label: 'AI SECOND BRAIN', title: 'Shared AI memory: one brain for ChatGPT, Claude and Gemini', desc: 'Keep project context, decisions and handoffs available across multiple AI assistants.' },
  { slug: 'share-memory-between-chatgpt-and-claude', label: 'SHARED AI MEMORY', title: 'How to share project memory between ChatGPT and Claude', desc: 'Why AI chats are isolated and how a shared project brain can connect approved context.' },
  { slug: 'what-is-mcp', label: 'MCP EXPLAINED', title: 'What is MCP? A simple guide to the Model Context Protocol', desc: 'Understand MCP clients, servers, tools, OAuth and why the protocol matters.' },
  { slug: 'connect-claude-to-mcp-server', label: 'CLAUDE + MCP', title: 'How to connect Claude to a remote MCP server', desc: 'A clean setup walkthrough with practical security checks.' }
];

export default function GuidesPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#f4f3ef', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <AdSenseBootstrap />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 24px 100px' }}>
        <Link to="/" style={{ color: '#999', textDecoration: 'none', fontSize: 12 }}>← ASHES</Link>
        <p style={{ marginTop: 56, color: '#777', fontSize: 11, letterSpacing: '.16em' }}>ASHES GUIDES</p>
        <h1 style={{ fontSize: 'clamp(48px,8vw,88px)', lineHeight: .93, letterSpacing: '-.055em', margin: '14px 0 22px', maxWidth: 900 }}>Build products people can understand—and buy.</h1>
        <p style={{ maxWidth: 760, color: '#a6a39d', fontSize: 17, lineHeight: 1.75 }}>Original, practical guides about product image-to-3D, ecommerce viewers, Shopify, furniture 3D, shared AI memory and MCP. Written for merchants and builders, without filler.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginTop: 46 }}>
          {guides.map(guide => (
            <Link key={guide.slug} to={'/guides/' + guide.slug} style={{ textDecoration: 'none', color: 'inherit', border: '1px solid #242424', borderRadius: 18, padding: 24, background: '#0d0d0d', minHeight: 250, display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#777', fontSize: 10, letterSpacing: '.15em' }}>{guide.label}</span>
              <h2 style={{ fontSize: 25, lineHeight: 1.1, letterSpacing: '-.03em', margin: '18px 0 14px' }}>{guide.title}</h2>
              <p style={{ color: '#96938d', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{guide.desc}</p>
              <span style={{ marginTop: 'auto', paddingTop: 28, fontWeight: 800, fontSize: 12 }}>READ GUIDE ↗</span>
            </Link>
          ))}
        </div>
        <div style={{ marginTop: 52, borderTop: '1px solid #222', paddingTop: 24, display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
          <Link to="/contact" style={{ color: '#fff' }}>Start a 3D product pilot</Link>
          <Link to="/work" style={{ color: '#fff' }}>Selected work</Link>
          <Link to="/workspace" style={{ color: '#fff' }}>Try Ashes Brain</Link>
        </div>
      </section>
    </main>
  );
}