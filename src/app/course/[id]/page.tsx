import { CoursePageClient } from './CoursePageClient'

interface CoursePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params
  
  return <CoursePageClient courseId={id} />
}
