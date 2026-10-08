import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import { Product } from "@/lib/models";

type ProductDetails = {
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  brochureUrl?: string;
};

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  await connectDB();
  const product = await Product.findOne({ code: params.slug })
    .select("code name description imageUrl brochureUrl")
    .lean<ProductDetails>();

  if (!product) {
    notFound();
  }

  return (
    <main className="product-detail-page">
      <div className="container product-detail-wrap">
        <a href="/catalog" className="catalog-back-link">← Product catalogue</a>
        <div className="product-detail-header">
          {product.imageUrl && <img className="product-detail-image" src={product.imageUrl} alt={`${product.name} medicine`} />}
          <div className="product-detail-summary">
            <span className="eyebrow eyebrow-blue">Product {product.code}</span>
            <h1>{product.name}</h1>
            {product.description && <p className="product-description">{product.description}</p>}
          </div>
        </div>

        {product.brochureUrl ? (
          <section className="product-brochure">
            <a href={product.brochureUrl} className="btn btn-secondary" target="_blank" rel="noreferrer">
              Open product brochure (PDF)
            </a>
          </section>
        ) : null}

        <section className="enquiry-box">
          <h3>Ask about {product.name}</h3>
          <p>Contact our team for availability and product information.</p>
          <div className="partnership-actions">
            <a href="/#contact" className="btn btn-primary">
              Enquire About Product
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
