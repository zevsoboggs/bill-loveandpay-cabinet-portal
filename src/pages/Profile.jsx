import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Row, Col, Card, Typography, Descriptions, Tag, Form, Input, Button, message, Space, Avatar, Upload, Switch, Alert, Steps, Popconfirm,
} from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, CameraOutlined, SyncOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { api, auth } from '../api.js';
import { LNP_PRIMARY } from '../components/Brand.jsx';

const { Title, Text, Paragraph } = Typography;

// Google Authenticator (TOTP) setup + management for the cabinet.
function TwoFactorCard({ enabled, onChange }) {
  const [setup, setSetup] = useState(null); // { secret, otpauth }
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try { const { data } = await api.post('/auth/2fa/setup'); setSetup(data); }
    catch (e) { message.error(e.response?.data?.error || 'Ошибка'); } finally { setBusy(false); }
  };
  const enable = async () => {
    setBusy(true);
    try { await api.post('/auth/2fa/enable', { totp: code }); message.success('2FA включена'); setSetup(null); setCode(''); onChange(true); }
    catch (e) { message.error(e.response?.data?.error || 'Неверный код'); } finally { setBusy(false); }
  };
  const disable = async (v) => {
    setBusy(true);
    try { await api.post('/auth/2fa/disable', v); message.success('2FA отключена'); onChange(false); }
    catch (e) { message.error(e.response?.data?.error || 'Ошибка'); } finally { setBusy(false); }
  };

  return (
    <Card style={{ marginTop: 16 }} title={<Space><SafetyOutlined />Двухфакторная аутентификация (2FA)</Space>}
      extra={enabled ? <Tag color="success" icon={<CheckCircleOutlined />}>Включена</Tag> : <Tag>Выключена</Tag>}>
      {enabled ? (
        <>
          <Alert type="success" showIcon style={{ marginBottom: 12 }} message="Вход в кабинет защищён кодом из Google Authenticator." />
          <Form layout="vertical" onFinish={disable} requiredMark={false}>
            <Text type="secondary">Чтобы отключить 2FA, подтвердите пароль и текущий код:</Text>
            <Row gutter={8} style={{ marginTop: 8 }}>
              <Col xs={24} sm={12}><Form.Item name="password" rules={[{ required: true, message: 'Пароль' }]}><Input.Password placeholder="Пароль" /></Form.Item></Col>
              <Col xs={24} sm={8}><Form.Item name="totp" rules={[{ required: true, message: 'Код' }]}><Input placeholder="Код 2FA" maxLength={6} inputMode="numeric" /></Form.Item></Col>
              <Col xs={24} sm={4}><Button danger htmlType="submit" loading={busy} block>Отключить</Button></Col>
            </Row>
          </Form>
        </>
      ) : !setup ? (
        <>
          <Paragraph type="secondary" style={{ marginBottom: 12 }}>
            Защитите вход одноразовыми кодами. Понадобится приложение Google Authenticator, Authy или 1Password.
          </Paragraph>
          <Button type="primary" icon={<SafetyOutlined />} onClick={start} loading={busy}>Включить 2FA</Button>
        </>
      ) : (
        <Steps direction="vertical" size="small" current={1}
          items={[
            { title: 'Отсканируйте QR-код', description: (
              <div style={{ padding: '8px 0' }}>
                <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #eee', display: 'inline-block' }}>
                  <QRCodeCanvas value={setup.otpauth} size={168} />
                </div>
                <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Или введите ключ вручную:</Text><br />
                  <Text code copyable>{setup.secret}</Text>
                </Paragraph>
              </div>
            ) },
            { title: 'Введите код из приложения', description: (
              <Space style={{ marginTop: 8 }}>
                <Input placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} inputMode="numeric" style={{ width: 140 }} />
                <Button type="primary" onClick={enable} loading={busy} disabled={code.length < 6}>Подтвердить</Button>
                <Button onClick={() => { setSetup(null); setCode(''); }}>Отмена</Button>
              </Space>
            ) },
          ]} />
      )}
    </Card>
  );
}

// Resize an uploaded image to a compact square JPEG data URL (client-side, no upload server).
function fileToAvatar(file, size = 160) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const [me, setMe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [autoRenew, setAutoRenew] = useState(false);
  const [twoFa, setTwoFa] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    api.get('/me').then((r) => { setMe(r.data); setAvatar(r.data.avatarUrl || null); setAutoRenew(!!r.data.vpnAutoRenew); setTwoFa(!!r.data.totpEnabled); });
  }, []);

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

  const uploadAvatar = async (file) => {
    if (!file.type.startsWith('image/')) { message.error('Только изображения'); return false; }
    try {
      const dataUrl = await fileToAvatar(file);
      await api.patch('/profile', { avatarUrl: dataUrl });
      setAvatar(dataUrl);
      message.success('Аватар обновлён');
    } catch (e) { message.error(e.response?.data?.error || 'Не удалось загрузить аватар'); }
    return false; // prevent AntD auto-upload
  };

  const removeAvatar = async () => {
    try { await api.patch('/profile', { avatarUrl: '' }); setAvatar(null); message.success('Аватар удалён'); }
    catch { message.error('Ошибка'); }
  };

  const toggleAutoRenew = async (v) => {
    setAutoRenew(v);
    try { await api.patch('/profile', { vpnAutoRenew: v }); message.success(v ? 'Автопродление VPN включено' : 'Автопродление VPN выключено'); }
    catch { setAutoRenew(!v); message.error('Ошибка'); }
  };

  if (!me) return null;

  return (
    <div>
      <Title level={3}>Профиль</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <Space align="center" style={{ marginBottom: 16 }}>
              <div style={{ position: 'relative' }}>
                <Avatar size={64} src={avatar || undefined} style={{ background: LNP_PRIMARY }} icon={<UserOutlined />}>
                  {(me.name || '?').slice(0, 1).toUpperCase()}
                </Avatar>
              </div>
              <div>
                <Title level={4} style={{ margin: 0 }}>{me.name}</Title>
                <Tag color={me.status === 'ACTIVE' ? 'success' : 'error'}>{me.status}</Tag>
              </div>
            </Space>
            <Space wrap style={{ marginBottom: 16 }}>
              <Upload showUploadList={false} accept="image/*" beforeUpload={uploadAvatar}>
                <Button size="small" icon={<CameraOutlined />}>Загрузить аватар</Button>
              </Upload>
              {avatar && <Button size="small" danger onClick={removeAvatar}>Удалить</Button>}
            </Space>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Email">{me.email || '—'}</Descriptions.Item>
              <Descriptions.Item label="Компания">{me.company || '—'}</Descriptions.Item>
              <Descriptions.Item label="ID клиента"><Text code>{me.id}</Text></Descriptions.Item>
              <Descriptions.Item label="Транзакций">{me.counts.transactions}</Descriptions.Item>
              <Descriptions.Item label="Пополнений">{me.counts.deposits}</Descriptions.Item>
            </Descriptions>
          </Card>

          {me.services?.vpn && (
            <Card style={{ marginTop: 16 }} title={<Space><SyncOutlined />Автопродление VPN</Space>}>
              <Space style={{ justifyContent: 'space-between', width: '100%' }} align="start">
                <Text type="secondary" style={{ fontSize: 13 }}>
                  За сутки до истечения ключа мы автоматически выпустим новый в той же локации и спишем стоимость с VPN-баланса.
                </Text>
                <Switch checked={autoRenew} onChange={toggleAutoRenew} checkedChildren="Вкл" unCheckedChildren="Выкл" />
              </Space>
            </Card>
          )}
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
          <TwoFactorCard enabled={twoFa} onChange={setTwoFa} />
        </Col>
      </Row>
    </div>
  );
}
