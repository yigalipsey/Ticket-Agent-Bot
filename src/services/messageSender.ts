import twilio from "twilio";
import chalk from "chalk";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Debug: check if env variables are loaded
if (!process.env.TWILIO_AUTH_TOKEN) {
  console.log(
    chalk.yellow(
      "⚠️ Warning: TWILIO_AUTH_TOKEN not found in environment variables"
    )
  );
  console.log(
    chalk.yellow("   Make sure you have a .env file with TWILIO_AUTH_TOKEN set")
  );
} else {
  console.log(chalk.green("✅ TWILIO_AUTH_TOKEN loaded from environment"));
}

const client = twilio(accountSid, authToken);

export async function sendTwilioMessage() {
  try {
    const message = await client.messages.create({
      from: "whatsapp:+15558755941",
      contentSid: "HXb5b62575e6e4ff6129ad7c8efe1f983e",
      contentVariables: '{"1":"12/1","2":"3pm"}',
      to: "whatsapp:+972533350910",
    });

    // הדפסה בירוק בקונסול
    console.log(chalk.green(`✅ Message sent successfully!`));
    console.log(chalk.green(`📱 Message SID: ${message.sid}`));
    console.log(chalk.green(`📊 Message Status: ${message.status}`));
    console.log(
      chalk.green(`📋 Full message details:`),
      JSON.stringify(message, null, 2)
    );

    return message;
  } catch (error: any) {
    console.error(chalk.red(`❌ Error sending message:`));
    console.error(chalk.red(`   Status: ${error.status || "Unknown"}`));
    console.error(chalk.red(`   Code: ${error.code || "Unknown"}`));
    console.error(chalk.red(`   Message: ${error.message || "Unknown error"}`));
    if (error.moreInfo) {
      console.error(chalk.red(`   More Info: ${error.moreInfo}`));
    }
    // לא זורקים שגיאה כדי שהשרת ימשיך לרוץ
    return null;
  }
}

export async function sendAutoReply(to: string, messageText: string) {
  try {
    // Debug: log credentials being used (without exposing the actual token)
    console.log(chalk.cyan(`🔍 Attempting to send message:`));
    console.log(chalk.cyan(`   Account SID: ${accountSid}`));
    console.log(
      chalk.cyan(
        `   Auth Token: ${
          authToken ? authToken.substring(0, 10) + "..." : "NOT SET"
        }`
      )
    );
    console.log(chalk.cyan(`   From: whatsapp:+15558755941`));
    console.log(chalk.cyan(`   To: ${to}`));
    console.log(chalk.cyan(`   Message: ${messageText}`));

    const message = await client.messages.create({
      from: "whatsapp:+15558755941",
      body: messageText,
      to: to,
    });

    console.log(chalk.green(`✅ Auto-reply sent successfully!`));
    console.log(chalk.green(`📱 To: ${to}`));
    console.log(chalk.green(`💬 Message: ${messageText}`));
    console.log(chalk.green(`📱 Message SID: ${message.sid}`));

    return message;
  } catch (error: any) {
    console.error(chalk.red(`❌ Error sending auto-reply:`));
    console.error(chalk.red(`═══════════════════════════════════════`));
    console.error(chalk.red(`   Status: ${error.status || "Unknown"}`));
    console.error(chalk.red(`   Code: ${error.code || "Unknown"}`));
    console.error(chalk.red(`   Message: ${error.message || "Unknown error"}`));
    if (error.moreInfo) {
      console.error(chalk.red(`   More Info: ${error.moreInfo}`));
    }
    console.error(chalk.red(`   Full error object:`));
    console.error(
      chalk.red(JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    );
    console.error(chalk.red(`═══════════════════════════════════════`));
    return null;
  }
}
