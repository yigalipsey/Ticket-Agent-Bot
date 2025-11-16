import { Router } from "express";
import {
  processWebhookMessage,
  logWebhookInfo,
} from "../services/messageHandler";

const webhookRouter = Router();

// GET endpoint for webhook verification
webhookRouter.get("/", (req, res) => {
  // WhatsApp webhook verification
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.status(403).send("Forbidden");
  }
});

// POST endpoint for receiving messages
webhookRouter.post("/", async (req, res) => {
  const body = req.body;

  // Log webhook info
  logWebhookInfo(req.headers["content-type"] || "unknown", Object.keys(body));

  // Process the webhook message (all logic is in services)
  await processWebhookMessage(body);

  res.status(200).send("OK");
});

export default webhookRouter;
