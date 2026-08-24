import { ArrowUpRight, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Nav from '../components/Nav';
import { useSEO } from '../useSEO';
import { blogPosts } from './blogPosts';

export default function BlogPage() {
  useSEO({
    title: 'Ashes Brain Blog | Shared AI Memory for ChatGPT, Claude & Codex',
    description: 'Practical guides to shared AI memory, MCP and keeping ChatGPT, Claude, Codex, Cursor and Gemini aligned on one project.',
    path: '/blog'
  });

  return <><Nav/><main className="blog-index">
    <header className="blog-hero">
      <p>ASHES BRAIN · PRACTICAL GUIDES</p>
      <h1>Stop repeating yourself<br/><span>to every AI.</span></h1>
      <div className="blog-hero-bottom"><p>Clear guides for connecting your AI tools, preserving project decisions and building with one shared source of truth.</p><Link to="/workspace">TRY ASHES BRAIN <ArrowUpRight/></Link></div>
    </header>
    <section className="blog-grid" aria-label="Latest Ashes Brain articles">
      {blogPosts.map((post, index) => <article className={index === 0 ? 'blog-card featured' : 'blog-card'} key={post.slug}>
        <div className="blog-card-meta"><span>{String(index + 1).padStart(2,'0')}</span><span>{post.category}</span><span>{post.readTime}</span></div>
        <BrainCircuit aria-hidden="true"/>
        <h2><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2>
        <p>{post.description}</p>
        <Link className="blog-read" to={`/blog/${post.slug}`}>READ ARTICLE <ArrowUpRight/></Link>
      </article>)}
    </section>
    <section className="blog-cta"><p>ONE PROJECT. EVERY AI.</p><h2>Give your next AI session<br/>the context it needs.</h2><div><Link to="/workspace">START FREE</Link><Link to="/pricing">VIEW PRO</Link></div></section>
  </main><Footer/></>;
}
