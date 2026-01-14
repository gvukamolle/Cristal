# Cristal - Multi-Agent Obsidian Plugin

## Обзор проекта

Плагин для Obsidian, интегрирующий несколько AI провайдеров через CLI:
- **Claude AI** (Anthropic) через Claude Code CLI
- **Codex** (OpenAI) через Codex CLI
- Расширяемая архитектура для добавления новых агентов (Gemini, Grok и другие)

Использует существующие подписки через OAuth аутентификацию CLI.

**Ключевые возможности:**
- **Модульная система Skills** — 6 встроенных навыков для Obsidian + поддержка пользовательских
- **Multi-agent архитектура** — несколько агентов одновременно с per-agent конфигурацией
- **Встроенный терминал** — управление CLI, OAuth авторизация, установка зависимостей (xterm.js)
- **Расширенные разрешения** — детальный контроль (webSearch, webFetch, task, fileRead/Write/Edit, extendedThinking)
- **Отслеживание лимитов** — визуализация лимитов Claude и Codex (API + парсинг сессий)

### Цель
Нативная multi-agent система в Obsidian с:
- Полным доступом к vault
- Детальными разрешениями для каждого агента
- Встроенным терминалом для управления CLI
- Модульной системой навыков для специализации агентов
- Статистикой использования с визуальными лимитами

### Ключевое ограничение
Anthropic и OpenAI **официально не разрешают** third-party приложениям использовать OAuth подписку напрямую:
> "Unless previously approved, we do not allow third party developers to offer Claude.ai login or rate limits for their products"

**Решение:** Плагин работает как wrapper над локально установленными CLI — пользователь сам авторизуется в CLI, и плагин использует их как subprocess. Это легальный способ интеграции, так как CLI принадлежат самим провайдерам.

---

## Архитектура

### High-level flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      Obsidian Plugin                             │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   ChatView   │  │TerminalView  │  │   Settings   │         │
│  │              │  │              │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│  ┌──────▼──────────────────▼──────────────────▼───────┐        │
│  │            CristalPlugin (main.ts)                  │        │
│  │  - settings.agents (AgentConfig[])                  │        │
│  │  - settings.defaultAgentId                          │        │
│  │  - SkillLoader — управление навыками                │        │
│  │  - TerminalService — управление терминалом          │        │
│  └──────┬───────────────────┬──────────────────────────┘        │
│         │                   │                                    │
│  ┌──────▼──────┐     ┌──────▼──────┐                           │
│  │ClaudeService│     │CodexService │                           │
│  │- spawn CLI  │     │- spawn CLI  │                           │
│  │- stream-json│     │- json events│                           │
│  │- permissions│     │- sandbox    │                           │
│  └──────┬──────┘     └──────┬──────┘                           │
│         │                   │                                    │
│  ┌──────▼───────────────────▼──────┐                           │
│  │     UsageLimitsService           │                           │
│  │  - fetchClaudeUsage() (API)      │                           │
│  │  - fetchCodexUsage() (sessions)  │                           │
│  └──────────────────────────────────┘                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Skills System                           │  │
│  │  - SkillLoader — загрузчик встроенных/пользовательских  │  │
│  │  - SkillParser — парсер SKILL.md (YAML + Markdown)     │  │
│  │  - 6 builtin skills: Markdown, Canvas, Base, Links...  │  │
│  │  - Синхронизация в .claude/skills/ и .codex/skills/    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Terminal Integration (xterm.js)            │  │
│  │  - TerminalService — управление PTY сессиями            │  │
│  │  - PythonPtyBackend / FallbackPtyBackend                │  │
│  │  - OAuth авторизация CLI, установка зависимостей        │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────┬───────────────────┬────────────────────────────────────────┘
       │                   │
  ┌────▼──────┐     ┌─────▼──────┐
  │Claude CLI │     │Codex CLI   │
  │(subprocess)     │(subprocess)│
  └────┬──────┘     └─────┬──────┘
       │                   │
  ┌────▼──────┐     ┌─────▼──────┐
  │Anthropic  │     │OpenAI      │
  │API (OAuth)│     │API (OAuth) │
  └───────────┘     └────────────┘
```

### Структура проекта

```
cristal/
├── src/
│   ├── main.ts                    # Plugin entry (CristalPlugin class)
│   ├── ChatView.ts                # Chat UI (ItemView) — 4237 строк
│   ├── settings.ts                # Settings UI & persistence
│   ├── settingsLocales.ts         # Settings UI localization (8 languages)
│   ├── buttonLocales.ts           # Button localization (8 languages)
│   ├── systemPrompts.ts           # AI instructions (8 languages)
│   ├── commands.ts                # Slash-commands system
│   ├── types.ts                   # TypeScript types & interfaces
│   │
│   ├── ClaudeService.ts           # Claude Code CLI wrapper
│   ├── CodexService.ts            # Codex CLI wrapper
│   ├── UsageLimitsService.ts      # Token tracking & API limits
│   ├── cliDetector.ts             # CLI auto-detection (which/where)
│   ├── codexConfig.ts             # Codex config.toml manager
│   │
│   ├── skills/                    # ✨ НОВОЕ: Skills system
│   │   ├── SkillLoader.ts         # Loader & syncer (264 строки)
│   │   ├── SkillParser.ts         # SKILL.md parser (105 строк)
│   │   ├── types.ts               # Skill types (40 строк)
│   │   ├── index.ts               # Module exports
│   │   └── builtins/              # Built-in skills (1949 строк)
│   │       ├── obsidian-base.ts       # Obsidian Bases
│   │       ├── obsidian-canvas.ts     # Canvas files
│   │       ├── obsidian-dataview.ts   # Dataview queries
│   │       ├── obsidian-links.ts      # Backlinks/outlinks graph
│   │       ├── obsidian-markdown.ts   # Markdown notes
│   │       └── obsidian-tags.ts       # Tag hierarchy
│   │
│   ├── terminal/                  # ✨ НОВОЕ: Terminal integration
│   │   ├── TerminalService.ts     # PTY session management (382 строки)
│   │   ├── TerminalView.ts        # Terminal UI (ItemView) (196 строк)
│   │   ├── XtermWrapper.ts        # xterm.js wrapper (275 строк)
│   │   ├── PythonPtyBackend.ts    # Python PTY backend (269 строк)
│   │   ├── FallbackPtyBackend.ts  # Fallback PTY (134 строки)
│   │   ├── types.ts               # Terminal types (140 строк)
│   │   └── index.ts               # Module exports
│   │
│   └── resources/                 # ✨ НОВОЕ: Static resources
│       └── pty-helper.py          # Python PTY helper (3552 bytes)
│
├── styles.css                     # Plugin styles (2929 строк, 58 KB)
├── manifest.json                  # Plugin manifest
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript config
├── esbuild.config.mjs             # Build config
└── install.mjs                    # Auto-install script
```

**Общий объём:**
- **TypeScript код:** ~15 145 строк
- **Скомпилированный bundle:** 701 KB (`main.js`)
- **CSS:** 2 929 строк (58 KB)
- **Зависимости:** obsidian, xterm.js + 3 аддона

**Ключевые отличия от типичного Obsidian плагина:**
- Нет отдельного AgentManager.ts (управление через settings.agents в main.ts)
- Модули skills/ и terminal/ — независимые компоненты с собственными типами
- Python helper для PTY без зависимости от node-pty
- UsageLimitsService работает с обоими CLI разными способами (API vs session parsing)
- Расширенная локализация (settingsLocales.ts, buttonLocales.ts)

---

## Claude Code CLI

### Установка (prerequisite для пользователя)

```bash
npm install -g @anthropic-ai/claude-code
```

### Аутентификация

Пользователь должен залогиниться один раз:
```bash
claude
# Откроется браузер для OAuth
```

### Хранение credentials

| Platform | Location |
|----------|----------|
| macOS | Encrypted Keychain, service: `Claude Code-credentials` |
| Linux | `~/.claude/.credentials.json` |
| Windows | Windows Credential Manager (предположительно) |

### Формат credentials (Linux)

```json
{
  "claudeAiOauth": {
    "accessToken": "sk-ant-oat01-...",
    "refreshToken": "sk-ant-ort01-...",
    "expiresAt": 1748658860401,
    "scopes": ["user:inference", "user:profile"]
  }
}
```

---

## CLI Headless Mode

### Базовая команда

```bash
claude -p "твой промпт" --output-format stream-json
```

### Ключевые флаги

| Flag | Description |
|------|-------------|
| `-p, --print` | Non-interactive mode, print result |
| `--output-format text\|json\|stream-json` | Формат вывода |
| `--resume <session_id>` | Продолжить сессию |
| `--continue, -c` | Продолжить последнюю сессию |
| `--append-system-prompt` | Добавить к system prompt |
| `--allowedTools` | Список разрешённых tools |
| `--disallowedTools` | Список запрещённых tools |
| `--verbose` | Verbose logging |

### Output форматы

#### `--output-format text` (default)
Просто текст ответа.

#### `--output-format json`
Один JSON объект с результатом:
```json
{
  "type": "result",
  "subtype": "success",
  "total_cost_usd": 0.003,
  "is_error": false,
  "duration_ms": 1234,
  "duration_api_ms": 800,
  "num_turns": 6,
  "result": "The response text here...",
  "session_id": "abc123"
}
```

#### `--output-format stream-json` (рекомендуется)
JSONL — каждая строка отдельный JSON объект:

```jsonl
{"type":"system","subtype":"init","session_id":"550e8400-e29b-41d4-a716-446655440000","tools":["Read","Write","Bash",...]}
{"type":"user","message":{"role":"user","content":[{"type":"text","text":"Hello"}]}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Hi! How can I help?"}]},"session_id":"..."}
{"type":"result","subtype":"success","result":"Hi! How can I help?","session_id":"...","total_cost_usd":0.001,"duration_ms":1500}
```

---

## Message Types

### System Messages

```typescript
// Init message (первое сообщение)
interface InitMessage {
  type: "system";
  subtype: "init";
  session_id: string;
  tools: string[];
  mcp_servers: Record<string, unknown>;
}

// Result message (последнее сообщение)
interface ResultMessage {
  type: "result";
  subtype: "success" | "error";
  result: string;
  session_id: string;
  is_error: boolean;
  total_cost_usd: number;
  duration_ms: number;
  duration_api_ms: number;
  num_turns: number;
}
```

### User/Assistant Messages

```typescript
interface ConversationMessage {
  type: "user" | "assistant";
  message: {
    role: "user" | "assistant";
    content: ContentBlock[];
  };
  session_id: string;
  uuid?: string;
}

type ContentBlock = 
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string };
```

### Streaming Events

При `stream-json` также приходят partial events:
```typescript
interface StreamEvent {
  type: "stream_event";
  event: RawMessageStreamEvent; // from Anthropic SDK
  parent_tool_use_id: string | null;
  uuid: string;
  session_id: string;
}
```

---

## Multi-turn Conversations

### Продолжение по session_id

```bash
# Первый запрос — получаем session_id
claude -p "Analyze my vault structure" --output-format json
# Response: {"session_id": "abc-123", "result": "..."}

# Продолжение
claude -p "Now summarize the findings" --resume abc-123 --output-format json
```

### Продолжение последней сессии

```bash
claude -p "Continue where we left off" --continue --output-format json
```

---

## Skills System

Модульная система специализированных знаний для AI агентов. Позволяет расширять возможности агентов специальными инструкциями по работе с Obsidian.

### Архитектура

**Компоненты:**
- **SkillLoader** — загрузчик и менеджер навыков (264 строки)
- **SkillParser** — парсер SKILL.md файлов (105 строк)
- **Types** — интерфейсы Skill, SkillMetadata, SkillReference (40 строк)
- **Builtin skills** — 6 встроенных навыков для Obsidian (1949 строк)

**Процесс:**
1. При инициализации плагина SkillLoader загружает встроенные навыки из памяти
2. Сканирует vault на пользовательские навыки из `.cristal/skills/`
3. При сохранении настроек агента синхронизирует навыки в CLI директории
4. CLI подгружают навыки как дополнительные инструкции

### Формат SKILL.md

**Структура файла:**
```markdown
---
name: skill-id
description: Краткое описание навыка для UI
---

# Инструкции для агента

Markdown контент с инструкциями.
Может содержать примеры кода, таблицы, списки.
```

**Требования:**
- `name` — уникальный ID навыка (формат: `kebab-case`)
- `description` — одна строка для UI
- Остальное — Markdown инструкции для агента

### Встроенные навыки (Built-in Skills)

Доступны для обоих агентов (Claude и Codex):

| ID | Файл | Назначение |
|----|------|-----------|
| `obsidian-markdown` | obsidian-markdown.ts | Создание и редактирование Markdown заметок |
| `obsidian-canvas` | obsidian-canvas.ts | Работа с Canvas (визуальные доски, связи между файлами) |
| `obsidian-base` | obsidian-base.ts | Работа с Bases (структурированные БД из заметок) |
| `obsidian-links` | obsidian-links.ts | Понимание графа связей (backlinks, outlinks, reference map) |
| `obsidian-tags` | obsidian-tags.ts | Работа с тегами и иерархиями тегов |
| `obsidian-dataview` | obsidian-dataview.ts | Написание Dataview запросов (LIST, TABLE, TASK блоки) |

**Примеры инструкций:**
```markdown
# obsidian-canvas skill

Ты можешь работать с Canvas файлами (.canvas) в Obsidian.

## Структура Canvas файла

Canvas файл содержит узлы (nodes) и связи (edges):
- node: file/text/link
- edge: связь между узлами

## Примеры операций

### Создать canvas с заметками
1. Получи список файлов через Read tool
2. Создай файл `MyCanvas.canvas` с JSON структурой
3. Используй canvas-specific formatting
```

### Пользовательские навыки

**Размещение:** `<vault>/.cristal/skills/<skill-id>/SKILL.md`

**Пример структуры:**
```
.cristal/
└── skills/
    └── my-research-skill/
        └── SKILL.md
    └── template-generator/
        └── SKILL.md
```

**Возможности:**
- Переопределение встроенных навыков (по совпадающему ID)
- Автообнаружение при сохранении настроек плагина
- Синхронизация в `.claude/skills/` и `.codex/skills/` для CLI
- Поддержка любого Markdown контента

**Обновление:**
- Если изменён файл SKILL.md в vault, нужно пересохранить настройки агента
- SkillLoader кэширует загруженные навыки до перезагрузки плагина

### Интеграция с агентами

**Конфигурация:** Каждый агент имеет поле `enabledSkills: string[]`

```typescript
interface AgentConfig {
  // ... другие поля
  enabledSkills?: string[];  // ID включенных навыков
}
```

**Процесс синхронизации:**
1. Пользователь выбирает навыки в UI настроек агента
2. При сохранении вызывается `syncSkillsForAgent(cliType, enabledSkillIds)`
3. SkillLoader создаёт папки в `.claude/skills/` или `.codex/skills/`
4. Для каждого навыка пишется SKILL.md файл
5. Удаляются папки навыков, которые больше не выбраны
6. CLI при запуске с `--append-system-prompt` подгружает навыки

**UI управления:**
- Выбор навыков в модальном окне агента (checkboxes)
- Отображение типа навыка (builtin / custom)
- Описание навыка при hover

### Файлы навыков

**Основные:**
- `src/skills/SkillLoader.ts:264` — загрузчик и синхронизатор
- `src/skills/SkillParser.ts:105` — парсер SKILL.md
- `src/skills/types.ts:40` — типы (Skill, SkillMetadata, SkillReference, ParsedSkill)
- `src/skills/index.ts` — экспорты модуля

**Встроенные навыки:**
- `src/skills/builtins/obsidian-markdown.ts`
- `src/skills/builtins/obsidian-canvas.ts`
- `src/skills/builtins/obsidian-base.ts`
- `src/skills/builtins/obsidian-links.ts`
- `src/skills/builtins/obsidian-tags.ts`
- `src/skills/builtins/obsidian-dataview.ts`

---

## Implementation Notes

### Spawn process (Node.js)

```typescript
import { spawn } from 'child_process';

function query(prompt: string, sessionId?: string): AsyncGenerator<Message> {
  const args = ['-p', prompt, '--output-format', 'stream-json'];
  
  if (sessionId) {
    args.push('--resume', sessionId);
  }
  
  const proc = spawn('claude', args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env }
  });
  
  // Parse JSONL from stdout
  // ...
}
```

### JSONL Parser

```typescript
function parseJSONL(chunk: string): Message[] {
  return chunk
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}
```

### Obsidian ItemView

```typescript
import { ItemView, WorkspaceLeaf } from 'obsidian';

export const CLAUDE_VIEW_TYPE = 'claude-chat-view';

export class ClaudeChatView extends ItemView {
  getViewType(): string {
    return CLAUDE_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Claude Chat';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('div', { cls: 'claude-chat-container' });
    // Build UI...
  }
}
```

---

## Codex CLI

### Установка
```bash
npm install -g @openai/codex-cli
```

### Аутентификация
OAuth flow через `codex` команду — откроется браузер для авторизации.

### Хранение credentials
- Config: `~/.codex/config.toml`
- Sessions: `~/.codex/sessions/` (JSONL файлы с историей)

### Headless Mode
```bash
codex exec --json --skip-git-repo-check \
  --sandbox danger-full-access \
  --reasoning-level medium \
  --message "your prompt"
```

### Output Format — JSON Events
```json
{"event": "thread.started", "thread_id": "..."}
{"event": "turn.started"}
{"event": "item.started", "type": "agent_message"}
{"event": "item.updated", "delta": {"text": "..."}}
{"event": "item.completed"}
{"event": "turn.completed", "usage": {...}}
```

### Item Types
- `agent_message` — AI response
- `reasoning` — deep reasoning output
- `command_execution` — bash commands
- `file_read` / `file_write` / `file_change`
- `mcp_tool_call`
- `web_search`
- `todo_list`
- `error`

---

## Terminal Integration

Встроенный терминал на базе xterm.js для управления CLI, авторизации и установки зависимостей прямо в Obsidian.

### Компоненты

**Основные:**
- **TerminalService** — управление PTY сессиями и бэкендами (382 строки)
- **TerminalView** — Obsidian ItemView с xterm.js интеграцией (196 строк)
- **XtermWrapper** — обёртка над xterm.js API (275 строк)

**PTY Бэкенды:**
- **PythonPtyBackend** — PTY через Python helper для Unix-like систем (269 строк)
- **FallbackPtyBackend** — простой fallback без внешних зависимостей (134 строки)

**Типы:**
- `src/terminal/types.ts:140` — IPtyBackend, TerminalProfile, TerminalSettings, TerminalSession

### Ключевые возможности

#### 1. OAuth авторизация CLI

Запуск CLI напрямую в терминале:
```bash
claude
# Откроется браузер для OAuth авторизации Claude Code
# Credentials сохраняются в Keychain или ~/.claude/.credentials.json

codex
# Откроется браузер для OAuth авторизации Codex
# Credentials сохраняются в ~/.codex/config.toml
```

**Преимущества:**
- Не нужно открывать внешний терминал
- OAuth flow полностью автоматизирован
- Credentials безопасно хранятся CLI

#### 2. Установка CLI

```bash
npm install -g @anthropic-ai/claude-code
npm install -g @openai/codex-cli
```

Полная интеграция с npm — можно установить оба CLI без выхода из Obsidian.

#### 3. Headless execution

Внутри плагина используется headless режим для получения информации о CLI:
- Проверка установки CLI
- Проверка авторизации
- Получение версии и конфигурации

#### 4. Расширенный PATH для macOS

Автоматическое добавление стандартных путей:
- `/usr/local/bin` — Homebrew
- `/opt/homebrew/bin` — Apple Silicon Homebrew
- `~/.npm/bin` — npm global binaries
- `~/.nvm/versions/node/*/bin` — NVM versions

### Терминальные профили

**Поддерживаемые shell:**

| Платформа | Дефолтные профили |
|-----------|------------------|
| **macOS** | zsh (default), bash |
| **Linux** | bash/zsh (из $SHELL), sh |
| **Windows** | PowerShell (default), Command Prompt, WSL |

**Структура профиля:**
```typescript
interface TerminalProfile {
  id: string;           // Уникальный ID профиля
  name: string;         // Отображаемое имя
  shell: string;        // Путь к shell (/bin/zsh, powershell.exe, etc.)
  args?: string[];      // Аргументы для shell (напр. ["-l"] для login shell)
  env?: Record<string, string>;  // Переменные окружения
  pythonPath?: string;  // Кастомный путь к Python
}
```

**Примеры:**
```typescript
// macOS: zsh с login shell
{ id: "default", name: "zsh", shell: "/bin/zsh", args: ["-l"] }

// Windows: PowerShell без логотипа
{ id: "powershell", name: "PowerShell", shell: "powershell.exe", args: ["-NoLogo"] }

// Linux: bash с PATH расширением
{ id: "bash", name: "bash", shell: "/bin/bash", args: ["-l"],
  env: { "EXTENDED_PATH": "/usr/local/bin:/opt/bin" } }
```

### Python PTY Helper

**Файл:** `src/resources/pty-helper.py` (3552 bytes)

**Назначение:** Запуск PTY (pseudoterminal) процессов на Unix-like системах без зависимости от node-pty.

**Использование:**
```bash
python3 pty-helper.py --shell /bin/zsh --args "-l" --cwd /Users/user/path
```

**Параметры:**
- `--shell` — путь к shell
- `--args` — аргументы shell (JSON array)
- `--cwd` — рабочая директория
- `--cols`, `--rows` — размер терминала

**Преимущества:**
- Работает без node-pty (которой сложно собирается на некоторых системах)
- Python есть на всех Unix-like системах
- Простой и надёжный

### Настройки терминала

**Структура:**
```typescript
interface TerminalSettings {
  defaultProfile: string;           // ID профиля по умолчанию
  profiles: TerminalProfile[];      // Список терминальных профилей
  fontSize: number;                 // Размер шрифта (px)
  fontFamily: string;               // Моноширинный шрифт
  cursorStyle: "block" | "underline" | "bar";  // Стиль курсора
  scrollback: number;               // Размер буфера истории (строк)
  pythonPath?: string;              // Кастомный путь к Python (глобальный)
}
```

**Дефолтные значения:**
```typescript
{
  defaultProfile: "default",
  profiles: getDefaultProfiles(),  // Platform-specific
  fontSize: 14,
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  cursorStyle: "block",
  scrollback: 1000
}
```

**Где хранятся:** `CristalSettings.terminal` (в plugin.data.json)

### UI терминала

**Кнопки управления:**
- **Restart** — перезапуск текущей сессии
- **Close** — закрытие терминала (с подтверждением)

**Информация:**
- Тип используемого бэкенда (PythonPtyBackend / FallbackPtyBackend)
- Текущий профиль
- Размер терминала в символах

**Интеграция с Obsidian:**
- Терминал как обычный ItemView
- Можно перемещать, скрывать, переключаться как другие views
- Сохраняется состояние открытия в workspace

### Файлы

**Основные:**
- `src/terminal/TerminalService.ts:382` — управление сессиями и бэкендами
- `src/terminal/TerminalView.ts:196` — Obsidian UI
- `src/terminal/XtermWrapper.ts:275` — интеграция xterm.js
- `src/terminal/types.ts:140` — типы и интерфейсы

**PTY бэкенды:**
- `src/terminal/PythonPtyBackend.ts:269` — Python-based (Unix)
- `src/terminal/FallbackPtyBackend.ts:134` — простой fallback

**Python helper:**
- `src/resources/pty-helper.py` — вспомогательный скрипт

---

## Multi-Agent Architecture

### AgentConfig (расширенная конфигурация)

```typescript
interface AgentConfig {
  // Основные поля
  id: string;                      // Unique ID (не менять после создания)
  cliType: CLIType;                // "claude" | "codex" | "gemini" | "grok"
  name: string;                    // Пользовательское имя
  description: string;             // Описание агента для UI
  enabled: boolean;                // Активен/неактивен
  cliPath: string;                 // Путь к CLI binary
  model: string;                   // Модель по умолчанию
  disabledModels?: string[];       // Модели, скрытые из dropdown'а

  // Claude-специфичные
  permissions?: ClaudePermissions;

  // Codex-специфичные
  codexPermissions?: CodexPermissions;

  // Skills система
  enabledSkills?: string[];        // ID включенных навыков для агента

  // Наследие (deprecated, используются для миграции)
  thinkingEnabled?: boolean;
  reasoningEnabled?: boolean;
}
```

### Доступные модели

**Claude:**
- `claude-haiku-4-5-20251001` — быстрый, экономичный
- `claude-sonnet-4-5-20250929` — сбалансированный
- `claude-opus-4-5-20251101` — мощный, дорогой (требует Pro/Max подписку)

**Codex:**
- `gpt-5.2-codex` — основная модель
- `gpt-5.1-codex-max` — максимальная версия
- `gpt-5.1-codex-mini` — минимальная версия
- `gpt-5.2` — альтернативная модель

### Permissions System

#### ClaudePermissions (детальный контроль)

```typescript
interface ClaudePermissions {
  // Web операции
  webSearch: boolean;          // WebSearch tool — поиск в интернете
  webFetch: boolean;           // WebFetch tool — загрузка веб-страниц

  // Файловые операции в vault
  fileRead: boolean;           // Read tool — чтение файлов
  fileWrite: boolean;          // Write tool — создание новых файлов
  fileEdit: boolean;           // Edit tool — редактирование существующих

  // Агентские операции
  task: boolean;               // Task tool — запуск sub-агентов

  // Продвинутые возможности
  extendedThinking: boolean;   // Extended Thinking — глубокий анализ с бюджетом
}
```

**Дефолтные значения:**
```typescript
{
  webSearch: false,      // Отключено по умолчанию (внешние источники)
  webFetch: false,       // Отключено по умолчанию (внешние источники)
  task: false,           // Отключено по умолчанию (безопасность)
  fileRead: true,        // Включено — чтение своих заметок
  fileWrite: true,       // Включено — создание заметок
  fileEdit: true,        // Включено — редактирование заметок
  extendedThinking: false  // Отключено по умолчанию (стоимость)
}
```

**Синхронизация с Claude:** Разрешения записываются в `.claude/settings.json` как:
- `allowedTools: [...]` — разрешённые tools
- `disallowedTools: [...]` — запрещённые tools

#### CodexPermissions (sandbox и reasoning)

```typescript
interface CodexPermissions {
  // Sandbox режим
  sandboxMode: "read-only" | "workspace-write" | "danger-full-access";

  // Approval policy для операций
  approvalPolicy: "untrusted" | "on-failure" | "on-request" | "never";

  // Web операции
  webSearch: boolean;

  // Reasoning level (глубина анализа)
  reasoning: "off" | "medium" | "xhigh";
}
```

**Дефолтные значения:**
```typescript
{
  sandboxMode: "workspace-write",    // Может читать и писать в workspace
  approvalPolicy: "on-request",      // Просить разрешение при необходимости
  webSearch: false,                  // Отключено
  reasoning: "medium"                // Среднее значение (balance cost/quality)
}
```

**Синхронизация с Codex:**
- `sandboxMode` → флаг `--sandbox <mode>` при запуске
- `approvalPolicy` → флаг `--permission-mode <policy>`
- `reasoning` → запись в `~/.codex/config.toml` (`model_reasoning_effort`)

### Default Agents (при первом запуске)

По умолчанию список агентов пуст: `agents: []`

Пользователь добавляет агентов вручную через UI настроек:
1. Settings → "Agents"
2. Нажимает "+ Add Agent"
3. Выбирает CLI type (Claude / Codex)
4. Заполняет конфиг (имя, описание, модель, разрешения, навыки)
5. CLI path автоматически детектится через cliDetector.ts

### CLI Auto-Detection (cliDetector.ts)

**Методы поиска:**
1. `which` / `where` команда — быстрый поиск в PATH
2. Platform-specific пути:
   - **macOS:** `/usr/local/bin`, `/opt/homebrew/bin`, `~/.npm/bin`
   - **Linux:** `/usr/local/bin`, `/usr/bin`, `~/.npm/bin`
   - **Windows:** `%APPDATA%/npm`, `C:\Program Files\nodejs`
3. **NVM support** — рекурсивный поиск в `~/.nvm/versions/node/*/bin`

**Результаты:**
- Успешное обнаружение → заполнение cliPath автоматически
- Обнаружение не удалось → пользователь вводит путь вручную
- Проверка в фоне → валидация при добавлении агента

### UI управления агентами

**Список агентов в Settings:**
- Drag-n-drop для переупорядочивания
- Статус (enabled/disabled) — индикатор слева
- Быстрый переключатель активности
- Кнопки: Edit, Delete

**Редактирование агента (modal):**
- Основные поля: имя, описание, CLI path
- Выбор модели (с поддержкой disabledModels)
- Разрешения (permissions UI)
- Навыки (skills selection с checkboxes)
- System instructions (edit via textarea)
- Getting Started (свернуть/развернуть)

**В ChatView:**
- Dropdown переключения между агентами (если >1)
- Tab для быстрого переключения
- Иконка агента рядом с именем:
  - Claude: ✨ (sparkles)
  - Codex: </> (code)
- Статус агента (available / unavailable)
- Экран "No agents configured" если нет активных
- Баннер "Agent unavailable" если агент сессии удалён

---

## Usage Tracking

Система отслеживания использованных токенов и лимитов аккаунта с визуализацией в UI.

### UsageLimitsService (362 строки)

#### Claude Usage (через API Anthropic)

**Источник:** `https://api.anthropic.com/api/oauth/usage`

**Получение access token:**
1. **macOS** — из Keychain (зашифровано):
   ```bash
   security find-generic-password -s "Claude Code-credentials" -w
   ```
   Возвращает JSON с `claudeAiOauth.accessToken`

2. **Linux/WSL** — из `~/.claude/.credentials.json`:
   ```json
   {
     "claudeAiOauth": {
       "accessToken": "sk-ant-oat01-...",
       "refreshToken": "sk-ant-ort01-...",
       "expiresAt": 1748658860401
     }
   }
   ```

3. **Windows** — из Windows Credential Manager (возможно)

**API Request:**
```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  https://api.anthropic.com/api/oauth/usage
```

**API Response:**
```typescript
interface ClaudeUsageLimits {
  // 5-minute rolling window limit
  fiveHour: {
    utilization: number;  // 0.0 - 1.0 (процент использования)
    resetsAt: string | null;  // ISO timestamp или null
  };

  // Daily limit (24 hours)
  sevenDay: {
    utilization: number;
    resetsAt: string | null;
  };

  // Model-specific limits (для Pro/Max)
  sevenDayOpus?: { utilization: number; resetsAt: string | null };
  sevenDaySonnet?: { utilization: number; resetsAt: string | null };
}
```

**Интерпретация:**
- `utilization: 0.42` → использовано 42% лимита
- `resetsAt: "2025-01-15T12:00:00Z"` → лимит сбросится в это время
- `resetsAt: null` → нет лимита или информация недоступна

**Ошибки:**
- `401 Unauthorized` — token истёк или невалиден
- `403 Forbidden` — нет доступа к этому endpoint'у
- Network error — нет интернета или сервер недоступен

#### Codex Usage (парсинг session файлов)

**Источник:** `~/.codex/sessions/` — JSONL файлы с историей сессий

**Алгоритм получения:**
1. Прочитать список файлов в `~/.codex/sessions/`
2. Отсортировать по timestamp (самые новые первые)
3. Для каждого файла:
   - Прочитать как JSONL (каждая строка — JSON)
   - Найти последний event с `type: "token_count"`
4. Первый найденный event с `rate_limits` — актуальные данные
5. Если файл не содержит `token_count`, перейти к следующему

**Формат event'а:**
```json
{
  "type": "event_msg",
  "payload": {
    "type": "token_count",
    "rate_limits": {
      "primary": {
        "used_percent": 0.42,
        "resets_at": 1736780400
      },
      "secondary": {
        "used_percent": 0.15,
        "resets_at": 1737385200
      }
    }
  }
}
```

**Маппинг:**
- `primary` → 5-hour limit (5-minute rolling window)
- `secondary` → 7-day (daily) limit

**Обработка истёкших лимитов:**
- Если `resets_at` < current time → считать лимит сброшенным (0% использования)
- Если `resets_at` > current time → использовать сохранённый процент

**Специфика Codex:**
- session файлы обновляются после каждой операции
- `token_count` event содержит использованные токены этой сессии
- rate_limits относятся ко всему аккаунту, не к сессии

### Token History (статистика использования)

**Хранение:** В `CristalSettings` (plugin.data.json)

```typescript
// Общая дневная статистика
tokenHistory: Record<string, number>
// "2025-01-15" → 50000 tokens

// Per-agent дневная статистика
agentTokenHistory: Record<string, Record<string, number>>
// "claude-default" → { "2025-01-15" → 30000 }
```

**Источник данных:**
- **Claude:** парсинг `stream-json` events (`total_cost_usd` → примерная оценка)
- **Codex:** парсинг JSON events (`usage.total_tokens`)

**Обновление:** При получении result/completion message от CLI
- Извлечение количества токенов
- Добавление к дневной статистике
- Сохранение в settinsg

### UI визуализация

**Секция в Settings → Usage Statistics:**

1. **Token Statistics (за период):**
   - Today — токены, потраченные в этот день
   - Week — всего за неделю
   - Month — всего за месяц
   - Breakdown по агентам (таблица)

2. **Account Limits (кнопка "Check Limits"):**
   - Для каждого CLI (Claude, Codex):
     - 5-hour limit progress bar (цвет: зелёный → жёлтый → красный)
     - Percentage (42%)
     - Time to reset (в 2 часов)
     - Opus/Sonnet limits (если отдельные)

**Визуальное обозначение:**
- Зелёный (0-50%) — всё хорошо
- Жёлтый (50-80%) — осторожно
- Красный (80-100%) — близко к лимиту
- Серый — недоступно / ошибка

**Ошибки при получении лимитов:**
- `not_authenticated` — CLI не авторизован
- `network_error` — нет доступа к API / session файлам
- `parse_error` — невалидный формат данных
- `unknown_error` — неизвестная ошибка

### Файлы

- `src/UsageLimitsService.ts:362` — сервис для получения лимитов
- `src/settings.ts:58-73` — UI статистики и лимитов
- `src/types.ts` — типы ClaudeUsageLimits, CodexUsageLimits

---

## Development Metrics

### Размер кодовой базы

**Общая статистика:**
- **TypeScript код:** ~15 145 строк
- **Скомпилированный bundle (main.js):** 701 KB
- **CSS стили:** 2 929 строк (58 KB)
- **Общий рост:** ~40% с момента создания PROJECT.md (было ~10 800 строк)

**По компонентам:**

| Компонент | Строк кода | % | Назначение |
|-----------|-----------|---|-----------|
| ChatView.ts | 4 237 | 28% | Главный UI интерфейс чата |
| settingsLocales.ts | 1 583 | 10% | Локализация UI настроек (8 языков) |
| settings.ts | 1 507 | 10% | Settings panel & persistence |
| Skills module | 2 362 | 16% | 6 builtin + loader + parser |
| Terminal module | 1 414 | 9% | PTY + xterm.js интеграция |
| buttonLocales.ts | 659 | 4% | Локализация кнопок |
| main.ts | 605 | 4% | Plugin entry point |
| commands.ts | 485 | 3% | Slash-commands system |
| ClaudeService.ts | 427 | 3% | Claude CLI wrapper |
| CodexService.ts | 405 | 3% | Codex CLI wrapper |
| UsageLimitsService.ts | 362 | 2% | Лимиты & статистика |
| types.ts | 372 | 2% | Type definitions |
| cliDetector.ts | 349 | 2% | CLI auto-detection |
| systemPrompts.ts | 283 | 2% | System prompts (8 languages) |
| Прочее | 893 | 6% | Utilities, helpers, etc. |

### Compiled Output

| Файл | Размер | Описание |
|------|--------|---------|
| main.js | 701 KB | esbuild bundle (TypeScript + dependencies) |
| styles.css | 58 KB | Plugin styles |
| manifest.json | ~500 B | Plugin metadata |

### Dependencies

**Runtime (production):**
- `obsidian` — Obsidian Plugin API (latest)
- `@xterm/xterm` ^5.5.0 — Terminal emulator
- `@xterm/addon-fit` ^0.10.0 — Auto-resize functionality
- `@xterm/addon-web-links` ^0.11.0 — Clickable links in terminal
- `@xterm/addon-search` ^0.15.0 — Search within terminal

**Dev:**
- `typescript` ^5.8.3 — Type checking & compilation
- `esbuild` 0.25.5 — Fast JavaScript bundler
- `@types/node` ^16.11.6 — Node.js type definitions
- `tslib` 2.4.0 — TypeScript helpers

### Lines of Code by Category

| Категория | Строк | % | Назначение |
|-----------|-------|---|-----------|
| UI (Views + Settings) | 7 932 | 52% | Chat, Settings, Terminal UI |
| Services (CLI + Limits) | 1 194 | 8% | ClaudeService, CodexService, UsageLimits |
| Skills System | 2 362 | 16% | SkillLoader, SkillParser, 6 builtins |
| Terminal | 1 414 | 9% | TerminalService, PTY backends, xterm wrapper |
| Localization | 2 242 | 15% | 8 языков x 3 файла (settings, buttons, prompts) |
| Types & Utils | 1 004 | 7% | Type definitions, helpers, detectors |

### Build Performance

**Компиляция (TypeScript):**
- Type checking: ~2-3 секунды
- Bundling (esbuild): <1 секунда
- Полная сборка: ~3-4 секунды

**Размер (gzip):**
- main.js (gzip): ~200 KB (из 701 KB)
- styles.css (gzip): ~15 KB (из 58 KB)
- Всего: ~215 KB

---

## Known Issues & Limitations

### CLI Issues (из GitHub issues)

1. **Large stdin bug** — CLI может возвращать пустой output при большом input (>7000 chars)
2. **Windows subprocess** — Проблемы с stdin/stdout buffering в Windows
3. **Token expiry** — Refresh tokens eventually expire, требуют re-login
4. **Model restrictions** — Pro подписка не имеет доступа к Opus, только Sonnet

### Credential Errors

```
"This credential is only authorized for use with Claude Code and cannot be used for other API requests."
```
Эта ошибка возникает при попытке использовать OAuth token напрямую с API. Наш подход (через CLI) обходит эту проблему.

### Rate Limits

Claude Pro/Max имеет rate limits на количество сообщений. При превышении CLI вернёт соответствующую ошибку.

---

## Development Setup

### Prerequisites
- Node.js 18+
- Claude CLI и/или Codex CLI (для тестирования)
- Obsidian desktop app

### Installation
```bash
git clone <repo>
cd cristal
npm install
```

### Development
```bash
npm run dev  # Watch mode compilation
```

### Testing
1. Symlink plugin to Obsidian vault:
   ```bash
   ln -s $(pwd) /path/to/vault/.obsidian/plugins/cristal
   ```
2. Reload Obsidian (Cmd/Ctrl+R)
3. Enable plugin in Settings → Community Plugins
4. Убедитесь, что хотя бы один CLI установлен и авторизован

### Building
```bash
npm run build  # Production build
```

### Debugging
- Chrome DevTools: View → Toggle Developer Tools
- Console logs с префиксом `[Cristal]`
- Terminal logs для CLI output
- Используйте встроенный терминал плагина для отладки CLI

---

## Resources

### Obsidian
- [Obsidian Plugin Sample](https://github.com/obsidianmd/obsidian-sample-plugin)
- [Obsidian API Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Obsidian API Reference](https://docs.obsidian.md/Reference/TypeScript+API)

### Claude
- [Claude Code Docs - Headless Mode](https://code.claude.com/docs/en/headless)
- [Claude Agent SDK TypeScript](https://github.com/anthropics/claude-agent-sdk-typescript)
- [Claude Code CLI Reference](https://code.claude.com/docs/en/cli-reference)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Anthropic OAuth Documentation](https://docs.anthropic.com/en/api/oauth)

### Codex
- [OpenAI Codex CLI Docs](https://platform.openai.com/docs/guides/codex)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

### Terminal & PTY
- [xterm.js](https://xtermjs.org/) — Terminal emulator library
- [xterm.js API](https://xtermjs.org/docs/api/terminal/interfaces/iterminaloptions/)
- [node-pty](https://github.com/microsoft/node-pty) — Node.js pseudoterminal bindings
- [Python PTY/pty module](https://docs.python.org/3/library/pty.html)

### Skills & Knowledge Bases
- [YAML Format](https://yaml.org/) — SKILL.md frontmatter format
- [CommonMark Markdown](https://commonmark.org/) — Markdown specification for instructions

### Build & Development
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [esbuild Documentation](https://esbuild.github.io/)
- [Node.js Child Process API](https://nodejs.org/api/child_process.html)

---

## Legal Note

Этот плагин использует CLI инструменты как subprocess. Пользователь самостоятельно:
- Устанавливает Claude Code CLI и/или Codex CLI
- Проходит аутентификацию через официальные OAuth flows
- Несёт ответственность за соблюдение Terms of Service провайдеров (Anthropic, OpenAI)

Плагин не хранит и не передаёт credentials пользователя. Все токены управляются CLI инструментами.
