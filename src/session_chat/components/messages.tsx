import { PreviewMessage, ThinkingMessage } from './message';
import { Greeting } from './greeting';
import { memo, useEffect } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
import { useTTS } from '@/hooks/use-tts';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers<ChatMessage>['status'];
  votes: Array<Vote> | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  sendMessage,
  isReadonly,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    chatId,
    status,
  });

  useDataStream();

  // Text-to-speech of latest assistant message
  const { isSupported, speak, cancel } = useTTS();
  useEffect(() => {
    if (!isSupported) return;
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== 'assistant') return;
    // Extract readable text from assistant parts
    const text = last.parts
      .map((p: any) => (p?.type === 'text' ? String(p.text) : ''))
      .join('\n')
      .trim();
    if (text.length > 0) speak(text, { rate: 1.0 });
    return () => cancel();
  }, [messages, isSupported, speak, cancel]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative"
    >
      {/* Global quiz progress bar (medicine set med1..med10) */}
      {(() => {
        let progressIndex: number | null = null;
        for (const msg of messages) {
          for (const part of msg.parts as any[]) {
            if (part?.type === 'tool-ask_quiz' && part?.state === 'output-available') {
              const id: string | undefined = part?.output?.id;
              if (id && /^med(\d+)$/.test(id)) {
                const n = Number(/^med(\d+)$/.exec(id)![1]);
                if (Number.isFinite(n) && n >= 1 && n <= 10) {
                  progressIndex = n; // keep latest encountered
                }
              }
            }
          }
        }
        if (!progressIndex) return null;
        const pct = (progressIndex / 10) * 100;
        return (
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur">
            <div className="h-1 w-full bg-muted">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })()}

      {messages.length === 0 && <Greeting />}

      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          allMessages={messages}
          isLoading={status === 'streaming' && messages.length - 1 === index}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          regenerate={regenerate}
          sendMessage={sendMessage}
          isReadonly={isReadonly}
          requiresScrollPadding={
            hasSentMessage && index === messages.length - 1
          }
        />
      ))}

      {status === 'submitted' &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

      <motion.div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return false;
});
