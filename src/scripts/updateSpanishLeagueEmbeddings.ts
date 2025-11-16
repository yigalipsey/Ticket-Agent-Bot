import { MongoClient, ObjectId } from "mongodb";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  if (!MONGO_URI || !process.env.OPENAI_API_KEY) {
    console.error("❌ Missing MONGODB_URI or OPENAI_API_KEY");
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(); // ← אם אין שם מוגדר, נשתמש ב־default
  const teams = db.collection("teams");

  // Spanish league
  const spanishLeagueId = new ObjectId("68da875303bee90385d564b9");
  // Additional league requested (same style, Hebrew embeddings on team names)
  const extraLeagueId = new ObjectId("68d6809aa0fb97844d2084b9");

  // Match teams where leagueIds array contains any of the given leagueIds
  const cursor = teams.find({
    leagueIds: { $in: [spanishLeagueId, extraLeagueId] },
    embedding_he: { $exists: false },
    name_he: { $type: "string" },
  });

  const docs = await cursor.toArray();
  console.log(`🔍 Found ${docs.length} teams without embedding_he to update`);

  for (const [index, doc] of docs.entries()) {
    const name = doc.name_he;
    console.log(
      `🧠 (${index + 1}/${docs.length}) Generating embedding for "${name}"`
    );

    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: name,
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding || embedding.length !== 1536) {
        console.warn(`⚠️ Invalid embedding for _id=${doc._id}`);
        continue;
      }

      await teams.updateOne(
        { _id: doc._id },
        {
          $set: {
            embedding_he: embedding,
            embedding_he_createdAt: new Date(),
          },
        }
      );

      console.log(`✅ Saved embedding for "${name}" (_id=${doc._id})`);
    } catch (err: any) {
      console.error(`❌ Error for "${name}" (_id=${doc._id}): ${err.message}`);
    }
  }

  await client.close();
  console.log("🏁 Done. MongoDB connection closed.");
}

main();
