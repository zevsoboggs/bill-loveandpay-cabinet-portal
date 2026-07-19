import { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Segmented, Space } from 'antd';
import { api, usdt } from '../api.js';

const { Title, Text } = Typography;
const SYS_LABEL = { SBP: 'СБП (USDT)', PROMPTPAY: 'PromptPay (Тай QR)', ESIM: 'eSIM', VPN: 'VPN' };
const SYS_COLOR = { SBP: 'geekblue', PROMPTPAY: 'green', ESIM: 'purple', VPN: 'volcano' };
const ST_COLOR = { PENDING: 'default', PROCESSING: 'processing', COMPLETED: 'success', FAILED: 'error', REFUNDED: 'warning' };

export default function Transactions() {
  const [system, setSystem] = useState('ALL');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = system === 'ALL' ? '' : `?system=${system}`;
    api.get(`/transactions${q}`).then((r) => setRows(r.data)).finally(() => setLoading(false));
  }, [system]);

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Title level={3} style={{ margin: 0 }}>Транзакции</Title>
        <Segmented value={system} onChange={setSystem} options={[
          { value: 'ALL', label: 'Все' }, { value: 'SBP', label: SYS_LABEL.SBP }, { value: 'PROMPTPAY', label: SYS_LABEL.PROMPTPAY }, { value: 'ESIM', label: SYS_LABEL.ESIM }, { value: 'VPN', label: SYS_LABEL.VPN }]} />
      </Space>
      <Card>
        <Table dataSource={rows} rowKey="id" loading={loading} size="small" pagination={{ pageSize: 15 }} scroll={{ x: 800 }}
          columns={[
            { title: 'Система', dataIndex: 'system', render: (v) => <Tag color={SYS_COLOR[v]}>{SYS_LABEL[v]}</Tag> },
            { title: 'Сумма', render: (_, r) => r.sourceAmount ? `${Number(r.sourceAmount).toLocaleString('ru-RU')} ${r.sourceCurrency}` : '—' },
            { title: 'Списано', dataIndex: 'chargedUsdt', align: 'right', render: (v) => <Text strong>{usdt(v)}</Text> },
            { title: 'Статус', dataIndex: 'status', render: (v) => <Tag color={ST_COLOR[v]}>{v}</Tag> },
            { title: 'Описание', dataIndex: 'description', render: (v) => v || '—' },
            { title: 'Дата', dataIndex: 'createdAt', render: (v) => new Date(v).toLocaleString('ru-RU') },
          ]}
          locale={{ emptyText: 'Транзакций пока нет' }} />
      </Card>
    </div>
  );
}
