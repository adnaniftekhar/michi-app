import type { LearnerProfile, DemoUserId } from '@/types'
import { getCustomProfile } from './custom-users'

export const LEARNER_PROFILES: Record<string, LearnerProfile> = {
  alice: {
    name: 'Alice',
    timezone: 'America/New_York',
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
    preferences: {
      preferredLearningTimes: ['evening'],
      preferredDuration: 'long',
      interactionStyle: 'solo',
      contentFormat: ['reading', 'reflection', 'audio'],
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

export function getLearnerProfile(userId: string): LearnerProfile {
  // Check custom profiles first (only if in browser)
  if (typeof window !== 'undefined') {
    const customProfile = getCustomProfile(userId)
    if (customProfile) {
      return customProfile
    }
  }
  
  // Fall back to built-in profiles
  return LEARNER_PROFILES[userId] || LEARNER_PROFILES.alice
}

