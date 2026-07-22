import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ConfigProvider, Menu, Typography, Button, Space, Grid, Dropdown, Avatar, Drawer } from 'antd';
import {
  DashboardOutlined, WalletOutlined, TransactionOutlined, ApiOutlined, LogoutOutlined,
  UserOutlined, DownOutlined, SafetyCertificateOutlined, CreditCardOutlined, MobileOutlined, SafetyOutlined,
  MenuOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons';
import Aml from './pages/Aml.jsx';
import ruRU from 'antd/locale/ru_RU';
import { auth, api } from './api.js';
import { Brand, LNP_PRIMARY } from './components/Brand.jsx';
import NotificationBell from './components/NotificationBell.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Deposit from './pages/Deposit.jsx';
import Transactions from './pages/Transactions.jsx';
import ApiAccess from './pages/ApiAccess.jsx';
import Cards from './pages/Cards.jsx';
import Esim from './pages/Esim.jsx';
import Vpn from './pages/Vpn.jsx';
import Transit from './pages/Transit.jsx';
import Profile from './pages/Profile.jsx';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const GAP = 16;
const SIDE_W = 250;
const SIDE_W_COLLAPSED = 84;
const PAGE_BG = 'linear-gradient(165deg, #e9f0f2 0%, #f3f6f7 42%, #eef3f4 100%)';
const PANEL = {
  background: '#ffffff',
  border: '1px solid #eaeef0',
  boxShadow: '0 8px 30px rgba(15,76,92,0.07)',
};

// Menu adapts to the partner's enabled services (eSIM shown only if granted).
function buildMenu(services) {
  const items = [
    { key: '/', icon: <DashboardOutlined />, label: 'Обзор' },
    { key: '/deposit', icon: <WalletOutlined />, label: 'Депозит' },
    { key: '/transactions', icon: <TransactionOutlined />, label: 'Транзакции' },
  ];
  if (services?.esim) items.push({ key: '/esim', icon: <MobileOutlined />, label: 'eSIM' });
  if (services?.vpn) items.push({ key: '/vpn', icon: <SafetyOutlined />, label: 'VPN' });
  if (services?.aml) items.push({ key: '/aml', icon: <SafetyCertificateOutlined />, label: 'AML-проверка' });
  if (services?.transit) items.push({ key: '/transit', icon: <WalletOutlined />, label: 'Транзит-кошельки' });
  items.push({ key: '/cards', icon: <CreditCardOutlined />, label: 'Карты' });
  items.push({ key: '/api', icon: <ApiOutlined />, label: 'API-доступ' });
  items.push({ key: '/profile', icon: <UserOutlined />, label: 'Профиль' });
  return items;
}

function Shell() {
  const nav = useNavigate();
  const loc = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [services, setServices] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const me = auth.me();

  useEffect(() => { api.get('/me').then((r) => { setServices(r.data.services); setAvatar(r.data.avatarUrl || null); }).catch(() => {}); }, []);
  useEffect(() => { setDrawerOpen(false); }, [loc.pathname]);
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

  // Reusable sidebar body (used both docked and in the mobile drawer).
  const SidebarBody = ({ mini = false, inDrawer = false }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: mini ? '22px 8px' : '22px 22px 18px' }}>
        <Brand collapsed={mini} height={30} sub="Кабинет клиента" />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 10px 8px' }}>
        <Menu mode="inline" inlineCollapsed={mini} selectedKeys={[loc.pathname]} items={MENU}
          onClick={(e) => { nav(e.key); if (inDrawer) setDrawerOpen(false); }}
          style={{ borderInlineEnd: 0, background: 'transparent', fontSize: 14.5 }} />
      </div>
      {!mini && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f4f5' }}>
          <Button block type="text" danger icon={<LogoutOutlined />} onClick={() => auth.logout()}
            style={{ justifyContent: 'flex-start', height: 40, borderRadius: 10, fontWeight: 500 }}>
            Выйти
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: PAGE_BG, display: 'flex', gap: GAP, padding: isMobile ? 12 : GAP }}>
      {/* Docked floating sidebar (desktop / tablet) */}
      {!isMobile && (
        <aside style={{
          width: collapsed ? SIDE_W_COLLAPSED : SIDE_W,
          flex: '0 0 auto',
          transition: 'width .22s cubic-bezier(.4,0,.2,1)',
          position: 'sticky', top: GAP, alignSelf: 'flex-start',
          height: `calc(100vh - ${GAP * 2}px)`,
          borderRadius: 22, overflow: 'hidden', ...PANEL,
        }}>
          <SidebarBody mini={collapsed} />
        </aside>
      )}

      {/* Mobile drawer */}
      <Drawer placement="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        width={266} closable={false} styles={{ body: { padding: 0 }, content: { borderRadius: '0 20px 20px 0', overflow: 'hidden' } }}>
        <SidebarBody inDrawer />
      </Drawer>

      {/* Right column: header + content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: GAP }}>
        <header style={{
          height: 66, borderRadius: 18, padding: '0 12px 0 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: isMobile ? 12 : GAP, zIndex: 20, ...PANEL,
        }}>
          <Space size={6}>
            <Button type="text" shape="circle" style={{ width: 40, height: 40 }}
              icon={isMobile ? <MenuOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
              onClick={() => (isMobile ? setDrawerOpen(true) : setCollapsed((c) => !c))} />
            <Text strong style={{ fontSize: 17, letterSpacing: -0.2 }}>{current?.label || ''}</Text>
          </Space>

          <Space size={isMobile ? 2 : 6}>
            <NotificationBell />
            <Dropdown menu={userMenu} trigger={['click']}>
              <Button type="text" style={{ height: 50, padding: isMobile ? '0 6px' : '0 8px', borderRadius: 12 }}>
                <Space size={8}>
                  <Avatar size={36} src={avatar || undefined} style={{ background: LNP_PRIMARY, flex: '0 0 auto' }}>
                    {(me?.name || '?').slice(0, 1).toUpperCase()}
                  </Avatar>
                  {screens.sm && (
                    <span style={{ textAlign: 'left', lineHeight: 1.2 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2a30' }}>{me?.name}</div>
                      <div style={{ fontSize: 11, color: '#8a97a0' }}>{me?.email}</div>
                    </span>
                  )}
                  {screens.sm && <DownOutlined style={{ fontSize: 10, color: '#9aa5ad' }} />}
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </header>

        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', width: '100%' }}><Outlet /></div>
        </main>
      </div>
    </div>
  );
}

function Protected() {
  return auth.isAuthed() ? <Shell /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ConfigProvider locale={ruRU} theme={{
      token: {
        colorPrimary: LNP_PRIMARY,
        borderRadius: 10,
        fontSize: 14,
        colorBgLayout: 'transparent',
        colorTextHeading: '#1f2a30',
      },
      components: {
        Menu: {
          itemSelectedBg: '#e8f2f4',
          itemSelectedColor: LNP_PRIMARY,
          itemColor: '#4a565d',
          itemHoverBg: '#f2f6f7',
          itemHeight: 46,
          itemBorderRadius: 12,
          itemMarginInline: 0,
          itemMarginBlock: 4,
          iconSize: 17,
          collapsedIconSize: 18,
        },
        Card: { borderRadiusLG: 16, boxShadowTertiary: '0 4px 18px rgba(15,76,92,0.05)' },
        Button: { borderRadius: 10, controlHeight: 38 },
        Input: { borderRadius: 10, controlHeight: 38 },
        Segmented: { borderRadius: 10 },
        Modal: { borderRadiusLG: 18 },
        Table: { borderRadiusLG: 14, headerBg: '#f7f9fa' },
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
            <Route path="/vpn" element={<Vpn />} />
            <Route path="/aml" element={<Aml />} />
            <Route path="/transit" element={<Transit />} />
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
