import { create } from 'zustand';

interface User {
    id: number;
    email: string;
    full_name: string;
    role: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
}

const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: localStorage.getItem('token'),

    login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
    },

    isAuthenticated: () => !!localStorage.getItem('token'),
}));

export default useAuthStore;