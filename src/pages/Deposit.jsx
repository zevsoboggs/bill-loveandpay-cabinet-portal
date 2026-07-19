import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Row, Col, Card, Typography, Button, Space, Tag, Table, message, Alert, Statistic, Input, Result,
} from 'antd';
import { CopyOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import { api, usdt } from '../api.js';
import { LNP_PRIMARY } from '../components/Brand.jsx';

const { Title, Text, Paragraph } = Typography;
const DEP_COLOR = { PENDING: 'default', CONFIRMED: 'processing', CREDITED: 'success', FAILED: 'error' };

export default function Deposit() {
  const [me, setMe] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [checking, setChecking] = useState(false);

  const load = async () => {
    const [meR, depR] = await Promise.all([api.get('/me'), api.get('/deposits')]);
    setMe(meR.data); setDeposits(depR.data);
  };
  useEffect(() => { load(); }, []);

  const copy = (v) => { navigator.clipboard.writeText(v); message.success('Скопировано'); };

  const check = async () => {
    setChecking(true);
    try {
      const { data } = await api.post('/deposits/check');
      if (data.credited > 0) message.success(`Зачислено ${usdt(data.credited)}!`);
      else message.info(`Новых поступлений нет (на кошельке: ${usdt(data.onchainUsdt)})`);
      await load();
    } catch (e) { message.error(e.response?.data?.error || 'Ошибка проверки'); }
    finally { setChecking(false); }
  };

  if (!me) return null;
  const addr = me.deposit.walletAddress;

  return (
    <div>
      <Title level={3}>Пополнение депозита</Title>

      {!me.deposit.hasWallet ? (
        <Result status="warning" title="Депозитный кошелёк ещё не создан"
          subTitle="Обратитесь к администратору платформы, чтобы вам выпустили USDT-кошелёк для пополнений." />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={10}>
            <Card>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <Tag color="green">USDT · сеть TRC-20 (TRON)</Tag>
                <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
                  <QRCodeCanvas value={addr} size={196} includeMargin={false} />
                </div>
                <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>Отсканируйте или скопируйте адрес</Text>
                <Input.Group compact style={{ display: 'flex' }}>
                  <Input readOnly value={addr} style={{ fontFamily: 'monospace' }} />
                  <Button icon={<CopyOutlined />} onClick={() => copy(addr)} />
                </Input.Group>
                <Button type="primary" icon={<SyncOutlined spin={checking} />} loading={checking} onClick={check} block>
                  Проверить поступление
                </Button>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={14}>
            <Card>
              <Row gutter={16}>
                <Col span={12}><Statistic title="Текущий депозит" value={me.balances.deposit} precision={2} suffix="USDT" /></Col>
                <Col span={12}><Statistic title="Минимальный депозит" value={me.deposit.minDeposit} precision={0} suffix="USDT" valueStyle={{ color: LNP_PRIMARY }} /></Col>
              </Row>
              <Alert style={{ marginTop: 16 }} type="warning" showMessage
                message={`Минимальная сумма пополнения — ${me.deposit.minDeposit} USDT`}
                description="Депозиты меньше минимальной суммы не активируют услуги. Отправляйте не меньше указанного порога." />
              <Alert style={{ marginTop: 12 }} type="info" showMessage
                message="Только USDT TRC-20"
                description="Отправляйте на этот адрес исключительно USDT в сети TRON (TRC-20). Средства зачисляются автоматически в течение ~1 минуты после подтверждения сети. Можно ускорить кнопкой «Проверить поступление»." />
              <Alert style={{ marginTop: 12 }} type="warning" showMessage
                message="Распределение по системам"
                description="После пополнения администратор распределит депозит между СБП и PromptPay. Отдельные балансы систем видны на «Обзоре»." />
            </Card>
          </Col>
        </Row>
      )}

      <Card style={{ marginTop: 16 }} title="История пополнений"
        extra={<Button size="small" icon={<ReloadOutlined />} onClick={load}>Обновить</Button>}>
        <Table dataSource={deposits} rowKey="id" size="small" pagination={{ pageSize: 10 }} scroll={{ x: 600 }}
          columns={[
            { title: 'Сумма', dataIndex: 'amountUsdt', align: 'right', render: (v) => <Text strong>{usdt(v)}</Text> },
            { title: 'Сеть', dataIndex: 'network', render: (v) => <Tag>{v}</Tag> },
            { title: 'Статус', dataIndex: 'status', render: (v) => <Tag color={DEP_COLOR[v]}>{v}</Tag> },
            { title: 'TxHash', dataIndex: 'txHash', render: (v) => v ? <Text code copyable style={{ fontSize: 11 }}>{v.slice(0, 12)}…</Text> : '—' },
            { title: 'Дата', dataIndex: 'createdAt', render: (v) => new Date(v).toLocaleString('ru-RU') },
          ]}
          locale={{ emptyText: 'Пополнений пока нет' }} />
      </Card>
    </div>
  );
}
