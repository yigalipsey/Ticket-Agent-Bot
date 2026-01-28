# 🚀 מדריך העלאה לפרודקשן - WhatsApp Bot

## ✅ דברים שצריך לבדוק לפני העלאה

### 1. בדיקת הקוד
```bash
# בדוק שהכל עובד מקומית
npm run dev

# בדוק שאין שגיאות TypeScript
npm run build
```

### 2. בדיקת משתני סביבה
ודא שיש לך את כל המשתנים הבאים ב-`.env`:

```env
# Twilio Configuration (אופציונלי - אם משתמש ב-Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Meta WhatsApp API Configuration (חובה!)
META_VERIFY_TOKEN=ticketagent_verify_token_2026
META_ACCESS_TOKEN=your_meta_access_token
META_PHONE_NUMBER_ID=your_phone_number_id

# API Configuration
API_BASE_URL=https://www.ticketagent.co.il
GEMINI_API_KEY=your_gemini_api_key

# Server Configuration
PORT=3100

# Public URL (for production - your actual domain)
PUBLIC_URL=https://your-production-domain.com
```

---

## 📦 אפשרויות פריסה (Deployment)

### אפשרות 1: Render.com (מומלץ - חינם!)

1. **צור חשבון ב-Render.com**
   - לך ל-https://render.com
   - התחבר עם GitHub

2. **צור Web Service חדש**
   - לחץ על "New +" → "Web Service"
   - חבר את ה-repository: `yigalipsey/Ticket-Agent-Bot`
   - הגדרות:
     - **Name**: `whatsapp-bot`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Instance Type**: `Free`

3. **הוסף משתני סביבה**
   - לחץ על "Environment" בתפריט
   - הוסף את כל המשתנים מה-`.env` שלך
   - **חשוב**: אל תשכח את `META_ACCESS_TOKEN` ו-`META_PHONE_NUMBER_ID`!

4. **Deploy**
   - Render יעשה deploy אוטומטי
   - אחרי כמה דקות תקבל URL כמו: `https://whatsapp-bot-xxxx.onrender.com`

5. **הגדר Webhook ב-Meta**
   - לך ל-Meta Developer Console
   - App → WhatsApp → Configuration
   - Webhook URL: `https://whatsapp-bot-xxxx.onrender.com/meta-webhook`
   - Verify Token: `ticketagent_verify_token_2026`
   - Subscribe to: `messages`

---

### אפשרות 2: Railway.app

1. **צור חשבון ב-Railway**
   - לך ל-https://railway.app
   - התחבר עם GitHub

2. **צור פרויקט חדש**
   - "New Project" → "Deploy from GitHub repo"
   - בחר את `yigalipsey/Ticket-Agent-Bot`

3. **הוסף משתני סביבה**
   - Settings → Variables
   - הוסף את כל המשתנים מה-`.env`

4. **Deploy**
   - Railway יעשה deploy אוטומטי
   - תקבל URL כמו: `https://whatsapp-bot-production.up.railway.app`

---

### אפשרות 3: Heroku

1. **התקן Heroku CLI**
   ```bash
   brew tap heroku/brew && brew install heroku
   ```

2. **התחבר ל-Heroku**
   ```bash
   heroku login
   ```

3. **צור אפליקציה**
   ```bash
   heroku create whatsapp-bot-ticketagent
   ```

4. **הוסף משתני סביבה**
   ```bash
   heroku config:set META_ACCESS_TOKEN=your_token
   heroku config:set META_PHONE_NUMBER_ID=your_id
   heroku config:set GEMINI_API_KEY=your_key
   heroku config:set API_BASE_URL=https://www.ticketagent.co.il
   heroku config:set META_VERIFY_TOKEN=ticketagent_verify_token_2026
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

---

### אפשרות 4: VPS (DigitalOcean / AWS / Google Cloud)

1. **התחבר לשרת**
   ```bash
   ssh user@your-server-ip
   ```

2. **התקן Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone הפרויקט**
   ```bash
   git clone https://github.com/yigalipsey/Ticket-Agent-Bot.git
   cd Ticket-Agent-Bot
   ```

4. **התקן dependencies**
   ```bash
   npm install
   npm run build
   ```

5. **צור קובץ .env**
   ```bash
   nano .env
   # הדבק את כל המשתנים
   ```

6. **הרץ עם PM2**
   ```bash
   sudo npm install -g pm2
   pm2 start dist/index.js --name whatsapp-bot
   pm2 save
   pm2 startup
   ```

7. **הגדר Nginx (אופציונלי)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3100;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 🔧 הגדרת Meta Webhook (לאחר ה-Deploy)

1. **לך ל-Meta Developer Console**
   - https://developers.facebook.com/apps

2. **בחר את האפליקציה שלך**
   - WhatsApp → Configuration

3. **הגדר Webhook**
   - Callback URL: `https://your-production-url.com/meta-webhook`
   - Verify Token: `ticketagent_verify_token_2026`
   - לחץ "Verify and Save"

4. **Subscribe to Webhooks**
   - בחר את השדות:
     - ✅ `messages`
     - ✅ `message_status` (אופציונלי)

5. **בדיקה**
   - שלח הודעה ל-WhatsApp Business Number
   - בדוק שהבוט עונה!

---

## 📊 ניטור ו-Logs

### Render.com
```
Dashboard → Logs (בזמן אמת)
```

### Railway
```
Dashboard → Deployments → View Logs
```

### Heroku
```bash
heroku logs --tail
```

### VPS (PM2)
```bash
pm2 logs whatsapp-bot
pm2 monit
```

---

## 🐛 פתרון בעיות נפוצות

### הבוט לא עונה
1. בדוק שה-webhook מוגדר נכון ב-Meta
2. בדוק את ה-logs של השרת
3. ודא ש-`META_ACCESS_TOKEN` תקף (לא פג תוקף)

### שגיאת "Invalid Access Token"
- ה-token פג תוקף - צור token חדש ב-Meta Developer Console
- עדכן את `META_ACCESS_TOKEN` במשתני הסביבה

### השרת קורס
- בדוק את ה-logs
- ודא שיש מספיק זיכרון (לפחות 512MB)
- בדוק שכל ה-dependencies מותקנים

---

## 🔄 עדכון הקוד בפרודקשן

### Render/Railway (אוטומטי)
```bash
git add .
git commit -m "Update bot"
git push origin main
# Deploy אוטומטי!
```

### Heroku
```bash
git push heroku main
```

### VPS
```bash
ssh user@your-server
cd Ticket-Agent-Bot
git pull
npm install
npm run build
pm2 restart whatsapp-bot
```

---

## ✅ Checklist לפני Go-Live

- [ ] כל המשתנים ב-`.env` מוגדרים
- [ ] `npm run build` עובר בהצלחה
- [ ] Webhook מוגדר ב-Meta ומאומת
- [ ] בדיקת הודעה ראשונה עובדת
- [ ] בדיקת חיפוש כרטיסים עובדת
- [ ] Logs נראים תקינים
- [ ] יש backup של ה-`.env`

---

## 🎉 מוכן!

הבוט שלך אמור לעבוד בפרודקשן! 🚀

אם יש בעיות, בדוק את ה-logs ותקן בהתאם.
