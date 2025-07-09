import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'ADMIN' | 'AGENT';

interface UiState {
  sidebarOpen: boolean;
  darkMode: boolean;
  role: UserRole;
  setSidebarOpen: (open: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  setRole: (role: UserRole) => void;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      darkMode: false,
      role: 'ADMIN',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setDarkMode: (dark) => {
        set({ darkMode: dark });
        // Apply dark mode to document
        if (dark) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      },
      setRole: (role) => set({ role }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleDarkMode: () => set((state) => {
        const newDarkMode = !state.darkMode;
        // Apply dark mode to document
        if (newDarkMode) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
        return { darkMode: newDarkMode };
      }),
    }),
    {
      name: 'ceo-ui-store',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        darkMode: state.darkMode,
        role: state.role,
      }),
    }
  )
);

// Initialize dark mode on load
const storedState = JSON.parse(localStorage.getItem('ceo-ui-store') || '{}');
if (storedState?.state?.darkMode) {
  document.documentElement.setAttribute('data-theme', 'dark');
}