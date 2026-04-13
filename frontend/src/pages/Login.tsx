import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

function Login() {
    const { Title, Text } = Typography;
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/login', values);
            login(response.data.user, response.data.token);
            message.success('Успешный вход!');
            sessionStorage.removeItem('hasSeenWelcome');
            navigate('/welcome');
        } catch (error) {
            message.error('Неверный email или пароль');
        }
        setLoading(false);
    };

    return (
        <div className="auth-shell">
            <Card className="auth-card glass-card animate-fadeIn" bordered={false}>
                <div style={{ marginBottom: 24 }}>
                    <div className="auth-brand-chip">
                        <SafetyCertificateOutlined />
                        Защищенный EDM Workspace
                    </div>
                    <Title className="auth-title" level={2}>Добро пожаловать</Title>
                    <Text type="secondary">Авторизуйтесь и продолжите работу с документами учреждения</Text>
                </div>

                <Form onFinish={onFinish} layout="vertical" size="large" autoComplete="off">
                    <Form.Item
                        name="email"
                        rules={[{ required: true, type: 'email', message: 'Введите корректный email' }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Email"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, min: 6 }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Пароль"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            size="large"
                            className="btn-primary"
                        >
                            Войти
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}

export default Login;