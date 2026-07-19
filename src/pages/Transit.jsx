import { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Typography, Button, Space, Modal, Form, Select, Input, InputNumber, message, Alert, Popconfirm,
} from 'antd';
import { PlusOutlined, ReloadOutlined, SendOutlined, EditOutlined, CopyOutlined, WalletOutlined } from '@ant-design/icons';
import { api } from '../api.js';

const { Title, Text } = Typography;
const copy = (v) => { navigator.clipboard.writeText(v); message.success('Скопировано'); };
const bal = (w) => (w.balances || []).map((b) => `${b.amount} ${b.shortName || b.symbol || ''}`).join(' · ') || '—';

export default function Transit() {
  const [networks, setNetworks] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [cForm] = Form.useForm();
  const [aForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [n, w] = await Promise.all([
        api.get('/transit/networks').then((r) => r.data.networks || []).catch(() => []),
        api.get('/transit/wallets', { params: { balances: 1 } }).then((r) => r.data.wallets || []).catch(() => []),
      ]);
      setNetworks(n); setWallets(w);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const createWallet = async (v) => {
    setBusy(true);
    try { await api.post('/transit/wallets', v); message.success('Кошелёк выпущен'); setCreateOpen(false); cForm.resetFields(); load(); }
    catch (e) { message.error(e.response?.data?.error || 'Ошибка'); } finally { setBusy(false); }
  };

  const runAction = async (v) => {
    setBusy(true);
    const { type, wallet } = action;
    try {
      if (type === 'transfer') await api.post(`/transit/wallets/${wallet.id}/transfer`, { coin: v.coin ?? 1, toAddress: v.toAddress, amount: Number(v.amount) });
      if (type === 'rename') await api.post(`/transit/wallets/${wallet.id}/rename`, { label: v.label });
      message.success('Готово'); setAction(null); aForm.resetFields(); load();
    } catch (e) { message.error(e.response?.data?.error || 'Ошибка'); } finally { setBusy(false); }
  };

  const coinOptions = (w) => {
    const net = networks.find((n) => n.network === w?.network);
    return (net?.coins || [{ id: 1, symbol: 'USDT' }]).map((c) => ({ value: c.id, label: `${c.symbol} (id ${c.id})` }));
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Title level={3} style={{ margin: 0 }}><WalletOutlined /> Транзитные кошельки</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>Обновить</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>Выпустить кошелёк</Button>
        </Space>
      </Space>

      <Alert type="info" showMessage style={{ marginBottom: 16 }}
        message="Крипто-кошельки для приёма и вывода"
        description="Выпускайте адреса в сетях TRON / BSC / ETH / BTC, принимайте на них крипту и выводите наружу. Всё также доступно по API (/v1/transit)." />

      <Card>
        <Table dataSource={wallets} rowKey="id" loading={loading} size="small" pagination={{ pageSize: 15 }} scroll={{ x: 800 }}
          columns={[
            { title: 'Метка', dataIndex: 'label', render: (v) => v || '—' },
            { title: 'Сеть', dataIndex: 'networkLabel', render: (v, r) => <Tag color="geekblue">{v || r.network}</Tag> },
            { title: 'Адрес', dataIndex: 'address', render: (v) => <Space><Text code style={{ fontSize: 11 }}>{v?.slice(0, 18)}…</Text><Button size="small" icon={<CopyOutlined />} onClick={() => copy(v)} /></Space> },
            { title: 'Баланс', render: (_, r) => <Text>{bal(r)}</Text> },
            { title: '', fixed: 'right', width: 150, render: (_, r) => (
              <Space size={4}>
                <Button size="small" icon={<SendOutlined />} onClick={() => setAction({ type: 'transfer', wallet: r })}>Вывод</Button>
                <Button size="small" icon={<EditOutlined />} onClick={() => { setAction({ type: 'rename', wallet: r }); aForm.setFieldsValue({ label: r.label }); }} />
              </Space>
            ) },
          ]}
          locale={{ emptyText: 'Нет кошельков — выпустите первый' }} />
      </Card>

      <Modal title="Выпустить транзитный кошелёк" open={createOpen} onCancel={() => setCreateOpen(false)} confirmLoading={busy} onOk={() => cForm.submit()} okText="Выпустить">
        <Form form={cForm} layout="vertical" onFinish={createWallet} initialValues={{ network: 'tron' }}>
          <Form.Item name="network" label="Сеть" rules={[{ required: true }]}>
            <Select options={networks.map((n) => ({ value: n.network, label: `${n.label} (${n.usdtNet})` }))} />
          </Form.Item>
          <Form.Item name="label" label="Метка"><Input placeholder="напр. payout-1" /></Form.Item>
        </Form>
      </Modal>

      <Modal title={action?.type === 'transfer' ? 'Вывод средств' : 'Переименовать'} open={!!action} onCancel={() => setAction(null)} confirmLoading={busy} onOk={() => aForm.submit()} okText="Выполнить">
        <Form form={aForm} layout="vertical" onFinish={runAction}>
          {action?.type === 'transfer' && <>
            <Form.Item name="coin" label="Монета" initialValue={1}><Select options={coinOptions(action?.wallet)} /></Form.Item>
            <Form.Item name="toAddress" label="Адрес получателя" rules={[{ required: true }]}><Input placeholder="T... / 0x..." /></Form.Item>
            <Form.Item name="amount" label="Сумма" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} step={1} /></Form.Item>
          </>}
          {action?.type === 'rename' && <Form.Item name="label" label="Новая метка" rules={[{ required: true }]}><Input /></Form.Item>}
        </Form>
      </Modal>
    </div>
  );
}
