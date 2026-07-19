import { useEffect, useState } from 'react';
import {
  Card, Typography, Button, Space, Input, Table, message, Tag, Popconfirm, Modal, Form,
  Descriptions, Alert, Divider, Switch,
} from 'antd';
import {
  CopyOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined, EyeInvisibleOutlined, EyeOutlined, ApiOutlined, SendOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { api, DOCS_URL, API_BASE } from '../api.js';

const { Title, Text, Paragraph } = Typography;

const WH_STATUS_COLOR = { SUCCESS: 'success', FAILED: 'error', PENDING: 'processing' };

export default function ApiAccess() {
  const [me, setMe] = useState(null);
  const [ips, setIps] = useState([]);
  const [reveal, setReveal] = useState(false);
  const [ipOpen, setIpOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm();

  // Webhooks
  const [webhook, setWebhook] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [whUrl, setWhUrl] = useState('');
  const [whReveal, setWhReveal] = useState(false);
  const [logs, setLogs] = useState([]);

  const loadLogs = () => api.get('/api-logs', { params: { limit: 100 } }).then((r) => setLogs(r.data)).catch(() => {});

  const load = async () => {
    const [meR, ipR, whR, dlR] = await Promise.all([
      api.get('/me'), api.get('/ip-whitelist'), api.get('/webhook'), api.get('/webhook/deliveries'),
    ]);
    setMe(meR.data); setIps(ipR.data); setWebhook(whR.data); setWhUrl(whR.data.url || ''); setDeliveries(dlR.data);
    loadLogs();
  };
  useEffect(() => { load(); }, []);

  const copy = (v) => { navigator.clipboard.writeText(v); message.success('Скопировано'); };

  const saveWebhook = async (enabled) => {
    setBusy(true);
    try {
      const { data } = await api.put('/webhook', { url: whUrl, enabled: enabled ?? webhook.enabled });
      setWebhook(data); message.success('Вебхук сохранён');
    } catch (e) { message.error(e.response?.data?.error || 'Ошибка'); } finally { setBusy(false); }
  };

  const testWebhook = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/webhook/test');
      message.success(`Тест доставлен (HTTP ${data.httpStatus})`);
      const dl = await api.get('/webhook/deliveries'); setDeliveries(dl.data);
    } catch (e) { message.error(e.response?.data?.error || 'Не доставлено — проверьте URL'); } finally { setBusy(false); }
  };

  const rotateWhSecret = async () => {
    setBusy(true);
    try { const { data } = await api.post('/webhook/rotate-secret'); setWebhook((w) => ({ ...w, secret: data.secret })); message.success('Секрет обновлён'); }
    catch { message.error('Ошибка'); } finally { setBusy(false); }
  };

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

      <Card style={{ marginTop: 16 }} title={<Space><ApiOutlined />Sandbox (тестовый режим)</Space>}>
        <Alert style={{ marginBottom: 12 }} type="info" showMessage
          message="Тестируйте интеграцию без реальных списаний"
          description={<>С этими ключами платежи/выпуск <b>симулируются</b> (ответ помечен <Text code>sandbox: true</Text>), баланс не тратится, IP-ограничение не действует. Тот же базовый URL и эндпоинты.</>} />
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="X-API-Key (sandbox)">
            <Space><Text code>{reveal ? me.api.sandboxApiKey : mask(me.api.sandboxApiKey || '')}</Text><Button size="small" icon={<CopyOutlined />} onClick={() => copy(me.api.sandboxApiKey)} /></Space>
          </Descriptions.Item>
          <Descriptions.Item label="X-API-Secret (sandbox)">
            <Space><Text code>{reveal ? me.api.sandboxApiSecret : mask(me.api.sandboxApiSecret || '')}</Text><Button size="small" icon={<CopyOutlined />} onClick={() => copy(me.api.sandboxApiSecret)} /></Space>
          </Descriptions.Item>
        </Descriptions>
        <Alert style={{ marginTop: 12 }} type="success" showMessage
          message="Идемпотентность"
          description={<>Для платёжных запросов передавайте заголовок <Text code>Idempotency-Key</Text> — повтор с тем же ключом вернёт тот же результат (защита от двойного списания при ретраях).</>} />
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

      <Card style={{ marginTop: 16 }} title={<Space><ThunderboltOutlined />Вебхуки</Space>}
        extra={<Switch checked={!!webhook?.enabled} onChange={(v) => saveWebhook(v)} checkedChildren="Вкл" unCheckedChildren="Выкл" />}>
        <Alert type="info" showMessage style={{ marginBottom: 12 }}
          message="Уведомления о событиях на ваш сервер (депозит, оплата, выпуск eSIM)."
          description={<>События: <Text code>deposit.credited</Text>, <Text code>payment.completed</Text>, <Text code>payment.failed</Text>, <Text code>esim.issued</Text>. Подпись — заголовок <Text code>X-LnP-Signature</Text> (HMAC-SHA256 от тела секретом ниже).</>} />
        <Space.Compact style={{ display: 'flex', marginBottom: 12 }}>
          <Input placeholder="https://your-app.com/webhooks/loveandpay" value={whUrl} onChange={(e) => setWhUrl(e.target.value)} />
          <Button type="primary" onClick={() => saveWebhook()} loading={busy}>Сохранить</Button>
          <Button icon={<SendOutlined />} onClick={testWebhook} loading={busy} disabled={!webhook?.url}>Тест</Button>
        </Space.Compact>
        <Descriptions column={1} size="small" bordered style={{ marginBottom: 12 }}>
          <Descriptions.Item label="Секрет подписи">
            <Space wrap>
              <Text code>{whReveal ? webhook?.secret : (webhook?.secret ? webhook.secret.slice(0, 12) + '••••••••' : '—')}</Text>
              <Button size="small" icon={whReveal ? <EyeInvisibleOutlined /> : <EyeOutlined />} onClick={() => setWhReveal(!whReveal)} />
              <Button size="small" icon={<CopyOutlined />} onClick={() => copy(webhook?.secret)} />
              <Popconfirm title="Перевыпустить секрет? Старая подпись перестанет совпадать." onConfirm={rotateWhSecret}>
                <Button size="small" danger icon={<ReloadOutlined />}>Ротация</Button></Popconfirm>
            </Space>
          </Descriptions.Item>
        </Descriptions>
        <Text type="secondary">Последние доставки:</Text>
        <Table dataSource={deliveries} rowKey="id" size="small" pagination={{ pageSize: 5 }} style={{ marginTop: 8 }} scroll={{ x: 500 }}
          columns={[
            { title: 'Событие', dataIndex: 'event', render: (v) => <Tag>{v}</Tag> },
            { title: 'Статус', dataIndex: 'status', render: (v) => <Tag color={WH_STATUS_COLOR[v]}>{v}</Tag> },
            { title: 'HTTP', dataIndex: 'httpStatus', render: (v) => v || '—' },
            { title: 'Попыток', dataIndex: 'attempts' },
            { title: 'Время', dataIndex: 'createdAt', render: (v) => new Date(v).toLocaleString('ru-RU') },
          ]}
          locale={{ emptyText: 'Доставок пока нет' }} />
      </Card>

      <Card style={{ marginTop: 16 }} title={<Space><ApiOutlined />Журнал API-запросов</Space>}
        extra={<Button size="small" icon={<ReloadOutlined />} onClick={loadLogs}>Обновить</Button>}>
        <Table dataSource={logs} rowKey="id" size="small" pagination={{ pageSize: 10 }} scroll={{ x: 560 }}
          columns={[
            { title: 'Время', dataIndex: 'createdAt', render: (v) => new Date(v).toLocaleString('ru-RU') },
            { title: 'Метод', dataIndex: 'method', render: (v) => <Tag>{v}</Tag> },
            { title: 'Путь', dataIndex: 'path', render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
            { title: 'Статус', dataIndex: 'status', align: 'center', render: (v) => v == null ? '—' : <Tag color={v < 300 ? 'success' : v < 500 ? 'warning' : 'error'}>{v}</Tag> },
            { title: 'Время отв.', dataIndex: 'durationMs', align: 'right', render: (v) => v == null ? '—' : `${v} ms` },
            { title: 'Режим', dataIndex: 'sandbox', align: 'center', render: (v) => v ? <Tag color="blue">sandbox</Tag> : <Tag>live</Tag> },
          ]}
          locale={{ emptyText: 'Запросов пока нет' }} />
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
