import { z } from 'zod';
import { tool } from 'ai';
import quizData from '@/lib/ai/medicine-quiz.json';

export const ask_quiz = tool({
  description:
    'Show a quiz to the user based on the current lesson context. Supports multiple-choice, true-false, and fill-in-the-blank.',
  inputSchema: z.object({
    id: z.string().describe('Stable unique id for this quiz instance'),
    // When id matches a known quiz entry, the tool will load content from JSON.
    question: z.string().optional().describe('The question to ask'),
    choices: z
      .array(z.string())
      .min(2)
      .max(4)
      .optional()
      .describe('Two to four options, in display order.'),
    correctIndex: z
      .number()
      .int()
      .min(0)
      .max(3)
      .optional()
      .describe('Index into `choices` that is correct. Not shown to the user.'),
    explanation: z
      .string()
      .optional()
      .describe('A brief explanation used by the assistant after grading.'),
    theory: z
      .string()
      .optional()
      .describe('Optional short theory blurb to show before the question.'),
    imageUrl: z
      .string()
      .optional()
      .describe('Optional image URL to illustrate the theory.'),
    questionType: z
      .enum(['multiple-choice', 'true-false', 'fill-in-the-blank', 'case-based'])
      .optional()
      .describe('What type of question to render'),
  }),
  execute: async (input) => {
    // If id matches JSON, merge fields from JSON; caller may override with provided fields.
    const fromJson = Array.isArray(quizData)
      ? (quizData as any[]).find((q) => q?.id === input.id)
      : undefined;
    // If true-false is requested and no explicit choices provided, default to True/False.
    const defaultChoices = (input as any)?.questionType === 'true-false' || (fromJson as any)?.questionType === 'true-false'
      ? ['True', 'False']
      : undefined;

    // When an id is known in JSON, prefer canonical JSON values to avoid hallucinations.
    const merged = fromJson
      ? {
          id: input.id,
          question: fromJson?.question,
          choices: (fromJson as any)?.choices ?? defaultChoices,
          correctIndex: (fromJson as any)?.correctIndex,
          explanation: fromJson?.explanation ?? input.explanation,
          theory: fromJson?.theory ?? input.theory,
          imageUrl: (fromJson as any)?.imageUrl ?? (input as any).imageUrl,
          questionType:
            (fromJson as any)?.questionType ?? (input as any)?.questionType ?? 'multiple-choice',
        }
      : {
          id: input.id,
          question: input.question ?? 'Question',
          choices: (input as any).choices ?? defaultChoices,
          correctIndex: (input as any).correctIndex,
          explanation: input.explanation,
          theory: input.theory,
          imageUrl: (input as any).imageUrl,
          questionType:
            (input as any)?.questionType ?? 'multiple-choice',
        } as any;

    // Return merged content so UI can render theory (if provided) and quiz card.
    return merged;
  },
});


