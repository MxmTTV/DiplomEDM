import { Card, Row, Col, Statistic } from 'antd';
import {
    FileTextOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
    documents: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ documents }) => {
    // Статистика
    const stats = {
        total: documents.length,
        draft: documents.filter(d => d.current_status === 'draft').length,
        pending: documents.filter(d => d.current_status === 'pending').length,
        approved: documents.filter(d => d.current_status === 'approved').length,
        rejected: documents.filter(d => d.current_status === 'rejected').length,
    };

    // Данные для графика по статусам
    const statusData = [
        { name: 'Черновик', value: stats.draft, color: '#d9d9d9' },
        { name: 'На согласовании', value: stats.pending, color: '#fa8c16' },
        { name: 'Утверждён', value: stats.approved, color: '#52c41a' },
        { name: 'Отклонён', value: stats.rejected, color: '#f5222d' },
    ];

    // Данные для графика по датам (последние 7 дней)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const dateData = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        count: documents.filter(d => d.created_at.startsWith(date)).length
    }));

    return (
        <div className="animate-fadeIn" style={{ marginBottom: 24 }}>
            {/* Карточки статистики */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-lg shadow-hover rounded-2xl">
                        <Statistic
                            title="Всего документов"
                            value={stats.total}
                            prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                            valueStyle={{ color: '#1890ff', fontSize: 28 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-lg shadow-hover rounded-2xl">
                        <Statistic
                            title="На согласовании"
                            value={stats.pending}
                            prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
                            valueStyle={{ color: '#fa8c16', fontSize: 28 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-lg shadow-hover rounded-2xl">
                        <Statistic
                            title="Утверждено"
                            value={stats.approved}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a', fontSize: 28 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-lg shadow-hover rounded-2xl">
                        <Statistic
                            title="Отклонено"
                            value={stats.rejected}
                            prefix={<CloseCircleOutlined style={{ color: '#f5222d' }} />}
                            valueStyle={{ color: '#f5222d', fontSize: 28 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Графики */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title="📊 Документы по статусам" className="shadow-lg rounded-2xl">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="📈 Активность по дням" className="shadow-lg rounded-2xl">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dateData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#667eea" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;