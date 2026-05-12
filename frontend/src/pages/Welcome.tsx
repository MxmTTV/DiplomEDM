// src/pages/Welcome.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Progress, Avatar } from 'antd';
import { FileTextOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import useAuthStore from '../store/authStore';

function Welcome() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [progress, setProgress] = useState(0);
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        // 🔍 Отладка: смотрим что приходит от бэкенда
        console.log('=== Welcome Page ===');
        console.log('User object:', user);
        console.log('full_name:', user?.full_name);
        console.log('email:', user?.email);
        console.log('role:', user?.role);

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return prev + 2;
            });
        }, 50);

        const countdownTimer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownTimer);
                    navigate('/documents');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            clearInterval(countdownTimer);
        };
    }, [navigate, user]);

    // ✅ НАДЁЖНОЕ ПОЛУЧЕНИЕ ИМЕНИ
    const getDisplayName = () => {
        if (!user) return 'Пользователь';

        // Пробуем full_name
        if (user.full_name && typeof user.full_name === 'string' && user.full_name.trim().length > 0) {
            return user.full_name.trim();
        }

        // Пробуем email (берём часть до @)
        if (user.email && typeof user.email === 'string') {
            const emailName = user.email.split('@')[0];
            if (emailName && emailName.length > 0) {
                // Делаем первую букву заглавной
                return emailName.charAt(0).toUpperCase() + emailName.slice(1);
            }
        }

        // Пробуем id как крайний вариант
        if (user.id) {
            return `Пользователь #${user.id}`;
        }

        return 'Пользователь';
    };

    const fullName = getDisplayName();
    const firstName = fullName.includes(' ') ? fullName.split(' ')[0] : fullName;

    // ✅ РОЛЬ НА РУССКОМ
    const roleLabels: Record<string, string> = {
        director: 'Директор',
        secretary: 'Секретарь',
        zavuch: 'Завуч',
        teacher: 'Преподаватель',
    };
    const roleLabel = (user?.role && roleLabels[user.role]) || user?.role || 'Пользователь';

    // ✅ ОПИСАНИЕ ПО РОЛИ
    const roleDescriptions: Record<string, string> = {
        director: 'Управляйте документами и контролируйте все процессы в системе.',
        secretary: 'Регистрируйте входящие и исходящие документы, ведите архив.',
        zavuch: 'Координируйте учебный процесс и работайте с документами.',
        teacher: 'Загружайте документы и отслеживайте их статус.',
    };
    const description = (user?.role && roleDescriptions[user.role]) || 'Добро пожаловать в систему!';

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
                padding: 20,
            }}
        >
            <Card
                style={{
                    maxWidth: 480,
                    width: '100%',
                    borderRadius: 24,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    border: 'none',
                    textAlign: 'center',
                    padding: '40px 32px',
                    background: 'rgba(255,255,255,0.95)',
                }}
            >
                {/* 🎨 ИКОНКА */}
                <div
                    style={{
                        width: 70,
                        height: 70,
                        borderRadius: 16,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                    }}
                >
                    <FileTextOutlined style={{ color: '#fff', fontSize: 36 }} />
                </div>

                {/* 👋 ПРИВЕТСТВИЕ */}
                <h1
                    style={{
                        margin: '0 0 20px',
                        fontSize: 24,
                        fontWeight: 700,
                        color: '#1e293b',
                    }}
                >
                    Здравствуйте, {firstName}! 👋
                </h1>

                {/* 👤 ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        marginBottom: 20,
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                        borderRadius: 12,
                        maxWidth: 320,
                        margin: '0 auto 24px',
                    }}
                >
                    <Avatar
                        icon={<UserOutlined />}
                        style={{
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            width: 36,
                            height: 36,
                        }}
                    />
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{fullName}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>👑 {roleLabel}</div>
                    </div>
                </div>

                {/* 📝 ОПИСАНИЕ */}
                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                    {description}
                </p>

                {/* 🔄 ПРОГРЕСС БАР */}
                <div style={{ marginBottom: 24 }}>
                    <Progress
                        percent={progress}
                        showInfo={false}
                        strokeColor={{
                            '0%': '#667eea',
                            '100%': '#764ba2',
                        }}
                        trailColor="#e2e8f0"
                        size="small"
                    />
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
                        Перенаправление через {countdown} сек...
                    </div>
                </div>

                {/* 🔘 КНОПКА */}
                <Button
                    type="primary"
                    size="large"
                    block
                    onClick={() => navigate('/documents')}
                    icon={<ArrowRightOutlined />}
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: 12,
                        padding: '14px 24px',
                        fontSize: 15,
                        fontWeight: 600,
                        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                    }}
                >
                    Перейти к работе
                </Button>

                {/* ⭐ ПОДПИСЬ */}
                <div style={{ marginTop: 20, fontSize: 12, color: '#94a3b8' }}>
                    ⭐ Интерфейс настроен под вашу роль
                </div>
            </Card>
        </div>
    );
}

export default Welcome;