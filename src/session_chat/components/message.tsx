'use client';
import cx from 'classnames';
import { motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import { QuizCard } from '@/components/quiz-card';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';

const PurePreviewMessage = ({
  chatId,
  message,
  allMessages,
  vote,
  isLoading,
  setMessages,
  regenerate,
  sendMessage,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: ChatMessage;
  allMessages: ChatMessage[];
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === 'file',
  );

  useDataStream();

  // Hide internal quiz answer control messages from UI
  const isHiddenQuizAnswer =
    message.role === 'user' &&
    message.parts.some(
      (part) => part.type === 'text' && part.text.startsWith('<quiz_answer>'),
    );

  // Hide internal auto intro trigger messages from UI
  const isHiddenAutoIntro =
    message.role === 'user' &&
    message.parts.some(
      (part) => part.type === 'text' && part.text.startsWith('<auto_intro>'),
    );

  if (isHiddenQuizAnswer || isHiddenAutoIntro) {
    return null;
  }

  return (
    <motion.div
      data-testid={`message-${message.role}`}
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div
        className={cn(
          'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
          {
            'w-full': mode === 'edit',
            'group-data-[role=user]/message:w-fit': mode !== 'edit',
          },
        )}
      >
        {message.role === 'assistant' && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
            <div className="translate-y-px">
              <SparklesIcon size={14} />
            </div>
          </div>
        )}

        <div
          className={cn('flex flex-col gap-4 w-full', {
            'min-h-96': message.role === 'assistant' && requiresScrollPadding,
          })}
        >
          {(() => {
            // Determine if this assistant message contains an ask_quiz tool call (any state)
            const containsAskQuiz =
              message.role === 'assistant' &&
              message.parts.some((p: any) => p?.type === 'tool-ask_quiz');
            // If a quiz tool call exists, suppress any free-form assistant text/reasoning in the same turn
            if (!containsAskQuiz) return null;
            return null;
          })()}
          
          {attachmentsFromMessage.length > 0 && (
            <div
              data-testid={`message-attachments`}
              className="flex flex-row justify-end gap-2"
            >
              {attachmentsFromMessage.map((attachment) => (
                <PreviewAttachment
                  key={attachment.url}
                  attachment={{
                    name: attachment.filename ?? 'file',
                    contentType: attachment.mediaType,
                    url: attachment.url,
                  }}
                />
              ))}
            </div>
          )}

          {(message.parts ?? []).map((part: any, index: number) => {
            const containsAskQuiz =
              message.role === 'assistant' &&
              message.parts.some((p: any) => p?.type === 'tool-ask_quiz');
            const { type } = part as any;
            const key = `message-${message.id}-part-${index}`;

            if (!containsAskQuiz && type === 'reasoning' && part.text?.trim().length > 0) {
              return (
                <MessageReasoning
                  key={key}
                  isLoading={isLoading}
                  reasoning={part.text}
                />
              );
            }

            if (!containsAskQuiz && type === 'text') {
              if (mode === 'view') {
                return (
                  <div key={key} className="flex flex-row gap-2 items-start">
                    {message.role === 'user' && !isReadonly && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            data-testid="message-edit-button"
                            variant="ghost"
                            className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                            onClick={() => {
                              setMode('edit');
                            }}
                          >
                            <PencilEditIcon />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit message</TooltipContent>
                      </Tooltip>
                    )}

                    <div
                      data-testid="message-content"
                      className={cn('flex flex-col gap-4', {
                        'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                          message.role === 'user',
                      })}
                    >
                      <Markdown>{sanitizeText(part.text)}</Markdown>
                    </div>
                  </div>
                );
              }

              if (mode === 'edit') {
                return (
                  <div key={key} className="flex flex-row gap-2 items-start">
                    <div className="size-8" />

                    <MessageEditor
                      key={message.id}
                      message={message}
                      setMode={setMode}
                      setMessages={setMessages}
                      regenerate={regenerate}
                    />
                  </div>
                );
              }
            }

            if (type === 'tool-getWeather') {
              const { toolCallId, state } = part;

              if (state === 'input-available') {
                return (
                  <div key={toolCallId} className="skeleton">
                    <Weather />
                  </div>
                );
              }

              if (state === 'output-available') {
                const { output } = part;
                return (
                  <div key={toolCallId}>
                    <Weather weatherAtLocation={output} />
                  </div>
                );
              }
            }

            if (type === 'tool-ask_quiz') {
              const { toolCallId, state } = part as any;

              if (state === 'input-available') {
                return (
                  <div key={toolCallId} className="skeleton">
                    <div className="rounded-2xl border p-4 max-w-[500px] h-40 bg-muted/40" />
                  </div>
                );
              }

              if (state === 'output-available') {
                const { output } = part as any;

                // Determine if user already answered and if graded reply exists
                const currentIndex = allMessages.findIndex((m) => m.id === message.id);
                const subsequent = currentIndex >= 0 ? allMessages.slice(currentIndex + 1) : [];
                const quizAnswerMsg = subsequent.find((m) =>
                  m.role === 'user' &&
                  m.parts.some(
                    (p: any) => p.type === 'text' && typeof p.text === 'string' && p.text.startsWith('<quiz_answer>'),
                  ),
                );
                let selectedIndexFromHistory: number | null = null;
                let textAnswerFromHistory: string | null = null;
                if (quizAnswerMsg) {
                  const qaPart = quizAnswerMsg.parts.find(
                    (p: any) => p.type === 'text' && typeof p.text === 'string' && p.text.startsWith('<quiz_answer>'),
                  ) as any;
                  try {
                    const payload = JSON.parse((qaPart.text as string).replace('<quiz_answer>', ''));
                    if (payload?.id === output?.id) {
                      if (typeof payload?.selectedIndex === 'number') {
                        selectedIndexFromHistory = payload.selectedIndex;
                      }
                      if (typeof payload?.textAnswer === 'string') {
                        textAnswerFromHistory = payload.textAnswer;
                      }
                    }
                  } catch (_) {
                    // ignore
                  }
                }
                const assistantGradingMsg = quizAnswerMsg
                  ? subsequent.find((m) => m.role === 'assistant')
                  : undefined;
                const graded = !!assistantGradingMsg;
                const gradedAt = assistantGradingMsg?.metadata?.createdAt ?? undefined;

                // Progress index from id like med1..med10
                let progressIndex: number | undefined = undefined;
                if (output?.id && typeof output.id === 'string') {
                  const match = /^med(\d+)$/.exec(output.id);
                  if (match) {
                    const n = Number(match[1]);
                    if (Number.isFinite(n) && n >= 1 && n <= 10) {
                      progressIndex = n;
                    }
                  }
                }

                return (
                  <div key={toolCallId} className="flex flex-col gap-3">
                    {(output?.theory || output?.imageUrl) && (
                      <div className="rounded-xl border bg-muted/40 p-3 text-sm leading-relaxed">
                        {output?.imageUrl ? (
                          <img
                            src={output.imageUrl}
                            alt={output?.question ? `Illustration: ${output.question}` : 'Illustration'}
                            className="w-full h-auto rounded-md mb-2 object-contain max-h-64"
                            loading="lazy"
                          />
                        ) : null}
                        {output?.theory}
                      </div>
                    )}
                    <QuizCard
                      chatId={chatId}
                      data={output}
                      isReadonly={isReadonly}
                      initialSelectedIndex={selectedIndexFromHistory}
                      initialTextAnswer={textAnswerFromHistory}
                      graded={graded}
                      gradedAt={gradedAt}
                      progressIndex={progressIndex}
                      sendMessage={sendMessage}
                    />
                  </div>
                );
              }
            }

            if (type === 'tool-createDocument') {
              const { toolCallId, state } = part;

              if (state === 'input-available') {
                const { input } = part;
                return (
                  <div key={toolCallId}>
                    <DocumentPreview isReadonly={isReadonly} args={input} />
                  </div>
                );
              }

              if (state === 'output-available') {
                const { output } = part;

                if ('error' in output) {
                  return (
                    <div
                      key={toolCallId}
                      className="text-red-500 p-2 border rounded"
                    >
                      Error: {String(output.error)}
                    </div>
                  );
                }

                return (
                  <div key={toolCallId}>
                    <DocumentPreview
                      isReadonly={isReadonly}
                      result={output}
                    />
                  </div>
                );
              }
            }

            if (type === 'tool-updateDocument') {
              const { toolCallId, state } = part;

              if (state === 'input-available') {
                const { input } = part;

                return (
                  <div key={toolCallId}>
                    <DocumentToolCall
                      type="update"
                      args={input}
                      isReadonly={isReadonly}
                    />
                  </div>
                );
              }

              if (state === 'output-available') {
                const { output } = part;

                if ('error' in output) {
                  return (
                    <div
                      key={toolCallId}
                      className="text-red-500 p-2 border rounded"
                    >
                      Error: {String(output.error)}
                    </div>
                  );
                }

                return (
                  <div key={toolCallId}>
                    <DocumentToolResult
                      type="update"
                      result={output}
                      isReadonly={isReadonly}
                    />
                  </div>
                );
              }
            }

            if (type === 'tool-requestSuggestions') {
              const { toolCallId, state } = part;

              if (state === 'input-available') {
                const { input } = part;
                return (
                  <div key={toolCallId}>
                    <DocumentToolCall
                      type="request-suggestions"
                      args={input}
                      isReadonly={isReadonly}
                    />
                  </div>
                );
              }

              if (state === 'output-available') {
                const { output } = part;

                if ('error' in output) {
                  return (
                    <div
                      key={toolCallId}
                      className="text-red-500 p-2 border rounded"
                    >
                      Error: {String(output.error)}
                    </div>
                  );
                }

                return (
                  <div key={toolCallId}>
                    <DocumentToolResult
                      type="request-suggestions"
                      result={output}
                      isReadonly={isReadonly}
                    />
                  </div>
                );
              }
            }

            return null;
          })}

          {!isReadonly && (
            <MessageActions
              key={`action-${message.id}`}
              chatId={chatId}
              message={message}
              vote={vote}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return false;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
