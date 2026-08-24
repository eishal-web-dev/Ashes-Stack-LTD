import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Nav from '../components/Nav';
import { getBlogPost } from './blogPosts';

const SITE = 'https://www.ashesstack.cloud';

export default function BlogPostPage() {
  const { slug = '' } = useParams();
  const post = getBlogPost(slug);

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} | Ashes Brain`;
    const setMeta = (selector: string, attr: 'name'|'property', key: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.content = value;
    };
    setMeta('meta[name="description"]','name','description',post.description);
    setMeta('meta[name="keywords"]','name','keywords',post.keywords.join(', '));
    setMeta('meta[property="og:title"]','property','og:title',post.title);
    setMeta('meta[property="og:description"]','property','og:description',post.description);
    setMeta('meta[property="og:type"]','property','og:type','article');
    setMeta('meta[property="og:url"]','property','og:url',`${SITE}/blog/${post.slug}`);
    setMeta('meta[name="twitter:card"]','name','twitter:card','summary_large_image');
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = `${SITE}/blog/${post.slug}`;
    const schema = document.createElement('script'); schema.type = 'application/ld+json'; schema.id = 'blog-schema';
    schema.text = JSON.stringify({ '@context':'https://schema.org', '@type':'BlogPosting', headline:post.title, description:post.description, datePublished:post.published, dateModified:post.published, author:{'@type':'Organization',name:'Ashes Stack'}, publisher:{'@type':'Organization',name:'Ashes Stack'}, mainEntityOfPage:`${SITE}/blog/${post.slug}`, keywords:post.keywords.join(', ') });
    document.getElementById('blog-schema')?.remove(); document.head.appendChild(schema);
    return () => schema.remove();
  }, [post]);

  if (!post) return <Navigate to="/blog" replace/>;

  return <><Nav/><main className="blog-post">
    <article>
      <Link className="blog-back" to="/blog"><ArrowLeft/> ALL ARTICLES</Link>
      <header><div className="blog-post-meta"><span>{post.category}</span><time dateTime={post.published}>24 AUGUST 2026</time><span>{post.readTime}</span></div><h1>{post.title}</h1><p>{post.intro}</p></header>
      <div className="blog-post-layout"><aside><span>IN THIS GUIDE</span>{post.sections.map((section,index)=><a key={section.heading} href={`#section-${index+1}`}>{String(index+1).padStart(2,'0')} {section.heading}</a>)}<Link to="/workspace">TRY ASHES BRAIN <ArrowUpRight/></Link></aside>
        <div className="blog-content">{post.sections.map((section,index)=><section id={`section-${index+1}`} key={section.heading}><span>{String(index+1).padStart(2,'0')}</span><h2>{section.heading}</h2>{section.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}{section.steps&&<ol>{section.steps.map(step=><li key={step}>{step}</li>)}</ol>}</section>)}
          <section className="blog-faq"><span>FAQ</span><h2>Frequently asked questions</h2>{post.faq.map(item=><details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
        </div>
      </div>
    </article>
    <section className="blog-post-cta"><p>STOP STARTING FROM ZERO.</p><h2>Save the project once.<br/>Continue from any AI.</h2><div><Link to="/workspace">START FREE</Link><Link to="/brain/docs">CONNECT YOUR AI</Link></div></section>
  </main><Footer/></>;
}
