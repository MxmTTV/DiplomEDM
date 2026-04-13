import { Card, Row, Col, Statistic, Tag } from 'antd';
import {
    FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined,
    CloseCircleOutlined, InboxOutlined, UserOutlined
} from '@ant-design/icons';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import type { DocStatus } from '../types/roles';
import useAuthStore from '../store/authStore';

interface Document {
    id: number;
    title: string;
    current_status_code: DocStatus;
    created_at: string;
    author_id: number;
}

interface DashboardProps {
    documents: Document[];
}

const STATUS_COLORS: Record<DocStatus, string> = {
    draft: '#d9d9d9',
    review: '#fa8c16',
    approved: '#52c41a',
    rejected: '#f5222d',
    completed: '#1890ff',
};

const STATUS_LABELS: Record<DocStatus, string> = {
    draft: 'Черновик',
    review: 'На согласовании',
    approved: 'Утверждён',
    rejected: 'Отклонён',
    completed: 'Завершён',
};

const Dashboard: React.FC<DashboardProps> = ({ documents }) => {
    const { user } = useAuthStore();

    const stats = {
        total: documents.length,
        draft: documents.filter(d => d.current_status_code === 'draft').length,
        review: documents.filter(d => d.current_status_code === 'review').length,
        approved: documents.filter(d => d.current_status_code === 'approved').length,
        rejected: documents.filter(d => d.current_status_code === 'rejected').length,
        completed: documents.filter(d => d.current_status_code === 'completed').length,
    };

    const statusData = Object.entries(stats)
        .filter(([key]) => key !== 'total')
        .map(([status, value]) => ({
            name: STATUS_LABELS[status as DocStatus],
            value,
            color: STATUS_COLORS[status as DocStatus],
        }))
        .filter(item => item.value > 0);

    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    const dateData = getLast7Days().map(date => ({
        date: new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        count: documents.filter(d => d.created_at.startsWith(date)).length,
    }));

    const recentDocs = [...documents]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    return (
        <div className="animate-fadeIn" style={{ padding: '0 0 24px' }}>
            <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none' }} bordered={false}>
                <Row align="middle" justify="space-between">
                    <Col>
                        <h2 style={{ margin: 0, fontSize: 24 }}>👋 Добрый день, {user?.full_name}!</h2>
                        <p style={{ margin: '8px 0 0', opacity: 0.9 }}>Панель управления документами</p>
                    </Col>
                    <Col>
                        <Tag color="white" style={{ fontSize: 14, padding: '4px 12px' }}>
                            <UserOutlined /> {user?.role}
                        </Tag>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {[
                    { title: 'Всего', value: stats.total, icon: <FileTextOutlined />, color: '#1890ff' },
                    { title: 'На согласовании', value: stats.review, icon: <ClockCircleOutlined />, color: '#fa8c16' },
                    { title: 'Утверждено', value: stats.approved, icon: <CheckCircleOutlined />, color: '#52c41a' },
                    { title: 'Отклонено', value: stats.rejected, icon: <CloseCircleOutlined />, color: '#f5222d' },
                ].map((item, idx) => (
                    <Col xs={12} sm={6} key={idx}>
                        <Card className="shadow-hover" style={{ textAlign: 'center', transition: 'transform 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <Statistic
                                title={item.title}
                                value={item.value}
                                prefix={<span style={{ color: item.color }}>{item.icon}</span>}
                                valueStyle={{ color: item.color, fontSize: 24 }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={12}>
                    <Card title="📊 Распределение по статусам" className="shadow-lg">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%" cy="50%"
                                    innerRadius={50} outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="📈 Активность за неделю" className="shadow-lg">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dateData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                                <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                <Bar dataKey="count" fill="#667eea" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>

            <Card title="🕐 Недавние документы" className="shadow-lg">
                {recentDocs.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {recentDocs.map(doc => (
                            <div key={doc.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 16px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0'
                            }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <strong style={{ display: 'block', marginBottom: 4 }}>{doc.title}</strong>
                                    <span style={{ fontSize: 12, color: '#888' }}>
                                        {new Date(doc.created_at).toLocaleDateString('ru-RU')}
                                    </span>
                                </div>
                                <Tag color={STATUS_COLORS[doc.current_status_code]} style={{ marginLeft: 16 }}>
                                    {STATUS_LABELS[doc.current_status_code]}
                                </Tag>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                        <InboxOutlined style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
                        <p>Пока нет документов</p>
                        <p style={{ fontSize: 13 }}>Загрузите первый документ, чтобы начать работу</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Dashboard;