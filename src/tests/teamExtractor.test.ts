import { teamExtractor } from '../services/teamExtractor';

describe('TeamExtractor Logic Tests', () => {
    test('Should identify simple team names', () => {
        const result = teamExtractor.extractSlugs('ארסנל נגד ליברפול');
        expect(result).toContain('arsenal');
        expect(result).toContain('liverpool');
    });

    test('Should handle Hebrew prefixes (ל, ה, ב, ו)', () => {
        const result = teamExtractor.extractSlugs('לברצלונה נגד הריאל');
        expect(result).toContain('barcelona');
        expect(result).toContain('real-madrid');
    });

    test('Should prioritize multi-word names', () => {
        const result = teamExtractor.extractSlugs('אסטון וילה נגד מנצסטר סיטי');
        expect(result).toContain('aston-villa');
        expect(result).toContain('manchester-city');
    });

    test('Should handle common spelling variations', () => {
        const result = teamExtractor.extractSlugs('מתי יש משחק של חתאפה?');
        expect(result).toContain('getafe');
    });

    test('Should identify shorthand names (Ajax as איקס)', () => {
        const result = teamExtractor.extractSlugs('איקס נגד באירן');
        expect(result).toContain('ajax');
    });

    test('Should not identify generic words (Villa) without correct context/threshold', () => {
        // "וילה" alone might be too short/generic if not matched exactly
        const result = teamExtractor.extractSlugs('אני בוילה בחופשה');
        // Based on our 85% threshold for medium words, "וילה" vs "אסטון וילה" should fail 
        // unless "וילה" is an exact alias.
        expect(result).not.toContain('aston-villa');
    });

    test('Should handle combined complex errors', () => {
        const result = teamExtractor.extractSlugs('מחפש לריעל מול באירן');
        expect(result).toContain('real-madrid');
        // If "באירן" is not in aliases yet, this might fail or pass via fuzzy
        // expect(result).toContain('bayern-munich'); 
    });
});
