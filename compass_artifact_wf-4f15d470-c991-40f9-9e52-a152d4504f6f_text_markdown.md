# Системы Skills в AI-кодинг CLI: полный технический гайд

Три главных AI-кодинг CLI — Claude Code, OpenAI Codex CLI и Gemini CLI — пришли к удивительно похожему подходу к расширяемости через системы "skills". Все три используют **SKILL.md файлы с YAML-метаданными**, следуют почти идентичным соглашениям по директориям и применяют прогрессивную загрузку для экономии контекстного окна. В декабре 2025 года эта конвергенция оформилась в открытый стандарт на **agentskills.io**, который теперь поддерживают все три инструмента.

---

## Общий архитектурный паттерн

Каждый skill во всех трёх платформах — это **папка с файлом SKILL.md**. Файл использует YAML frontmatter для метаданных и Markdown-тело для инструкций. При запуске в системный промпт загружаются только легковесные метаданные (~100 токенов на skill). Полные инструкции подгружаются по требованию — либо по явному вызову пользователя, либо когда модель определяет, что skill подходит под задачу на основе его описания.

```
skill-name/
├── SKILL.md              # Обязательно: метаданные + инструкции
├── scripts/              # Опционально: исполняемый код
├── references/           # Опционально: документация (грузится по надобности)
└── assets/               # Опционально: шаблоны, ресурсы
```

Этот паттерн позволяет иметь **неограниченные библиотеки skills** без раздувания контекстного окна.

---

## Система skills в Claude Code

Система skills в Claude Code, анонсированная в октябре 2025, заложила фундаментальную архитектуру, которую затем переняли остальные.

### Формат SKILL.md и обязательные поля

Каждый SKILL.md требует два поля в frontmatter: `name` (максимум 64 символа, только строчные буквы и дефисы) и `description` (максимум 1024 символа, идеально — до 200 для оптимального обнаружения). Описание критически важно — Claude использует его, чтобы решить, когда вызывать skill автономно.

```markdown
---
name: generating-commit-messages
description: Генерирует понятные коммит-сообщения из git diff. Используй при написании коммитов или просмотре staged-изменений.
---

# Генерация коммит-сообщений

## Инструкции
1. Запусти `git diff --staged` чтобы увидеть изменения
2. Предложи коммит-сообщение с:
   - Заголовком до 50 символов
   - Детальным описанием
   - Затронутыми компонентами

## Лучшие практики
- Используй настоящее время
- Объясняй что и почему, а не как
```

Опциональные поля frontmatter: `allowed-tools` (ограничивает инструменты во время выполнения skill), `user-invocable` (false скрывает из меню), `disable-model-invocation` (блокирует автономный вызов), `dependencies` (необходимые пакеты).

### Расположение директорий и приоритет

Skills обнаруживаются из трёх мест по порядку: **plugin skills** (в составе установленных плагинов), **project skills** в `.claude/skills/` в корне репозитория, и **personal skills** в `~/.claude/skills/`. Project skills имеют приоритет над personal, что позволяет командам переопределять индивидуальные настройки.

### Механика обнаружения и вызова

Claude Code предзагружает все метаданные skills при старте в XML-блок `<available_skills>` в системном промпте. При обработке запроса Claude оценивает, подходит ли описание какого-либо skill под контекст задачи. Если да — Claude вызывает внутренний мета-инструмент "Skill", который читает полное тело SKILL.md и инжектит его в разговор. Файлы из `references/` подгружаются по требованию через bash/Read; скрипты выполняются, и только их вывод попадает в контекст.

Пользователи могут вызывать skills явно через синтаксис `@skill-name` или slash-команды. Skills также можно назначать кастомным агентам, добавив поле `skills: skill-1, skill-2` в файлы определения агентов.

### Пример production skill

```markdown
---
name: pdf
description: Извлекает текст и таблицы из PDF, заполняет формы, объединяет документы. Используй при работе с PDF или когда пользователь упоминает PDF, формы, извлечение документов.
---

# Обработка PDF

Этот гайд покрывает основные операции с PDF через Python-библиотеки и CLI-инструменты.

Для продвинутых фич, JavaScript-библиотек и детальных примеров смотри reference.md.
Если нужно заполнить PDF-форму, читай forms.md и следуй инструкциям.
```

Этот skill демонстрирует прогрессивную загрузку — основной SKILL.md минимален, детали выносятся в отдельные файлы, которые грузятся только при необходимости.

---

## Система конфигурации OpenAI Codex CLI

Codex CLI принял стандарт Agent Skills, добавив комплементарные системы: **AGENTS.md** для постоянных инструкций и **Custom Prompts** для переиспользуемых slash-команд.

### Реализация Skills

Skills в Codex CLI используют идентичный формат SKILL.md, с немного другими ограничениями: `name` максимум 100 символов, `description` максимум 500 символов. Опциональное поле `metadata.short-description` даёт текст для отображения пользователю.

```markdown
---
name: draft-commit-message
description: Создаёт conventional commit сообщение когда пользователь просит помочь с написанием коммита.
metadata:
  short-description: Создать информативное коммит-сообщение.
---

Создай conventional commit сообщение, соответствующее описанию изменений от пользователя.

Требования:
- Используй формат Conventional Commits: `type(scope): summary`
- Используй повелительное наклонение в summary
- Держи summary до 72 символов
```

Skills располагаются в `~/.codex/skills/` (глобально) или `.codex/skills/` (проект), плюс дополнительные места в `/etc/codex/skills/` (админ) и родительских директориях внутри git-репозиториев. Вызов через `$skill-name` или команду `/skills`.

### AGENTS.md — постоянные инструкции

Файлы AGENTS.md предоставляют инструкции на уровне проекта или глобально — эквивалент CLAUDE.md в Claude Code. Codex проходит от корня репозитория до текущей директории, загружая все AGENTS.md иерархически. Override-файлы (`AGENTS.override.md`) имеют приоритет на каждом уровне.

```markdown
# Ожидания по репозиторию

- Запускай `npm run lint` перед открытием pull request.
- Документируй публичные утилиты в `docs/` при изменении поведения.
- Предпочитай `pnpm` при установке зависимостей.
```

### Custom prompts как slash-команды

Codex CLI хранит переиспользуемые промпты как Markdown-файлы в `~/.codex/prompts/`. Каждый файл становится slash-командой с тем же именем.

```markdown
---
description: Подготовить ветку, коммит и открыть draft PR
argument-hint: [FILES=<paths>] [PR_TITLE="<title>"]
---

Создай ветку с именем `dev/<feature_name>` для этой работы.
Если указаны файлы, сначала добавь их в stage: $FILES.
Закоммить staged-изменения с понятным сообщением.
Открой draft PR на этой же ветке используя $PR_TITLE.
```

Вызов: `/prompts:draftpr FILES="src/index.js" PR_TITLE="Add hero animation"`

### Конфигурация через TOML

Codex CLI использует `~/.codex/config.toml` для всей конфигурации:

```toml
model = "gpt-5.2"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[features]
skills = true

[profiles.openrouter]
model = "gpt-5"
model_provider = "openrouter"
```

---

## Архитектура расширений Gemini CLI

Gemini CLI предлагает наиболее многослойную систему кастомизации: Agent Skills (экспериментально), Extensions (упаковка), Custom Commands (TOML-промпты), GEMINI.md (контекст) и MCP-серверы (инструменты).

### Agent Skills (экспериментальная фича)

Agent Skills требуют включения в настройках: `"experimental": { "skills": true }`. После включения skills используют стандартный формат SKILL.md в `~/.gemini/skills/` (глобально) или `.gemini/skills/` (проект).

```markdown
---
name: api-auditor
description: Экспертиза в аудите и тестировании API-эндпоинтов. Используй когда пользователь просит проверить здоровье API, тестировать эндпоинты или аудировать ответы API.
---

# API Auditor Skill

Ты действуешь как QA-инженер, специализирующийся на надёжности API. Когда этот skill активирован:

1. Используй скрипты из директории `scripts/`
2. Проверяй HTTP-статусы, время ответа и валидность payload
3. Отчитывайся в структурированном формате
```

Gemini CLI добавляет явное согласие пользователя: при активации skill пользователь видит промпт с названием skill, его назначением и путём к директории до загрузки.

### Custom commands через TOML

В отличие от Claude Code и Codex CLI, Gemini CLI имеет отдельную систему custom commands на TOML-файлах. Команды в `~/.gemini/commands/` становятся slash-командами.

```toml
# Файл: git/commit.toml → Вызывается как /git:commit
description = "Генерирует коммит-сообщение из staged-изменений."
prompt = """
Сгенерируй Conventional Commit сообщение:

```diff
!{git diff --staged}
```
"""
```

Три синтаксиса инъекции для динамического контента: `{{args}}` для аргументов пользователя, `!{command}` для вывода shell, `@{path}` для содержимого файлов.

### Система упаковки Extensions

Самая отличительная фича Gemini CLI — **система Extensions** — полный формат упаковки для дистрибуции skills, commands, MCP-серверов и hooks вместе.

```
my-extension/
├── gemini-extension.json    # Манифест
├── GEMINI.md                # Контекстный файл
├── commands/                # Bundled commands
├── skills/                  # Bundled skills
├── hooks/                   # Lifecycle hooks
└── dist/                    # MCP servers
```

Манифест (`gemini-extension.json`) объявляет все компоненты:

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "contextFileName": "GEMINI.md",
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["${extensionPath}${/}dist${/}server.js"]
    }
  }
}
```

Extensions устанавливаются через `gemini extensions install <github-url>` и появляются в `~/.gemini/extensions/`.

### Конфигурация через JSON

Gemini CLI использует `settings.json` с вложенными объектами для разных подсистем:

```json
{
  "experimental": { "skills": true },
  "context": {
    "fileName": ["GEMINI.md"],
    "includeDirectories": ["../shared"]
  },
  "tools": {
    "allowed": ["run_shell_command(git)"],
    "exclude": ["web_fetch"]
  },
  "mcpServers": { ... }
}
```

---

## Сравнительный анализ всех трёх инструментов

### Общие паттерны

Все три инструмента разделяют фундаментальные дизайн-решения:

- **SKILL.md с YAML frontmatter** — универсальный формат
- **Прогрессивная загрузка** — метаданные при старте, полный контент по требованию — везде
- **Поля name и description** — обязательны везде, description управляет автономным вызовом
- **Скопирование по директориям** — идентичные паттерны: user-global (`~/.<tool>/skills/`), project-specific (`.<tool>/skills/`), опционально system/admin
- **Bundled assets** (scripts, references) — грузятся контекстуально

### Ключевые различия

| Аспект | Claude Code | Codex CLI | Gemini CLI |
|--------|-------------|-----------|------------|
| **Формат конфига** | JSON | TOML | JSON |
| **Файл конфига** | settings.json | config.toml | settings.json |
| **Контекстный файл** | CLAUDE.md | AGENTS.md | GEMINI.md |
| **Вызов skill** | @skill-name | $skill-name | /skills команда |
| **Статус skills** | Production | Experimental (вкл. по умолч.) | Experimental (opt-in) |
| **Custom commands** | Через агентов | ~/.codex/prompts/*.md | ~/.gemini/commands/*.toml |
| **Упаковка расширений** | Ограничено | Нет | Полная система |
| **Override-файлы** | Нет | AGENTS.override.md | Нет |

### Механизмы вызова

**Model-invoked** (автономный): Все три поддерживают — модель читает описания skills и решает, когда вызывать, на основе контекста задачи. Качество описания напрямую влияет на точность вызова.

**User-invoked** (явный): Claude Code использует `@skill-name` или slash-меню, Codex CLI использует `$skill-name` или `/skills`, Gemini CLI использует `/skills list` и `/skills enable`.

---

## Гайд по имплементации для плагина Cristal

На основе этого исследования — как реализовать систему skills в Obsidian-плагине:

### Рекомендуемая файловая структура

```
<vault>/.cristal/
├── settings.json           # Конфигурация плагина
├── CRISTAL.md              # Глобальный контекст/инструкции
├── skills/                 # Пользовательские skills
│   └── my-skill/
│       ├── SKILL.md
│       ├── scripts/
│       └── references/
└── commands/               # Custom slash-команды
    └── summarize.md
```

### Спецификация парсера SKILL.md

Парсить YAML frontmatter между маркерами `---`. Обязательные поля: `name` (строка, валидировать как lowercase alphanumeric с дефисами, макс 64 символа) и `description` (строка, макс 1024 символа). Опциональные: `allowed-tools`, `disabled`, `dependencies`. Body — всё после второго маркера `---`.

```typescript
interface SkillMetadata {
  name: string;           // Обязательно, валидируется
  description: string;    // Обязательно, используется для matching
  allowedTools?: string[];
  disabled?: boolean;
  dependencies?: string[];
}

interface Skill {
  metadata: SkillMetadata;
  body: string;           // Markdown-инструкции
  path: string;           // Путь к папке
  assets: {
    scripts: string[];
    references: string[];
  };
}
```

### Алгоритм обнаружения

При загрузке плагина:
1. Сканировать `<vault>/.cristal/skills/` на директории с SKILL.md
2. Парсить только YAML frontmatter (не body) для каждого skill
3. Построить индекс доступных skills: `Map<name, { description, path }>`
4. Инжектить индекс в системный промпт как компактный список

При вызове skill:
1. Загрузить полное тело SKILL.md в контекст
2. Распарсить директории assets (scripts/, references/)
3. Сделать пути к assets доступными агенту
4. Отслеживать использование токенов для управления контекстом

### Алгоритм matching

Для model-invoked skills реализуй семантический matching:
1. Эмбеддить все описания skills при старте
2. При обработке запроса пользователя — эмбеддить запрос
3. Вычислить cosine similarity между запросом и каждым описанием skill
4. Skills выше порога (напр. 0.7) — кандидаты
5. Дать модели сделать финальный выбор из кандидатов

Альтернативно, более простой keyword matching: извлечь ключевые слова из запроса, матчить с описаниями и именами skills, показать совпадения выше порога.

### Схема конфигурации

```json
{
  "skills": {
    "enabled": true,
    "autoInvoke": true,
    "matchThreshold": 0.7,
    "disabled": ["deprecated-skill"],
    "paths": {
      "global": "~/.cristal/skills/",
      "project": ".cristal/skills/"
    }
  },
  "context": {
    "fileName": "CRISTAL.md",
    "maxTokens": 32768
  }
}
```

### Best practices со всех трёх платформ

- Держи SKILL.md до 500 строк; используй прогрессивную загрузку для более длинного контента
- Пиши описания, которые отвечают и на "что" и на "когда" — включай триггерные фразы
- Используй gerund-нейминг (`generating-reports`, не `report-generator`)
- Избегай time-sensitive контента; skills должны быть evergreen
- Скрипты должны выполняться без загрузки исходников в контекст
- Reference-файлы должны быть на один уровень глубины — избегай вложенных импортов
- Тестируй discovery проверкой корректной загрузки метаданных при старте

---

## Официальные источники документации

**Claude Code**: https://code.claude.com/docs/en/skills, https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview, https://github.com/anthropics/skills

**OpenAI Codex CLI**: https://developers.openai.com/codex/skills/, https://developers.openai.com/codex/guides/agents-md/, https://github.com/openai/codex

**Gemini CLI**: https://geminicli.com/docs/cli/skills/, https://geminicli.com/docs/extensions/, https://github.com/google-gemini/gemini-cli

**Открытый стандарт**: https://agentskills.io (кросс-платформенная спецификация, принятая всеми тремя инструментами)