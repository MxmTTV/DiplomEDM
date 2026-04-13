import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, theme as antdTheme, Badge } from 'antd';
import {
    DashboardOutlined, FileTextOutlined, LogoutOutlined,
    UserOutlined, BellOutlined, CrownOutlined
} from '@ant-design/icons';
import useAuthStore from '../store/authStore';
import { notify } from '../utils/notification';
import type { Role } from '../types/roles';
import type { JSX } from 'react/jsx-runtime';

const { Header, Sider, Content } = Layout;

const MENU_ITEMS: Record<Role, Array<{ key: string; label: string; icon: JSX.Element; path: string }>> = {
    teacher: [
        { key: 'dashboard', label: 'Дашборд', icon: <DashboardOutlined />, path: '/dashboard' },
        { key: 'documents', label: 'Мои документы', icon: <FileTextOutlined />, path: '/documents' },
    ],
    zavuch: [
        { key: 'dashboard', label: 'Дашборд', icon: <DashboardOutlined />, path: '/dashboard' },
        { key: 'documents', label: 'Все документы', icon: <FileTextOutlined />, path: '/documents' },
    ],
    secretary: [
        { key: 'dashboard', label: 'Дашборд', icon: <DashboardOutlined />, path: '/dashboard' },
        { key: 'documents', label: 'Реестр', icon: <FileTextOutlined />, path: '/documents' },
    ],
    director: [
        { key: 'dashboard', label: 'Дашборд', icon: <DashboardOutlined />, path: '/dashboard' },
        { key: 'documents', label: 'Документы', icon: <FileTextOutlined />, path: '/documents' },
    ],
};

const MainLayout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const { token: antdToken } = antdTheme.useToken();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = () => {
        logout();
        notify.success('Вы вышли из системы');
        navigate('/login');
    };

    const menuItems = MENU_ITEMS[user.role].map(item => ({
        key: item.path,
        icon: item.icon,
        label: item.label,
        onClick: () => navigate(item.path),
    }));

    const userMenu = {
        items: [
            { key: 'profile', icon: <UserOutlined />, label: user.email },
            { key: 'logout', icon: <LogoutOutlined />, label: 'Выйти', danger: true, onClick: handleLogout },
        ],
    };

    return (
        <Layout className="app-surface main-shell" style={{ minHeight: '100vh' }}>
            <Sider
                width={250}
                theme="dark"
                breakpoint="lg"
                collapsedWidth={0}
            >
                <div className="main-sidebar-header">
                    <h3 style={{ margin: 0, color: '#fff', fontSize: 20, letterSpacing: 0.2 }}>DiplomEDM</h3>
                    <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>Smart document workspace</span>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    style={{ border: 'none', paddingTop: 10, fontWeight: 600 }}
                />
            </Sider>
            <Layout>
                <Header className="main-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                        {MENU_ITEMS[user.role].find(i => i.path === location.pathname)?.label || 'Панель'}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Badge count={3} size="small" color="#4f46e5">
                            <Button type="text" icon={<BellOutlined />} size="large" style={{ color: '#334155' }} />
                        </Badge>
                        <Dropdown menu={userMenu} trigger={['click']}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                                background: '#fff', border: `1px solid ${antdToken.colorBorderSecondary}`,
                                borderRadius: 14, padding: '6px 10px'
                            }}>
                                <Avatar icon={<UserOutlined />} style={{ background: 'linear-gradient(135deg, #4f46e5, #2563eb)' }} />
                                <div className="mobile-hide">
                                    <div style={{ fontWeight: 700, lineHeight: 1.15 }}>{user.full_name}</div>
                                    <div style={{ fontSize: 11, color: antdToken.colorTextSecondary }}>
                                        {user.role === 'director' && <CrownOutlined style={{ marginRight: 4 }} />}
                                        {user.role.toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </Dropdown>
                    </div>
                </Header>
                <Content style={{ padding: 24, background: 'transparent' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;