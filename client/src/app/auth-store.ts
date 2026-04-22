import { create } from 'zustand';
import { demoSnapshot } from '@/lib/mock-data';
import type { CurrentUser } from '@/types/app';

type AuthState = {
  currentUser: CurrentUser | null;
  hydrate: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  hydrate: () => set({ currentUser: demoSnapshot.currentUser }),
}));
