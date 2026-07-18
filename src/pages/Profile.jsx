import { useEffect, useState } from 'react';
import {
  Row, Col, Card, Typography, Descriptions, Tag, Form, Input, Button, message, Space, Avatar,
} from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { api, auth } from '../api.js';
import { LNP_PRIMARY } from '../components/Brand.jsx';

const { Title, Text } = Typography;

export default function Profile() {
  const [me, setMe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { api.get('/me').then((r) => setMe(r.data)); }, []);

  const changePassword = async (v) => {
    if (v.newPassword !== v.confirm) return message.error('Пароли не совпадают');
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: v.currentPassword, newPassword: v.newPassword });
      message.success('Пароль изменён. Войдите заново.');
      form.resetFields();
      setTimeout(() => auth.logout(), 1200);
    } catch (e) { message.error(e.response?.data?.error || 'Ошибка'); }
    finally { setSaving(false); }
  };

  if (!me) return null;

  return (
    <div>
      <Title level={3}>Профиль</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <Space align="center" style={{ marginBottom: 16 }}>
              <Avatar size={56} style={{ background: LNP_PRIMARY }} icon={<UserOutlined />}>
                {(me.name || '?').slice(0, 1).toUpperCase()}
              </Avatar>
              <div>
                <Title level={4} style={{ margin: 0 }}>{me.name}</Title>
                <Tag color={me.status === 'ACTIVE' ? 'success' : 'error'}>{me.status}</Tag>
              </div>
            </Space>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Email">{me.email || '—'}</Descriptions.Item>
              <Descriptions.Item label="Компания">{me.company || '—'}</Descriptions.Item>
              <Descriptions.Item label="ID клиента"><Text code>{me.id}</Text></Descriptions.Item>
              <Descriptions.Item label="Транзакций">{me.counts.transactions}</Descriptions.Item>
              <Descriptions.Item label="Пополнений">{me.counts.deposits}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={<Space><SafetyOutlined />Смена пароля</Space>}>
            <Form form={form} layout="vertical" onFinish={changePassword} requiredMark={false}>
              <Form.Item name="currentPassword" label="Текущий пароль" rules={[{ required: true, message: 'Введите текущий пароль' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="••••••••" autoComplete="current-password" />
              </Form.Item>
              <Form.Item name="newPassword" label="Новый пароль"
                rules={[{ required: true, message: 'Введите новый пароль' }, { min: 8, message: 'Минимум 8 символов' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="минимум 8 символов" autoComplete="new-password" />
              </Form.Item>
              <Form.Item name="confirm" label="Повторите новый пароль" dependencies={['newPassword']}
                rules={[{ required: true, message: 'Повторите пароль' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="••••••••" autoComplete="new-password" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={saving}>Изменить пароль</Button>
              <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
                После смены пароля потребуется войти заново.
              </Text>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
