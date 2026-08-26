import { ArrowLeft, ArrowUpRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Nav from '../components/Nav';
import { useSEO } from '../useSEO';

const SAYIT = 'https://aireply-dusky.vercel.app';

export default function SayItClientReplyBlogPage() {
  useSEO({
    title: 'What Should I Say to a Client? Professional Reply Examples | Ashes',
    description: 'Professional client reply examples for price objections, ghosting, discounts, revisions, payment follow-ups and difficult messages. Try SayIt for a reply tailored to your exact situation.',
    path: '/blog/what-should-i-say-to-a-client',
  });

  return <><Nav/><main className="blog-post"><article>
    <Link className="blog-back" to="/blog"><ArrowLeft/> ALL ARTICLES</Link>
    <header>
      <div className="blog-post-meta"><span>SAYIT</span><time dateTime="2026-08-26">26 AUGUST 2026</time><span>6 min read</span></div>
      <h1>What should I say to a client?</h1>
      <p>When a client sends an awkward, vague or difficult message, the hardest part is often deciding how to reply without sounding rude, desperate or unprofessional. Here are practical reply patterns you can adapt, plus a faster option when the situation is too specific for a template.</p>
    </header>

    <div className="blog-post-layout"><aside>
      <span>IN THIS GUIDE</span>
      <a href="#expensive">01 Too expensive</a>
      <a href="#ghosted">02 Client stopped replying</a>
      <a href="#discount">03 Discount request</a>
      <a href="#payment">04 Payment follow-up</a>
      <a href="#revision">05 Revision request</a>
      <a href="#sayit">06 Generate your reply</a>
      <a href={SAYIT} target="_blank" rel="noreferrer">OPEN SAYIT <ArrowUpRight/></a>
    </aside>

    <div className="blog-content">
      <section id="expensive"><span>01</span><h2>When a client says your price is too high</h2><p>Do not immediately cut the price. A better reply acknowledges the concern and brings the conversation back to scope and value.</p><p><strong>Example:</strong> “I understand. The price reflects the full scope we discussed, including the design, development and testing. If you have a fixed budget, I can reduce the scope and suggest a smaller first version that still gives you a strong result.”</p></section>

      <section id="ghosted"><span>02</span><h2>When a client stopped replying</h2><p>Keep the follow-up short and easy to answer. Do not send a long paragraph explaining why you need a response.</p><p><strong>Example:</strong> “Hi, just following up on this. Are you still planning to move forward, or should I close this out for now? Either is completely fine — I just wanted to check before I schedule other work.”</p></section>

      <section id="discount"><span>03</span><h2>When a client asks for a discount</h2><p>If you want to protect your rate, trade price for scope instead of simply lowering the price.</p><p><strong>Example:</strong> “I can work within a lower budget by reducing the scope. We could start with the landing page first and add the remaining sections later, rather than compromising the quality of the full project.”</p></section>

      <section id="payment"><span>04</span><h2>How to ask a client for payment politely</h2><p>Be direct, factual and calm. Include the invoice or payment reference so the client can act immediately.</p><p><strong>Example:</strong> “Hi, a quick reminder that invoice #102 is still outstanding. Could you please confirm when payment is expected? I have attached the invoice again here for convenience. Thank you.”</p></section>

      <section id="revision"><span>05</span><h2>When a client keeps asking for more revisions</h2><p>Separate included revisions from new scope without making the message confrontational.</p><p><strong>Example:</strong> “Happy to make that change. The original revision allowance has now been used, so this would fall under additional work. I can send you the small extra cost before I continue.”</p></section>

      <section id="sayit"><span>06</span><h2>Your situation is probably more specific than a template</h2><p>Templates help with common situations, but the exact wording changes depending on what the client said, your relationship with them, the tone you want and what outcome you need.</p><p>SayIt is an Ashes product that turns a pasted message or screenshot into a polished reply. You can choose a professional, friendly, concise or firmer response instead of rewriting the same message five times.</p><p><a href={SAYIT} target="_blank" rel="noreferrer">Open SayIt and generate a reply for your exact message →</a></p></section>

      <section className="blog-faq"><span>FAQ</span><h2>Frequently asked questions</h2>
        <details><summary>What should I say when a client says my price is too high?</summary><p>Acknowledge the concern, explain what the price covers and offer a smaller scope if the budget is fixed rather than immediately discounting the same work.</p></details>
        <details><summary>How do I follow up with a client without sounding desperate?</summary><p>Keep it short, make the decision easy and avoid repeatedly asking whether they saw your previous message.</p></details>
        <details><summary>Can I use AI to reply to clients?</summary><p>Yes. Use it as a drafting assistant and review the final message before sending, especially for prices, deadlines, promises or sensitive customer issues.</p></details>
      </section>
    </div></div>
  </article>

  <section className="blog-post-cta"><MessageCircle/><p>NOT SURE WHAT TO SAY?</p><h2>Paste the message.<br/>Get the reply.</h2><div><a href={SAYIT} target="_blank" rel="noreferrer">TRY SAYIT</a><Link to="/work">MORE ASHES PRODUCTS</Link></div></section>
  </main><Footer/></>;
}
