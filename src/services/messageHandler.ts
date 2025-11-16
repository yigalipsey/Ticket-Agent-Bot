import chalk from "chalk";
import { sendAutoReply } from "./messageSender";
import { findFootballTeams } from "./nlpService";
import { findClosestTeamByText } from "./teamEmbeddingSearchService";
import { findFixtureByTeamsSlug } from "./gameService";
import { findBestOffersForFixture } from "./offerService";

export interface WebhookBody {
  MessageSid?: string;
  From?: string;
  Body?: string;
  To?: string;
  object?: string;
  entry?: any[];
  [key: string]: any;
}

export async function handleTwilioMessage(body: WebhookBody): Promise<void> {
  console.log(chalk.green("═══════════════════════════════════════"));
  console.log(chalk.green("📨 Received WhatsApp message from Twilio:"));
  console.log(chalk.green("═══════════════════════════════════════"));
  console.log(chalk.green(`   From: ${body.From}`));
  console.log(chalk.green(`   To: ${body.To}`));
  console.log(chalk.green(`   Message: ${body.Body || "(no text)"}`));
  console.log(chalk.green(`   MessageSid: ${body.MessageSid}`));
  console.log(chalk.green(`   Full body: ${JSON.stringify(body, null, 2)}`));
  console.log(chalk.green("═══════════════════════════════════════"));

  // בדוק איזה קבוצות כדורגל יש בהודעה ושלח תשובה
  if (body.Body && body.From) {
    const messageText = body.Body;
    const teamsResult = await findFootballTeams(messageText);

    if (teamsResult.found) {
      console.log(
        chalk.yellow(
          `⚽ Football team names from OpenAI: ${teamsResult.teams.join(", ")}`
        )
      );

      const resolvedTeams: {
        originalName: string;
        he?: string;
        en?: string;
        id?: string;
        score?: number;
        logoUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
      }[] = [];

      // שלב 2–3: התאמת כל שם קבוצה למאגר על בסיס אימבדינג (עם נרמול שמות)
      for (const teamName of teamsResult.teams) {
        try {
          const match = await findClosestTeamByText(teamName);
          if (match) {
            resolvedTeams.push({
              originalName: teamName,
              he: match.name_he,
              en: match.name_en,
              id: match._id,
              score: match.score,
              logoUrl: match.logoUrl,
              primaryColor: match.primaryColor,
              secondaryColor: match.secondaryColor,
            });
          }
        } catch (err: any) {
          console.error(
            chalk.red(
              `❌ Error while searching closest team for "${teamName}": ${
                err.message || "Unknown error"
              }`
            )
          );
        }
      }

      let replyText = "";

      // שלב 4–5: אם זוהו לפחות שתי קבוצות – ננסה למצוא משחק והצעות
      if (resolvedTeams.length >= 2) {
        const tryBuildReplyForTeams = async (
          home: (typeof resolvedTeams)[number],
          away: (typeof resolvedTeams)[number]
        ) => {
          const homeNameEn = home.en || home.he || home.originalName;
          const awayNameEn = away.en || away.he || away.originalName;

          const fixture = await findFixtureByTeamsSlug(homeNameEn, awayNameEn);
          if (!fixture) {
            return false;
          }

          const offers = await findBestOffersForFixture(fixture._id, 4);
          if (!offers.length) {
            replyText += "\n\nלא נמצאו הצעות זמינות למשחק הקרוב בין הקבוצות.";
            return true;
          }

          const fixtureDateStr = fixture.date.toLocaleString("he-IL", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });

          const offersLines = offers.map((offer, idx) => {
            const agentLabelParts: string[] = [];
            if (offer.agentName) {
              agentLabelParts.push(offer.agentName);
            }
            if (offer.agentWhatsapp) {
              agentLabelParts.push(`יצירת קשר: ${offer.agentWhatsapp}`);
            }
            const agentLabel =
              agentLabelParts.length > 0
                ? agentLabelParts.join(" | ")
                : `ID: ${offer.agentId}`;

            return `${idx + 1}. מחיר: ${offer.price} ${
              offer.currency
            } | סוכן: ${agentLabel}`;
          });

          const homeDisplayName = home.he || home.en || home.originalName;
          const awayDisplayName = away.he || away.en || away.originalName;

          replyText +=
            "\n\n🎟️ משחק שמצאתי:\n" +
            `${homeDisplayName} 🆚 ${awayDisplayName}\n` +
            `תאריך: ${fixtureDateStr}\n` +
            (fixture.venueName
              ? `🏟️ אצטדיון: ${fixture.venueName}${
                  fixture.venueCity ? `, ${fixture.venueCity}` : ""
                }\n`
              : "") +
            "\n💰 ההצעות הכי זולות:\n" +
            offersLines.join("\n");

          return true;
        };

        try {
          // ניסיון ראשון: עם שמות מנורמלים (התאמת אימבדינג רגילה)
          let built = await tryBuildReplyForTeams(
            resolvedTeams[0],
            resolvedTeams[1]
          );

          // אם לא נמצא משחק – פולבק: חפש שוב קבוצות ללא נרמול, ואז נסה שוב למצוא משחק
          if (!built) {
            const fallbackResolved: typeof resolvedTeams = [];

            for (const teamName of teamsResult.teams) {
              try {
                const match = await findClosestTeamByText(teamName, {
                  skipNormalization: true,
                });
                if (match) {
                  fallbackResolved.push({
                    originalName: teamName,
                    he: match.name_he,
                    en: match.name_en,
                    id: match._id,
                    score: match.score,
                    logoUrl: match.logoUrl,
                    primaryColor: match.primaryColor,
                    secondaryColor: match.secondaryColor,
                  });
                }
              } catch (err: any) {
                console.error(
                  chalk.red(
                    `❌ Fallback semantic search error for "${teamName}": ${
                      err.message || "Unknown error"
                    }`
                  )
                );
              }
            }

            if (fallbackResolved.length >= 2) {
              built = await tryBuildReplyForTeams(
                fallbackResolved[0],
                fallbackResolved[1]
              );
            }
          }

          if (!built) {
            replyText +=
              "\n\nלא נמצא משחק עתידי במאגר בין הקבוצות לפי השמות שנמסרו.";
          }
        } catch (err: any) {
          console.error(
            chalk.red(
              `❌ Error while finding fixture/offers: ${
                err.message || "Unknown error"
              }`
            )
          );
          replyText += "\n\nשגיאה בעת חיפוש המשחק או ההצעות במאגר.";
        }
      }

      await sendAutoReply(body.From, replyText);
    } else {
      console.log(chalk.yellow(`⚽ No football teams found in message`));
      // אם לא נמצאו קבוצות, לא שולחים כלום
    }
  }
}

export async function handleMetaMessage(body: WebhookBody): Promise<void> {
  body.entry?.forEach((entry: any) => {
    const webhookEvent = entry.changes?.[0]?.value;
    console.log(
      chalk.green("📨 Received webhook event from Meta:"),
      JSON.stringify(webhookEvent, null, 2)
    );
  });
}

export function handleEmptyWebhook(): void {
  console.log(
    chalk.cyan("📡 Received empty webhook (might be a test/ping from Twilio)")
  );
}

export function handleUnknownFormat(body: WebhookBody): void {
  console.log(
    chalk.yellow("⚠️ Received unknown webhook format:"),
    JSON.stringify(body, null, 2)
  );
}

export function logWebhookInfo(contentType: string, bodyKeys: string[]): void {
  console.log(chalk.cyan(`🔍 Webhook received - Content-Type: ${contentType}`));
  console.log(chalk.cyan(`🔍 Body keys: ${bodyKeys.join(", ") || "(empty)"}`));
}

export async function processWebhookMessage(body: WebhookBody): Promise<void> {
  // Twilio WhatsApp webhook format
  if (body.MessageSid || body.From || body.Body) {
    await handleTwilioMessage(body);
    return;
  }

  // Meta/Facebook WhatsApp Business API format
  if (body.object === "whatsapp_business_account") {
    await handleMetaMessage(body);
    return;
  }

  // Empty body or unknown format
  if (Object.keys(body).length === 0) {
    handleEmptyWebhook();
    return;
  }

  // Unknown format
  handleUnknownFormat(body);
}
