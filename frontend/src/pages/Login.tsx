import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/login', values);
            login(response.data.user, response.data.token);
            message.success('Успешный вход!');
            navigate('/documents');
        } catch (error) {
            message.error('Неверный email или пароль');
        }
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <Card
                title="🔐 Вход в систему ЭДО"
                style={{ width: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
                bordered={false}
            >
                <Form onFinish={onFinish} layout="vertical" size="large">
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