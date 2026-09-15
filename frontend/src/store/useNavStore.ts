import { create } from 'zustand';

interface NavState {
  activeNavItem: string;
  setActiveNavItem: (item: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
}

export const useNavStore = create<NavState>((set) => ({
  activeNavItem: '',
  setActiveNavItem: (item) => set({ activeNavItem: item, isMobileMenuOpen: false }),
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
}));
