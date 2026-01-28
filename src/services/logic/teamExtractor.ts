import FuzzySet from 'fuzzyset';
import teamsData from '../../data/teams.json';
import chalk from 'chalk';
import { config } from '../../config';
import { ApiResponse, Offer } from '../../types';

interface Team {
    id: string;
    name_he: string;
    slug: string;
    aliases: string[];
}

export class TeamExtractor {
    private aliasMap: Map<string, string> = new Map();
    private fuzzySet: any;
    private readonly SIMILARITY_THRESHOLD = 0.8;
    private readonly HEBREW_PREFIXES = ['ל', 'ב', 'ה', 'ו'];

    constructor() {
        const start = performance.now();
        this.initialize();
        const end = performance.now();
        console.log(chalk.bgBlue.white(` [Init] `) + chalk.blue(` TeamExtractor initialized in ${(end - start).toFixed(2)} ms`));
    }

    private initialize() {
        const allAliases: string[] = [];

        (teamsData as Team[]).forEach(team => {
            const aliases = new Set([...team.aliases, team.name_he, team.slug]);

            aliases.forEach(alias => {
                const normalizedAlias = this.normalize(alias);
                this.aliasMap.set(normalizedAlias, team.slug);
                allAliases.push(normalizedAlias);
            });
        });

        this.fuzzySet = FuzzySet(allAliases);
    }

    /**
     * Cleans text from noise
     */
    private normalize(text: string): string {
        return text
            .toLowerCase()
            .replace(/['"׳״]/g, '')
            .replace(/[?!.,]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Calculates a dynamic threshold based on word length.
     * Shorter words need higher precision.
     */
    private getThresholdForWord(word: string): number {
        if (word.length <= 3) return 0.9;  // High threshold for short words (e.g., "מץ")
        if (word.length <= 5) return 0.85; // Medium-high for medium words
        return 0.75;                      // More lenient for long words (e.g., "מנשנגלדבאך")
    }

    /**
     * Attempts to find a slug for a single word/phrase
     */
    private findSlugForWord(word: string): string | null {
        const start = performance.now();
        const normalizedWord = this.normalize(word);
        if (!normalizedWord || normalizedWord.length < 2) return null;

        const threshold = this.getThresholdForWord(normalizedWord);
        let result: string | null = null;
        let method = '';

        // 1. Exact Match
        if (this.aliasMap.has(normalizedWord)) {
            result = this.aliasMap.get(normalizedWord)!;
            method = 'Exact';
        }

        // 2. Prefix Strip (Hebrew prefixes)
        if (!result && normalizedWord.length > 3) {
            for (const prefix of this.HEBREW_PREFIXES) {
                if (normalizedWord.startsWith(prefix)) {
                    const stripped = normalizedWord.substring(1);
                    if (this.aliasMap.has(stripped)) {
                        result = this.aliasMap.get(stripped)!;
                        method = 'Prefix+Exact';
                        break;
                    }
                }
            }
        }

        // 3. Fuzzy Match
        if (!result) {
            const fuzzyResults = this.fuzzySet.get(normalizedWord);
            if (fuzzyResults && fuzzyResults.length > 0) {
                const [score, matchedAlias] = fuzzyResults[0];
                if (score >= threshold) {
                    result = this.aliasMap.get(matchedAlias)!;
                    method = `Fuzzy(${score.toFixed(2)} / T: ${threshold})`;
                }
            }
        }

        // 4. Prefix Strip + Fuzzy Match
        if (!result && normalizedWord.length > 3) {
            for (const prefix of this.HEBREW_PREFIXES) {
                if (normalizedWord.startsWith(prefix)) {
                    const stripped = normalizedWord.substring(1);
                    const fuzzyStrippedResults = this.fuzzySet.get(stripped);
                    if (fuzzyStrippedResults && fuzzyStrippedResults.length > 0) {
                        const [score, matchedAlias] = fuzzyStrippedResults[0];
                        if (score >= threshold) {
                            result = this.aliasMap.get(matchedAlias)!;
                            method = `Prefix + Fuzzy(${score.toFixed(2)} / T: ${threshold})`;
                            break;
                        }
                    }
                }
            }
        }

        const end = performance.now();
        if (result) {
            console.log(
                chalk.bgGreen.black(` [Match]`) +
                chalk.green(` "${word}" -> ${result} `) +
                chalk.gray(`(${method} in ${(end - start).toFixed(2)}ms)`)
            );
        }

        return result;
    }

    /**
     * Extracts unique team slugs from a raw text
     */
    public extractSlugs(text: string): string[] {
        if (!text) return [];

        const globalStart = performance.now();
        console.log(chalk.bgMagenta.white(` [Extracting] `) + chalk.magenta(` Analyzing text: "${text}"`));

        const words = text.split(/\s+/);
        const results: { slug: string, startIdx: number, endIdx: number }[] = [];

        // 1. Check two-word combinations first (Bigram Priority)
        for (let i = 0; i < words.length - 1; i++) {
            const combined = `${words[i]} ${words[i + 1]} `;
            const slug = this.findSlugForWord(combined);
            if (slug) {
                results.push({ slug, startIdx: i, endIdx: i + 1 });
            }
        }

        // 2. Check individual words that aren't already part of a multi-word match
        for (let i = 0; i < words.length; i++) {
            const isPartOfExistingMatch = results.some(r => i >= r.startIdx && i <= r.endIdx);
            if (!isPartOfExistingMatch) {
                const slug = this.findSlugForWord(words[i]);
                if (slug) {
                    results.push({ slug, startIdx: i, endIdx: i });
                }
            }
        }

        const globalEnd = performance.now();

        // Sort results by their position in the text to maintain "Home vs Away" order
        results.sort((a, b) => a.startIdx - b.startIdx);

        const finalSlugs = Array.from(new Set(results.map(r => r.slug)));

        console.log(
            chalk.bgYellow.black(` [Done] `) +
            chalk.yellow(` Found ${finalSlugs.length} teams in ${(globalEnd - globalStart).toFixed(2)} ms`)
        );

        return finalSlugs;
    }

    /**
     * Builds a match slug from identified team slugs (e.g., "team-a-vs-team-b")
     * Note: We don't include the date as requested.
     */
    public buildMatchSlug(slugs: string[]): string | null {
        if (slugs.length < 2) return null;
        // Ensure no spaces around -vs- for API compatibility
        const home = slugs[0].trim().toLowerCase();
        const away = slugs[1].trim().toLowerCase();
        return `${home}-vs-${away}`;
    }

    public getAvailableTeams(): { slug: string, name_he: string }[] {
        return (teamsData as Team[]).map(team => ({
            slug: team.slug,
            name_he: team.name_he
        }));
    }

    /**
     * Finds the primary Hebrew name for a given slug.
     * Returns the slug itself if no match is found.
     */
    public getTeamNameBySlug(slug: string): string {
        const team = (teamsData as Team[]).find((t: Team) => t.slug === slug);
        return team ? team.name_he : slug;
    }
}

export const teamExtractor = new TeamExtractor();
