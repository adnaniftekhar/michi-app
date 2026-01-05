import { z } from 'zod'

// Learner Profile v2 - PBL + Experiential Learning (Enhanced)
export const LearnerProfileSchema = z.object({
  // Core identity
  name: z.string().min(1),
  timezone: z.string(),
  ageBand: z.enum(['5-8', '9-12', '13-16', '17-20', '21+']).optional(),
  languages: z.array(z.string()).default([]),
  accessibilityNotes: z.string().optional(),
  
  // Learning preferences (replaces "learning styles")
  preferences: z.object({
    preferredLearningTimes: z.array(z.string()), // e.g., ["morning", "evening"]
    preferredDuration: z.enum(['short', 'medium', 'long']), // session length preference (legacy)
    preferredDurationMinutes: z.number().min(15).max(120).optional(), // new: explicit minutes
    interactionStyle: z.enum(['solo', 'collaborative', 'mixed']), // legacy
    interactionPreference: z.enum(['prefer-solo', 'prefer-with-others', 'either-works']).optional(), // new: clearer labels
    energyPattern: z.enum(['morning', 'afternoon', 'evening-flexible']).optional(),
    contentFormat: z.array(z.enum(['reading', 'video', 'hands-on', 'discussion', 'reflection'])),
  }),
  
  // Constraints
  constraints: z.object({
    maxDailyMinutes: z.number().positive().optional(),
    availableDays: z.array(z.string()).optional(), // e.g., ["monday", "wednesday", "friday"]
    mustAvoidTimes: z.array(z.string()).optional(), // e.g., ["14:00-16:00"]
  }),
  
  // PBL elements
  pblProfile: z.object({
    interests: z.array(z.string()), // topics/subjects of interest
    dislikes: z.array(z.string()).optional(), // things to avoid
    currentLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    learningGoals: z.array(z.string()), // what they want to achieve
    preferredArtifactTypes: z.array(z.enum(['written', 'visual', 'audio', 'multimedia'])),
  }),
  
  // Experiential learning preferences
  experientialProfile: z.object({
    preferredFieldExperiences: z.array(z.string()), // e.g., ["museums", "nature", "markets"]
    reflectionStyle: z.enum(['journal', 'discussion', 'artistic', 'analytical']),
    reflectionStyles: z.array(z.enum(['journal', 'discussion', 'artistic', 'analytical'])).optional(), // multi-select
    inquiryApproach: z.enum(['structured', 'open-ended', 'guided']),
  }),
  
  // Social preferences
  socialPreferences: z.object({
    collaborationNotes: z.string().optional(),
  }).optional(),
}).passthrough() // Allow additional fields for backward compatibility

export type LearnerProfile = z.infer<typeof LearnerProfileSchema>

