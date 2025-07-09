import React from 'react';
import { Outlet } from 'react-router-dom';
import { useUiStore } from '@/store/ui-store';
import { AppSidebar } from './app-sidebar';
import { AppNavbar } from './app-navbar';
import { cn } from '@/lib/utils';

export function AppShell() {
  const { sidebarOpen } = useUiStore();

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      
      <div className="flex">
        <AppSidebar />
        
        <main
          className={cn(
            'flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300'
          )}
        >
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}