import dotenv from "dotenv";
dotenv.config();

import { MongoClient, ObjectId } from "mongodb";
import { logCheckpoint, logCheckpointError } from "../utils/logger";

const MONGO_URI = process.env.MONGODB_URI as string;
// Use the actual matches collection name from your DB ("footballevents" by default)
const FIXTURES_COLLECTION =
  process.env.MONGODB_FIXTURES_COLLECTION || "footballevents";
const VENUES_COLLECTION = process.env.MONGODB_VENUES_COLLECTION || "venues";

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

export interface FixtureMatch {
  _id: string;
  slug: string;
  date: Date;
  homeTeam: string;
  awayTeam: string;
  venueName?: string;
  venueCity?: string;
}

function slugifyTeamNameEn(nameEn: string): string {
  return nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Find the closest upcoming fixture between two teams using a slug pattern:
 *   {homeSlug}-vs-{awaySlug}-YYYY-MM-DD
 * We don't always know the full slug (with date), so we search any fixture
 * whose slug CONTAINS either "{homeSlug}-vs-{awaySlug}" or the opposite order.
 */
export async function findFixtureByTeamsSlug(
  homeTeamNameEn: string,
  awayTeamNameEn: string
): Promise<FixtureMatch | null> {
  logCheckpoint(
    201,
    `Finding fixture by team slugs for "${homeTeamNameEn}" vs "${awayTeamNameEn}"`
  );

  if (!homeTeamNameEn || !awayTeamNameEn) {
    logCheckpointError(
      202,
      "Home or away team English name is empty, cannot build slug"
    );
    return null;
  }

  const homeSlug = slugifyTeamNameEn(homeTeamNameEn);
  const awaySlug = slugifyTeamNameEn(awayTeamNameEn);

  const pattern1 = `${homeSlug}-vs-${awaySlug}`;
  const pattern2 = `${awaySlug}-vs-${homeSlug}`;

  const client = await getMongoClient();
  const db = client.db();
  const fixtures = db.collection(FIXTURES_COLLECTION);
  const venues = db.collection(VENUES_COLLECTION);

  const now = new Date();

  const docs = await fixtures
    .find({
      $and: [
        {
          $or: [
            { slug: { $regex: pattern1, $options: "i" } },
            { slug: { $regex: pattern2, $options: "i" } },
          ],
        },
        { date: { $gte: now } },
      ],
    })
    .sort({ date: 1 })
    .limit(1)
    .toArray();

  if (!docs.length) {
    logCheckpoint(
      203,
      `No upcoming fixtures found containing "${pattern1}" or "${pattern2}" in slug`
    );
    return null;
  }

  const doc = docs[0];

  // Try to enrich with venue info
  let venueName: string | undefined;
  let venueCity: string | undefined;

  if (doc.venue) {
    try {
      const venueDoc = await venues.findOne({
        _id: new ObjectId(String(doc.venue)),
      });
      if (venueDoc) {
        venueName =
          venueDoc.name_he || venueDoc.name_en || venueDoc.name || undefined;
        venueCity =
          venueDoc.city_he || venueDoc.city_en || venueDoc.city || undefined;
      }
    } catch (e) {
      logCheckpointError(
        205,
        `Failed to load venue for fixture ${String(doc._id)}: ${
          (e as any)?.message || "Unknown error"
        }`
      );
    }
  }

  logCheckpoint(
    204,
    `Found fixture "${doc.slug}" on date ${new Date(doc.date).toISOString()}`
  );

  return {
    _id: String(doc._id as ObjectId),
    slug: doc.slug,
    date: new Date(doc.date),
    homeTeam: String(doc.homeTeam),
    awayTeam: String(doc.awayTeam),
    venueName,
    venueCity,
  };
}
