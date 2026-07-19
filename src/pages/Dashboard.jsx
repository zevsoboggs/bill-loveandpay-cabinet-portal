import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Statistic, Typography, Spin, Tag, Space, Button, Divider, Alert } from 'antd';
import { WalletOutlined, ThunderboltOutlined, GlobalOutlined, ArrowRightOutlined, MobileOutlined, SafetyOutlined } from '@ant-design/icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api, usdt } from '../api.js';

const { Title, Text, Paragraph } = Typography;

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);

  const [spend, setSpend] = useState(null);
  useEffect(() => {
    api.get('/me').then((r) => setMe(r.data)).finally(() => setLoading(false));
    api.get('/rates').then((r) => setRates(r.data)).catch(() => {});
    api.get('/analytics').then((r) => setSpend(r.data)).catch(() => {});
  }, []);
  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!me) return <Text type="danger">Не удалось загрузить данные</Text>;

  const b = me.balances;
  return (
    <div>
      <Title level={3}>Здравствуйте, {me.name} <Tag color={me.status === 'ACTIVE' ? 'success' : 'error'}>{me.status}</Tag></Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Депозит (USDT)" value={b.deposit} precision={2} prefix={<WalletOutlined />} />
            <Text type="secondary" style={{ fontSize: 12 }}>Общий депозит — распределяется по системам</Text>
            <Link to="/deposit"><Button type="primary" block style={{ marginTop: 12 }}>Пополнить депозит <ArrowRightOutlined /></Button></Link>
          </Card>
        </Col>
        {me.services?.sbp && (
          <Col xs={12} md={8}>
            <Card>
              <Statistic title="Баланс СБП" value={b.sbp} precision={2} suffix="USDT" valueStyle={{ color: '#2f54eb' }} prefix={<ThunderboltOutlined />} />
              <Text type="secondary" style={{ fontSize: 12 }}>Наценка: {(me.margins.sbp * 100).toFixed(1)}%</Text>
            </Card>
          </Col>
        )}
        {me.services?.promptpay && (
          <Col xs={12} md={8}>
            <Card>
              <Statistic title="Баланс PromptPay" value={b.promptpay} precision={2} suffix="USDT" valueStyle={{ color: '#389e0d' }} prefix={<GlobalOutlined />} />
              <Text type="secondary" style={{ fontSize: 12 }}>Наценка: {(me.margins.promptpay * 100).toFixed(1)}%</Text>
            </Card>
          </Col>
        )}
        {me.services?.esim && (
          <Col xs={12} md={8}>
            <Card>
              <Statistic title="Баланс eSIM" value={b.esim} precision={2} suffix="USDT" valueStyle={{ color: '#722ed1' }} prefix={<MobileOutlined />} />
              <Text type="secondary" style={{ fontSize: 12 }}>Наценка: {(me.margins.esim * 100).toFixed(1)}%</Text>
            </Card>
          </Col>
        )}
        {me.services?.vpn && (
          <Col xs={12} md={8}>
            <Card>
              <Statistic title="Баланс VPN" value={b.vpn} precision={2} suffix="USDT" valueStyle={{ color: '#d4380d' }} prefix={<SafetyOutlined />} />
              <Text type="secondary" style={{ fontSize: 12 }}>Наценка: {(me.margins.vpn * 100).toFixed(1)}%</Text>
            </Card>
          </Col>
        )}
      </Row>

      {(me.services?.sbp || me.services?.promptpay) && (
        <>
          <Divider orientation="left">Курсы</Divider>
          <Row gutter={[16, 16]}>
            {me.services?.sbp && (
              <Col xs={12} md={8}>
                <Card>
                  <Space style={{ marginBottom: 4 }}><Tag color="geekblue">СБП</Tag><Text type="secondary" style={{ fontSize: 12 }}>USDT → RUB</Text></Space>
                  <Statistic value={rates?.sbp?.rubPerUsdt ?? null} precision={2} prefix="1 USDT =" suffix="₽"
                    valueStyle={{ color: '#2f54eb' }} loading={!rates} />
                  {rates?.sbp?.error && <Text type="danger" style={{ fontSize: 12 }}>курс временно недоступен</Text>}
                  {rates?.sbp?.updatedAt && <Text type="secondary" style={{ fontSize: 11 }}>обновлён {new Date(rates.sbp.updatedAt).toLocaleTimeString('ru-RU')}</Text>}
                </Card>
              </Col>
            )}
            {me.services?.promptpay && (
              <Col xs={12} md={8}>
                <Card>
                  <Space style={{ marginBottom: 4 }}><Tag color="green">PromptPay</Tag><Text type="secondary" style={{ fontSize: 12 }}>USDT → THB</Text></Space>
                  <Statistic value={rates?.promptpay?.thbPerUsdt ?? null} precision={2} prefix="1 USDT =" suffix="฿"
                    valueStyle={{ color: '#389e0d' }} loading={!rates} />
                  {rates?.promptpay?.error && <Text type="danger" style={{ fontSize: 12 }}>курс временно недоступен</Text>}
                  {rates?.promptpay?.updatedAt && <Text type="secondary" style={{ fontSize: 11 }}>обновлён {new Date(rates.promptpay.updatedAt).toLocaleTimeString('ru-RU')}</Text>}
                </Card>
              </Col>
            )}
          </Row>
        </>
      )}

      {spend?.series?.length > 0 && (
        <>
          <Divider orientation="left">Расходы за 30 дней · всего {usdt(spend.totals.spent)}</Divider>
          <Card>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={spend.series} margin={{ left: -12, right: 8 }}>
                <defs><linearGradient id="sp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0F4C5C" stopOpacity={0.5} /><stop offset="100%" stopColor="#0F4C5C" stopOpacity={0.05} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => usdt(v)} />
                <Area type="monotone" dataKey="spent" name="Потрачено" stroke="#0F4C5C" fill="url(#sp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      <Divider orientation="left">Как работает биллинг</Divider>
      <Alert type="info" showMessage style={{ marginBottom: 16 }}
        message="Депозитная модель"
        description={
          <Paragraph style={{ marginBottom: 0 }}>
            1. Вы пополняете <b>депозит в USDT</b> на свой крипто-адрес (раздел «Депозит»).<br />
            2. Администратор распределяет депозит между системами <b>СБП</b> и <b>PromptPay</b>.<br />
            3. Через <b>API</b> вы оплачиваете счета — стоимость + ваша наценка списывается с баланса нужной системы.
          </Paragraph>
        } />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}><Card size="small"><Space><Text type="secondary">Транзакций:</Text><Text strong>{me.counts.transactions}</Text></Space></Card></Col>
        <Col xs={24} md={12}><Card size="small"><Space><Text type="secondary">Пополнений:</Text><Text strong>{me.counts.deposits}</Text></Space></Card></Col>
      </Row>
    </div>
  );
}
