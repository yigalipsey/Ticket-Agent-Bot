// whatsapp-bot/src/index.ts

// טען משתנים סודיים מהקובץ .env לפני כל הייבואים
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import webhookRouter from "./routes/webhook";

// צור אפליקציית Express
const app = express();

// אפשר קבלת JSON ו-form-data בבקשות POST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// נהל את הנתיב של ה־Webhook
app.use("/webhook", webhookRouter);

// ברירת מחדל ל־404
app.use((req, res) => {
  res.status(404).send("נתיב לא נמצא");
});

// הרץ את השרת
const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Bot רץ על פורט ${PORT}`);
});
