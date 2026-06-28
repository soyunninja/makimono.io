import type { Category } from '@/features/items/types'
import type { Locale } from '@/i18n/types'

export const suggestionTimeOptions = ['quick', 'focused', 'deep'] as const
export type SuggestionTime = (typeof suggestionTimeOptions)[number]

export const suggestionMoodOptions = ['comfort', 'curious', 'energetic'] as const
export type SuggestionMood = (typeof suggestionMoodOptions)[number]

type LocalizedReason = Record<Locale, string>

type MockRecommendationRecord = {
  id: string
  title: string
  category: Category
  reason: LocalizedReason
}

export type SuggestionRecommendation = {
  id: string
  title: string
  category: Category
  reason: string
}

const recommendationCatalog = {
  shortHike: {
    id: 'short-hike',
    title: 'A Short Hike',
    category: 'games',
    reason: {
      en: 'A gentle climb with zero friction when you only have a short, restorative window.',
      es: 'Una subida amable y sin fricción cuando solo tienes una ventana corta y reparadora.',
    },
  },
  tedLasso: {
    id: 'ted-lasso',
    title: 'Ted Lasso',
    category: 'series',
    reason: {
      en: 'Optimistic episodes make it easy to reset your mood without a huge time commitment.',
      es: 'Sus episodios optimistas ayudan a reiniciar el ánimo sin exigir un gran bloque de tiempo.',
    },
  },
  tinyExperiments: {
    id: 'tiny-experiments',
    title: 'Tiny Experiments',
    category: 'books',
    reason: {
      en: 'You can grab one useful idea fast and still feel like the session moved you forward.',
      es: 'Puedes sacar una idea útil rápido y aun así sentir que la sesión te hizo avanzar.',
    },
  },
  arrival: {
    id: 'arrival',
    title: 'Arrival',
    category: 'movies',
    reason: {
      en: 'It rewards focused attention with big emotional payoff and a clean discussion hook afterward.',
      es: 'Recompensa la atención sostenida con un gran impacto emocional y una buena conversación después.',
    },
  },
  severance: {
    id: 'severance',
    title: 'Severance',
    category: 'series',
    reason: {
      en: 'Its mystery pacing is perfect when you want a deeper session that keeps you mentally engaged.',
      es: 'Su ritmo de misterio funciona muy bien cuando quieres una sesión más profunda y mentalmente activa.',
    },
  },
  nilsFrahm: {
    id: 'nils-frahm-spaces',
    title: 'Nils Frahm — Spaces',
    category: 'music',
    reason: {
      en: 'Its layered live textures reward curiosity fast without asking you for a huge block of time.',
      es: 'Sus texturas en directo y por capas recompensan la curiosidad rápido sin pedirte un gran bloque de tiempo.',
    },
  },
  celeste: {
    id: 'celeste',
    title: 'Celeste',
    category: 'games',
    reason: {
      en: 'High feedback loops and sharp challenge spikes fit an energetic mood surprisingly well.',
      es: 'Sus bucles de feedback rápidos y el reto preciso encajan muy bien con un ánimo enérgico.',
    },
  },
  projectHailMary: {
    id: 'project-hail-mary',
    title: 'Project Hail Mary',
    category: 'books',
    reason: {
      en: 'It gives you momentum, wonder, and a strong narrative hook when you want to stay locked in.',
      es: 'Da impulso, asombro y un gancho narrativo potente cuando te apetece mantenerte bien metido.',
    },
  },
  spiderVerse: {
    id: 'spider-verse',
    title: 'Spider-Man: Into the Spider-Verse',
    category: 'movies',
    reason: {
      en: 'The visual energy lands fast and keeps paying off when you want something bold and uplifting.',
      es: 'Su energía visual entra rápido y sigue recompensando cuando te apetece algo potente y estimulante.',
    },
  },
} as const satisfies Record<string, MockRecommendationRecord>

const recommendationMatrix: Record<SuggestionTime, Record<SuggestionMood, Array<keyof typeof recommendationCatalog>>> = {
  quick: {
    comfort: ['shortHike', 'tedLasso', 'tinyExperiments'],
    curious: ['nilsFrahm', 'arrival', 'tinyExperiments'],
    energetic: ['celeste', 'spiderVerse', 'shortHike'],
  },
  focused: {
    comfort: ['tedLasso', 'arrival', 'projectHailMary'],
    curious: ['arrival', 'projectHailMary', 'nilsFrahm'],
    energetic: ['celeste', 'spiderVerse', 'arrival'],
  },
  deep: {
    comfort: ['severance', 'projectHailMary', 'tedLasso'],
    curious: ['severance', 'projectHailMary', 'nilsFrahm'],
    energetic: ['severance', 'celeste', 'spiderVerse'],
  },
}

export function getMockRecommendations(
  time: SuggestionTime,
  mood: SuggestionMood,
  locale: Locale,
): SuggestionRecommendation[] {
  return recommendationMatrix[time][mood].map((recommendationKey) => {
    const recommendation = recommendationCatalog[recommendationKey]

    return {
      id: recommendation.id,
      title: recommendation.title,
      category: recommendation.category,
      reason: recommendation.reason[locale],
    }
  })
}
