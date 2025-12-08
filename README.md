# WhatsApp Bot - TicketAgent

בוט WhatsApp לחיפוש והצגת כרטיסים למשחקי כדורגל.

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
TWILIO_WHATSAPP_NUMBER=whatsapp:+15558755941

# API Configuration
API_BASE_URL=https://your-production-api.com

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

### לפרודקשן (Render):
הגדר ב-Twilio Console:
`https://your-app.onrender.com/webhook`

## 🌐 העלאה ל-Render

1. דחוף את הקוד ל-GitHub
2. צור Web Service חדש ב-[Render](https://render.com)
3. חבר את ה-repo
4. הגדר Environment Variables מה-.env
5. Deploy!

## 📁 מבנה הפרויקט

```
src/
├── config/         # הגדרות
├── routes/         # נתיבי Express
├── services/       # לוגיקה עסקית
│   ├── apiService.ts       # תקשורת עם ה-API
│   ├── twilioService.ts    # שליחת הודעות WhatsApp
│   └── messageHandler.ts   # תזמור הכל
├── types/          # TypeScript types
└── index.ts        # Entry point
```

## 🔄 זרימה

1. משתמש שולח הודעה בWhatsApp
2. Twilio שולח webhook לשרת
3. הבוט מחפש הצעות דרך ה-API
4. שולח תוצאות למשתמש

## 📱 WhatsApp Business Number

המספר: `+1 555 875 5941`  
שם עסק: `Ticket Agent`  
סטטוס: `Online` | איכות: `High` | Throughput: `80 MPS`
