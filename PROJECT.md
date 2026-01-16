# Crystal - Claude Obsidian Plugin

## Обзор проекта

Плагин для Obsidian, интегрирующий Claude AI через Claude Code CLI:
- **Claude AI** (Anthropic) через Claude Code CLI
- Расширяемая архитектура через систему Skills

Использует существующую подписку Claude через OAuth аутентификацию CLI.

**Ключевые возможности:**
- **Модульная система Skills** — 6 встроенных навыков для Obsidian + поддержка пользовательских
- **Гибкая конфигурация агента** — модель, разрешения, Extended Thinking, персонализация
- **Расширенные разрешения** — детальный контроль (webSearch, webFetch, task, fileRead/Write/Edit, extendedThinking)
- **Отслеживание лимитов** — визуализация лимитов Claude (API + парсинг credentials)

### Цель
Нативная интеграция Claude в Obsidian с:
- Полным доступом к vault
- Детальными разрешениями
- Модульной системой навыков для специализации
- Статистикой использования с визуальными лимитами

### Ключевое ограничение
Anthropic **официально не разрешает** third-party приложениям использовать OAuth подписку напрямую:
> "Unless previously approved, we do not allow third party developers to offer Claude.ai login or rate limits for their products"

**Решение:** Плагин работает как wrapper над локально установленным Claude Code CLI — пользователь сам авторизуется в CLI, и плагин использует его как subprocess. Это легальный способ интеграции, так как CLI принадлежит Anthropic.

---

## Архитектура

### High-level flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      Obsidian Plugin                             │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   ChatView   │  │   Settings   │  │  SkillCreator│           │
│  │              │  │              │  │              │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                  │                  │                  │
│  ┌──────▼──────────────────▼──────────────────▼───────┐          │
│  │            CrystalPlugin (main.ts)                  │          │
│  │  - settings.agents (AgentConfig[])                  │          │
│  │  - settings.defaultAgentId                          │          │
│  │  - SkillLoader — управление навыками                │          │
│  └──────┬──────────────────────────────────────────────┘          │
│         │                                                         │
│  ┌──────▼──────┐                                                 │
│  │ClaudeService│                                                 │
│  │- spawn CLI  │                                                 │
│  │- stream-json│                                                 │
│  │- permissions│                                                 │
│  └──────┬──────┘                                                 │
│         │                                                         │
│  ┌──────▼───────────────────────────┐                            │
│  │     UsageLimitsService           │                            │
│  │  - fetchClaudeUsage() (API)      │                            │
│  └──────────────────────────────────┘                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                   Skills System                           │    │
│  │  - SkillLoader — загрузчик встроенных/пользовательских   │    │
│  │  - SkillParser — парсер SKILL.md (YAML + Markdown)       │    │
│  │  - SkillCreator — UI создания/редактирования скиллов     │    │
│  │  - 6 builtin skills: Markdown, Canvas, Base, Links...    │    │
│  │  - Синхронизация в .claude/skills/                        │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────┬───────────────────────────────────────────────────────────┘
       │
  ┌────▼──────┐
  │Claude CLI │
  │(subprocess)
  └────┬──────┘
       │
  ┌────▼──────┐
  │Anthropic  │
  │API (OAuth)│
  └───────────┘
```

### Структура проекта

```
Crystal/
├── src/
│   ├── main.ts                    # Plugin entry (CrystalPlugin class) — 505 строк
│   ├── ChatView.ts                # Chat UI (ItemView) — 4047 строк
│   ├── settings.ts                # Settings UI & persistence — 1238 строк
│   ├── settingsLocales.ts         # Settings UI localization (8 languages) — 2195 строк
│   ├── buttonLocales.ts           # Button localization (8 languages) — 686 строк
│   ├── systemPrompts.ts           # AI instructions (8 languages) — 1048 строк
│   ├── skillLocales.ts            # Skill descriptions localization — 200 строк
│   ├── commands.ts                # Slash-commands system — 571 строк
│   ├── types.ts                   # TypeScript types & interfaces — 351 строк
│   │
│   ├── ClaudeService.ts           # Claude Code CLI wrapper — 442 строки
│   ├── UsageLimitsService.ts      # Token tracking & API limits — 184 строки
│   ├── cliDetector.ts             # CLI auto-detection (which/where) — 185 строк
│   │
│   └── skills/                    # Skills system — 3592 строки
│       ├── SkillLoader.ts         # Loader & syncer — 701 строка
│       ├── SkillCreator.ts        # UI for create/edit — 568 строк
│       ├── SkillParser.ts         # SKILL.md parser — 222 строки
│       ├── types.ts               # Skill types — 127 строк
│       ├── index.ts               # Module exports — 25 строк
│       └── builtins/              # Built-in skills — 1949 строк
│           ├── obsidian-base.ts       # Obsidian Bases — 359 строк
│           ├── obsidian-canvas.ts     # Canvas files — 311 строк
│           ├── obsidian-dataview.ts   # Dataview queries — 397 строк
│           ├── obsidian-links.ts      # Backlinks/outlinks — 306 строк
│           ├── obsidian-markdown.ts   # Markdown notes — 207 строк
│           └── obsidian-tags.ts       # Tag hierarchy — 369 строк
│
├── styles.css                     # Plugin styles — 3349 строк
├── manifest.json                  # Plugin manifest
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript config
├── esbuild.config.mjs             # Build config
└── install.mjs                    # Auto-install script
```

**Общий объём:**
- **TypeScript код:** ~15 244 строк
- **Скомпилированный bundle:** 483 KB (`main.js`)
- **CSS:** 3 349 строк
- **Зависимости:** obsidian

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

## Agent Configuration

### AgentConfig

```typescript
interface AgentConfig {
  // Основные поля
  id: string;                      // Unique ID (не менять после создания)
  cliType: CLIType;                // "claude"
  name: string;                    // Пользовательское имя
  description: string;             // Описание агента для UI
  enabled: boolean;                // Активен/неактивен
  cliPath: string;                 // Путь к CLI binary
  model: string;                   // Модель по умолчанию
  disabledModels?: string[];       // Модели, скрытые из dropdown'а

  // Разрешения
  permissions?: ClaudePermissions;

  // Skills система
  enabledSkills?: string[];        // ID включенных навыков для агента

  // Legacy (для миграции)
  thinkingEnabled?: boolean;
}
```

### CLI Type

```typescript
export type CLIType = "claude";

export const CLI_INFO: Record<CLIType, { name: string; description: string; available: boolean }> = {
  claude: { name: "Claude Code", description: "Anthropic Claude CLI", available: true }
};
```

### Доступные модели

```typescript
export type ClaudeModel =
  | "claude-haiku-4-5-20251001"    // Быстрый, экономичный
  | "claude-sonnet-4-5-20250929"   // Сбалансированный
  | "claude-opus-4-5-20251101";    // Мощный (требует Pro/Max подписку)
```

### ClaudePermissions

Детальный контроль возможностей агента:

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

**Синхронизация с Claude CLI:**
Разрешения записываются в `.claude/settings.json` как:
- `allowedTools: [...]` — разрешённые tools
- `disallowedTools: [...]` — запрещённые tools

### Agent Personalization

Персонализация контекста для более релевантных ответов:

```typescript
interface AgentPersonalization {
  userName: string;              // Имя пользователя
  userRole: string;              // Роль/должность
  workContext: string;           // Контекст работы (чем занимаетесь)
  communicationStyle: string;    // Стиль коммуникации
  currentFocus: string;          // Текущие проекты/фокус
}
```

Эти поля встраиваются в system prompt в виде блока `<user_context>`, что позволяет агенту адаптироваться к стилю пользователя.

### Extended Thinking

Когда `permissions.extendedThinking: true`:
- Агент использует more deliberate reasoning
- Применяется для сложных задач анализа
- Claude "думает вслух" перед ответом

---

## Skills System

Модульная система специализированных знаний для агента. Позволяет расширять возможности специальными инструкциями по работе с Obsidian.

### Архитектура

**Компоненты:**
- **SkillLoader** — загрузчик и менеджер навыков (701 строка)
- **SkillCreator** — UI для создания/редактирования (568 строк)
- **SkillParser** — парсер SKILL.md файлов (222 строки)
- **Types** — интерфейсы Skill, SkillMetadata, SkillReference (127 строк)
- **Builtin skills** — 6 встроенных навыков для Obsidian (1949 строк)

**Процесс:**
1. При инициализации плагина SkillLoader загружает встроенные навыки из памяти
2. Сканирует vault на пользовательские навыки из `.crystal/skills/`
3. При сохранении настроек агента синхронизирует навыки в `.claude/skills/`
4. CLI подгружает навыки как дополнительные инструкции

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

| ID | Файл | Назначение |
|----|------|-----------|
| `obsidian-markdown` | obsidian-markdown.ts | Создание и редактирование Markdown заметок |
| `obsidian-canvas` | obsidian-canvas.ts | Работа с Canvas (визуальные доски, связи между файлами) |
| `obsidian-base` | obsidian-base.ts | Работа с Bases (структурированные БД из заметок) |
| `obsidian-links` | obsidian-links.ts | Понимание графа связей (backlinks, outlinks, reference map) |
| `obsidian-tags` | obsidian-tags.ts | Работа с тегами и иерархиями тегов |
| `obsidian-dataview` | obsidian-dataview.ts | Написание Dataview запросов (LIST, TABLE, TASK блоки) |

### Пользовательские навыки

**Размещение:** `<vault>/.crystal/skills/<skill-id>/SKILL.md`

**Пример структуры:**
```
.crystal/
└── skills/
    └── my-research-skill/
        └── SKILL.md
    └── template-generator/
        └── SKILL.md
```

**Возможности:**
- Переопределение встроенных навыков (по совпадающему ID)
- Автообнаружение при сохранении настроек плагина
- Синхронизация в `.claude/skills/` для CLI
- Поддержка любого Markdown контента

---

## Usage Tracking

Система отслеживания использованных токенов и лимитов аккаунта с визуализацией в UI.

### UsageLimitsService

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

**API Request:**
```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  https://api.anthropic.com/api/oauth/usage
```

**API Response:**
```typescript
interface ClaudeUsageLimits {
  // 5-hour rolling window limit
  fiveHour: {
    utilization: number;  // 0.0 - 1.0 (процент использования)
    resetsAt: string | null;  // ISO timestamp или null
  };

  // Weekly limit
  sevenDay: {
    utilization: number;
    resetsAt: string | null;
  };

  // Model-specific limits (для Pro/Max)
  sevenDayOpus?: { utilization: number; resetsAt: string | null };
  sevenDaySonnet?: { utilization: number; resetsAt: string | null };
}
```

### Token History (статистика использования)

**Хранение:** В `CrystalSettings` (plugin.data.json)

```typescript
// Общая дневная статистика
tokenHistory: Record<string, number>
// "2025-01-15" → 50000 tokens

// Per-agent дневная статистика
agentTokenHistory: Record<string, Record<string, number>>
// "claude-default" → { "2025-01-15" → 30000 }
```

### UI визуализация

**Секция в Settings → Usage Statistics:**

1. **Token Statistics (за период):**
   - Today — токены, потраченные сегодня
   - Week — всего за неделю
   - Month — всего за месяц

2. **Account Limits (кнопка "Check Limits"):**
   - 5-hour limit progress bar (цвет: зелёный → жёлтый → красный)
   - Percentage (42%)
   - Time to reset
   - Opus/Sonnet limits (если отдельные)

**Визуальное обозначение:**
- Зелёный (0-50%) — всё хорошо
- Жёлтый (50-80%) — осторожно
- Красный (80-100%) — близко к лимиту
- Серый — недоступно / ошибка

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

export const CRYSTAL_VIEW_TYPE = 'crystal-chat-view';

export class CrystalChatView extends ItemView {
  getViewType(): string {
    return CRYSTAL_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Crystal Chat';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('div', { cls: 'crystal-chat-container' });
    // Build UI...
  }
}
```

---

## Development Metrics

### Размер кодовой базы

**Общая статистика:**
- **TypeScript код:** ~15 244 строк
- **Скомпилированный bundle (main.js):** 483 KB
- **CSS стили:** 3 349 строк

**По компонентам:**

| Компонент | Строк кода | % | Назначение |
|-----------|-----------|---|-----------|
| ChatView.ts | 4 047 | 27% | Главный UI интерфейс чата |
| settingsLocales.ts | 2 195 | 14% | Локализация UI настроек (8 языков) |
| settings.ts | 1 238 | 8% | Settings panel & persistence |
| systemPrompts.ts | 1 048 | 7% | System prompts (8 languages) |
| Skills module | 3 592 | 24% | 6 builtin + loader + parser + creator |
| buttonLocales.ts | 686 | 5% | Локализация кнопок |
| commands.ts | 571 | 4% | Slash-commands system |
| main.ts | 505 | 3% | Plugin entry point |
| ClaudeService.ts | 442 | 3% | Claude CLI wrapper |
| types.ts | 351 | 2% | Type definitions |
| skillLocales.ts | 200 | 1% | Skill descriptions |
| UsageLimitsService.ts | 184 | 1% | Лимиты & статистика |
| cliDetector.ts | 185 | 1% | CLI auto-detection |

### Dependencies

**Runtime (production):**
- `obsidian` — Obsidian Plugin API (latest)

**Dev:**
- `typescript` ^5.8.3 — Type checking & compilation
- `esbuild` 0.25.5 — Fast JavaScript bundler
- `@types/node` ^16.11.6 — Node.js type definitions
- `tslib` 2.4.0 — TypeScript helpers

---

## Known Issues & Limitations

### CLI Issues

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
- Claude CLI (для тестирования)
- Obsidian desktop app

### Installation
```bash
git clone https://github.com/gvukamolle/Crystal.git
cd Crystal
npm install
```

### Development
```bash
npm run dev  # Watch mode compilation
```

### Testing
1. Symlink plugin to Obsidian vault:
   ```bash
   npm run install-plugin /path/to/vault
   ```
2. Reload Obsidian (Cmd/Ctrl+R)
3. Enable plugin in Settings → Community Plugins
4. Убедитесь, что Claude CLI установлен и авторизован

### Building
```bash
npm run build  # Production build
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Watch mode — auto-rebuild on changes |
| `npm run build` | Production build (type check + bundle) |
| `npm run install-plugin` | Install plugin to vault via symlink |
| `npm run lint` | Run ESLint |

### Debugging
- Chrome DevTools: View → Toggle Developer Tools
- Console logs с префиксом `[Crystal]`

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

### Skills & Knowledge Bases
- [YAML Format](https://yaml.org/) — SKILL.md frontmatter format
- [CommonMark Markdown](https://commonmark.org/) — Markdown specification for instructions

### Build & Development
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [esbuild Documentation](https://esbuild.github.io/)
- [Node.js Child Process API](https://nodejs.org/api/child_process.html)

---

## Legal Note

Этот плагин использует Claude Code CLI как subprocess. Пользователь самостоятельно:
- Устанавливает Claude Code CLI
- Проходит аутентификацию через официальный OAuth flow
- Несёт ответственность за соблюдение Terms of Service Anthropic

Плагин не хранит и не передаёт credentials пользователя. Все токены управляются CLI инструментом.
