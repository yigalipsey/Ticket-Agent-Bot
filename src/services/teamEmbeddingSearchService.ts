import dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";
import OpenAI from "openai";
import { logCheckpoint, logCheckpointError } from "../utils/logger";

const MONGO_URI = process.env.MONGODB_URI as string;
const TEAMS_COLLECTION = process.env.MONGODB_TEAMS_COLLECTION || "teams";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let cachedClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (!MONGO_URI) {
    throw new Error("MONGODB_URI is not defined in environment");
  }

  if (cachedClient && (cachedClient as any).topology?.isConnected()) {
    return cachedClient;
  }

  cachedClient = new MongoClient(MONGO_URI);
  await cachedClient.connect();
  return cachedClient;
}

/**
 * Normalize a potentially partial / nickname team name
 * into a full official name before creating embeddings.
 * Falls back to the original text on any error.
 */
async function normalizeTeamName(text: string): Promise<string> {
  const raw = text.trim();
  if (!raw) return raw;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You normalize football (soccer) team names. " +
            "Input names may be in Hebrew or other languages, and may be nicknames, partial names or slightly misspelled. " +
            "Return the full, official team name in the SAME language as the input. " +
            "If the name is already full and correct, return it as-is. " +
            "Return ONLY the normalized team name, without any extra text.",
        },
        {
          role: "user",
          content:
            `Normalize the following football team name (it may be a nickname, partial or slightly misspelled) ` +
            `to its full, official form in the same language. Return only the normalized name: "${raw}"`,
        },
      ],
      temperature: 0,
      max_tokens: 20,
    });

    const normalized = completion.choices[0]?.message?.content?.trim() || raw;

    logCheckpoint(
      100,
      `Team name normalization: raw="${raw}" -> normalized="${normalized}"`
    );

    return normalized;
  } catch (err: any) {
    logCheckpointError(
      101,
      `Failed to normalize team name "${raw}": ${
        err?.message || "Unknown error"
      }`
    );
    return raw;
  }
}

export interface TeamSemanticMatch {
  _id: string;
  name?: string;
  name_he?: string;
  name_en?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  score: number;
}

/**
 * Core semantic search: given text, create embedding and find closest team
 * in MongoDB by comparing to embedding_he vectors (cosine similarity).
 */
async function semanticSearchOnText(
  searchText: string,
  checkpointPrefix: number
): Promise<TeamSemanticMatch | null> {
  if (!process.env.OPENAI_API_KEY) {
    logCheckpointError(
      checkpointPrefix + 1,
      "OPENAI_API_KEY is missing – cannot generate embeddings"
    );
    throw new Error("OPENAI_API_KEY is missing");
  }

  logCheckpoint(
    checkpointPrefix + 2,
    `Creating embedding for input text with OpenAI: "${searchText}"`
  );

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: searchText,
  });

  const embedding = embeddingResponse.data[0]?.embedding;

  if (!embedding || embedding.length !== 1536) {
    logCheckpointError(
      checkpointPrefix + 3,
      `Invalid embedding generated (length: ${embedding?.length || 0})`
    );
    throw new Error("Failed to generate a valid embedding");
  }

  logCheckpoint(
    checkpointPrefix + 4,
    "Connecting to MongoDB and loading teams with embedding_he"
  );

  const client = await getMongoClient();
  const db = client.db();
  const teams = db.collection(TEAMS_COLLECTION);

  const docs = (await teams
    .find({
      embedding_he: { $exists: true },
      name_he: { $type: "string" },
    })
    .toArray()) as any[];

  if (!docs.length) {
    logCheckpoint(
      checkpointPrefix + 5,
      "No documents with embedding_he found in teams collection"
    );
    return null;
  }

  logCheckpoint(
    checkpointPrefix + 6,
    `Computing cosine similarity against ${docs.length} team embeddings`
  );

  let bestDoc: any = null;
  let bestScore = -Infinity;

  const cosineSimilarity = (a: number[], b: number[]): number => {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const va = a[i];
      const vb = b[i];
      dot += va * vb;
      normA += va * va;
      normB += vb * vb;
    }
    if (normA === 0 || normB === 0) return -1;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  for (const doc of docs) {
    const docEmbedding = doc.embedding_he as number[] | undefined;
    if (!Array.isArray(docEmbedding) || !docEmbedding.length) continue;

    const score = cosineSimilarity(embedding, docEmbedding);
    if (score > bestScore) {
      bestScore = score;
      bestDoc = doc;
    }
  }

  if (!bestDoc || bestScore === -Infinity) {
    logCheckpoint(
      checkpointPrefix + 7,
      "No valid embedding comparisons could be made"
    );
    return null;
  }

  logCheckpoint(
    checkpointPrefix + 8,
    `Best match: "${
      bestDoc.name_he || bestDoc.name_en || bestDoc.name
    }" with cosine score ${bestScore}`
  );

  return {
    _id: String(bestDoc._id),
    name: bestDoc.name,
    name_he: bestDoc.name_he,
    name_en: bestDoc.name_en,
    logoUrl: bestDoc.logoUrl,
    primaryColor: bestDoc.primaryColor,
    secondaryColor: bestDoc.secondaryColor,
    score: bestScore,
  };
}

/**
 * Given a free-text description (ideally in Hebrew), generate an embedding
 * and find the closest team in MongoDB. By default, we first normalize the
 * name via OpenAI (to handle nicknames like "יונייטד"), but we support
 * disabling normalization for fallback flows.
 */
export async function findClosestTeamByText(
  text: string,
  options?: { skipNormalization?: boolean }
): Promise<TeamSemanticMatch | null> {
  const rawText = text?.trim() || "";
  if (!rawText) {
    logCheckpointError(150, "Input text is empty");
    return null;
  }

  // If requested, skip normalization and run semantic search directly on raw text.
  if (options?.skipNormalization) {
    logCheckpoint(
      151,
      `Semantic search WITHOUT normalization for text: "${rawText}"`
    );
    return semanticSearchOnText(rawText, 160);
  }

  // Default path: normalize first, then search.
  const normalizedText = await normalizeTeamName(rawText);

  logCheckpoint(
    152,
    `Semantic search WITH normalization: raw="${rawText}", normalized="${normalizedText}"`
  );

  return semanticSearchOnText(normalizedText, 170);
}
