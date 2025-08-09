// Simple script to check environment variables
// Run with: node check-env.js

require('dotenv').config({ path: '.env.local' })

console.log('🔍 Environment Variables Check')
console.log('================================')

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
]

const optionalVars = [
  'OPENAI_API_KEY',
  'HUME_API_KEY',
  'NEXTAUTH_SECRET'
]

console.log('\n✅ Required Variables:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`  ${varName}: ✓ (${value.substring(0, 20)}...)`)
  } else {
    console.log(`  ${varName}: ❌ MISSING`)
  }
})

console.log('\n⚠️  Optional Variables:')
optionalVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`  ${varName}: ✓ (${value.substring(0, 20)}...)`)
  } else {
    console.log(`  ${varName}: - Not set`)
  }
})

console.log('\n📁 File Check:')
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  console.log('  .env.local: ✓ Found')
  
  const content = fs.readFileSync(envPath, 'utf8')
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'))
  console.log(`  Variables in file: ${lines.length}`)
  
  // Check for common issues
  const issues = []
  lines.forEach((line, index) => {
    if (line.includes(' = ')) {
      issues.push(`Line ${index + 1}: Space around = sign`)
    }
    if (line.endsWith(' ')) {
      issues.push(`Line ${index + 1}: Trailing space`)
    }
  })
  
  if (issues.length > 0) {
    console.log('\n🚨 Potential Issues:')
    issues.forEach(issue => console.log(`  ${issue}`))
  }
} else {
  console.log('  .env.local: ❌ NOT FOUND')
  console.log('  Create this file in the project root with your Supabase credentials')
}

console.log('\n🔗 Quick Setup:')
console.log('1. Create .env.local file in project root')
console.log('2. Add your Supabase URL and keys')
console.log('3. Restart the development server')
console.log('4. Check the browser console for any remaining errors')
