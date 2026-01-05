import type { DemoUser } from '@/types'
import { getCustomUsers } from './custom-users'

export const DEMO_USERS: DemoUser[] = [
  { id: 'alice', name: 'Alice', timezone: 'America/New_York' },
  { id: 'bob', name: 'Bob', timezone: 'Europe/London' },
  { id: 'sam', name: 'Sam', timezone: 'Asia/Tokyo' },
  { id: 'dana', name: 'Dana', timezone: 'America/Los_Angeles' },
  { id: 'eve', name: 'Eve', timezone: 'Europe/Paris' },
  { id: 'frank', name: 'Frank', timezone: 'America/Chicago' },
  { id: 'grace', name: 'Grace', timezone: 'Australia/Sydney' },
  { id: 'henry', name: 'Henry', timezone: 'America/New_York' },
]

export function getAllUsers(): DemoUser[] {
  const customUsers = getCustomUsers()
  // Merge: custom users override built-in users with same ID
  const userMap = new Map<string, DemoUser>()
  
  // Add built-in users first
  DEMO_USERS.forEach(user => userMap.set(user.id, user))
  
  // Override with custom users
  customUsers.forEach(user => userMap.set(user.id, user))
  
  return Array.from(userMap.values())
}

export function getDemoUser(id: string): DemoUser | undefined {
  // Check custom users first (they override built-in users)
  const customUsers = getCustomUsers()
  const custom = customUsers.find(u => u.id === id)
  if (custom) return custom
  
  // Fall back to built-in users
  return DEMO_USERS.find(u => u.id === id)
}

