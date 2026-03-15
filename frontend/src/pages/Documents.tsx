import { useState, useEffect, useMemo } from 'react';
import {
    Table, Button, Card, Space, Modal, Form, Input, Tag,
    Upload, Drawer, Select, Tooltip, Divider, Badge,
    Row, Col, Statistic
} from 'antd';
import {
    PlusOutlined, UploadOutlined, EyeOutlined, DownloadOutlined,
    LogoutOutlined, SearchOutlined, ReloadOutlined, MoonOutlined,
    SunOutlined, UserOutlined, InfoCircleOutlined, LockOutlined,
    FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import mammoth from 'mammoth';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;
const { Option } = Select;

// 📝 ИНТЕРФЕЙСЫ
interface User {
    id: number;
    email: string;
    full_name: string;
    role: string;
}

interface Document {
    id: number;
    title: string;
    description: string;
    current_status: string;
    created_at: string;
    file_name: string;
    author_id: number;
}

interface HistoryItem {
    id: number;
    document_id: number;
    user_id: number;
    action: string;
    comment?: string;
    old_status?: string;
    new_status?: string;
    created_at: string;
    user?: { id: number; email: string; full_name: string };
}

interface UploadFormValues {
    title: string;
    description: string;
}

// 🎨 СТИЛИ ДЛЯ ТЁМНОЙ ТЕМЫ
const darkThemeStyles = {
    background: '#1a1a2e',
    cardBackground: '#16213e',
    text: '#eee',
    textSecondary: '#aaa',
    border: '#2a2a4a',
};

function Documents() {
    // ✅ STATE
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadModal, setUploadModal] = useState(false);
    const [historyDrawer, setHistoryDrawer] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [form] = Form.useForm<UploadFormValues>();
    const [uploadFile, setUploadFile] = useState<any>(null);
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    // 🔐 ПРОВЕРКА РОЛИ
    const isAdmin = user?.role === 'admin';

    // Статусы и комментарии
    const [statusModal, setStatusModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [commentForm] = Form.useForm<{ comment: string }>();

    // Предпросмотр
    const [previewModal, setPreviewModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [previewTitle, setPreviewTitle] = useState<string>('');
    const [isBlobUrl, setIsBlobUrl] = useState(false);

    // 🔍 Фильтры и поиск
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [sortBy, setSortBy] = useState('newest');

    // 🎨 Тема и профиль
    const [darkMode, setDarkMode] = useState(false);
    const [profileModal, setProfileModal] = useState(false);
    const [passwordModal, setPasswordModal] = useState(false);
    const [passwordForm] = Form.useForm();

    // 🔔 Уведомления
    const notify = {
        success: (msg: string) => toast.success(msg, {
            style: { background: '#52c41a', color: '#fff', borderRadius: '8px' },
            duration: 3000,
        }),
        error: (msg: string) => toast.error(msg, {
            style: { background: '#f5222d', color: '#fff', borderRadius: '8px' },
            duration: 4000,
        }),
        warning: (msg: string) => toast(msg, {
            style: { background: '#fa8c16', color: '#fff', borderRadius: '8px' },
            icon: '⚠️',
        }),
    };

    // Загрузка документов
    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/documents');
            setDocuments(response.data.documents);
        } catch (error) {
            notify.error('Ошибка загрузки документов');
        }
        setLoading(false);
    };

    // 🔍 Фильтрация и сортировка
    const filteredDocuments = useMemo(() => {
        let result = [...documents];

        // Поиск
        if (searchQuery) {
            result = result.filter(d =>
                d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Фильтр по статусу
        if (statusFilter) {
            result = result.filter(d => d.current_status === statusFilter);
        }

        // Сортировка
        result.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sortBy === 'name_asc') return a.title.localeCompare(b.title);
            if (sortBy === 'name_desc') return b.title.localeCompare(a.title);
            return 0;
        });

        return result;
    }, [documents, searchQuery, statusFilter, sortBy]);

    // 📊 Данные для дашборда
    const dashboardData = useMemo(() => {
        const stats = {
            total: documents.length,
            draft: documents.filter(d => d.current_status === 'draft').length,
            pending: documents.filter(d => d.current_status === 'pending').length,
            approved: documents.filter(d => d.current_status === 'approved').length,
            rejected: documents.filter(d => d.current_status === 'rejected').length,
        };

        const statusData = [
            { name: 'Черновик', value: stats.draft, color: '#d9d9d9' },
            { name: 'На согласовании', value: stats.pending, color: '#fa8c16' },
            { name: 'Утверждён', value: stats.approved, color: '#52c41a' },
            { name: 'Отклонён', value: stats.rejected, color: '#f5222d' },
        ];

        return { stats, statusData };
    }, [documents]);

    // 🎨 Обработчики
    const handleLogout = () => {
        logout();
        navigate('/login');
        notify.success('Вы вышли из системы');
    };

    const handleUpload = async (values: UploadFormValues) => {
        if (!uploadFile) {
            notify.error('Выберите файл!');
            return;
        }
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('title', values.title);
        formData.append('description', values.description || '');

        try {
            await api.post('/documents', formData);
            notify.success('Документ загружен!');
            setUploadModal(false);
            setUploadFile(null);
            form.resetFields();
            fetchDocuments();
        } catch (error: any) {
            notify.error(`Ошибка: ${error.response?.data?.error || error.message}`);
        }
    };

    const showHistory = async (doc: Document) => {
        setSelectedDoc(doc);
        try {
            const response = await api.get(`/documents/${doc.id}/history`);
            setHistory(response.data.history);
            setHistoryDrawer(true);
        } catch (error) {
            notify.error('Ошибка загрузки истории');
        }
    };

    const handleChangeStatus = async (doc: Document, newStatus: string) => {
        if (['approved', 'rejected'].includes(newStatus)) {
            setSelectedStatus(newStatus);
            setSelectedDoc(doc);
            setStatusModal(true);
            return;
        }
        try {
            await api.patch(`/documents/${doc.id}/status`, {
                status: newStatus,
                comment: `Смена статуса на ${getStatusText(newStatus)}`,
            });
            notify.success('Статус изменён!');
            fetchDocuments();
        } catch (error: any) {
            notify.error(`Ошибка: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleSubmitComment = async (values: { comment: string }) => {
        if (!selectedDoc) return;
        try {
            await api.patch(`/documents/${selectedDoc.id}/status`, {
                status: selectedStatus,
                comment: values.comment,
            });
            notify.success('Статус изменён!');
            setStatusModal(false);
            commentForm.resetFields();
            fetchDocuments();
        } catch (error: any) {
            notify.error(`Ошибка: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleDownload = async (doc: Document) => {
        try {
            const response = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.file_name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            notify.success('Файл скачан!');
        } catch (error) {
            notify.error('Ошибка скачивания');
        }
    };

    const handlePreview = async (doc: Document) => {
        try {
            const response = await api.get(`/documents/${doc.id}/download`, { responseType: 'arraybuffer' });
            const fileExt = doc.file_name.split('.').pop()?.toLowerCase();
            setPreviewTitle(doc.title);

            if (fileExt === 'pdf') {
                const blob = new Blob([response.data], { type: 'application/pdf' });
                setPreviewUrl(URL.createObjectURL(blob));
                setIsBlobUrl(true);
                setPreviewModal(true);
            } else if (['docx', 'doc'].includes(fileExt || '')) {
                const result = await mammoth.convertToHtml({ arrayBuffer: response.data });
                const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;padding:20px;max-width:800px;margin:0 auto;line-height:1.6}p{margin:10px 0}</style></head><body>${result.value}</body></html>`;
                const blob = new Blob([htmlContent], { type: 'text/html' });
                setPreviewUrl(URL.createObjectURL(blob));
                setIsBlobUrl(true);
                setPreviewModal(true);
            } else {
                notify.warning('Предпросмотр недоступен для этого типа файлов');
            }
        } catch (error) {
            notify.error('Не удалось открыть предпросмотр');
        }
    };

    const handlePreviewClose = () => {
        setPreviewModal(false);
        if (isBlobUrl && previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
        setIsBlobUrl(false);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setSortBy('newest');
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'default', pending: 'orange', approved: 'green', rejected: 'red', archived: 'blue'
        };
        return colors[status] || 'default';
    };

    const getStatusText = (status: string) => {
        const texts: Record<string, string> = {
            draft: 'Черновик', pending: 'На согласовании', approved: 'Утверждён', rejected: 'Отклонён', archived: 'Архив'
        };
        return texts[status] || status;
    };

    // 🎨 Стили для тёмной темы
    const theme = darkMode ? darkThemeStyles : {
        background: '#f0f2f5', cardBackground: '#fff', text: '#000', textSecondary: '#666', border: '#f0f0f0'
    };

    // 📋 Колонки таблицы
    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: 'Название', dataIndex: 'title', key: 'title', ellipsis: true },
        { title: 'Описание', dataIndex: 'description', key: 'description', ellipsis: true },
        {
            title: 'Статус',
            dataIndex: 'current_status',
            key: 'current_status',
            render: (status: string) => (
                <Tag color={getStatusColor(status)} className="status-badge">
                    {getStatusText(status)}
                </Tag>
            ),
        },
        {
            title: 'Дата',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleString('ru-RU'),
            width: 180,
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_: any, record: Document) => (
                <Space size="small" direction="vertical" wrap>
                    <Space size="small" wrap>
                        <Tooltip title="Предпросмотр">
                            <Button icon={<EyeOutlined />} size="small" onClick={() => handlePreview(record)}>👁️</Button>
                        </Tooltip>
                        <Tooltip title="Скачать">
                            <Button icon={<DownloadOutlined />} size="small" onClick={() => handleDownload(record)}>⬇️</Button>
                        </Tooltip>
                        <Tooltip title="История">
                            <Button icon={<EyeOutlined />} size="small" onClick={() => showHistory(record)}>📜</Button>
                        </Tooltip>
                    </Space>

                    {/* 🔓 Кнопки для сотрудника - только отправка на согласование */}
                    {record.current_status === 'draft' && (
                        <Button
                            type="link"
                            size="small"
                            onClick={() => handleChangeStatus(record, 'pending')}
                        >
                            📤 На согласование
                        </Button>
                    )}

                    {/* 🔒 Кнопки ТОЛЬКО для админа */}
                    {isAdmin && record.current_status === 'pending' && (
                        <Space size="small">
                            <Button
                                type="link"
                                size="small"
                                danger
                                onClick={() => handleChangeStatus(record, 'rejected')}
                            >
                                ❌ Отклонить
                            </Button>
                            <Button
                                type="link"
                                size="small"
                                onClick={() => handleChangeStatus(record, 'approved')}
                            >
                                ✅ Утвердить
                            </Button>
                        </Space>
                    )}

                    {/* 🔒 Архивация - только админ */}
                    {isAdmin && record.current_status === 'approved' && (
                        <Button
                            type="link"
                            size="small"
                            onClick={() => handleChangeStatus(record, 'archived')}
                        >
                            📦 В архив
                        </Button>
                    )}

                    {/* 🔒 Для сотрудника показываем сообщение, если нет прав */}
                    {!isAdmin && record.current_status === 'pending' && (
                        <Tag color="default" style={{ fontSize: 11 }}>🔒 Только админ</Tag>
                    )}
                    {!isAdmin && record.current_status === 'approved' && (
                        <Tag color="default" style={{ fontSize: 11 }}>🔒 Только админ</Tag>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="animate-fadeIn" style={{
            padding: 24, background: theme.background, minHeight: '100vh',
            transition: 'background 0.3s ease', color: theme.text
        }}>
            {/* 📊 HEADER */}
            <Card className="shadow-lg rounded-2xl animate-slideIn" style={{
                background: theme.cardBackground, marginBottom: 24, border: `1px solid ${theme.border}`
            }}>
                <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <Space>
                        <FileTextOutlined style={{ fontSize: 24, color: '#667eea' }} />
                        <h2 style={{ margin: 0 }}>📄 Система ЭДО</h2>
                    </Space>
                    <Space wrap>
                        <Tooltip title={darkMode ? 'Светлая тема' : 'Тёмная тема'}>
                            <Button
                                icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                                onClick={() => setDarkMode(!darkMode)}
                            />
                        </Tooltip>
                        <Badge count={documents.filter(d => d.current_status === 'pending').length} offset={[-5, 5]}>
                            <Button
                                icon={<UserOutlined />}
                                onClick={() => setProfileModal(true)}
                                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none' }}
                            >
                                {user?.full_name || user?.email} {isAdmin && '👑'}
                            </Button>
                        </Badge>
                        <Button icon={<LogoutOutlined />} onClick={handleLogout} danger>Выйти</Button>
                    </Space>
                </Space>
            </Card>

            {/* 📊 DASHBOARD */}
            <div className="animate-fadeIn" style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="shadow-lg rounded-2xl" style={{ background: theme.cardBackground, border: `1px solid ${theme.border}` }}>
                            <Statistic title="Всего документов" value={dashboardData.stats.total} prefix={<FileTextOutlined style={{ color: '#1890ff' }} />} valueStyle={{ color: '#1890ff', fontSize: 28 }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="shadow-lg rounded-2xl" style={{ background: theme.cardBackground, border: `1px solid ${theme.border}` }}>
                            <Statistic title="На согласовании" value={dashboardData.stats.pending} prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />} valueStyle={{ color: '#fa8c16', fontSize: 28 }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="shadow-lg rounded-2xl" style={{ background: theme.cardBackground, border: `1px solid ${theme.border}` }}>
                            <Statistic title="Утверждено" value={dashboardData.stats.approved} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a', fontSize: 28 }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="shadow-lg rounded-2xl" style={{ background: theme.cardBackground, border: `1px solid ${theme.border}` }}>
                            <Statistic title="Отклонено" value={dashboardData.stats.rejected} prefix={<CloseCircleOutlined style={{ color: '#f5222d' }} />} valueStyle={{ color: '#f5222d', fontSize: 28 }} />
                        </Card>
                    </Col>
                </Row>
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <Card title="📊 По статусам" className="shadow-lg rounded-2xl" style={{ background: theme.cardBackground, border: `1px solid ${theme.border}` }}>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={dashboardData.statusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                                        {dashboardData.statusData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title="📈 Последние документы" className="shadow-lg rounded-2xl" style={{ background: theme.cardBackground, border: `1px solid ${theme.border}` }}>
                            <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                                {documents.slice(0, 5).map((doc: Document) => (
                                    <div key={doc.id} style={{ padding: '8px 0', borderBottom: `1px solid ${theme.border}` }}>
                                        <strong>{doc.title}</strong>
                                        <Tag color={getStatusColor(doc.current_status)} style={{ marginLeft: 8 }}>{getStatusText(doc.current_status)}</Tag>
                                        <div style={{ fontSize: 12, color: theme.textSecondary }}>{new Date(doc.created_at).toLocaleDateString('ru-RU')}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* 🔍 ФИЛЬТРЫ */}
            <Card className="shadow-lg rounded-2xl animate-slideIn" style={{ background: theme.cardBackground, marginBottom: 24, border: `1px solid ${theme.border}` }}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <Input.Search placeholder="🔍 Поиск по названию..." allowClear value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onSearch={() => { }} style={{ flex: 1, minWidth: 250 }} prefix={<SearchOutlined />} />
                        <Select placeholder="📋 Статус" allowClear value={statusFilter} onChange={setStatusFilter} style={{ width: 180 }} options={[
                            { value: 'draft', label: 'Черновик' }, { value: 'pending', label: 'На согласовании' },
                            { value: 'approved', label: 'Утверждён' }, { value: 'rejected', label: 'Отклонён' }, { value: 'archived', label: 'Архив' },
                        ]} />
                        <Select placeholder="📅 Сортировка" value={sortBy} onChange={setSortBy} style={{ width: 180 }} options={[
                            { value: 'newest', label: 'Сначала новые' }, { value: 'oldest', label: 'Сначала старые' },
                            { value: 'name_asc', label: 'По названию (А-Я)' }, { value: 'name_desc', label: 'По названию (Я-А)' },
                        ]} />
                        <Button onClick={handleResetFilters} icon={<ReloadOutlined />}>Сбросить</Button>
                    </div>
                </Space>
            </Card>

            {/* 📋 ТАБЛИЦА */}
            <Card className="shadow-lg rounded-2xl" style={{ background: theme.cardBackground, border: `1px solid ${theme.border}` }}>
                <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadModal(true)} className="btn-primary">
                        Загрузить документ
                    </Button>
                </div>
                <Table columns={columns} dataSource={filteredDocuments} rowKey="id" loading={loading} pagination={{ pageSize: 10 }}
                    style={{ background: 'transparent' }}
                />
            </Card>

            {/* 📤 МОДАЛКА ЗАГРУЗКИ */}
            <Modal title="Загрузка документа" open={uploadModal} onCancel={() => { setUploadModal(false); setUploadFile(null); form.resetFields(); }} footer={null} style={{ top: 20 }}>
                <Form form={form} onFinish={handleUpload} layout="vertical">
                    <Form.Item label="Файл">
                        <Upload maxCount={1} beforeUpload={(file) => { setUploadFile(file); return false; }} onRemove={() => setUploadFile(null)} fileList={uploadFile ? [uploadFile] : []}>
                            <Button icon={<UploadOutlined />}>Выбрать файл</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item name="title" label="Название" rules={[{ required: true, message: 'Введите название' }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Описание"><TextArea rows={4} /></Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" block className="btn-primary">Загрузить</Button></Form.Item>
                </Form>
            </Modal>

            {/* 💬 КОММЕНТАРИЙ */}
            <Modal title={`💬 Комментарий к ${getStatusText(selectedStatus)}`} open={statusModal} onCancel={() => { setStatusModal(false); commentForm.resetFields(); }} footer={null}>
                <Form form={commentForm} onFinish={handleSubmitComment} layout="vertical">
                    <Form.Item name="comment" label="Комментарий" rules={[{ required: true, message: 'Введите комментарий' }]}><TextArea rows={4} placeholder="Укажите причину..." /></Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" block>{selectedStatus === 'approved' ? '✅ Утвердить' : '❌ Отклонить'}</Button></Form.Item>
                </Form>
            </Modal>

            {/* 👁️ ПРЕДПРОСМОТР */}
            <Modal title={`📄 ${previewTitle}`} open={previewModal} onCancel={handlePreviewClose} footer={null} width={900} style={{ top: 20 }}>
                <div style={{ width: '100%', height: '70vh', borderRadius: '8px', overflow: 'hidden', background: theme.cardBackground }}>
                    {previewUrl && <iframe src={previewUrl} title="Preview" style={{ width: '100%', height: '100%', border: 'none' }} />}
                </div>
            </Modal>

            {/* 📜 ИСТОРИЯ */}
            <Drawer title={`📜 История: ${selectedDoc?.title}`} placement="right" size="large" open={historyDrawer} onClose={() => setHistoryDrawer(false)}>
                {history.map((item: HistoryItem) => (
                    <Card key={item.id} style={{ marginBottom: 16 }} variant="borderless">
                        <div><strong>Действие:</strong> {item.action}</div>
                        {item.old_status && <div><strong>Старый статус:</strong> {getStatusText(item.old_status)}</div>}
                        {item.new_status && <div><strong>Новый статус:</strong> {getStatusText(item.new_status)}</div>}
                        {item.comment && <div><strong>Комментарий:</strong> {item.comment}</div>}
                        <div><strong>Дата:</strong> {new Date(item.created_at).toLocaleString('ru-RU')}</div>
                        <div><strong>Пользователь:</strong> {item.user?.full_name || item.user?.email}</div>
                    </Card>
                ))}
            </Drawer>

            {/* 👤 ПРОФИЛЬ */}
            <Modal title="👤 Профиль" open={profileModal} onCancel={() => setProfileModal(false)} footer={null}>
                <div style={{ padding: 20 }}>
                    <p><strong>📧 Email:</strong> {user?.email}</p>
                    <p><strong>👤 Имя:</strong> {user?.full_name}</p>
                    <p><strong>🎭 Роль:</strong> {user?.role === 'admin' ? '👑 Администратор' : '👤 Сотрудник'}</p>
                    <Divider />
                    <Button type="primary" icon={<LockOutlined />} block onClick={() => { setProfileModal(false); setPasswordModal(true); }}>
                        🔑 Сменить пароль
                    </Button>
                </div>
            </Modal>

            {/* 🔐 СМЕНА ПАРОЛЯ */}
            <Modal title="🔑 Смена пароля" open={passwordModal} onCancel={() => setPasswordModal(false)} footer={null}>
                <Form form={passwordForm} layout="vertical" onFinish={(values) => { notify.success('Пароль изменён!'); setPasswordModal(false); passwordForm.resetFields(); }}>
                    <Form.Item name="oldPassword" label="Текущий пароль" rules={[{ required: true }]}><Input.Password prefix={<LockOutlined />} /></Form.Item>
                    <Form.Item name="newPassword" label="Новый пароль" rules={[{ required: true, min: 6 }]}><Input.Password prefix={<LockOutlined />} /></Form.Item>
                    <Form.Item name="confirmPassword" label="Подтвердите" rules={[{ required: true }]}><Input.Password prefix={<LockOutlined />} /></Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" block>Изменить</Button></Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default Documents;