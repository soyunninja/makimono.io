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
type LandingUpcomingImprovementDictionary = Record<
  'personalizedSuggestions' | 'listSubscriptions' | 'sharedLists' | 'prioritiesAndReminders',
  string
>

export type Dictionary = {
  app: {
    languageLabel: string
    foundationStatus: string
    closeLabel: string
    footerRights: string
    footerCaboPrefix: string
    footerCaboSuffix: string
  }
  auth: {
    title: string
    description: string
    loadingTitle: string
    loadingDescription: string
    loginMode: string
    registerMode: string
    emailLabel: string
    emailPlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    submitLogin: string
    submitRegister: string
    submittingLogin: string
    submittingRegister: string
    readyStatus: string
    logoutAction: string
    errorTitle: string
    errorGeneric: string
  }
  landing: {
    title: string
    description: string
    milestoneBadge: string
    nextTitle: string
    nextDescription: string
    milestones: LandingMilestoneDictionary
    workingOnTitle: string
    upcomingImprovements: LandingUpcomingImprovementDictionary
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
    emptySearchTitle: string
    emptySearchDescription: string
    starterTitle: string
    starterDescription: string
    starterAction: string
    starterLoadingAction: string
    starterError: string
    startAction: string
    addAction: string
    publishAction: string
    publishTitle: string
    publishDescription: string
    publishTitleLabel: string
    publishSlugLabel: string
    publishSlugPlaceholder: string
    publishDateLabel: string
    publishDescriptionLabel: string
    publishSubmitAction: string
    publishSubmittingAction: string
    publishSuccess: string
    publishErrorUnauthenticated: string
    publishErrorSlugCollision: string
    publishErrorInvalid: string
    suggestAction: string
    archiveAction: string
    auditAction: string
    publicListsAction: string
    settingsAction: string
    moreActions: string
    profileAvatarLabel: string
    editAction: string
    deleteAction: string
    deleteEditAction: string
    moveToPendingAction: string
    editTitle: string
    editDescription: string
    saveAction: string
    completeWarning: string
    searchLabel: string
    searchPlaceholder: string
  }
  publicList: {
    ownerLabel: string
    listDateLabel: string
    itemsHeading: string
    emptyTitle: string
    emptyDescription: string
    notFoundTitle: string
    notFoundDescription: string
    avatarAlt: string
    avatarFallbackLabel: string
    categoryLabel: string
    notesLabel: string
    tagsLabel: string
    coverAlt: string
  }
  myPublicLists: {
    title: string
    loading: string
    createAction: string
    manageAction: string
    emptyTitle: string
    emptyDescription: string
    errorTitle: string
    errorDescription: string
    descriptionFallback: string
    urlLabel: string
    urlAction: string
    createTitle: string
    createDescription: string
    createTitleLabel: string
    createSlugLabel: string
    createSlugPlaceholder: string
    createDateLabel: string
    createDescriptionLabel: string
    createSubmitAction: string
    createSubmittingAction: string
    createPending: string
    createSuccess: string
    createValidationError: string
    createErrorUnauthenticated: string
    createErrorSlugCollision: string
    createErrorInvalid: string
    createErrorGeneric: string
    editorTitle: string
    editorLoading: string
    editorErrorTitle: string
    editorErrorDescription: string
    editorDeniedTitle: string
    editorDeniedDescription: string
    editorItemsTitle: string
    editorItemsDescription: string
    editorSavedItemsLabel: string
    editorEmptyTitle: string
    editorEmptyDescription: string
    editorEligibleTitle: string
    editorEligibleDescription: string
    editorEligibleItemsLabel: string
    editorNoEligibleItems: string
    editorAddAction: string
    editorAddingAction: string
    editorAddPending: string
    editorAddSuccess: string
    editorAddError: string
    editorRemoveAction: string
    editorRemovingAction: string
    editorRemovePending: string
    editorRemoveSuccess: string
    editorRemoveError: string
    editorCreateListOnlyTitle: string
    editorCreateListOnlyDescription: string
    editorCreateListOnlyOpenAction: string
    editorCreateListOnlySubmitAction: string
    editorCreateListOnlySubmittingAction: string
    editorCreateListOnlyPending: string
    editorCreateListOnlySuccess: string
    editorCreateListOnlyError: string
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
    emptySearchTitle: string
    emptySearchDescription: string
    completedSectionTitle: string
    completedSectionDescription: string
    deletedSectionTitle: string
    deletedSectionDescription: string
    deletedBadge: string
    deletedOnLabel: string
    restoreAction: string
    backAction: string
    searchLabel: string
    searchPlaceholder: string
  }
  mcpAudit: {
    title: string
    loading: string
    emptyTitle: string
    emptyDescription: string
    errorTitle: string
    errorDescription: string
    searchTitle: string
    searchDescription: string
    searchLabel: string
    searchPlaceholder: string
    resultCountSuffix: string
    emptySearchTitle: string
    emptySearchDescription: string
    actionLabel: string
    outcomeLabel: string
    targetIdLabel: string
    emptyValue: string
  }
  settings: {
    title: string
    description: string
    languageTitle: string
    languageDescription: string
    dashboardDisplayTitle: string
    dashboardDisplayDescription: string
    dashboardDisplayLabel: string
    dashboardDisplayCards: string
    dashboardDisplayList: string
    dashboardDisplayCovers: string
    profileTitle: string
    profileAvatarAlt: string
    profileAvatarFallbackLabel: string
    profileUsernameLabel: string
    profileUsernamePlaceholder: string
    profileUsernameFallback: string
    profileAvatarInputLabel: string
    profileSaveAction: string
    profileErrorGeneric: string
    profileUsernameError: Record<'invalid_format' | 'required' | 'too_long' | 'too_short', string>
    profileAvatarError: Record<'browser_unsupported' | 'canvas_unavailable' | 'conversion_failed' | 'file_too_large' | 'normalized_file_too_large' | 'unsupported_type', string>
    sessionTitle: string
    sessionDescription: string
    versionTitle: string
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
    findCoverAction: string
    removeCoverAction: string
    coverLookupSearching: string
    coverLookupNotFound: string
    coverFoundStatus: string
    coverMatchedTitleLabel: string
    coverProviderLabel: string
    coverPreviewAlt: string
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
      footerRights: 'All rights reserved',
      footerCaboPrefix: 'Made under the',
      footerCaboSuffix: 'of the Cabo de Gata beaches.',
    },
    auth: {
      title: 'Sign in to your backlog',
      description: 'Use your PocketBase user account to sync interests across devices.',
      loadingTitle: 'Checking your session…',
      loadingDescription: 'PocketBase is restoring the saved session.',
      loginMode: 'Sign in',
      registerMode: 'Create account',
      emailLabel: 'Email',
      emailPlaceholder: 'you@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Your password',
      submitLogin: 'Sign in to my account',
      submitRegister: 'Create new account',
      submittingLogin: 'Signing in…',
      submittingRegister: 'Creating account…',
      readyStatus: 'Preparing authentication…',
      logoutAction: 'Logout',
      errorTitle: 'Access not ready yet',
      errorGeneric: 'Check your email and password, then try again. If you just created the account, give it a moment and sign in again.',
    },
    landing: {
      title: 'Makimono foundation',
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
      workingOnTitle: 'Working on:',
      upcomingImprovements: {
        personalizedSuggestions: 'Personalized suggestions',
        listSubscriptions: 'List subscriptions',
        sharedLists: 'Shared lists',
        prioritiesAndReminders: 'Priorities and reminders',
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
      emptySearchTitle: 'No items match this search',
      emptySearchDescription: 'Try a different title, tag, note, or category.',
      starterTitle: 'Start with a recommended list',
      starterDescription: 'Add a curated starter pack of Japanese series, movies, and books. Covers are added when available.',
      starterAction: 'Add starter list',
      starterLoadingAction: 'Adding starter list…',
      starterError: 'We could not add the starter list. Try again in a moment.',
      startAction: 'Start now',
      addAction: 'Add interest',
      publishAction: 'Publish list',
      publishTitle: 'Publish public list',
      publishDescription: 'Temporary bridge: publish the currently visible dashboard items as a read-only public list. Dedicated public-list management lives in My public lists.',
      publishTitleLabel: 'Public list title',
      publishSlugLabel: 'Public URL slug',
      publishSlugPlaceholder: 'summer-books',
      publishDateLabel: 'List date',
      publishDescriptionLabel: 'Description',
      publishSubmitAction: 'Publish read-only list',
      publishSubmittingAction: 'Publishing…',
      publishSuccess: 'Public list published.',
      publishErrorUnauthenticated: 'Sign in before publishing a public list.',
      publishErrorSlugCollision: 'That public URL slug is already used for your profile.',
      publishErrorInvalid: 'Use a valid public profile namespace and slug.',
      suggestAction: 'Get suggestions',
      archiveAction: 'Archive',
      auditAction: 'Audit',
      publicListsAction: 'My public lists',
      settingsAction: 'Settings',
      moreActions: 'More actions',
      profileAvatarLabel: 'Public profile avatar',
      editAction: 'Edit',
      deleteAction: 'Delete',
      deleteEditAction: 'Delete interest',
      moveToPendingAction: 'Move to planned',
      editTitle: 'Edit interest',
      editDescription: 'Update the saved details and keep the item on your dashboard.',
      saveAction: 'Save changes',
      completeWarning: 'This will remove the item from your dashboard and move it to the archive.',
      searchLabel: 'Search by title, tag, or notes',
      searchPlaceholder: 'Search title, tag, or notes',
    },
    publicList: {
      ownerLabel: 'Published by',
      listDateLabel: 'List date',
      itemsHeading: 'List items',
      emptyTitle: 'This public list is empty',
      emptyDescription: 'The owner has not added any visible items to this published list yet.',
      notFoundTitle: 'Public list not found',
      notFoundDescription: 'This published list may not exist, may be private, or may have moved.',
      avatarAlt: '{owner} public avatar',
      avatarFallbackLabel: '{owner} public avatar fallback',
      categoryLabel: 'Category',
      notesLabel: 'Notes',
      tagsLabel: 'Tags',
      coverAlt: '{title} cover',
    },
    myPublicLists: {
      title: 'My public lists',
      loading: 'Loading your public lists…',
      createAction: 'Create public list',
      manageAction: 'Manage list',
      emptyTitle: 'No public lists created yet',
      emptyDescription: 'Create a public list and add interests to it when you are ready.',
      errorTitle: 'Could not load your public lists',
      errorDescription: 'Check your session and try again. Private diagnostic details are not shown here.',
      descriptionFallback: 'No description',
      urlLabel: 'Public route',
      urlAction: 'Open public URL',
      createTitle: 'Create public list',
      createDescription: 'Start an owner-managed public list. You can add interests from the list editor after creation.',
      createTitleLabel: 'Public list title',
      createSlugLabel: 'Public URL slug',
      createSlugPlaceholder: 'summer-books',
      createDateLabel: 'List date',
      createDescriptionLabel: 'Description',
      createSubmitAction: 'Create list',
      createSubmittingAction: 'Creating list…',
      createPending: 'Creating your public list…',
      createSuccess: 'Public list created. Opening the list manager…',
      createValidationError: 'Add a title, URL slug, and list date before creating the list.',
      createErrorUnauthenticated: 'Sign in before creating a public list.',
      createErrorSlugCollision: 'That public URL slug is already used for your profile.',
      createErrorInvalid: 'Use a valid public profile namespace and slug.',
      createErrorGeneric: 'We could not create the public list. Try again in a moment.',
      editorTitle: 'Public list manager',
      editorLoading: 'Loading your public list…',
      editorErrorTitle: 'Could not load the public list manager',
      editorErrorDescription: 'Check your session and try again. Private diagnostic details are not shown here.',
      editorDeniedTitle: 'Public list editor unavailable',
      editorDeniedDescription: 'This list does not exist for your account, or you do not have owner access to edit it.',
      editorItemsTitle: 'Saved interests',
      editorItemsDescription: 'These interests are already committed to the read-only public list.',
      editorSavedItemsLabel: 'Saved public list interests',
      editorEmptyTitle: 'No interests saved yet',
      editorEmptyDescription: 'Add an eligible interest from your account to start composing this public list.',
      editorEligibleTitle: 'Add from your interests',
      editorEligibleDescription: 'Only interests available through your current account can be added here.',
      editorEligibleItemsLabel: 'Eligible interests from your account',
      editorNoEligibleItems: 'No eligible interests are available to add.',
      editorAddAction: 'Add to list',
      editorAddingAction: 'Adding…',
      editorAddPending: 'Saving the selected interest to this public list…',
      editorAddSuccess: 'Saved. The public list now shows the added interest.',
      editorAddError: 'We could not save that interest. The public list was left unchanged.',
      editorRemoveAction: 'Remove from list',
      editorRemovingAction: 'Removing…',
      editorRemovePending: 'Removing the selected item from this public list…',
      editorRemoveSuccess: 'Removed. The public list no longer shows that item.',
      editorRemoveError: 'We could not remove that item. The public list was left unchanged.',
      editorCreateListOnlyTitle: 'Add a rich list-only interest',
      editorCreateListOnlyDescription: 'Use the full composer to save title, category, notes, tags, and cover metadata only inside this public list.',
      editorCreateListOnlyOpenAction: 'Open rich composer',
      editorCreateListOnlySubmitAction: 'Add rich list-only item',
      editorCreateListOnlySubmittingAction: 'Adding…',
      editorCreateListOnlyPending: 'Saving the rich list-only item to this public list…',
      editorCreateListOnlySuccess: 'Saved. The public list now shows the rich list-only item.',
      editorCreateListOnlyError: 'We could not save that rich list-only item. The public list was left unchanged.',
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
      emptySearchTitle: 'No archived items match this search',
      emptySearchDescription: 'Try a different title, tag, or note.',
      completedSectionTitle: 'Completed items',
      completedSectionDescription: 'Restore a completed item to move it back to the pending backlog.',
      deletedSectionTitle: 'Deleted items',
      deletedSectionDescription: 'Restore a deleted item to make it active on the dashboard again.',
      deletedBadge: 'Deleted',
      deletedOnLabel: 'Deleted',
      restoreAction: 'Restore',
      backAction: 'Back to dashboard',
      searchLabel: 'Search archived items by title, tag, or notes',
      searchPlaceholder: 'Search title, tag, or notes',
    },
    mcpAudit: {
      title: 'MCP audit',
      loading: 'Loading MCP audit events…',
      emptyTitle: 'No MCP audit events yet',
      emptyDescription: 'Remote MCP write events will appear here after they are recorded in PocketBase.',
      errorTitle: 'Could not load MCP audit events',
      errorDescription: 'Check your PocketBase session and audit collection rules, then try again.',
      searchTitle: 'Find audit events',
      searchDescription: 'Search the loaded events by target, tool, action, outcome, or summary.',
      searchLabel: 'Search MCP audit events',
      searchPlaceholder: 'Search target, tool, action, outcome, or summary',
      resultCountSuffix: 'events shown',
      emptySearchTitle: 'No MCP audit events match this search',
      emptySearchDescription: 'Try a different target, tool, action, outcome, or summary value.',
      actionLabel: 'Action',
      outcomeLabel: 'Outcome',
      targetIdLabel: 'Target ID',
      emptyValue: 'Not provided',
    },
    settings: {
      title: 'Settings',
      description: 'Manage language, session, and app details.',
      languageTitle: 'Language',
      languageDescription: 'Choose the interface language.',
      dashboardDisplayTitle: 'Dashboard display',
      dashboardDisplayDescription: 'Choose how dashboard cards are shown.',
      dashboardDisplayLabel: 'Dashboard display',
      dashboardDisplayCards: 'Cards',
      dashboardDisplayList: 'List',
      dashboardDisplayCovers: 'Covers',
      profileTitle: 'Public profile',
      profileAvatarAlt: 'Public profile avatar',
      profileAvatarFallbackLabel: 'Public profile avatar placeholder',
      profileUsernameLabel: 'Username',
      profileUsernamePlaceholder: 'mariano_99',
      profileUsernameFallback: 'Choose a username',
      profileAvatarInputLabel: 'Upload avatar',
      profileSaveAction: 'Save public profile',
      profileErrorGeneric: 'We could not save your public profile. Try again in a moment.',
      profileUsernameError: {
        invalid_format: 'Use lowercase letters, numbers, or underscores. Start and end with a letter or number.',
        required: 'Choose a public username.',
        too_long: 'Use 30 characters or fewer.',
        too_short: 'Use at least 3 characters.',
      },
      profileAvatarError: {
        browser_unsupported: 'This browser could not read the selected image. Try another image.',
        canvas_unavailable: 'This browser cannot prepare the avatar image. Try another browser or device.',
        conversion_failed: 'We could not prepare that avatar. The current avatar was not changed.',
        file_too_large: 'Choose an image up to 5 MB. The current avatar was not changed.',
        normalized_file_too_large: 'The prepared avatar is still too large. Try a simpler image.',
        unsupported_type: 'Choose a JPG, PNG, GIF, or WebP image. The current avatar was not changed.',
      },
      sessionTitle: 'Session',
      sessionDescription: 'Sign out of the current PocketBase session.',
      versionTitle: 'Version',
    },
    addFlow: {
      title: 'Add',
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
      findCoverAction: 'Find cover',
      removeCoverAction: 'Remove cover',
      coverLookupSearching: 'Looking up a cover…',
      coverLookupNotFound: 'No cover found. You can still save without one.',
      coverFoundStatus: 'Cover ready to save',
      coverMatchedTitleLabel: 'Matched title:',
      coverProviderLabel: 'Provider:',
      coverPreviewAlt: 'Cover preview',
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
      footerRights: 'Todos los derechos reservados',
      footerCaboPrefix: 'Creado bajo el',
      footerCaboSuffix: 'de las playas del Cabo de Gata.',
    },
    auth: {
      title: 'Accede a tu backlog',
      description: 'Usa tu cuenta de PocketBase para sincronizar intereses entre dispositivos.',
      loadingTitle: 'Comprobando tu sesión…',
      loadingDescription: 'PocketBase está restaurando la sesión guardada.',
      loginMode: 'Entrar',
      registerMode: 'Crear cuenta',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'tu@ejemplo.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Tu contraseña',
      submitLogin: 'Entrar con mi cuenta',
      submitRegister: 'Crear cuenta nueva',
      submittingLogin: 'Entrando…',
      submittingRegister: 'Creando cuenta…',
      readyStatus: 'Preparando la autenticación…',
      logoutAction: 'Salir',
      errorTitle: 'Todavía no podemos abrir la puerta',
      errorGeneric: 'Revisa el correo y la contraseña, y vuelve a intentarlo. Si acabas de crear la cuenta, espera un momento y entra de nuevo.',
    },
    landing: {
      title: 'Base de Makimono',
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
      workingOnTitle: 'Trabajando en:',
      upcomingImprovements: {
        personalizedSuggestions: 'Sugerencias personalizadas',
        listSubscriptions: 'Suscripción a listas',
        sharedLists: 'Listas compartidas',
        prioritiesAndReminders: 'Prioridades y recordatorios',
      },
    },
    dashboard: {
      eyebrow: 'Dashboard',
      title: 'Makimono',
      subtitle: 'Sigue los elementos mock por categoría y muévelos por el backlog.',
      localDataBadge: 'Solo datos locales',
      localDataNote: 'Los cambios de estado se mantienen en memoria hasta que recargues la página.',
      filtersLabel: 'Filtros por categoría',
      allCategories: 'Todas',
      loading: 'Cargando tu backlog mock…',
      emptyTitle: 'Todavía no hay elementos para esta categoría',
      emptyDescription: 'Prueba otra categoría.',
      emptySearchTitle: 'Ningún elemento coincide con esta búsqueda',
      emptySearchDescription: 'Prueba con otro título, etiqueta, nota o categoría.',
      starterTitle: 'Empieza con una lista recomendada',
      starterDescription: 'Añade una selección inicial de series, películas y libros japoneses. Incluiremos portadas cuando estén disponibles.',
      starterAction: 'Añadir lista inicial',
      starterLoadingAction: 'Añadiendo lista inicial…',
      starterError: 'No se ha podido añadir la lista inicial. Inténtalo de nuevo en un momento.',
      startAction: 'Empezar ahora',
      addAction: 'Añadir interés',
      publishAction: 'Publicar lista',
      publishTitle: 'Publicar lista pública',
      publishDescription: 'Puente temporal: publica los elementos visibles del dashboard como una lista pública de solo lectura. La gestión dedicada está en Mis listas públicas.',
      publishTitleLabel: 'Título de la lista pública',
      publishSlugLabel: 'Slug de la URL pública',
      publishSlugPlaceholder: 'libros-verano',
      publishDateLabel: 'Fecha de la lista',
      publishDescriptionLabel: 'Descripción',
      publishSubmitAction: 'Publicar lista de solo lectura',
      publishSubmittingAction: 'Publicando…',
      publishSuccess: 'Lista pública publicada.',
      publishErrorUnauthenticated: 'Inicia sesión antes de publicar una lista pública.',
      publishErrorSlugCollision: 'Ese slug de URL pública ya está usado en tu perfil.',
      publishErrorInvalid: 'Usa un namespace de perfil público y un slug válidos.',
      suggestAction: 'Pedir sugerencias',
      archiveAction: 'Archivo',
      auditAction: 'Auditoría',
      publicListsAction: 'Mis listas públicas',
      settingsAction: 'Ajustes',
      moreActions: 'Más acciones',
      profileAvatarLabel: 'Avatar del perfil público',
      editAction: 'Editar',
      deleteAction: 'Eliminar',
      deleteEditAction: 'Eliminar interés',
      moveToPendingAction: 'Mover a pendiente',
      editTitle: 'Editar interés',
      editDescription: 'Actualiza los detalles guardados y mantén el elemento en tu dashboard.',
      saveAction: 'Guardar cambios',
      completeWarning: 'Esto quitará el elemento de tu dashboard y lo moverá al archivo.',
      searchLabel: 'Buscar por título, etiqueta o notas',
      searchPlaceholder: 'Buscar por título, etiqueta o notas',
    },
    publicList: {
      ownerLabel: 'Publicada por',
      listDateLabel: 'Fecha de la lista',
      itemsHeading: 'Elementos de la lista',
      emptyTitle: 'Esta lista pública está vacía',
      emptyDescription: 'La persona propietaria todavía no ha añadido elementos visibles a esta lista publicada.',
      notFoundTitle: 'Lista pública no encontrada',
      notFoundDescription: 'Puede que esta lista publicada no exista, sea privada o se haya movido.',
      avatarAlt: 'Avatar público de {owner}',
      avatarFallbackLabel: 'Marcador de avatar público de {owner}',
      categoryLabel: 'Categoría',
      notesLabel: 'Notas',
      tagsLabel: 'Etiquetas',
      coverAlt: 'Portada de {title}',
    },
    myPublicLists: {
      title: 'Mis listas públicas',
      loading: 'Cargando tus listas públicas…',
      createAction: 'Crear lista pública',
      manageAction: 'Gestionar lista',
      emptyTitle: 'Todavía no has creado listas públicas',
      emptyDescription: 'Crea una lista pública y añade intereses cuando quieras.',
      errorTitle: 'No se han podido cargar tus listas públicas',
      errorDescription: 'Revisa tu sesión e inténtalo de nuevo. Aquí no se muestran detalles privados de diagnóstico.',
      descriptionFallback: 'Sin descripción',
      urlLabel: 'Ruta pública',
      urlAction: 'Abrir URL pública',
      createTitle: 'Crear lista pública',
      createDescription: 'Empieza una lista pública gestionada por ti. Podrás añadir intereses desde el editor después de crearla.',
      createTitleLabel: 'Título de la lista pública',
      createSlugLabel: 'Slug de la URL pública',
      createSlugPlaceholder: 'libros-verano',
      createDateLabel: 'Fecha de la lista',
      createDescriptionLabel: 'Descripción',
      createSubmitAction: 'Crear lista',
      createSubmittingAction: 'Creando lista…',
      createPending: 'Creando tu lista pública…',
      createSuccess: 'Lista pública creada. Abriendo el gestor de la lista…',
      createValidationError: 'Añade título, slug de URL y fecha antes de crear la lista.',
      createErrorUnauthenticated: 'Inicia sesión antes de crear una lista pública.',
      createErrorSlugCollision: 'Ese slug de URL pública ya se usa en tu perfil.',
      createErrorInvalid: 'Usa un espacio de perfil público y un slug válidos.',
      createErrorGeneric: 'No hemos podido crear la lista pública. Inténtalo de nuevo en un momento.',
      editorTitle: 'Gestor de lista pública',
      editorLoading: 'Cargando tu lista pública…',
      editorErrorTitle: 'No se ha podido cargar el gestor de la lista pública',
      editorErrorDescription: 'Revisa tu sesión e inténtalo de nuevo. Aquí no se muestran detalles privados de diagnóstico.',
      editorDeniedTitle: 'Editor de lista pública no disponible',
      editorDeniedDescription: 'Esta lista no existe para tu cuenta, o no tienes acceso de propietario para editarla.',
      editorItemsTitle: 'Intereses guardados',
      editorItemsDescription: 'Estos intereses ya están guardados en la lista pública de solo lectura.',
      editorSavedItemsLabel: 'Intereses guardados en la lista pública',
      editorEmptyTitle: 'Todavía no hay intereses guardados',
      editorEmptyDescription: 'Añade un interés elegible de tu cuenta para empezar a componer esta lista pública.',
      editorEligibleTitle: 'Añadir desde tus intereses',
      editorEligibleDescription: 'Aquí solo puedes añadir intereses disponibles desde tu cuenta actual.',
      editorEligibleItemsLabel: 'Intereses elegibles de tu cuenta',
      editorNoEligibleItems: 'No hay intereses elegibles para añadir.',
      editorAddAction: 'Añadir a la lista',
      editorAddingAction: 'Añadiendo…',
      editorAddPending: 'Guardando el interés seleccionado en esta lista pública…',
      editorAddSuccess: 'Guardado. La lista pública ya muestra el interés añadido.',
      editorAddError: 'No hemos podido guardar ese interés. La lista pública no ha cambiado.',
      editorRemoveAction: 'Quitar de la lista',
      editorRemovingAction: 'Quitando…',
      editorRemovePending: 'Quitando el elemento seleccionado de esta lista pública…',
      editorRemoveSuccess: 'Quitado. La lista pública ya no muestra ese elemento.',
      editorRemoveError: 'No hemos podido quitar ese elemento. La lista pública no ha cambiado.',
      editorCreateListOnlyTitle: 'Añadir un interés enriquecido solo de lista',
      editorCreateListOnlyDescription: 'Usa el compositor completo para guardar título, categoría, notas, etiquetas y metadatos de portada solo dentro de esta lista pública.',
      editorCreateListOnlyOpenAction: 'Abrir compositor enriquecido',
      editorCreateListOnlySubmitAction: 'Añadir elemento enriquecido solo de lista',
      editorCreateListOnlySubmittingAction: 'Añadiendo…',
      editorCreateListOnlyPending: 'Guardando el elemento enriquecido solo de lista en esta lista pública…',
      editorCreateListOnlySuccess: 'Guardado. La lista pública ya muestra el elemento enriquecido solo de lista.',
      editorCreateListOnlyError: 'No hemos podido guardar ese elemento enriquecido solo de lista. La lista pública no ha cambiado.',
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
      emptySearchTitle: 'Ningún elemento archivado coincide con esta búsqueda',
      emptySearchDescription: 'Prueba con otro título, etiqueta o nota.',
      completedSectionTitle: 'Elementos completados',
      completedSectionDescription: 'Restaura un elemento completado para devolverlo al backlog pendiente.',
      deletedSectionTitle: 'Elementos eliminados',
      deletedSectionDescription: 'Restaura un elemento eliminado para que vuelva a estar activo en el dashboard.',
      deletedBadge: 'Eliminado',
      deletedOnLabel: 'Eliminado',
      restoreAction: 'Restaurar',
      backAction: 'Volver al dashboard',
      searchLabel: 'Buscar archivados por título, etiqueta o notas',
      searchPlaceholder: 'Buscar por título, etiqueta o notas',
    },
    mcpAudit: {
      title: 'Auditoría MCP',
      loading: 'Cargando eventos de auditoría MCP…',
      emptyTitle: 'Todavía no hay eventos de auditoría MCP',
      emptyDescription: 'Los eventos de escritura del MCP remoto aparecerán aquí cuando PocketBase los registre.',
      errorTitle: 'No se han podido cargar los eventos de auditoría MCP',
      errorDescription: 'Revisa tu sesión de PocketBase y las reglas de la colección de auditoría, e inténtalo de nuevo.',
      searchTitle: 'Buscar eventos de auditoría',
      searchDescription: 'Busca en los eventos cargados por objetivo, herramienta, acción, resultado o resumen.',
      searchLabel: 'Buscar eventos de auditoría MCP',
      searchPlaceholder: 'Buscar objetivo, herramienta, acción, resultado o resumen',
      resultCountSuffix: 'eventos mostrados',
      emptySearchTitle: 'Ningún evento de auditoría MCP coincide con esta búsqueda',
      emptySearchDescription: 'Prueba con otro objetivo, herramienta, acción, resultado o valor del resumen.',
      actionLabel: 'Acción',
      outcomeLabel: 'Resultado',
      targetIdLabel: 'ID objetivo',
      emptyValue: 'No indicado',
    },
    settings: {
      title: 'Ajustes',
      description: 'Gestiona el idioma, la sesión y los detalles de la app.',
      languageTitle: 'Idioma',
      languageDescription: 'Elige el idioma de la interfaz.',
      dashboardDisplayTitle: 'Visualización del dashboard',
      dashboardDisplayDescription: 'Elige cómo se muestran las tarjetas del dashboard.',
      dashboardDisplayLabel: 'Visualización del dashboard',
      dashboardDisplayCards: 'Tarjetas',
      dashboardDisplayList: 'Listado',
      dashboardDisplayCovers: 'Carátulas',
      profileTitle: 'Perfil público',
      profileAvatarAlt: 'Avatar del perfil público',
      profileAvatarFallbackLabel: 'Marcador de avatar del perfil público',
      profileUsernameLabel: 'Nombre de usuario',
      profileUsernamePlaceholder: 'mariano_99',
      profileUsernameFallback: 'Elige un nombre de usuario',
      profileAvatarInputLabel: 'Subir avatar',
      profileSaveAction: 'Guardar perfil público',
      profileErrorGeneric: 'No hemos podido guardar tu perfil público. Inténtalo de nuevo en un momento.',
      profileUsernameError: {
        invalid_format: 'Usa minúsculas, números o guiones bajos. Empieza y termina con una letra o número.',
        required: 'Elige un nombre de usuario público.',
        too_long: 'Usa 30 caracteres o menos.',
        too_short: 'Usa al menos 3 caracteres.',
      },
      profileAvatarError: {
        browser_unsupported: 'Este navegador no ha podido leer la imagen seleccionada. Prueba otra imagen.',
        canvas_unavailable: 'Este navegador no puede preparar el avatar. Prueba otro navegador o dispositivo.',
        conversion_failed: 'No hemos podido preparar ese avatar. El avatar actual no ha cambiado.',
        file_too_large: 'Elige una imagen de hasta 5 MB. El avatar actual no ha cambiado.',
        normalized_file_too_large: 'El avatar preparado sigue siendo demasiado grande. Prueba una imagen más simple.',
        unsupported_type: 'Elige una imagen JPG, PNG, GIF o WebP. El avatar actual no ha cambiado.',
      },
      sessionTitle: 'Sesión',
      sessionDescription: 'Cierra la sesión actual de PocketBase.',
      versionTitle: 'Versión',
    },
    addFlow: {
      title: 'Añadir',
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
      findCoverAction: 'Buscar portada',
      removeCoverAction: 'Quitar portada',
      coverLookupSearching: 'Buscando una portada…',
      coverLookupNotFound: 'No se ha encontrado ninguna portada. Puedes guardar sin ella.',
      coverFoundStatus: 'Portada lista para guardar',
      coverMatchedTitleLabel: 'Título encontrado:',
      coverProviderLabel: 'Proveedor:',
      coverPreviewAlt: 'Vista previa de la portada',
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
