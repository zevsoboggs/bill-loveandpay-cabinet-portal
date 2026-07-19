import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Statistic, Typography, Spin, Tag, Space, Button, Divider, Alert } from 'antd';
import { WalletOutlined, ThunderboltOutlined, GlobalOutlined, ArrowRightOutlined, MobileOutlined, SafetyOutlined } from '@ant-design/icons';
import { api } from '../api.js';

const { Title, Text, Paragraph } = Typography;

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/me').then((r) => setMe(r.data)).finally(() => setLoading(false)); }, []);
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
