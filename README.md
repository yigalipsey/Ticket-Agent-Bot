# WhatsApp Bot - Twilio Starter

בוט WhatsApp נקי המבוסס על Twilio, מוכן ללוגיקה חדשה.

## 🚀 התקנה

```bash
npm install
```

## ⚙️ הגדרות

צור קובץ `.env`:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Server Configuration
PORT=3100
```

## 🏃 הרצה

### פיתוח
```bash
npm run dev
```

### פרודקשן
```bash
npm run build
npm start
```

## 📡 Webhook Setup

### לפיתוח (עם ngrok):
```bash
ngrok http 3100
```

הגדר ב-Twilio Console:
`https://your-ngrok-url.ngrok.io/webhook`

## 📁 מבנה הפרויקט

```
src/
├── config/         # הגדרות
├── routes/         # נתיבי Express
├── services/       # לוגיקה
│   ├── twilioService.ts    # שליחת הודעות WhatsApp
│   └── messageHandler.ts   # טיפול בהודעות נכנסות
├── types/          # TypeScript types
└── index.ts        # Entry point
```

## 🔄 זרימה

1. משתמש שולח הודעה ב-WhatsApp
2. Twilio שולח webhook לשרת
3. הבוט מעבד את ההודעה ב-`messageHandler.ts`
4. שולח תשובה למשתמש דרך `twilioService.ts`
