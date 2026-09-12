import { create } from 'zustand';

interface NavState {
  activeNavItem: string;
  setActiveNavItem: (item: string) => void;
}

export const useNavStore = create<NavState>((set) => ({
  activeNavItem: '',
  setActiveNavItem: (item) => set({ activeNavItem: item }),
}));
