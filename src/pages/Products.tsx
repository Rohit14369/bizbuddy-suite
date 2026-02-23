import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Plus, Pencil, Trash2, Search } from "lucide-react";

const emptyForm = {
  name: "",
  category: "",
  code: "",
  image: "",
  normalPrice: "",
  retailerPrice: "",
  buyingPrice: "",
  stock: "",
};

export default function Products() {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  // ================= FETCH =================
  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ================= ADD/UPDATE =================
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.image) {
      alert("Name & Image required");
      return;
    }

    const cleanForm = {
      ...form,
      image: form.image.trim(),
      normalPrice: Number(form.normalPrice),
      retailerPrice: Number(form.retailerPrice),
      buyingPrice: Number(form.buyingPrice),
      stock: Number(form.stock),
    };

    try {
      if (editing) {
        await api.put(`/products/${editing}`, cleanForm);
      } else {
        await api.post("/products", cleanForm);
      }

      setForm(emptyForm);
      setEditing(null);
      setShowForm(false);
      fetchProducts();

    } catch (err) {
      console.log(err);
    }
  };

  // ================= DELETE =================
  const del = async (id: string) => {
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="page-header text-xl sm:text-2xl md:text-3xl">Products</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Manage your inventory</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm); }}
            className="gradient-primary text-primary-foreground hover-glow gap-2 w-full sm:w-auto"
          >
            <Plus size={16} /> Add Product
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 input-focus"
        />
      </div>

      {/* ================= ADMIN FORM ================= */}
      {isAdmin && showForm && (
        <form onSubmit={submit} className="glass-card p-4 sm:p-6 space-y-4 animate-slide-up">
          <h3 className="font-display font-semibold text-base sm:text-lg">{editing ? "Edit Product" : "Add New Product"}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="input-focus"
            />
            <Input
              placeholder="Category"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="input-focus"
            />
            <Input
              placeholder="Code"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              className="input-focus"
            />
            <Input
              placeholder="Image URL"
              value={form.image}
              onChange={e => setForm({ ...form, image: e.target.value })}
              required
              className="input-focus"
            />
          </div>

          {/* IMAGE PREVIEW */}
          {form.image && (
            <img
              src={form.image}
              alt="preview"
              className="h-32 rounded-lg border border-border object-cover"
              onError={(e: any) => {
                e.target.src = "https://via.placeholder.com/150";
              }}
            />
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input
              type="number"
              placeholder="Normal Price"
              value={form.normalPrice}
              onChange={e => setForm({ ...form, normalPrice: e.target.value })}
              className="input-focus"
            />
            <Input
              type="number"
              placeholder="Retailer Price"
              value={form.retailerPrice}
              onChange={e => setForm({ ...form, retailerPrice: e.target.value })}
              className="input-focus"
            />
            <Input
              type="number"
              placeholder="Buying Price"
              value={form.buyingPrice}
              onChange={e => setForm({ ...form, buyingPrice: e.target.value })}
              className="input-focus"
            />
            <Input
              type="number"
              placeholder="Stock"
              value={form.stock}
              onChange={e => setForm({ ...form, stock: e.target.value })}
              className="input-focus"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="gradient-primary text-primary-foreground hover-glow">
              {editing ? "Update" : "Add"} Product
            </Button>
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* ================= PRODUCT GRID ================= */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center animate-slide-up">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="font-display text-xl font-semibold">No Products Found</h3>
          <p className="text-muted-foreground mt-1">
            {products.length === 0 ? "Add products to get started." : "Try a different search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {filtered.map((p, i) => (
            <div
              key={p._id || p.id || i}
              className="glass-card overflow-hidden hover-lift animate-slide-up group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="relative h-36 sm:h-48 overflow-hidden">
                <img
                  src={p.image || "https://via.placeholder.com/300x200?text=No+Image"}
                  alt={p.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e: any) => {
                    e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    p.stock <= 3 ? 'bg-destructive/90 text-destructive-foreground' :
                    p.stock <= 10 ? 'bg-warning/90 text-warning-foreground' :
                    'bg-success/90 text-success-foreground'
                  }`}>
                    Stock: {p.stock}
                  </span>
                </div>
                {p.category && (
                  <div className="absolute top-2 left-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/90 text-primary-foreground font-medium">
                      {p.category}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div>
                  <h3 className="font-display font-semibold text-base sm:text-lg truncate">{p.name}</h3>
                  {p.code && <p className="text-xs text-muted-foreground">Code: {p.code}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">Normal</p>
                    <p className="font-bold text-foreground">₹{p.normalPrice}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">Retailer</p>
                    <p className="font-bold text-primary">₹{p.retailerPrice}</p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex gap-2 pt-2 border-t border-border/50">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1 text-xs"
                      onClick={() => {
                        setEditing(p._id || p.id);
                        setForm({
                          name: p.name || "",
                          category: p.category || "",
                          code: p.code || "",
                          image: p.image || "",
                          normalPrice: p.normalPrice?.toString() || "",
                          retailerPrice: p.retailerPrice?.toString() || "",
                          buyingPrice: p.buyingPrice?.toString() || "",
                          stock: p.stock?.toString() || "",
                        });
                        setShowForm(true);
                      }}
                    >
                      <Pencil size={12} /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => del(p._id || p.id)}
                    >
                      <Trash2 size={12} /> Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
