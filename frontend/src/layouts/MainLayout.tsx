import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, theme as antdTheme, Badge } from 'antd';
import {
    DashboardOutlined, FileTextOutlined, LogoutOutlined,
    UserOutlined, BellOutlined
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
            { key: 'profile', icon: <UserOutlined />, label: 'Профиль' },
            { key: 'logout', icon: <LogoutOutlined />, label: 'Выйти', danger: true, onClick: handleLogout },
        ],
    };

    return (
        <Layout className="app-surface" style={{ minHeight: '100vh' }}>
            <Sider
                width={250}
                theme="light"
                breakpoint="lg"
                collapsedWidth={0}
                style={{
                    borderRight: `1px solid ${antdToken.colorBorderSecondary}`,
                    boxShadow: '8px 0 20px rgba(15, 23, 42, 0.03)',
                }}
            >
                <div style={{ padding: '20px 16px 18px', borderBottom: `1px solid ${antdToken.colorBorderSecondary}` }}>
                    <h3 className="app-logo" style={{ margin: 0 }}>DiplomEDM</h3>
                    <span style={{ color: antdToken.colorTextSecondary, fontSize: 12 }}>Документооборот учреждения</span>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    style={{ border: 'none', paddingTop: 10 }}
                />
            </Sider>
            <Layout>
                <Header style={{
                    background: '#fff', padding: '0 24px', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: `1px solid ${antdToken.colorBorderSecondary}`, boxShadow: '0 4px 14px rgba(15,23,42,0.04)'
                }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 650 }}>
                        {MENU_ITEMS[user.role].find(i => i.path === location.pathname)?.label || 'Панель'}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Badge count={3} size="small">
                            <Button type="text" icon={<BellOutlined />} size="large" />
                        </Badge>
                        <Dropdown menu={userMenu} trigger={['click']}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <Avatar icon={<UserOutlined />} style={{ background: 'linear-gradient(135deg, #4f46e5, #2563eb)' }} />
                                <span style={{ fontWeight: 500 }}>{user.full_name}</span>
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