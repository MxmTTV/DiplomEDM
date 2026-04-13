import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { Toaster } from 'react-hot-toast';
import { RoleGuard } from './components/RoleGuard';
import type { Role } from './types/roles';

// Pages
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import Dashboard from './components/Dashboard';
import Documents from './pages/Documents';

// Layout
import MainLayout from './layouts/MainLayout';

import './styles/global.css';

const ALL_ROLES: Role[] = ['teacher', 'zavuch', 'secretary', 'director'];

function App() {
    return (
        <ConfigProvider
            locale={ruRU}
            theme={{
                token: {
                    colorPrimary: '#4f46e5',
                    borderRadius: 10,
                    colorBgLayout: '#f4f7ff',
                    colorTextBase: '#1f2937',
                    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                },
                components: {
                    Card: { borderRadiusLG: 14 },
                    Button: { borderRadius: 10, controlHeight: 40 },
                    Layout: { headerBg: '#ffffff', siderBg: '#ffffff' },
                },
            }}
        >
            <Toaster position="top-right" />
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/welcome" element={<Welcome />} />

                    <Route element={<MainLayout />}>
                        <Route path="/dashboard" element={
                            <RoleGuard allowedRoles={ALL_ROLES}><Dashboard documents={[]} /></RoleGuard>
                        } />
                        <Route path="/documents" element={
                            <RoleGuard allowedRoles={ALL_ROLES}><Documents /></RoleGuard>
                        } />
                    </Route>

                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </ConfigProvider>
    );
}

export default App;