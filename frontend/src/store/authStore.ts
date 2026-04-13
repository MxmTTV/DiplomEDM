import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from '../types/roles';

export interface User {
    id: number;
    email: string;
    full_name: string;
    role: Role;
}

interface AuthState {
    user: User | null;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => void;
    updateRole: (role: Role) => void;
}

const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            login: (user, token) => set({ user, token }),
            logout: () => {
                localStorage.removeItem('token');
                set({ user: null, token: null });
            },
            updateRole: (role) => set((state) => ({
                user: state.user ? { ...state.user, role } : null
            })),
        }),
        { name: 'auth-storage' }
    )
);

export default useAuthStore;