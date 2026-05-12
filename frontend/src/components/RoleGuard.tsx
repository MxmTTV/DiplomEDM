import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import type { Role } from '../types/roles';

interface RoleGuardProps {
    allowedRoles: Role[];
    children: React.ReactNode;
    fallbackPath?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
    allowedRoles,
    children,
    fallbackPath = '/login'
}) => {
    const { user } = useAuthStore();
    const location = useLocation();

    // Отладка
    console.log("RoleGuard check:", {
        user: user,
        role: user?.role,
        allowed: allowedRoles
    });

    if (!user || !user.role) {
        console.log("RoleGuard: No user → redirect to login");
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Приводим к нижнему регистру для надёжности
    const userRole = user.role.toLowerCase() as Role;
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase() as Role);

    if (!normalizedAllowed.includes(userRole)) {
        console.log("RoleGuard: Role not allowed");
        return <Navigate to={fallbackPath} state={{ from: location }} replace />;
    }

    console.log("RoleGuard: Access granted");
    return <>{children}</>;
};