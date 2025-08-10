import { DraftPageClient } from './DraftPageClient'

interface DraftPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function DraftPage({ params }: DraftPageProps) {
  const { id } = await params
  
  return <DraftPageClient courseId={id} />
}
