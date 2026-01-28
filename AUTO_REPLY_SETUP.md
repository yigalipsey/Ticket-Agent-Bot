# WhatsApp Bot - Auto Reply Setup

## תיאור
הבוט עכשיו מגיב אוטומטית "היי לכם" לכל הודעה שמגיעה דרך Meta WhatsApp API.

## הגדרות נדרשות

### 1. קבלת Phone Number ID מ-Meta
1. היכנס ל-[Meta for Developers](https://developers.facebook.com/)
2. בחר את האפליקציה שלך
3. לך ל-WhatsApp > API Setup
4. העתק את ה-**Phone Number ID** (לא את מספר הטלפון עצמו!)
5. הדבק אותו בקובץ `.env` במשתנה `META_PHONE_NUMBER_ID`

### 2. קבלת Access Token
ה-Access Token כבר קיים בקובץ `.env` שלך:
```
META_ACCESS_TOKEN=EAAqFKEkFvoABQpdMfqBCTadW3rx5xZB0XBVUfZC5p6HrYMqHGuOSBI0hTk09MhuoCuq14KAN0ZAJvCDSeWyRhfrFv8IeaWfwxBXnO48cg3wkbKf3BIJeamiRiFCgk1uHV2NBs33QKe78lEvmyEUeICZAFdStHKa5eZByfMIlSg0dY5U8gb69icgRJKDh8sUjYoZBfxwUxQP91yDemZCTYUsiW05ftw4NpGPsigBsorYTCyZCmbUS1QjJZAnEPHJFxApwnTFrH9m1lkj2ZBmTHwX6M0mgAR
```

### 3. הגדרת Webhook ב-Meta
1. היכנס ל-Meta for Developers
2. לך ל-WhatsApp > Configuration
3. הגדר את ה-Webhook URL (השתמש ב-ngrok URL שלך):
   ```
   https://YOUR_NGROK_URL/meta-webhook
   ```
4. הגדר את ה-Verify Token:
   ```
   ticketagent_verify_token_2026
   ```
5. בחר את ה-Webhook fields:
   - ✅ messages
   - ✅ message_status (אופציונלי)

## איך זה עובד

1. **קבלת הודעה**: כשמישהו שולח הודעת טקסט ב-WhatsApp
2. **Webhook**: Meta שולח את ההודעה ל-`/meta-webhook` endpoint
3. **תשובה אוטומטית**: הבוט שולח "היי לכם" בחזרה
4. **סימון כנקרא**: הבוט מסמן את ההודעה כנקראה

## קבצים שנוצרו/עודכנו

- ✅ `src/services/external/metaWhatsAppService.ts` - שירות לשליחת הודעות
- ✅ `src/routes/meta-webhook.ts` - עודכן עם לוגיקת תשובה אוטומטית
- ✅ `.env` - עודכן עם משתני סביבה נדרשים

## בדיקה

1. וודא שהשרת רץ:
   ```bash
   npm run dev
   ```

2. וודא ש-ngrok רץ:
   ```bash
   ngrok http 3100
   ```

3. שלח הודעה ל-WhatsApp Business Number שלך
4. הבוט אמור להגיב אוטומטית "היי לכם"

## Logs
בדוק את הלוגים בטרמינל כדי לראות:
- 📨 הודעות נכנסות
- 📤 הודעות יוצאות
- ✅ הצלחות
- ❌ שגיאות

## התאמה אישית

כדי לשנות את ההודעה האוטומטית, ערוך את השורה הזו ב-`meta-webhook.ts`:
```typescript
await metaWhatsAppService.sendTextMessage(senderNumber, 'היי לכם');
```

שנה את `'היי לכם'` לכל טקסט שתרצה.
