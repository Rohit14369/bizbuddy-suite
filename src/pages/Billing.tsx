import { useState, useEffect } from 'react';
import { useStore, BillItem } from '@/context/StoreContext';
import { Plus, Trash2, Printer, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

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

export default function Billing() {
  const { products, addBill, shopInfo } = useStore();
  const { toast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerType, setCustomerType] = useState<'normal' | 'retailer'>('normal');
  const [items, setItems] = useState<BillItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [showBill, setShowBill] = useState(false);
  const [lastBill, setLastBill] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [billHistory, setBillHistory] = useState<ApiBill[]>([]);

  // Manual item entry
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState(0);
  const [itemQty, setItemQty] = useState(1);

  const addItem = () => {
    if (!itemName || itemPrice <= 0 || itemQty <= 0) {
      toast({ title: 'Missing info', description: 'Enter product name, price and quantity', variant: 'destructive' });
      return;
    }
    const total = itemPrice * itemQty;
    const matchedProduct = products.find(p => p.name.toLowerCase() === itemName.toLowerCase());
    const productId = matchedProduct ? matchedProduct.id : Date.now().toString();
    const existing = items.find(i => i.productName.toLowerCase() === itemName.toLowerCase());
    if (existing) {
      setItems(items.map(i => i.productName.toLowerCase() === itemName.toLowerCase()
        ? { ...i, quantity: i.quantity + itemQty, total: (i.quantity + itemQty) * i.price }
        : i
      ));
    } else {
      setItems([...items, { productId, productName: itemName, quantity: itemQty, price: itemPrice, total }]);
    }
    setItemName('');
    setItemPrice(0);
    setItemQty(1);
  };

  const removeItem = (productId: string) => setItems(items.filter(i => i.productId !== productId));

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const generateBill = async () => {
    if (!customerName.trim() || items.length === 0) {
      toast({ title: 'Missing info', description: 'Enter customer name and add items', variant: 'destructive' });
      return;
    }

    const billPayload = {
      customerName: customerName.trim(),
      customerType,
      discount,
      items: items.map(i => ({
        productName: i.productName,
        category: products.find(p => p.name.toLowerCase() === i.productName.toLowerCase())?.category || 'general',
        price: i.price,
        quantity: i.quantity,
        total: i.total,
      })),
    };

    try {
      const res = await api.post('/bills', billPayload);
      const apiBill = res.data?.bill;
      setLastBill({
        customerName: customerName.trim(),
        customerType,
        items,
        subtotal,
        discount,
        total,
        date: apiBill?.createdAt ? new Date(apiBill.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        billNo: `ST-${Date.now()}`,
      });
      toast({ title: 'Bill Generated!', description: `Total: ₹${total.toLocaleString('en-IN')}` });
    } catch {
      // Fallback to local
      const bill = {
        customerId: customerName.trim().toLowerCase().replace(/\s+/g, '-'),
        customerName: customerName.trim(),
        customerType,
        items,
        subtotal,
        discount,
        total,
      };
      addBill(bill);
      setLastBill({ ...bill, date: new Date().toISOString().split('T')[0], billNo: `ST-${Date.now()}` });
      toast({ title: 'Bill Generated!', description: `Total: ₹${total.toLocaleString('en-IN')}` });
    }

    setShowBill(true);
    setItems([]);
    setDiscount(0);
    setCustomerName('');
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

  const handlePrint = () => {
    window.print();
    setShowBill(false);
  };

  const selectClass = "flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 input-focus";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Billing</h1>
        <Button variant="outline" onClick={fetchBillHistory} className="gap-2">
          <History size={16} /> Bill History
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Item Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Info */}
          <div className="glass-card p-4 space-y-4 animate-slide-up">
            <h3 className="font-display font-semibold">Customer Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Raj, Ahmed..."
                  className="input-focus"
                />
              </div>
              <div className="space-y-2">
                <Label>Customer Type</Label>
                <select
                  value={customerType}
                  onChange={e => setCustomerType(e.target.value as any)}
                  className={selectClass}
                >
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

          {/* Add Item */}
          <div className="glass-card p-4 space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h3 className="font-display font-semibold">Add Items</h3>
            <p className="text-xs text-muted-foreground italic">e.g. Product: Almonds (Badam), Price: 850, Qty: 2</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Product Name</Label>
                <Input
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="e.g. Almonds (Badam)"
                  className="input-focus"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price ₹</Label>
                <Input
                  type="number"
                  min={0}
                  value={itemPrice || ''}
                  onChange={e => setItemPrice(+e.target.value)}
                  placeholder="₹ 0"
                  className="input-focus"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Qty</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={itemQty}
                    onChange={e => setItemQty(+e.target.value)}
                    placeholder="1"
                    className="input-focus"
                  />
                  <Button onClick={addItem} className="gradient-primary text-primary-foreground gap-2 hover-glow shrink-0">
                    <Plus size={16} /> Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="glass-card overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Product</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Price</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Qty</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.productId} className="table-row-hover border-b border-border/50">
                      <td className="py-3 px-4 font-medium">{item.productName}</td>
                      <td className="py-3 px-4 text-right">₹{item.price}</td>
                      <td className="py-3 px-4 text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-semibold">₹{item.total.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => removeItem(item.productId)} className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Bill Summary */}
        <div className="space-y-4">
          <div className="glass-card p-6 space-y-4 animate-slide-up sticky top-20" style={{ animationDelay: '150ms' }}>
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
                <p className="text-xs text-muted-foreground">Imran: 8390090038 | Sadiq: 9359458298 | Dilshad: 9356720070</p>
              </div>
              <div className="flex justify-between text-sm">
                <span>Customer: <strong>{lastBill.customerName}</strong></span>
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
