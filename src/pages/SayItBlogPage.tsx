import { useEffect } from 'react';
import { ArrowLeft, ArrowUpRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Nav from '../components/Nav';
import { useSEO } from '../useSEO';

const SAYIT='https://aireply-dusky.vercel.app';
const PATH='/blog/what-should-i-say-to-a-client';

const faqs=[
  {q:'What should I say when a client says my price is too high?',a:'Acknowledge the budget concern without immediately discounting. Briefly explain the value or scope, then offer a smaller option if you genuinely have one.'},
  {q:'What should I say when a client says they will think about it?',a:'Keep the reply light: thank them, remove pressure, and give them one clear way to come back when they are ready.'},
  {q:'How do I follow up with a client who stopped replying?',a:'Send a short message that references the project, asks whether they still want to continue, and makes it easy to answer yes, no, or later.'},
  {q:'How can I reply to a difficult client professionally?',a:'Respond to the specific issue, avoid emotional language, confirm what you can do next, and put important scope, timing, or payment points in writing.'},
  {q:'Is there an AI tool that writes client replies?',a:'SayIt is an Ashes product that turns a pasted message or screenshot into a reply in the tone and language you choose.'}
];

export default function SayItBlogPage(){
  useSEO({title:'What Should I Say to a Client? Professional Reply Examples + AI Reply Tool | Ashes',description:'Not sure what to reply to a client? Use ready-to-send examples for price objections, follow-ups, discounts, delays, revisions and awkward client messages, or generate a reply with SayIt.',path:PATH});

  useEffect(()=>{
    const id='sayit-faq-schema';
    document.getElementById(id)?.remove();
    const script=document.createElement('script');
    script.id=id;
    script.type='application/ld+json';
    script.text=JSON.stringify({
      '@context':'https://schema.org',
      '@type':'FAQPage',
      mainEntity:faqs.map(item=>({'@type':'Question',name:item.q,acceptedAnswer:{'@type':'Answer',text:item.a}}))
    });
    document.head.appendChild(script);
    return()=>script.remove();
  },[]);

  return <><Nav/><main className="blog-post"><article>
    <Link className="blog-back" to="/blog"><ArrowLeft/> ALL ARTICLES</Link>
    <header>
      <div className="blog-post-meta"><span>CLIENT REPLIES</span><time dateTime="2026-08-25">25 AUGUST 2026</time><span>8 min read</span></div>
      <h1>What should I say to a client? Replies for the messages freelancers hate answering</h1>
      <p>A client says your price is too high. They ask for another revision. They disappear for a week and suddenly want the project tomorrow. The difficult part is usually not knowing what you want to say — it is finding wording that is clear, calm and professional. This guide gives you practical replies, plus a faster option when the message is too specific for a template.</p>
    </header>

    <div className="blog-post-layout"><aside>
      <span>IN THIS GUIDE</span>
      <a href="#price">01 Price is too high</a>
      <a href="#think">02 I will think about it</a>
      <a href="#ghosted">03 Client stopped replying</a>
      <a href="#discount">04 Discount requests</a>
      <a href="#revision">05 Too many revisions</a>
      <a href="#urgent">06 Urgent deadline</a>
      <a href="#angry">07 Unhappy client</a>
      <a href="#sayit">08 Generate your reply</a>
      <a href={SAYIT} target="_blank" rel="noreferrer">OPEN SAYIT <ArrowUpRight/></a>
    </aside>

    <div className="blog-content">
      <section id="price"><span>01</span><h2>Client says: “Your price is too high.”</h2><p>Do not panic and slash the price immediately. First show that you understand the concern, then connect the price to the actual scope.</p><p><strong>Reply:</strong> “I understand. The quote is based on the full scope we discussed, including the design, development and revisions. If you have a fixed budget, I can also reduce the scope and suggest a smaller version that still covers the most important part.”</p><p>This keeps the conversation open without making your original price look random.</p></section>

      <section id="think"><span>02</span><h2>Client says: “I’ll think about it.”</h2><p>Do not send a long sales message. Make it comfortable for them to come back.</p><p><strong>Reply:</strong> “Of course, no problem. Take your time. If you want, I can also send a short breakdown of the scope so it is easier to compare your options.”</p></section>

      <section id="ghosted"><span>03</span><h2>What should I say to a client who stopped replying?</h2><p>A good follow-up does not sound offended. It simply asks for a decision.</p><p><strong>Reply:</strong> “Hey, just checking in on the project. Are you still planning to move forward with it? No pressure either way — I just want to know whether I should keep the slot open.”</p><p>For a second follow-up, make it even shorter. Repeating the entire pitch usually makes the message easier to ignore.</p></section>

      <section id="discount"><span>04</span><h2>Client asks: “Can you do it cheaper?”</h2><p>Instead of reducing the same work for less money, change the scope.</p><p><strong>Reply:</strong> “I can work with a smaller budget, but I would reduce the scope rather than the quality. For example, we can start with the main page first and add the remaining sections later.”</p></section>

      <section id="revision"><span>05</span><h2>Client keeps asking for extra revisions</h2><p>This is where polite boundaries matter.</p><p><strong>Reply:</strong> “Happy to make that change. We have completed the revisions included in the original scope, so this would be an additional revision. I can add it for [amount] and send the updated version by [date].”</p><p>Keep the message factual. You do not need to argue about whether the revision is small.</p></section>

      <section id="urgent"><span>06</span><h2>Client suddenly needs everything urgently</h2><p>Do not promise a deadline you cannot meet just because the customer sounds stressed.</p><p><strong>Reply:</strong> “I can prioritize this, but the earliest realistic delivery I can commit to is [date/time]. If that works for you, I’ll lock it in and focus on the priority items first.”</p></section>

      <section id="angry"><span>07</span><h2>What should I say to an unhappy client?</h2><p>Do not match their tone. Separate the emotion from the issue that can actually be fixed.</p><p><strong>Reply:</strong> “I understand why you are frustrated. I reviewed the issue and the part I can correct is [specific issue]. I can have that updated by [time]. For the remaining request, it falls outside the original scope, so I can quote that separately if you want to continue with it.”</p></section>

      <section id="sayit"><span>08</span><h2>When the client message is too specific for a template, use SayIt</h2><p>Templates are useful until the message contains context that changes the answer. SayIt is an Ashes AI product built for that exact moment. Paste the client message or upload a screenshot, choose the tone and context, and generate a reply you can edit before sending.</p><p>It can help with freelance clients, WhatsApp messages, email, customer support, social media and everyday conversations.</p><p><a href={SAYIT} target="_blank" rel="noreferrer">Try SayIt free →</a></p><p>You can also see SayIt in the <Link to="/work">Ashes project catalog</Link>.</p></section>

      <section className="blog-faq"><span>FAQ</span><h2>Common searches about replying to clients</h2>{faqs.map(item=><details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</section>
    </div></div>
  </article>
  <section className="blog-post-cta"><MessageCircle/><p>DON'T STARE AT THE REPLY BOX.</p><h2>Paste the message.<br/>SayIt writes the reply.</h2><div><a href={SAYIT} target="_blank" rel="noreferrer">TRY SAYIT FREE</a><Link to="/work">MORE ASHES PRODUCTS</Link></div></section>
  </main><Footer/></>;
}
