/**
 * HomeScreenMockData
 * Generates realistic placeholder data for the home screen dashboard.
 * When backend endpoints are ready, replace these functions with API calls.
 */

export enum SessionStatus {
  NotStarted = 'not-started',
  InProgress = 'in-progress',
  Paused = 'paused',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export interface MockSession {
  id: string
  guideId: string
  guideTitle: string
  status: SessionStatus
  startedAt: Date | undefined
  currentStepTitle: string | undefined
  progress: number // 0-100
  // New fields for node progress
  currentStep?: number
  totalSteps?: number
}

export interface MockGuide {
  id: string
  title: string
  description: string
  guideType: string
  guideTypeLabel: string
  stepCount: number
  duration: number // minutes
  // New fields for enhanced UI
  imageUrl?: string
  rating?: number
  ratingCount?: number
  status?: 'completed' | 'in-progress' | 'paused' | 'not-started'
  currentStep?: number
}

export interface MockStats {
  activeSessions: number
  completedSessions: number
  totalGuides: number
  favoriteCategories: string[]
}

// =============================================================================
// Mock Data
// =============================================================================

const INTEREST_CATEGORIES = [
  'Baking',
  'Cooking',
  'Sports & Fitness',
  'Workouts',
  'Arts & Crafts',
  'DIY & Home Improvement',
  'Beauty & Skincare',
  'Music Practice',
  'Gardening',
  'Meditation & Wellness',
  'Study & Learning',
]

const MOCK_GUIDES: MockGuide[] = [
  // Baking
  {
    id: 'g1',
    title: 'Perfect Sourdough Bread',
    description: 'Master the art of sourdough with this step-by-step guide to creating artisan bread.',
    guideType: 'cooking',
    guideTypeLabel: 'Cooking',
    stepCount: 8,
    duration: 180,
    imageUrl: 'https://picsum.photos/48/48?random=1',
    rating: 4.8,
    ratingCount: 156,
    status: 'in-progress',
    currentStep: 5,
  },
  {
    id: 'g2',
    title: 'Chocolate Chip Cookies',
    description: 'Learn to make the perfect chocolate chip cookies that are crispy on the outside and chewy inside.',
    guideType: 'cooking',
    guideTypeLabel: 'Cooking',
    stepCount: 6,
    duration: 45,
    imageUrl: 'https://picsum.photos/48/48?random=2',
    rating: 4.9,
    ratingCount: 203,
    status: 'completed',
    currentStep: 6,
  },
  {
    id: 'g3',
    title: 'Homemade Croissants',
    description: 'Create buttery, flaky croissants with proper lamination techniques.',
    guideType: 'cooking',
    guideTypeLabel: 'Cooking',
    stepCount: 12,
    duration: 480,
    imageUrl: 'https://picsum.photos/48/48?random=3',
    rating: 4.5,
    ratingCount: 89,
    status: 'paused',
    currentStep: 7,
  },

  // Cooking
  {
    id: 'g4',
    title: 'Thai Green Curry',
    description: 'Make an authentic Thai green curry from scratch with fresh herbs and spices.',
    guideType: 'cooking',
    guideTypeLabel: 'Cooking',
    stepCount: 7,
    duration: 60,
    imageUrl: 'https://picsum.photos/48/48?random=4',
    rating: 4.7,
    ratingCount: 124,
  },
  {
    id: 'g5',
    title: 'Sushi Roll Mastery',
    description: 'Learn to roll perfect sushi with proper rice seasoning and ingredient balance.',
    guideType: 'cooking',
    guideTypeLabel: 'Cooking',
    stepCount: 9,
    duration: 90,
    imageUrl: 'https://picsum.photos/48/48?random=5',
    rating: 4.6,
    ratingCount: 98,
    status: 'in-progress',
    currentStep: 3,
  },
  {
    id: 'g6',
    title: 'Pasta from Scratch',
    description: 'Make fresh pasta dough and learn multiple shaping techniques.',
    guideType: 'cooking',
    guideTypeLabel: 'Cooking',
    stepCount: 8,
    duration: 75,
    imageUrl: 'https://picsum.photos/48/48?random=6',
    rating: 4.8,
    ratingCount: 167,
  },

  // Sports & Fitness
  {
    id: 'g7',
    title: 'Basketball Shooting Drills',
    description: 'Progressive drills to improve your shooting accuracy and consistency.',
    guideType: 'workout',
    guideTypeLabel: 'Workout',
    stepCount: 10,
    duration: 45,
  },
  {
    id: 'g8',
    title: 'Soccer Ball Control Techniques',
    description: 'Master ball control with exercises focused on touch, dribbling, and first touch.',
    guideType: 'workout',
    guideTypeLabel: 'Workout',
    stepCount: 8,
    duration: 60,
  },
  {
    id: 'g9',
    title: 'Tennis Serve Fundamentals',
    description: 'Learn proper serve technique with focus on grip, stance, and motion.',
    guideType: 'workout',
    guideTypeLabel: 'Workout',
    stepCount: 6,
    duration: 45,
  },

  // Workouts
  {
    id: 'g10',
    title: 'HIIT Cardio Workout',
    description: 'High-intensity interval training to build endurance and burn calories efficiently.',
    guideType: 'workout',
    guideTypeLabel: 'Workout',
    stepCount: 5,
    duration: 30,
  },
  {
    id: 'g11',
    title: 'Push-up Progression',
    description: 'Progressive push-up variations to build upper body strength.',
    guideType: 'workout',
    guideTypeLabel: 'Workout',
    stepCount: 7,
    duration: 20,
  },
  {
    id: 'g12',
    title: 'Yoga Sun Salutation',
    description: 'Master the sun salutation sequence for flexibility and mindfulness.',
    guideType: 'workout',
    guideTypeLabel: 'Workout',
    stepCount: 12,
    duration: 15,
  },

  // Arts & Crafts
  {
    id: 'g13',
    title: 'Watercolor Painting Basics',
    description: 'Learn fundamental watercolor techniques including washes, glazing, and color mixing.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 8,
    duration: 90,
  },
  {
    id: 'g14',
    title: 'Pottery Hand-Building',
    description: 'Create pottery using hand-building techniques: pinch pots, coil building, and slab construction.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 10,
    duration: 120,
  },
  {
    id: 'g15',
    title: 'Digital Drawing with Procreate',
    description: 'Master digital art using Procreate with brushes, layers, and color theory.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 12,
    duration: 180,
  },

  // DIY & Home Improvement
  {
    id: 'g16',
    title: 'Build a Wooden Shelving Unit',
    description: 'Step-by-step guide to building a sturdy wooden shelf with proper measurements and tools.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 11,
    duration: 180,
  },
  {
    id: 'g17',
    title: 'Interior Wall Painting',
    description: 'Prepare, prime, and paint interior walls like a professional.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 9,
    duration: 240,
  },
  {
    id: 'g18',
    title: 'Fix a Leaky Faucet',
    description: 'Replace washers, seats, and seals to fix common faucet leaks.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 7,
    duration: 45,
  },

  // Beauty & Skincare
  {
    id: 'g19',
    title: 'Natural Face Mask Recipes',
    description: 'Create nourishing face masks using natural ingredients like honey and avocado.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 6,
    duration: 30,
  },
  {
    id: 'g20',
    title: 'Contouring Makeup Techniques',
    description: 'Master contouring to enhance facial features with makeup.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 8,
    duration: 45,
  },
  {
    id: 'g21',
    title: 'Hair Care Routine for Curly Hair',
    description: 'Develop an effective routine to enhance and maintain curly hair health.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 7,
    duration: 40,
  },

  // Music Practice
  {
    id: 'g22',
    title: 'Guitar Chord Transitions',
    description: 'Practice smooth transitions between common guitar chords.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 8,
    duration: 30,
  },
  {
    id: 'g23',
    title: 'Piano Scales Fundamentals',
    description: 'Master major and minor scales on the piano for technical proficiency.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 12,
    duration: 45,
  },
  {
    id: 'g24',
    title: 'Singing Warmups and Exercises',
    description: 'Proper vocal warmups to improve range, tone, and breath control.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 6,
    duration: 20,
  },

  // Gardening
  {
    id: 'g25',
    title: 'Grow Tomatoes from Seed',
    description: 'Start tomato plants from seed and care for them through the growing season.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 10,
    duration: 60,
  },
  {
    id: 'g26',
    title: 'Composting for Beginners',
    description: 'Learn to create nutrient-rich compost from kitchen and yard waste.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 8,
    duration: 30,
  },
  {
    id: 'g27',
    title: 'Indoor Herb Garden Setup',
    description: 'Set up an indoor herb garden for fresh herbs year-round.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 6,
    duration: 45,
  },

  // Meditation & Wellness
  {
    id: 'g28',
    title: 'Mindfulness Meditation for Beginners',
    description: 'Learn foundational mindfulness meditation techniques for stress relief.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 5,
    duration: 15,
  },
  {
    id: 'g29',
    title: 'Progressive Muscle Relaxation',
    description: 'Systematic approach to relaxing each muscle group in the body.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 7,
    duration: 25,
  },
  {
    id: 'g30',
    title: 'Sleep Hygiene Routine',
    description: 'Establish habits for better sleep quality and deeper rest.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 8,
    duration: 20,
  },

  // Study & Learning
  {
    id: 'g31',
    title: 'Effective Note-Taking Strategies',
    description: 'Learn methods like Cornell notes and mind mapping for better retention.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 6,
    duration: 30,
  },
  {
    id: 'g32',
    title: 'Speed Reading Techniques',
    description: 'Improve reading speed while maintaining comprehension.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 9,
    duration: 45,
  },
  {
    id: 'g33',
    title: 'Memory Palace Technique',
    description: 'Master the method of loci for extraordinary memorization.',
    guideType: 'general',
    guideTypeLabel: 'General',
    stepCount: 10,
    duration: 60,
  },
]

const MOCK_SESSIONS: MockSession[] = [
  {
    id: 's1',
    guideId: 'g1',
    guideTitle: 'Perfect Sourdough Bread',
    status: SessionStatus.InProgress,
    startedAt: new Date(Date.now() - 3600000), // 1 hour ago
    currentStepTitle: 'Shaping the dough',
    progress: 65,
  },
  {
    id: 's2',
    guideId: 'g4',
    guideTitle: 'Thai Green Curry',
    status: SessionStatus.Paused,
    startedAt: new Date(Date.now() - 7200000), // 2 hours ago
    currentStepTitle: 'Simmering the curry',
    progress: 45,
  },
  {
    id: 's3',
    guideId: 'g10',
    guideTitle: 'HIIT Cardio Workout',
    status: SessionStatus.Completed,
    startedAt: new Date(Date.now() - 86400000), // 1 day ago
    currentStepTitle: undefined,
    progress: 100,
  },
  {
    id: 's4',
    guideId: 'g13',
    guideTitle: 'Watercolor Painting Basics',
    status: SessionStatus.InProgress,
    startedAt: new Date(Date.now() - 1800000), // 30 minutes ago
    currentStepTitle: 'Color mixing and washes',
    progress: 35,
  },
  {
    id: 's5',
    guideId: 'g25',
    guideTitle: 'Grow Tomatoes from Seed',
    status: SessionStatus.Completed,
    startedAt: new Date(Date.now() - 172800000), // 2 days ago
    currentStepTitle: undefined,
    progress: 100,
  },
]

// =============================================================================
// Mock Data Generator
// =============================================================================

export class HomeScreenMockData {
  /**
   * Get statistics for the home screen based on user interests
   */
  static getStats(userInterests: string[]): MockStats {
    const activeSessions = MOCK_SESSIONS.filter(
      s => s.status === SessionStatus.InProgress || s.status === SessionStatus.Paused,
    ).length
    const completedSessions = MOCK_SESSIONS.filter(s => s.status === SessionStatus.Completed).length
    const totalGuides = MOCK_GUIDES.length
    const favoriteCategories = userInterests

    return {
      activeSessions,
      completedSessions,
      totalGuides,
      favoriteCategories,
    }
  }

  /**
   * Get recent sessions (last 5), sorted by most recently modified
   */
  static getRecentSessions(): MockSession[] {
    return MOCK_SESSIONS.slice(0, 5)
  }

  /**
   * Get recommended guides filtered by user interests
   */
  static getRecommendedGuides(userInterests: string[], limit: number = 3): MockGuide[] {
    if (!userInterests || userInterests.length === 0) {
      // No interests set - return random guides
      return MOCK_GUIDES.slice(0, limit)
    }

    // Filter guides by matching interest to guide type labels
    const recommendedGuides = MOCK_GUIDES.filter(guide =>
      userInterests.some(
        interest => guide.guideTypeLabel.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(guide.guideTypeLabel.toLowerCase()),
      ),
    )

    // Return the requested number, or all if not enough matches
    return recommendedGuides.slice(0, limit).length > 0
      ? recommendedGuides.slice(0, limit)
      : MOCK_GUIDES.slice(0, limit)
  }

  /**
   * Get favorite guide types based on user interests
   */
  static getFavoriteGuideTypes(userInterests: string[]): string[] {
    if (!userInterests || userInterests.length === 0) {
      return []
    }

    // Map interests to guide type labels
    const favorites = userInterests.filter(interest => INTEREST_CATEGORIES.includes(interest))
    return favorites.length > 0 ? favorites : userInterests
  }

  /**
   * Format relative time for display (e.g., "1h ago", "30m ago")
   */
  static formatRelativeTime(date: Date | undefined): string {
    if (!date) return 'Unknown time'

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  /**
   * Get status color key for use in theme colors
   */
  static getStatusColor(status: SessionStatus): 'primary' | 'success' | 'warning' | 'textMuted' {
    switch (status) {
      case SessionStatus.InProgress:
        return 'primary'
      case SessionStatus.Completed:
        return 'success'
      case SessionStatus.Paused:
        return 'warning'
      case SessionStatus.Cancelled:
      case SessionStatus.NotStarted:
      default:
        return 'textMuted'
    }
  }

  /**
   * Get human-readable status label
   */
  static getStatusLabel(status: SessionStatus): string {
    const labels: Record<SessionStatus, string> = {
      [SessionStatus.NotStarted]: 'Not Started',
      [SessionStatus.InProgress]: 'In Progress',
      [SessionStatus.Paused]: 'Paused',
      [SessionStatus.Completed]: 'Completed',
      [SessionStatus.Cancelled]: 'Cancelled',
    }
    return labels[status]
  }
}
