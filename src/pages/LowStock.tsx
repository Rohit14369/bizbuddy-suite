import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, Package, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface LowStockProduct {
  _id: string;
  id: string;
  name: string;
  category: string;
  code: string;
  stock: number;
  normalPrice: number;
  retailerPrice: number;
  buyingPrice: number;
  image?: string;
}

export default function LowStock() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockId, setRestockId] = useState('');
  const [restockQty, setRestockQty] = useState(0);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLowStock = () => {
    setLoading(true);
    // First try dedicated low-stock endpoint
    api.get('/low-stock')
      .then(res => {
        if (res.data?.success && res.data.data.length > 0) {
          setLowStock(res.data.data.map((p: any) => ({
            _id: p._id,
            id: p._id,
            name: p.name,
            category: p.category || '',
            code: p.code || '',
            stock: p.stock,
            normalPrice: p.normalPrice || 0,
            retailerPrice: p.retailerPrice || 0,
            buyingPrice: p.buyingPrice || 0,
            image: p.image,
          })));
          setLoading(false);
        } else {
          // Fallback: fetch all products and filter stock <= 10
          return api.get('/products').then(res2 => {
            const all = Array.isArray(res2.data) ? res2.data : [];
            const low = all.filter((p: any) => p.stock <= 10).map((p: any) => ({
              _id: p._id,
              id: p._id,
              name: p.name,
              category: p.category || '',
              code: p.code || '',
              stock: p.stock,
              normalPrice: p.normalPrice || 0,
              retailerPrice: p.retailerPrice || 0,
              buyingPrice: p.buyingPrice || 0,
              image: p.image,
            }));
            setLowStock(low);
            setLoading(false);
          });
        }
      })
      .catch(() => {
        // Fallback to products API
        api.get('/products').then(res => {
          const all = Array.isArray(res.data) ? res.data : [];
          setLowStock(all.filter((p: any) => p.stock <= 10).map((p: any) => ({
            _id: p._id, id: p._id, name: p.name, category: p.category || '',
            code: p.code || '', stock: p.stock, normalPrice: p.normalPrice || 0,
            retailerPrice: p.retailerPrice || 0, buyingPrice: p.buyingPrice || 0, image: p.image,
          })));
          setLoading(false);
        }).catch(() => setLoading(false));
      });
  };

  useEffect(() => { fetchLowStock(); }, []);

  const openRestock = (id: string) => {
    setRestockId(id);
    setRestockQty(0);
    setRestockOpen(true);
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (restockQty <= 0) return;
    try {
      const res = await api.put(`/low-stock/${restockId}`, { qty: restockQty });
      if (res.data?.success) {
        toast({ title: 'Stock Updated!', description: `Added ${restockQty} units.` });
        fetchLowStock();
      }
    } catch {
      toast({ title: 'Error updating stock', variant: 'destructive' });
    }
    setRestockOpen(false);
  };

  const exportExcel = () => {
    let csv = 'Product Name,Code,Category,Stock,Normal Price,Retailer Price\n';
    lowStock.forEach(p => {
      csv += `"${p.name}","${p.code}","${p.category}",${p.stock},${p.normalPrice},${p.retailerPrice}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'low-stock-products.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <AlertTriangle className="text-warning" size={24} />
          <h1 className="page-header text-xl sm:text-2xl md:text-3xl">Low Stock Alert</h1>
        </div>
        {isAdmin && lowStock.length > 0 && (
          <Button variant="outline" onClick={exportExcel} className="gap-2 text-xs sm:text-sm w-full sm:w-auto">
            <FileDown size={16} /> Export CSV
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">Products with stock ≤ 10 units are shown here automatically from backend.</p>

      {!isAdmin && (
        <div className="glass-card p-3 border-l-4 border-l-accent animate-fade-in">
          <p className="text-sm text-muted-foreground">👁️ You are viewing low stock items in read-only mode.</p>
        </div>
      )}

      {loading ? (
        <div className="glass-card p-12 text-center"><p className="text-muted-foreground">Loading...</p></div>
      ) : lowStock.length === 0 ? (
        <div className="glass-card p-12 text-center animate-slide-up">
          <Package size={48} className="mx-auto text-success mb-4" />
          <h3 className="font-display text-xl font-semibold">All Stocked Up!</h3>
          <p className="text-muted-foreground mt-1">No products with stock ≤ 10 currently.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {lowStock.map((p, i) => (
            <div key={p.id} className="glass-card p-3 sm:p-5 hover-lift animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{p.name}</h4>
                  <p className="text-xs text-muted-foreground">{p.category} • Code: {p.code}</p>
                  <p className="text-xs text-muted-foreground mt-1">Normal: ₹{p.normalPrice} | Retailer: ₹{p.retailerPrice}</p>
                </div>
                <div className={`text-2xl font-bold ${p.stock <= 3 ? 'text-destructive' : 'text-warning'}`}>
                  {p.stock}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${p.stock <= 3 ? 'bg-destructive' : 'bg-warning'}`}
                    style={{ width: `${Math.min((p.stock / 50) * 100, 100)}%` }}
                  />
                </div>
                {isAdmin && (
                  <Button size="sm" variant="outline" onClick={() => openRestock(p.id)} className="text-xs hover-glow">
                    Restock
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader><DialogTitle className="font-display">Restock</DialogTitle></DialogHeader>
            <form onSubmit={handleRestock} className="space-y-4">
              <div className="space-y-2">
                <Label>Add Quantity</Label>
                <Input type="number" min={1} value={restockQty || ''} onChange={e => setRestockQty(+e.target.value)} className="input-focus" autoFocus />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">Update Stock</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
