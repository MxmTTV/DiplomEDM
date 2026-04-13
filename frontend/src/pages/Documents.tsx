// src/pages/Documents.tsx
import { useState, useEffect, useMemo } from 'react';
import {
    Table, Button, Card, Space, Modal, Form, Input, Tag,
    Upload, Drawer, Select, Tooltip, Typography,
    Row, Col, Statistic, Empty
} from 'antd';
import {
    PlusOutlined, UploadOutlined, EyeOutlined, DownloadOutlined,
    SearchOutlined, ReloadOutlined,
    FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined,
    CloseCircleOutlined, BarChartOutlined
} from '@ant-design/icons';
import { Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import mammoth from 'mammoth';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import type { DocStatus } from '../types/roles';
import { STATUS_LABELS } from '../types/roles';

const { TextArea } = Input;

interface Document {
    id: number;
    title: string;
    description: string;
    current_status_code: DocStatus;
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
    old_status?: DocStatus;
    new_status?: DocStatus;
    created_at: string;
    user?: { id: number; email: string; full_name: string };
}

interface UploadFormValues {
    title: string;
    description: string;
}

// 🎨 Цвета статусов для тегов AntD
const STATUS_TAG_COLORS: Record<DocStatus, string> = {
    draft: 'default',
    review: 'orange',
    approved: 'green',
    rejected: 'red',
    completed: 'blue',
};

function Documents() {
    const { Title, Text } = Typography;
    // ✅ STATE
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadModal, setUploadModal] = useState(false);
    const [historyDrawer, setHistoryDrawer] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [form] = Form.useForm<UploadFormValues>();
    const [uploadFile, setUploadFile] = useState<any>(null);
    const { user } = useAuthStore();
    const navigate = useNavigate();

    // 🔐 ПРОВЕРКА ПРАВ НА ОСНОВЕ РОЛИ
    const canApprove = user?.role && ['zavuch', 'director'].includes(user.role);
    const canArchive = user?.role === 'secretary';
    const canSendToApproval = user?.role === 'teacher';

    // Статусы и комментарии
    const [statusModal, setStatusModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<DocStatus | ''>('');
    const [commentForm] = Form.useForm<{ comment: string }>();

    // Предпросмотр
    const [previewModal, setPreviewModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [previewTitle, setPreviewTitle] = useState<string>('');
    const [isBlobUrl, setIsBlobUrl] = useState(false);

    // 🔍 Фильтры и поиск
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<DocStatus | ''>('');
    const [sortBy, setSortBy] = useState('newest');

    // 🔔 Уведомления (локальные, можно заменить на import из utils)
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
            const normalizedDocs = (response.data.documents || []).map((doc: any) => ({
                ...doc,
                current_status_code: (doc.current_status_code || doc.current_status) as DocStatus,
            }));
            setDocuments(normalizedDocs);
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
            result = result.filter(d => d.current_status_code === statusFilter);
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
            draft: documents.filter(d => d.current_status_code === 'draft').length,
            review: documents.filter(d => d.current_status_code === 'review').length,
            approved: documents.filter(d => d.current_status_code === 'approved').length,
            rejected: documents.filter(d => d.current_status_code === 'rejected').length,
            completed: documents.filter(d => d.current_status_code === 'completed').length,
        };

        const statusData = [
            { name: STATUS_LABELS.draft, value: stats.draft, color: '#d9d9d9' },
            { name: STATUS_LABELS.review, value: stats.review, color: '#fa8c16' },
            { name: STATUS_LABELS.approved, value: stats.approved, color: '#52c41a' },
            { name: STATUS_LABELS.rejected, value: stats.rejected, color: '#f5222d' },
            { name: STATUS_LABELS.completed, value: stats.completed, color: '#1890ff' },
        ].filter(item => item.value > 0);

        return { stats, statusData };
    }, [documents]);

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
            setHistory(response.data.history || []);
            setHistoryDrawer(true);
        } catch (error) {
            notify.error('Ошибка загрузки истории');
        }
    };

    const handleChangeStatus = async (doc: Document, newStatus: DocStatus) => {
        if (['approved', 'rejected'].includes(newStatus)) {
            setSelectedStatus(newStatus);
            setSelectedDoc(doc);
            setStatusModal(true);
            return;
        }
        try {
            await api.patch(`/documents/${doc.id}/status`, {
                status: newStatus,
                comment: `Смена статуса на ${STATUS_LABELS[newStatus]}`,
            });
            notify.success('Статус изменён!');
            fetchDocuments();
        } catch (error: any) {
            notify.error(`Ошибка: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleSubmitComment = async (values: { comment: string }) => {
        if (!selectedDoc || !selectedStatus) return;
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

    const getStatusColor = (status: DocStatus): string => {
        return STATUS_TAG_COLORS[status] || 'default';
    };

    const getStatusText = (status: DocStatus): string => {
        return STATUS_LABELS[status] || status;
    };

    const pageTheme = {
        cardBackground: '#fff',
        textSecondary: '#64748b',
        border: '#e2e8f0',
    };

    // 📋 Колонки таблицы
    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: 'Название', dataIndex: 'title', key: 'title', ellipsis: true },
        { title: 'Описание', dataIndex: 'description', key: 'description', ellipsis: true },
        {
            title: 'Статус',
            dataIndex: 'current_status_code',
            key: 'current_status_code',
            render: (status: DocStatus) => (
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
            width: 220,
            render: (_: any, record: Document) => {
                // 🔐 Локальные проверки прав для каждой строки
                const canSend = canSendToApproval && record.current_status_code === 'draft';
                const canApproveThis = canApprove && record.current_status_code === 'review';
                const canArchiveThis = canArchive && record.current_status_code === 'approved';
                const isOwner = user?.id === record.author_id;

                return (
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

                        {/* 📤 Отправка на согласование - только учитель для своих черновиков */}
                        {canSend && isOwner && (
                            <Button
                                type="link"
                                size="small"
                                onClick={() => handleChangeStatus(record, 'review')}
                            >
                                📤 На согласование
                            </Button>
                        )}

                        {/* ✅❌ Утверждение/отклонение - завуч или директор */}
                        {canApproveThis && (
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

                        {/* 📦 Архивация - только секретарь */}
                        {canArchiveThis && (
                            <Button
                                type="link"
                                size="small"
                                onClick={() => handleChangeStatus(record, 'completed')}
                            >
                                📦 В архив
                            </Button>
                        )}

                        {/* 🔒 Индикатор отсутствия прав */}
                        {!canSend && !canApproveThis && !canArchiveThis && record.current_status_code !== 'draft' && (
                            <Tag color="default" style={{ fontSize: 11, cursor: 'default' }}>🔒 Нет прав</Tag>
                        )}
                    </Space>
                );
            },
        },
    ];

    // Если пользователь не авторизован
    if (!user) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <Empty description="Требуется авторизация" />
                <Button type="primary" onClick={() => navigate('/login')}>Войти</Button>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <div className="documents-hero">
                <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                    <div>
                        <Title level={1} style={{ margin: 0 }}>Document Control Center</Title>
                        <Text style={{ fontSize: 15 }}>
                            Управляйте согласованием и движением документов в одном окне.
                        </Text>
                    </div>
                    <Space wrap>
                        <Button
                            type="primary"
                            ghost
                            icon={<PlusOutlined />}
                            onClick={() => setUploadModal(true)}
                            style={{ borderColor: 'rgba(255,255,255,0.75)', color: '#fff', borderRadius: 12, fontWeight: 600 }}
                        >
                            Добавить документ
                        </Button>
                        <Button
                            icon={<BarChartOutlined />}
                            onClick={fetchDocuments}
                            style={{ borderRadius: 12, border: 'none' }}
                        >
                            Обновить ленту
                        </Button>
                    </Space>
                </Space>
            </div>

            {/* 📊 DASHBOARD STATS */}
            <div className="animate-fadeIn" style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="shadow-lg rounded-2xl page-card metric-card" style={{ background: pageTheme.cardBackground, border: `1px solid ${pageTheme.border}` }}>
                            <Statistic title="Всего документов" value={dashboardData.stats.total} prefix={<FileTextOutlined style={{ color: '#1890ff' }} />} valueStyle={{ color: '#1890ff', fontSize: 28 }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="shadow-lg rounded-2xl page-card metric-card" style={{ background: pageTheme.cardBackground, border: `1px solid ${pageTheme.border}` }}>
                            <Statistic title="На согласовании" value={dashboardData.stats.review} prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />} valueStyle={{ color: '#fa8c16', fontSize: 28 }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="shadow-lg rounded-2xl page-card metric-card" style={{ background: pageTheme.cardBackground, border: `1px solid ${pageTheme.border}` }}>
                            <Statistic title="Утверждено" value={dashboardData.stats.approved} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a', fontSize: 28 }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="shadow-lg rounded-2xl page-card metric-card" style={{ background: pageTheme.cardBackground, border: `1px solid ${pageTheme.border}` }}>
                            <Statistic title="Отклонено" value={dashboardData.stats.rejected} prefix={<CloseCircleOutlined style={{ color: '#f5222d' }} />} valueStyle={{ color: '#f5222d', fontSize: 28 }} />
                        </Card>
                    </Col>
                </Row>
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <Card title="По статусам" className="shadow-lg rounded-2xl page-card" style={{ background: pageTheme.cardBackground, border: `1px solid ${pageTheme.border}` }}>
                            {dashboardData.statusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie data={dashboardData.statusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                                            {dashboardData.statusData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Нет данных" style={{ padding: '40px 0' }} />
                            )}
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title="Последние документы" className="shadow-lg rounded-2xl page-card" style={{ background: pageTheme.cardBackground, border: `1px solid ${pageTheme.border}` }}>
                            {documents.length > 0 ? (
                                <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                                    {[...documents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).map((doc) => (
                                        <div key={doc.id} style={{ padding: '8px 0', borderBottom: `1px solid ${pageTheme.border}` }}>
                                            <strong>{doc.title}</strong>
                                            <Tag color={getStatusColor(doc.current_status_code)} style={{ marginLeft: 8 }}>{getStatusText(doc.current_status_code)}</Tag>
                                            <div style={{ fontSize: 12, color: pageTheme.textSecondary }}>{new Date(doc.created_at).toLocaleDateString('ru-RU')}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Документов пока нет" style={{ padding: '40px 0' }} />
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* 🔍 ФИЛЬТРЫ */}
            <Card className="shadow-lg rounded-2xl soft-panel" style={{ background: pageTheme.cardBackground, marginBottom: 24, border: `1px solid ${pageTheme.border}` }}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <Input.Search
                            placeholder="Поиск по названию"
                            allowClear
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ flex: 1, minWidth: 250 }}
                            prefix={<SearchOutlined />}
                        />
                        <Select
                            placeholder="Статус"
                            allowClear
                            value={statusFilter || undefined}
                            onChange={(value) => setStatusFilter(value || '')}
                            style={{ width: 180 }}
                            options={[
                                { value: 'draft', label: STATUS_LABELS.draft },
                                { value: 'review', label: STATUS_LABELS.review },
                                { value: 'approved', label: STATUS_LABELS.approved },
                                { value: 'rejected', label: STATUS_LABELS.rejected },
                                { value: 'completed', label: STATUS_LABELS.completed },
                            ]}
                        />
                        <Select
                            placeholder="Сортировка"
                            value={sortBy}
                            onChange={setSortBy}
                            style={{ width: 180 }}
                            options={[
                                { value: 'newest', label: 'Сначала новые' },
                                { value: 'oldest', label: 'Сначала старые' },
                                { value: 'name_asc', label: 'По названию (А-Я)' },
                                { value: 'name_desc', label: 'По названию (Я-А)' },
                            ]}
                        />
                        <Button onClick={handleResetFilters} icon={<ReloadOutlined />}>Сбросить</Button>
                    </div>
                </Space>
            </Card>

            {/* 📋 ТАБЛИЦА */}
            <Card className="shadow-lg rounded-2xl soft-panel table-shell" style={{ background: pageTheme.cardBackground, border: `1px solid ${pageTheme.border}` }}>
                <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadModal(true)} className="btn-primary">
                        Загрузить документ
                    </Button>
                </div>
                <Table
                    columns={columns}
                    dataSource={filteredDocuments}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Всего: ${total}` }}
                    style={{ background: 'transparent' }}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Документы не найдены" /> }}
                />
            </Card>

            {/* 📤 МОДАЛКА ЗАГРУЗКИ */}
            <Modal title="Загрузка документа" open={uploadModal} onCancel={() => { setUploadModal(false); setUploadFile(null); form.resetFields(); }} footer={null} style={{ top: 20 }}>
                <Form form={form} onFinish={handleUpload} layout="vertical">
                    <Form.Item label="Файл">
                        <Upload maxCount={1} beforeUpload={(file) => { setUploadFile(file); return false; }} onRemove={() => setUploadFile(null)} fileList={uploadFile ? [uploadFile] : []}>
                            <Button icon={<UploadOutlined />}>Выбрать файл</Button>
                        </Upload>
                        {uploadFile && <span style={{ marginLeft: 8, color: '#666' }}>{uploadFile.name}</span>}
                    </Form.Item>
                    <Form.Item name="title" label="Название" rules={[{ required: true, message: 'Введите название' }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Описание"><TextArea rows={4} placeholder="Краткое описание документа..." /></Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" block className="btn-primary">Загрузить</Button></Form.Item>
                </Form>
            </Modal>

            {/* 💬 КОММЕНТАРИЙ ПРИ СМЕНЕ СТАТУСА */}
            <Modal title={`💬 Комментарий: ${selectedStatus ? getStatusText(selectedStatus) : ''}`} open={statusModal} onCancel={() => { setStatusModal(false); commentForm.resetFields(); }} footer={null}>
                <Form form={commentForm} onFinish={handleSubmitComment} layout="vertical">
                    <Form.Item name="comment" label="Комментарий" rules={[{ required: true, message: 'Введите комментарий' }]}><TextArea rows={4} placeholder="Укажите причину изменения статуса..." /></Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block style={{ background: selectedStatus === 'approved' ? '#52c41a' : '#f5222d', borderColor: selectedStatus === 'approved' ? '#52c41a' : '#f5222d' }}>
                            {selectedStatus === 'approved' ? '✅ Утвердить' : '❌ Отклонить'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 👁️ ПРЕДПРОСМОТР */}
            <Modal title={`📄 ${previewTitle}`} open={previewModal} onCancel={handlePreviewClose} footer={null} width={900} style={{ top: 20 }}>
                <div style={{ width: '100%', height: '70vh', borderRadius: '8px', overflow: 'hidden', background: pageTheme.cardBackground }}>
                    {previewUrl ? (
                        <iframe src={previewUrl} title="Preview" style={{ width: '100%', height: '100%', border: 'none' }} />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: pageTheme.textSecondary }}>
                            Загрузка предпросмотра...
                        </div>
                    )}
                </div>
            </Modal>

            {/* 📜 ИСТОРИЯ */}
            <Drawer title={`📜 История: ${selectedDoc?.title}`} placement="right" size="large" open={historyDrawer} onClose={() => setHistoryDrawer(false)}>
                {history.length > 0 ? (
                    history.map((item: HistoryItem) => (
                        <Card key={item.id} style={{ marginBottom: 16 }} variant="borderless">
                            <div><strong>Действие:</strong> {item.action}</div>
                            {item.old_status && <div><strong>Старый статус:</strong> {getStatusText(item.old_status)}</div>}
                            {item.new_status && <div><strong>Новый статус:</strong> {getStatusText(item.new_status)}</div>}
                            {item.comment && <div><strong>Комментарий:</strong> {item.comment}</div>}
                            <div><strong>Дата:</strong> {new Date(item.created_at).toLocaleString('ru-RU')}</div>
                            <div><strong>Пользователь:</strong> {item.user?.full_name || item.user?.email || `ID: ${item.user_id}`}</div>
                        </Card>
                    ))
                ) : (
                    <Empty description="История пуста" />
                )}
            </Drawer>
        </div>
    );
}

export default Documents;