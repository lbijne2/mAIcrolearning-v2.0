 
import SessionChatPageClient from './SessionChatPageClient'

interface SessionPageProps {
  params: Promise<{ id: string; sessionId: string }>
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id, sessionId } = await params
  return <SessionChatPageClient courseId={id} sessionId={sessionId} />
}


