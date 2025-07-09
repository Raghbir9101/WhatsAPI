import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const Layout: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'WhatsApp Numbers', href: '/numbers', icon: MessageCircle },
    { name: 'Send Message', href: '/send', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavigationContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-6 border-b">
        <MessageCircle className="h-6 w-6 text-whatsapp-green" />
        <span className="font-semibold text-whatsapp-dark">WhatsApp API</span>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-whatsapp-green text-white'
                      : 'text-whatsapp-gray hover:bg-whatsapp-light-gray hover:text-whatsapp-dark'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <div className="mb-4">
          <p className="text-sm font-medium text-whatsapp-dark">{user?.name}</p>
          <p className="text-xs text-whatsapp-gray">{user?.email}</p>
        </div>
        <Button
          onClick={logout}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-border">
        <NavigationContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-40"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <NavigationContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 md:pl-64">
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};