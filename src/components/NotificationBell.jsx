import { useState, useEffect, useCallback } from 'react';
import { Badge, Button, Popover, List, Typography, Empty, Space } from 'antd';
import {
  BellOutlined, WalletOutlined, CheckCircleOutlined, MobileOutlined, SafetyOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { api } from '../api.js';

const { Text } = Typography;

const ICONS = {
  'deposit.credited': <WalletOutlined style={{ color: '#0f4c5c' }} />,
  'payment.completed': <CheckCircleOutlined style={{ color: '#3f8600' }} />,
  'esim.issued': <MobileOutlined style={{ color: '#1677ff' }} />,
  'vpn.issued': <SafetyOutlined style={{ color: '#722ed1' }} />,
  'vpn.expiring': <ClockCircleOutlined style={{ color: '#d48806' }} />,
};

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'только что';
  if (s < 3600) return `${Math.floor(s / 60)} мин назад`;
  if (s < 86400) return `${Math.floor(s / 3600)} ч назад`;
  return new Date(d).toLocaleDateString('ru-RU');
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    api.get('/notifications', { params: { limit: 20 } })
      .then((r) => { setItems(r.data.items || []); setUnread(r.data.unread || 0); })
      .catch(() => {});
  }, []);

  const poll = useCallback(() => {
    api.get('/notifications/unread-count').then((r) => setUnread(r.data.unread || 0)).catch(() => {});
  }, []);

  useEffect(() => { poll(); const t = setInterval(poll, 30000); return () => clearInterval(t); }, [poll]);
  useEffect(() => { if (open) load(); }, [open, load]);

  const markAll = () => {
    api.post('/notifications/read', {}).then(() => { setUnread(0); load(); }).catch(() => {});
  };

  const content = (
    <div style={{ width: 340, maxHeight: 420, overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong>Уведомления</Text>
        {unread > 0 && <Button size="small" type="link" onClick={markAll}>Отметить прочитанными</Button>}
      </div>
      {items.length === 0
        ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Пока нет уведомлений" />
        : (
          <List
            size="small"
            dataSource={items}
            renderItem={(n) => (
              <List.Item style={{ padding: '8px 4px', background: n.read ? 'transparent' : '#f0f7f9', borderRadius: 8, marginBottom: 2 }}>
                <List.Item.Meta
                  avatar={ICONS[n.type] || <BellOutlined />}
                  title={<span style={{ fontSize: 13 }}>{n.title}</span>}
                  description={(
                    <span style={{ fontSize: 12 }}>
                      {n.body && <div style={{ color: '#59636b' }}>{n.body}</div>}
                      <span style={{ color: '#9aa5ad', fontSize: 11 }}>{timeAgo(n.createdAt)}</span>
                    </span>
                  )}
                />
              </List.Item>
            )}
          />
        )}
    </div>
  );

  return (
    <Popover content={content} trigger="click" open={open} onOpenChange={setOpen} placement="bottomRight">
      <Badge count={unread} size="small" offset={[-2, 4]}>
        <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: 18 }} />} />
      </Badge>
    </Popover>
  );
}
