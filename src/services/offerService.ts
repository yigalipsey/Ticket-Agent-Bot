import dotenv from "dotenv";
dotenv.config();

import { MongoClient, ObjectId } from "mongodb";
import { logCheckpoint, logCheckpointError } from "../utils/logger";

const MONGO_URI = process.env.MONGODB_URI as string;
const OFFERS_COLLECTION = process.env.MONGODB_OFFERS_COLLECTION || "offers";
const AGENTS_COLLECTION = process.env.MONGODB_AGENTS_COLLECTION || "agents";

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

export interface OfferResult {
  _id: string;
  price: number;
  currency: string;
  agentId: string;
  agentName?: string;
  agentWhatsapp?: string;
  ticketType?: string;
}

/**
 * Find the cheapest available offers for a given fixture.
 */
export async function findBestOffersForFixture(
  fixtureId: string,
  limit = 4
): Promise<OfferResult[]> {
  logCheckpoint(
    301,
    `Finding best offers for fixtureId=${fixtureId}, limit=${limit}`
  );

  if (!fixtureId) {
    logCheckpointError(302, "fixtureId is empty in findBestOffersForFixture");
    return [];
  }

  const client = await getMongoClient();
  const db = client.db();
  const offers = db.collection(OFFERS_COLLECTION);
  const agents = db.collection(AGENTS_COLLECTION);

  const docs = await offers
    .find({
      fixtureId: new ObjectId(fixtureId),
      isAvailable: true,
    })
    .sort({ price: 1 })
    .limit(limit)
    .toArray();

  logCheckpoint(
    303,
    `Found ${docs.length} available offers for fixtureId=${fixtureId}`
  );

  if (!docs.length) {
    return [];
  }

  // Load agents in batch so we can return name + WhatsApp instead of raw agentId.
  const agentObjectIds = docs
    .map((doc) => doc.agentId)
    .filter((id) => !!id)
    .map((id) => new ObjectId(id));

  const agentDocs = await agents
    .find({
      _id: { $in: agentObjectIds },
    })
    .toArray();

  const agentMap = new Map<
    string,
    { name?: string; whatsapp?: string }
  >();

  for (const a of agentDocs) {
    agentMap.set(String(a._id), {
      name: a.name,
      whatsapp: a.whatsapp,
    });
  }

  return docs.map((doc) => {
    const agentIdStr = String(doc.agentId);
    const agent = agentMap.get(agentIdStr);

    return {
      _id: String(doc._id as ObjectId),
      price: doc.price,
      currency: doc.currency,
      agentId: agentIdStr,
      agentName: agent?.name,
      agentWhatsapp: agent?.whatsapp,
      ticketType: doc.ticketType,
    };
  });
}
