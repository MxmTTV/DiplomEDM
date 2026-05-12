import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, theme as antdTheme, Badge, Divider, Tooltip } from 'antd';
import {
    FileTextOutlined, LogoutOutlined,
    UserOutlined, BellOutlined, CrownOutlined,
    DashboardOutlined, SettingOutlined
} from '@ant-design/icons';
import useAuthStore from '../store/authStore';
import { notify } from '../utils/notification';
import type { Role } from '../types/roles';
import type { JSX } from 'react/jsx-runtime';

const { Header, Sider, Content } = Layout;

// 🎨 СТИЛИ ДЛЯ МЕНЮ
const menuIconStyle = {
    fontSize: 18,
    marginRight: 8,
    transition: 'all 0.3s ease',
};

const menuItemStyle = {
    borderRadius: 12,
    margin: '4px 8px',
    padding: '12px 16px',
    fontWeight: 500,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

const MENU_ITEMS: Record<Role, Array<{ key: string; label: string; icon: JSX.Element; path: string }>> = {
    teacher: [
        { key: 'documents', label: 'Мои документы', icon: <FileTextOutlined style={menuIconStyle} />, path: '/documents' },
    ],
    zavuch: [
        { key: 'documents', label: 'Все документы', icon: <FileTextOutlined style={menuIconStyle} />, path: '/documents' },
    ],
    secretary: [
        { key: 'documents', label: 'Реестр', icon: <FileTextOutlined style={menuIconStyle} />, path: '/documents' },
    ],
    director: [
        { key: 'documents', label: 'Документы', icon: <FileTextOutlined style={menuIconStyle} />, path: '/documents' },
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
        style: menuItemStyle,
    }));

    const userMenu: any = {
        items: [
            {
                key: 'profile',
                icon: <UserOutlined />,
                label: (
                    <div>
                        <div style={{ fontWeight: 600 }}>{user.full_name}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{user.email}</div>
                    </div>
                ),
                disabled: true,
            },
            {
                key: 'role',
                icon: <CrownOutlined />,
                label: user.role.toUpperCase(),
                disabled: true,
            },
            { type: 'divider' },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Выйти',
                danger: true,
                onClick: handleLogout,
            },
        ],
    };

    return (
        <Layout className="app-surface main-shell" style={{ minHeight: '100vh' }}>
            <Sider
                width={260}
                theme="dark"
                breakpoint="lg"
                collapsedWidth={0}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
                }}
            >
                {/* 📌 ЛОГОТИП С ГРАДИЕНТОМ */}
                <div
                    className="main-sidebar-header"
                    style={{
                        padding: '28px 24px',
                        background: 'linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(37,99,235,0.05) 100%)',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
                        }}>
                            <FileTextOutlined style={{ color: '#fff', fontSize: 20 }} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>
                                ОбрДокумент
                            </h3>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 400 }}>
                                Система управления документами
                            </span>
                        </div>
                    </div>
                </div>

                {/* 📋 МЕНЮ С АНИМАЦИЯМИ */}
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    style={{
                        border: 'none',
                        paddingTop: 20,
                        background: 'transparent',
                        flex: 1,
                    }}
                    theme="dark"
                />

                {/* 👤 ПРОФИЛЬ ВНИЗУ С УЛУЧШЕНИЯМИ */}
                <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <Dropdown menu={userMenu} trigger={['click']} placement="topRight">
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                cursor: 'pointer',
                                padding: '14px 16px',
                                borderRadius: 14,
                                background: 'linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(81, 88, 105, 0.08) 100%)',
                                border: '1px solid rgba(79,70,229,0.2)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.25)';
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(79,70,229,0.25) 0%, rgba(37,99,235,0.15) 100%)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(37,99,235,0.08) 100%)';
                            }}
                        >
                            <Avatar
                                icon={<UserOutlined />}
                                style={{
                                    background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
                                    width: 42,
                                    height: 42,
                                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
                                    fontSize: 18,
                                }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontWeight: 600,
                                    color: '#fff',
                                    fontSize: 14,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                }}>
                                    {user.full_name}
                                </div>
                                <div style={{
                                    fontSize: 11,
                                    color: 'rgba(255,255,255,0.6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    marginTop: 4,
                                }}>
                                    {user.role === 'director' && (
                                        <CrownOutlined style={{ color: '#fbbf24', fontSize: 12 }} />
                                    )}
                                    <span style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        fontWeight: 500,
                                    }}>
                                        {user.role.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Dropdown>
                </div>
            </Sider>

            {/* 📌 ШАПКА */}
            <Layout>
                <Header className="main-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fff',
                    padding: '0 32px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    height: 64,
                }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                        {MENU_ITEMS[user.role].find(i => i.path === location.pathname)?.label || 'Панель'}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Tooltip title="Уведомления">
                            <Badge count={3} size="small" color="#4f46e5">
                                <Button
                                    type="text"
                                    icon={<BellOutlined />}
                                    size="large"
                                    style={{
                                        color: '#334155',
                                        fontSize: 18,
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                />
                            </Badge>
                        </Tooltip>
                    </div>
                </Header>

                <Content style={{ padding: 24, background: '#f4f7ff' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;