# ✅ Checklist מהיר להעלאה לפרודקשן

## לפני ההעלאה:
- [x] הקוד עובד מקומית (`npm run dev`)
- [x] הקוד מתקמפל בהצלחה (`npm run build`)
- [ ] כל המשתנים ב-`.env` מוגדרים
- [ ] `.env` לא ב-git (רק `.env.example`)

## בחירת פלטפורמה:
**מומלץ למתחילים: Render.com (חינם!)**

### אפשרות 1: Render.com (הכי פשוט)
1. [ ] צור חשבון ב-https://render.com
2. [ ] חבר את GitHub repository
3. [ ] צור Web Service חדש
4. [ ] הוסף משתני סביבה (מה-`.env`)
5. [ ] Deploy!

### אפשרות 2: Railway.app
1. [ ] צור חשבון ב-https://railway.app
2. [ ] Deploy from GitHub
3. [ ] הוסף משתני סביבה
4. [ ] Deploy!

## אחרי ההעלאה:
1. [ ] העתק את ה-URL של השרת (למשל: `https://whatsapp-bot-xxxx.onrender.com`)
2. [ ] לך ל-Meta Developer Console
3. [ ] הגדר Webhook: `https://your-url.com/meta-webhook`
4. [ ] Verify Token: `ticketagent_verify_token_2026`
5. [ ] Subscribe to `messages`
6. [ ] שלח הודעת בדיקה ב-WhatsApp
7. [ ] בדוק שהבוט עונה!

## בדיקות:
- [ ] שלח "שלום" - הבוט אמור להגיב
- [ ] שלח "ריאל מדריד נגד ברצלונה" - הבוט אמור לחפש כרטיסים
- [ ] בדוק את ה-logs בפלטפורמה

## אם משהו לא עובד:
1. בדוק את ה-Logs בפלטפורמה
2. ודא ש-`META_ACCESS_TOKEN` תקף
3. בדוק שה-Webhook מוגדר נכון ב-Meta
4. ודא שכל משתני הסביבה מוגדרים

---

## 🚀 Quick Start - Render.com (5 דקות!)

1. **לך ל-https://render.com** → Sign up with GitHub
2. **New Web Service** → Connect repository: `yigalipsey/Ticket-Agent-Bot`
3. **הגדרות:**
   - Name: `whatsapp-bot`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. **Environment Variables** (לחץ "Add Environment Variable"):
   ```
   META_ACCESS_TOKEN = [הערך שלך]
   META_PHONE_NUMBER_ID = [הערך שלך]
   GEMINI_API_KEY = [הערך שלך]
   API_BASE_URL = https://www.ticketagent.co.il
   META_VERIFY_TOKEN = ticketagent_verify_token_2026
   PORT = 3100
   ```
5. **Create Web Service** → המתן 2-3 דקות
6. **העתק את ה-URL** (למשל: `https://whatsapp-bot-xxxx.onrender.com`)
7. **Meta Developer Console:**
   - Webhook URL: `https://whatsapp-bot-xxxx.onrender.com/meta-webhook`
   - Verify Token: `ticketagent_verify_token_2026`
   - Subscribe to: `messages`
8. **שלח הודעה ב-WhatsApp** → הבוט אמור לענות!

---

**זהו! הבוט שלך בפרודקשן! 🎉**

לפרטים נוספים, ראה `DEPLOYMENT.md`
