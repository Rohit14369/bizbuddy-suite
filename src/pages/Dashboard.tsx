import { useStore } from '@/context/StoreContext';
import { Package, ShoppingCart, Users, AlertTriangle, TrendingUp, IndianRupee, TrendingDown } from 'lucide-react';
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
  const [apiBills, setApiBills] = useState<any[]>([]);
  const [apiProducts, setApiProducts] = useState<any[]>([]);

  useEffect(() => {
    api.get('/dashboard')
      .then(res => {
        if (res.data?.success) {
          setApiData(res.data.data);
        }
      })
      .catch(() => {});

    // Fetch bills and products for profit calculation
    api.get('/bills').then(res => setApiBills(Array.isArray(res.data) ? res.data : [])).catch(() => {});
    api.get('/products').then(res => setApiProducts(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, []);

  const todayDateString = new Date().toLocaleDateString('en-CA'); 

  const totalStock = apiData?.totalStock ?? products.reduce((s, p) => s + p.stock, 0);
  const lowStockCount = apiData?.lowStockItems ?? (apiProducts.length > 0 ? apiProducts.filter(p => p.stock <= 50).length : products.filter(p => p.stock <= 50).length);
  const totalRevenue = apiData?.totalRevenue ?? bills.reduce((s, b) => s + b.total, 0);

  // Calculate Total Profit: sum of (sellingPrice - buyingPrice) * quantity for all bill items
  const totalProfit = (() => {
    const prodList = apiProducts.length > 0 ? apiProducts : products;
    const billList = apiBills.length > 0 ? apiBills : bills;
    let profit = 0;
    billList.forEach((bill: any) => {
      (bill.items || []).forEach((item: any) => {
        // Find the product to get buyingPrice
        const product = prodList.find((p: any) => 
          p.name === item.productName || p._id === item.productId || p.id === item.productId
        );
        const buyingPrice = product?.buyingPrice || 0;
        const sellingPrice = item.price || 0;
        const qty = item.quantity || 0;
        profit += (sellingPrice - buyingPrice) * qty;
      });
    });
    return profit;
  })();

  const normalCustomerRevenue =
    apiData?.normalCustomerRevenue ??
    bills
      .filter(b => b.customerType === 'normal')
      .reduce((s, b) => s + b.total, 0);

  const retailerCustomerRevenue =
    apiData?.retailerCustomerRevenue ??
    bills
      .filter(b => b.customerType === 'retailer')
      .reduce((s, b) => s + b.total, 0);

  const todayBillsCount =
    apiData?.todayBillsGenerated ??
    bills.filter(b => {
      const billDate = new Date(b.date).toLocaleDateString('en-CA');
      return billDate === todayDateString;
    }).length;

  const totalProducts = apiData?.totalProducts ?? products.length;
  const totalCustomers = apiData?.totalCustomers ?? customers.length;

  const stats = [
    { label: 'Total Products', value: totalProducts, icon: Package, color: 'text-primary' },
    { label: 'Total Stock', value: totalStock + ' units', icon: TrendingUp, color: 'text-emerald-light' },
    { label: 'Low Stock Items', value: lowStockCount, icon: AlertTriangle, color: 'text-warning', link: '/low-stock' },
    { label: 'Total Customers', value: totalCustomers, icon: Users, color: 'text-accent' },
    { label: "Today's Bills", value: todayBillsCount, icon: ShoppingCart, color: 'text-primary' },
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-success' },
    { label: 'Total Profit', value: `₹${totalProfit.toLocaleString('en-IN')}`, icon: TrendingDown, color: totalProfit >= 0 ? 'text-success' : 'text-destructive' },
    { label: 'Normal Customer Revenue', value: `₹${normalCustomerRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-primary' },
    { label: 'Retailer Customer Revenue', value: `₹${retailerCustomerRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-warning' },
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
    </div>
  );
}
