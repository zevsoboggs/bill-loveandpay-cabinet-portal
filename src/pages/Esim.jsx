import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Row, Col, Card, Typography, Input, Button, Tag, message, Space, Empty, Modal, Statistic, Spin, List, Image, Result,
} from 'antd';
import { SearchOutlined, MobileOutlined, ShoppingCartOutlined, GlobalOutlined, ReloadOutlined } from '@ant-design/icons';
import { api, usdt } from '../api.js';
import { LNP_PRIMARY } from '../components/Brand.jsx';

const { Title, Text, Paragraph } = Typography;

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

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
      ) : plans.length === 0 ? (
        <Empty description="Тарифы не найдены — уточните запрос" />
      ) : (
        <Row gutter={[12, 12]}>
          {plans.map((p) => (
            <Col xs={24} sm={12} lg={8} key={p.id}>
              <Card size="small" hoverable styles={{ body: { padding: 14 } }}>
                <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <Text strong>{p.country}</Text>
                    <div><Tag color="blue" style={{ marginTop: 4 }}>{p.data} {p.dataUnit || 'GB'}</Tag><Tag>{p.days} дн.</Tag></div>
                    {p.operators && <Text type="secondary" style={{ fontSize: 11 }}>{String(p.operators).split(',')[0]}</Text>}
                  </div>
                  {p.image && <img src={p.image} alt="" width={34} height={22} style={{ borderRadius: 3, objectFit: 'cover' }} />}
                </Space>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text strong style={{ fontSize: 16, color: LNP_PRIMARY }}>{usdt(p.priceUsdt)}</Text>
                  <Button type="primary" size="small" icon={<ShoppingCartOutlined />} loading={buying === p.id} onClick={() => buy(p)}>Купить</Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

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
