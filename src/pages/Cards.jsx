import { useEffect, useState } from 'react';
import {
  Row, Col, Card, Typography, Button, Tag, Form, Input, Select, message, Space, List, Result, Divider,
} from 'antd';
import {
  CreditCardOutlined, CheckCircleTwoTone, ClockCircleOutlined, GlobalOutlined, SafetyOutlined, ThunderboltOutlined, SendOutlined,
} from '@ant-design/icons';
import { api } from '../api.js';
import { LNP_PRIMARY, LNP_ACCENT } from '../components/Brand.jsx';

const { Title, Text, Paragraph } = Typography;

const STATUS = {
  NEW: { color: 'blue', label: 'Новая' },
  IN_REVIEW: { color: 'gold', label: 'На рассмотрении' },
  APPROVED: { color: 'green', label: 'Одобрена' },
  REJECTED: { color: 'red', label: 'Отклонена' },
};

const FEATURES = [
  { icon: <GlobalOutlined />, title: 'Пополнение с USDT', text: 'Выпуск и пополнение карт напрямую с крипто-баланса.' },
  { icon: <ThunderboltOutlined />, title: 'Виртуальные и пластик', text: 'Мгновенные виртуальные карты и физический пластик.' },
  { icon: <SafetyOutlined />, title: 'Для бизнеса', text: 'Мультикарточные программы под ваш объём и задачи.' },
];

export default function Cards() {
  const [apps, setApps] = useState([]);
  const [sending, setSending] = useState(false);
  const [form] = Form.useForm();

  const load = () => api.get('/card-applications').then((r) => setApps(r.data));
  useEffect(() => { load(); }, []);

  const submit = async (v) => {
    setSending(true);
    try {
      await api.post('/card-applications', v);
      message.success('Заявка отправлена! Мы свяжемся с вами.');
      form.resetFields();
      load();
    } catch (e) { message.error(e.response?.data?.error || 'Ошибка'); }
    finally { setSending(false); }
  };

  return (
    <div>
      <Title level={3}>Карты</Title>

      {/* Hero — coming soon */}
      <Card style={{ marginBottom: 16, background: `linear-gradient(120deg, ${LNP_PRIMARY} 0%, #14708a 100%)`, border: 'none' }}
        styles={{ body: { padding: 28 } }}>
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Tag color="gold" style={{ marginBottom: 12, fontWeight: 600 }}>СКОРО</Tag>
            <Title level={2} style={{ color: '#fff', margin: '0 0 8px' }}>
              Карты Love<span style={{ color: LNP_ACCENT }}>&</span>Pay
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, marginBottom: 0, maxWidth: 560 }}>
              Скоро вы сможете выпускать карты и пополнять их напрямую с USDT-баланса.
              Оставьте заявку — подключим вас одним из первых и расскажем условия.
            </Paragraph>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', width: 150, height: 96, borderRadius: 14, background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
              <CreditCardOutlined style={{ fontSize: 52, color: '#fff' }} />
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {FEATURES.map((f) => (
          <Col xs={24} md={8} key={f.title}>
            <Card size="small" style={{ height: '100%' }}>
              <Space align="start">
                <span style={{ fontSize: 22, color: LNP_PRIMARY }}>{f.icon}</span>
                <div><Text strong>{f.title}</Text><br /><Text type="secondary" style={{ fontSize: 13 }}>{f.text}</Text></div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title={<Space><SendOutlined />Оставить заявку</Space>}>
            <Form form={form} layout="vertical" onFinish={submit}>
              <Form.Item name="contact" label="Контакт для связи" rules={[{ required: true, message: 'Укажите контакт' }]}
                tooltip="Telegram, email или телефон">
                <Input placeholder="@username / email / +7…" />
              </Form.Item>
              <Form.Item name="cardType" label="Тип карт (необязательно)">
                <Select allowClear placeholder="Выберите" options={[
                  { value: 'Виртуальные USDT', label: 'Виртуальные (USDT)' },
                  { value: 'Пластик', label: 'Физический пластик' },
                  { value: 'Мультикарточная программа', label: 'Мультикарточная программа' },
                ]} />
              </Form.Item>
              <Form.Item name="volume" label="Ожидаемый объём в месяц (необязательно)">
                <Input placeholder="напр. $10 000 / мес" />
              </Form.Item>
              <Form.Item name="comment" label="Комментарий">
                <Input.TextArea rows={3} placeholder="Опишите задачу" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={sending} icon={<SendOutlined />}>Отправить заявку</Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Мои заявки">
            {apps.length === 0 ? (
              <Result icon={<ClockCircleOutlined style={{ color: LNP_PRIMARY }} />} subTitle="Вы ещё не отправляли заявок" style={{ padding: '16px 0' }} />
            ) : (
              <List dataSource={apps} itemLayout="vertical"
                renderItem={(a) => (
                  <List.Item>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                      <Space>
                        <CheckCircleTwoTone twoToneColor={LNP_PRIMARY} />
                        <Text strong>{a.cardType || 'Карточная программа'}</Text>
                      </Space>
                      <Tag color={STATUS[a.status]?.color}>{STATUS[a.status]?.label || a.status}</Tag>
                    </Space>
                    <div style={{ marginTop: 6, fontSize: 13 }}>
                      <Text type="secondary">Контакт: </Text>{a.contact}
                      {a.volume && <><Text type="secondary"> · Объём: </Text>{a.volume}</>}
                      <br /><Text type="secondary" style={{ fontSize: 12 }}>{new Date(a.createdAt).toLocaleString('ru-RU')}</Text>
                      {a.adminNote && <><Divider style={{ margin: '8px 0' }} /><Text type="secondary">Ответ: </Text>{a.adminNote}</>}
                    </div>
                  </List.Item>
                )} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
