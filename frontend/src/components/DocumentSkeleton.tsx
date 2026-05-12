// Создай компонент DocumentSkeleton.tsx в components/
import { Card, Skeleton } from 'antd';
import { Row, Col } from 'antd';

export const DocumentSkeleton = () => (
    <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <Row align="middle" gutter={16}>
            <Col flex="auto">
                <Skeleton
                    avatar
                    active
                    title={{ width: '70%', style: { height: 20, marginBottom: 8 } }}
                    paragraph={{
                        rows: 2,
                        width: ['90%', '70%'],
                        style: { height: 14, marginBottom: 4 }
                    }}
                />
            </Col>
            <Col flex="100px">
                <Skeleton.Button active style={{ width: 80, height: 32 }} />
            </Col>
        </Row>
    </Card>
);