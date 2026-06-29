import type { Category, ItemStatus } from '@/features/items/types'
import type { Locale } from '@/i18n/types'

type CategoryDictionary = Record<Category, string>
type StatusDictionary = Record<ItemStatus, string>
type CategoryActionsDictionary = Record<Category, StatusDictionary>
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
    editAction: string
    deleteAction: string
    deleteEditAction: string
    editTitle: string
    editDescription: string
    saveAction: string
    completeWarning: string
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
    completedSectionTitle: string
    completedSectionDescription: string
    deletedSectionTitle: string
    deletedSectionDescription: string
    deletedBadge: string
    deletedOnLabel: string
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
    titleLabel: string
    titlePlaceholder: string
    tagsLabel: string
    tagsPlaceholder: string
    removeTagAction: string
    notesLabel: string
    notesPlaceholder: string
    cancel: string
    submit: string
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
      title: 'MeInteresa foundation',
      description: 'TanStack Start, Tailwind v4, and shadcn-ready tokens are in place.',
      milestoneBadge: 'Ready',
      nextTitle: 'Next',
      nextDescription: 'Add shared UI, mock items, and ES/EN copy on top of this scaffold.',
      milestones: {
        scaffold: {
          title: 'TanStack Start scaffold',
          description: 'Routing and the app shell are wired.',
        },
        theme: {
          title: 'Tailwind CSS v4 theme',
          description: 'Theme tokens are exposed through shadcn-compatible CSS variables.',
        },
        baseline: {
          title: 'shadcn-ready baseline',
          description: 'Aliases and UI helpers are ready for the next slice.',
        },
      },
    },
    dashboard: {
      eyebrow: 'Dashboard',
      title: 'Your interests',
      subtitle: 'Track mock items by category and move them through the backlog.',
      localDataBadge: 'Local data only',
      localDataNote: 'Status changes stay in memory until you reload the page.',
      filtersLabel: 'Category filters',
      allCategories: 'All',
      loading: 'Loading your mock backlog…',
      emptyTitle: 'No items match this category yet',
      emptyDescription: 'Try another category.',
      startAction: 'Start now',
      addAction: 'Add interest',
      suggestAction: 'Get suggestions',
      archiveAction: 'Archive',
      editAction: 'Edit',
      deleteAction: 'Delete',
      deleteEditAction: 'Delete interest',
      editTitle: 'Edit interest',
      editDescription: 'Update the saved details and keep the item on your dashboard.',
      saveAction: 'Save changes',
      completeWarning: 'This will remove the item from your dashboard and move it to the archive.',
    },
    archive: {
      eyebrow: 'Archive',
      title: 'Archive',
      subtitle: 'Review completed items, inspect deleted ones, and restore whatever should return to the dashboard.',
      localDataBadge: 'Local history only',
      localDataNote: 'Restore actions only update the in-memory mock repository for the current runtime session.',
      loading: 'Loading your archived mock items…',
      emptyTitle: 'Nothing is archived yet',
      emptyDescription: 'Complete or delete an item on the dashboard to see it here.',
      completedSectionTitle: 'Completed items',
      completedSectionDescription: 'Restore a completed item to move it back to the pending backlog.',
      deletedSectionTitle: 'Deleted items',
      deletedSectionDescription: 'Restore a deleted item to make it active on the dashboard again.',
      deletedBadge: 'Deleted',
      deletedOnLabel: 'Deleted',
      restoreAction: 'Restore',
      backAction: 'Back to dashboard',
    },
    addFlow: {
      title: 'Add interest',
      description: 'Choose a category and save the basics.',
      localOnlyBadge: 'Mock add flow',
      desktopMode: 'Desktop dialog',
      mobileMode: 'Mobile sheet',
      categoryLabel: 'Category',
      categoryHint: 'Choose a category for this item.',
      commonDetailsHeading: 'Details',
      titleLabel: 'Title',
      titlePlaceholder: 'What do you want to track?',
      tagsLabel: 'Tags',
      tagsPlaceholder: 'Netflix, Spotify, sci-fi',
      removeTagAction: 'Remove tag: {tag}',
      notesLabel: 'Notes',
      notesPlaceholder: 'Optional context for the card',
      cancel: 'Cancel',
      submit: 'Add interest',
    },
    suggester: {
      title: 'Suggestions',
      description: 'Choose time and mood to get 3 mock picks.',
      localOnlyBadge: 'Mock suggestions',
      desktopMode: 'Desktop dialog',
      mobileMode: 'Mobile sheet',
      timeLabel: 'Available time',
      timeHint: 'Pick the time you have right now.',
      moodLabel: 'Desired mood',
      moodHint: 'Pick the tone you want.',
      close: 'Close',
      generate: 'Get 3 picks',
      resultsTitle: '3 suggestions',
      resultsDescription: 'Each pick stays local-only and can be tracked from the adaptive add flow.',
      reasonLabel: 'Why it fits',
      cta: 'Track next',
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
      music: 'Music',
      podcasts: 'Podcasts',
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
      music: {
        pending: 'Plan music',
        in_progress: 'Keep listening',
        completed: 'Mark as listened',
      },
      podcasts: {
        pending: 'Plan podcast',
        in_progress: 'Keep listening',
        completed: 'Mark as listened',
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
      title: 'Base de MeInteresa',
      description: 'TanStack Start, Tailwind v4 y los tokens compatibles con shadcn ya están listos.',
      milestoneBadge: 'Listo',
      nextTitle: 'Siguiente paso',
      nextDescription: 'Añade UI compartida, elementos mock y copia ES/EN sobre esta base.',
      milestones: {
        scaffold: {
          title: 'Base con TanStack Start',
          description: 'El enrutado y el shell principal ya están conectados.',
        },
        theme: {
          title: 'Tema con Tailwind CSS v4',
          description: 'Los tokens del tema ya están expuestos con variables CSS compatibles con shadcn.',
        },
        baseline: {
          title: 'Base lista para shadcn',
          description: 'Los alias y helpers de UI ya están listos para el siguiente slice.',
        },
      },
    },
    dashboard: {
      eyebrow: 'Dashboard',
      title: 'Me interesa',
      subtitle: 'Sigue los elementos mock por categoría y muévelos por el backlog.',
      localDataBadge: 'Solo datos locales',
      localDataNote: 'Los cambios de estado se mantienen en memoria hasta que recargues la página.',
      filtersLabel: 'Filtros por categoría',
      allCategories: 'Todas',
      loading: 'Cargando tu backlog mock…',
      emptyTitle: 'Todavía no hay elementos para esta categoría',
      emptyDescription: 'Prueba otra categoría.',
      startAction: 'Empezar ahora',
      addAction: 'Añadir interés',
      suggestAction: 'Pedir sugerencias',
      archiveAction: 'Archivo',
      editAction: 'Editar',
      deleteAction: 'Eliminar',
      deleteEditAction: 'Eliminar interés',
      editTitle: 'Editar interés',
      editDescription: 'Actualiza los detalles guardados y mantén el elemento en tu dashboard.',
      saveAction: 'Guardar cambios',
      completeWarning: 'Esto quitará el elemento de tu dashboard y lo moverá al archivo.',
    },
    archive: {
      eyebrow: 'Archivo',
      title: 'Archivo',
      subtitle: 'Revisa los elementos completados, inspecciona los eliminados y restaura lo que deba volver al dashboard.',
      localDataBadge: 'Historial solo local',
      localDataNote: 'Las acciones de restauración solo actualizan el repositorio mock en memoria durante la sesión actual.',
      loading: 'Cargando tus elementos archivados…',
      emptyTitle: 'Todavía no hay elementos archivados',
      emptyDescription: 'Completa o elimina un elemento en el dashboard para verlo aquí.',
      completedSectionTitle: 'Elementos completados',
      completedSectionDescription: 'Restaura un elemento completado para devolverlo al backlog pendiente.',
      deletedSectionTitle: 'Elementos eliminados',
      deletedSectionDescription: 'Restaura un elemento eliminado para que vuelva a estar activo en el dashboard.',
      deletedBadge: 'Eliminado',
      deletedOnLabel: 'Eliminado',
      restoreAction: 'Restaurar',
      backAction: 'Volver al dashboard',
    },
    addFlow: {
      title: 'Añadir interés',
      description: 'Elige una categoría y guarda lo básico.',
      localOnlyBadge: 'Alta mock',
      desktopMode: 'Diálogo de escritorio',
      mobileMode: 'Sheet móvil',
      categoryLabel: 'Categoría',
      categoryHint: 'Elige una categoría para este elemento.',
      commonDetailsHeading: 'Detalles',
      titleLabel: 'Título',
      titlePlaceholder: '¿Qué quieres seguir?',
      tagsLabel: 'Etiquetas',
      tagsPlaceholder: 'Netflix, Spotify, ciencia ficción',
      removeTagAction: 'Eliminar etiqueta: {tag}',
      notesLabel: 'Notas',
      notesPlaceholder: 'Contexto opcional para la tarjeta',
      cancel: 'Cancelar',
      submit: 'Añadir interés',
    },
    suggester: {
      title: 'Sugerencias',
      description: 'Elige tiempo y ánimo para obtener 3 propuestas mock.',
      localOnlyBadge: 'Sugerencias mock',
      desktopMode: 'Diálogo de escritorio',
      mobileMode: 'Sheet móvil',
      timeLabel: 'Tiempo disponible',
      timeHint: 'Elige el tiempo que tienes ahora mismo.',
      moodLabel: 'Ánimo que buscas',
      moodHint: 'Elige el tono que te apetece.',
      close: 'Cerrar',
      generate: 'Obtener 3 propuestas',
      resultsTitle: '3 sugerencias',
      resultsDescription: 'Cada propuesta sigue siendo local y puedes llevarla al flujo adaptativo de alta.',
      reasonLabel: 'Por qué encaja',
      cta: 'Seguir después',
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
      music: 'Música',
      podcasts: 'Podcast',
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
      music: {
        pending: 'Planear música',
        in_progress: 'Seguir escuchando',
        completed: 'Marcar como escuchada',
      },
      podcasts: {
        pending: 'Planear podcast',
        in_progress: 'Seguir escuchando',
        completed: 'Marcar como escuchado',
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
