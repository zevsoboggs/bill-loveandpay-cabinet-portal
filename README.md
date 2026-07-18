# bill-loveandpay-cabinet-portal

Кабинет клиента платформы **Love&Pay Billing** (React + Ant Design).

Для реселлеров: обзор балансов, **пополнение депозита в USDT** (QR крипто-адреса),
транзакции по системам (СБП / PromptPay), API-доступ (ключи + белый список IP),
раздел «Карты» (заявки на карточную программу), профиль со сменой пароля.

## Стек
React · Vite · Ant Design

## Локальный запуск
```bash
npm install
npm run dev            # http://localhost:5174
```
API берётся из `VITE_API_URL` (`.env` для дева, `.env.production` для прод-сборки).

## Деплой
Vercel (root = этот репозиторий, framework Vite). `.env.production` указывает на
`https://api.bill.loveandpay.io`. SPA-роутинг — в `vercel.json`.
