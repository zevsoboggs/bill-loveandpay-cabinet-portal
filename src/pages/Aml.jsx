import { useEffect, useState } from 'react';
import {
  Card, Typography, Input, Button, Tag, message, Space, Table, Alert, Statistic, Row, Col, Progress, List, Result, Empty,
} from 'antd';
import {
  SafetyCertificateOutlined, SearchOutlined, FilePdfOutlined, ReloadOutlined, WarningOutlined, CheckCircleOutlined, StopOutlined,
} from '@ant-design/icons';
import { api, usdt } from '../api.js';
import { LNP_PRIMARY } from '../components/Brand.jsx';

const { Title, Text, Paragraph } = Typography;

const RISK = {
  low: { color: 'success', label: 'Низкий риск', icon: <CheckCircleOutlined />, bar: '#52c41a' },
  medium: { color: 'warning', label: 'Средний риск', icon: <WarningOutlined />, bar: '#faad14' },
  high: { color: 'error', label: 'Высокий риск', icon: <StopOutlined />, bar: '#ff4d4f' },
};
const riskOf = (lvl) => RISK[lvl] || { color: 'default', label: 'Неизвестно', icon: <SafetyCertificateOutlined />, bar: '#8c8c8c' };

// Authenticated blob download (PDF report).
const download = async (path, filename) => {
  try {
    const { data } = await api.get(path, { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch { message.error('Не удалось скачать PDF'); }
};

export default function Aml() {
  const [price, setPrice] = useState(null);
  const [address, setAddress] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHist, setLoadingHist] = useState(true);

  const loadPrice = () => api.get('/aml/price').then((r) => setPrice(r.data)).catch(() => {});
  const loadHistory = () => { setLoadingHist(true); api.get('/aml/checks').then((r) => setHistory(r.data)).catch(() => {}).finally(() => setLoadingHist(false)); };
  useEffect(() => { loadPrice(); loadHistory(); }, []);

  const runCheck = async () => {
    const addr = address.trim();
    if (!addr) return message.warning('Введите адрес');
    setChecking(true); setResult(null);
    try {
      const { data } = await api.post('/aml/check', { address: addr });
      setResult(data);
      loadPrice(); loadHistory();
    } catch (e) {
      const d = e.response?.data;
      if (d?.code === 'INSUFFICIENT_BALANCE') message.error('Недостаточно средств на AML-балансе — пополните через админа');
      else message.error(d?.error || 'Не удалось выполнить проверку');
    } finally { setChecking(false); }
  };

  const res = result?.result;
  const risk = riskOf(res?.riskLevel);

  return (
    <div>
      <Title level={3}>AML-проверка адресов</Title>
      <Paragraph type="secondary">
        Проверка криптоадресов (TRON, Ethereum, Bitcoin) на риски: связи с миксерами, санкционными и мошенническими адресами.
        Каждая проверка формирует PDF-отчёт. Стоимость — <b>{price ? usdt(price.pricePerCheck) : '…'}</b> за проверку.
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={8}>
          <Card><Statistic title="AML-баланс" value={price?.balance ?? 0} precision={2} suffix="USDT" prefix={<SafetyCertificateOutlined />} /></Card>
        </Col>
        <Col xs={12} md={8}>
          <Card><Statistic title="Цена проверки" value={price?.pricePerCheck ?? 0} precision={2} suffix="USDT" /></Card>
        </Col>
      </Row>

      <Card title="Новая проверка">
        <Space.Compact style={{ display: 'flex' }}>
          <Input size="large" placeholder="Адрес TRON / Ethereum / Bitcoin" value={address}
            onChange={(e) => setAddress(e.target.value)} onPressEnter={runCheck} prefix={<SearchOutlined />} allowClear />
          <Button size="large" type="primary" loading={checking} onClick={runCheck}>Проверить</Button>
        </Space.Compact>
        <Text type="secondary" style={{ fontSize: 12 }}>Сеть определяется автоматически. С баланса спишется {price ? usdt(price.pricePerCheck) : '0.5 USDT'}.</Text>
      </Card>

      {res && (
        <Card style={{ marginTop: 16 }} title="Результат"
          extra={result?.check?.id && <Button icon={<FilePdfOutlined />} onClick={() => download(`/aml/checks/${result.check.id}/report`, `AML-${res.address?.slice(0, 8)}.pdf`)}>Скачать PDF</Button>}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8} style={{ textAlign: 'center' }}>
              <Progress type="dashboard" percent={res.score ?? 0} strokeColor={risk.bar}
                format={(p) => <span style={{ fontSize: 22 }}>{p}<span style={{ fontSize: 12 }}>/100</span></span>} />
              <div style={{ marginTop: 8 }}><Tag color={risk.color} icon={risk.icon} style={{ fontSize: 14, padding: '4px 10px' }}>{risk.label}</Tag></div>
            </Col>
            <Col xs={24} md={16}>
              <Alert style={{ marginBottom: 12 }} type={risk.color === 'success' ? 'success' : risk.color === 'warning' ? 'warning' : 'error'}
                showIcon message={res.verdictTitle || risk.label} description={res.action} />
              <Descriptionsish address={res.address} network={res.network} />
              {res.flags?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ fontSize: 13 }}>Флаги:</Text>
                  <div style={{ marginTop: 4 }}>{res.flags.map((f, i) => <Tag key={i} color="volcano" style={{ marginBottom: 4 }}>{typeof f === 'string' ? f : f.title || f.type}</Tag>)}</div>
                </div>
              )}
            </Col>
          </Row>

          {res.components?.counterparty?.details?.length > 0 && (
            <>
              <Text strong style={{ display: 'block', marginTop: 12 }}>Рискованные контрагенты</Text>
              <List size="small" dataSource={res.components.counterparty.details}
                renderItem={(c) => (
                  <List.Item>
                    <Space wrap>
                      <Tag color={c.type === 'sanctions' ? 'red' : c.type === 'mixer' ? 'purple' : 'orange'}>{c.type}</Tag>
                      <Text code style={{ fontSize: 11 }}>{c.address}</Text>
                      <Text type="secondary">{c.address_name}</Text>
                    </Space>
                  </List.Item>
                )} />
            </>
          )}
          {res.recommendations?.length > 0 && (
            <Alert style={{ marginTop: 12 }} type="info" showIcon message="Рекомендации"
              description={<ul style={{ margin: 0, paddingLeft: 18 }}>{res.recommendations.map((r, i) => <li key={i}>{typeof r === 'string' ? r : r.text || JSON.stringify(r)}</li>)}</ul>} />
          )}
        </Card>
      )}

      <Card style={{ marginTop: 16 }} title="История проверок"
        extra={<Button size="small" icon={<ReloadOutlined />} onClick={loadHistory}>Обновить</Button>}>
        <Table dataSource={history} rowKey="id" loading={loadingHist} size="small" pagination={{ pageSize: 10 }} scroll={{ x: 640 }}
          locale={{ emptyText: <Empty description="Проверок пока нет" /> }}
          columns={[
            { title: 'Дата', dataIndex: 'createdAt', render: (v) => new Date(v).toLocaleString('ru-RU') },
            { title: 'Адрес', dataIndex: 'address', render: (v) => <Text code copyable={{ text: v }} style={{ fontSize: 11 }}>{v.slice(0, 10)}…{v.slice(-6)}</Text> },
            { title: 'Сеть', dataIndex: 'network', render: (v) => v || '—' },
            { title: 'Балл', dataIndex: 'score', align: 'center', render: (v) => v ?? '—' },
            { title: 'Риск', dataIndex: 'riskLevel', align: 'center', render: (v) => { const r = riskOf(v); return <Tag color={r.color}>{r.label}</Tag>; } },
            { title: 'Списано', dataIndex: 'chargedUsdt', align: 'right', render: (v) => usdt(v) },
            { title: 'PDF', align: 'center', render: (_, r) => <Button size="small" icon={<FilePdfOutlined />} onClick={() => download(`/aml/checks/${r.id}/report`, `AML-${r.address.slice(0, 8)}.pdf`)} /> },
          ]} />
      </Card>
    </div>
  );
}

// Tiny address/network descriptor row (kept inline to avoid an extra import).
function Descriptionsish({ address, network }) {
  return (
    <Space direction="vertical" size={2} style={{ width: '100%' }}>
      <Text type="secondary" style={{ fontSize: 12 }}>Адрес</Text>
      <Text code copyable style={{ fontSize: 12, wordBreak: 'break-all' }}>{address}</Text>
      <Text type="secondary" style={{ fontSize: 12 }}>Сеть: {network?.label || network?.id || network || '—'}</Text>
    </Space>
  );
}
