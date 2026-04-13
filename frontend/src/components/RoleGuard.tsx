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
    fallbackPath = '/unauthorized'
}) => {
    const { user } = useAuthStore();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to={fallbackPath} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};