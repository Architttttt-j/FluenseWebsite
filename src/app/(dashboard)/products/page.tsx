"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api-client";

const EMPTY_FORM = { code: "", name: "", description: "", brochureUrl: "" };

export default function ProductsPage() {
  const { activeUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(editingProduct?.imageUrl || "");
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [editingProduct, imageFile]);

  const loadProducts = async () => {
    try {
      setProducts(await api.getProducts());
    } catch (error: any) {
      alert(error.message || "Unable to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && activeUser?.role !== "head_admin") router.replace("/dashboard");
    if (activeUser?.role === "head_admin") loadProducts();
  }, [activeUser, authLoading, router]);

  if (authLoading || !activeUser || activeUser.role !== "head_admin") {
    return <div className="page-content" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}><div className="spinner" /></div>;
  }

  const openCreate = () => {
    setEditingProduct(null);
    setBrochureFile(null);
    setImageFile(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setBrochureFile(null);
    setImageFile(null);
    setForm({ code:product.code, name:product.name, description:product.description || "", brochureUrl:product.brochureUrl || "" });
    setShowForm(true);
  };

  const saveProduct = async () => {
    try {
      const saved = editingProduct
        ? await api.updateProduct(editingProduct.id, form)
        : await api.createProduct(form);
      setEditingProduct(saved);
      if (brochureFile) await api.uploadBrochure(saved.id, brochureFile);
      if (imageFile) await api.uploadProductImage(saved.id, imageFile);
      setShowForm(false);
      setEditingProduct(null);
      setBrochureFile(null);
      setImageFile(null);
      await loadProducts();
    } catch (error: any) {
      alert(error.message || "Error saving product");
    }
  };

  const deleteProduct = async (product: any) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try {
      await api.deleteProduct(product.id);
      setProducts(products.filter(item => item.id !== product.id));
    } catch (error: any) {
      alert(error.message || "Error deleting product");
    }
  };

  return (
    <div className="page-content fade-in">
      <div className="flex-between" style={{ marginBottom:24 }}>
        <div>
          <h1 className="page-title">Product Catalogue</h1>
          <p className="page-subtitle" style={{ marginBottom:0 }}>Manage products, descriptions and brochure links.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>Add Product</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom:20 }}>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>{editingProduct ? "Edit Product" : "New Product"}</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:12 }}>
            <div>
              <label className="form-label">Product Code</label>
              <input className="form-input" value={form.code} onChange={e => setForm({ ...form, code:e.target.value })} disabled={Boolean(editingProduct)} placeholder="e.g. p009" />
            </div>
            <div>
              <label className="form-label">Product Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name:e.target.value })} placeholder="Product name" />
            </div>
            <div style={{ gridColumn:"1 / -1" }}>
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description:e.target.value })} placeholder="Product description" />
            </div>
            <div style={{ gridColumn:"1 / -1" }}>
              <label className="form-label">Medicine Image</label>
              <input className="form-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setImageFile(e.target.files?.[0] || null)} />
              <p style={{ fontSize:11.5, color:"var(--text-muted)", marginTop:5 }}>{imageFile ? `${imageFile.name} · uploads when you save` : editingProduct?.imageUrl ? "Existing image will be kept unless replaced." : "Choose a JPG, PNG or WebP image up to 5MB. It uploads when you save the product."}</p>
              {imagePreviewUrl && <img className="product-image-preview" src={imagePreviewUrl} alt="Medicine image preview" />}
            </div>
            <div style={{ gridColumn:"1 / -1" }}>
              <label className="form-label">Brochure PDF</label>
              <input className="form-input" type="file" accept="application/pdf,.pdf" onChange={e => setBrochureFile(e.target.files?.[0] || null)} />
              <p style={{ fontSize:11.5, color:"var(--text-muted)", marginTop:5 }}>{brochureFile ? brochureFile.name : form.brochureUrl ? "Existing brochure will be kept unless replaced." : "Upload a PDF up to 10MB."}</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:16 }}>
            <button className="btn btn-primary btn-sm" onClick={saveProduct}>{editingProduct ? "Save Changes" : "Create Product"}</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Image</th><th>Code</th><th>Name</th><th>Description</th><th>Brochure</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ textAlign:"center" }}><span className="spinner" /></td></tr> : products.map(product => (
                <tr key={product.id}>
                  <td>{product.imageUrl ? <img className="product-image-thumbnail" src={product.imageUrl} alt={`${product.name} medicine`} /> : <span style={{ color:"var(--text-muted)", fontSize:13 }}>-</span>}</td>
                  <td style={{ fontFamily:"monospace", fontSize:12, color:"var(--text-secondary)" }}>{product.code}</td>
                  <td style={{ fontWeight:500 }}>{product.name}</td>
                  <td style={{ maxWidth:280, fontSize:13, color:"var(--text-secondary)" }}>{product.description || "-"}</td>
                  <td>{product.brochureUrl ? <a href={product.brochureUrl} target="_blank" rel="noreferrer" style={{ color:"var(--accent)", fontSize:13 }}>Open brochure</a> : <span style={{ color:"var(--text-muted)", fontSize:13 }}>-</span>}</td>
                  <td>
                    <div style={{ display:"flex", gap:6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(product)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(product)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && products.length === 0 && <tr><td colSpan={6} style={{ color:"var(--text-muted)", textAlign:"center" }}>No products yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
