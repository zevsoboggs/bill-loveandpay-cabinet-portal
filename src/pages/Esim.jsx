import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Card, Typography, Input, Button, Tag, message, Space, Empty, Modal, Statistic, List, Image, Result, Table,
} from 'antd';
import { SearchOutlined, MobileOutlined, ShoppingCartOutlined, GlobalOutlined, ReloadOutlined } from '@ant-design/icons';
import { api, usdt } from '../api.js';
import { LNP_PRIMARY } from '../components/Brand.jsx';

const { Title, Text, Paragraph } = Typography;

// ISO2 country code → emoji flag (no external requests, fully white-label).
const flagEmoji = (iso2) =>
  iso2 && iso2.length === 2
    ? iso2.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    : '🌐';

export default function Esim() {
  const [me, setMe] = useState(null);
  const [query, setQuery] = useState('');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(null);
  const [myEsims, setMyEsims] = useState([]);
  const [result, setResult] = useState(null);

  const loadMe = () => api.get('/me').then((r) => setMe(r.data));
  const loadMine = () => api.get('/esim/my').then((r) => setMyEsims(r.data)).catch(() => {});
  useEffect(() => { loadMe(); loadMine(); search('Thailand'); }, []);

  const search = async (q) => {
    setLoading(true);
    try {
      const { data } = await api.get('/esim/plans', { params: { search: q || undefined, limit: 60 } });
      setPlans(data.plans || []);
    } catch (e) { message.error(e.response?.data?.error || 'Ошибка загрузки тарифов'); }
    finally { setLoading(false); }
  };

  const buy = async (plan) => {
    setBuying(plan.id);
    try {
      const { data } = await api.post('/esim/issue', { planId: plan.id, count: 1 });
      setResult({ plan, esims: data.esims, amountUsdt: data.amountUsdt });
      loadMe(); loadMine();
    } catch (e) {
      const err = e.response?.data;
      if (err?.code === 'INSUFFICIENT_BALANCE') message.error(`Недостаточно средств на eSIM-балансе (нужно ${usdt(err.required)})`);
      else message.error(err?.error || 'Ошибка покупки');
    } finally { setBuying(null); }
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Title level={3} style={{ margin: 0 }}><MobileOutlined /> eSIM</Title>
        <Statistic title="Баланс eSIM" value={me?.balances?.esim ?? 0} precision={2} suffix="USDT" valueStyle={{ fontSize: 18, color: LNP_PRIMARY }} />
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Input.Search
          size="large" allowClear enterButton={<><SearchOutlined /> Найти</>}
          placeholder="Страна или тариф — напр. Thailand, Turkey, Europe…"
          defaultValue="Thailand"
          onSearch={search}
          prefix={<GlobalOutlined />}
        />
      </Card>

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={plans} rowKey="id" loading={loading} size="middle"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `Тарифов: ${t}` }}
          scroll={{ x: 720 }}
          locale={{ emptyText: <Empty description="Тарифы не найдены — уточните запрос" /> }}
          columns={[
            {
              title: 'Страна', dataIndex: 'country',
              sorter: (a, b) => (a.country || '').localeCompare(b.country || ''),
              render: (v, r) => (
                <Space>
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{flagEmoji(r.countryIso2)}</span>
                  <Text strong>{v}</Text>
                </Space>
              ),
            },
            { title: 'Трафик', dataIndex: 'data', align: 'center', sorter: (a, b) => Number(a.data) - Number(b.data),
              render: (v, r) => <Tag color="blue">{v} {r.dataUnit || 'GB'}</Tag> },
            { title: 'Срок', dataIndex: 'days', align: 'center', sorter: (a, b) => Number(a.days) - Number(b.days),
              render: (v) => `${v} дн.` },
            { title: 'Цена', dataIndex: 'priceUsdt', align: 'right', defaultSortOrder: 'ascend',
              sorter: (a, b) => a.priceUsdt - b.priceUsdt,
              render: (v) => <Text strong style={{ fontSize: 15, color: LNP_PRIMARY }}>{usdt(v)}</Text> },
            { title: '', align: 'right', fixed: 'right', width: 110,
              render: (_, p) => <Button type="primary" size="small" icon={<ShoppingCartOutlined />} loading={buying === p.id} onClick={() => buy(p)}>Купить</Button> },
          ]}
        />
      </Card>

      {/* My eSIMs */}
      <Card style={{ marginTop: 20 }} title={<Space><MobileOutlined />Мои eSIM ({myEsims.length})</Space>}
        extra={<Button size="small" icon={<ReloadOutlined />} onClick={loadMine}>Обновить</Button>}>
        {myEsims.length === 0 ? <Empty description="Пока нет выпущенных eSIM" /> : (
          <List grid={{ gutter: 16, xs: 1, sm: 2, lg: 3 }} dataSource={myEsims}
            renderItem={(e) => (
              <List.Item>
                <Card size="small">
                  <Space align="start">
                    <div style={{ background: '#fff', padding: 4, borderRadius: 6, border: '1px solid #eee' }}>
                      {e.metadata?.img ? <Image src={e.metadata.img} width={92} height={92} preview={false} />
                        : e.qrcode ? <QRCodeCanvas value={e.qrcode} size={92} /> : <div style={{ width: 92, height: 92 }} />}
                    </div>
                    <div>
                      <Text strong>{e.planName || e.country}</Text>
                      <div><Tag color="purple">{e.status || 'Released'}</Tag></div>
                      <Text type="secondary" style={{ fontSize: 11 }}>ICCID:<br /><Text code copyable style={{ fontSize: 10 }}>{e.iccid}</Text></Text>
                    </div>
                  </Space>
                  {e.qrcode && <Paragraph style={{ marginTop: 8, marginBottom: 0, fontSize: 10 }} copyable={{ text: e.qrcode }}><Text type="secondary">LPA: {e.qrcode}</Text></Paragraph>}
                </Card>
              </List.Item>
            )} />
        )}
      </Card>

      {/* Purchase result */}
      <Modal open={!!result} onCancel={() => setResult(null)} footer={<Button type="primary" onClick={() => setResult(null)}>Готово</Button>} title="eSIM выпущена ✅">
        {result && (
          <Result status="success" style={{ padding: 12 }}
            title={`Куплено: ${result.plan.country} · ${result.plan.data} ${result.plan.dataUnit || 'GB'}`}
            subTitle={`Списано ${usdt(result.amountUsdt)}`}
            extra={(result.esims || []).map((e, i) => (
              <Card key={i} size="small" style={{ marginBottom: 8, textAlign: 'center' }}>
                {e.img ? <Image src={e.img} width={180} preview={false} /> : e.qrcode ? <QRCodeCanvas value={e.qrcode} size={180} /> : null}
                <Paragraph style={{ marginTop: 8, marginBottom: 0 }} copyable={{ text: e.iccid }}><Text type="secondary">ICCID: {e.iccid}</Text></Paragraph>
                {e.qrcode && <Paragraph style={{ fontSize: 11 }} copyable={{ text: e.qrcode }}><Text type="secondary">LPA: {e.qrcode}</Text></Paragraph>}
              </Card>
            ))} />
        )}
      </Modal>
    </div>
  );
}
