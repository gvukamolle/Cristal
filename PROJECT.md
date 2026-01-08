# Obsidian Claude Plugin

## Обзор проекта

Плагин для Obsidian, интегрирующий Claude AI через Claude Code CLI. Использует существующую подписку Claude Pro/Max через OAuth аутентификацию CLI.

### Цель
Нативный AI-ассистент в Obsidian с UX уровня Notion AI, но с полной мощью Claude и доступом к vault.

### Ключевое ограничение
Anthropic **официально не разрешает** third-party приложениям использовать OAuth подписку:
> "Unless previously approved, we do not allow third party developers to offer Claude.ai login or rate limits for their products"

Плагин работает как wrapper над локально установленным Claude Code CLI — пользователь должен сам залогиниться в CLI.

---

## Архитектура

### High-level flow

```
┌─────────────────┐     spawn + stdin/stdout      ┌─────────────────┐
│  Obsidian       │ ──────────────────────────────▶│  Claude CLI     │
│  Plugin         │ ◀────────────────────────────── │  (subprocess)   │
│                 │         JSONL stream           │                 │
└─────────────────┘                                └─────────────────┘
                                                          │
                                                          ▼
                                                   ┌─────────────────┐
                                                   │  Anthropic API  │
                                                   │  (OAuth auth)   │
                                                   └─────────────────┘
```

### Структура проекта

```
obsidian-claude/
├── src/
│   ├── main.ts              # Plugin entry, регистрация view и commands
│   ├── ClaudeService.ts     # Управление subprocess, IPC с CLI
│   ├── ChatView.ts          # ItemView для sidebar чата
│   ├── MessageParser.ts     # JSONL stream parser
│   ├── SessionManager.ts    # Управление сессиями (multi-turn)
│   └── types.ts             # TypeScript типы
├── styles.css               # Стили чата
├── manifest.json            # Obsidian plugin manifest
├── package.json
├── tsconfig.json
├── esbuild.config.mjs       # Build config
└── README.md
```

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

## Milestones

### Milestone 1: Basic Chat
**Точка А:** Пустая папка  
**Точка Б:** Работающий плагин с sidebar чатом

- [ ] Scaffold плагина (manifest, package.json, tsconfig)
- [ ] ClaudeService — spawn CLI, parse JSONL
- [ ] ChatView — базовый UI (input + messages)
- [ ] Регистрация view в Obsidian
- [ ] Error handling (CLI not found, auth errors)

### Milestone 2: Sessions & UX
- [ ] Session management (continue conversation)
- [ ] Message history persistence
- [ ] Markdown rendering в ответах
- [ ] Code blocks с syntax highlighting
- [ ] Copy button для code blocks

### Milestone 3: Vault Integration
- [ ] Context: текущий файл
- [ ] Context: выделенный текст
- [ ] Tool use: чтение файлов vault
- [ ] Tool use: запись/редактирование файлов

### Milestone 4: Advanced
- [ ] MCP servers integration
- [ ] Custom system prompts
- [ ] Settings UI
- [ ] Keyboard shortcuts
- [ ] Mobile support (если возможно)

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

```bash
# Clone repo
git clone <repo-url>
cd obsidian-claude

# Install dependencies
npm install

# Development build (watch mode)
npm run dev

# Production build
npm run build

# Install to Obsidian vault (symlink)
ln -s $(pwd) /path/to/vault/.obsidian/plugins/obsidian-claude
```

### Testing

1. Убедись что Claude CLI установлен и залогинен
2. Открой Obsidian с dev vault
3. Enable plugin в Settings → Community Plugins
4. Открой Claude Chat view

---

## Resources

- [Obsidian Plugin Sample](https://github.com/obsidianmd/obsidian-sample-plugin)
- [Obsidian API Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Claude Code Docs - Headless Mode](https://code.claude.com/docs/en/headless)
- [Claude Agent SDK TypeScript](https://github.com/anthropics/claude-agent-sdk-typescript)
- [Claude Code CLI Reference](https://code.claude.com/docs/en/cli-reference)

---

## Legal Note

Этот плагин использует Claude Code CLI как subprocess. Пользователь самостоятельно:
- Устанавливает Claude Code CLI
- Проходит аутентификацию
- Несёт ответственность за соблюдение Terms of Service Anthropic

Плагин не хранит и не передаёт credentials пользователя.
