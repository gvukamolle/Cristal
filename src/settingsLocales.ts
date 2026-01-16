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
	// New permissions
	fileOperations: string;
	fileRead: string;
	fileReadDesc: string;
	fileWrite: string;
	fileWriteDesc: string;
	fileEdit: string;
	fileEditDesc: string;
	webOperations: string;
	advanced: string;
	extendedThinking: string;
	extendedThinkingDesc: string;
	// Skills section
	skills: string;
	skillsNote: string;
	noSkillsAvailable: string;
	customSkill: string;
	createNewSkill: string;
	builtinSkills: string;
	customSkills: string;
	validateSkill: string;
	addCustomSkill: string;
	addCustomSkillDesc: string;
	skillCreatedSuccess: string;

	// Create Skill Modal
	createNewSkillTitle: string;
	skillNameField: string;
	skillNameFieldDesc: string;
	skillNamePlaceholder: string;
	skillDescriptionField: string;
	skillDescriptionFieldDesc: string;
	skillDescriptionPlaceholder: string;
	optionalFolders: string;
	includeScripts: string;
	includeScriptsDesc: string;
	includeReferences: string;
	includeReferencesDesc: string;
	includeAssets: string;
	includeAssetsDesc: string;
	createSkillButton: string;
	skillNameRequired: string;
	invalidSkillName: string;
	skillDescriptionRequired: string;
	skillCreationFailed: string;

	// Validate Skill Modal
	validateSkillTitle: string;
	validating: string;
	skillIsValid: string;
	errors: string;
	warnings: string;
	closeButton: string;

	// Skill Selector Modal
	selectSkillTitle: string;
	noCustomSkillsFound: string;

	// Edit Skill Modal
	editSkillTitle: string;
	skillInstructionsField: string;
	skillInstructionsFieldDesc: string;
	resourceFolders: string;
	scriptsFolder: string;
	scriptsFolderDesc: string;
	referencesFolder: string;
	referencesFolderDesc: string;
	assetsFolder: string;
	assetsFolderDesc: string;
	deleteSkillButton: string;
	noFilesInFolder: string;
	openFolderButton: string;
	addFilesButton: string;
	selectFilesToAdd: string;
	filesAdded: string;
	filesAddFailed: string;
	skillSaved: string;
	skillSaveFailed: string;
	confirmDeleteSkill: string;
	skillDeleted: string;
	skillDeleteFailed: string;

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

	// Updated model description (no /model mention)
	defaultModelDescNoSlash: string;

	// Terminal integration
	startIntegration: string;
	openTerminal: string;
	openTerminalDesc: string;
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

	// Agent Personalization
	agentPersonalization: string;
	agentPersonalizationDesc: string;
	personalizationUserName: string;
	personalizationUserNameDesc: string;
	personalizationUserNamePlaceholder: string;
	personalizationUserRole: string;
	personalizationUserRoleDesc: string;
	personalizationUserRolePlaceholder: string;
	personalizationWorkContext: string;
	personalizationWorkContextDesc: string;
	personalizationWorkContextPlaceholder: string;
	personalizationCommunicationStyle: string;
	personalizationCommunicationStyleDesc: string;
	personalizationCommunicationStylePlaceholder: string;
	personalizationCurrentFocus: string;
	personalizationCurrentFocusDesc: string;
	personalizationCurrentFocusPlaceholder: string;
	personalizationConfigured: string;
	personalizationNotConfigured: string;
	clearAllButton: string;
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
		// New permissions
		fileOperations: "Операции с файлами",
		fileRead: "Чтение файлов",
		fileReadDesc: "Разрешить агенту читать файлы (.md, .canvas, .base)",
		fileWrite: "Создание файлов",
		fileWriteDesc: "Разрешить агенту создавать новые файлы",
		fileEdit: "Редактирование файлов",
		fileEditDesc: "Разрешить агенту изменять существующие файлы",
		webOperations: "Веб-операции",
		advanced: "Продвинутые",
		extendedThinking: "Расширенное мышление",
		extendedThinkingDesc: "Использовать extended thinking для глубокого анализа",
		// Skills section
		skills: "Навыки",
		skillsNote: "Навыки предоставляют агенту специализированные инструкции для работы с Obsidian",
		noSkillsAvailable: "Нет доступных навыков",
		customSkill: "Пользовательский",
		createNewSkill: "Создать новый",
		builtinSkills: "Встроенные навыки",
		customSkills: "Пользовательские навыки",
		validateSkill: "Проверить навык",
		addCustomSkill: "Добавить навык",
		addCustomSkillDesc: "Создайте свой навык с пользовательскими инструкциями",
		skillCreatedSuccess: "Навык \"{name}\" успешно создан",

		// Create Skill Modal
		createNewSkillTitle: "Создать навык",
		skillNameField: "Название навыка",
		skillNameFieldDesc: "Уникальный идентификатор в kebab-case (например, my-custom-skill)",
		skillNamePlaceholder: "my-skill-name",
		skillDescriptionField: "Описание",
		skillDescriptionFieldDesc: "Детальное описание для триггера (что делает, когда использовать)",
		skillDescriptionPlaceholder: "Опишите, что делает этот навык...",
		optionalFolders: "Дополнительные папки",
		includeScripts: "Включить scripts/",
		includeScriptsDesc: "Для исполняемого кода (Python, shell-скрипты)",
		includeReferences: "Включить references/",
		includeReferencesDesc: "Для документации, загружаемой в контекст",
		includeAssets: "Включить assets/",
		includeAssetsDesc: "Для выходных файлов (шаблоны, изображения)",
		createSkillButton: "Создать",
		skillNameRequired: "Название навыка обязательно",
		invalidSkillName: "Неверное название. Используйте kebab-case (строчные буквы, цифры, дефисы).",
		skillDescriptionRequired: "Описание обязательно",
		skillCreationFailed: "Не удалось создать навык",

		// Validate Skill Modal
		validateSkillTitle: "Проверка: {name}",
		validating: "Проверка...",
		skillIsValid: "✓ Навык валиден",
		errors: "Ошибки",
		warnings: "Предупреждения",
		closeButton: "Закрыть",

		// Skill Selector Modal
		selectSkillTitle: "Выберите навык",
		noCustomSkillsFound: "Пользовательские навыки не найдены в .crystal/skills/",

		// Edit Skill Modal
		editSkillTitle: "Редактирование: {name}",
		skillInstructionsField: "Инструкции",
		skillInstructionsFieldDesc: "Основное содержание навыка — инструкции для ИИ",
		resourceFolders: "Папки ресурсов",
		scriptsFolder: "scripts/",
		scriptsFolderDesc: "Исполняемый код (Python, shell-скрипты)",
		referencesFolder: "references/",
		referencesFolderDesc: "Документация, загружаемая в контекст",
		assetsFolder: "assets/",
		assetsFolderDesc: "Выходные файлы (шаблоны, изображения)",
		deleteSkillButton: "Удалить навык",
		noFilesInFolder: "Нет файлов. Добавьте файлы напрямую в папку.",
		openFolderButton: "Открыть папку",
		skillSaved: "Навык сохранён",
		skillSaveFailed: "Не удалось сохранить навык",
		confirmDeleteSkill: "Вы уверены, что хотите удалить навык \"{name}\"?",
		skillDeleted: "Навык удалён",
		skillDeleteFailed: "Не удалось удалить навык",
		addFilesButton: "Добавить файлы",
		selectFilesToAdd: "Выберите файлы для добавления",
		filesAdded: "Файлы успешно добавлены",
		filesAddFailed: "Не удалось добавить файлы",

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
		agentsSection: "Агенты Crystal",
		addAgent: "Добавить агента",
		comingSoon: "Скоро",
		agentAlreadyExists: "Уже добавлен",
		defaultAgent: "Агент по умолчанию",
		defaultAgentDesc: "Какой агент использовать по умолчанию для новых чатов",
		agentSettingsTitle: "Настройки",
		settingsButton: "Настройки",

		// Updated model description
		defaultModelDescNoSlash: "Модель для новых чатов.",

		// Terminal integration
		startIntegration: "Начать интеграцию",
		openTerminal: "Открыть терминал",
		openTerminalDesc: "Открыть системный терминал с Claude Code",
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
		availableModelsDesc: "Отключите модели, которые не хотите использовать",

		// Agent Personalization
		agentPersonalization: "Персонализация агента",
		agentPersonalizationDesc: "Эти данные помогут Claude лучше понять ваш контекст и адаптировать ответы. Все поля опциональны.",
		personalizationUserName: "Имя",
		personalizationUserNameDesc: "Как к вам обращаться",
		personalizationUserNamePlaceholder: "Например: Алексей",
		personalizationUserRole: "Роль / Профессия",
		personalizationUserRoleDesc: "Ваша профессия или роль",
		personalizationUserRolePlaceholder: "Например: продуктовый дизайнер",
		personalizationWorkContext: "Контекст работы",
		personalizationWorkContextDesc: "Опишите специфику вашей работы и базы знаний",
		personalizationWorkContextPlaceholder: "Например: Веду базу знаний по UX-исследованиям и дизайн-системам",
		personalizationCommunicationStyle: "Стиль коммуникации",
		personalizationCommunicationStyleDesc: "Как вы предпочитаете получать ответы",
		personalizationCommunicationStylePlaceholder: "Например: Кратко, по делу, с примерами",
		personalizationCurrentFocus: "Текущий фокус",
		personalizationCurrentFocusDesc: "Над чем сейчас работаете",
		personalizationCurrentFocusPlaceholder: "Например: Редизайн мобильного приложения",
		personalizationConfigured: "Настроено",
		personalizationNotConfigured: "Настроить...",
		clearAllButton: "Очистить всё"
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
		// New permissions
		fileOperations: "File Operations",
		fileRead: "Read Files",
		fileReadDesc: "Allow agent to read files (.md, .canvas, .base)",
		fileWrite: "Create Files",
		fileWriteDesc: "Allow agent to create new files",
		fileEdit: "Edit Files",
		fileEditDesc: "Allow agent to modify existing files",
		webOperations: "Web Operations",
		advanced: "Advanced",
		extendedThinking: "Extended Thinking",
		extendedThinkingDesc: "Use extended thinking for deep analysis",
		// Skills section
		skills: "Skills",
		skillsNote: "Skills provide specialized instructions for working with Obsidian",
		noSkillsAvailable: "No skills available",
		customSkill: "Custom",
		createNewSkill: "Create new",
		builtinSkills: "Built-in Skills",
		customSkills: "Custom Skills",
		validateSkill: "Validate skill",
		addCustomSkill: "Add skill",
		addCustomSkillDesc: "Create your own skill with custom instructions",
		skillCreatedSuccess: "Skill \"{name}\" created successfully",

		// Create Skill Modal
		createNewSkillTitle: "Create Skill",
		skillNameField: "Skill Name",
		skillNameFieldDesc: "Unique identifier in kebab-case (e.g., my-custom-skill)",
		skillNamePlaceholder: "my-skill-name",
		skillDescriptionField: "Description",
		skillDescriptionFieldDesc: "Detailed description for triggering (what it does, when to use)",
		skillDescriptionPlaceholder: "Describe what this skill does...",
		optionalFolders: "Optional Folders",
		includeScripts: "Include scripts/",
		includeScriptsDesc: "For executable code (Python, shell scripts)",
		includeReferences: "Include references/",
		includeReferencesDesc: "For documentation loaded into context",
		includeAssets: "Include assets/",
		includeAssetsDesc: "For output files (templates, images)",
		createSkillButton: "Create",
		skillNameRequired: "Skill name is required",
		invalidSkillName: "Invalid skill name. Must be kebab-case (lowercase letters, digits, hyphens).",
		skillDescriptionRequired: "Description is required",
		skillCreationFailed: "Failed to create skill",

		// Validate Skill Modal
		validateSkillTitle: "Validate: {name}",
		validating: "Validating...",
		skillIsValid: "✓ Skill is valid",
		errors: "Errors",
		warnings: "Warnings",
		closeButton: "Close",

		// Skill Selector Modal
		selectSkillTitle: "Select a Skill",
		noCustomSkillsFound: "No custom skills found in .crystal/skills/",

		// Edit Skill Modal
		editSkillTitle: "Edit: {name}",
		skillInstructionsField: "Instructions",
		skillInstructionsFieldDesc: "The main content of the skill — instructions for the AI",
		resourceFolders: "Resource Folders",
		scriptsFolder: "scripts/",
		scriptsFolderDesc: "Executable code (Python, shell scripts)",
		referencesFolder: "references/",
		referencesFolderDesc: "Documentation loaded into context",
		assetsFolder: "assets/",
		assetsFolderDesc: "Output files (templates, images)",
		deleteSkillButton: "Delete Skill",
		noFilesInFolder: "No files. Add files directly to the folder.",
		openFolderButton: "Open Folder",
		skillSaved: "Skill saved",
		skillSaveFailed: "Failed to save skill",
		confirmDeleteSkill: "Are you sure you want to delete skill \"{name}\"?",
		skillDeleted: "Skill deleted",
		skillDeleteFailed: "Failed to delete skill",
		addFilesButton: "Add Files",
		selectFilesToAdd: "Select files to add",
		filesAdded: "Files added successfully",
		filesAddFailed: "Failed to add files",

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
		agentsSection: "Crystal Agents",
		addAgent: "Add agent",
		comingSoon: "Coming soon",
		agentAlreadyExists: "Already added",
		defaultAgent: "Default agent",
		defaultAgentDesc: "Which agent to use by default for new chats",
		agentSettingsTitle: "Settings",
		settingsButton: "Settings",

		// Updated model description
		defaultModelDescNoSlash: "Model used for new chats.",

		// Terminal integration
		startIntegration: "Start Integration",
		openTerminal: "Open Terminal",
		openTerminalDesc: "Open system terminal with Claude Code",
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
		availableModelsDesc: "Disable models you don't want to use",

		// Agent Personalization
		agentPersonalization: "Agent Personalization",
		agentPersonalizationDesc: "This information helps Claude understand your context and tailor responses. All fields are optional.",
		personalizationUserName: "Name",
		personalizationUserNameDesc: "How should I address you",
		personalizationUserNamePlaceholder: "e.g., Alex",
		personalizationUserRole: "Role / Profession",
		personalizationUserRoleDesc: "Your profession or role",
		personalizationUserRolePlaceholder: "e.g., product designer",
		personalizationWorkContext: "Work Context",
		personalizationWorkContextDesc: "Describe your work specifics and knowledge base",
		personalizationWorkContextPlaceholder: "e.g., Managing a knowledge base for UX research and design systems",
		personalizationCommunicationStyle: "Communication Style",
		personalizationCommunicationStyleDesc: "How you prefer to receive responses",
		personalizationCommunicationStylePlaceholder: "e.g., Brief, to the point, with examples",
		personalizationCurrentFocus: "Current Focus",
		personalizationCurrentFocusDesc: "What you're currently working on",
		personalizationCurrentFocusPlaceholder: "e.g., Mobile app redesign",
		personalizationConfigured: "Configured",
		personalizationNotConfigured: "Configure...",
		clearAllButton: "Clear all"
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
		// New permissions
		fileOperations: "Opérations sur les fichiers",
		fileRead: "Lire les fichiers",
		fileReadDesc: "Autoriser l'agent à lire les fichiers (.md, .canvas, .base)",
		fileWrite: "Créer des fichiers",
		fileWriteDesc: "Autoriser l'agent à créer de nouveaux fichiers",
		fileEdit: "Modifier les fichiers",
		fileEditDesc: "Autoriser l'agent à modifier les fichiers existants",
		webOperations: "Opérations web",
		advanced: "Avancé",
		extendedThinking: "Réflexion étendue",
		extendedThinkingDesc: "Utiliser la réflexion étendue pour une analyse approfondie",
		// Skills section
		skills: "Compétences",
		skillsNote: "Les compétences fournissent des instructions spécialisées pour travailler avec Obsidian",
		noSkillsAvailable: "Aucune compétence disponible",
		customSkill: "Personnalisé",
		createNewSkill: "Créer nouveau",
		builtinSkills: "Compétences intégrées",
		customSkills: "Compétences personnalisées",
		validateSkill: "Valider la compétence",
		addCustomSkill: "Ajouter une compétence",
		addCustomSkillDesc: "Créez votre propre compétence avec des instructions personnalisées",
		skillCreatedSuccess: "Compétence \"{name}\" créée avec succès",

		// Create Skill Modal
		createNewSkillTitle: "Créer une compétence",
		skillNameField: "Nom de la compétence",
		skillNameFieldDesc: "Identifiant unique en kebab-case (ex: ma-competence-perso)",
		skillNamePlaceholder: "ma-competence",
		skillDescriptionField: "Description",
		skillDescriptionFieldDesc: "Description détaillée pour le déclenchement (ce qu'elle fait, quand l'utiliser)",
		skillDescriptionPlaceholder: "Décrivez ce que fait cette compétence...",
		optionalFolders: "Dossiers optionnels",
		includeScripts: "Inclure scripts/",
		includeScriptsDesc: "Pour le code exécutable (Python, scripts shell)",
		includeReferences: "Inclure references/",
		includeReferencesDesc: "Pour la documentation chargée dans le contexte",
		includeAssets: "Inclure assets/",
		includeAssetsDesc: "Pour les fichiers de sortie (modèles, images)",
		createSkillButton: "Créer",
		skillNameRequired: "Le nom de la compétence est requis",
		invalidSkillName: "Nom invalide. Utilisez le kebab-case (lettres minuscules, chiffres, tirets).",
		skillDescriptionRequired: "La description est requise",
		skillCreationFailed: "Échec de la création de la compétence",

		// Validate Skill Modal
		validateSkillTitle: "Validation: {name}",
		validating: "Validation...",
		skillIsValid: "✓ La compétence est valide",
		errors: "Erreurs",
		warnings: "Avertissements",
		closeButton: "Fermer",

		// Skill Selector Modal
		selectSkillTitle: "Sélectionner une compétence",
		noCustomSkillsFound: "Aucune compétence personnalisée trouvée dans .crystal/skills/",

		// Edit Skill Modal
		editSkillTitle: "Modifier: {name}",
		skillInstructionsField: "Instructions",
		skillInstructionsFieldDesc: "Le contenu principal de la compétence — instructions pour l'IA",
		resourceFolders: "Dossiers de ressources",
		scriptsFolder: "scripts/",
		scriptsFolderDesc: "Code exécutable (Python, scripts shell)",
		referencesFolder: "references/",
		referencesFolderDesc: "Documentation chargée dans le contexte",
		assetsFolder: "assets/",
		assetsFolderDesc: "Fichiers de sortie (modèles, images)",
		deleteSkillButton: "Supprimer la compétence",
		noFilesInFolder: "Aucun fichier. Ajoutez des fichiers directement dans le dossier.",
		openFolderButton: "Ouvrir le dossier",
		skillSaved: "Compétence sauvegardée",
		skillSaveFailed: "Échec de la sauvegarde de la compétence",
		confirmDeleteSkill: "Êtes-vous sûr de vouloir supprimer la compétence \"{name}\" ?",
		skillDeleted: "Compétence supprimée",
		skillDeleteFailed: "Échec de la suppression de la compétence",
		addFilesButton: "Ajouter des fichiers",
		selectFilesToAdd: "Sélectionnez les fichiers à ajouter",
		filesAdded: "Fichiers ajoutés avec succès",
		filesAddFailed: "Échec de l'ajout des fichiers",

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
		agentsSection: "Agents Crystal",
		addAgent: "Ajouter un agent",
		comingSoon: "Bientôt",
		agentAlreadyExists: "Déjà ajouté",
		defaultAgent: "Agent par défaut",
		defaultAgentDesc: "Quel agent utiliser par défaut pour les nouveaux chats",
		agentSettingsTitle: "Paramètres",
		settingsButton: "Paramètres",

		// Updated model description
		defaultModelDescNoSlash: "Modèle utilisé pour les nouveaux chats.",

		// Terminal integration
		startIntegration: "Démarrer l'intégration",
		openTerminal: "Ouvrir le terminal",
		openTerminalDesc: "Ouvrir le terminal système avec Claude Code",
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
		availableModelsDesc: "Désactivez les modèles que vous ne souhaitez pas utiliser",

		// Agent Personalization
		agentPersonalization: "Personnalisation de l'agent",
		agentPersonalizationDesc: "Ces informations aident Claude à comprendre votre contexte et à adapter ses réponses. Tous les champs sont optionnels.",
		personalizationUserName: "Nom",
		personalizationUserNameDesc: "Comment dois-je vous appeler",
		personalizationUserNamePlaceholder: "ex: Alexandre",
		personalizationUserRole: "Rôle / Profession",
		personalizationUserRoleDesc: "Votre profession ou rôle",
		personalizationUserRolePlaceholder: "ex: designer produit",
		personalizationWorkContext: "Contexte de travail",
		personalizationWorkContextDesc: "Décrivez votre travail et votre base de connaissances",
		personalizationWorkContextPlaceholder: "ex: Je gère une base de connaissances pour la recherche UX et les design systems",
		personalizationCommunicationStyle: "Style de communication",
		personalizationCommunicationStyleDesc: "Comment préférez-vous recevoir les réponses",
		personalizationCommunicationStylePlaceholder: "ex: Bref, concis, avec des exemples",
		personalizationCurrentFocus: "Focus actuel",
		personalizationCurrentFocusDesc: "Sur quoi travaillez-vous actuellement",
		personalizationCurrentFocusPlaceholder: "ex: Refonte de l'application mobile",
		personalizationConfigured: "Configuré",
		personalizationNotConfigured: "Configurer...",
		clearAllButton: "Tout effacer"
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
		// New permissions
		fileOperations: "Dateioperationen",
		fileRead: "Dateien lesen",
		fileReadDesc: "Agent das Lesen von Dateien erlauben (.md, .canvas, .base)",
		fileWrite: "Dateien erstellen",
		fileWriteDesc: "Agent das Erstellen neuer Dateien erlauben",
		fileEdit: "Dateien bearbeiten",
		fileEditDesc: "Agent das Ändern bestehender Dateien erlauben",
		webOperations: "Web-Operationen",
		advanced: "Erweitert",
		extendedThinking: "Erweitertes Denken",
		extendedThinkingDesc: "Erweitertes Denken für tiefgehende Analyse verwenden",
		// Skills section
		skills: "Fähigkeiten",
		skillsNote: "Fähigkeiten bieten spezialisierte Anweisungen für die Arbeit mit Obsidian",
		noSkillsAvailable: "Keine Fähigkeiten verfügbar",
		customSkill: "Benutzerdefiniert",
		createNewSkill: "Neu erstellen",
		builtinSkills: "Integrierte Fähigkeiten",
		customSkills: "Benutzerdefinierte Fähigkeiten",
		validateSkill: "Fähigkeit validieren",
		addCustomSkill: "Fähigkeit hinzufügen",
		addCustomSkillDesc: "Erstellen Sie Ihre eigene Fähigkeit mit benutzerdefinierten Anweisungen",
		skillCreatedSuccess: "Fähigkeit \"{name}\" erfolgreich erstellt",

		// Create Skill Modal
		createNewSkillTitle: "Fähigkeit erstellen",
		skillNameField: "Fähigkeitsname",
		skillNameFieldDesc: "Eindeutiger Bezeichner in Kebab-Case (z.B. meine-eigene-faehigkeit)",
		skillNamePlaceholder: "meine-faehigkeit",
		skillDescriptionField: "Beschreibung",
		skillDescriptionFieldDesc: "Detaillierte Beschreibung für die Auslösung (was sie macht, wann sie verwendet wird)",
		skillDescriptionPlaceholder: "Beschreiben Sie, was diese Fähigkeit macht...",
		optionalFolders: "Optionale Ordner",
		includeScripts: "scripts/ einschließen",
		includeScriptsDesc: "Für ausführbaren Code (Python, Shell-Skripte)",
		includeReferences: "references/ einschließen",
		includeReferencesDesc: "Für Dokumentation, die in den Kontext geladen wird",
		includeAssets: "assets/ einschließen",
		includeAssetsDesc: "Für Ausgabedateien (Vorlagen, Bilder)",
		createSkillButton: "Erstellen",
		skillNameRequired: "Fähigkeitsname ist erforderlich",
		invalidSkillName: "Ungültiger Name. Verwenden Sie Kebab-Case (Kleinbuchstaben, Ziffern, Bindestriche).",
		skillDescriptionRequired: "Beschreibung ist erforderlich",
		skillCreationFailed: "Fähigkeit konnte nicht erstellt werden",

		// Validate Skill Modal
		validateSkillTitle: "Validierung: {name}",
		validating: "Validierung...",
		skillIsValid: "✓ Fähigkeit ist gültig",
		errors: "Fehler",
		warnings: "Warnungen",
		closeButton: "Schließen",

		// Skill Selector Modal
		selectSkillTitle: "Fähigkeit auswählen",
		noCustomSkillsFound: "Keine benutzerdefinierten Fähigkeiten in .crystal/skills/ gefunden",

		// Edit Skill Modal
		editSkillTitle: "Bearbeiten: {name}",
		skillInstructionsField: "Anweisungen",
		skillInstructionsFieldDesc: "Der Hauptinhalt der Fähigkeit — Anweisungen für die KI",
		resourceFolders: "Ressourcenordner",
		scriptsFolder: "scripts/",
		scriptsFolderDesc: "Ausführbarer Code (Python, Shell-Skripte)",
		referencesFolder: "references/",
		referencesFolderDesc: "Dokumentation, die in den Kontext geladen wird",
		assetsFolder: "assets/",
		assetsFolderDesc: "Ausgabedateien (Vorlagen, Bilder)",
		deleteSkillButton: "Fähigkeit löschen",
		noFilesInFolder: "Keine Dateien. Fügen Sie Dateien direkt zum Ordner hinzu.",
		openFolderButton: "Ordner öffnen",
		skillSaved: "Fähigkeit gespeichert",
		skillSaveFailed: "Fähigkeit konnte nicht gespeichert werden",
		confirmDeleteSkill: "Sind Sie sicher, dass Sie die Fähigkeit \"{name}\" löschen möchten?",
		skillDeleted: "Fähigkeit gelöscht",
		skillDeleteFailed: "Fähigkeit konnte nicht gelöscht werden",
		addFilesButton: "Dateien hinzufügen",
		selectFilesToAdd: "Dateien zum Hinzufügen auswählen",
		filesAdded: "Dateien erfolgreich hinzugefügt",
		filesAddFailed: "Dateien konnten nicht hinzugefügt werden",

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
		agentsSection: "Crystal Agenten",
		addAgent: "Agent hinzufügen",
		comingSoon: "Demnächst",
		agentAlreadyExists: "Bereits hinzugefügt",
		defaultAgent: "Standard-Agent",
		defaultAgentDesc: "Welcher Agent standardmäßig für neue Chats verwendet werden soll",
		agentSettingsTitle: "Einstellungen",
		settingsButton: "Einstellungen",

		// Updated model description
		defaultModelDescNoSlash: "Modell für neue Chats.",

		// Terminal integration
		startIntegration: "Integration starten",
		openTerminal: "Terminal öffnen",
		openTerminalDesc: "System-Terminal mit Claude Code öffnen",
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
		availableModelsDesc: "Deaktivieren Sie Modelle, die Sie nicht verwenden möchten",

		// Agent Personalization
		agentPersonalization: "Agent-Personalisierung",
		agentPersonalizationDesc: "Diese Informationen helfen Claude, Ihren Kontext zu verstehen und Antworten anzupassen. Alle Felder sind optional.",
		personalizationUserName: "Name",
		personalizationUserNameDesc: "Wie soll ich Sie ansprechen",
		personalizationUserNamePlaceholder: "z.B.: Alexander",
		personalizationUserRole: "Rolle / Beruf",
		personalizationUserRoleDesc: "Ihr Beruf oder Ihre Rolle",
		personalizationUserRolePlaceholder: "z.B.: Produktdesigner",
		personalizationWorkContext: "Arbeitskontext",
		personalizationWorkContextDesc: "Beschreiben Sie Ihre Arbeit und Ihre Wissensbasis",
		personalizationWorkContextPlaceholder: "z.B.: Ich verwalte eine Wissensbasis für UX-Forschung und Design-Systeme",
		personalizationCommunicationStyle: "Kommunikationsstil",
		personalizationCommunicationStyleDesc: "Wie bevorzugen Sie Antworten zu erhalten",
		personalizationCommunicationStylePlaceholder: "z.B.: Kurz, prägnant, mit Beispielen",
		personalizationCurrentFocus: "Aktueller Fokus",
		personalizationCurrentFocusDesc: "Woran arbeiten Sie gerade",
		personalizationCurrentFocusPlaceholder: "z.B.: Neugestaltung der mobilen App",
		personalizationConfigured: "Konfiguriert",
		personalizationNotConfigured: "Konfigurieren...",
		clearAllButton: "Alles löschen"
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
		// New permissions
		fileOperations: "Operaciones de archivos",
		fileRead: "Leer archivos",
		fileReadDesc: "Permitir al agente leer archivos (.md, .canvas, .base)",
		fileWrite: "Crear archivos",
		fileWriteDesc: "Permitir al agente crear nuevos archivos",
		fileEdit: "Editar archivos",
		fileEditDesc: "Permitir al agente modificar archivos existentes",
		webOperations: "Operaciones web",
		advanced: "Avanzado",
		extendedThinking: "Pensamiento extendido",
		extendedThinkingDesc: "Usar pensamiento extendido para análisis profundo",
		// Skills section
		skills: "Habilidades",
		skillsNote: "Las habilidades proporcionan instrucciones especializadas para trabajar con Obsidian",
		noSkillsAvailable: "No hay habilidades disponibles",
		customSkill: "Personalizado",
		createNewSkill: "Crear nuevo",
		builtinSkills: "Habilidades integradas",
		customSkills: "Habilidades personalizadas",
		validateSkill: "Validar habilidad",
		addCustomSkill: "Agregar habilidad",
		addCustomSkillDesc: "Crea tu propia habilidad con instrucciones personalizadas",
		skillCreatedSuccess: "Habilidad \"{name}\" creada con éxito",

		// Create Skill Modal
		createNewSkillTitle: "Crear habilidad",
		skillNameField: "Nombre de la habilidad",
		skillNameFieldDesc: "Identificador único en kebab-case (ej: mi-habilidad-personalizada)",
		skillNamePlaceholder: "mi-habilidad",
		skillDescriptionField: "Descripción",
		skillDescriptionFieldDesc: "Descripción detallada para activación (qué hace, cuándo usar)",
		skillDescriptionPlaceholder: "Describe qué hace esta habilidad...",
		optionalFolders: "Carpetas opcionales",
		includeScripts: "Incluir scripts/",
		includeScriptsDesc: "Para código ejecutable (Python, scripts de shell)",
		includeReferences: "Incluir references/",
		includeReferencesDesc: "Para documentación cargada en contexto",
		includeAssets: "Incluir assets/",
		includeAssetsDesc: "Para archivos de salida (plantillas, imágenes)",
		createSkillButton: "Crear",
		skillNameRequired: "El nombre de la habilidad es obligatorio",
		invalidSkillName: "Nombre inválido. Usa kebab-case (letras minúsculas, dígitos, guiones).",
		skillDescriptionRequired: "La descripción es obligatoria",
		skillCreationFailed: "Error al crear la habilidad",

		// Validate Skill Modal
		validateSkillTitle: "Validación: {name}",
		validating: "Validando...",
		skillIsValid: "✓ La habilidad es válida",
		errors: "Errores",
		warnings: "Advertencias",
		closeButton: "Cerrar",

		// Skill Selector Modal
		selectSkillTitle: "Seleccionar habilidad",
		noCustomSkillsFound: "No se encontraron habilidades personalizadas en .crystal/skills/",

		// Edit Skill Modal
		editSkillTitle: "Editar: {name}",
		skillInstructionsField: "Instrucciones",
		skillInstructionsFieldDesc: "El contenido principal de la habilidad — instrucciones para la IA",
		resourceFolders: "Carpetas de recursos",
		scriptsFolder: "scripts/",
		scriptsFolderDesc: "Código ejecutable (Python, scripts de shell)",
		referencesFolder: "references/",
		referencesFolderDesc: "Documentación cargada en contexto",
		assetsFolder: "assets/",
		assetsFolderDesc: "Archivos de salida (plantillas, imágenes)",
		deleteSkillButton: "Eliminar habilidad",
		noFilesInFolder: "Sin archivos. Añade archivos directamente a la carpeta.",
		openFolderButton: "Abrir carpeta",
		skillSaved: "Habilidad guardada",
		skillSaveFailed: "Error al guardar la habilidad",
		confirmDeleteSkill: "¿Estás seguro de que quieres eliminar la habilidad \"{name}\"?",
		skillDeleted: "Habilidad eliminada",
		skillDeleteFailed: "Error al eliminar la habilidad",
		addFilesButton: "Agregar archivos",
		selectFilesToAdd: "Selecciona archivos para agregar",
		filesAdded: "Archivos agregados con éxito",
		filesAddFailed: "Error al agregar archivos",

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
		agentsSection: "Agentes de Crystal",
		addAgent: "Agregar agente",
		comingSoon: "Próximamente",
		agentAlreadyExists: "Ya agregado",
		defaultAgent: "Agente predeterminado",
		defaultAgentDesc: "Qué agente usar por defecto para nuevos chats",
		agentSettingsTitle: "Configuración",
		settingsButton: "Configuración",

		// Updated model description
		defaultModelDescNoSlash: "Modelo usado para nuevos chats.",

		// Terminal integration
		startIntegration: "Iniciar integración",
		openTerminal: "Abrir terminal",
		openTerminalDesc: "Abrir terminal del sistema con Claude Code",
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
		availableModelsDesc: "Desactiva los modelos que no quieras usar",

		// Agent Personalization
		agentPersonalization: "Personalización del agente",
		agentPersonalizationDesc: "Esta información ayuda a Claude a entender tu contexto y adaptar las respuestas. Todos los campos son opcionales.",
		personalizationUserName: "Nombre",
		personalizationUserNameDesc: "¿Cómo debo llamarte?",
		personalizationUserNamePlaceholder: "ej: Alejandro",
		personalizationUserRole: "Rol / Profesión",
		personalizationUserRoleDesc: "Tu profesión o rol",
		personalizationUserRolePlaceholder: "ej: diseñador de producto",
		personalizationWorkContext: "Contexto de trabajo",
		personalizationWorkContextDesc: "Describe tu trabajo y tu base de conocimientos",
		personalizationWorkContextPlaceholder: "ej: Gestiono una base de conocimientos para investigación UX y sistemas de diseño",
		personalizationCommunicationStyle: "Estilo de comunicación",
		personalizationCommunicationStyleDesc: "¿Cómo prefieres recibir las respuestas?",
		personalizationCommunicationStylePlaceholder: "ej: Breve, al punto, con ejemplos",
		personalizationCurrentFocus: "Enfoque actual",
		personalizationCurrentFocusDesc: "¿En qué estás trabajando actualmente?",
		personalizationCurrentFocusPlaceholder: "ej: Rediseño de la app móvil",
		personalizationConfigured: "Configurado",
		personalizationNotConfigured: "Configurar...",
		clearAllButton: "Borrar todo"
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
		// New permissions
		fileOperations: "फ़ाइल ऑपरेशन",
		fileRead: "फ़ाइलें पढ़ें",
		fileReadDesc: "एजेंट को फ़ाइलें पढ़ने की अनुमति दें (.md, .canvas, .base)",
		fileWrite: "फ़ाइलें बनाएं",
		fileWriteDesc: "एजेंट को नई फ़ाइलें बनाने की अनुमति दें",
		fileEdit: "फ़ाइलें संपादित करें",
		fileEditDesc: "एजेंट को मौजूदा फ़ाइलें संशोधित करने की अनुमति दें",
		webOperations: "वेब ऑपरेशन",
		advanced: "उन्नत",
		extendedThinking: "विस्तारित सोच",
		extendedThinkingDesc: "गहन विश्लेषण के लिए विस्तारित सोच का उपयोग करें",
		// Skills section
		skills: "कौशल",
		skillsNote: "कौशल Obsidian के साथ काम करने के लिए विशेष निर्देश प्रदान करते हैं",
		noSkillsAvailable: "कोई कौशल उपलब्ध नहीं",
		customSkill: "कस्टम",
		createNewSkill: "नया बनाएं",
		builtinSkills: "अंतर्निहित कौशल",
		customSkills: "कस्टम कौशल",
		validateSkill: "कौशल सत्यापित करें",
		addCustomSkill: "कौशल जोड़ें",
		addCustomSkillDesc: "कस्टम निर्देशों के साथ अपना कौशल बनाएं",
		skillCreatedSuccess: "कौशल \"{name}\" सफलतापूर्वक बनाया गया",

		// Create Skill Modal
		createNewSkillTitle: "कौशल बनाएं",
		skillNameField: "कौशल का नाम",
		skillNameFieldDesc: "केबाब-केस में अद्वितीय पहचानकर्ता (जैसे, my-custom-skill)",
		skillNamePlaceholder: "my-skill-name",
		skillDescriptionField: "विवरण",
		skillDescriptionFieldDesc: "ट्रिगरिंग के लिए विस्तृत विवरण (यह क्या करता है, कब उपयोग करें)",
		skillDescriptionPlaceholder: "बताएं कि यह कौशल क्या करता है...",
		optionalFolders: "वैकल्पिक फोल्डर",
		includeScripts: "scripts/ शामिल करें",
		includeScriptsDesc: "निष्पादन योग्य कोड के लिए (Python, shell स्क्रिप्ट)",
		includeReferences: "references/ शामिल करें",
		includeReferencesDesc: "संदर्भ में लोड किए गए दस्तावेज़ों के लिए",
		includeAssets: "assets/ शामिल करें",
		includeAssetsDesc: "आउटपुट फ़ाइलों के लिए (टेम्पलेट, चित्र)",
		createSkillButton: "बनाएं",
		skillNameRequired: "कौशल का नाम आवश्यक है",
		invalidSkillName: "अमान्य नाम। केबाब-केस उपयोग करें (छोटे अक्षर, अंक, हाइफ़न)।",
		skillDescriptionRequired: "विवरण आवश्यक है",
		skillCreationFailed: "कौशल बनाने में विफल",

		// Validate Skill Modal
		validateSkillTitle: "सत्यापन: {name}",
		validating: "सत्यापित कर रहे हैं...",
		skillIsValid: "✓ कौशल मान्य है",
		errors: "त्रुटियां",
		warnings: "चेतावनियां",
		closeButton: "बंद करें",

		// Skill Selector Modal
		selectSkillTitle: "कौशल चुनें",
		noCustomSkillsFound: ".crystal/skills/ में कोई कस्टम कौशल नहीं मिला",

		// Edit Skill Modal
		editSkillTitle: "संपादित करें: {name}",
		skillInstructionsField: "निर्देश",
		skillInstructionsFieldDesc: "कौशल की मुख्य सामग्री — AI के लिए निर्देश",
		resourceFolders: "संसाधन फ़ोल्डर",
		scriptsFolder: "scripts/",
		scriptsFolderDesc: "निष्पादन योग्य कोड (Python, shell स्क्रिप्ट)",
		referencesFolder: "references/",
		referencesFolderDesc: "संदर्भ में लोड किए गए दस्तावेज़",
		assetsFolder: "assets/",
		assetsFolderDesc: "आउटपुट फ़ाइलें (टेम्पलेट, चित्र)",
		deleteSkillButton: "कौशल हटाएं",
		noFilesInFolder: "कोई फ़ाइल नहीं। फ़ोल्डर में सीधे फ़ाइलें जोड़ें।",
		openFolderButton: "फ़ोल्डर खोलें",
		skillSaved: "कौशल सहेजा गया",
		skillSaveFailed: "कौशल सहेजने में विफल",
		confirmDeleteSkill: "क्या आप वाकई कौशल \"{name}\" हटाना चाहते हैं?",
		skillDeleted: "कौशल हटाया गया",
		skillDeleteFailed: "कौशल हटाने में विफल",
		addFilesButton: "फ़ाइलें जोड़ें",
		selectFilesToAdd: "जोड़ने के लिए फ़ाइलें चुनें",
		filesAdded: "फ़ाइलें सफलतापूर्वक जोड़ी गईं",
		filesAddFailed: "फ़ाइलें जोड़ने में विफल",

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
		agentsSection: "Crystal एजेंट",
		addAgent: "एजेंट जोड़ें",
		comingSoon: "जल्द आ रहा है",
		agentAlreadyExists: "पहले से जोड़ा गया",
		defaultAgent: "डिफ़ॉल्ट एजेंट",
		defaultAgentDesc: "नई चैट के लिए कौन सा एजेंट डिफ़ॉल्ट रूप से उपयोग करना है",
		agentSettingsTitle: "सेटिंग्स",
		settingsButton: "सेटिंग्स",

		// Updated model description
		defaultModelDescNoSlash: "नई चैट के लिए मॉडल।",

		// Terminal integration
		startIntegration: "एकीकरण शुरू करें",
		openTerminal: "टर्मिनल खोलें",
		openTerminalDesc: "Claude Code के साथ सिस्टम टर्मिनल खोलें",
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
		availableModelsDesc: "जिन मॉडलों का उपयोग नहीं करना चाहते उन्हें अक्षम करें",

		// Agent Personalization
		agentPersonalization: "एजेंट वैयक्तिकरण",
		agentPersonalizationDesc: "यह जानकारी Claude को आपके संदर्भ को समझने और प्रतिक्रियाओं को अनुकूलित करने में मदद करती है। सभी फ़ील्ड वैकल्पिक हैं।",
		personalizationUserName: "नाम",
		personalizationUserNameDesc: "मुझे आपको कैसे संबोधित करना चाहिए",
		personalizationUserNamePlaceholder: "जैसे: अलेक्स",
		personalizationUserRole: "भूमिका / पेशा",
		personalizationUserRoleDesc: "आपका पेशा या भूमिका",
		personalizationUserRolePlaceholder: "जैसे: उत्पाद डिजाइनर",
		personalizationWorkContext: "कार्य संदर्भ",
		personalizationWorkContextDesc: "अपने कार्य और ज्ञान आधार का वर्णन करें",
		personalizationWorkContextPlaceholder: "जैसे: UX अनुसंधान और डिज़ाइन सिस्टम के लिए ज्ञान आधार का प्रबंधन",
		personalizationCommunicationStyle: "संचार शैली",
		personalizationCommunicationStyleDesc: "आप प्रतिक्रियाएं कैसे प्राप्त करना पसंद करते हैं",
		personalizationCommunicationStylePlaceholder: "जैसे: संक्षिप्त, सटीक, उदाहरणों के साथ",
		personalizationCurrentFocus: "वर्तमान फोकस",
		personalizationCurrentFocusDesc: "आप वर्तमान में किस पर काम कर रहे हैं",
		personalizationCurrentFocusPlaceholder: "जैसे: मोबाइल ऐप का रीडिज़ाइन",
		personalizationConfigured: "कॉन्फ़िगर किया गया",
		personalizationNotConfigured: "कॉन्फ़िगर करें...",
		clearAllButton: "सब मिटाएं"
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
		// New permissions
		fileOperations: "文件操作",
		fileRead: "读取文件",
		fileReadDesc: "允许代理读取文件（.md、.canvas、.base）",
		fileWrite: "创建文件",
		fileWriteDesc: "允许代理创建新文件",
		fileEdit: "编辑文件",
		fileEditDesc: "允许代理修改现有文件",
		webOperations: "网络操作",
		advanced: "高级",
		extendedThinking: "扩展思考",
		extendedThinkingDesc: "使用扩展思考进行深度分析",
		// Skills section
		skills: "技能",
		skillsNote: "技能为 Obsidian 工作提供专业指导",
		noSkillsAvailable: "没有可用的技能",
		customSkill: "自定义",
		createNewSkill: "创建新技能",
		builtinSkills: "内置技能",
		customSkills: "自定义技能",
		validateSkill: "验证技能",
		addCustomSkill: "添加技能",
		addCustomSkillDesc: "使用自定义指令创建您自己的技能",
		skillCreatedSuccess: "技能 \"{name}\" 创建成功",

		// Create Skill Modal
		createNewSkillTitle: "创建技能",
		skillNameField: "技能名称",
		skillNameFieldDesc: "使用 kebab-case 格式的唯一标识符（例如：my-custom-skill）",
		skillNamePlaceholder: "my-skill-name",
		skillDescriptionField: "描述",
		skillDescriptionFieldDesc: "用于触发的详细描述（功能、使用场景）",
		skillDescriptionPlaceholder: "描述这个技能的功能...",
		optionalFolders: "可选文件夹",
		includeScripts: "包含 scripts/",
		includeScriptsDesc: "用于可执行代码（Python、shell 脚本）",
		includeReferences: "包含 references/",
		includeReferencesDesc: "用于加载到上下文中的文档",
		includeAssets: "包含 assets/",
		includeAssetsDesc: "用于输出文件（模板、图片）",
		createSkillButton: "创建",
		skillNameRequired: "技能名称为必填项",
		invalidSkillName: "名称无效。请使用 kebab-case（小写字母、数字、连字符）。",
		skillDescriptionRequired: "描述为必填项",
		skillCreationFailed: "创建技能失败",

		// Validate Skill Modal
		validateSkillTitle: "验证：{name}",
		validating: "验证中...",
		skillIsValid: "✓ 技能有效",
		errors: "错误",
		warnings: "警告",
		closeButton: "关闭",

		// Skill Selector Modal
		selectSkillTitle: "选择技能",
		noCustomSkillsFound: "在 .crystal/skills/ 中未找到自定义技能",

		// Edit Skill Modal
		editSkillTitle: "编辑：{name}",
		skillInstructionsField: "指令",
		skillInstructionsFieldDesc: "技能的主要内容 — AI 的指令",
		resourceFolders: "资源文件夹",
		scriptsFolder: "scripts/",
		scriptsFolderDesc: "可执行代码（Python、shell 脚本）",
		referencesFolder: "references/",
		referencesFolderDesc: "加载到上下文中的文档",
		assetsFolder: "assets/",
		assetsFolderDesc: "输出文件（模板、图片）",
		deleteSkillButton: "删除技能",
		noFilesInFolder: "没有文件。直接将文件添加到文件夹。",
		openFolderButton: "打开文件夹",
		skillSaved: "技能已保存",
		skillSaveFailed: "保存技能失败",
		confirmDeleteSkill: "您确定要删除技能 \"{name}\" 吗？",
		skillDeleted: "技能已删除",
		skillDeleteFailed: "删除技能失败",
		addFilesButton: "添加文件",
		selectFilesToAdd: "选择要添加的文件",
		filesAdded: "文件添加成功",
		filesAddFailed: "添加文件失败",

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
		agentsSection: "Crystal 代理",
		addAgent: "添加代理",
		comingSoon: "即将推出",
		agentAlreadyExists: "已添加",
		defaultAgent: "默认代理",
		defaultAgentDesc: "新聊天默认使用哪个代理",
		agentSettingsTitle: "设置",
		settingsButton: "设置",

		// Updated model description
		defaultModelDescNoSlash: "用于新聊天的模型。",

		// Terminal integration
		startIntegration: "开始集成",
		openTerminal: "打开终端",
		openTerminalDesc: "使用 Claude Code 打开系统终端",
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
		availableModelsDesc: "禁用您不想使用的模型",

		// Agent Personalization
		agentPersonalization: "助手个性化",
		agentPersonalizationDesc: "这些信息帮助 Claude 理解您的背景并调整回复。所有字段都是可选的。",
		personalizationUserName: "姓名",
		personalizationUserNameDesc: "我该如何称呼您",
		personalizationUserNamePlaceholder: "例如：小明",
		personalizationUserRole: "角色 / 职业",
		personalizationUserRoleDesc: "您的职业或角色",
		personalizationUserRolePlaceholder: "例如：产品设计师",
		personalizationWorkContext: "工作背景",
		personalizationWorkContextDesc: "描述您的工作和知识库",
		personalizationWorkContextPlaceholder: "例如：管理 UX 研究和设计系统的知识库",
		personalizationCommunicationStyle: "沟通风格",
		personalizationCommunicationStyleDesc: "您希望如何接收回复",
		personalizationCommunicationStylePlaceholder: "例如：简洁、重点突出、带示例",
		personalizationCurrentFocus: "当前关注",
		personalizationCurrentFocusDesc: "您目前在做什么",
		personalizationCurrentFocusPlaceholder: "例如：移动应用重新设计",
		personalizationConfigured: "已配置",
		personalizationNotConfigured: "配置...",
		clearAllButton: "清除全部"
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
		// New permissions
		fileOperations: "ファイル操作",
		fileRead: "ファイル読み取り",
		fileReadDesc: "エージェントにファイルの読み取りを許可（.md、.canvas、.base）",
		fileWrite: "ファイル作成",
		fileWriteDesc: "エージェントに新規ファイルの作成を許可",
		fileEdit: "ファイル編集",
		fileEditDesc: "エージェントに既存ファイルの変更を許可",
		webOperations: "ウェブ操作",
		advanced: "詳細設定",
		extendedThinking: "拡張思考",
		extendedThinkingDesc: "深い分析のために拡張思考を使用",
		// Skills section
		skills: "スキル",
		skillsNote: "スキルは Obsidian での作業に特化した指示を提供します",
		noSkillsAvailable: "利用可能なスキルがありません",
		customSkill: "カスタム",
		createNewSkill: "新規作成",
		builtinSkills: "内蔵スキル",
		customSkills: "カスタムスキル",
		validateSkill: "スキルを検証",
		addCustomSkill: "スキルを追加",
		addCustomSkillDesc: "カスタム指示で独自のスキルを作成",
		skillCreatedSuccess: "スキル「{name}」が正常に作成されました",

		// Create Skill Modal
		createNewSkillTitle: "スキルを作成",
		skillNameField: "スキル名",
		skillNameFieldDesc: "ケバブケースの一意の識別子（例：my-custom-skill）",
		skillNamePlaceholder: "my-skill-name",
		skillDescriptionField: "説明",
		skillDescriptionFieldDesc: "トリガー用の詳細な説明（機能、使用タイミング）",
		skillDescriptionPlaceholder: "このスキルの機能を説明してください...",
		optionalFolders: "オプションフォルダ",
		includeScripts: "scripts/ を含める",
		includeScriptsDesc: "実行可能コード用（Python、シェルスクリプト）",
		includeReferences: "references/ を含める",
		includeReferencesDesc: "コンテキストに読み込むドキュメント用",
		includeAssets: "assets/ を含める",
		includeAssetsDesc: "出力ファイル用（テンプレート、画像）",
		createSkillButton: "作成",
		skillNameRequired: "スキル名は必須です",
		invalidSkillName: "無効な名前。ケバブケースを使用してください（小文字、数字、ハイフン）。",
		skillDescriptionRequired: "説明は必須です",
		skillCreationFailed: "スキルの作成に失敗しました",

		// Validate Skill Modal
		validateSkillTitle: "検証：{name}",
		validating: "検証中...",
		skillIsValid: "✓ スキルは有効です",
		errors: "エラー",
		warnings: "警告",
		closeButton: "閉じる",

		// Skill Selector Modal
		selectSkillTitle: "スキルを選択",
		noCustomSkillsFound: ".crystal/skills/ にカスタムスキルが見つかりません",

		// Edit Skill Modal
		editSkillTitle: "編集：{name}",
		skillInstructionsField: "指示",
		skillInstructionsFieldDesc: "スキルの主要コンテンツ — AI への指示",
		resourceFolders: "リソースフォルダ",
		scriptsFolder: "scripts/",
		scriptsFolderDesc: "実行可能コード（Python、シェルスクリプト）",
		referencesFolder: "references/",
		referencesFolderDesc: "コンテキストに読み込むドキュメント",
		assetsFolder: "assets/",
		assetsFolderDesc: "出力ファイル（テンプレート、画像）",
		deleteSkillButton: "スキルを削除",
		noFilesInFolder: "ファイルがありません。フォルダに直接ファイルを追加してください。",
		openFolderButton: "フォルダを開く",
		skillSaved: "スキルを保存しました",
		skillSaveFailed: "スキルの保存に失敗しました",
		confirmDeleteSkill: "スキル「{name}」を削除してもよろしいですか？",
		skillDeleted: "スキルを削除しました",
		skillDeleteFailed: "スキルの削除に失敗しました",
		addFilesButton: "ファイルを追加",
		selectFilesToAdd: "追加するファイルを選択",
		filesAdded: "ファイルが正常に追加されました",
		filesAddFailed: "ファイルの追加に失敗しました",

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
		agentsSection: "Crystal エージェント",
		addAgent: "エージェントを追加",
		comingSoon: "近日公開",
		agentAlreadyExists: "追加済み",
		defaultAgent: "デフォルトエージェント",
		defaultAgentDesc: "新しいチャットでデフォルトで使用するエージェント",
		agentSettingsTitle: "設定",
		settingsButton: "設定",

		// Updated model description
		defaultModelDescNoSlash: "新しいチャットで使用するモデル。",

		// Terminal integration
		startIntegration: "統合を開始",
		openTerminal: "ターミナルを開く",
		openTerminalDesc: "Claude Codeでシステムターミナルを開く",
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
		availableModelsDesc: "使用したくないモデルを無効にする",

		// Agent Personalization
		agentPersonalization: "エージェントのパーソナライズ",
		agentPersonalizationDesc: "この情報はClaudeがあなたのコンテキストを理解し、回答をカスタマイズするのに役立ちます。すべてのフィールドは任意です。",
		personalizationUserName: "名前",
		personalizationUserNameDesc: "どのようにお呼びすればよいですか",
		personalizationUserNamePlaceholder: "例：太郎",
		personalizationUserRole: "役割 / 職業",
		personalizationUserRoleDesc: "あなたの職業または役割",
		personalizationUserRolePlaceholder: "例：プロダクトデザイナー",
		personalizationWorkContext: "仕事の背景",
		personalizationWorkContextDesc: "あなたの仕事とナレッジベースについて説明してください",
		personalizationWorkContextPlaceholder: "例：UXリサーチとデザインシステムのナレッジベースを管理",
		personalizationCommunicationStyle: "コミュニケーションスタイル",
		personalizationCommunicationStyleDesc: "どのように回答を受け取りたいですか",
		personalizationCommunicationStylePlaceholder: "例：簡潔に、要点を押さえて、例を交えて",
		personalizationCurrentFocus: "現在のフォーカス",
		personalizationCurrentFocusDesc: "現在取り組んでいること",
		personalizationCurrentFocusPlaceholder: "例：モバイルアプリのリデザイン",
		personalizationConfigured: "設定済み",
		personalizationNotConfigured: "設定する...",
		clearAllButton: "すべてクリア"
	}
};

export function getSettingsLocale(language: LanguageCode): SettingsLocale {
	return SETTINGS_LOCALES[language] || SETTINGS_LOCALES.en;
}
