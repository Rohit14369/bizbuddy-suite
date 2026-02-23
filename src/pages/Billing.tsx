import { useState, useEffect, useRef } from 'react';
import { useStore, BillItem } from '@/context/StoreContext';
import { Plus, Trash2, Printer, History, Send, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

interface ApiProduct {
  _id: string;
  name: string;
  code: string;
  category: string;
  normalPrice: number;
  retailerPrice: number;
  buyingPrice: number;
  stock: number;
  image?: string;
}

interface ApiBill {
  _id: string;
  customerName: string;
  customerType: string;
  discount: number;
  items: { productName: string; category: string; price: number; quantity: number; total: number }[];
  subtotal: number;
  total: number;
  createdAt: string;
}

const WHATSAPP_NUMBER = '919359458298';

export default function Billing() {
  const { shopInfo } = useStore();
  const { toast } = useToast();

  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerType, setCustomerType] = useState<'normal' | 'retailer'>('normal');
  const [items, setItems] = useState<BillItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [showBill, setShowBill] = useState(false);
  const [lastBill, setLastBill] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [billHistory, setBillHistory] = useState<ApiBill[]>([]);

  // Product search
  const [productSearch, setProductSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [itemQty, setItemQty] = useState(1);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch products from backend
  useEffect(() => {
    api.get('/products')
      .then(res => setAllProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filter products by name or code
  const filteredProducts = productSearch.trim()
    ? allProducts.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.code?.toLowerCase().includes(productSearch.toLowerCase())
      )
    : [];

  const selectProduct = (product: ApiProduct) => {
    const price = customerType === 'retailer' ? product.retailerPrice : product.normalPrice;
    const existing = items.find(i => i.productId === product._id);
    if (existing) {
      setItems(items.map(i =>
        i.productId === product._id
          ? { ...i, quantity: i.quantity + itemQty, total: (i.quantity + itemQty) * i.price }
          : i
      ));
    } else {
      setItems([...items, {
        productId: product._id,
        productName: product.name,
        quantity: itemQty,
        price,
        total: price * itemQty,
      }]);
    }
    setProductSearch('');
    setShowDropdown(false);
    setItemQty(1);
  };

  const removeItem = (productId: string) => setItems(items.filter(i => i.productId !== productId));

  // Recalculate prices when customer type changes
  useEffect(() => {
    if (items.length > 0 && allProducts.length > 0) {
      setItems(prev => prev.map(item => {
        const product = allProducts.find(p => p._id === item.productId);
        if (product) {
          const newPrice = customerType === 'retailer' ? product.retailerPrice : product.normalPrice;
          return { ...item, price: newPrice, total: newPrice * item.quantity };
        }
        return item;
      }));
    }
  }, [customerType]);

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const buildBillText = (bill: any) => {
    let text = `🧾 *${shopInfo.name}*\n`;
    text += `📍 ${shopInfo.address}\n`;
    text += `📞 ${shopInfo.contact}\n`;
    text += `━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 Customer: *${bill.customerName}*\n`;
    text += `📅 Date: ${bill.date}\n`;
    text += `━━━━━━━━━━━━━━━━━━\n`;
    bill.items.forEach((item: BillItem, i: number) => {
      text += `${i + 1}. ${item.productName}\n   ${item.quantity} × ₹${item.price} = ₹${item.total}\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━\n`;
    text += `Subtotal: ₹${bill.subtotal}\n`;
    if (bill.discount > 0) text += `Discount (${bill.discount}%): -₹${(bill.subtotal * bill.discount / 100).toFixed(0)}\n`;
    text += `*Total: ₹${bill.total.toLocaleString('en-IN')}*\n`;
    text += `━━━━━━━━━━━━━━━━━━\n`;
    text += `${shopInfo.tagline}`;
    return text;
  };

  const generateBill = async () => {
    if (!customerName.trim() || items.length === 0) {
      toast({ title: 'Missing info', description: 'Enter customer name and add items', variant: 'destructive' });
      return;
    }

    const billPayload = {
      customerName: customerName.trim(),
      customerType,
      discount,
      items: items.map(i => {
        const product = allProducts.find(p => p._id === i.productId);
        return {
          productName: i.productName,
          category: product?.category || 'general',
          price: i.price,
          quantity: i.quantity,
          total: i.total,
        };
      }),
    };

    const billData = {
      customerName: customerName.trim(),
      customerType,
      items: [...items],
      subtotal,
      discount,
      total,
      date: new Date().toISOString().split('T')[0],
      billNo: `ST-${Date.now()}`,
    };

    try {
      const res = await api.post('/bills', billPayload);
      const apiBill = res.data?.bill;
      if (apiBill?.createdAt) {
        billData.date = new Date(apiBill.createdAt).toISOString().split('T')[0];
      }
      toast({ title: 'Bill Generated!', description: `Total: ₹${total.toLocaleString('en-IN')}` });
    } catch {
      toast({ title: 'Bill Generated (offline)!', description: `Total: ₹${total.toLocaleString('en-IN')}` });
    }

    setLastBill(billData);
    setShowBill(true);
    setItems([]);
    setDiscount(0);
    setCustomerName('');
  };

  const sendWhatsApp = () => {
    if (!lastBill) return;
    const text = encodeURIComponent(buildBillText(lastBill));
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const fetchBillHistory = async () => {
    try {
      const res = await api.get('/bills');
      setBillHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      setBillHistory([]);
    }
    setShowHistory(true);
  };

  const deleteBill = async (id: string) => {
    try {
      await api.delete(`/bills/${id}`);
      toast({ title: 'Bill Deleted' });
      setBillHistory(prev => prev.filter(b => b._id !== id));
    } catch {
      toast({ title: 'Error deleting bill', variant: 'destructive' });
    }
  };

  const selectClass = "flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 input-focus";

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="page-header text-xl sm:text-2xl md:text-3xl">Billing</h1>
        <Button variant="outline" onClick={fetchBillHistory} className="gap-2 text-xs sm:text-sm w-full sm:w-auto">
          <History size={16} /> Bill History
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Info */}
          <div className="glass-card p-3 sm:p-4 space-y-3 sm:space-y-4 animate-slide-up">
            <h3 className="font-display font-semibold text-sm sm:text-base">Customer Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Raj, Ahmed..." className="input-focus" />
              </div>
              <div className="space-y-2">
                <Label>Customer Type</Label>
                <select value={customerType} onChange={e => setCustomerType(e.target.value as any)} className={selectClass}>
                  <option value="normal">Normal</option>
                  <option value="retailer">Retailer</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Discount %</Label>
                <Input type="number" min={0} max={100} value={discount || ''} onChange={e => setDiscount(+e.target.value)} className="input-focus" placeholder="0" />
              </div>
            </div>
          </div>

          {/* Add Item - Product Search */}
          <div className="glass-card p-3 sm:p-4 space-y-3 sm:space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h3 className="font-display font-semibold text-sm sm:text-base">Add Items</h3>
            <p className="text-xs text-muted-foreground italic">Search by product name or code. Price auto-sets based on customer type.</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3 space-y-1" ref={searchRef} style={{ position: 'relative', zIndex: 100 }}>
                <Label className="text-xs">Product Name / Code</Label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={e => { setProductSearch(e.target.value); setShowDropdown(true); }}
                    onFocus={() => productSearch.trim() && setShowDropdown(true)}
                    placeholder="Search product name or code..."
                    className="pl-9 input-focus"
                  />
                </div>
                {/* Dropdown */}
                {showDropdown && filteredProducts.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-2xl max-h-60 overflow-y-auto" style={{ zIndex: 9999 }}>
                    {filteredProducts.map(p => (
                      <button
                        key={p._id}
                        onClick={() => selectProduct(p)}
                        className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              Code: {p.code} • Stock: {p.stock} • {p.category}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-primary">
                              ₹{customerType === 'retailer' ? p.retailerPrice : p.normalPrice}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {customerType === 'retailer' ? 'Retailer' : 'Normal'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && productSearch.trim() && filteredProducts.length === 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-2xl p-4 text-center text-sm text-muted-foreground" style={{ zIndex: 9999 }}>
                    No products found for "{productSearch}"
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Qty</Label>
                <Input type="number" min={1} value={itemQty} onChange={e => setItemQty(+e.target.value)} placeholder="1" className="input-focus" />
              </div>
            </div>
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="glass-card overflow-hidden animate-slide-up" style={{ animationDelay: '200ms', position: 'relative', zIndex: 1 }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm">Product</th>
                      <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm">Price</th>
                      <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm">Qty</th>
                      <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-muted-foreground text-xs sm:text-sm">Total</th>
                      <th className="py-2.5 sm:py-3 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.productId} className="table-row-hover border-b border-border/50">
                        <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-xs sm:text-sm">{item.productName}</td>
                        <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right text-xs sm:text-sm">₹{item.price}</td>
                        <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right text-xs sm:text-sm">{item.quantity}</td>
                        <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-semibold text-xs sm:text-sm">₹{item.total.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 sm:py-3 px-2 text-right">
                          <button onClick={() => removeItem(item.productId)} className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Bill Summary */}
        <div className="space-y-4">
          <div className="glass-card p-4 sm:p-6 space-y-4 animate-slide-up sticky top-20" style={{ animationDelay: '150ms', position: 'relative', zIndex: 1 }}>
            <h3 className="font-display text-lg font-semibold">Bill Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>{items.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-success"><span>Discount ({discount}%)</span><span>-₹{discountAmount.toLocaleString('en-IN')}</span></div>
              )}
              <div className="border-t border-border pt-2 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <Button onClick={generateBill} className="w-full gradient-primary text-primary-foreground hover-glow cursor-pointer" disabled={items.length === 0 || !customerName.trim()}>
              Generate Bill
            </Button>
          </div>
        </div>
      </div>

      {/* Bill Preview Dialog */}
      <Dialog open={showBill} onOpenChange={setShowBill}>
        <DialogContent className="sm:max-w-lg print:shadow-none bg-card text-foreground">
          <DialogHeader><DialogTitle className="font-display">Bill Generated</DialogTitle></DialogHeader>
          {lastBill && (
            <div className="space-y-4" id="bill-content">
              <div className="text-center border-b border-border pb-3">
                <h2 className="font-display text-xl font-bold text-primary">{shopInfo.name}</h2>
                <p className="text-xs text-muted-foreground">{shopInfo.address}</p>
                <p className="text-xs text-muted-foreground">{shopInfo.contact}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span>Customer: <strong>{lastBill.customerName}</strong> ({lastBill.customerType})</span>
                <span>Date: {lastBill.date}</span>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-1">Item</th><th className="text-right py-1">Qty</th><th className="text-right py-1">Price</th><th className="text-right py-1">Total</th></tr></thead>
                <tbody>
                  {lastBill.items.map((item: BillItem, i: number) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-1">{item.productName}</td>
                      <td className="text-right py-1">{item.quantity}</td>
                      <td className="text-right py-1">₹{item.price}</td>
                      <td className="text-right py-1">₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t pt-2 space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{lastBill.subtotal}</span></div>
                {lastBill.discount > 0 && <div className="flex justify-between text-success"><span>Discount ({lastBill.discount}%)</span><span>-₹{(lastBill.subtotal * lastBill.discount / 100).toFixed(0)}</span></div>}
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary">₹{lastBill.total.toLocaleString('en-IN')}</span></div>
              </div>
              <p className="text-center text-sm text-muted-foreground italic">{shopInfo.tagline}</p>
            </div>
          )}
          <div className="flex gap-2 justify-end print:hidden">
            <Button variant="outline" onClick={sendWhatsApp} className="gap-2 text-success border-success/30 hover:bg-success/10">
              <Send size={14} /> WhatsApp
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-2"><Printer size={14} /> Print</Button>
            <Button variant="outline" onClick={() => setShowBill(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bill History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Bill History</DialogTitle></DialogHeader>
          {billHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No bills found.</p>
          ) : (
            <div className="space-y-3">
              {billHistory.map(bill => (
                <div key={bill._id} className="glass-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{bill.customerName} <span className="text-xs text-muted-foreground">({bill.customerType})</span></p>
                      <p className="text-xs text-muted-foreground">{new Date(bill.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-primary">₹{bill.total.toLocaleString('en-IN')}</p>
                      <Button size="sm" variant="destructive" onClick={() => deleteBill(bill._id)} className="text-xs">
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {bill.items.map((item, i) => (
                      <span key={i}>{item.productName} x{item.quantity}{i < bill.items.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
