import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, Menu, X, AlertTriangle, LogOut, Phone as PhoneIcon, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import logo from '@/assets/logo.jpeg';
import Footer from './Footer';

const adminNavItems = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard },
  { title: 'Products', path: '/products', icon: Package },
  { title: 'Billing', path: '/billing', icon: ShoppingCart },
  { title: 'Customers', path: '/customers', icon: Users },
  { title: 'Low Stock', path: '/low-stock', icon: AlertTriangle },
  { title: 'Contact Us', path: '/contact', icon: PhoneIcon },
  { title: 'Settings', path: '/settings', icon: Settings },
];

const userNavItems = [
  { title: 'Attendance', path: '/attendance', icon: ClipboardCheck },
  { title: 'Products', path: '/products', icon: Package },
  { title: 'Low Stock', path: '/low-stock', icon: AlertTriangle },
  { title: 'Contact Us', path: '/contact', icon: PhoneIcon },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 h-screen z-50 w-64 gradient-primary text-primary-foreground flex flex-col transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <img src={logo} alt="Sadik Traders" className="w-12 h-12 rounded-full object-cover ring-2 ring-accent/50" />
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold truncate">Sadik Traders</h1>
            <p className="text-xs opacity-80">Since 1989</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1 hover:bg-sidebar-accent rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md'
                    : 'text-primary-foreground/80 hover:bg-sidebar-accent/50 hover:text-primary-foreground'
                }`}
              >
                <item.icon size={18} className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-accent' : ''}`} />
                <span>{item.title}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </nav>

        {/* User info & Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{user?.name}</p>
              <p className="text-[10px] opacity-60">{isAdmin ? 'Admin' : 'User'}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-destructive/20 text-primary-foreground/80 hover:text-primary-foreground transition-all">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors">
            <Menu size={20} />
          </button>
          <h2 className="font-display text-lg font-semibold text-foreground">
            {navItems.find(i => i.path === location.pathname)?.title || 'Sadik Traders'}
          </h2>
          <div className="ml-auto flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${isAdmin ? 'bg-primary/10 text-primary font-medium' : 'bg-accent/10 text-accent font-medium'}`}>
              {isAdmin ? '🔑 Admin' : '👤 User'}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
