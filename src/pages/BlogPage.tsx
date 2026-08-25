import { ArrowUpRight, BrainCircuit, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Nav from '../components/Nav';
import { useSEO } from '../useSEO';
import { blogPosts } from './blogPosts';

export default function BlogPage() {
  useSEO({title:'Ashes Blog | AI, 3D, QR Codes & Digital Products',description:'Practical guides and product stories from Ashes covering AI, interactive 3D, QR codes, ecommerce and modern digital experiences.',path:'/blog'});
  return <><Nav/><main className="blog-index">
    <header className="blog-hero"><p>ASHES · BUILDS & PRACTICAL GUIDES</p><h1>Ideas worth building.<br/><span>Systems worth using.</span></h1><div className="blog-hero-bottom"><p>Explore Ashes projects, AI systems, 3D experiences, ecommerce experiments and practical guides for building better digital products.</p><Link to="/work">VIEW PROJECTS <ArrowUpRight/></Link></div></header>
    <section className="blog-grid" aria-label="Latest Ashes articles">
      <article className="blog-card featured"><div className="blog-card-meta"><span>NEW</span><span>CUTEQR</span><span>5 min read</span></div><QrCode aria-hidden="true"/><h2><Link to="/blog/cute-qr-code-generator">CuteQR: QR codes that people actually want to scan</Link></h2><p>See how CuteQR connects products, menus, brands and physical spaces to simple digital experiences — and try the live Ashes project.</p><Link className="blog-read" to="/blog/cute-qr-code-generator">READ ARTICLE <ArrowUpRight/></Link></article>
      {blogPosts.map((post,index)=><article className="blog-card" key={post.slug}><div className="blog-card-meta"><span>{String(index+2).padStart(2,'0')}</span><span>{post.category}</span><span>{post.readTime}</span></div><BrainCircuit aria-hidden="true"/><h2><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.description}</p><Link className="blog-read" to={`/blog/${post.slug}`}>READ ARTICLE <ArrowUpRight/></Link></article>)}
    </section>
    <section className="blog-cta"><p>EXPLORE WHAT ASHES BUILDS.</p><h2>From an idea<br/>to a live product.</h2><div><Link to="/work">VIEW PROJECTS</Link><Link to="/contact">START A PROJECT</Link></div></section>
  </main><Footer/></>;
}
