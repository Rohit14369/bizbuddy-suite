import { useAuth } from '@/context/AuthContext';
import { Search, Trash2, Pencil, X, Check, FileDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useMemo } from 'react';
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

interface CustomerRow {
  key: string;
  name: string;
  type: string;
  totalPurchases: number;
  billCount: number;
  bills: ApiBill[];
}

export default function Customers() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [allBills, setAllBills] = useState<ApiBill[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ step: number; customer: CustomerRow | null }>({ step: 0, customer: null });
  const [viewCustomer, setViewCustomer] = useState<CustomerRow | null>(null);

  const fetchBills = async () => {
    try {
      const res = await api.get('/bills');
      setAllBills(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAllBills([]);
    }
  };

  useEffect(() => { fetchBills(); }, []);

  const allCustomers = useMemo(() => {
    const customerMap = new Map<string, CustomerRow>();
    allBills.forEach(b => {
      const key = b.customerName.toLowerCase().trim();
      const existing = customerMap.get(key);
      if (existing) {
        existing.totalPurchases += b.total;
        existing.billCount += 1;
        existing.bills.push(b);
      } else {
        customerMap.set(key, {
          key,
          name: b.customerName,
          type: b.customerType,
          totalPurchases: b.total,
          billCount: 1,
          bills: [b],
        });
      }
    });
    return Array.from(customerMap.values());
  }, [allBills]);

  const filtered = allCustomers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const grandTotal = filtered.reduce((sum, c) => sum + c.totalPurchases, 0);
  const totalBills = filtered.reduce((sum, c) => sum + c.billCount, 0);

  const handleDeleteBill = async (billId: string) => {
    try {
      await api.delete(`/bills/${billId}`);
      toast({ title: 'Bill Deleted' });
      await fetchBills();
      // Close view if customer has no more bills
      if (viewCustomer) {
        const remaining = allBills.filter(b => b._id !== billId && b.customerName.toLowerCase().trim() === viewCustomer.key);
        if (remaining.length === 0) setViewCustomer(null);
      }
    } catch {
      toast({ title: 'Error deleting bill', variant: 'destructive' });
    }
  };

  const handleDeleteAllCustomerBills = async () => {
    if (!deleteConfirm.customer) return;
    const customerBills = allBills.filter(b => b.customerName.toLowerCase().trim() === deleteConfirm.customer!.key);
    try {
      await Promise.all(customerBills.map(b => api.delete(`/bills/${b._id}`)));
      toast({ title: 'Customer deleted', description: `${deleteConfirm.customer.name} and all bills removed.` });
      await fetchBills();
    } catch {
      toast({ title: 'Error deleting', variant: 'destructive' });
    }
    setDeleteConfirm({ step: 0, customer: null });
  };

  const exportExcel = () => {
    let csv = 'Customer Name,Type,Bills,Total Purchases\n';
    filtered.forEach(c => {
      csv += `"${c.name}","${c.type}",${c.billCount},${c.totalPurchases}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <h1 className="page-header text-xl sm:text-2xl md:text-3xl">Customers</h1>
        {isAdmin && (
          <Button variant="outline" onClick={exportExcel} className="gap-2 text-xs sm:text-sm w-full sm:w-auto">
            <FileDown size={16} /> Export CSV
          </Button>
        )}
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 input-focus" />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto -mx-0">
          <table className="w-full text-xs sm:text-sm min-w-[500px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-muted-foreground">Type</th>
                <th className="text-center py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-muted-foreground">Bills</th>
                <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-muted-foreground">Amount</th>
                {isAdmin && <th className="text-center py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-muted-foreground">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.key} className="table-row-hover border-b border-border/50 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[100px] sm:max-w-none">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                    <span className={c.type === 'retailer' ? 'badge-success' : 'badge-warning'}>{c.type}</span>
                  </td>
                  <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center">{c.billCount}</td>
                  <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-semibold">₹{c.totalPurchases.toLocaleString('en-IN')}</td>
                  {isAdmin && (
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => setViewCustomer(c)} className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors" title="View Bills">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirm({ step: 1, customer: c })} className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={isAdmin ? 5 : 4} className="text-center py-8 text-muted-foreground">No customers found. Generate bills from the Billing page.</td></tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-muted/50 border-t-2 border-border font-semibold">
                  <td className="py-3 px-4" colSpan={2}>Total ({filtered.length} customers)</td>
                  <td className="py-3 px-4 text-center">{totalBills}</td>
                  <td className="py-3 px-4 text-right text-primary font-bold text-base">₹{grandTotal.toLocaleString('en-IN')}</td>
                  {isAdmin && <td></td>}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* View Customer Bills Dialog */}
      <Dialog open={!!viewCustomer} onOpenChange={(open) => { if (!open) setViewCustomer(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{viewCustomer?.name} - Bills</DialogTitle></DialogHeader>
          {viewCustomer && (
            <div className="space-y-3">
              {viewCustomer.bills.map(bill => (
                <div key={bill._id} className="glass-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{new Date(bill.createdAt).toLocaleDateString('en-IN')}</p>
                      <p className="text-xs">Discount: {bill.discount}%</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-primary">₹{bill.total.toLocaleString('en-IN')}</p>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteBill(bill._id)} className="text-xs">
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {bill.items.map((item, i) => (
                      <span key={i}>{item.productName} x{item.quantity} (₹{item.price}){i < bill.items.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm.step > 0} onOpenChange={(open) => { if (!open) setDeleteConfirm({ step: 0, customer: null }); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">
              {deleteConfirm.step === 1 ? 'Delete Customer?' : 'Are you really sure?'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {deleteConfirm.step === 1 && (
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong>{deleteConfirm.customer?.name}</strong> and all their {deleteConfirm.customer?.billCount} bill(s)?
              </p>
            )}
            {deleteConfirm.step === 2 && (
              <p className="text-sm text-destructive font-medium">
                ⚠️ This action cannot be undone! All data for <strong>{deleteConfirm.customer?.name}</strong> will be permanently deleted.
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm({ step: 0, customer: null })}>
                <X size={14} className="mr-1" /> Cancel
              </Button>
              <Button variant="destructive" onClick={() => {
                if (deleteConfirm.step === 1) setDeleteConfirm({ ...deleteConfirm, step: 2 });
                else handleDeleteAllCustomerBills();
              }}>
                <Check size={14} className="mr-1" /> {deleteConfirm.step === 1 ? 'Yes, Delete' : 'Final Confirm - Delete!'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
