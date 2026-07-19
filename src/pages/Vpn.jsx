import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Card, Typography, Button, Tag, message, Space, Empty, Modal, Statistic, Table, Segmented, Input, List, Result, Alert,
} from 'antd';
import { SafetyOutlined, ShoppingCartOutlined, ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import { api, usdt } from '../api.js';
import { LNP_PRIMARY } from '../components/Brand.jsx';

const { Title, Text, Paragraph } = Typography;

const flagEmoji = (iso2) =>
  iso2 && iso2.length === 2 ? iso2.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : '🌐';

export default function Vpn() {
  const [me, setMe] = useState(null);
  const [cat, setCat] = useState(null);
  const [tab, setTab] = useState('world');
  const [search, setSearch] = useState('');
  const [buying, setBuying] = useState(null);
  const [keys, setKeys] = useState([]);
  const [result, setResult] = useState(null);

  const loadMe = () => api.get('/me').then((r) => setMe(r.data));
  const loadCat = () => api.get('/vpn/locations').then((r) => setCat(r.data)).catch((e) => message.error(e.response?.data?.error || 'Ошибка каталога'));
  const loadKeys = () => api.get('/vpn/my').then((r) => setKeys(r.data)).catch(() => {});
  useEffect(() => { loadMe(); loadCat(); loadKeys(); }, []);

  const copy = (v) => { navigator.clipboard.writeText(v); message.success('Скопировано'); };

  const buy = async (target) => {
    setBuying(target.key);
    try {
      const { data } = await api.post('/vpn/buy', target.body);
      setResult(data.key);
      loadMe(); loadKeys();
    } catch (e) {
      const err = e.response?.data;
      if (err?.code === 'INSUFFICIENT_BALANCE') message.error(`Недостаточно средств на VPN-балансе (нужно ${usdt(err.required)})`);
      else message.error(err?.error || 'Ошибка покупки');
    } finally { setBuying(null); }
  };

  if (!cat || !me) return null;

  const rows = (tab === 'rf' ? cat.rf : tab === 'ru' ? cat.ru : cat.world)
    .filter((r) => !search || (r.name || r.country || '').toLowerCase().includes(search.toLowerCase()) || (r.city || '').toLowerCase().includes(search.toLowerCase()));

  const columns = [
    {
      title: tab === 'rf' ? 'Сервер (для РФ)' : 'Локация', width: 320,
      render: (_, r) => (
        <Space>
          <span style={{ fontSize: 20, lineHeight: 1 }}>{flagEmoji(r.iso2)}</span>
          <div>
            <Text strong>{r.name || r.country}</Text>
            {r.city && <div><Text type="secondary" style={{ fontSize: 12 }}>{r.city}</Text></div>}
          </div>
          {tab === 'rf' && <Tag color="gold">DPI-bypass</Tag>}
        </Space>
      ),
    },
    { title: 'Протокол', width: 130, align: 'center', render: () => <Tag color="volcano">{tab === 'rf' ? 'Shadowsocks' : 'VLESS'}</Tag> },
    {
      title: '', align: 'right', width: 130,
      render: (_, r) => {
        const target = tab === 'rf'
          ? { key: `rf:${r.host}`, body: { rfHost: r.host } }
          : { key: `loc:${r.id}`, body: { locationId: r.id } };
        return <Button type="primary" size="small" icon={<ShoppingCartOutlined />} loading={buying === target.key} onClick={() => buy(target)}>{usdt(cat.priceUsdt)}</Button>;
      },
    },
  ];

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Title level={3} style={{ margin: 0 }}><SafetyOutlined /> VPN</Title>
        <Space size="large">
          <Statistic title="Цена за ключ" value={cat.priceUsdt} precision={2} suffix="USDT" valueStyle={{ fontSize: 16 }} />
          <Statistic title="Баланс VPN" value={me.balances.vpn} precision={2} suffix="USDT" valueStyle={{ fontSize: 18, color: LNP_PRIMARY }} />
        </Space>
      </Space>

      <Alert type="info" showMessage style={{ marginBottom: 16 }}
        message={`Ключ VLESS/Shadowsocks на ${cat.durationDays} дней`}
        description="«Для РФ» — серверы с обходом DPI (Shadowsocks). «Весь мир» / «Россия» — ключи VLESS Reality. После покупки — конфиг + QR для импорта в приложение." />

      <Card styles={{ body: { padding: 0 } }}>
        <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <Segmented value={tab} onChange={(v) => { setTab(v); setSearch(''); }} options={[
            { value: 'rf', label: `Для РФ (${cat.rf.length})` },
            { value: 'ru', label: `Россия (${cat.ru.length})` },
            { value: 'world', label: `Весь мир (${cat.world.length})` },
          ]} />
          <Input.Search allowClear placeholder="Поиск страны/города" style={{ width: 240 }} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Table dataSource={rows} rowKey={(r) => r.host || r.id} columns={columns} size="middle"
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `Серверов: ${t}` }}
          scroll={{ x: 560 }} tableLayout="fixed"
          locale={{ emptyText: <Empty description="Ничего не найдено" /> }} />
      </Card>

      <Card style={{ marginTop: 20 }} title={<Space><SafetyOutlined />Мои VPN-ключи ({keys.length})</Space>}
        extra={<Button size="small" icon={<ReloadOutlined />} onClick={loadKeys}>Обновить</Button>}>
        {keys.length === 0 ? <Empty description="Пока нет ключей" /> : (
          <List grid={{ gutter: 16, xs: 1, sm: 2, lg: 3 }} dataSource={keys}
            renderItem={(k) => (
              <List.Item>
                <Card size="small">
                  <Space align="start">
                    <div style={{ background: '#fff', padding: 4, borderRadius: 6, border: '1px solid #eee' }}>
                      {k.config ? <QRCodeCanvas value={k.config} size={92} /> : <div style={{ width: 92, height: 92 }} />}
                    </div>
                    <div>
                      <Text strong>{k.locationLabel}</Text>
                      <div><Tag color="volcano">{k.protocol}</Tag><Tag color={new Date(k.expiresAt) > new Date() ? 'success' : 'default'}>{k.status}</Tag></div>
                      <Text type="secondary" style={{ fontSize: 11 }}>до {new Date(k.expiresAt).toLocaleDateString('ru-RU')}</Text>
                    </div>
                  </Space>
                  <Button size="small" icon={<CopyOutlined />} block style={{ marginTop: 8 }} onClick={() => copy(k.config)}>Копировать ключ</Button>
                </Card>
              </List.Item>
            )} />
        )}
      </Card>

      <Modal open={!!result} onCancel={() => setResult(null)} footer={<Button type="primary" onClick={() => setResult(null)}>Готово</Button>} title="VPN-ключ выдан ✅">
        {result && (
          <Result status="success" style={{ padding: 12 }}
            title={result.location}
            subTitle={`${result.protocol.toUpperCase()} · действует до ${new Date(result.expiresAt).toLocaleDateString('ru-RU')}`}
            extra={
              <div style={{ textAlign: 'center' }}>
                {result.config && <div style={{ display: 'inline-block', background: '#fff', padding: 8, borderRadius: 8, border: '1px solid #eee' }}><QRCodeCanvas value={result.config} size={200} /></div>}
                <Paragraph style={{ marginTop: 12, fontSize: 11, wordBreak: 'break-all' }} copyable={{ text: result.config }}>
                  <Text type="secondary">{result.config}</Text>
                </Paragraph>
              </div>
            } />
        )}
      </Modal>
    </div>
  );
}
