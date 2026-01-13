import type { LanguageCode } from "./systemPrompts";

export interface SettingsLocale {
	// Main settings
	cliPath: string;
	cliPathDesc: string;
	assistantLanguage: string;
	assistantLanguageDesc: string;
	systemInstructions: string;
	systemInstructionsDesc: string;
	editButton: string;
	defaultModel: string;
	defaultModelDesc: string;
	deepThinking: string;
	deepThinkingDesc: string;

	// Permissions section
	agentPermissions: string;
	permissionsNote: string;
	webSearch: string;
	webSearchDesc: string;
	webFetch: string;
	webFetchDesc: string;
	subAgents: string;
	subAgentsDesc: string;

	// Slash Commands section
	slashCommands: string;
	slashCommandsNote: string;
	builtinCommands: string;
	customCommands: string;
	addCustomCommand: string;
	addCustomCommandDesc: string;
	addButton: string;
	deleteButton: string;

	// Getting Started section
	gettingStarted: string;
	step1Title: string;
	step1MacOS: string;
	step1Windows: string;
	step2Title: string;
	step3Title: string;
	step4Title: string;
	step4Note: string;
	step5Title: string;
	step5Note: string;
	step6Title: string;
	step6Note: string;
	step7Title: string;
	step7Note: string;
	step8Title: string;
	subscriptionNote: string;
	alreadyDoneButton: string;

	// Usage Statistics
	usageStatistics: string;
	today: string;
	week: string;
	month: string;

	// CLI Status
	checkingCli: string;
	cliFound: string;
	cliNotFound: string;
	installWith: string;
	refreshButton: string;

	// Command Modal
	editCommand: string;
	newCustomCommand: string;
	nameField: string;
	nameFieldDesc: string;
	namePlaceholder: string;
	commandField: string;
	commandFieldDesc: string;
	commandPlaceholder: string;
	descriptionField: string;
	descriptionFieldDesc: string;
	descriptionPlaceholder: string;
	promptField: string;
	promptFieldDesc: string;
	promptPlaceholder: string;
	cancelButton: string;
	saveButton: string;

	// CLAUDE.md Modal
	systemInstructionsTitle: string;
	systemInstructionsModalDesc: string;
	resetToDefaultButton: string;
	loadingPlaceholder: string;

	// Agents section
	agentsSection: string;
	addAgent: string;
	comingSoon: string;
	agentAlreadyExists: string;
	defaultAgent: string;
	defaultAgentDesc: string;
	agentSettingsTitle: string;
	settingsButton: string;

	// Codex-specific settings
	codexCliPath: string;
	codexCliPathDesc: string;
	codexSystemInstructions: string;
	codexSystemInstructionsDesc: string;
	codexDeepReasoning: string;
	codexDeepReasoningDesc: string;

	// Updated model description (no /model mention)
	defaultModelDescNoSlash: string;

	// Terminal integration
	startIntegration: string;
	openTerminal: string;
	integrationNote: string;

	// Account Limits
	accountLimits: string;
	checkLimits: string;
	loadingLimits: string;
	fiveHourLimit: string;
	weeklyLimit: string;
	opusLimit: string;
	sonnetLimit: string;
	resetsAt: string;
	resetsIn: string;
	days: string;
	hours: string;
	minutes: string;
	used: string;
	left: string;
	notAuthenticated: string;
	notAuthenticatedDesc: string;
	limitsError: string;
	loginToCli: string;

	// Delete integration
	dangerZone: string;
	deleteIntegration: string;
	deleteIntegrationDesc: string;
	confirmDeleteTitle: string;
	confirmDeleteMessage: string;

	// Model management
	availableModels: string;
	availableModelsDesc: string;
}

export const SETTINGS_LOCALES: Record<LanguageCode, SettingsLocale> = {
	ru: {
		// Main settings
		cliPath: "Путь к Claude CLI",
		cliPathDesc: "Путь к исполняемому файлу Claude Code CLI. Обычно просто 'claude', если установлен глобально.",
		assistantLanguage: "Язык ассистента",
		assistantLanguageDesc: "Язык ответов Claude и системных инструкций",
		systemInstructions: "Системные инструкции (CLAUDE.md)",
		systemInstructionsDesc: "Файл в корне хранилища, определяющий поведение Claude. Читается автоматически.",
		editButton: "Редактировать",
		defaultModel: "Модель по умолчанию",
		defaultModelDesc: "Модель Claude для новых чатов. Можно изменить командой /model.",
		deepThinking: "Режим глубокого мышления",
		deepThinkingDesc: "Включить расширенное мышление для новых чатов. Больше токенов, но глубже анализ.",

		// Permissions section
		agentPermissions: "Разрешения агента",
		permissionsNote: "Базовые возможности (всегда включены): чтение и редактирование заметок (.md, .canvas, .base). Bash-команды и доступ к папке .obsidian всегда заблокированы.",
		webSearch: "Веб-поиск",
		webSearchDesc: "Разрешить Claude искать информацию в интернете",
		webFetch: "Загрузка веб-страниц",
		webFetchDesc: "Разрешить Claude читать содержимое веб-страниц",
		subAgents: "Субагенты (Task)",
		subAgentsDesc: "Разрешить Claude запускать вспомогательных агентов для сложных задач",

		// Slash Commands section
		slashCommands: "Слеш-команды",
		slashCommandsNote: "Введите / в чате для просмотра доступных команд. Встроенные команды можно отключить. Также можно добавить свои команды.",
		builtinCommands: "Встроенные команды",
		customCommands: "Пользовательские команды",
		addCustomCommand: "Добавить команду",
		addCustomCommandDesc: "Создайте свою слеш-команду с пользовательским промптом",
		addButton: "Добавить",
		deleteButton: "Удалить",

		// Getting Started section
		gettingStarted: "Начало работы",
		step1Title: "Откройте Терминал",
		step1MacOS: "macOS: нажмите Cmd+Space, введите \"Terminal\", нажмите Enter",
		step1Windows: "Windows: нажмите Win+R, введите \"cmd\", нажмите Enter",
		step2Title: "Вставьте эту команду и нажмите Enter:",
		step3Title: "Дождитесь установки, затем введите:",
		step4Title: "Выберите способ входа:",
		step4Note: "Выберите \"Claude account (with active subscription)\"",
		step5Title: "Завершите авторизацию в браузере",
		step5Note: "Войдите в свой аккаунт Anthropic",
		step6Title: "Скопируйте код авторизации и вставьте в Терминал",
		step6Note: "После входа вы увидите код — вставьте его и нажмите Enter",
		step7Title: "Предоставьте все системные разрешения",
		step7Note: "Разрешите доступ при запросе системы",
		step8Title: "Вернитесь в Obsidian и начните общение!",
		subscriptionNote: "Требуется подписка Claude Pro ($20/мес) или Max ($100/мес).",
		alreadyDoneButton: "Готово",

		// Usage Statistics
		usageStatistics: "Статистика использования",
		today: "Сегодня:",
		week: "Неделя:",
		month: "Месяц:",

		// CLI Status
		checkingCli: "Проверка CLI...",
		cliFound: "CLI найден (v{version})",
		cliNotFound: "CLI не найден",
		installWith: "Установите: npm i -g @anthropic-ai/claude-code",
		refreshButton: "Обновить",

		// Command Modal
		editCommand: "Редактировать команду",
		newCustomCommand: "Новая команда",
		nameField: "Название",
		nameFieldDesc: "Отображаемое имя команды",
		namePlaceholder: "Моя команда",
		commandField: "Команда",
		commandFieldDesc: "Триггер команды (напр., /mycommand)",
		commandPlaceholder: "/команда",
		descriptionField: "Описание",
		descriptionFieldDesc: "Краткое описание для автодополнения",
		descriptionPlaceholder: "Что делает эта команда",
		promptField: "Промпт",
		promptFieldDesc: "Промпт для Claude. Используйте {arg} для аргументов (напр., '/команда привет' заменит {arg} на 'привет')",
		promptPlaceholder: "Введите промпт...",
		cancelButton: "Отмена",
		saveButton: "Сохранить",

		// CLAUDE.md Modal
		systemInstructionsTitle: "Системные инструкции",
		systemInstructionsModalDesc: "Этот файл (CLAUDE.md) находится в корне хранилища. Claude читает его автоматически перед каждым разговором.",
		resetToDefaultButton: "Сбросить по умолчанию",
		loadingPlaceholder: "Загрузка...",

		// Agents section
		agentsSection: "Агенты Cristal",
		addAgent: "Добавить агента",
		comingSoon: "Скоро",
		agentAlreadyExists: "Уже добавлен",
		defaultAgent: "Агент по умолчанию",
		defaultAgentDesc: "Какой агент использовать по умолчанию для новых чатов",
		agentSettingsTitle: "Настройки",
		settingsButton: "Настройки",

		// Codex-specific settings
		codexCliPath: "Путь к Codex CLI",
		codexCliPathDesc: "Путь к исполняемому файлу Codex CLI. Обычно просто 'codex', если установлен глобально.",
		codexSystemInstructions: "Системные инструкции (AGENT.md)",
		codexSystemInstructionsDesc: "Файл в корне хранилища, определяющий поведение Codex. Читается автоматически.",
		codexDeepReasoning: "Глубокое мышление",
		codexDeepReasoningDesc: "Включить расширенное мышление (режим Extra High)",

		// Updated model description
		defaultModelDescNoSlash: "Модель для новых чатов.",

		// Terminal integration
		startIntegration: "Начать интеграцию",
		openTerminal: "Открыть терминал",
		integrationNote: "Откроет терминал и начнёт установку CLI",

		// Account Limits
		accountLimits: "Лимиты аккаунта",
		checkLimits: "Проверить лимиты",
		loadingLimits: "Загрузка...",
		fiveHourLimit: "5-часовой лимит",
		weeklyLimit: "Недельный лимит",
		opusLimit: "Opus лимит",
		sonnetLimit: "Sonnet лимит",
		resetsAt: "Сброс:",
		resetsIn: "через",
		days: "д",
		hours: "ч",
		minutes: "мин",
		used: "использовано",
		left: "осталось",
		notAuthenticated: "Не авторизован",
		notAuthenticatedDesc: "Войдите в CLI для просмотра лимитов",
		limitsError: "Ошибка получения лимитов",
		loginToCli: "Войти в CLI",
		dangerZone: "Опасная зона",
		deleteIntegration: "Удалить эту интеграцию",
		deleteIntegrationDesc: "Это удалит агента из настроек. Действие нельзя отменить.",
		confirmDeleteTitle: "Удалить интеграцию?",
		confirmDeleteMessage: "Вы уверены, что хотите удалить",

		// Model management
		availableModels: "Доступные модели",
		availableModelsDesc: "Отключите модели, которые не хотите использовать"
	},

	en: {
		// Main settings
		cliPath: "Claude CLI path",
		cliPathDesc: "Path to the Claude Code CLI executable. Usually just 'claude' if installed globally.",
		assistantLanguage: "Assistant language",
		assistantLanguageDesc: "Language for Claude's responses and system instructions",
		systemInstructions: "System Instructions (CLAUDE.md)",
		systemInstructionsDesc: "A file in your vault root that defines how Claude behaves. Claude reads it automatically.",
		editButton: "Edit",
		defaultModel: "Default model",
		defaultModelDesc: "Claude model used for new chats. Can be changed with /model command.",
		deepThinking: "Deep thinking mode",
		deepThinkingDesc: "Enable extended thinking for new chats. Uses more tokens but provides deeper analysis.",

		// Permissions section
		agentPermissions: "Agent Permissions",
		permissionsNote: "Basic capabilities (always enabled): Reading and editing notes (.md, .canvas, .base). Bash commands and .obsidian folder access are always blocked.",
		webSearch: "Web Search",
		webSearchDesc: "Allow Claude to search the internet for information",
		webFetch: "Web Fetch",
		webFetchDesc: "Allow Claude to read content from web pages",
		subAgents: "Sub-agents (Task)",
		subAgentsDesc: "Allow Claude to launch helper agents for complex tasks",

		// Slash Commands section
		slashCommands: "Slash Commands",
		slashCommandsNote: "Type / in chat to see available commands. Built-in commands can be disabled. You can also add custom commands.",
		builtinCommands: "Built-in Commands",
		customCommands: "Custom Commands",
		addCustomCommand: "Add custom command",
		addCustomCommandDesc: "Create your own slash command with a custom prompt",
		addButton: "Add",
		deleteButton: "Delete",

		// Getting Started section
		gettingStarted: "Getting Started",
		step1Title: "Open Terminal app",
		step1MacOS: "macOS: press Cmd+Space, type \"Terminal\", press Enter",
		step1Windows: "Windows: press Win+R, type \"cmd\", press Enter",
		step2Title: "Paste this command and press Enter:",
		step3Title: "Wait for installation, then type:",
		step4Title: "Choose login method:",
		step4Note: "Select \"Claude account (with active subscription)\"",
		step5Title: "Complete authentication in browser",
		step5Note: "Log in with your Anthropic account",
		step6Title: "Copy the auth code and paste it in Terminal",
		step6Note: "You'll see a code after login — paste it and press Enter",
		step7Title: "Grant all system permissions",
		step7Note: "Allow access when prompted by your system",
		step8Title: "Return to Obsidian and start chatting!",
		subscriptionNote: "Requires Claude Pro ($20/mo) or Max ($100/mo) subscription.",
		alreadyDoneButton: "Already Done",

		// Usage Statistics
		usageStatistics: "Usage statistics",
		today: "Today:",
		week: "Week:",
		month: "Month:",

		// CLI Status
		checkingCli: "Checking CLI...",
		cliFound: "CLI found (v{version})",
		cliNotFound: "CLI not found",
		installWith: "Install with: npm i -g @anthropic-ai/claude-code",
		refreshButton: "Refresh",

		// Command Modal
		editCommand: "Edit Command",
		newCustomCommand: "New Custom Command",
		nameField: "Name",
		nameFieldDesc: "Display name for the command",
		namePlaceholder: "My Command",
		commandField: "Command",
		commandFieldDesc: "The slash command trigger (e.g., /mycommand)",
		commandPlaceholder: "/mycommand",
		descriptionField: "Description",
		descriptionFieldDesc: "Short description shown in autocomplete",
		descriptionPlaceholder: "What this command does",
		promptField: "Prompt",
		promptFieldDesc: "The prompt to send to Claude. Use {arg} for command arguments (e.g., '/mycommand hello' would replace {arg} with 'hello')",
		promptPlaceholder: "Enter the prompt...",
		cancelButton: "Cancel",
		saveButton: "Save",

		// CLAUDE.md Modal
		systemInstructionsTitle: "System Instructions",
		systemInstructionsModalDesc: "This file (CLAUDE.md) is located in your vault root. Claude reads it automatically before each conversation.",
		resetToDefaultButton: "Reset to default",
		loadingPlaceholder: "Loading...",

		// Agents section
		agentsSection: "Cristal Agents",
		addAgent: "Add agent",
		comingSoon: "Coming soon",
		agentAlreadyExists: "Already added",
		defaultAgent: "Default agent",
		defaultAgentDesc: "Which agent to use by default for new chats",
		agentSettingsTitle: "Settings",
		settingsButton: "Settings",

		// Codex-specific settings
		codexCliPath: "Codex CLI path",
		codexCliPathDesc: "Path to the Codex CLI executable. Usually just 'codex' if installed globally.",
		codexSystemInstructions: "System Instructions (AGENT.md)",
		codexSystemInstructionsDesc: "A file in your vault root that defines how Codex behaves. Read automatically.",
		codexDeepReasoning: "Deep thinking",
		codexDeepReasoningDesc: "Enable extended thinking (Extra High mode)",

		// Updated model description
		defaultModelDescNoSlash: "Model used for new chats.",

		// Terminal integration
		startIntegration: "Start Integration",
		openTerminal: "Open Terminal",
		integrationNote: "Opens terminal and starts CLI installation",

		// Account Limits
		accountLimits: "Account limits",
		checkLimits: "Check limits",
		loadingLimits: "Loading...",
		fiveHourLimit: "5-hour limit",
		weeklyLimit: "Weekly limit",
		opusLimit: "Opus limit",
		sonnetLimit: "Sonnet limit",
		resetsAt: "Resets:",
		resetsIn: "in",
		days: "d",
		hours: "h",
		minutes: "min",
		used: "used",
		left: "left",
		notAuthenticated: "Not authenticated",
		notAuthenticatedDesc: "Log in to CLI to view limits",
		limitsError: "Failed to fetch limits",
		loginToCli: "Log in to CLI",
		dangerZone: "Danger Zone",
		deleteIntegration: "Delete this integration",
		deleteIntegrationDesc: "This will remove the agent from your settings. This action cannot be undone.",
		confirmDeleteTitle: "Delete Integration?",
		confirmDeleteMessage: "Are you sure you want to delete",

		// Model management
		availableModels: "Available Models",
		availableModelsDesc: "Disable models you don't want to use"
	},

	fr: {
		// Main settings
		cliPath: "Chemin du CLI Claude",
		cliPathDesc: "Chemin vers l'exécutable Claude Code CLI. Généralement juste 'claude' s'il est installé globalement.",
		assistantLanguage: "Langue de l'assistant",
		assistantLanguageDesc: "Langue des réponses de Claude et des instructions système",
		systemInstructions: "Instructions système (CLAUDE.md)",
		systemInstructionsDesc: "Un fichier à la racine de votre coffre qui définit le comportement de Claude. Lu automatiquement.",
		editButton: "Modifier",
		defaultModel: "Modèle par défaut",
		defaultModelDesc: "Modèle Claude utilisé pour les nouveaux chats. Peut être changé avec la commande /model.",
		deepThinking: "Mode de réflexion approfondie",
		deepThinkingDesc: "Activer la réflexion étendue pour les nouveaux chats. Utilise plus de tokens mais offre une analyse plus profonde.",

		// Permissions section
		agentPermissions: "Permissions de l'agent",
		permissionsNote: "Capacités de base (toujours activées): Lecture et édition de notes (.md, .canvas, .base). Les commandes Bash et l'accès au dossier .obsidian sont toujours bloqués.",
		webSearch: "Recherche Web",
		webSearchDesc: "Autoriser Claude à chercher des informations sur internet",
		webFetch: "Récupération Web",
		webFetchDesc: "Autoriser Claude à lire le contenu des pages web",
		subAgents: "Sous-agents (Task)",
		subAgentsDesc: "Autoriser Claude à lancer des agents auxiliaires pour les tâches complexes",

		// Slash Commands section
		slashCommands: "Commandes Slash",
		slashCommandsNote: "Tapez / dans le chat pour voir les commandes disponibles. Les commandes intégrées peuvent être désactivées. Vous pouvez aussi ajouter des commandes personnalisées.",
		builtinCommands: "Commandes intégrées",
		customCommands: "Commandes personnalisées",
		addCustomCommand: "Ajouter une commande",
		addCustomCommandDesc: "Créez votre propre commande slash avec un prompt personnalisé",
		addButton: "Ajouter",
		deleteButton: "Supprimer",

		// Getting Started section
		gettingStarted: "Démarrage",
		step1Title: "Ouvrez l'application Terminal",
		step1MacOS: "macOS: appuyez sur Cmd+Espace, tapez \"Terminal\", appuyez sur Entrée",
		step1Windows: "Windows: appuyez sur Win+R, tapez \"cmd\", appuyez sur Entrée",
		step2Title: "Collez cette commande et appuyez sur Entrée:",
		step3Title: "Attendez l'installation, puis tapez:",
		step4Title: "Choisissez la méthode de connexion:",
		step4Note: "Sélectionnez \"Claude account (with active subscription)\"",
		step5Title: "Complétez l'authentification dans le navigateur",
		step5Note: "Connectez-vous avec votre compte Anthropic",
		step6Title: "Copiez le code d'authentification et collez-le dans Terminal",
		step6Note: "Vous verrez un code après la connexion — collez-le et appuyez sur Entrée",
		step7Title: "Accordez toutes les permissions système",
		step7Note: "Autorisez l'accès lorsque votre système le demande",
		step8Title: "Retournez dans Obsidian et commencez à discuter!",
		subscriptionNote: "Nécessite un abonnement Claude Pro (20$/mois) ou Max (100$/mois).",
		alreadyDoneButton: "Déjà fait",

		// Usage Statistics
		usageStatistics: "Statistiques d'utilisation",
		today: "Aujourd'hui:",
		week: "Semaine:",
		month: "Mois:",

		// CLI Status
		checkingCli: "Vérification du CLI...",
		cliFound: "CLI trouvé (v{version})",
		cliNotFound: "CLI non trouvé",
		installWith: "Installer avec: npm i -g @anthropic-ai/claude-code",
		refreshButton: "Actualiser",

		// Command Modal
		editCommand: "Modifier la commande",
		newCustomCommand: "Nouvelle commande personnalisée",
		nameField: "Nom",
		nameFieldDesc: "Nom affiché pour la commande",
		namePlaceholder: "Ma commande",
		commandField: "Commande",
		commandFieldDesc: "Le déclencheur de la commande slash (ex: /macommande)",
		commandPlaceholder: "/macommande",
		descriptionField: "Description",
		descriptionFieldDesc: "Courte description affichée dans l'autocomplétion",
		descriptionPlaceholder: "Ce que fait cette commande",
		promptField: "Prompt",
		promptFieldDesc: "Le prompt à envoyer à Claude. Utilisez {arg} pour les arguments (ex: '/macommande bonjour' remplacera {arg} par 'bonjour')",
		promptPlaceholder: "Entrez le prompt...",
		cancelButton: "Annuler",
		saveButton: "Sauvegarder",

		// CLAUDE.md Modal
		systemInstructionsTitle: "Instructions système",
		systemInstructionsModalDesc: "Ce fichier (CLAUDE.md) se trouve à la racine de votre coffre. Claude le lit automatiquement avant chaque conversation.",
		resetToDefaultButton: "Réinitialiser par défaut",
		loadingPlaceholder: "Chargement...",

		// Agents section
		agentsSection: "Agents Cristal",
		addAgent: "Ajouter un agent",
		comingSoon: "Bientôt",
		agentAlreadyExists: "Déjà ajouté",
		defaultAgent: "Agent par défaut",
		defaultAgentDesc: "Quel agent utiliser par défaut pour les nouveaux chats",
		agentSettingsTitle: "Paramètres",
		settingsButton: "Paramètres",

		// Codex-specific settings
		codexCliPath: "Chemin du CLI Codex",
		codexCliPathDesc: "Chemin vers l'exécutable Codex CLI. Généralement juste 'codex' s'il est installé globalement.",
		codexSystemInstructions: "Instructions système (AGENT.md)",
		codexSystemInstructionsDesc: "Un fichier à la racine de votre coffre qui définit le comportement de Codex. Lu automatiquement.",
		codexDeepReasoning: "Réflexion approfondie",
		codexDeepReasoningDesc: "Activer la réflexion étendue (mode Extra High)",

		// Updated model description
		defaultModelDescNoSlash: "Modèle utilisé pour les nouveaux chats.",

		// Terminal integration
		startIntegration: "Démarrer l'intégration",
		openTerminal: "Ouvrir le terminal",
		integrationNote: "Ouvre le terminal et démarre l'installation du CLI",

		// Account Limits
		accountLimits: "Limites du compte",
		checkLimits: "Vérifier les limites",
		loadingLimits: "Chargement...",
		fiveHourLimit: "Limite 5 heures",
		weeklyLimit: "Limite hebdomadaire",
		opusLimit: "Limite Opus",
		sonnetLimit: "Limite Sonnet",
		resetsAt: "Réinitialisation:",
		resetsIn: "dans",
		days: "j",
		hours: "h",
		minutes: "min",
		used: "utilisé",
		left: "restant",
		notAuthenticated: "Non authentifié",
		notAuthenticatedDesc: "Connectez-vous au CLI pour voir les limites",
		limitsError: "Échec de récupération des limites",
		loginToCli: "Se connecter au CLI",
		dangerZone: "Zone dangereuse",
		deleteIntegration: "Supprimer cette intégration",
		deleteIntegrationDesc: "Cela supprimera l'agent de vos paramètres. Cette action est irréversible.",
		confirmDeleteTitle: "Supprimer l'intégration ?",
		confirmDeleteMessage: "Êtes-vous sûr de vouloir supprimer",

		// Model management
		availableModels: "Modèles disponibles",
		availableModelsDesc: "Désactivez les modèles que vous ne souhaitez pas utiliser"
	},

	de: {
		// Main settings
		cliPath: "Claude CLI Pfad",
		cliPathDesc: "Pfad zur Claude Code CLI ausführbaren Datei. Normalerweise nur 'claude', wenn global installiert.",
		assistantLanguage: "Assistentensprache",
		assistantLanguageDesc: "Sprache für Claudes Antworten und Systemanweisungen",
		systemInstructions: "Systemanweisungen (CLAUDE.md)",
		systemInstructionsDesc: "Eine Datei im Wurzelverzeichnis Ihres Tresors, die das Verhalten von Claude definiert. Wird automatisch gelesen.",
		editButton: "Bearbeiten",
		defaultModel: "Standardmodell",
		defaultModelDesc: "Claude-Modell für neue Chats. Kann mit /model Befehl geändert werden.",
		deepThinking: "Tiefes Denken Modus",
		deepThinkingDesc: "Erweitertes Denken für neue Chats aktivieren. Verbraucht mehr Tokens, bietet aber tiefere Analyse.",

		// Permissions section
		agentPermissions: "Agent-Berechtigungen",
		permissionsNote: "Grundfunktionen (immer aktiviert): Lesen und Bearbeiten von Notizen (.md, .canvas, .base). Bash-Befehle und .obsidian Ordnerzugriff sind immer blockiert.",
		webSearch: "Websuche",
		webSearchDesc: "Claude erlauben, im Internet nach Informationen zu suchen",
		webFetch: "Web-Abruf",
		webFetchDesc: "Claude erlauben, Inhalte von Webseiten zu lesen",
		subAgents: "Unteragenten (Task)",
		subAgentsDesc: "Claude erlauben, Hilfsagenten für komplexe Aufgaben zu starten",

		// Slash Commands section
		slashCommands: "Slash-Befehle",
		slashCommandsNote: "Tippen Sie / im Chat, um verfügbare Befehle zu sehen. Eingebaute Befehle können deaktiviert werden. Sie können auch eigene Befehle hinzufügen.",
		builtinCommands: "Eingebaute Befehle",
		customCommands: "Eigene Befehle",
		addCustomCommand: "Befehl hinzufügen",
		addCustomCommandDesc: "Erstellen Sie Ihren eigenen Slash-Befehl mit einem benutzerdefinierten Prompt",
		addButton: "Hinzufügen",
		deleteButton: "Löschen",

		// Getting Started section
		gettingStarted: "Erste Schritte",
		step1Title: "Terminal-App öffnen",
		step1MacOS: "macOS: Cmd+Leertaste drücken, \"Terminal\" eingeben, Enter drücken",
		step1Windows: "Windows: Win+R drücken, \"cmd\" eingeben, Enter drücken",
		step2Title: "Diesen Befehl einfügen und Enter drücken:",
		step3Title: "Installation abwarten, dann eingeben:",
		step4Title: "Anmeldemethode wählen:",
		step4Note: "\"Claude account (with active subscription)\" auswählen",
		step5Title: "Authentifizierung im Browser abschließen",
		step5Note: "Mit Ihrem Anthropic-Konto anmelden",
		step6Title: "Auth-Code kopieren und im Terminal einfügen",
		step6Note: "Nach der Anmeldung sehen Sie einen Code — einfügen und Enter drücken",
		step7Title: "Alle Systemberechtigungen gewähren",
		step7Note: "Zugriff erlauben, wenn Ihr System danach fragt",
		step8Title: "Zu Obsidian zurückkehren und mit dem Chatten beginnen!",
		subscriptionNote: "Erfordert Claude Pro (20$/Monat) oder Max (100$/Monat) Abonnement.",
		alreadyDoneButton: "Bereits erledigt",

		// Usage Statistics
		usageStatistics: "Nutzungsstatistiken",
		today: "Heute:",
		week: "Woche:",
		month: "Monat:",

		// CLI Status
		checkingCli: "CLI wird überprüft...",
		cliFound: "CLI gefunden (v{version})",
		cliNotFound: "CLI nicht gefunden",
		installWith: "Installieren mit: npm i -g @anthropic-ai/claude-code",
		refreshButton: "Aktualisieren",

		// Command Modal
		editCommand: "Befehl bearbeiten",
		newCustomCommand: "Neuer benutzerdefinierter Befehl",
		nameField: "Name",
		nameFieldDesc: "Anzeigename für den Befehl",
		namePlaceholder: "Mein Befehl",
		commandField: "Befehl",
		commandFieldDesc: "Der Slash-Befehl-Auslöser (z.B. /meinbefehl)",
		commandPlaceholder: "/meinbefehl",
		descriptionField: "Beschreibung",
		descriptionFieldDesc: "Kurze Beschreibung in der Autovervollständigung",
		descriptionPlaceholder: "Was dieser Befehl macht",
		promptField: "Prompt",
		promptFieldDesc: "Der Prompt, der an Claude gesendet wird. Verwenden Sie {arg} für Befehlsargumente (z.B. ersetzt '/meinbefehl hallo' {arg} durch 'hallo')",
		promptPlaceholder: "Prompt eingeben...",
		cancelButton: "Abbrechen",
		saveButton: "Speichern",

		// CLAUDE.md Modal
		systemInstructionsTitle: "Systemanweisungen",
		systemInstructionsModalDesc: "Diese Datei (CLAUDE.md) befindet sich im Wurzelverzeichnis Ihres Tresors. Claude liest sie automatisch vor jedem Gespräch.",
		resetToDefaultButton: "Auf Standard zurücksetzen",
		loadingPlaceholder: "Laden...",

		// Agents section
		agentsSection: "Cristal Agenten",
		addAgent: "Agent hinzufügen",
		comingSoon: "Demnächst",
		agentAlreadyExists: "Bereits hinzugefügt",
		defaultAgent: "Standard-Agent",
		defaultAgentDesc: "Welcher Agent standardmäßig für neue Chats verwendet werden soll",
		agentSettingsTitle: "Einstellungen",
		settingsButton: "Einstellungen",

		// Codex-specific settings
		codexCliPath: "Codex CLI Pfad",
		codexCliPathDesc: "Pfad zur Codex CLI ausführbaren Datei. Normalerweise nur 'codex', wenn global installiert.",
		codexSystemInstructions: "Systemanweisungen (AGENT.md)",
		codexSystemInstructionsDesc: "Eine Datei im Wurzelverzeichnis Ihres Tresors, die das Verhalten von Codex definiert. Wird automatisch gelesen.",
		codexDeepReasoning: "Tiefes Denken",
		codexDeepReasoningDesc: "Erweitertes Denken aktivieren (Extra High Modus)",

		// Updated model description
		defaultModelDescNoSlash: "Modell für neue Chats.",

		// Terminal integration
		startIntegration: "Integration starten",
		openTerminal: "Terminal öffnen",
		integrationNote: "Öffnet das Terminal und startet die CLI-Installation",

		// Account Limits
		accountLimits: "Kontolimits",
		checkLimits: "Limits prüfen",
		loadingLimits: "Laden...",
		fiveHourLimit: "5-Stunden-Limit",
		weeklyLimit: "Wochenlimit",
		opusLimit: "Opus-Limit",
		sonnetLimit: "Sonnet-Limit",
		resetsAt: "Zurücksetzen:",
		resetsIn: "in",
		days: "T",
		hours: "Std",
		minutes: "Min",
		used: "verwendet",
		left: "übrig",
		notAuthenticated: "Nicht authentifiziert",
		notAuthenticatedDesc: "Melden Sie sich beim CLI an, um Limits anzuzeigen",
		limitsError: "Limits konnten nicht abgerufen werden",
		loginToCli: "Beim CLI anmelden",
		dangerZone: "Gefahrenzone",
		deleteIntegration: "Diese Integration löschen",
		deleteIntegrationDesc: "Dies entfernt den Agenten aus Ihren Einstellungen. Diese Aktion kann nicht rückgängig gemacht werden.",
		confirmDeleteTitle: "Integration löschen?",
		confirmDeleteMessage: "Sind Sie sicher, dass Sie löschen möchten",

		// Model management
		availableModels: "Verfügbare Modelle",
		availableModelsDesc: "Deaktivieren Sie Modelle, die Sie nicht verwenden möchten"
	},

	es: {
		// Main settings
		cliPath: "Ruta del CLI de Claude",
		cliPathDesc: "Ruta al ejecutable de Claude Code CLI. Normalmente solo 'claude' si está instalado globalmente.",
		assistantLanguage: "Idioma del asistente",
		assistantLanguageDesc: "Idioma para las respuestas de Claude e instrucciones del sistema",
		systemInstructions: "Instrucciones del sistema (CLAUDE.md)",
		systemInstructionsDesc: "Un archivo en la raíz de tu bóveda que define cómo se comporta Claude. Se lee automáticamente.",
		editButton: "Editar",
		defaultModel: "Modelo predeterminado",
		defaultModelDesc: "Modelo de Claude usado para nuevos chats. Se puede cambiar con el comando /model.",
		deepThinking: "Modo de pensamiento profundo",
		deepThinkingDesc: "Habilitar pensamiento extendido para nuevos chats. Usa más tokens pero proporciona un análisis más profundo.",

		// Permissions section
		agentPermissions: "Permisos del agente",
		permissionsNote: "Capacidades básicas (siempre habilitadas): Lectura y edición de notas (.md, .canvas, .base). Los comandos Bash y el acceso a la carpeta .obsidian están siempre bloqueados.",
		webSearch: "Búsqueda web",
		webSearchDesc: "Permitir que Claude busque información en internet",
		webFetch: "Obtención web",
		webFetchDesc: "Permitir que Claude lea contenido de páginas web",
		subAgents: "Subagentes (Task)",
		subAgentsDesc: "Permitir que Claude lance agentes auxiliares para tareas complejas",

		// Slash Commands section
		slashCommands: "Comandos Slash",
		slashCommandsNote: "Escribe / en el chat para ver los comandos disponibles. Los comandos integrados se pueden deshabilitar. También puedes agregar comandos personalizados.",
		builtinCommands: "Comandos integrados",
		customCommands: "Comandos personalizados",
		addCustomCommand: "Agregar comando",
		addCustomCommandDesc: "Crea tu propio comando slash con un prompt personalizado",
		addButton: "Agregar",
		deleteButton: "Eliminar",

		// Getting Started section
		gettingStarted: "Primeros pasos",
		step1Title: "Abrir la aplicación Terminal",
		step1MacOS: "macOS: presiona Cmd+Espacio, escribe \"Terminal\", presiona Enter",
		step1Windows: "Windows: presiona Win+R, escribe \"cmd\", presiona Enter",
		step2Title: "Pega este comando y presiona Enter:",
		step3Title: "Espera la instalación, luego escribe:",
		step4Title: "Elige el método de inicio de sesión:",
		step4Note: "Selecciona \"Claude account (with active subscription)\"",
		step5Title: "Completa la autenticación en el navegador",
		step5Note: "Inicia sesión con tu cuenta de Anthropic",
		step6Title: "Copia el código de autenticación y pégalo en Terminal",
		step6Note: "Verás un código después de iniciar sesión — pégalo y presiona Enter",
		step7Title: "Otorga todos los permisos del sistema",
		step7Note: "Permite el acceso cuando tu sistema lo solicite",
		step8Title: "¡Vuelve a Obsidian y comienza a chatear!",
		subscriptionNote: "Requiere suscripción Claude Pro ($20/mes) o Max ($100/mes).",
		alreadyDoneButton: "Ya hecho",

		// Usage Statistics
		usageStatistics: "Estadísticas de uso",
		today: "Hoy:",
		week: "Semana:",
		month: "Mes:",

		// CLI Status
		checkingCli: "Verificando CLI...",
		cliFound: "CLI encontrado (v{version})",
		cliNotFound: "CLI no encontrado",
		installWith: "Instalar con: npm i -g @anthropic-ai/claude-code",
		refreshButton: "Actualizar",

		// Command Modal
		editCommand: "Editar comando",
		newCustomCommand: "Nuevo comando personalizado",
		nameField: "Nombre",
		nameFieldDesc: "Nombre a mostrar para el comando",
		namePlaceholder: "Mi comando",
		commandField: "Comando",
		commandFieldDesc: "El activador del comando slash (ej: /micomando)",
		commandPlaceholder: "/micomando",
		descriptionField: "Descripción",
		descriptionFieldDesc: "Descripción corta mostrada en el autocompletado",
		descriptionPlaceholder: "Qué hace este comando",
		promptField: "Prompt",
		promptFieldDesc: "El prompt a enviar a Claude. Usa {arg} para argumentos del comando (ej: '/micomando hola' reemplazará {arg} con 'hola')",
		promptPlaceholder: "Ingresa el prompt...",
		cancelButton: "Cancelar",
		saveButton: "Guardar",

		// CLAUDE.md Modal
		systemInstructionsTitle: "Instrucciones del sistema",
		systemInstructionsModalDesc: "Este archivo (CLAUDE.md) está ubicado en la raíz de tu bóveda. Claude lo lee automáticamente antes de cada conversación.",
		resetToDefaultButton: "Restablecer por defecto",
		loadingPlaceholder: "Cargando...",

		// Agents section
		agentsSection: "Agentes de Cristal",
		addAgent: "Agregar agente",
		comingSoon: "Próximamente",
		agentAlreadyExists: "Ya agregado",
		defaultAgent: "Agente predeterminado",
		defaultAgentDesc: "Qué agente usar por defecto para nuevos chats",
		agentSettingsTitle: "Configuración",
		settingsButton: "Configuración",

		// Codex-specific settings
		codexCliPath: "Ruta del CLI de Codex",
		codexCliPathDesc: "Ruta al ejecutable de Codex CLI. Normalmente solo 'codex' si está instalado globalmente.",
		codexSystemInstructions: "Instrucciones del sistema (AGENT.md)",
		codexSystemInstructionsDesc: "Un archivo en la raíz de tu bóveda que define cómo se comporta Codex. Se lee automáticamente.",
		codexDeepReasoning: "Pensamiento profundo",
		codexDeepReasoningDesc: "Habilitar pensamiento extendido (modo Extra High)",

		// Updated model description
		defaultModelDescNoSlash: "Modelo usado para nuevos chats.",

		// Terminal integration
		startIntegration: "Iniciar integración",
		openTerminal: "Abrir terminal",
		integrationNote: "Abre el terminal e inicia la instalación del CLI",

		// Account Limits
		accountLimits: "Límites de cuenta",
		checkLimits: "Verificar límites",
		loadingLimits: "Cargando...",
		fiveHourLimit: "Límite de 5 horas",
		weeklyLimit: "Límite semanal",
		opusLimit: "Límite Opus",
		sonnetLimit: "Límite Sonnet",
		resetsAt: "Se reinicia:",
		resetsIn: "en",
		days: "d",
		hours: "h",
		minutes: "min",
		used: "usado",
		left: "restante",
		notAuthenticated: "No autenticado",
		notAuthenticatedDesc: "Inicia sesión en CLI para ver los límites",
		limitsError: "Error al obtener límites",
		loginToCli: "Iniciar sesión en CLI",

		// Delete integration
		dangerZone: "Zona de peligro",
		deleteIntegration: "Eliminar esta integración",
		deleteIntegrationDesc: "Esto eliminará el agente de tu configuración. Esta acción no se puede deshacer.",
		confirmDeleteTitle: "¿Eliminar integración?",
		confirmDeleteMessage: "¿Estás seguro de que quieres eliminar",

		// Model management
		availableModels: "Modelos disponibles",
		availableModelsDesc: "Desactiva los modelos que no quieras usar"
	},

	hi: {
		// Main settings
		cliPath: "Claude CLI पथ",
		cliPathDesc: "Claude Code CLI निष्पादन योग्य फ़ाइल का पथ। आमतौर पर बस 'claude' अगर विश्व स्तर पर स्थापित है।",
		assistantLanguage: "सहायक भाषा",
		assistantLanguageDesc: "Claude की प्रतिक्रियाओं और सिस्टम निर्देशों के लिए भाषा",
		systemInstructions: "सिस्टम निर्देश (CLAUDE.md)",
		systemInstructionsDesc: "आपके वॉल्ट रूट में एक फ़ाइल जो Claude के व्यवहार को परिभाषित करती है। स्वचालित रूप से पढ़ा जाता है।",
		editButton: "संपादित करें",
		defaultModel: "डिफ़ॉल्ट मॉडल",
		defaultModelDesc: "नई चैट के लिए उपयोग किया जाने वाला Claude मॉडल। /model कमांड से बदल सकते हैं।",
		deepThinking: "गहन सोच मोड",
		deepThinkingDesc: "नई चैट के लिए विस्तारित सोच सक्षम करें। अधिक टोकन का उपयोग करता है लेकिन गहरा विश्लेषण प्रदान करता है।",

		// Permissions section
		agentPermissions: "एजेंट अनुमतियाँ",
		permissionsNote: "बुनियादी क्षमताएं (हमेशा सक्षम): नोट्स पढ़ना और संपादित करना (.md, .canvas, .base)। Bash कमांड और .obsidian फ़ोल्डर एक्सेस हमेशा अवरुद्ध हैं।",
		webSearch: "वेब खोज",
		webSearchDesc: "Claude को इंटरनेट पर जानकारी खोजने की अनुमति दें",
		webFetch: "वेब फ़ेच",
		webFetchDesc: "Claude को वेब पेजों की सामग्री पढ़ने की अनुमति दें",
		subAgents: "उप-एजेंट (Task)",
		subAgentsDesc: "Claude को जटिल कार्यों के लिए सहायक एजेंट लॉन्च करने की अनुमति दें",

		// Slash Commands section
		slashCommands: "स्लैश कमांड",
		slashCommandsNote: "उपलब्ध कमांड देखने के लिए चैट में / टाइप करें। बिल्ट-इन कमांड अक्षम किए जा सकते हैं। आप कस्टम कमांड भी जोड़ सकते हैं।",
		builtinCommands: "बिल्ट-इन कमांड",
		customCommands: "कस्टम कमांड",
		addCustomCommand: "कमांड जोड़ें",
		addCustomCommandDesc: "कस्टम प्रॉम्प्ट के साथ अपना स्लैश कमांड बनाएं",
		addButton: "जोड़ें",
		deleteButton: "हटाएं",

		// Getting Started section
		gettingStarted: "शुरुआत करें",
		step1Title: "Terminal ऐप खोलें",
		step1MacOS: "macOS: Cmd+Space दबाएं, \"Terminal\" टाइप करें, Enter दबाएं",
		step1Windows: "Windows: Win+R दबाएं, \"cmd\" टाइप करें, Enter दबाएं",
		step2Title: "यह कमांड पेस्ट करें और Enter दबाएं:",
		step3Title: "इंस्टॉलेशन की प्रतीक्षा करें, फिर टाइप करें:",
		step4Title: "लॉगिन विधि चुनें:",
		step4Note: "\"Claude account (with active subscription)\" चुनें",
		step5Title: "ब्राउज़र में प्रमाणीकरण पूरा करें",
		step5Note: "अपने Anthropic खाते से लॉग इन करें",
		step6Title: "ऑथ कोड कॉपी करें और Terminal में पेस्ट करें",
		step6Note: "लॉगिन के बाद आपको एक कोड दिखाई देगा — इसे पेस्ट करें और Enter दबाएं",
		step7Title: "सभी सिस्टम अनुमतियां प्रदान करें",
		step7Note: "जब आपका सिस्टम पूछे तो एक्सेस की अनुमति दें",
		step8Title: "Obsidian पर वापस आएं और चैट शुरू करें!",
		subscriptionNote: "Claude Pro ($20/माह) या Max ($100/माह) सदस्यता आवश्यक है।",
		alreadyDoneButton: "पहले से हो गया",

		// Usage Statistics
		usageStatistics: "उपयोग सांख्यिकी",
		today: "आज:",
		week: "सप्ताह:",
		month: "महीना:",

		// CLI Status
		checkingCli: "CLI जाँच रहे हैं...",
		cliFound: "CLI मिला (v{version})",
		cliNotFound: "CLI नहीं मिला",
		installWith: "इंस्टॉल करें: npm i -g @anthropic-ai/claude-code",
		refreshButton: "रिफ्रेश",

		// Command Modal
		editCommand: "कमांड संपादित करें",
		newCustomCommand: "नया कस्टम कमांड",
		nameField: "नाम",
		nameFieldDesc: "कमांड के लिए प्रदर्शन नाम",
		namePlaceholder: "मेरा कमांड",
		commandField: "कमांड",
		commandFieldDesc: "स्लैश कमांड ट्रिगर (जैसे, /mycommand)",
		commandPlaceholder: "/mycommand",
		descriptionField: "विवरण",
		descriptionFieldDesc: "ऑटोकम्पलीट में दिखाया जाने वाला संक्षिप्त विवरण",
		descriptionPlaceholder: "यह कमांड क्या करता है",
		promptField: "प्रॉम्प्ट",
		promptFieldDesc: "Claude को भेजने के लिए प्रॉम्प्ट। कमांड आर्ग्युमेंट के लिए {arg} का उपयोग करें (जैसे, '/mycommand hello' {arg} को 'hello' से बदल देगा)",
		promptPlaceholder: "प्रॉम्प्ट दर्ज करें...",
		cancelButton: "रद्द करें",
		saveButton: "सहेजें",

		// CLAUDE.md Modal
		systemInstructionsTitle: "सिस्टम निर्देश",
		systemInstructionsModalDesc: "यह फ़ाइल (CLAUDE.md) आपके वॉल्ट रूट में स्थित है। Claude इसे प्रत्येक वार्तालाप से पहले स्वचालित रूप से पढ़ता है।",
		resetToDefaultButton: "डिफ़ॉल्ट पर रीसेट करें",
		loadingPlaceholder: "लोड हो रहा है...",

		// Agents section
		agentsSection: "Cristal एजेंट",
		addAgent: "एजेंट जोड़ें",
		comingSoon: "जल्द आ रहा है",
		agentAlreadyExists: "पहले से जोड़ा गया",
		defaultAgent: "डिफ़ॉल्ट एजेंट",
		defaultAgentDesc: "नई चैट के लिए कौन सा एजेंट डिफ़ॉल्ट रूप से उपयोग करना है",
		agentSettingsTitle: "सेटिंग्स",
		settingsButton: "सेटिंग्स",

		// Codex-specific settings
		codexCliPath: "Codex CLI पथ",
		codexCliPathDesc: "Codex CLI निष्पादन योग्य फ़ाइल का पथ। आमतौर पर बस 'codex' अगर विश्व स्तर पर स्थापित है।",
		codexSystemInstructions: "सिस्टम निर्देश (AGENT.md)",
		codexSystemInstructionsDesc: "आपके वॉल्ट रूट में एक फ़ाइल जो Codex के व्यवहार को परिभाषित करती है। स्वचालित रूप से पढ़ा जाता है।",
		codexDeepReasoning: "गहन सोच",
		codexDeepReasoningDesc: "विस्तारित सोच सक्षम करें (Extra High मोड)",

		// Updated model description
		defaultModelDescNoSlash: "नई चैट के लिए मॉडल।",

		// Terminal integration
		startIntegration: "एकीकरण शुरू करें",
		openTerminal: "टर्मिनल खोलें",
		integrationNote: "टर्मिनल खोलता है और CLI इंस्टॉलेशन शुरू करता है",

		// Account Limits
		accountLimits: "खाता सीमाएं",
		checkLimits: "सीमाएं जांचें",
		loadingLimits: "लोड हो रहा है...",
		fiveHourLimit: "5-घंटे की सीमा",
		weeklyLimit: "साप्ताहिक सीमा",
		opusLimit: "Opus सीमा",
		sonnetLimit: "Sonnet सीमा",
		resetsAt: "रीसेट:",
		resetsIn: "में",
		days: "दिन",
		hours: "घं",
		minutes: "मिनट",
		used: "उपयोग किया",
		left: "बाकी",
		notAuthenticated: "प्रमाणित नहीं",
		notAuthenticatedDesc: "सीमाएं देखने के लिए CLI में लॉग इन करें",
		limitsError: "सीमाएं प्राप्त करने में विफल",
		loginToCli: "CLI में लॉग इन करें",

		// Delete integration
		dangerZone: "खतरनाक क्षेत्र",
		deleteIntegration: "यह इंटीग्रेशन हटाएं",
		deleteIntegrationDesc: "यह आपकी सेटिंग्स से एजेंट को हटा देगा। यह क्रिया पूर्ववत नहीं की जा सकती।",
		confirmDeleteTitle: "इंटीग्रेशन हटाएं?",
		confirmDeleteMessage: "क्या आप वाकई हटाना चाहते हैं",

		// Model management
		availableModels: "उपलब्ध मॉडल",
		availableModelsDesc: "जिन मॉडलों का उपयोग नहीं करना चाहते उन्हें अक्षम करें"
	},

	zh: {
		// Main settings
		cliPath: "Claude CLI 路径",
		cliPathDesc: "Claude Code CLI 可执行文件的路径。如果全局安装，通常只需 'claude'。",
		assistantLanguage: "助手语言",
		assistantLanguageDesc: "Claude 回复和系统指令的语言",
		systemInstructions: "系统指令 (CLAUDE.md)",
		systemInstructionsDesc: "位于您保险库根目录的文件，定义 Claude 的行为方式。自动读取。",
		editButton: "编辑",
		defaultModel: "默认模型",
		defaultModelDesc: "用于新聊天的 Claude 模型。可以使用 /model 命令更改。",
		deepThinking: "深度思考模式",
		deepThinkingDesc: "为新聊天启用扩展思考。使用更多令牌但提供更深入的分析。",

		// Permissions section
		agentPermissions: "代理权限",
		permissionsNote: "基本功能（始终启用）：读取和编辑笔记（.md、.canvas、.base）。Bash 命令和 .obsidian 文件夹访问始终被阻止。",
		webSearch: "网络搜索",
		webSearchDesc: "允许 Claude 在互联网上搜索信息",
		webFetch: "网页获取",
		webFetchDesc: "允许 Claude 读取网页内容",
		subAgents: "子代理 (Task)",
		subAgentsDesc: "允许 Claude 为复杂任务启动辅助代理",

		// Slash Commands section
		slashCommands: "斜杠命令",
		slashCommandsNote: "在聊天中输入 / 查看可用命令。内置命令可以禁用。您也可以添加自定义命令。",
		builtinCommands: "内置命令",
		customCommands: "自定义命令",
		addCustomCommand: "添加命令",
		addCustomCommandDesc: "使用自定义提示创建您自己的斜杠命令",
		addButton: "添加",
		deleteButton: "删除",

		// Getting Started section
		gettingStarted: "开始使用",
		step1Title: "打开终端应用",
		step1MacOS: "macOS：按 Cmd+空格，输入 \"Terminal\"，按回车",
		step1Windows: "Windows：按 Win+R，输入 \"cmd\"，按回车",
		step2Title: "粘贴此命令并按回车：",
		step3Title: "等待安装完成，然后输入：",
		step4Title: "选择登录方式：",
		step4Note: "选择 \"Claude account (with active subscription)\"",
		step5Title: "在浏览器中完成身份验证",
		step5Note: "使用您的 Anthropic 账户登录",
		step6Title: "复制验证码并粘贴到终端",
		step6Note: "登录后您会看到一个代码——粘贴它并按回车",
		step7Title: "授予所有系统权限",
		step7Note: "当系统提示时允许访问",
		step8Title: "返回 Obsidian 开始聊天！",
		subscriptionNote: "需要 Claude Pro（$20/月）或 Max（$100/月）订阅。",
		alreadyDoneButton: "已完成",

		// Usage Statistics
		usageStatistics: "使用统计",
		today: "今日：",
		week: "本周：",
		month: "本月：",

		// CLI Status
		checkingCli: "检查 CLI...",
		cliFound: "找到 CLI (v{version})",
		cliNotFound: "未找到 CLI",
		installWith: "安装命令：npm i -g @anthropic-ai/claude-code",
		refreshButton: "刷新",

		// Command Modal
		editCommand: "编辑命令",
		newCustomCommand: "新建自定义命令",
		nameField: "名称",
		nameFieldDesc: "命令的显示名称",
		namePlaceholder: "我的命令",
		commandField: "命令",
		commandFieldDesc: "斜杠命令触发器（例如 /mycommand）",
		commandPlaceholder: "/mycommand",
		descriptionField: "描述",
		descriptionFieldDesc: "在自动完成中显示的简短描述",
		descriptionPlaceholder: "此命令的功能",
		promptField: "提示词",
		promptFieldDesc: "发送给 Claude 的提示词。使用 {arg} 作为命令参数（例如 '/mycommand hello' 会将 {arg} 替换为 'hello'）",
		promptPlaceholder: "输入提示词...",
		cancelButton: "取消",
		saveButton: "保存",

		// CLAUDE.md Modal
		systemInstructionsTitle: "系统指令",
		systemInstructionsModalDesc: "此文件 (CLAUDE.md) 位于您的保险库根目录。Claude 在每次对话前自动读取它。",
		resetToDefaultButton: "重置为默认",
		loadingPlaceholder: "加载中...",

		// Agents section
		agentsSection: "Cristal 代理",
		addAgent: "添加代理",
		comingSoon: "即将推出",
		agentAlreadyExists: "已添加",
		defaultAgent: "默认代理",
		defaultAgentDesc: "新聊天默认使用哪个代理",
		agentSettingsTitle: "设置",
		settingsButton: "设置",

		// Codex-specific settings
		codexCliPath: "Codex CLI 路径",
		codexCliPathDesc: "Codex CLI 可执行文件的路径。如果全局安装，通常只需 'codex'。",
		codexSystemInstructions: "系统指令 (AGENT.md)",
		codexSystemInstructionsDesc: "位于您保险库根目录的文件，定义 Codex 的行为方式。自动读取。",
		codexDeepReasoning: "深度思考",
		codexDeepReasoningDesc: "启用扩展思考（Extra High 模式）",

		// Updated model description
		defaultModelDescNoSlash: "用于新聊天的模型。",

		// Terminal integration
		startIntegration: "开始集成",
		openTerminal: "打开终端",
		integrationNote: "打开终端并开始 CLI 安装",

		// Account Limits
		accountLimits: "账户限制",
		checkLimits: "检查限制",
		loadingLimits: "加载中...",
		fiveHourLimit: "5小时限制",
		weeklyLimit: "每周限制",
		opusLimit: "Opus 限制",
		sonnetLimit: "Sonnet 限制",
		resetsAt: "重置时间:",
		resetsIn: "剩余",
		days: "天",
		hours: "小时",
		minutes: "分钟",
		used: "已用",
		left: "剩余",
		notAuthenticated: "未认证",
		notAuthenticatedDesc: "登录 CLI 查看限制",
		limitsError: "获取限制失败",
		loginToCli: "登录 CLI",

		// Delete integration
		dangerZone: "危险区域",
		deleteIntegration: "删除此集成",
		deleteIntegrationDesc: "这将从您的设置中删除代理。此操作无法撤消。",
		confirmDeleteTitle: "删除集成？",
		confirmDeleteMessage: "您确定要删除吗",

		// Model management
		availableModels: "可用模型",
		availableModelsDesc: "禁用您不想使用的模型"
	},

	ja: {
		// Main settings
		cliPath: "Claude CLI パス",
		cliPathDesc: "Claude Code CLI 実行ファイルへのパス。グローバルにインストールされている場合は通常 'claude' のみ。",
		assistantLanguage: "アシスタント言語",
		assistantLanguageDesc: "Claude の応答とシステム指示の言語",
		systemInstructions: "システム指示 (CLAUDE.md)",
		systemInstructionsDesc: "Claude の動作を定義する保管庫ルートのファイル。自動的に読み込まれます。",
		editButton: "編集",
		defaultModel: "デフォルトモデル",
		defaultModelDesc: "新しいチャットで使用する Claude モデル。/model コマンドで変更可能。",
		deepThinking: "深い思考モード",
		deepThinkingDesc: "新しいチャットで拡張思考を有効にする。より多くのトークンを使用しますが、より深い分析を提供します。",

		// Permissions section
		agentPermissions: "エージェント権限",
		permissionsNote: "基本機能（常に有効）：ノートの読み取りと編集（.md、.canvas、.base）。Bash コマンドと .obsidian フォルダへのアクセスは常にブロックされます。",
		webSearch: "ウェブ検索",
		webSearchDesc: "Claude にインターネットでの情報検索を許可",
		webFetch: "ウェブ取得",
		webFetchDesc: "Claude にウェブページのコンテンツ読み取りを許可",
		subAgents: "サブエージェント (Task)",
		subAgentsDesc: "Claude に複雑なタスクのためのヘルパーエージェント起動を許可",

		// Slash Commands section
		slashCommands: "スラッシュコマンド",
		slashCommandsNote: "チャットで / を入力して利用可能なコマンドを表示。組み込みコマンドは無効化できます。カスタムコマンドも追加できます。",
		builtinCommands: "組み込みコマンド",
		customCommands: "カスタムコマンド",
		addCustomCommand: "コマンドを追加",
		addCustomCommandDesc: "カスタムプロンプトで独自のスラッシュコマンドを作成",
		addButton: "追加",
		deleteButton: "削除",

		// Getting Started section
		gettingStarted: "はじめに",
		step1Title: "ターミナルアプリを開く",
		step1MacOS: "macOS：Cmd+スペースを押し、「Terminal」と入力してEnterを押す",
		step1Windows: "Windows：Win+Rを押し、「cmd」と入力してEnterを押す",
		step2Title: "このコマンドを貼り付けてEnterを押す：",
		step3Title: "インストールを待ち、次に入力：",
		step4Title: "ログイン方法を選択：",
		step4Note: "「Claude account (with active subscription)」を選択",
		step5Title: "ブラウザで認証を完了",
		step5Note: "Anthropic アカウントでログイン",
		step6Title: "認証コードをコピーしてターミナルに貼り付け",
		step6Note: "ログイン後にコードが表示されます — 貼り付けてEnterを押す",
		step7Title: "すべてのシステム権限を付与",
		step7Note: "システムが要求したらアクセスを許可",
		step8Title: "Obsidian に戻ってチャットを開始！",
		subscriptionNote: "Claude Pro（$20/月）または Max（$100/月）サブスクリプションが必要です。",
		alreadyDoneButton: "完了済み",

		// Usage Statistics
		usageStatistics: "使用統計",
		today: "今日：",
		week: "今週：",
		month: "今月：",

		// CLI Status
		checkingCli: "CLI を確認中...",
		cliFound: "CLI が見つかりました (v{version})",
		cliNotFound: "CLI が見つかりません",
		installWith: "インストール：npm i -g @anthropic-ai/claude-code",
		refreshButton: "更新",

		// Command Modal
		editCommand: "コマンドを編集",
		newCustomCommand: "新しいカスタムコマンド",
		nameField: "名前",
		nameFieldDesc: "コマンドの表示名",
		namePlaceholder: "マイコマンド",
		commandField: "コマンド",
		commandFieldDesc: "スラッシュコマンドトリガー（例：/mycommand）",
		commandPlaceholder: "/mycommand",
		descriptionField: "説明",
		descriptionFieldDesc: "オートコンプリートに表示される短い説明",
		descriptionPlaceholder: "このコマンドの機能",
		promptField: "プロンプト",
		promptFieldDesc: "Claude に送信するプロンプト。コマンド引数には {arg} を使用（例：'/mycommand hello' は {arg} を 'hello' に置き換えます）",
		promptPlaceholder: "プロンプトを入力...",
		cancelButton: "キャンセル",
		saveButton: "保存",

		// CLAUDE.md Modal
		systemInstructionsTitle: "システム指示",
		systemInstructionsModalDesc: "このファイル（CLAUDE.md）は保管庫のルートにあります。Claude は各会話の前に自動的に読み込みます。",
		resetToDefaultButton: "デフォルトにリセット",
		loadingPlaceholder: "読み込み中...",

		// Agents section
		agentsSection: "Cristal エージェント",
		addAgent: "エージェントを追加",
		comingSoon: "近日公開",
		agentAlreadyExists: "追加済み",
		defaultAgent: "デフォルトエージェント",
		defaultAgentDesc: "新しいチャットでデフォルトで使用するエージェント",
		agentSettingsTitle: "設定",
		settingsButton: "設定",

		// Codex-specific settings
		codexCliPath: "Codex CLI パス",
		codexCliPathDesc: "Codex CLI 実行ファイルへのパス。グローバルにインストールされている場合は通常 'codex' のみ。",
		codexSystemInstructions: "システム指示 (AGENT.md)",
		codexSystemInstructionsDesc: "Codex の動作を定義する保管庫ルートのファイル。自動的に読み込まれます。",
		codexDeepReasoning: "深い思考",
		codexDeepReasoningDesc: "拡張思考を有効にする（Extra High モード）",

		// Updated model description
		defaultModelDescNoSlash: "新しいチャットで使用するモデル。",

		// Terminal integration
		startIntegration: "統合を開始",
		openTerminal: "ターミナルを開く",
		integrationNote: "ターミナルを開いてCLIのインストールを開始します",

		// Account Limits
		accountLimits: "アカウント制限",
		checkLimits: "制限を確認",
		loadingLimits: "読み込み中...",
		fiveHourLimit: "5時間制限",
		weeklyLimit: "週間制限",
		opusLimit: "Opus 制限",
		sonnetLimit: "Sonnet 制限",
		resetsAt: "リセット:",
		resetsIn: "あと",
		days: "日",
		hours: "時間",
		minutes: "分",
		used: "使用済み",
		left: "残り",
		notAuthenticated: "未認証",
		notAuthenticatedDesc: "制限を表示するには CLI にログイン",
		limitsError: "制限の取得に失敗",
		loginToCli: "CLI にログイン",

		// Delete integration
		dangerZone: "危険ゾーン",
		deleteIntegration: "この統合を削除",
		deleteIntegrationDesc: "これにより、設定からエージェントが削除されます。この操作は元に戻せません。",
		confirmDeleteTitle: "統合を削除しますか？",
		confirmDeleteMessage: "本当に削除しますか",

		// Model management
		availableModels: "利用可能なモデル",
		availableModelsDesc: "使用したくないモデルを無効にする"
	}
};

export function getSettingsLocale(language: LanguageCode): SettingsLocale {
	return SETTINGS_LOCALES[language] || SETTINGS_LOCALES.en;
}
