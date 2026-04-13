import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Result, Space, Typography } from 'antd';
import { FileTextOutlined, RocketOutlined } from '@ant-design/icons';
import useAuthStore from '../store/authStore';
import { ROLE_LABELS } from '../types/roles';

const Welcome: React.FC = () => {
    const { Text } = Typography;
    const { user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
        if (hasSeenWelcome) {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    const getWelcomeText = () => {
        if (!user) return '';
        switch (user.role) {
            case 'teacher': return 'Создавайте черновики документов и отправляйте их на проверку завучу.';
            case 'zavuch': return 'Проверяйте документы от учителей и направляйте их директору на утверждение.';
            case 'secretary': return 'Регистрируйте входящие и исходящие документы, ведите архив.';
            case 'director': return 'Утверждайте документы и отслеживайте статистику по вашему отделу.';
            default: return 'Добро пожаловать в систему электронного документооборота!';
        }
    };

    const handleContinue = () => {
        sessionStorage.setItem('hasSeenWelcome', 'true');
        navigate('/dashboard');
    };

    return (
        <div className="auth-shell">
            <Card className="auth-card animate-fadeIn" style={{ maxWidth: 640 }} bordered={false}>
                <Result
                    icon={<FileTextOutlined style={{ fontSize: 48, color: '#667eea' }} />}
                    title={`Привет, ${user?.full_name || 'коллега'}!`}
                    subTitle={
                        <div style={{ textAlign: 'left', fontSize: 16 }}>
                            <p style={{ marginBottom: 8 }}>
                                <strong>Ваша роль:</strong> {ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS] || user?.role}
                            </p>
                            <p style={{ color: '#666', margin: 0 }}>{getWelcomeText()}</p>
                        </div>
                    }
                    extra={
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Button
                                type="primary"
                                size="large"
                                icon={<RocketOutlined />}
                                onClick={handleContinue}
                                block
                                className="btn-primary"
                            >
                                Перейти к работе
                            </Button>
                            <Button onClick={() => navigate('/documents')} block>
                                Или сразу к документам
                            </Button>
                            <Text type="secondary" style={{ textAlign: 'center' }}>
                                Ваша стартовая панель настроена под роль и права доступа
                            </Text>
                        </Space>
                    }
                />
            </Card>
        </div>
    );
};

export default Welcome;