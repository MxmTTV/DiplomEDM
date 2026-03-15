import { useState } from 'react';
import { Dropdown, Modal, Form, Input, Button, message, Avatar, type MenuProps } from 'antd';
import { UserOutlined, LockOutlined, LogoutOutlined, InfoCircleOutlined } from '@ant-design/icons';
import useAuthStore from '../store/authStore';

interface ProfileMenuProps {
    onLogout: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ onLogout }) => {
    const [passwordModal, setPasswordModal] = useState(false);
    const [infoModal, setInfoModal] = useState(false);
    const [passwordForm] = Form.useForm();
    const { user } = useAuthStore();

    const handleChangePassword = async (values: any) => {
        message.success('Пароль изменён!');
        setPasswordModal(false);
        passwordForm.resetFields();
    };

    const items: MenuProps['items'] = [
        {
            key: 'info',
            icon: <InfoCircleOutlined />,
            label: 'Информация',
            onClick: () => setInfoModal(true),
        },
        {
            key: 'password',
            icon: <LockOutlined />,
            label: 'Сменить пароль',
            onClick: () => setPasswordModal(true),
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Выйти',
            danger: true,
            onClick: onLogout,
        },
    ];

    return (
        <>
            <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease'
                }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                >
                    <Avatar icon={<UserOutlined />} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
                    <span style={{ fontWeight: 500 }}>{user?.full_name || user?.email}</span>
                </div>
            </Dropdown>

            {/* Модальное окно смены пароля */}
            <Modal
                title="🔑 Смена пароля"
                open={passwordModal}
                onCancel={() => setPasswordModal(false)}
                footer={null}
            >
                <Form form={passwordForm} onFinish={handleChangePassword} layout="vertical">
                    <Form.Item
                        name="oldPassword"
                        label="Текущий пароль"
                        rules={[{ required: true, message: 'Введите текущий пароль' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} />
                    </Form.Item>
                    <Form.Item
                        name="newPassword"
                        label="Новый пароль"
                        rules={[{ required: true, min: 6, message: 'Минимум 6 символов' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="Подтвердите пароль"
                        rules={[{ required: true, message: 'Подтвердите пароль' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Изменить пароль
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Модальное окно информации */}
            <Modal
                title="👤 Информация о пользователе"
                open={infoModal}
                onCancel={() => setInfoModal(false)}
                footer={null}
            >
                <div style={{ padding: 20 }}>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Имя:</strong> {user?.full_name}</p>
                    <p><strong>Роль:</strong> {user?.role === 'admin' ? '👑 Администратор' : '👤 Сотрудник'}</p>
                </div>
            </Modal>
        </>
    );
};

export default ProfileMenu;