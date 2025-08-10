import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { ask_quiz } from '@/lib/ai/tools/ask-quiz';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { ChatModel } from '@/lib/ai/models';
import type { VisibilityType } from '@/components/visibility-selector';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel['id'];
      selectedVisibilityType: VisibilityType;
    } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });


    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    // Detect control tokens in the last user message (auto intro)
    const lastUserTextPart = (message.role === 'user'
      ? (message.parts.find(
          (p: any) => p?.type === 'text' && typeof p.text === 'string',
        ) as { type: 'text'; text: string } | undefined)
      : undefined);
    const isAutoIntro = !!(lastUserTextPart && lastUserTextPart.text.startsWith('<auto_intro>'));

    // Only persist real user messages (skip hidden auto-intro trigger)
    if (!isAutoIntro) {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: 'user',
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    // Detect quiz_answer intent in the last user message and prepare grading preamble
    const lastUserMessage = uiMessages.at(-1);
    let quizPreamble = '';
    if (lastUserMessage && lastUserMessage.role === 'user') {
      const textParts = lastUserMessage.parts.filter(
        (p: any) => p?.type === 'text' && typeof p.text === 'string',
      ) as Array<{ type: 'text'; text: string }>;
      const quizPart = textParts.find((p) => p.text.startsWith('<quiz_answer>'));
      if (quizPart) {
        try {
          const json = quizPart.text.replace('<quiz_answer>', '');
          const payload = JSON.parse(json) as any;
          const questionType: string = payload?.quiz?.questionType ?? 'multiple-choice';
          if (questionType === 'fill-in-the-blank' || questionType === 'case-based') {
            const textAnswer: string = (payload?.textAnswer ?? '').toString();
            const explanation = payload?.quiz?.explanation ?? 'N/A';
            quizPreamble = `\n\nQuiz grading context\nThe user provided the following free-text answer for quiz id ${payload?.id}: "${textAnswer}". Evaluate if the answer correctly fills the blank in the question and is semantically correct. If correct, reply with "Correct!" followed by a concise, encouraging one-paragraph explanation; otherwise reply with "Not quite" and a concise explanation, then provide the correct answer. Keep it friendly and continue the lesson afterwards.\nIf provided, you may use this explanation as a basis: ${explanation}`;
          } else {
            const selectedIndex: number = Number(payload?.selectedIndex);
            const correctIndex: number | undefined = payload?.quiz?.correctIndex;
            const explanation = payload?.quiz?.explanation ?? 'N/A';
            quizPreamble = `\n\nQuiz grading context\nThe user selected option index ${selectedIndex} for quiz id ${payload?.id}. The correct index is ${correctIndex}. If the selection matches the correct index, reply with "Correct!" followed by a concise, encouraging one-paragraph explanation; otherwise reply with "Not quite" and the concise explanation. Keep it friendly and continue the lesson afterwards.\nIf provided, you may use this explanation as a basis: ${explanation}`;
          }
        } catch (_) {
          // ignore malformed quiz payloads
        }
      }
    }

    const effectiveUIMessages: ChatMessage[] = isAutoIntro
      ? convertToUIMessages(messagesFromDb)
      : uiMessages;

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        // Seed a minimal synthetic message for the model when starting an auto intro with no prior messages.
        const modelInputMessages = convertToModelMessages(
          isAutoIntro && effectiveUIMessages.length === 0
            ? [
                {
                  id: generateUUID(),
                  role: 'user' as const,
                  parts: [
                    {
                      type: 'text' as const,
                      text: 'Hello',
                    },
                  ],
                } as ChatMessage,
              ]
            : effectiveUIMessages,
        );

        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system:
            systemPrompt({ selectedChatModel, requestHints }) +
            quizPreamble +
            (isAutoIntro
              ? '\n\nFirst turn behavior: Reply EXACTLY with this one sentence and nothing else: "Hi there, I\'m your AI professor — would you like to start learning about AI in medicine?"'
              : ''),
          messages: modelInputMessages,
          stopWhen: stepCountIs(5),
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                  'ask_quiz',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
            ask_quiz,
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        await saveMessages({
          messages: messages.map((message) => ({
            id: message.id,
            role: message.role,
            parts: message.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream()),
        ),
      );
    } else {
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
