"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import IndiaMap from "./IndiaMap";
import {
  companyInfo,
  navigation,
  isPlaceholderValue,
} from "@/data/products";

type PublicProduct = {
  id: string;
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  brochureUrl?: string;
};

type PublicRegion = {
  id: string;
  name: string;
  city: string;
};

const enquiryOptions = [
  "Product Enquiry",
  "Distribution",
  "Partnership",
  "General Enquiry",
  "Careers",
  "Other",
];

const companyPresenceStates = ["Goa", "Maharashtra", "Karnataka"];
const leadershipProfiles = [
  { name: "Prasad Jedge", image: "/assets/prasad-jedge.jpg" },
  { name: "Dayanad Kogekar", image: "/assets/dayanand-kogekar.jpg" },
  { name: "Kiran Pachwadkar", image: "/assets/kiran-pachwadkar.jpg" },
];

export default function FluenseCorporateWebsite() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [regions, setRegions] = useState<PublicRegion[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [regionsError, setRegionsError] = useState("");
  const serviceCities = regions
    .map((region) => region.city)
    .filter((city, index, cities) => city.length > 0 && cities.indexOf(city) === index);
  const companyFacts = [
    ["Company Name", companyInfo.name],
    ["Industry", companyInfo.industry],
    ["Current Presence", serviceCities.join(", ")],
    ["Head Office", companyInfo.headOffice],
    ["Established", companyInfo.established],
    ["Email", companyInfo.email],
    ["Phone", companyInfo.phone],
    ["Website", companyInfo.website],
  ].filter(([, value]) => Boolean(value) && !isPlaceholderValue(value));
  const contactDetails = [
    ["Address", companyInfo.address],
    ["Phone", companyInfo.phone],
    ["Email", companyInfo.email],
    ["Website", companyInfo.website],
  ].filter(([, value]) => !isPlaceholderValue(value));

  useEffect(() => {
    api.getProducts()
      .then((data: PublicProduct[]) => {
        if (!Array.isArray(data)) throw new Error("The product list returned an invalid response.");
        setProducts(data);
      })
      .catch((error: unknown) => {
        setProductsError(error instanceof Error ? error.message : "Unable to load products.");
      })
      .finally(() => setProductsLoading(false));

    api.getRegions()
      .then((data: PublicRegion[]) => {
        if (!Array.isArray(data)) throw new Error("The service regions returned an invalid response.");
        setRegions(data);
      })
      .catch((error: unknown) => {
        setRegionsError(error instanceof Error ? error.message : "Unable to load service regions.");
      })
      .finally(() => setRegionsLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return products.filter((product) => {
      const searchableText = `${product.code} ${product.name} ${product.description}`.toLowerCase();
      return searchableText.includes(query);
    });
  }, [products, searchValue]);

  return (
    <div className="fluense-site">
      <header className="site-header">
        <nav className="site-nav container" aria-label="Main navigation">
          <a href="#home" className="brand" aria-label="Fluense Pharma home">
            <img src="/fluense-logo.svg" alt="" className="brand-logo" />
          </a>

          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-expanded={mobileMenuOpen}
            aria-controls="site-navigation"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div id="site-navigation" className={`nav-group ${mobileMenuOpen ? "open" : ""}`}>
            {navigation.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <a href="#contact" className="btn btn-primary nav-cta">
              Contact Us
            </a>
          </div>
        </nav>
      </header>

      <main>
        <section id="home" className="hero-section">
          <div className="container hero-inner">
            <div className="hero-copy">
              <span className="eyebrow">Pharmaceutical care · Western India</span>
              <h1>Thoughtful pharmaceutical supply, rooted in care.</h1>
              <p>
                Fluense Pharma supplies healthcare products and works with healthcare
                professionals and distribution partners
                {serviceCities.length > 0 ? ` across ${serviceCities.join(", ")}.` : "."}
              </p>

              <div className="hero-actions">
                <a href="#products" className="btn btn-primary">
                  Explore Our Products
                </a>
                <a href="#contact" className="btn btn-secondary">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="section section-soft about-section">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow eyebrow-blue">About Us</span>
              <h2>Care, built on trust.</h2>
            </div>
            <div className="leadership-heading">
              <span className="eyebrow">The people behind Fluense</span>
              <h3>Meet our leadership.</h3>
            </div>
            <div className="leadership-grid">
              {leadershipProfiles.map((leader) => (
                <article className="leadership-card" key={leader.name}>
                  <div className="leadership-photo-wrap">
                    <img src={leader.image} alt={leader.name} className="leadership-photo" loading="lazy" />
                  </div>
                  <div className="leadership-profile-copy">
                    <span className="eyebrow">Leadership</span>
                    <h3>{leader.name}</h3>
                  </div>
                </article>
              ))}
            </div>
            <div className="about-grid">
              <div className="about-copy">
                <p>{companyInfo.shortDescription}</p>
                <p>{companyInfo.aboutParagraph}</p>
                <a href="#contact" className="btn btn-secondary">
                  Contact our team
                </a>
              </div>
              <aside className="about-note">
                <span className="eyebrow">Our approach</span>
                <p>{companyInfo.tagline}</p>
                <div className="about-note-rule" />
                <span className="about-note-caption">People first. Partnerships that last.</span>
              </aside>
            </div>
          </div>
        </section>

        <section id="products" className="section">
          <div className="container">
            <div className="section-heading centered">
              <span className="eyebrow eyebrow-blue">Product Portfolio</span>
              <h2>Our Pharmaceutical Portfolio</h2>
              <p>Browse current product listings managed by Fluense Pharma.</p>
            </div>

            {productsLoading ? (
              <p className="data-status" role="status">Loading products…</p>
            ) : productsError ? (
              <p className="data-status data-error" role="alert">Products could not be loaded: {productsError}</p>
            ) : products.length === 0 ? (
              <div className="empty-state catalogue-pending">
                <p>No products are currently listed. Contact our team for availability and information.</p>
                <a href="#contact" className="btn btn-secondary">Contact our team</a>
              </div>
            ) : (
              <>
                <div className="product-toolbar">
                  <label className="search-box" aria-label="Search products">
                    <span aria-hidden="true">⌕</span>
                    <input
                      type="search"
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      placeholder="Search by product code, name or description..."
                    />
                  </label>
                </div>

                <div className="product-grid">
                  {filteredProducts.map((product) => (
                    <article key={product.id} className="product-card">
                      {product.imageUrl && <img className="product-card-image" src={product.imageUrl} alt={`${product.name} medicine`} loading="lazy" />}
                      <div className="product-body">
                        <div className="product-meta"><span className="product-tag">{product.code}</span></div>
                        <h3>{product.name}</h3>
                        {product.description && <p>{product.description}</p>}
                        <div className="product-card-actions">
                          <a href={`/catalog/${encodeURIComponent(product.code)}`} className="btn btn-secondary product-link">
                            View Product Details
                          </a>
                          {product.brochureUrl && (
                            <a className="product-brochure-link" href={product.brochureUrl} target="_blank" rel="noreferrer">
                              Brochure PDF
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="empty-state">No products match your search.</div>
                )}
                <div className="disclaimer">
                  Product information is provided for reference. Consult a qualified healthcare professional for medical advice.
                </div>
              </>
            )}
          </div>
        </section>

        <section id="presence" className="section section-soft">
          <div className="container">
            <div className="section-heading centered">
              <span className="eyebrow eyebrow-blue">Our Presence</span>
              <h2>Our Presence</h2>
              <p>Current service areas listed in our regional directory.</p>
            </div>

            <div className="presence-layout">
              <div className="presence-map-column">
                <div className="presence-intro">
                  <span className="eyebrow">Regional network</span>
                  <h3>Closer to the communities we serve.</h3>
                  <p>Highlighted states reflect our stated service areas and current regional directory.</p>
                </div>
                <IndiaMap presenceStates={companyPresenceStates} />
              </div>
              {regionsLoading ? (
                <p className="data-status" role="status">Loading service regions…</p>
              ) : regionsError ? (
                <p className="data-status data-error" role="alert">Service regions could not be loaded: {regionsError}</p>
              ) : regions.length === 0 ? (
                <p className="data-status">No service regions are currently listed.</p>
              ) : (
                <ul className="region-list">
                  {regions.map((region) => (
                    <li key={region.id}>
                      <strong>{region.name}</strong>
                      <span>{region.city}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="section company-info-section section-soft">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow eyebrow-blue">Company Information</span>
              <h2>Company Information</h2>
            </div>

            <div className="company-grid">
              {companyFacts.map(([label, value]) => (
                <div className="company-info-item" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="section contact-section">
          <div className="container">
            <div className="section-heading centered">
              <span className="eyebrow eyebrow-blue">Contact</span>
              <h2>Get in Touch With Us</h2>
              <p>
                Send a product, distribution or partnership enquiry to our team.
              </p>
            </div>

            <div className="contact-grid">
              <div className="contact-card">
                <h3>{companyInfo.name}</h3>
                <ul>
                  {contactDetails.map(([label, value]) => (
                    <li key={label}>
                      <strong>{label}</strong>
                      <span>{value}</span>
                    </li>
                  ))}
                </ul>
                <div className="serving-box">
                  <span>Serving</span>
                  <strong>{regionsLoading ? "Loading regions…" : serviceCities.join(" · ") || "Contact us for coverage"}</strong>
                </div>
              </div>

              <form className="contact-form">
                <div className="field-grid">
                  <label>
                    <span>Full Name</span>
                    <input type="text" name="fullName" placeholder="Enter your full name" />
                  </label>
                  <label>
                    <span>Email Address</span>
                    <input type="email" name="email" placeholder="Enter your email" />
                  </label>
                  <label>
                    <span>Phone Number</span>
                    <input type="tel" name="phone" placeholder="Enter your phone number" />
                  </label>
                  <label>
                    <span>Company / Organization</span>
                    <input type="text" name="company" placeholder="Company or organization" />
                  </label>
                  <label>
                    <span>Subject</span>
                    <input type="text" name="subject" placeholder="Enquiry subject" />
                  </label>
                  <label>
                    <span>Product / Enquiry Type</span>
                    <select name="enquiryType">
                      {enquiryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="full-width">
                  <span>Message</span>
                  <textarea name="message" rows={5} placeholder="Tell us how we can help..." />
                </label>

                <button type="submit" className="btn btn-primary submit-button">
                  Send Enquiry
                </button>

                <p className="privacy-note">Your information will only be used to respond to your enquiry.</p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <h3>{companyInfo.name}</h3>
            <p>
              Pharmaceutical supply
              {serviceCities.length > 0 ? ` across ${serviceCities.join(", ")}.` : " for healthcare partners."}
            </p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <ul>
              {navigation.map((item) => (
                <li key={item.label}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Products</h4>
            <ul>
              {products.slice(0, 5).map((product) => (
                <li key={product.id}><a href={`/catalog/${encodeURIComponent(product.code)}`}>{product.name}</a></li>
              ))}
              <li><a href="/catalog">Browse product catalogue</a></li>
            </ul>
          </div>

          <div>
            <h4>Contact</h4>
            <ul>
              {contactDetails.map(([label, value]) => <li key={label}>{value}</li>)}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container footer-bottom-inner">
            <span>© 2026 Fluense Pharma. All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
