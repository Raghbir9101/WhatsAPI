import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Smartphone,
  MessageSquare,
  History,
  Users,
  Calendar,
  BarChart3,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Link Device', href: '/link-device', icon: Smartphone },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Message History', href: '/message-history', icon: History },
  { name: 'Groups', href: '/groups', icon: Users },
  { name: 'Flows', href: '/flows', icon: Workflow },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'IndiaMART', href: '/indiamart', icon: Building2 },
  { name: 'Payment', href: '/payment', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const location = useLocation();

  return (
      <div className='bg-red-500 h-[calc(100vh-4rem)]'>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] bg-sidebar border-r border-sidebar-border transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20', // Reduced width when closed
          'md:relative md:top-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Toggle button */}
          <div className="p-4 border-b border-sidebar-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center px-5"
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                             (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                    sidebarOpen ? 'justify-start' : 'justify-center'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span 
                    className={cn(
                      'transition-all duration-300 overflow-hidden',
                      sidebarOpen ? 'ml-3 opacity-100 max-w-full' : 'ml-0 opacity-0 max-w-0'
                    )}
                  >
                    {item.name}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </div>
  );
}