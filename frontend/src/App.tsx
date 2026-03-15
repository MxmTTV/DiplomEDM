import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Documents from './pages/Documents';
import './styles/global.css';

function App() {
    return (
        <ConfigProvider locale={ruRU} theme={{ token: { colorPrimary: '#667eea', borderRadius: 8 } }}>
            <Toaster position="top-right" />
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </ConfigProvider>
    );
}
export default App;