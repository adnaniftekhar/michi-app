import '@testing-library/jest-dom'
import { loadEnv } from 'vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables from .env.local for tests
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envFile = readFileSync(envPath, 'utf-8')
  
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = cleanValue
        }
      }
    }
  })
} catch (error) {
  // .env.local might not exist in CI, that's okay
  console.warn('Could not load .env.local for tests:', error instanceof Error ? error.message : String(error))
}

