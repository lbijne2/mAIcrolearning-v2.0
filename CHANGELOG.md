# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2024-12-19

### Added
- **Course Generator UI**: Complete course generation flow with form validation and LLM integration
- **Generate Page** (`/generate`): Form to create personalized 4-week AI courses
  - Topic input with validation
  - Industry selection (default: Healthcare & Life Sciences)
  - AI skill level and experience level radio buttons
  - Learning goals as comma-separated chips
  - Theory-first approach focus
  - LLM provider selection (OpenAI GPT-4 or xAI Grok)
- **Draft Course Preview** (`/course/[id]/draft`): Editable course preview with session management
  - Course metadata display (title, description, tags, objectives)
  - Editable session table with inline editing
  - Session type selection (theory, quiz, interactive, hands_on, review)
  - Duration editing
  - JSON content editor with validation
  - Publish and discard actions
- **Server Actions**: Course generation and management
  - `generateCoursePlan()`: Creates draft courses with 28 sessions
  - `publishCourse()`: Activates draft courses
  - `discardCourse()`: Soft deletes courses
- **LLM Integration**: Support for multiple AI providers
  - OpenAI GPT-4 (preferred when `OPENAI_API_KEY` available)
  - xAI Grok (fallback when `XAI_API_KEY` available)
  - Automatic retry with stricter prompts for malformed JSON
- **Dashboard Updates**: Enhanced course management
  - Draft course banner with "Resume draft course" functionality
  - Active courses display
  - Course generation CTA when no courses exist
- **Type Safety**: Comprehensive TypeScript types and Zod validation
  - `CourseGenerationFormSchema` for form validation
  - `GeneratedCourse` interface for LLM responses
  - Error handling with typed error responses
- **Utility Functions**: Course management helpers
  - `normalizeGeneratedCourse()`: Validates and normalizes LLM output
  - `calculateOrderIndex()`: Computes session ordering
  - `validateCourseStructure()`: Ensures 4 weeks × 7 sessions structure

### Changed
- Updated dashboard to show actual course counts and draft course management
- Enhanced error handling with user-friendly messages
- Improved form validation with real-time feedback

### Fixed
- Session ordering and indexing for proper course structure
- JSON content validation and error handling
- Authentication checks in server actions
- **Server-side authentication**: Fixed course generation authentication by using proper server client for session checks and admin client for database operations
- **xAI API key detection**: Resolved client-side blocking when xAI API key is configured by creating client-side availability functions
- **Server action authentication**: Fixed authentication in server actions by passing user ID from client and verifying with admin API
- **LLM provider preference**: Changed default LLM provider to xAI Grok (preferred) over OpenAI GPT-4 (fallback)
- **xAI model name**: Fixed incorrect model name from 'grok-beta' to 'grok-2-vision-1212' for xAI API compatibility
- **JSON parsing**: Added robust JSON parsing to handle markdown-formatted responses from xAI Grok
- **Enhanced prompts**: Improved prompts with explicit JSON formatting instructions and examples
- **Debug logging**: Added detailed logging for JSON parsing to help troubleshoot API responses
- **Content validation**: Enhanced session content handling with proper defaults and validation
- **Structured content**: Updated prompts to include detailed content structure examples
- **Token limits**: Increased max_tokens to 8000 for course generation to prevent truncated responses
- **Truncation detection**: Added detection and better error messages for truncated JSON responses

### Technical
- Added comprehensive TypeScript types in `src/types/models.ts`
- Created LLM provider selector in `src/lib/llm.ts`
- Implemented course utilities in `src/utils/course.ts`
- Added server actions in `src/app/generate/actions.ts`
- Created generate page in `src/app/generate/page.tsx`
- Added draft preview in `src/app/course/[id]/draft/page.tsx`

### Security
- All database operations include user authentication checks
- RLS policies enforced for course and session access
- Server-side validation of all form inputs

## [0.2.0] - 2024-12-18

### Added
- User authentication with Supabase Auth
- User onboarding flow with profile creation
- Dashboard with user profile display
- Basic UI components and design system

## [0.1.0] - 2024-12-17

### Added
- Initial project setup with Next.js 15
- TypeScript configuration
- Tailwind CSS styling
- Basic project structure
