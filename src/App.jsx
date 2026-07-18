import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ConfigProvider, Layout, Menu, Typography, Button, Space, Grid, Dropdown, Avatar } from 'antd';
import {
  DashboardOutlined, WalletOutlined, TransactionOutlined, ApiOutlined, LogoutOutlined,
  UserOutlined, DownOutlined, SafetyCertificateOutlined, CreditCardOutlined, MobileOutlined,
} from '@ant-design/icons';
import ruRU from 'antd/locale/ru_RU';
import { auth, api } from './api.js';
import { Brand, LNP_PRIMARY } from './components/Brand.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Deposit from './pages/Deposit.jsx';
import Transactions from './pages/Transactions.jsx';
import ApiAccess from './pages/ApiAccess.jsx';
import Cards from './pages/Cards.jsx';
import Esim from './pages/Esim.jsx';
import Profile from './pages/Profile.jsx';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

// Menu adapts to the partner's enabled services (eSIM shown only if granted).
function buildMenu(services) {
  const items = [
    { key: '/', icon: <DashboardOutlined />, label: 'Обзор' },
    { key: '/deposit', icon: <WalletOutlined />, label: 'Депозит' },
    { key: '/transactions', icon: <TransactionOutlined />, label: 'Транзакции' },
  ];
  if (services?.esim) items.push({ key: '/esim', icon: <MobileOutlined />, label: 'eSIM' });
  items.push({ key: '/cards', icon: <CreditCardOutlined />, label: 'Карты' });
  items.push({ key: '/api', icon: <ApiOutlined />, label: 'API-доступ' });
  items.push({ key: '/profile', icon: <UserOutlined />, label: 'Профиль' });
  return items;
}

function Shell() {
  const nav = useNavigate();
  const loc = useLocation();
  const screens = useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const [services, setServices] = useState(null);
  const me = auth.me();

  useEffect(() => { api.get('/me').then((r) => setServices(r.data.services)).catch(() => {}); }, []);
  const MENU = buildMenu(services);
  const current = MENU.find((m) => m.key === loc.pathname);

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Профиль' },
      { key: 'api', icon: <SafetyCertificateOutlined />, label: 'API-доступ' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Выйти', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') auth.logout();
      else if (key === 'profile') nav('/profile');
      else if (key === 'api') nav('/api');
    },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} breakpoint="lg"
        width={252} collapsedWidth={screens.md ? 80 : 0} theme="light"
        style={{ borderRight: '1px solid #eef1f3', boxShadow: '2px 0 12px rgba(15,76,92,0.05)', position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}>
        <div style={{ padding: collapsed ? '20px 8px' : '20px 20px', borderBottom: '1px solid #f5f6f7' }}>
          <Brand collapsed={collapsed} height={collapsed ? 32 : 28} sub="Кабинет клиента" />
        </div>
        <Menu mode="inline" selectedKeys={[loc.pathname]} items={MENU} onClick={(e) => nav(e.key)}
          style={{ borderInlineEnd: 0, marginTop: 12, fontSize: 14.5 }} />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', height: 64, lineHeight: 'normal', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', borderBottom: '1px solid #e8ecef', position: 'sticky', top: 0, zIndex: 10,
          boxShadow: '0 1px 8px rgba(15,76,92,0.05)' }}>
          <Text strong style={{ fontSize: 18 }}>{current?.label || ''}</Text>
          <Dropdown menu={userMenu} trigger={['click']}>
            <Button type="text" style={{ height: 48, padding: '0 10px' }}>
              <Space>
                <Avatar size={34} style={{ background: LNP_PRIMARY }}>{(me?.name || '?').slice(0, 1).toUpperCase()}</Avatar>
                {screens.sm && (
                  <span style={{ textAlign: 'left', lineHeight: 1.2 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{me?.name}</div>
                    <div style={{ fontSize: 11, color: '#8a97a0' }}>{me?.email}</div>
                  </span>
                )}
                <DownOutlined style={{ fontSize: 10, color: '#8a97a0' }} />
              </Space>
            </Button>
          </Dropdown>
        </Header>

        <Content style={{ padding: 24, background: '#f4f6f8' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}><Outlet /></div>
        </Content>
      </Layout>
    </Layout>
  );
}

function Protected() {
  return auth.isAuthed() ? <Shell /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ConfigProvider locale={ruRU} theme={{
      token: { colorPrimary: LNP_PRIMARY, borderRadius: 8, fontSize: 14 },
      components: {
        Layout: { siderBg: '#ffffff', headerBg: '#ffffff' },
        Menu: { itemSelectedBg: '#e8f2f4', itemSelectedColor: LNP_PRIMARY, itemHeight: 44, itemBorderRadius: 8, itemMarginInline: 10 },
      },
    }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={auth.isAuthed() ? <Navigate to="/" replace /> : <Login />} />
          <Route element={<Protected />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/deposit" element={<Deposit />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/esim" element={<Esim />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/api" element={<ApiAccess />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
