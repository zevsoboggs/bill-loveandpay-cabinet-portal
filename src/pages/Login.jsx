import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Alert } from 'antd';
import { LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { auth } from '../api.js';
import { LogoMark, LNP_ACCENT } from '../components/Brand.jsx';

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [needTotp, setNeedTotp] = useState(false);
  const [totpError, setTotpError] = useState(false);
  const [form] = Form.useForm();
  const nav = useNavigate();

  const onFinish = async (v) => {
    setLoading(true);
    try {
      await auth.login(v.email, v.password, v.totp);
      nav('/');
    } catch (e) {
      const code = e.response?.data?.code;
      if (code === 'TOTP_REQUIRED') { setNeedTotp(true); setTotpError(false); }
      else if (code === 'TOTP_INVALID') { setNeedTotp(true); setTotpError(true); }
      else message.error(e.response?.data?.error || 'Ошибка входа');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 55%, #2c5364 100%)', padding: 16 }}>
      <Card style={{ width: 410, maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', borderRadius: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <LogoMark height={52} color="#0F4C5C" />
          </div>
          <Title level={3} style={{ marginBottom: 0, letterSpacing: -0.5 }}>
            Love<span style={{ color: LNP_ACCENT }}>&amp;</span>Pay
          </Title>
          <Text type="secondary">Кабинет клиента · Биллинг</Text>
        </div>
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Введите email' }]}>
            <Input size="large" prefix={<MailOutlined />} placeholder="you@company.com" autoComplete="username" disabled={needTotp} />
          </Form.Item>
          <Form.Item name="password" label="Пароль" rules={[{ required: true, message: 'Введите пароль' }]}>
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="••••••••" autoComplete="current-password" disabled={needTotp} />
          </Form.Item>
          {needTotp && (
            <>
              {totpError && <Alert type="error" showIcon style={{ marginBottom: 12 }} message="Неверный код, попробуйте ещё раз" />}
              <Form.Item name="totp" label="Код из Google Authenticator" rules={[{ required: true, message: 'Введите 6-значный код' }]}>
                <Input size="large" prefix={<SafetyOutlined />} placeholder="123456" inputMode="numeric" maxLength={6} autoFocus autoComplete="one-time-code" />
              </Form.Item>
            </>
          )}
          <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ marginTop: 8 }}>
            {needTotp ? 'Подтвердить' : 'Войти'}
          </Button>
          {needTotp && (
            <Button type="link" block style={{ marginTop: 8 }} onClick={() => { setNeedTotp(false); setTotpError(false); form.setFieldValue('totp', undefined); }}>
              ← Назад
            </Button>
          )}
        </Form>
      </Card>
    </div>
  );
}
