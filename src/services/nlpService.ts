import OpenAI from "openai";
import chalk from "chalk";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface FootballTeamResult {
  teams: string[];
  found: boolean;
}

export async function findFootballTeams(
  message: string
): Promise<FootballTeamResult> {
  try {
    console.log(chalk.cyan(`🤖 Sending message to OpenAI GPT-3.5:`));
    console.log(chalk.cyan(`   Message: ${message}`));

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that extracts football (soccer) team names from messages. " +
            "Return ONLY a comma-separated list of the team names you find (in the same language as in the message). " +
            "If you do not find any teams, return an empty list (no text, just nothing). " +
            "Do not add any explanations or extra words.",
        },
        {
          role: "user",
          content: `Extract all football team names that appear in the following message: "${message}". ` +
            "Return only the team names, separated by commas.",
        },
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || "";

    console.log(chalk.green(`✅ OpenAI Response: ${responseText}`));

    // פרסור התשובה - אם יש קבוצות, נחלץ אותן
    let teams: string[] = [];
    if (responseText) {
      teams = responseText
        .split(",")
        .map((team) => team.trim())
        .filter((team) => team.length > 0);
    }

    const result: FootballTeamResult = {
      teams,
      found: teams.length > 0,
    };

    console.log(
      chalk.green(
        `⚽ Found ${teams.length} football team(s): ${
          teams.join(", ") || "None"
        }`
      )
    );

    return result;
  } catch (error: any) {
    console.error(chalk.red(`❌ Error calling OpenAI:`));
    console.error(chalk.red(`   Message: ${error.message || "Unknown error"}`));
    if (error.status) {
      console.error(chalk.red(`   Status: ${error.status}`));
    }

    return {
      teams: [],
      found: false,
    };
  }
}
