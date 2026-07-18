import { useEffect, useState } from 'react';
import {
  Card, Typography, Button, Space, Input, Table, message, Tag, Popconfirm, Modal, Form,
  Descriptions, Alert, Divider,
} from 'antd';
import {
  CopyOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined, EyeInvisibleOutlined, EyeOutlined, ApiOutlined,
} from '@ant-design/icons';
import { api, DOCS_URL, API_BASE } from '../api.js';

const { Title, Text, Paragraph } = Typography;

export default function ApiAccess() {
  const [me, setMe] = useState(null);
  const [ips, setIps] = useState([]);
  const [reveal, setReveal] = useState(false);
  const [ipOpen, setIpOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    const [meR, ipR] = await Promise.all([api.get('/me'), api.get('/ip-whitelist')]);
    setMe(meR.data); setIps(ipR.data);
  };
  useEffect(() => { load(); }, []);

  const copy = (v) => { navigator.clipboard.writeText(v); message.success('Скопировано'); };

  const rotate = async () => {
    setBusy(true);
    try { await api.post('/rotate-keys'); message.success('Ключи перевыпущены'); await load(); }
    catch { message.error('Ошибка'); } finally { setBusy(false); }
  };

  const addIp = async (v) => {
    setBusy(true);
    try { await api.post('/ip-whitelist', { ip: v.ip, label: v.label }); message.success('IP добавлен'); setIpOpen(false); form.resetFields(); await load(); }
    catch (e) { message.error(e.response?.data?.error || 'Ошибка'); } finally { setBusy(false); }
  };

  const delIp = async (id) => {
    try { await api.delete(`/ip-whitelist/${id}`); message.success('IP удалён'); await load(); }
    catch { message.error('Ошибка'); }
  };

  if (!me) return null;
  const mask = (s) => (reveal ? s : s.slice(0, 6) + '•'.repeat(Math.max(0, s.length - 10)) + s.slice(-4));

  return (
    <div>
      <Title level={3}>API-доступ</Title>

      <Card title="Ключи авторизации" extra={
        <Space>
          <Button size="small" icon={reveal ? <EyeInvisibleOutlined /> : <EyeOutlined />} onClick={() => setReveal(!reveal)}>{reveal ? 'Скрыть' : 'Показать'}</Button>
          <Popconfirm title="Перевыпустить ключи? Старые сразу перестанут работать." onConfirm={rotate}>
            <Button size="small" danger icon={<ReloadOutlined />} loading={busy}>Ротация</Button>
          </Popconfirm>
        </Space>
      }>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="X-API-Key">
            <Space><Text code>{mask(me.api.apiKey)}</Text><Button size="small" icon={<CopyOutlined />} onClick={() => copy(me.api.apiKey)} /></Space>
          </Descriptions.Item>
          <Descriptions.Item label="X-API-Secret">
            <Space><Text code>{mask(me.api.apiSecret)}</Text><Button size="small" icon={<CopyOutlined />} onClick={() => copy(me.api.apiSecret)} /></Space>
          </Descriptions.Item>
        </Descriptions>
        <Alert style={{ marginTop: 12 }} type="warning" showMessage message="Секрет — как пароль. Не публикуйте его и передавайте только по защищённым каналам." />
      </Card>

      <Card style={{ marginTop: 16 }} title={<Space><ApiOutlined />Белый список IP {me.api.ipRestricted ? <Tag color="success">включён</Tag> : <Tag>выключен</Tag>}</Space>}
        extra={<Button icon={<PlusOutlined />} onClick={() => setIpOpen(true)}>Добавить IP</Button>}>
        {me.api.ipRestricted
          ? <Alert style={{ marginBottom: 12 }} type="info" showMessage message="API-запросы принимаются только с адресов из этого списка." />
          : <Alert style={{ marginBottom: 12 }} type="warning" showMessage message="IP-ограничение выключено администратором — запросы принимаются с любого адреса." />}
        <Table dataSource={ips} rowKey="id" size="small" pagination={false}
          columns={[
            { title: 'IP', dataIndex: 'ip', render: (v) => <Text code>{v}</Text> },
            { title: 'Метка', dataIndex: 'label', render: (v) => v || '—' },
            { title: '', width: 60, render: (_, r) => (
              <Popconfirm title="Удалить IP?" onConfirm={() => delIp(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>) },
          ]}
          locale={{ emptyText: 'Нет разрешённых IP — добавьте хотя бы один' }} />
      </Card>

      <Card style={{ marginTop: 16 }} title="Документация и быстрый старт"
        extra={<Button type="primary" icon={<ApiOutlined />} href={DOCS_URL} target="_blank">Открыть Swagger</Button>}>
        <Paragraph type="secondary">Базовый URL: <Text code>{API_BASE}/v1</Text>. Все запросы с заголовками <Text code>X-API-Key</Text> и <Text code>X-API-Secret</Text>.</Paragraph>
        <Divider orientation="left" plain>Пример: оплата СБП</Divider>
        <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, overflowX: 'auto', fontSize: 12 }}>{`curl -X POST ${API_BASE}/v1/sbp/pay \\
  -H "X-API-Key: ${me.api.apiKey}" \\
  -H "X-API-Secret: <ваш секрет>" \\
  -H "Content-Type: application/json" \\
  -d '{"qrData":"https://qr.nspk.ru/..."}'`}</pre>
        <Divider orientation="left" plain>Пример: оплата тайского QR (PromptPay)</Divider>
        <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, overflowX: 'auto', fontSize: 12 }}>{`curl -X POST ${API_BASE}/v1/promptpay/pay \\
  -H "X-API-Key: ${me.api.apiKey}" \\
  -H "X-API-Secret: <ваш секрет>" \\
  -H "Content-Type: application/json" \\
  -d '{"qrData":"<promptpay-qr>","amountThb":500}'`}</pre>
      </Card>

      <Modal title="Добавить IP в белый список" open={ipOpen} onCancel={() => setIpOpen(false)} confirmLoading={busy} onOk={() => form.submit()} okText="Добавить">
        <Form form={form} layout="vertical" onFinish={addIp}>
          <Form.Item name="ip" label="IP-адрес" rules={[{ required: true }]}><Input placeholder="203.0.113.10" /></Form.Item>
          <Form.Item name="label" label="Метка"><Input placeholder="прод-сервер" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
