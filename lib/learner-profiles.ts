/**
 * Learner profile management
 * Provides both sync and async functions to retrieve learner profiles
 * Supports demo users (localStorage) and authenticated users (API)
 */
import type { LearnerProfile, DemoUserId } from '@/types'
import { getCustomProfile, getCustomProfiles, CUSTOM_PROFILES_KEY } from './custom-users'

export const LEARNER_PROFILES: Record<string, LearnerProfile> = {
  alice: {
    name: 'Alice',
    timezone: 'America/New_York',
    languages: [],
    preferences: {
      preferredLearningTimes: ['morning', 'afternoon'],
      preferredDuration: 'medium',
      interactionStyle: 'collaborative',
      contentFormat: ['reading', 'discussion', 'hands-on'],
    },
    constraints: {
      maxDailyMinutes: 120,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    },
    pblProfile: {
      interests: ['history', 'culture', 'language'],
      currentLevel: 'intermediate',
      learningGoals: ['fluency in local language', 'deep cultural understanding'],
      preferredArtifactTypes: ['written', 'visual'],
    },
    experientialProfile: {
      preferredFieldExperiences: ['museums', 'historical sites', 'cultural events'],
      reflectionStyle: 'journal',
      inquiryApproach: 'structured',
    },
  },
  bob: {
    name: 'Bob',
    timezone: 'Europe/London',
    languages: [],
    preferences: {
      preferredLearningTimes: ['evening'],
      preferredDuration: 'long',
      interactionStyle: 'solo',
      contentFormat: ['reading', 'video', 'reflection'],
    },
    constraints: {
      maxDailyMinutes: 180,
    },
    pblProfile: {
      interests: ['science', 'technology', 'nature'],
      currentLevel: 'advanced',
      learningGoals: ['research skills', 'scientific methodology'],
      preferredArtifactTypes: ['written', 'multimedia'],
    },
    experientialProfile: {
      preferredFieldExperiences: ['nature', 'labs', 'observatories'],
      reflectionStyle: 'analytical',
      inquiryApproach: 'open-ended',
    },
  },
  sam: {
    name: 'Sam',
    timezone: 'Asia/Tokyo',
    languages: [],
    preferences: {
      preferredLearningTimes: ['morning', 'evening'],
      preferredDuration: 'short',
      interactionStyle: 'mixed',
      contentFormat: ['hands-on', 'video', 'discussion'],
    },
    constraints: {
      maxDailyMinutes: 90,
      mustAvoidTimes: ['12:00-14:00'],
    },
    pblProfile: {
      interests: ['art', 'design', 'craft'],
      currentLevel: 'beginner',
      learningGoals: ['creative expression', 'technical skills'],
      preferredArtifactTypes: ['visual', 'multimedia'],
    },
    experientialProfile: {
      preferredFieldExperiences: ['galleries', 'workshops', 'studios'],
      reflectionStyle: 'artistic',
      inquiryApproach: 'guided',
    },
  },
  dana: {
    name: 'Dana',
    timezone: 'America/Los_Angeles',
    languages: [],
    preferences: {
      preferredLearningTimes: ['morning'],
      preferredDuration: 'medium',
      interactionStyle: 'collaborative',
      contentFormat: ['discussion', 'hands-on', 'reading'],
    },
    constraints: {
      maxDailyMinutes: 150,
    },
    pblProfile: {
      interests: ['social sciences', 'politics', 'community'],
      currentLevel: 'intermediate',
      learningGoals: ['social impact', 'community engagement'],
      preferredArtifactTypes: ['written', 'audio'],
    },
    experientialProfile: {
      preferredFieldExperiences: ['community centers', 'markets', 'public spaces'],
      reflectionStyle: 'discussion',
      inquiryApproach: 'open-ended',
    },
  },
  eve: {
    name: 'Eve',
    timezone: 'Europe/Paris',
    languages: [],
    preferences: {
      preferredLearningTimes: ['afternoon', 'evening'],
      preferredDuration: 'long',
      interactionStyle: 'solo',
      contentFormat: ['reading', 'reflection', 'video'],
    },
    constraints: {
      maxDailyMinutes: 240,
    },
    pblProfile: {
      interests: ['literature', 'philosophy', 'history'],
      currentLevel: 'advanced',
      learningGoals: ['critical thinking', 'literary analysis'],
      preferredArtifactTypes: ['written'],
    },
    experientialProfile: {
      preferredFieldExperiences: ['libraries', 'literary sites', 'cafes'],
      reflectionStyle: 'journal',
      inquiryApproach: 'structured',
    },
  },
  frank: {
    name: 'Frank',
    timezone: 'America/Chicago',
    languages: [],
    preferences: {
      preferredLearningTimes: ['morning', 'afternoon'],
      preferredDuration: 'short',
      interactionStyle: 'mixed',
      contentFormat: ['hands-on', 'video', 'reading'],
    },
    constraints: {
      maxDailyMinutes: 60,
      availableDays: ['saturday', 'sunday'],
    },
    pblProfile: {
      interests: ['engineering', 'architecture', 'urban planning'],
      currentLevel: 'intermediate',
      learningGoals: ['practical skills', 'design thinking'],
      preferredArtifactTypes: ['visual', 'multimedia'],
    },
    experientialProfile: {
      preferredFieldExperiences: ['construction sites', 'architectural tours', 'urban spaces'],
      reflectionStyle: 'analytical',
      inquiryApproach: 'guided',
    },
  },
  grace: {
    name: 'Grace',
    timezone: 'Australia/Sydney',
    languages: [],
    preferences: {
      preferredLearningTimes: ['morning'],
      preferredDuration: 'medium',
      interactionStyle: 'collaborative',
      contentFormat: ['hands-on', 'discussion', 'video'],
    },
    constraints: {
      maxDailyMinutes: 120,
    },
    pblProfile: {
      interests: ['environmental science', 'sustainability', 'ecology'],
      currentLevel: 'beginner',
      learningGoals: ['environmental awareness', 'sustainable practices'],
      preferredArtifactTypes: ['visual', 'written'],
    },
    experientialProfile: {
      preferredFieldExperiences: ['parks', 'eco-centers', 'nature reserves'],
      reflectionStyle: 'artistic',
      inquiryApproach: 'open-ended',
    },
  },
  henry: {
    name: 'Henry',
    timezone: 'America/New_York',
    languages: [],
    preferences: {
      preferredLearningTimes: ['evening'],
      preferredDuration: 'long',
      interactionStyle: 'solo',
      contentFormat: ['reading', 'reflection', 'video'],
    },
    constraints: {
      maxDailyMinutes: 180,
      mustAvoidTimes: ['09:00-17:00'],
    },
    pblProfile: {
      interests: ['mathematics', 'logic', 'problem-solving'],
      currentLevel: 'advanced',
      learningGoals: ['mathematical reasoning', 'problem-solving strategies'],
      preferredArtifactTypes: ['written'],
    },
    experientialProfile: {
      preferredFieldExperiences: ['science centers', 'labs', 'workshops'],
      reflectionStyle: 'analytical',
      inquiryApproach: 'structured',
    },
  },
}

// Sync version - for immediate use (returns cached/localStorage data)
export function getLearnerProfile(userId: string): LearnerProfile {
  // Check custom profiles first (only if in browser)
  if (typeof window !== 'undefined') {
    // For demo users, check localStorage
    const customProfile = getCustomProfile(userId)
    if (customProfile) {
      return customProfile
    }
  }
  
  // Fall back to built-in profiles
  return LEARNER_PROFILES[userId] || LEARNER_PROFILES.alice
}

// Async version - for Clerk users, fetches from API
export async function getLearnerProfileAsync(userId: string): Promise<LearnerProfile> {
  // If this is a Clerk user ID (starts with 'user_'), try to fetch from API
  if (userId.startsWith('user_') && typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/user/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      if (data.profile) {
        // Also cache it in localStorage for faster access
        const profiles = getCustomProfiles()
        profiles[userId] = data.profile
        localStorage.setItem(CUSTOM_PROFILES_KEY, JSON.stringify(profiles))
        return data.profile as LearnerProfile
      }
    } catch (error) {
      console.error('[getLearnerProfileAsync] Error fetching from API:', error)
      // Fall through to localStorage fallback
    }
  }
  
  // Fall back to sync version (localStorage or built-in)
  return getLearnerProfile(userId)
}
