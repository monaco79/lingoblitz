import { Language } from '../types';
import { LANGUAGE_TO_LOCALE } from '../constants';

export const cleanWord = (word: string): string => {
    return word.trim().replace(/^['".,!?;:]+|['".,!?;:]+$/g, '').toLowerCase();
};

export interface TextSegment {
    text: string;
    isWord: boolean;
}

export const segmentText = (text: string, language: Language): TextSegment[] => {
    const locale = LANGUAGE_TO_LOCALE[language] || 'en-US';

    // Check for Intl.Segmenter support
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
        const segmenter = new (Intl as any).Segmenter(locale, { granularity: 'word' });
        const segments = [...segmenter.segment(text)];

        return segments.map((seg: any) => ({
            text: seg.segment,
            isWord: seg.isWordLike
        }));
    }

    // Fallback for environments without Intl.Segmenter (though most modern browsers support it)
    // or for languages where simple splitting is sufficient if Segmenter fails.
    // This fallback mimics the previous regex-based splitting.
    const parts = text.split(/(\s+|[.,!?;:"()])/).filter(Boolean);
    return parts.map(part => {
        const cleaned = cleanWord(part);
        const isWord = /\w/.test(cleaned) || (language === Language.Chinese || language === Language.Japanese);
        // Note: The regex fallback is poor for CJK, but it's a fallback.

        return {
            text: part,
            isWord: isWord && part.trim().length > 0
        };
    });
};
