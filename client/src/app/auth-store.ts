import { create } from 'zustand';
import { AxiosError } from 'axios';
import { api, clearAccessToken, setAccessToken } from '@/lib/api';
import type { CurrentUser } from '@/types/app';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

type AuthResponse = {
  accessToken: string;
  user: CurrentUser;
};

type ChildFirstLoginResponse = {
  childToken: string;
  childUserId: string;
  email: string;
};

type AuthState = {
  currentUser: CurrentUser | null;
  accessToken: string | null;
  childToken: string | null;
  status: AuthStatus;
  errorMessage: string | null;
  initialize: () => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: {
    email: string;
    username: string;
    displayName: string;
    password: string;
    familyCode?: string;
  }) => Promise<void>;
  childFirstLogin: (input: { email: string; code: string }) => Promise<void>;
  childSetPassword: (input: { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const CHILD_TOKEN_STORAGE_KEY = 'newsocial.child-token';

const readStoredChildToken = () => window.sessionStorage.getItem(CHILD_TOKEN_STORAGE_KEY);
const storeChildToken = (token: string) => window.sessionStorage.setItem(CHILD_TOKEN_STORAGE_KEY, token);
const clearStoredChildToken = () => window.sessionStorage.removeItem(CHILD_TOKEN_STORAGE_KEY);

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    if (error.code === 'ERR_NETWORK') {
      return 'The server is unavailable. Start the backend on http://localhost:4000 and try again.';
    }

    return (
      (error.response?.data as { message?: string } | undefined)?.message ??
      'Something went wrong. Please try again.'
    );
  }

  return 'Something went wrong. Please try again.';
};

const applyAuth = (payload: AuthResponse, set: (partial: Partial<AuthState>) => void) => {
  setAccessToken(payload.accessToken);
  set({
    accessToken: payload.accessToken,
    currentUser: payload.user,
    status: 'authenticated',
    errorMessage: null,
  });
};

const clearAuth = (set: (partial: Partial<AuthState>) => void) => {
  clearAccessToken();
  clearStoredChildToken();
  set({
    accessToken: null,
    currentUser: null,
    childToken: null,
    status: 'unauthenticated',
    errorMessage: null,
  });
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  accessToken: null,
  childToken: readStoredChildToken(),
  status: 'idle',
  errorMessage: null,

  initialize: async () => {
    const status = get().status;
    if (status === 'loading' || status === 'authenticated') {
      return;
    }

    set({ status: 'loading', errorMessage: null, childToken: readStoredChildToken() });

    try {
      const { data } = await api.post<AuthResponse>('/auth/refresh', {});
      applyAuth(data, set);
    } catch {
      clearAuth(set);
    }
  },

  login: async (input) => {
    set({ status: 'loading', errorMessage: null });

    try {
      const { data } = await api.post<AuthResponse>('/auth/login', input);
      applyAuth(data, set);
    } catch (error) {
      clearAuth(set);
      set({ errorMessage: getErrorMessage(error) });
      throw error;
    }
  },

  register: async (input) => {
    set({ status: 'loading', errorMessage: null });

    try {
      const { data } = await api.post<AuthResponse>('/auth/register', input);
      applyAuth(data, set);
    } catch (error) {
      clearAuth(set);
      set({ errorMessage: getErrorMessage(error) });
      throw error;
    }
  },

  childFirstLogin: async (input) => {
    set({ status: 'loading', errorMessage: null });

    try {
      const { data } = await api.post<ChildFirstLoginResponse>('/auth/child/first-login', input);
      storeChildToken(data.childToken);
      set({
        childToken: data.childToken,
        status: 'unauthenticated',
        errorMessage: null,
      });
    } catch (error) {
      set({
        status: 'unauthenticated',
        errorMessage: getErrorMessage(error),
      });
      throw error;
    }
  },

  childSetPassword: async ({ password }) => {
    const childToken = get().childToken ?? readStoredChildToken();
    if (!childToken) {
      set({
        status: 'unauthenticated',
        errorMessage: 'Child setup session is missing. Start again from child access.',
      });
      throw new Error('Missing child setup token');
    }

    set({ status: 'loading', errorMessage: null });

    try {
      const { data } = await api.post<AuthResponse>('/auth/child/set-password', {
        childToken,
        password,
      });
      clearStoredChildToken();
      applyAuth(data, set);
      set({ childToken: null });
    } catch (error) {
      set({
        status: 'unauthenticated',
        errorMessage: getErrorMessage(error),
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {});
    } finally {
      clearAuth(set);
    }
  },

  clearError: () => set({ errorMessage: null }),
}));
