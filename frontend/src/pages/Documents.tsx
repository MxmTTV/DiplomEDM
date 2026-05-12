// src/pages/Documents.tsx
import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import {
    Table, Button, Card, Space, Modal, Form, Input, Tag,
    Upload, Drawer, Select, Tooltip, Typography,
    Row, Col, Statistic, Empty, Skeleton, Avatar  // ← ВОТ СЮДА!
} from 'antd';
import {
    PlusOutlined, UploadOutlined, EyeOutlined, DownloadOutlined,
    SearchOutlined, ReloadOutlined, CloseOutlined,
    FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined,
    CloseCircleOutlined, BarChartOutlined
} from '@ant-design/icons';
import { Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import mammoth from 'mammoth';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { notify } from '../utils/notification';
import type { DocStatus } from '../types/roles';
import { STATUS_LABELS } from '../types/roles';

const { TextArea } = Input;
const { Title, Text } = Typography;

// 🎨 Компонент анимированной цифры
const AnimatedNumber = ({ value, duration = 1.5 }: { value: number; duration?: number }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.floor(easeOut * value));
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return <span>{displayValue}</span>;
};

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

const STATUS_TAG_COLORS: Record<DocStatus, string> = {
    draft: 'default',
    review: 'orange',
    approved: 'green',
    rejected: 'red',
    completed: 'blue',
};

// 🎨 Перевод действий на русский
const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
        'created': '📝 Создан',
        'status_change': '🔄 Изменение статуса',
        'updated': '✏️ Обновлён',
        'deleted': '🗑️ Удалён',
        'downloaded': '📥 Скачан',
        'viewed': '👁️ Просмотрен',
    };
    return labels[action] || action;
};

// 🎨 Цвета для действий
const getActionColor = (action: string): string => {
    const colors: Record<string, string> = {
        'created': '#52c41a',      // зелёный
        'status_change': '#1890ff', // синий
        'updated': '#fa8c16',       // оранжевый
        'deleted': '#f5222d',       // красный
        'downloaded': '#722ed1',    // фиолетовый
        'viewed': '#13c2c2',        // голубой
    };
    return colors[action] || '#667eea';
};

// 🏷️ Перевод статусов на русский
const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        'draft': 'Черновик',
        'review': 'На согласовании',
        'approved': 'Утверждён',
        'rejected': 'Отклонён',
        'completed': 'Завершён',
    };
    return labels[status] || status;
};

// 🎨 Цвета для статусов
const getStatusTagColor = (status: string): string => {
    const colors: Record<string, string> = {
        'draft': 'default',
        'review': 'orange',
        'approved': 'green',
        'rejected': 'red',
        'completed': 'blue',
    };
    return colors[status] || 'default';
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
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [statusModal, setStatusModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<DocStatus | ''>('');
    const [commentForm] = Form.useForm<{ comment: string }>();
    const [previewModal, setPreviewModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [previewTitle, setPreviewTitle] = useState<string>('');
    const [isBlobUrl, setIsBlobUrl] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<DocStatus | ''>('');
    const [sortBy, setSortBy] = useState('newest');
    const [chartFilter, setChartFilter] = useState<DocStatus | ''>('');

    const { user } = useAuthStore();
    const navigate = useNavigate();

    // 🔐 ПРОВЕРКА ПРАВ
    const canSendToReview = user?.role && ['director', 'secretary', 'zavuch'].includes(user.role);
    const canApproveOrReject = user?.role && ['director', 'secretary'].includes(user.role);
    const canArchive = user?.role && ['director', 'secretary'].includes(user.role);

    // Загрузка документов
    useEffect(() => { fetchDocuments(); }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/documents');
            if (response.data?.documents) {
                setDocuments(response.data.documents);
            }
        } catch (error: any) {
            notify.error(error.response?.data?.error || 'Ошибка загрузки документов');
        }
        setLoading(false);
    };

    // 🔍 Фильтрация
    const filteredDocuments = useMemo(() => {
        let result = [...documents];
        if (chartFilter) result = result.filter(d => d.current_status_code === chartFilter);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(d =>
                d.title.toLowerCase().includes(q) ||
                (d.description?.toLowerCase().includes(q))
            );
        }
        if (statusFilter) result = result.filter(d => d.current_status_code === statusFilter);
        result.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sortBy === 'name_asc') return a.title.localeCompare(b.title);
            if (sortBy === 'name_desc') return b.title.localeCompare(a.title);
            return 0;
        });
        return result;
    }, [documents, searchQuery, statusFilter, sortBy, chartFilter]);

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
        if (!uploadFile) { notify.error('Выберите файл!'); return; }
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('title', values.title);
        formData.append('description', values.description || '');
        try {
            await api.post('/documents', formData);
            notify.success('Документ загружен!');
            setUploadModal(false); setUploadFile(null); form.resetFields();
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
        } catch (error) { notify.error('Ошибка загрузки истории'); }
    };

    const handleChangeStatus = async (doc: Document, newStatus: DocStatus) => {
        if (newStatus === 'approved') {
            try {
                await api.patch(`/documents/${doc.id}/status`, { status: 'approved', comment: 'Утверждено' });
                notify.success('Документ утверждён!'); fetchDocuments();
            } catch (error: any) { notify.error(error.response?.data?.error || 'Ошибка'); }
            return;
        }
        if (newStatus === 'rejected') {
            setSelectedStatus(newStatus); setSelectedDoc(doc); setStatusModal(true); return;
        }
        try {
            await api.patch(`/documents/${doc.id}/status`, { status: newStatus, comment: `Смена статуса на ${STATUS_LABELS[newStatus]}` });
            notify.success('Статус изменён!'); fetchDocuments();
        } catch (error: any) { notify.error(error.response?.data?.error || 'Ошибка'); }
    };

    const handleSubmitComment = async (values: { comment: string }) => {
        if (!selectedDoc || !selectedStatus) return;
        try {
            await api.patch(`/documents/${selectedDoc.id}/status`, { status: selectedStatus, comment: values.comment });
            notify.success('Статус изменён!'); setStatusModal(false); commentForm.resetFields(); fetchDocuments();
        } catch (error: any) { notify.error(error.response?.data?.error || 'Ошибка'); }
    };

    const handleDownload = async (doc: Document) => {
        try {
            const response = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', doc.file_name);
            document.body.appendChild(link); link.click(); link.remove();
            notify.success('Файл скачан!');
        } catch (error) { notify.error('Ошибка скачивания'); }
    };

    const handlePreview = async (doc: Document) => {
        try {
            const response = await api.get(`/documents/${doc.id}/download`, { responseType: 'arraybuffer' });
            const fileExt = doc.file_name.split('.').pop()?.toLowerCase();
            setPreviewTitle(doc.title);
            if (fileExt === 'pdf') {
                const blob = new Blob([response.data], { type: 'application/pdf' });
                setPreviewUrl(URL.createObjectURL(blob)); setIsBlobUrl(true); setPreviewModal(true);
            } else if (['docx', 'doc'].includes(fileExt || '')) {
                const result = await mammoth.convertToHtml({ arrayBuffer: response.data });
                const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;padding:20px;max-width:800px;margin:0 auto;line-height:1.6}</style></head><body>${result.value}</body></html>`;
                const blob = new Blob([html], { type: 'text/html' });
                setPreviewUrl(URL.createObjectURL(blob)); setIsBlobUrl(true); setPreviewModal(true);
            } else { notify.warning('Предпросмотр недоступен'); }
        } catch (error) { notify.error('Не удалось открыть предпросмотр'); }
    };

    const handlePreviewClose = () => { setPreviewModal(false); if (isBlobUrl && previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(''); setIsBlobUrl(false); };
    const handleResetFilters = () => { setSearchQuery(''); setStatusFilter(''); setSortBy('newest'); setChartFilter(''); };
    const getStatusColor = (status: DocStatus) => STATUS_TAG_COLORS[status] || 'default';
    const getStatusText = (status: DocStatus) => STATUS_LABELS[status] || status;

    const pageTheme = { cardBackground: '#fff', textSecondary: '#64748b', border: '#e2e8f0' };

    // 🎨 Конфигурация карточек статистики — ЦВЕТНЫЕ!
    const statCards = [
        { key: 'total' as const, label: '📄 Всего', color: '#1890ff', icon: <FileTextOutlined style={{ fontSize: 24 }} />, filter: '' as DocStatus | '' },
        { key: 'review' as const, label: '⏳ На согласовании', color: '#fa8c16', icon: <ClockCircleOutlined style={{ fontSize: 24 }} />, filter: 'review' as DocStatus },
        { key: 'approved' as const, label: '✅ Утверждено', color: '#52c41a', icon: <CheckCircleOutlined style={{ fontSize: 24 }} />, filter: 'approved' as DocStatus },
        { key: 'rejected' as const, label: '❌ Отклонено', color: '#f5222d', icon: <CloseCircleOutlined style={{ fontSize: 24 }} />, filter: 'rejected' as DocStatus },
    ];

    // 📋 Колонки таблицы
    const columns = [
        { title: <span>#️⃣ ID</span>, dataIndex: 'id', key: 'id', width: 70, sorter: (a: Document, b: Document) => a.id - b.id },
        { title: <span>📄 Название</span>, dataIndex: 'title', key: 'title', ellipsis: true, sorter: (a: Document, b: Document) => a.title.localeCompare(b.title) },
        { title: <span>📝 Описание</span>, dataIndex: 'description', key: 'description', ellipsis: true },
        {
            title: <span>🏷️ Статус</span>,
            dataIndex: 'current_status_code',
            key: 'current_status_code',
            width: 140,
            filters: Object.entries(STATUS_LABELS).map(([value, label]) => ({ text: label, value })),
            onFilter: (value: any, record: Document) => record.current_status_code === value,
            render: (status: DocStatus) => (
                <Tag color={getStatusColor(status)} className="status-badge" style={{
                    background: getStatusColor(status) === 'default' ? '#f0f0f0' :
                        getStatusColor(status) === 'orange' ? '#fff7e6' :
                            getStatusColor(status) === 'green' ? '#f6ffed' :
                                getStatusColor(status) === 'red' ? '#fff1f0' : '#e6f7ff',
                    border: `1px solid ${getStatusColor(status) === 'default' ? '#d9d9d9' :
                        getStatusColor(status) === 'orange' ? '#ffd591' :
                            getStatusColor(status) === 'green' ? '#b7eb8f' :
                                getStatusColor(status) === 'red' ? '#ffa39e' : '#91d5ff'}`,
                }}>{getStatusText(status)}</Tag>
            ),
        },
        { title: <span>📅 Дата</span>, dataIndex: 'created_at', key: 'created_at', width: 180, sorter: (a: Document, b: Document) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(), render: (date: string) => <span style={{ color: '#666', fontSize: 13 }}>{new Date(date).toLocaleString('ru-RU')}</span> },
        {
            title: <span>⚡ Действия</span>, key: 'actions', width: 280,
            render: (_: any, record: Document) => {
                const isDraft = record.current_status_code === 'draft';
                const isReview = record.current_status_code === 'review';
                const isApproved = record.current_status_code === 'approved';
                if (user?.role === 'director') {
                    return (
                        <Space size="small" direction="vertical">
                            <Space size="small">
                                <Tooltip title="Предпросмотр"><Button type="text" icon={<EyeOutlined />} size="small" onClick={() => handlePreview(record)} style={{ color: '#1890ff' }} /></Tooltip>
                                <Tooltip title="Скачать"><Button type="text" icon={<DownloadOutlined />} size="small" onClick={() => handleDownload(record)} style={{ color: '#52c41a' }} /></Tooltip>
                                <Tooltip title="История"><Button type="text" icon={<EyeOutlined />} size="small" onClick={() => showHistory(record)} style={{ color: '#722ed1' }} /></Tooltip>
                            </Space>
                            <Select value={record.current_status_code} onChange={(newStatus) => handleChangeStatus(record, newStatus)} size="small" style={{ width: 180 }} options={[
                                { value: 'draft', label: '📝 Черновик' }, { value: 'review', label: '⏳ На согласовании' },
                                { value: 'approved', label: '✅ Утверждён' }, { value: 'rejected', label: '❌ Отклонён' },
                                { value: 'completed', label: '📦 Завершён' },
                            ]} dropdownStyle={{ borderRadius: 8 }} />
                        </Space>
                    );
                }
                return (
                    <Space size="small" direction="horizontal" wrap>
                        <Tooltip title="Предпросмотр"><Button type="text" icon={<EyeOutlined />} size="small" onClick={() => handlePreview(record)} style={{ color: '#1890ff' }} /></Tooltip>
                        <Tooltip title="Скачать"><Button type="text" icon={<DownloadOutlined />} size="small" onClick={() => handleDownload(record)} style={{ color: '#52c41a' }} /></Tooltip>
                        <Tooltip title="История"><Button type="text" icon={<EyeOutlined />} size="small" onClick={() => showHistory(record)} style={{ color: '#722ed1' }} /></Tooltip>
                        {isDraft && canSendToReview && <Button type="link" size="small" onClick={() => handleChangeStatus(record, 'review')} style={{ color: '#fa8c16', padding: 0 }}>📤</Button>}
                        {isReview && canApproveOrReject && (<>
                            <Button type="link" size="small" onClick={() => handleChangeStatus(record, 'rejected')} style={{ color: '#f5222d', padding: 0 }}>❌</Button>
                            <Button type="link" size="small" onClick={() => handleChangeStatus(record, 'approved')} style={{ color: '#52c41a', padding: 0 }}>✅</Button>
                        </>)}
                        {isApproved && canArchive && <Button type="link" size="small" onClick={() => handleChangeStatus(record, 'completed')} style={{ color: '#1890ff', padding: 0 }}>📦</Button>}
                    </Space>
                );
            },
        },
    ];

    return (
        <div className="animate-fadeIn">
            {/* 📌 ЗАГОЛОВОК */}
            <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: 16, padding: '28px 32px', color: '#fff', boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35)' }}>
                <Row align="middle" justify="space-between" wrap>
                    <Col xs={24} md={14}>
                        <Title
                            level={2}
                            style={{
                                margin: 0,
                                color: '#fff',
                                fontSize: 36,  // ← Было 28, стало 36
                                fontWeight: 800,  // ← Было 700, стало 800
                                marginBottom: 12,
                                letterSpacing: '-0.5px',
                            }}
                        >
                            📄 Центр управления документами
                        </Title>

                        <Text
                            style={{
                                fontSize: 18,  // ← Было 15, стало 18
                                color: 'rgba(255,255,255,0.9)',
                                display: 'block',
                                lineHeight: 1.6,
                            }}
                        >
                            Управляйте согласованием, отслеживайте статусы и контролируйте движение документов в единой системе
                        </Text>
                    </Col>
                    <Col xs={24} md={10} style={{ textAlign: 'right', marginTop: 16 }}>
                        <Space wrap size="middle">
                            <Button type="default" ghost icon={<PlusOutlined />} onClick={() => setUploadModal(true)} style={{ borderColor: 'rgba(255,255,255,0.8)', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: 14, padding: '10px 24px' }}>Загрузить документ</Button>
                            <Button icon={<ReloadOutlined />} onClick={fetchDocuments} style={{ borderRadius: 10, background: '#fff', color: '#667eea', fontWeight: 600, fontSize: 14, padding: '10px 24px', border: 'none' }}>Обновить</Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* 📊 СТАТИСТИКА — ЦВЕТНЫЕ КУБИКИ */}
            <div style={{ marginBottom: 24 }}>
                {loading ? (
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        {[...Array(4)].map((_, idx) => <Col xs={24} sm={12} lg={6} key={idx}><Card><Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} /></Card></Col>)}
                    </Row>
                ) : (
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        {statCards.map((cfg, i) => (
                            <Col xs={24} sm={12} lg={6} key={cfg.key}>
                                <motion.div whileHover={{ y: -8, scale: 1.02 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                    <Card className="stat-card" style={{
                                        background: `linear-gradient(135deg, ${cfg.color}40 0%, ${cfg.color}70 100%)`,  // ← Очень тёмный!
                                        border: `2px solid ${cfg.color}80`,
                                        cursor: 'pointer',
                                        boxShadow: `0 8px 24px ${cfg.color}50`
                                    }} onClick={() => setChartFilter(cfg.filter)}>
                                        <Statistic
                                            title={<span style={{ fontSize: 14, fontWeight: 600, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cfg.label}</span>}
                                            value={dashboardData.stats[cfg.key]}
                                            prefix={cfg.icon}
                                            valueStyle={{ color: cfg.color, fontSize: 36, fontWeight: 800, textShadow: `0 2px 8px ${cfg.color}40` }}
                                        />
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {/* 🔍 ФИЛЬТРЫ */}
            <Card className="shadow-lg rounded-2xl" style={{ background: pageTheme.cardBackground, marginBottom: 24, border: `1px solid ${pageTheme.border}` }}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <Input.Search placeholder="Поиск по названию" allowClear value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, minWidth: 250 }} prefix={<SearchOutlined />} />
                        <Select placeholder="Статус" allowClear value={statusFilter || undefined} onChange={(v) => setStatusFilter(v || '')} style={{ width: 180 }} options={Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
                        <Select placeholder="Сортировка" value={sortBy} onChange={setSortBy} style={{ width: 180 }} options={[{ value: 'newest', label: 'Сначала новые' }, { value: 'oldest', label: 'Сначала старые' }, { value: 'name_asc', label: 'А-Я' }, { value: 'name_desc', label: 'Я-А' }]} />
                        <Button onClick={handleResetFilters} icon={<ReloadOutlined />}>Сбросить</Button>
                        {chartFilter && <Tag color="blue" closable onClose={() => setChartFilter('')}>🔍 {STATUS_LABELS[chartFilter]}</Tag>}
                    </div>
                </Space>
            </Card>

            {/* 📋 ТАБЛИЦА */}
            <Card className="shadow-lg rounded-2xl" style={{ background: pageTheme.cardBackground, border: `1px solid ${pageTheme.border}`, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 16 }}>{[...Array(5)].map((_, i) => <Skeleton key={i} avatar active style={{ marginBottom: 16 }} />)}</div>
                ) : (
                    <>
                        <div style={{ marginBottom: 16 }}>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadModal(true)} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: 10, fontWeight: 600 }}>Загрузить документ</Button>
                        </div>
                        <Table columns={columns} dataSource={filteredDocuments} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Всего: ${t}` }} locale={{ emptyText: <Empty description={chartFilter ? 'По фильтру ничего не найдено' : 'Документы не найдены'} /> }} rowClassName={(_r, i) => i % 2 === 0 ? 'table-row-light' : 'table-row-dark'} />
                    </>
                )}
            </Card>

            {/* 📤 МОДАЛКА ЗАГРУЗКИ */}
            <Modal title="Загрузка документа" open={uploadModal} onCancel={() => { setUploadModal(false); setUploadFile(null); form.resetFields(); }} footer={null}>
                <Form form={form} onFinish={handleUpload} layout="vertical">
                    <Form.Item label="Файл"><Upload maxCount={1} beforeUpload={(file: any) => { setUploadFile(file); return false; }} onRemove={() => { setUploadFile(null); return true; }} fileList={uploadFile ? [uploadFile as any] : []}><Button icon={<UploadOutlined />}>Выбрать файл</Button></Upload>{uploadFile && <span style={{ marginLeft: 8, color: '#666' }}>{uploadFile.name}</span>}</Form.Item>
                    <Form.Item name="title" label="Название" rules={[{ required: true, message: 'Введите название' }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Описание"><TextArea rows={4} placeholder="Краткое описание..." /></Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" block style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' }}>Загрузить</Button></Form.Item>
                </Form>
            </Modal>

            {/* 💬 КОММЕНТАРИЙ */}
            <Modal title={`💬 Комментарий: ${selectedStatus ? getStatusText(selectedStatus) : ''}`} open={statusModal} onCancel={() => { setStatusModal(false); commentForm.resetFields(); }} footer={null}>
                <Form form={commentForm} onFinish={handleSubmitComment} layout="vertical">
                    <Form.Item name="comment" label="Комментарий" rules={selectedStatus === 'rejected' ? [{ required: true, message: 'Укажите причину' }] : []}>
                        <TextArea rows={4} placeholder={selectedStatus === 'rejected' ? 'Причина отклонения...' : 'Комментарий (необязательно)'} />
                    </Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" block style={{ background: selectedStatus === 'approved' ? '#52c41a' : '#f5222d', borderColor: selectedStatus === 'approved' ? '#52c41a' : '#f5222d' }}>{selectedStatus === 'approved' ? '✅ Утвердить' : '❌ Отклонить'}</Button></Form.Item>
                </Form>
            </Modal>

            {/* 👁️ ПРЕДПРОСМОТР */}
            <Modal title={`📄 ${previewTitle}`} open={previewModal} onCancel={handlePreviewClose} footer={null} width={900}>
                <div style={{ width: '100%', height: '70vh', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>{previewUrl ? <iframe src={previewUrl} title="Preview" style={{ width: '100%', height: '100%', border: 'none' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>Загрузка...</div>}</div>
            </Modal>

            {/* 📜 ИСТОРИЯ */}
            <Drawer
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span role="img" aria-label="history">📜</span>
                        История: {selectedDoc?.title}
                    </div>
                }
                placement="right"
                size="large"
                open={historyDrawer}
                onClose={() => setHistoryDrawer(false)}
                styles={{
                    body: { padding: 0 }
                }}
            >
                {history.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {history.map((item, index) => (
                            <Card
                                key={item.id}
                                variant="borderless"
                                style={{
                                    background: index === 0 ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))' : '#fafafa',
                                    borderLeft: index === 0 ? '4px solid #667eea' : '4px solid #e2e8f0',
                                    borderRadius: 12,
                                    transition: 'all 0.3s ease',
                                }}
                                hoverable
                            >
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        borderRadius: 20,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        background: getActionColor(item.action),
                                        color: '#fff',
                                        marginBottom: 8,
                                    }}>
                                        {getActionLabel(item.action)}
                                    </div>
                                </div>

                                {item.old_status && (
                                    <div style={{ marginBottom: 6 }}>
                                        <Text type="secondary" style={{ fontSize: 13 }}>Старый статус:</Text>
                                        <Tag color={getStatusTagColor(item.old_status)}>{getStatusLabel(item.old_status)}</Tag>
                                    </div>
                                )}

                                {item.new_status && (
                                    <div style={{ marginBottom: 6 }}>
                                        <Text type="secondary" style={{ fontSize: 13 }}>Новый статус:</Text>
                                        <Tag color={getStatusTagColor(item.new_status)}>{getStatusLabel(item.new_status)}</Tag>
                                    </div>
                                )}

                                {item.comment && (
                                    <div style={{
                                        marginBottom: 6,
                                        padding: '8px 12px',
                                        background: '#f5f5f5',
                                        borderRadius: 8,
                                        fontSize: 13,
                                    }}>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Комментарий:</Text>
                                        <Text style={{ fontSize: 13 }}>{item.comment}</Text>
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginTop: 12,
                                    paddingTop: 12,
                                    borderTop: '1px solid #e2e8f0'
                                }}>
                                    <Avatar size={24} style={{ background: '#667eea', fontSize: 12 }}>
                                        {item.user?.full_name?.charAt(0) || 'U'}
                                    </Avatar>
                                    <Text style={{ fontSize: 13, fontWeight: 500 }}>
                                        {item.user?.full_name || item.user?.email || `ID: ${item.user_id}`}
                                    </Text>
                                </div>

                                <div style={{ marginTop: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        📅 {new Date(item.created_at).toLocaleString('ru-RU', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Empty
                        description="История пуста"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                )}
            </Drawer>
        </div>
    );
}

export default Documents;