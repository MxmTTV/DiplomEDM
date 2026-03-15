import { Input, Select, Button, Space } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';

const { Search } = Input;

interface FiltersProps {
    onSearch: (value: string) => void;
    onStatusFilter: (value: string) => void;
    onSort: (value: string) => void;
    onReset: () => void;
}

const Filters: React.FC<FiltersProps> = ({ onSearch, onStatusFilter, onSort, onReset }) => {
    return (
        <div className="card animate-slideIn" style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <Search
                        placeholder="🔍 Поиск по названию..."
                        allowClear
                        onSearch={onSearch}
                        style={{ flex: 1, minWidth: 250 }}
                        prefix={<SearchOutlined />}
                    />

                    <Select
                        placeholder="📋 Фильтр по статусу"
                        allowClear
                        onChange={onStatusFilter}
                        style={{ width: 200 }}
                        options={[
                            { value: 'draft', label: 'Черновик' },
                            { value: 'pending', label: 'На согласовании' },
                            { value: 'approved', label: 'Утверждён' },
                            { value: 'rejected', label: 'Отклонён' },
                            { value: 'archived', label: 'Архив' },
                        ]}
                    />

                    <Select
                        placeholder="📅 Сортировка"
                        onChange={onSort}
                        defaultValue="newest"
                        style={{ width: 200 }}
                        options={[
                            { value: 'newest', label: 'Сначала новые' },
                            { value: 'oldest', label: 'Сначала старые' },
                            { value: 'name_asc', label: 'По названию (А-Я)' },
                            { value: 'name_desc', label: 'По названию (Я-А)' },
                        ]}
                    />

                    <Button onClick={onReset} icon={<FilterOutlined />}>
                        Сбросить
                    </Button>
                </div>
            </Space>
        </div>
    );
};

export default Filters;