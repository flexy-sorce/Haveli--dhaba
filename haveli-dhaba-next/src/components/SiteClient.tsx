"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BookingForm from "./BookingForm";
import type { GalleryImg, MenuCat, Settings } from "@/data/defaults";

const MAPS = "https://www.google.com/maps/search/?api=1&query=Haveli+Dhaba+Ulda+Jharkhand+832304";
const NAV: [string, string][] = [["#about", "Story"], ["#menu", "Menu"], ["#experience", "Experience"], ["#gallery", "Gallery"], ["#contact", "Visit"]];

function HomeOrdering({ menu, gallery }: { menu: MenuCat[]; gallery: GalleryImg[] }) {
  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const categories = menu.slice(0, 6);
  const pricedItems = useMemo(() => menu.flatMap((category) => category.items.filter((item) => item.price !== null && item.id).map((item) => ({ ...item, category: category.name }))), [menu]);
  const popular = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (term ? pricedItems.filter((item) => item.name.toLowerCase().includes(term)) : pricedItems).slice(0, 4);
  }, [pricedItems, query]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("haveli-cart") || "{}") as Record<string, number>;
      setCartCount(Object.values(saved).reduce((sum, count) => sum + count, 0));
    } catch { setCartCount(0); }
  }, []);

  function addToCart(id: string) {
    try {
      const saved = JSON.parse(localStorage.getItem("haveli-cart") || "{}") as Record<string, number>;
      saved[id] = Math.min((saved[id] || 0) + 1, 50);
      localStorage.setItem("haveli-cart", JSON.stringify(saved));
      setCartCount((count) => count + 1);
    } catch { /* Order page remains the source of truth if storage is unavailable. */ }
  }

  return <section className="quick-order" aria-label="Order from Haveli Dhaba">
    <div className="quick-order-head">
      <div>
        <span className="eyebrow">Good food, close by</span>
        <h1>What are you <em>craving?</em></h1>
        <p><span className="location-pin">⌖</span> Delivering around Ulda, Jharkhand</p>
      </div>
      <a className="cart-indicator" href="/order#cart" aria-label={`Cart with ${cartCount} items`}><span>◇</span><b>{cartCount}</b></a>
    </div>
    <label className="home-search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search biryani, paneer, tandoor..." /></label>
    <div className="category-chips" aria-label="Food categories">{categories.map((category) => <a key={category.name} href="#menu" onClick={() => setQuery(category.name)}>{category.name}</a>)}</div>
    <a className="featured-food" href="#menu">
      <img src={gallery[0]?.src || "/images/photo-6.jpg"} alt={gallery[0]?.alt || "Haveli Dhaba"} />
      <span className="featured-shade"></span>
      <div><span className="featured-kicker">The Haveli welcome</span><strong>Comfort food,<br /><em>made generously.</em></strong><span className="featured-link">Explore the menu <b>↗</b></span></div>
    </a>
    <div className="popular-heading"><div><span className="eyebrow">From the kitchen</span><h2>Popular <em>today</em></h2></div><a href="#menu">See menu <span>↗</span></a></div>
    {popular.length ? <div className="popular-grid">{popular.map((item, index) => <article className="popular-card" key={item.id}>
      <a href="/order#cart" className="popular-photo"><img src={item.image_url || gallery[(index + 1) % Math.max(gallery.length, 1)]?.src || "/images/photo-6.jpg"} alt="" /><span className="verified-price">₹{Number(item.price).toLocaleString("en-IN")}</span></a>
      <div className="popular-card-copy"><span>{item.category}</span><h3>{item.name}</h3><button type="button" onClick={() => addToCart(item.id!)} aria-label={`Add ${item.name} to cart`}>+</button></div>
    </article>)}</div> : <div className="price-empty"><span>✦</span><p>Popular dishes will appear here when the restaurant publishes confirmed prices.</p><a href="#menu">Browse the full menu <b>↗</b></a></div>}
  </section>;
}

function Menu({ menu }: { menu: MenuCat[] }) {
  const [cat, setCat] = useState(0);
  const [query, setQuery] = useState("");
  const list = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return (menu[cat]?.items ?? []).map((item) => ({ ...item, category: menu[cat]?.name }));
    return menu.flatMap((category) => category.items.filter((item) => item.name.toLowerCase().includes(term)).map((item) => ({ ...item, category: category.name })));
  }, [menu, cat, query]);
  return (
    <div className="menu-explorer">
      <div className="menu-toolbar">
        <div className="search-field"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search our menu" aria-label="Search menu" /></div>
        <a className="btn btn-primary" href="/order">Order online <span aria-hidden="true">↗</span></a>
      </div>
      <div className="tabs" role="tablist" aria-label="Menu categories">{menu.map((category, index) => <button key={category.name} className="tab" role="tab" aria-selected={!query && index === cat} onClick={() => { setCat(index); setQuery(""); }}>{category.name}</button>)}</div>
      <div className="menu-grid" aria-live="polite">
        {list.length ? list.map((item, index) => (
          <article className="menu-card" key={`${item.name}-${index}`}>
            {item.image_url ? <img src={item.image_url} alt="" loading="lazy" /> : <div className="menu-card-mark" aria-hidden="true">HD</div>}
            <div className="menu-card-copy"><span className="menu-category">{item.category}</span><h3>{item.name}</h3></div>
            <div className="menu-price">{item.price === null ? "Ask us" : `₹${item.price.toLocaleString("en-IN")}`}</div>
          </article>
        )) : <div className="empty">No dishes found. Try another search.</div>}
      </div>
      <p className="menu-note">Prices are displayed only for dishes confirmed in the restaurant&apos;s menu. Availability may vary.</p>
    </div>
  );
}

function Gallery({ images }: { images: GalleryImg[] }) {
  const [current, setCurrent] = useState<number | null>(null);
  useEffect(() => {
    if (current === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCurrent(null);
      if (event.key === "ArrowLeft") setCurrent((value) => ((value ?? 0) - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setCurrent((value) => ((value ?? 0) + 1) % images.length);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [current, images.length]);
  return <>
    <div className="gallery-grid">{images.map((image, index) => <button className={`gallery-tile gallery-tile-${index % 4}`} key={image.src} onClick={() => setCurrent(index)} aria-label={`Open photo: ${image.alt}`}><img src={image.src} alt={image.alt} loading="lazy" /></button>)}</div>
    {current !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={(event) => event.target === event.currentTarget && setCurrent(null)}>
      <button className="lightbox-close" onClick={() => setCurrent(null)} aria-label="Close photo viewer">×</button>
      <button className="lightbox-arrow lightbox-prev" onClick={() => setCurrent((current - 1 + images.length) % images.length)} aria-label="Previous photo">‹</button>
      <img src={images[current].src} alt={images[current].alt} />
      <button className="lightbox-arrow lightbox-next" onClick={() => setCurrent((current + 1) % images.length)} aria-label="Next photo">›</button>
    </div>}
  </>;
}

export default function SiteClient({ settings, menu, gallery }: { settings: Settings; menu: MenuCat[]; gallery: GalleryImg[] }) {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const headline = settings.hero_headline.split(" ");
  const accent = headline.pop() ?? "Taste";
  const tel = `tel:${settings.phone_tel}`;

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return <>
    <div className="topline"><span>{settings.hours}</span><span className="topline-dot">•</span><span>NH-33 · Ulda, Jharkhand</span><a href={tel}>Call {settings.phone}</a></div>
    <header className="site-header">
      <div className="nav-shell">
        <a href="#home" className="brand" aria-label="Haveli Dhaba home"><span className="brand-emblem">H</span><span><strong>Haveli</strong><small>DHABA</small></span></a>
        <nav className={navigationOpen ? "site-nav is-open" : "site-nav"} aria-label="Main navigation"><ul>{NAV.map(([href, label]) => <li key={href}><a href={href} onClick={() => setNavigationOpen(false)}>{label}</a></li>)}</ul></nav>
        <div className="nav-actions"><a className="nav-call" href="/order#cart" aria-label="Open cart">◇</a><a className="btn btn-primary nav-order" href="/order">Order online</a><button className="menu-toggle" onClick={() => setNavigationOpen((value) => !value)} aria-label={navigationOpen ? "Close menu" : "Open menu"} aria-expanded={navigationOpen}>☰</button></div>
      </div>
    </header>

    <main id="home">
      <HomeOrdering menu={menu} gallery={gallery} />
      <section className="hero-section">
        <div className="hero-image" role="img" aria-label="Haveli Dhaba illuminated entrance"></div>
        <div className="hero-overlay"></div>
        <div className="hero-content page-width">
          <span className="eyebrow">A taste of home, on the highway</span>
          <h1>{headline.join(" ")} <em>{accent}</em></h1>
          <p>{settings.hero_text}</p>
          <div className="hero-actions"><a className="btn btn-primary btn-large" href="#menu">View menu <span aria-hidden="true">↘</span></a><a className="btn btn-light btn-large" href="/order">Order now <span aria-hidden="true">↗</span></a><button className="btn btn-ghost btn-large" onClick={() => dialog.current?.showModal()}>Book a table</button></div>
          <div className="hero-meta"><span><b>{settings.hours}</b> in Ulda</span><span className="meta-rule"></span><span><b>{settings.rating}</b> Google rating</span></div>
        </div>
        <a className="scroll-cue" href="#about"><span>Scroll to discover</span><i>↓</i></a>
      </section>

      <section id="about" className="story-section section-pad"><div className="page-width story-grid">
        <div className="story-visual reveal"><div className="image-frame image-frame-large"><img src="/images/photo-6.jpg" alt="Haveli Dhaba entrance glowing at night" loading="lazy" /></div><div className="story-stamp"><span>Est.</span><strong>HD</strong><span>Ulda · JH</span></div></div>
        <div className="story-copy reveal"><span className="eyebrow">The Haveli feeling</span><h2>Come as guests.<br /><em>Leave as family.</em></h2><p>At Haveli Dhaba, we bring the warmth of a family kitchen to every table. Stop by for a hearty meal, stay for the hospitality, and make a memory along the way.</p><a className="text-link" href="#experience">Discover our experience <span>↗</span></a></div>
      </div></section>

      <section id="menu" className="menu-section section-pad"><div className="page-width"><div className="section-heading reveal"><div><span className="eyebrow">From our kitchen</span><h2>Made for <em>sharing.</em></h2></div><p>Browse our full menu, from comforting dals and breads to tandoori favourites. Our kitchen keeps it generous, honest and full of flavour.</p></div><Menu menu={menu} /></div></section>

      <section id="experience" className="experience-section section-pad"><div className="page-width"><div className="experience-intro reveal"><span className="eyebrow">More than a meal</span><h2>A place to <em>pause.</em></h2><p>Whether it&apos;s a late-night highway stop, a family lunch or a celebration with your people, there&apos;s always a seat waiting.</p></div><div className="experience-grid">
        <article className="experience-card experience-card-wide reveal"><img src="/images/photo-7.jpg" alt="Haveli Dhaba frontage at night" loading="lazy" /><div><span className="card-kicker">01 · Always welcoming</span><h3>Good food.<br /><em>Good company.</em></h3></div></article>
        <article className="experience-card reveal"><img src="/images/photo-1.jpg" alt="Children's play area at Haveli Dhaba" loading="lazy" /><div><span className="card-kicker">02 · Family time</span><h3>Room for<br /><em>little joy.</em></h3></div></article>
        <article className="experience-card reveal"><img src="/images/photo-3.jpg" alt="Outdoor seating beside the play area" loading="lazy" /><div><span className="card-kicker">03 · Under the sky</span><h3>Take it<br /><em>easy.</em></h3></div></article>
      </div></div></section>

      <section className="order-banner section-pad"><div className="page-width order-banner-inner reveal"><div><span className="eyebrow">Hunger, handled</span><h2>Your favourites,<br /><em>your way.</em></h2><p>Order from the dishes with confirmed prices for delivery or takeaway. Every order is reviewed by our team before it is prepared.</p><a className="btn btn-light" href="/order">Start your order <span>↗</span></a></div><div className="order-art"><span>HD</span><i>✦</i><b>Made with<br />warmth</b></div></div></section>

      <section className="offers-section section-pad"><div className="page-width offers-grid reveal"><div><span className="eyebrow">For our regulars</span><h2>Offers &amp; <em>rewards.</em></h2><p>We&apos;ll share the next special right here when it&apos;s published by the Haveli Dhaba team.</p></div><div className="empty-feature"><span className="empty-icon">✦</span><strong>No live offers yet</strong><span>Check back soon or follow us on Instagram for updates.</span><a className="text-link" href={settings.instagram} target="_blank" rel="noopener">Follow @haveli.dhaba ↗</a></div></div></section>

      <section id="gallery" className="gallery-section section-pad"><div className="page-width"><div className="section-heading reveal"><div><span className="eyebrow">A glimpse inside</span><h2>Life at <em>Haveli.</em></h2></div><p>Real moments, real spaces, and a warm welcome waiting in Ulda.</p></div><Gallery images={gallery} /></div></section>

      <section id="reservation" className="reservation-section section-pad"><div className="page-width reservation-card reveal"><div><span className="eyebrow">Your table is waiting</span><h2>Make room for<br /><em>good things.</em></h2><p>Share your preferred date and time. We&apos;ll review your request and contact you before anything is confirmed.</p></div><button className="btn btn-primary btn-large" onClick={() => dialog.current?.showModal()}>Request a table <span aria-hidden="true">↗</span></button></div></section>

      <section id="venue" className="venue-section section-pad"><div className="page-width venue-card reveal"><div className="venue-copy"><span className="eyebrow">Make it memorable</span><h2>Bring your<br /><em>people.</em></h2><p>Planning a birthday, family gathering or private event? Tell us what you have in mind. Our team will review your enquiry and get in touch.</p><span className="approval-note">Every enquiry is subject to availability and management approval.</span></div><div className="venue-form"><BookingForm kind="venue" phoneDisplay={settings.phone} phoneTel={settings.phone_tel} /></div></div></section>

      <section id="contact" className="contact-section section-pad"><div className="page-width contact-grid"><div className="contact-copy reveal"><span className="eyebrow">Find your way here</span><h2>See you<br /><em>at the table.</em></h2><p>{settings.address}</p><div className="contact-details"><div><span>Call us</span><a href={tel}>{settings.phone}</a></div><div><span>Open</span><strong>{settings.hours}</strong></div></div><div className="hero-actions"><a className="btn btn-primary" href={MAPS} target="_blank" rel="noopener">Get directions ↗</a><a className="btn btn-ghost" href={settings.instagram} target="_blank" rel="noopener">Instagram ↗</a></div></div><iframe className="map-frame reveal" loading="lazy" title="Map to Haveli Dhaba" src="https://maps.google.com/maps?q=Haveli+Dhaba+Ulda+Jharkhand+832304&output=embed" /></div></section>
    </main>

    <footer className="site-footer"><div className="page-width footer-grid"><div><a href="#home" className="brand"><span className="brand-emblem">H</span><span><strong>Haveli</strong><small>DHABA</small></span></a><p>A warm table on the highway.<br />{settings.hours} in Ulda, Jharkhand.</p></div><div><span className="footer-label">Explore</span><a href="#about">Our story</a><a href="#menu">Menu</a><a href="#gallery">Gallery</a></div><div><span className="footer-label">Connect</span><a href="#reservation">Book a table</a><a href="#venue">Book our venue</a><a href={settings.instagram} target="_blank" rel="noopener">Instagram</a><a href={tel}>{settings.phone}</a></div></div><div className="page-width footer-bottom"><span>© {new Date().getFullYear()} Haveli Dhaba</span><span>Made for shared moments</span></div></footer>
    <nav className="mobile-nav" aria-label="Mobile navigation"><a href="#home">⌂<span>Home</span></a><a href="#menu">◈<span>Menu</span></a><a className="mobile-nav-order" href="/order">↗<span>Order</span></a><a href="/order#cart">◇<span>Cart</span></a><a href="#contact">⌖<span>Visit</span></a></nav>
    <dialog ref={dialog} aria-labelledby="table-title"><button className="dialog-close" type="button" aria-label="Close booking form" onClick={() => dialog.current?.close()}>×</button><span className="eyebrow">Reserve your table</span><h2 id="table-title">Let&apos;s make room.</h2><BookingForm kind="table" phoneDisplay={settings.phone} phoneTel={settings.phone_tel} /></dialog>
  </>;
}
