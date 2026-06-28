import type { Locale } from '@/i18n/types'

type CategoryDictionary = Record<'series' | 'movies' | 'games' | 'books' | 'webs', string>
type StatusDictionary = Record<'pending' | 'in_progress' | 'completed', string>
type CategoryActionsDictionary = Record<keyof CategoryDictionary, StatusDictionary>
type AddFlowCategoryFieldsDictionary = Record<
  keyof CategoryDictionary,
  {
    heading: string
    primaryLabel: string
    primaryPlaceholder: string
    secondaryLabel: string
    secondaryPlaceholder: string
  }
>
type LandingMilestoneDictionary = Record<
  'scaffold' | 'theme' | 'baseline',
  {
    title: string
    description: string
  }
>

export type Dictionary = {
  app: {
    languageLabel: string
    foundationStatus: string
    closeLabel: string
  }
  landing: {
    title: string
    description: string
    milestoneBadge: string
    nextTitle: string
    nextDescription: string
    milestones: LandingMilestoneDictionary
  }
  dashboard: {
    eyebrow: string
    title: string
    subtitle: string
    localDataBadge: string
    localDataNote: string
    filtersLabel: string
    allCategories: string
    loading: string
    emptyTitle: string
    emptyDescription: string
    startAction: string
    addAction: string
    suggestAction: string
    archiveAction: string
  }
  archive: {
    eyebrow: string
    title: string
    subtitle: string
    localDataBadge: string
    localDataNote: string
    loading: string
    emptyTitle: string
    emptyDescription: string
    restoreAction: string
    backAction: string
  }
  addFlow: {
    title: string
    description: string
    localOnlyBadge: string
    desktopMode: string
    mobileMode: string
    categoryLabel: string
    categoryHint: string
    commonDetailsHeading: string
    categoryDetailsHeading: string
    titleLabel: string
    titlePlaceholder: string
    tagsLabel: string
    tagsPlaceholder: string
    notesLabel: string
    notesPlaceholder: string
    cancel: string
    submit: string
    categoryFields: AddFlowCategoryFieldsDictionary
  }
  suggester: {
    title: string
    description: string
    localOnlyBadge: string
    desktopMode: string
    mobileMode: string
    timeLabel: string
    timeHint: string
    moodLabel: string
    moodHint: string
    close: string
    generate: string
    resultsTitle: string
    resultsDescription: string
    reasonLabel: string
    cta: string
    timeOptions: Record<'quick' | 'focused' | 'deep', string>
    moodOptions: Record<'comfort' | 'curious' | 'energetic', string>
  }
  categories: CategoryDictionary
  status: StatusDictionary
  actions: CategoryActionsDictionary
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    app: {
      languageLabel: 'Language',
      foundationStatus: 'Foundation slice',
      closeLabel: 'Close',
    },
    landing: {
      title: 'MeInteresa is ready for the next mock UI work unit',
      description: 'This reviewable slice establishes the TanStack Start application shell, Tailwind CSS v4 tokens, and a shadcn-compatible baseline without introducing persistence, authentication, or AI integrations.',
      milestoneBadge: 'Ready',
      nextTitle: 'Next autonomous slice',
      nextDescription: 'The next batch can safely add shared UI primitives, mock item boundaries, and ES/EN dictionaries on top of this scaffold without reworking the foundation.',
      milestones: {
        scaffold: {
          title: 'TanStack Start scaffold',
          description: 'Typed routing, Vite integration, and the root application shell are now wired.',
        },
        theme: {
          title: 'Tailwind CSS v4 theme',
          description: 'Tokyo Night semantic tokens are exposed through shadcn-compatible CSS variables.',
        },
        baseline: {
          title: 'shadcn-ready baseline',
          description: 'Aliases, components.json, and utility helpers are prepared for the next UI slice.',
        },
      },
    },
    dashboard: {
      eyebrow: 'Backlog dashboard',
      title: 'Your interests backlog',
      subtitle: 'Track local mock items with category filters, status actions, the adaptive add flow, and the mock suggester while archive fallback stays deferred.',
      localDataBadge: 'Local data only',
      localDataNote: 'Status changes stay in memory until you reload the page.',
      filtersLabel: 'Category filters',
      allCategories: 'All',
      loading: 'Loading your mock backlog…',
      emptyTitle: 'No items match this category yet',
      emptyDescription: 'Switch filters to review the rest of the mock backlog.',
      startAction: 'Start now',
      addAction: 'Add interest',
      suggestAction: 'Get suggestions',
      archiveAction: 'Archive',
    },
    archive: {
      eyebrow: 'Archive fallback',
      title: 'Completed backlog history',
      subtitle: 'Review completed mock items, check lightweight per-category totals, and restore anything back into the active backlog without persistence.',
      localDataBadge: 'Local history only',
      localDataNote: 'Restore actions only update the in-memory mock repository for the current runtime session.',
      loading: 'Loading your completed mock items…',
      emptyTitle: 'Nothing has reached the archive yet',
      emptyDescription: 'Advance an item to completed on the dashboard and it will appear here until you restore it or reload the page.',
      restoreAction: 'Restore to backlog',
      backAction: 'Back to dashboard',
    },
    addFlow: {
      title: 'Add a new interest',
      description: 'Choose a category first, then fill only the fields that matter for that kind of backlog item.',
      localOnlyBadge: 'Mock add flow',
      desktopMode: 'Desktop dialog',
      mobileMode: 'Mobile sheet',
      categoryLabel: 'Category',
      categoryHint: 'Pick one category to reveal the relevant detail fields before creating the item.',
      commonDetailsHeading: 'Shared backlog details',
      categoryDetailsHeading: 'Category-specific details',
      titleLabel: 'Title',
      titlePlaceholder: 'Name the item you want to track',
      tagsLabel: 'Tags',
      tagsPlaceholder: 'Comma-separated labels like focus, weekend, comfort',
      notesLabel: 'Notes',
      notesPlaceholder: 'Optional context that should appear on the backlog card',
      cancel: 'Cancel',
      submit: 'Add interest',
      categoryFields: {
        series: {
          heading: 'Series details',
          primaryLabel: 'Current season',
          primaryPlaceholder: 'Season 1, Season 2, or miniseries',
          secondaryLabel: 'Where to watch next',
          secondaryPlaceholder: 'Apple TV+, Netflix, or your backlog list',
        },
        movies: {
          heading: 'Movie details',
          primaryLabel: 'Ideal runtime window',
          primaryPlaceholder: '90 minutes, long weekend, or double feature',
          secondaryLabel: 'Best viewing company',
          secondaryPlaceholder: 'Solo, partner, or movie night friends',
        },
        games: {
          heading: 'Game details',
          primaryLabel: 'Platform',
          primaryPlaceholder: 'PC, Switch, PlayStation, or cloud',
          secondaryLabel: 'Play style',
          secondaryPlaceholder: 'Story mode, co-op, ranked, or handheld session',
        },
        books: {
          heading: 'Book details',
          primaryLabel: 'Author',
          primaryPlaceholder: 'Who wrote it?',
          secondaryLabel: 'Reading format',
          secondaryPlaceholder: 'Paperback, Kindle, or audiobook',
        },
        webs: {
          heading: 'Website details',
          primaryLabel: 'Link',
          primaryPlaceholder: 'https://example.com',
          secondaryLabel: 'Why it stands out',
          secondaryPlaceholder: 'Reference, inspiration, tool, or rabbit hole',
        },
      },
    },
    suggester: {
      title: 'Smart suggester',
      description: 'Choose the time you have and the mood you want, then review three local-only recommendations before deciding what to add next.',
      localOnlyBadge: 'Mock suggestions',
      desktopMode: 'Desktop dialog',
      mobileMode: 'Mobile sheet',
      timeLabel: 'Available time',
      timeHint: 'Pick the session length you can realistically protect right now.',
      moodLabel: 'Desired mood',
      moodHint: 'Choose the tone you want the next recommendation to reinforce.',
      close: 'Close',
      generate: 'Get 3 suggestions',
      resultsTitle: 'Three mock recommendations',
      resultsDescription: 'Each pick stays local-only and can be tracked from the adaptive add flow.',
      reasonLabel: 'Why it fits',
      cta: 'Track this next',
      timeOptions: {
        quick: 'Quick session',
        focused: 'Focused evening',
        deep: 'Deep dive',
      },
      moodOptions: {
        comfort: 'Comfort',
        curious: 'Curious',
        energetic: 'Energetic',
      },
    },
    categories: {
      series: 'Series',
      movies: 'Movies',
      games: 'Games',
      books: 'Books',
      webs: 'Websites',
    },
    status: {
      pending: 'Planned',
      in_progress: 'In progress',
      completed: 'Completed',
    },
    actions: {
      series: {
        pending: 'Plan series',
        in_progress: 'Continue watching',
        completed: 'Mark as watched',
      },
      movies: {
        pending: 'Plan movie',
        in_progress: 'Resume watching',
        completed: 'Mark as watched',
      },
      games: {
        pending: 'Plan game',
        in_progress: 'Resume playing',
        completed: 'Mark as played',
      },
      books: {
        pending: 'Plan book',
        in_progress: 'Continue reading',
        completed: 'Mark as read',
      },
      webs: {
        pending: 'Plan website',
        in_progress: 'Keep exploring',
        completed: 'Mark as explored',
      },
    },
  },
  es: {
    app: {
      languageLabel: 'Idioma',
      foundationStatus: 'Base inicial',
      closeLabel: 'Cerrar',
    },
    landing: {
      title: 'MeInteresa está listo para la siguiente unidad mock de UI',
      description: 'Este slice revisable deja preparada la aplicación con TanStack Start, los tokens de Tailwind CSS v4 y una base compatible con shadcn sin introducir persistencia, autenticación ni integraciones de IA.',
      milestoneBadge: 'Listo',
      nextTitle: 'Siguiente slice autónomo',
      nextDescription: 'El siguiente lote puede añadir con seguridad las primitivas de UI compartidas, los límites mock de intereses y los diccionarios ES/EN sobre esta base sin rehacer los cimientos.',
      milestones: {
        scaffold: {
          title: 'Base con TanStack Start',
          description: 'El enrutado tipado, la integración con Vite y el shell principal de la aplicación ya están conectados.',
        },
        theme: {
          title: 'Tema con Tailwind CSS v4',
          description: 'Los tokens semánticos de Tokyo Night ya están expuestos mediante variables CSS compatibles con shadcn.',
        },
        baseline: {
          title: 'Base lista para shadcn',
          description: 'Los alias, el components.json y los helpers utilitarios ya están listos para el siguiente slice de UI.',
        },
      },
    },
    dashboard: {
      eyebrow: 'Panel del backlog',
      title: 'Tu lista de intereses',
      subtitle: 'Gestiona los elementos mock con filtros por categoría, acciones de estado, el flujo adaptativo de alta y el recomendador mock mientras el fallback del archivo sigue diferido.',
      localDataBadge: 'Solo datos locales',
      localDataNote: 'Los cambios de estado se mantienen en memoria hasta que recargues la página.',
      filtersLabel: 'Filtros por categoría',
      allCategories: 'Todas',
      loading: 'Cargando tu backlog mock…',
      emptyTitle: 'Todavía no hay elementos para esta categoría',
      emptyDescription: 'Cambia de filtro para revisar el resto del backlog mock.',
      startAction: 'Empezar ahora',
      addAction: 'Añadir interés',
      suggestAction: 'Pedir sugerencias',
      archiveAction: 'Archivo',
    },
    archive: {
      eyebrow: 'Fallback del archivo',
      title: 'Historial del backlog completado',
      subtitle: 'Revisa los elementos mock completados, consulta totales ligeros por categoría y devuelve cualquiera al backlog activo sin persistencia.',
      localDataBadge: 'Historial solo local',
      localDataNote: 'Las acciones de restauración solo actualizan el repositorio mock en memoria durante la sesión actual.',
      loading: 'Cargando tus elementos mock completados…',
      emptyTitle: 'Nada ha llegado todavía al archivo',
      emptyDescription: 'Lleva un elemento a completado desde el dashboard y aparecerá aquí hasta que lo restaures o recargues la página.',
      restoreAction: 'Devolver al backlog',
      backAction: 'Volver al dashboard',
    },
    addFlow: {
      title: 'Añadir un nuevo interés',
      description: 'Elige primero una categoría y después completa solo los campos que aportan contexto para ese tipo de elemento.',
      localOnlyBadge: 'Alta mock',
      desktopMode: 'Diálogo de escritorio',
      mobileMode: 'Sheet móvil',
      categoryLabel: 'Categoría',
      categoryHint: 'Selecciona una categoría para mostrar los campos relevantes antes de crear el elemento.',
      commonDetailsHeading: 'Detalles compartidos del backlog',
      categoryDetailsHeading: 'Detalles específicos por categoría',
      titleLabel: 'Título',
      titlePlaceholder: 'Nombra el elemento que quieres seguir',
      tagsLabel: 'Etiquetas',
      tagsPlaceholder: 'Etiquetas separadas por comas como foco, finde, confort',
      notesLabel: 'Notas',
      notesPlaceholder: 'Contexto opcional que debería aparecer en la tarjeta del backlog',
      cancel: 'Cancelar',
      submit: 'Añadir interés',
      categoryFields: {
        series: {
          heading: 'Detalles de la serie',
          primaryLabel: 'Temporada actual',
          primaryPlaceholder: 'Temporada 1, Temporada 2 o miniserie',
          secondaryLabel: 'Dónde seguir viéndola',
          secondaryPlaceholder: 'Apple TV+, Netflix o tu lista pendiente',
        },
        movies: {
          heading: 'Detalles de la película',
          primaryLabel: 'Ventana ideal de duración',
          primaryPlaceholder: '90 minutos, fin de semana largo o sesión doble',
          secondaryLabel: 'Mejor compañía para verla',
          secondaryPlaceholder: 'Solo, pareja o noche de cine con amigos',
        },
        games: {
          heading: 'Detalles del juego',
          primaryLabel: 'Plataforma',
          primaryPlaceholder: 'PC, Switch, PlayStation o cloud',
          secondaryLabel: 'Estilo de partida',
          secondaryPlaceholder: 'Modo historia, cooperativo, ranked o portátil',
        },
        books: {
          heading: 'Detalles del libro',
          primaryLabel: 'Autor',
          primaryPlaceholder: '¿Quién lo escribió?',
          secondaryLabel: 'Formato de lectura',
          secondaryPlaceholder: 'Papel, Kindle o audiolibro',
        },
        webs: {
          heading: 'Detalles de la web',
          primaryLabel: 'Enlace',
          primaryPlaceholder: 'https://example.com',
          secondaryLabel: 'Por qué destaca',
          secondaryPlaceholder: 'Referencia, inspiración, herramienta o madriguera',
        },
      },
    },
    suggester: {
      title: 'Recomendador inteligente',
      description: 'Elige el tiempo que tienes y el ánimo que buscas, y después revisa tres recomendaciones locales antes de decidir qué añadir a continuación.',
      localOnlyBadge: 'Sugerencias mock',
      desktopMode: 'Diálogo de escritorio',
      mobileMode: 'Sheet móvil',
      timeLabel: 'Tiempo disponible',
      timeHint: 'Escoge la duración de sesión que puedes proteger de verdad ahora mismo.',
      moodLabel: 'Ánimo que buscas',
      moodHint: 'Selecciona el tono que quieres reforzar con la siguiente recomendación.',
      close: 'Cerrar',
      generate: 'Obtener 3 sugerencias',
      resultsTitle: 'Tres recomendaciones mock',
      resultsDescription: 'Cada propuesta sigue siendo local y puedes llevarla al flujo adaptativo de alta.',
      reasonLabel: 'Por qué encaja',
      cta: 'Llévalo al backlog',
      timeOptions: {
        quick: 'Sesión rápida',
        focused: 'Tarde enfocada',
        deep: 'Sesión larga',
      },
      moodOptions: {
        comfort: 'Confort',
        curious: 'Curiosidad',
        energetic: 'Energía',
      },
    },
    categories: {
      series: 'Series',
      movies: 'Películas',
      games: 'Juegos',
      books: 'Libros',
      webs: 'Webs',
    },
    status: {
      pending: 'Pendiente',
      in_progress: 'En curso',
      completed: 'Completado',
    },
    actions: {
      series: {
        pending: 'Planear serie',
        in_progress: 'Seguir viendo',
        completed: 'Marcar como vista',
      },
      movies: {
        pending: 'Planear película',
        in_progress: 'Retomar película',
        completed: 'Marcar como vista',
      },
      games: {
        pending: 'Planear juego',
        in_progress: 'Seguir jugando',
        completed: 'Marcar como jugado',
      },
      books: {
        pending: 'Planear libro',
        in_progress: 'Seguir leyendo',
        completed: 'Marcar como leído',
      },
      webs: {
        pending: 'Planear web',
        in_progress: 'Seguir explorando',
        completed: 'Marcar como explorada',
      },
    },
  },
}

type DictionaryNode = Dictionary | Dictionary[keyof Dictionary] | Record<string, unknown>

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}

export function translate(locale: Locale, path: string): string {
  const resolved = path.split('.').reduce<unknown>((value, segment) => {
    if (value && typeof value === 'object' && segment in (value as DictionaryNode)) {
      return (value as Record<string, unknown>)[segment]
    }

    return undefined
  }, getDictionary(locale))

  if (typeof resolved !== 'string') {
    throw new Error(`Missing translation for key "${path}" in locale "${locale}"`)
  }

  return resolved
}
