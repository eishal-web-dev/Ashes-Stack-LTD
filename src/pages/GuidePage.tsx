import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdSenseBootstrap from '../ads/AdSenseBootstrap';

type Article = {
  eyebrow: string;
  title: string;
  intro: string;
  description: string;
  keywords: string;
  sections: { title: string; body: string[] }[];
  faq?: { question: string; answer: string }[];
  commerce?: boolean;
};

const articles: Record<string, Article> = {
  'convert-product-image-to-3d-model': {
    commerce: true,
    eyebrow: 'IMAGE TO 3D · 7 MIN READ',
    title: 'How to convert a product image into a 3D model for ecommerce',
    description: 'Learn how product image-to-3D works, what makes a store-ready 3D model, and how to add an interactive 3D product viewer to an ecommerce store.',
    keywords: 'convert product image to 3D, image to 3D model, product photo to 3D, ecommerce 3D model, AI 3D product generator, interactive product viewer',
    intro: 'A flat product photo shows one angle. A store-ready 3D model lets a shopper rotate, zoom and understand the product before buying. Modern image-to-3D systems can reconstruct a usable model from product imagery, but reconstruction is only the first step: the asset must also be cleaned, compressed and delivered in a viewer that loads quickly on real phones.',
    sections: [
      { title: 'What product image-to-3D actually does', body: ['Image-to-3D software estimates the shape, depth, surface and appearance of an object from one or more images. It then creates geometry and textures that a browser can render interactively.', 'A single clear photo can produce a useful preview for some products. Several angles usually provide more reliable shape and texture information, especially for furniture, footwear and objects with hidden sides.'] },
      { title: 'From photo to store-ready model', body: ['A practical pipeline includes image preparation, reconstruction, geometry cleanup, texture correction, scale checks, web compression and quality control. The final file is commonly delivered as a lightweight GLB that keeps the model, materials and textures together.', 'The goal is not the highest polygon count. The goal is the smallest asset that still looks convincing on the product page. Heavy files increase waiting time and can reduce the value of the experience.'] },
      { title: 'Choose the right source image', body: ['Use a sharp, well-lit image with the complete product visible and limited obstruction. A plain or removable background helps the system separate the object from the scene.', 'Avoid motion blur, extreme filters, reflections that hide edges and cropped product parts. If accuracy matters, provide front, back and side views rather than asking one image to reveal information it cannot contain.'] },
      { title: 'Put the 3D model on an ecommerce page', body: ['The finished model needs an interactive web viewer with touch rotation, mouse controls, zoom, loading feedback and a fallback image. It can be embedded in a custom storefront or published through a commerce integration.', 'Place the viewer near the normal product gallery instead of hiding it at the bottom of the page. Give shoppers an obvious View in 3D control and preserve the existing buy flow.'] },
      { title: 'How Ashes approaches product 3D', body: ['Ashes is building an ecommerce 3D pipeline for turning product imagery into lightweight, store-ready experiences. The workflow covers reconstruction, quality control, web optimization, a premium viewer, publishing and measurement.', 'The point is not simply to generate a file. It is to help a merchant move from product image to an interactive selling experience that works inside the store.'] }
    ],
    faq: [
      { question: 'Can one product photo become a 3D model?', answer: 'Yes, a clear photo can produce a useful reconstruction, but unseen areas must be estimated. Multiple angles generally improve accuracy.' },
      { question: 'Which 3D format is best for ecommerce?', answer: 'GLB is widely used because it packages geometry, materials and textures in one web-friendly file.' },
      { question: 'Will a 3D product viewer slow down my store?', answer: 'It can if the asset is heavy. Compression, lazy loading and a lightweight viewer are essential for good performance.' }
    ]
  },
  '3d-product-viewer-for-shopify': {
    commerce: true,
    eyebrow: 'SHOPIFY 3D · 6 MIN READ',
    title: '3D product viewer for Shopify: what merchants need to know',
    description: 'A practical guide to adding a fast interactive 3D product viewer to Shopify, preparing GLB assets, protecting page speed and measuring shopper engagement.',
    keywords: '3D product viewer Shopify, Shopify 3D models, add 3D model to Shopify, interactive 3D Shopify products, Shopify product media GLB',
    intro: 'A 3D product viewer can help Shopify shoppers inspect shape, materials and details that are difficult to understand from a photo. The useful question is not whether a model spins. It is whether the experience loads quickly, fits the product page and helps the shopper make a confident decision.',
    sections: [
      { title: 'What a Shopify 3D viewer should provide', body: ['The viewer should support smooth drag rotation, touch gestures, zoom, loading feedback and a static fallback. It must behave well inside the existing product gallery on both desktop and mobile.', 'Good controls stay out of the shopper’s way. The product remains the focus, and selecting a variant or adding to cart should not become harder.'] },
      { title: 'Prepare a lightweight GLB', body: ['A raw model from a 3D tool is rarely ready for ecommerce. Geometry, materials and textures should be checked, compressed and tested under realistic network conditions.', 'Keep texture resolution appropriate for the product. A small decorative item and a detailed sofa do not need the same budget. Test the model on an average phone, not only a powerful development machine.'] },
      { title: 'Where to place 3D on the product page', body: ['Treat 3D as part of the product media gallery. Use a clear thumbnail or button so shoppers know the experience exists, and retain high-quality photos for instant recognition and accessibility.', 'For products where dimensions matter, pair the model with visible measurements and concise product information. 3D should answer questions rather than act as decoration.'] },
      { title: 'Measure whether shoppers use it', body: ['Track viewer opens, interaction rate, time engaged, add-to-cart after interaction and conversion by device. These signals tell you whether customers find the experience useful.', 'Compare similar products and avoid claiming that 3D alone caused every sale. Product quality, price, traffic source and page speed still influence conversion.'] },
      { title: 'A practical rollout', body: ['Start with one high-value product that shoppers often need to inspect from several angles. Build and optimize that model, publish it, verify the mobile experience and measure behavior before expanding the catalog.', 'Ashes is designed around this store-ready workflow: imagery to reconstruction, quality control, lightweight delivery, viewer publishing and analytics.'] }
    ],
    faq: [
      { question: 'Can Shopify display GLB product models?', answer: 'Shopify storefronts can support 3D product media, but implementation and theme behavior should be tested on the specific store.' },
      { question: 'Should every Shopify product have 3D?', answer: 'Start with products where shape, scale or detail affects the purchase decision, then expand based on measured engagement.' },
      { question: 'Does 3D replace product photography?', answer: 'No. Strong photos provide fast recognition and fallback media; 3D adds interactive inspection.' }
    ]
  },
  '3d-product-photography-vs-interactive-3d': {
    commerce: true,
    eyebrow: 'ECOMMERCE VISUALS · 5 MIN READ',
    title: 'Product photography vs interactive 3D: which should your store use?',
    description: 'Compare ecommerce product photography with interactive 3D models, including cost, speed, shopper experience and the best hybrid product-page strategy.',
    keywords: '3D product photography, interactive 3D ecommerce, product photography vs 3D, 360 product viewer, ecommerce product visuals',
    intro: 'Product photography and interactive 3D solve different problems. Photos communicate instantly and can show styling, context and emotion. Interactive 3D gives shoppers control over the angle and helps them inspect form. Most stores do not need to choose only one.',
    sections: [
      { title: 'Where product photography wins', body: ['Photography loads quickly, works everywhere and is ideal for lifestyle scenes, close-ups and brand storytelling. A strong first image can communicate the product in a fraction of a second.', 'Photography is also predictable. Merchants can art-direct lighting, composition and environment without asking the shopper to interact.'] },
      { title: 'Where interactive 3D wins', body: ['Interactive 3D is useful when shoppers care about shape, construction, hidden sides or spatial understanding. Furniture, footwear, accessories and technical products often benefit from controlled inspection.', 'One model can provide many angles without loading a separate photograph for every view, although the 3D asset itself must still be optimized.'] },
      { title: 'What about 360-degree photography?', body: ['A 360 spin typically switches between a sequence of photographs as the shopper drags. It can look highly realistic but remains limited to the captured path.', 'A true 3D model can be viewed more freely and may support additional experiences. The tradeoff is that reconstruction, cleanup and rendering require a different production workflow.'] },
      { title: 'The strongest product page uses both', body: ['Lead with a fast, high-quality product image. Add detail and lifestyle photos, then offer a clearly labelled interactive 3D view for shoppers who want deeper inspection.', 'This hybrid approach preserves speed and storytelling while giving interested customers more control. Test the ordering of media on mobile as well as desktop.'] },
      { title: 'How to decide where to start', body: ['Choose products with high consideration, strong visual form or repeated questions about dimensions and angles. Publish a small pilot and compare engagement with similar products.', 'Do not rebuild the entire catalog before learning. One carefully chosen SKU can show whether interactive 3D belongs in your store’s product experience.'] }
    ],
    faq: [
      { question: 'Is interactive 3D better than product photography?', answer: 'Not universally. Photography is best for instant communication and lifestyle context; 3D is best for shopper-controlled inspection.' },
      { question: 'Is a 360 spin the same as a 3D model?', answer: 'No. A 360 spin usually uses a sequence of photos, while a 3D model contains geometry that can be rendered from different views.' }
    ]
  },
  'how-3d-commerce-helps-furniture-stores': {
    commerce: true,
    eyebrow: 'FURNITURE 3D · 6 MIN READ',
    title: 'How interactive 3D helps furniture stores sell online',
    description: 'Learn why furniture ecommerce benefits from interactive 3D products, what merchants should model first and how to launch a fast store-ready 3D pilot.',
    keywords: '3D furniture ecommerce, furniture 3D product viewer, interactive furniture model, furniture visualization online, 3D commerce furniture stores',
    intro: 'Furniture is difficult to judge from a small set of flat images. Shoppers want to understand silhouette, proportions, materials and construction before making a high-consideration purchase. Interactive 3D can give them a clearer product view without replacing the photography, dimensions and information they already rely on.',
    sections: [
      { title: 'Why furniture is a strong fit for 3D commerce', body: ['Furniture has visible structure from every angle. The side and back of a chair, the depth of a sofa and the shape of a table base can influence whether the product feels right.', 'Because these products can be expensive to ship and difficult to return, clearer pre-purchase information has practical value for both the shopper and merchant.'] },
      { title: 'What shoppers should be able to inspect', body: ['Let shoppers rotate the complete object, zoom into meaningful construction details and return to a sensible default view. Pair the model with exact dimensions, material descriptions and normal product imagery.', 'Do not use 3D to imply scale unless the experience provides a trustworthy reference. A visually impressive model cannot replace accurate measurements.'] },
      { title: 'Choose the first furniture SKU', body: ['Start with a visually distinctive, high-value item that receives meaningful traffic. It should have clear imagery and a shape that benefits from more than a front view.', 'A chair, armchair, side table or compact sofa can make a practical pilot. Avoid beginning with an entire catalog or a highly configurable collection before the basic workflow is proven.'] },
      { title: 'Keep the mobile experience fast', body: ['Furniture models can become heavy because fabrics, wood and construction details invite large textures and dense geometry. Web optimization should preserve the features shoppers notice while removing invisible cost.', 'Use progressive or lazy loading, show a fallback image immediately and test touch controls on mid-range phones. The viewer should add confidence, not delay the product page.'] },
      { title: 'Build a repeatable catalog workflow', body: ['Once the pilot works, define consistent image requirements, quality checks, scale rules, compression targets and publishing steps. A repeatable system matters more than one perfect showcase model.', 'Ashes is focusing its store-ready image-to-3D workflow on furniture first, connecting reconstruction, quality control, lightweight delivery, a premium viewer and engagement measurement.'] }
    ],
    faq: [
      { question: 'Which furniture products should get 3D first?', answer: 'Prioritize high-value or visually distinctive products where side, back, depth or construction details matter to shoppers.' },
      { question: 'Does a 3D model show the real size of furniture?', answer: 'Not by itself. Stores should show exact measurements and only use spatial placement features when scale is implemented and tested carefully.' }
    ]
  },
  'shared-ai-memory-chatgpt-claude-gemini': {
    eyebrow: 'SHARED AI MEMORY · 8 MIN READ',
    title: 'Shared AI memory: one brain for ChatGPT, Claude and Gemini',
    description: 'Learn how shared AI memory gives ChatGPT, Claude and Gemini the same approved project context through one secure AI brain.',
    keywords: 'shared AI memory, AI second brain, ChatGPT Claude shared memory, MCP memory server',
    intro: 'Using several AI assistants usually means explaining the same project repeatedly. A shared AI memory puts durable goals, decisions and handoffs in one secure place so approved AI clients can continue from the same source of truth.',
    sections: [
      { title: 'What is shared AI memory?', body: ['Shared AI memory is a persistent project layer outside any single chat provider. It stores goals, decisions, constraints, blockers and handoffs that should survive after a conversation ends.', 'The assistants do not directly read one another’s private chats. Each approved client accesses the same intentionally saved project context.'] },
      { title: 'Why AI chats are isolated', body: ['ChatGPT, Claude and Gemini are separate products with separate accounts and histories. That isolation protects users, but it also creates repeated explanations.', 'Manual summaries work for short projects. A project brain becomes more useful as decisions, tools and collaborators increase.'] },
      { title: 'How MCP can connect the brain', body: ['The Model Context Protocol gives AI applications a standard way to use external tools and data. A memory server can expose focused actions to read context, search memory, remember a fact and create a handoff.', 'MCP is the connector rather than the memory itself. Authentication and narrow permissions remain essential.'] },
      { title: 'How Ashes Brain helps', body: ['Ashes Brain keeps project goals, decisions, memories and handoffs together and exposes approved tools through a remote MCP endpoint.', 'The aim is simple: save an important fact once and let the next approved AI continue with the same project context.'] }
    ]
  },
  'share-memory-between-chatgpt-and-claude': {
    eyebrow: 'SHARED AI MEMORY',
    title: 'How to share project memory between ChatGPT and Claude',
    description: 'Learn how an external project brain can carry approved goals, decisions and handoffs between ChatGPT and Claude.',
    keywords: 'share memory ChatGPT Claude, shared AI project memory, ChatGPT Claude context',
    intro: 'ChatGPT and Claude normally do not share private histories. A shared-memory service solves that by storing durable project context in one place both approved clients can access.',
    sections: [
      { title: 'Why the two AIs forget each other', body: ['Each provider maintains its own accounts, chats and storage. A conversation in one product is not automatically visible in another.', 'This separation is expected. Context must be transferred manually or placed in a shared service with the user’s permission.'] },
      { title: 'The shared-brain pattern', body: ['A shared brain combines a project store, authorization and narrow AI tools. It can hold goals, technical decisions and handoffs without exposing provider passwords.', 'Work in one AI, save the durable decision, then ask the next approved AI to read the same project before continuing.'] },
      { title: 'What should be stored', body: ['Store information another AI would need tomorrow: the goal, requirements, chosen approach, rejected options, blockers and next action.', 'Compact structured memory is more useful than dumping every transcript into the project.'] }
    ]
  },
  'what-is-mcp': {
    eyebrow: 'MCP EXPLAINED',
    title: 'What is MCP? A simple guide to the Model Context Protocol',
    description: 'A plain-language guide to MCP clients, servers, tools, authentication and shared AI memory.',
    keywords: 'what is MCP, Model Context Protocol, MCP server, AI tools protocol',
    intro: 'MCP is a standard way for an AI client to discover and use tools or data exposed by another service. Think of it as a common plug shape for AI integrations.',
    sections: [
      { title: 'Client, server and tools', body: ['The client is the AI application. The server exposes capabilities. Tools are focused actions such as search, read a record or save a memory.', 'A shared format reduces the need to invent a completely different integration for every compatible AI client.'] },
      { title: 'Authentication still matters', body: ['MCP does not grant unlimited access. A production server still needs authentication, authorization, input validation and clear tool boundaries.', 'Read and write capabilities should be explicit, scoped to the user and revocable.'] },
      { title: 'A shared-memory example', body: ['An MCP memory server might expose list projects, get context, search, remember and handoff. One AI saves a decision; another reads the same approved project later.', 'That is the core pattern behind Ashes Brain.'] }
    ]
  },
  'connect-claude-to-mcp-server': {
    eyebrow: 'CLAUDE + MCP',
    title: 'How to connect Claude to a remote MCP server',
    description: 'Learn the typical steps and safety checks for connecting Claude to a trusted remote MCP server.',
    keywords: 'connect Claude MCP server, Claude remote MCP, Claude connector',
    intro: 'A remote MCP connection normally involves adding the server URL, reviewing permissions, completing authentication and testing a harmless read operation.',
    sections: [
      { title: 'Before you connect', body: ['Only connect to a server you trust. Check for HTTPS, a privacy policy and a clear explanation of the available tools.', 'For Ashes Brain, the remote endpoint is https://www.ashesstack.cloud/mcp.'] },
      { title: 'Typical setup flow', body: ['Open Claude connector settings, add the remote server URL and complete the authorization flow if prompted.', 'After connecting, start by listing projects or reading a small record before allowing write actions.'] },
      { title: 'Security checks', body: ['A connector should never ask you to paste your Claude password into a third-party service. Authentication should be scoped and revocable.', 'Review write tools carefully and keep sensitive projects limited to the minimum necessary context.'] }
    ]
  }
};

export default function GuidePage() {
  const { slug = '' } = useParams();
  const article = articles[slug];

  useEffect(() => {
    if (!article) return;
    const url = 'https://www.ashesstack.cloud/guides/' + slug;
    const previousTitle = document.title;
    document.title = article.title + ' | Ashes Stack';

    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = content;
    };
    setMeta('meta[name="description"]', 'name', 'description', article.description);
    setMeta('meta[name="keywords"]', 'name', 'keywords', article.keywords);
    setMeta('meta[property="og:title"]', 'property', 'og:title', article.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', article.description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'article');
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', article.title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', article.description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.dataset.ashesGuide = slug;
    schema.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      datePublished: '2026-08-24',
      dateModified: '2026-08-24',
      mainEntityOfPage: url,
      author: { '@type': 'Person', name: 'Eishal' },
      publisher: { '@type': 'Organization', name: 'Ashes Stack', url: 'https://www.ashesstack.cloud/' },
      ...(article.faq?.length ? {
        hasPart: {
          '@type': 'FAQPage',
          mainEntity: article.faq.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer }
          }))
        }
      } : {})
    });
    document.head.appendChild(schema);
    return () => {
      document.title = previousTitle;
      schema.remove();
    };
  }, [article, slug]);

  if (!article) {
    return <main style={{ minHeight: '100vh', background: '#080808', color: '#fff', padding: 72 }}><h1>Guide not found.</h1><Link to="/guides" style={{ color: '#fff' }}>Back to guides</Link></main>;
  }

  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#f3f3ef', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <AdSenseBootstrap />
      <article style={{ maxWidth: 820, margin: '0 auto', padding: '72px 24px 110px' }}>
        <Link to="/guides" style={{ color: '#999', textDecoration: 'none', fontSize: 12 }}>← ASHES GUIDES</Link>
        <p style={{ marginTop: 54, color: '#777', fontSize: 11, letterSpacing: '.16em' }}>{article.eyebrow}</p>
        <h1 style={{ fontSize: 'clamp(42px,7vw,72px)', lineHeight: .98, letterSpacing: '-.05em', margin: '14px 0 26px' }}>{article.title}</h1>
        <p style={{ color: '#aaa69f', lineHeight: 1.8, fontSize: 18 }}>{article.intro}</p>

        {article.sections.map(section => (
          <section key={section.title} style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 28, letterSpacing: '-.025em', marginBottom: 14 }}>{section.title}</h2>
            {section.body.map(paragraph => <p key={paragraph} style={{ color: '#a6a39d', lineHeight: 1.85, fontSize: 16 }}>{paragraph}</p>)}
          </section>
        ))}

        {article.faq?.length ? (
          <section style={{ marginTop: 52 }}>
            <p style={{ color: '#777', fontSize: 11, letterSpacing: '.16em' }}>FREQUENTLY ASKED QUESTIONS</p>
            <h2 style={{ fontSize: 32, letterSpacing: '-.03em' }}>Questions answered</h2>
            {article.faq.map(item => (
              <details key={item.question} style={{ borderTop: '1px solid #242424', padding: '18px 0' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 750, fontSize: 17 }}>{item.question}</summary>
                <p style={{ color: '#a6a39d', lineHeight: 1.8, fontSize: 15 }}>{item.answer}</p>
              </details>
            ))}
          </section>
        ) : null}

        <aside style={{ marginTop: 56, padding: 24, border: '1px solid #242424', borderRadius: 16, background: '#0d0d0d' }}>
          <span style={{ color: '#777', fontSize: 10, letterSpacing: '.15em' }}>{article.commerce ? 'ASHES · PRODUCT 3D' : 'ASHES BRAIN'}</span>
          <h2 style={{ fontSize: 28, margin: '12px 0 8px' }}>{article.commerce ? 'Turn your product imagery into store-ready 3D.' : 'Tell one. All of them know.'}</h2>
          <p style={{ color: '#999', lineHeight: 1.7 }}>{article.commerce ? 'Start with one product and build an interactive experience designed for real ecommerce pages.' : 'Keep project context in one shared brain and connect supported AI clients through MCP.'}</p>
          <Link to={article.commerce ? '/contact' : '/workspace'} style={{ color: '#fff', fontWeight: 800 }}>{article.commerce ? 'START A 3D PRODUCT PILOT ↗' : 'TRY ASHES BRAIN ↗'}</Link>
        </aside>

        <div style={{ marginTop: 48, borderTop: '1px solid #222', paddingTop: 22, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Link to="/guides" style={{ color: '#fff' }}>More guides</Link>
          <Link to="/work" style={{ color: '#fff' }}>Selected work</Link>
          <Link to="/contact" style={{ color: '#fff' }}>Contact Ashes</Link>
        </div>
      </article>
    </main>
  );
}