import { useStore } from '@/context/StoreContext';
import { Package, ShoppingCart, Users, AlertTriangle, TrendingUp, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';

interface DashboardData {
  totalProducts: number;
  totalStock: number;
  lowStockItems: number;
  totalCustomers: number;
  todayBills: number;
  totalRevenue: number;
  normalCustomerRevenue: number;
  retailerCustomerRevenue: number;
  todayRevenue: number;
  todayBillsGenerated: number;
  recentBills: {
    billNo: string;
    customerName: string;
    customerType: string;
    date: string;
    total: number;
  }[];
}

export default function Dashboard() {
  const { products, bills, customers } = useStore();
  const [apiData, setApiData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get('/dashboard')
      .then(res => {
        if (res.data?.success) {
          setApiData(res.data.data);
        }
      })
      .catch(() => {
        // Fallback to local data
      });
  }, []);

  // Use API data if available, otherwise fallback to local
  const totalStock = apiData?.totalStock ?? products.reduce((s, p) => s + p.stock, 0);
  const lowStockCount = apiData?.lowStockItems ?? products.filter(p => p.stock <= 10).length;
  const totalRevenue = apiData?.totalRevenue ?? bills.reduce((s, b) => s + b.total, 0);
  const todayBillsCount = apiData?.todayBillsGenerated ?? bills.filter(b => b.date === new Date().toISOString().split('T')[0]).length;
  const todayRevenue = apiData?.todayRevenue ?? bills.filter(b => b.date === new Date().toISOString().split('T')[0]).reduce((s, b) => s + b.total, 0);
  const totalProducts = apiData?.totalProducts ?? products.length;
  const totalCustomers = apiData?.totalCustomers ?? customers.length;

  const recentBills = apiData?.recentBills ?? bills.slice(-5).reverse().map(b => ({
    billNo: b.billNo,
    customerName: b.customerName,
    customerType: b.customerType,
    date: b.date,
    total: b.total,
  }));

  const stats = [
    { label: 'Total Products', value: totalProducts, icon: Package, color: 'text-primary' },
    { label: 'Total Stock', value: totalStock + ' units', icon: TrendingUp, color: 'text-emerald-light' },
    { label: 'Low Stock Items', value: lowStockCount, icon: AlertTriangle, color: 'text-warning', link: '/low-stock' },
    { label: 'Total Customers', value: totalCustomers, icon: Users, color: 'text-accent' },
    { label: "Today's Bills", value: todayBillsCount, icon: ShoppingCart, color: 'text-primary' },
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-success' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="page-header text-xl sm:text-2xl md:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back to Sadik Traders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {stats.map((stat, i) => {
          const Card = (
            <div key={i} className="stat-card group" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-bold font-display mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-muted ${stat.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                  <stat.icon size={22} />
                </div>
              </div>
            </div>
          );
          return stat.link ? <Link to={stat.link} key={i}>{Card}</Link> : <div key={i}>{Card}</div>;
        })}
      </div>

      {/* Today's Summary */}
      <div className="glass-card p-4 sm:p-6">
        <h3 className="font-display text-lg font-semibold mb-2">Today's Summary</h3>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Bills Generated</p>
            <p className="text-xl font-bold">{todayBillsCount}</p>
          </div>
        </div>
      </div>

      {/* Recent Bills */}
      {recentBills.length > 0 && (
        <div className="glass-card p-4 sm:p-6 animate-slide-up">
          <h3 className="font-display text-lg font-semibold mb-4">Recent Bills</h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-4 sm:px-2 text-muted-foreground font-medium">Customer</th>
                  <th className="text-left py-2 px-4 sm:px-2 text-muted-foreground font-medium">Bill Generated Date</th>
                  <th className="text-right py-2 px-4 sm:px-2 text-muted-foreground font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.map((bill, idx) => (
                  <tr key={idx} className="table-row-hover border-b border-border/50">
                    <td className="py-2.5 px-4 sm:px-2">{bill.customerName}</td>
                    <td className="py-2.5 px-4 sm:px-2 text-muted-foreground">{bill.date}</td>
                    <td className="py-2.5 px-4 sm:px-2 text-right font-semibold">₹{bill.total.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
