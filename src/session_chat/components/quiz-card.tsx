'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { format } from 'date-fns';

export type QuizPayload = {
  id: string;
  question: string;
  // For multiple-choice and true-false
  choices?: string[];
  correctIndex?: number;
  // For all types
  questionType?: 'multiple-choice' | 'true-false' | 'fill-in-the-blank' | 'case-based';
  explanation?: string;
  theory?: string;
  imageUrl?: string;
};

export function QuizCard({
  chatId,
  data,
  isReadonly,
  initialSelectedIndex,
  initialTextAnswer,
  graded,
  gradedAt,
  progressIndex,
  sendMessage,
}: {
  chatId: string;
  data: QuizPayload;
  isReadonly: boolean;
  initialSelectedIndex: number | null;
  initialTextAnswer?: string | null;
  graded: boolean;
  gradedAt?: string;
  progressIndex?: number;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
}) {
  const rawType = data.questionType;
  const baseChoices = data.choices ?? [];
  const inferredType: 'multiple-choice' | 'true-false' | 'fill-in-the-blank' | 'case-based' =
    rawType === 'true-false'
      ? 'true-false'
      : rawType === 'fill-in-the-blank'
        ? 'fill-in-the-blank'
        : rawType === 'case-based'
          ? 'case-based'
          : baseChoices.length === 0
            ? 'fill-in-the-blank'
            : 'multiple-choice';
  const questionType = inferredType;
  const choices =
    questionType === 'true-false'
      ? (baseChoices.length === 2 ? baseChoices : ['True', 'False'])
      : baseChoices;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    initialSelectedIndex ?? null,
  );
  const [textAnswer, setTextAnswer] = useState<string>(initialTextAnswer ?? '');
  const [submitted, setSubmitted] = useState<boolean>(
    (initialSelectedIndex !== null && initialSelectedIndex !== undefined) || !!initialTextAnswer,
  );
  const [isDisabled, setIsDisabled] = useState<boolean>(
    initialSelectedIndex !== null || !!initialTextAnswer || isReadonly,
  );
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (initialSelectedIndex !== null) {
      setSelectedIndex(initialSelectedIndex);
      setIsDisabled(true);
    }
    if (initialTextAnswer) {
      setTextAnswer(initialTextAnswer);
      setIsDisabled(true);
      setSubmitted(true);
    }
  }, [initialSelectedIndex]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (isDisabled) return;
      let next = focusedIndex;
      const total = Math.max(choices.length, 2);
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        next = (focusedIndex + 1) % total;
        setFocusedIndex(next);
        buttonsRef.current[next]?.focus();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        next = (focusedIndex - 1 + total) % total;
        setFocusedIndex(next);
        buttonsRef.current[next]?.focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (selectedIndex === null && (questionType === 'multiple-choice' || questionType === 'true-false')) {
          handleSelect(focusedIndex);
        }
      }
    },
    [focusedIndex, isDisabled, selectedIndex, choices.length, questionType],
  );

  const handleSelect = useCallback(
    (index: number) => {
      if (isDisabled) return;
      setSelectedIndex(index);
      setIsDisabled(true);
      setSubmitted(true);

      // Local feedback is rendered immediately. Now send follow-up to LLM.
      const payload = {
        intent: 'quiz_answer',
        id: data.id,
        selectedIndex: index,
        quiz: data,
      };

      sendMessage({
        role: 'user',
        parts: [
          {
            type: 'text',
            text: `<quiz_answer>${JSON.stringify(payload)}`,
          },
        ],
      });
    },
    [data, isDisabled, sendMessage],
  );

  const handleSubmitText = useCallback(() => {
    if (isDisabled) return;
    const answer = textAnswer.trim();
    if (answer.length === 0) return;
    setIsDisabled(true);
    setSubmitted(true);

    const payload = {
      intent: 'quiz_answer',
      id: data.id,
      textAnswer: answer,
      quiz: data,
    };

    sendMessage({
      role: 'user',
      parts: [
        {
          type: 'text',
          text: `<quiz_answer>${JSON.stringify(payload)}`,
        },
      ],
    });
  }, [data, isDisabled, sendMessage, textAnswer]);

  const choiceLabels = useMemo(() => ['A', 'B', 'C', 'D'], []);
  const isCorrect =
    selectedIndex !== null &&
    typeof data.correctIndex === 'number' &&
    selectedIndex === data.correctIndex;
  const hasSelection = selectedIndex !== null || (questionType === 'fill-in-the-blank' && submitted);

  // If not provided from parent, attempt to derive from id
  const derivedProgress = useMemo(() => {
    if (progressIndex && progressIndex >= 1 && progressIndex <= 10) return progressIndex;
    const match = /^med(\d+)$/.exec(data.id);
    if (!match) return null;
    const n = Number(match[1]);
    if (!Number.isFinite(n) || n < 1 || n > 10) return null;
    return n;
  }, [data.id, progressIndex]);

  return (
    <div
      className="rounded-2xl border shadow-sm p-4 max-w-[560px] animate-in fade-in slide-in-from-bottom-2 bg-background"
      role="group"
      aria-labelledby={`quiz-${data.id}-label`}
      onKeyDown={(e) => {
        // Disable card-level hotkeys for free-text variants so typing works normally
        if (questionType === 'fill-in-the-blank' || questionType === 'case-based') {
          return;
        }
        onKeyDown(e);
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div id={`quiz-${data.id}-label`} className="text-base font-medium">
          {data.question}
        </div>
        {derivedProgress && (
          <div className="w-28">
            <div className="text-[10px] text-muted-foreground mb-1 text-right">{derivedProgress}/10</div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(derivedProgress / 10) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {questionType === 'fill-in-the-blank' || questionType === 'case-based' ? 'Type your answer' : 'Choose one'}
      </div>

      {questionType === 'fill-in-the-blank' || questionType === 'case-based' ? (
        <div className="mt-4 flex flex-col gap-2" aria-live="polite">
          <div className="flex gap-2">
            <Input
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Type your answer"
              disabled={isDisabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmitText();
                }
              }}
            />
            <Button onClick={handleSubmitText} disabled={isDisabled || textAnswer.trim().length === 0}>
              Submit
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2" aria-live="polite">
          {choices.map((choice, idx) => {
            const selected = selectedIndex === idx;
            const correctHighlight = graded && typeof data.correctIndex === 'number' && idx === data.correctIndex;
            const wrongHighlight = graded && selected && typeof data.correctIndex === 'number' && idx !== data.correctIndex;
            return (
              <Button
                key={idx}
                ref={(el) => (buttonsRef.current[idx] = el)}
                className={cn(
                  'justify-start h-auto py-3 px-3 text-left whitespace-normal',
                  'focus-visible:ring-2 focus-visible:ring-offset-2',
                  {
                    'border-green-500 ring-green-500': correctHighlight,
                    'border-red-400 ring-red-400': wrongHighlight,
                  },
                )}
                variant={selected ? 'default' : 'outline'}
                aria-pressed={selected}
                aria-describedby={`quiz-${data.id}-label`}
                disabled={isDisabled}
                onClick={() => handleSelect(idx)}
              >
                <div className="flex gap-2 items-start">
                  <div className="shrink-0 rounded-md border px-2 py-1 text-xs font-semibold">
                    {choiceLabels[idx]}
                  </div>
                  <div className="text-sm">{choice}</div>
                </div>
              </Button>
            );
          })}
        </div>
      )}

      {hasSelection && questionType !== 'fill-in-the-blank' && questionType !== 'case-based' && selectedIndex !== null && (
        <div className="mt-3 text-sm text-muted-foreground">You selected {choiceLabels[selectedIndex!]}.</div>
      )}
      {hasSelection && (questionType === 'fill-in-the-blank' || questionType === 'case-based') && (
        <div className="mt-3 text-sm text-muted-foreground">You answered “{textAnswer}”.</div>
      )}

      {graded && (
        <div className="mt-2 text-[10px] text-muted-foreground">
          Graded by AI{gradedAt ? ` · ${format(new Date(gradedAt), 'p')}` : ''}
        </div>
      )}
    </div>
  );
}


