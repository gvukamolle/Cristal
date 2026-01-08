# Claude Code: Руководство по инструментам и разрешениям

## Содержание

1. [Обзор системы разрешений](#обзор-системы-разрешений)
2. [Полный список инструментов](#полный-список-инструментов)
3. [Синтаксис правил разрешений](#синтаксис-правил-разрешений)
4. [Файлы конфигурации](#файлы-конфигурации)
5. [Режимы работы](#режимы-работы)
6. [Sandbox (песочница)](#sandbox-песочница)
7. [Примеры конфигураций](#примеры-конфигураций)
8. [Управление через CLI](#управление-через-cli)
9. [Best Practices](#best-practices)

---

## Обзор системы разрешений

Claude Code использует многоуровневую систему разрешений для контроля действий агента. Система построена по принципу "запрашивай разрешение по умолчанию" — Claude спрашивает подтверждение перед выполнением потенциально опасных операций.

### Принцип работы

```
Вызов инструмента
       ↓
PreToolUse Hook (если настроен)
       ↓
Deny Rules (запрещающие правила)
       ↓
Allow Rules (разрешающие правила)
       ↓
Ask Rules (правила с запросом)
       ↓
Permission Mode Check
       ↓
Запрос к пользователю (если не разрешено автоматически)
       ↓
PostToolUse Hook (если настроен)
```

### Приоритет конфигураций (от высшего к низшему)

1. **Enterprise managed policies** — `/Library/Application Support/ClaudeCode/managed-settings.json` (macOS) или `/etc/claude-code/managed-settings.json` (Linux)
2. **Command line arguments** — флаги при запуске
3. **Local project settings** — `.claude/settings.local.json`
4. **Shared project settings** — `.claude/settings.json`
5. **User settings** — `~/.claude/settings.json`

**Важно:** Deny-правила всегда перекрывают Allow-правила на любом уровне.

---

## Полный список инструментов

### Инструменты, требующие разрешения

| Инструмент | Описание | Типичное использование |
|------------|----------|------------------------|
| `Bash` | Выполнение shell-команд | Запуск скриптов, установка пакетов, git-операции |
| `Edit` | Редактирование существующих файлов | Изменение кода, конфигов |
| `Write` | Создание новых файлов или полная перезапись | Создание новых модулей, конфигов |
| `NotebookEdit` | Редактирование ячеек Jupyter Notebook | Работа с .ipynb файлами |
| `WebFetch` | Получение контента по URL | Загрузка файлов, чтение документации |
| `WebSearch` | Поиск в интернете | Поиск решений, документации |
| `Skill` | Запуск кастомного скилла | Выполнение специализированных задач |
| `SlashCommand` | Запуск slash-команды | Кастомные команды проекта |
| `ExitPlanMode` | Выход из режима планирования | Переход к выполнению после анализа |

### Инструменты, не требующие разрешения

| Инструмент | Описание |
|------------|----------|
| `Read` | Чтение содержимого файлов |
| `Glob` | Поиск файлов по паттерну (*.js, src/**/*.ts) |
| `Grep` | Поиск текста в файлах |
| `Task` | Запуск sub-agent'а для сложных задач |
| `TodoWrite` | Создание структурированных списков задач |
| `AskUserQuestion` | Задать вопрос пользователю |
| `BashOutput` | Получить вывод фонового bash-процесса |
| `KillShell` | Завершить фоновый bash-процесс |

---

## Синтаксис правил разрешений

### Базовый синтаксис

```
ToolName                    # Любое использование инструмента
ToolName(*)                 # Любой аргумент (эквивалентно ToolName)
ToolName(pattern)           # Только вызовы, соответствующие паттерну
```

### Паттерны для Bash

```
Bash(command)               # Точное совпадение команды
Bash(command:*)             # Команда с любыми аргументами (prefix match)
Bash(npm run test)          # Только "npm run test"
Bash(npm run test:*)        # "npm run test", "npm run test:unit", "npm run test:e2e"
Bash(git:*)                 # Любая git-команда
Bash(docker compose:*)      # Docker compose с любыми аргументами
```

**Важно:** Bash-правила используют prefix matching, а не regex!

### Паттерны для файловых операций

```
Read(path)                  # Конкретный файл
Read(./src/*)               # Файлы в директории src (не рекурсивно)
Read(./src/**)              # Файлы в src и всех поддиректориях
Read(./.env)                # Конкретный файл .env
Read(./.env.*)              # .env.local, .env.production и т.д.
Read(~/.ssh/**)             # SSH-ключи пользователя

Write(./src/**)             # Запись в src и поддиректории
Edit(./config/*)            # Редактирование файлов в config
```

### Паттерны для WebFetch

```
WebFetch                           # Любой URL (для deny — блокирует всё)
WebFetch(domain:github.com)        # Только github.com
WebFetch(domain:*.anthropic.com)   # Любой поддомен anthropic.com
WebFetch(https://api.example.com/*) # Конкретный путь
```

### Паттерны для WebSearch

```
WebSearch                   # Любой поиск
WebSearch(domain:stackoverflow.com)  # Поиск только на stackoverflow
```

---

## Файлы конфигурации

### Расположение файлов

| Файл | Путь | Назначение |
|------|------|------------|
| User settings | `~/.claude/settings.json` | Глобальные настройки пользователя |
| Project settings | `.claude/settings.json` | Настройки проекта (в git) |
| Local settings | `.claude/settings.local.json` | Локальные настройки (не в git) |
| Enterprise | `/etc/claude-code/managed-settings.json` | Политики организации |

### Структура settings.json

```json
{
  "permissions": {
    "allow": [],
    "ask": [],
    "deny": [],
    "additionalDirectories": [],
    "defaultMode": "default"
  },
  "sandbox": {
    "enabled": false,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": [],
    "network": {}
  },
  "env": {},
  "hooks": {},
  "model": "claude-sonnet-4-5-20250929"
}
```

### Полная структура permissions

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run lint)",
      "Bash(npm run test:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Read(~/.zshrc)",
      "WebFetch(domain:github.com)",
      "WebFetch(domain:npmjs.com)"
    ],
    "ask": [
      "Bash(git push:*)",
      "Bash(git checkout:*)",
      "Bash(rm:*)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(sudo:*)",
      "WebFetch"
    ],
    "additionalDirectories": [
      "../shared-lib/",
      "/path/to/docs/"
    ],
    "defaultMode": "default",
    "disableBypassPermissionsMode": "disable"
  }
}
```

---

## Режимы работы

### Доступные режимы (defaultMode)

| Режим | Описание | Когда использовать |
|-------|----------|-------------------|
| `default` | Спрашивает разрешение при первом использовании каждого инструмента | Обычная работа |
| `acceptEdits` | Автоматически принимает редактирование файлов | Активная разработка с доверием |
| `plan` | Только анализ, без модификаций | Code review, изучение кодовой базы |
| `bypassPermissions` | Обходит все запросы | CI/CD, изолированные среды |

### Установка режима

**В settings.json:**
```json
{
  "permissions": {
    "defaultMode": "acceptEdits"
  }
}
```

**Через CLI:**
```bash
claude --dangerously-skip-permissions  # bypassPermissions mode
```

### Блокировка опасного режима

Для предотвращения использования `--dangerously-skip-permissions`:

```json
{
  "permissions": {
    "disableBypassPermissionsMode": "disable"
  }
}
```

---

## Sandbox (песочница)

Sandbox изолирует bash-команды, ограничивая доступ к файловой системе и сети.

### Базовая конфигурация

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["git", "docker", "kubectl"],
    "allowUnsandboxedCommands": false
  }
}
```

### Параметры sandbox

| Параметр | Тип | Описание |
|----------|-----|----------|
| `enabled` | boolean | Включить sandbox (только macOS/Linux) |
| `autoAllowBashIfSandboxed` | boolean | Автоматически разрешать bash в sandbox |
| `excludedCommands` | string[] | Команды, выполняемые вне sandbox |
| `allowUnsandboxedCommands` | boolean | Разрешить escape из sandbox |

### Сетевые настройки sandbox

```json
{
  "sandbox": {
    "enabled": true,
    "network": {
      "allowUnixSockets": [
        "/var/run/docker.sock",
        "~/.ssh/agent-socket"
      ],
      "allowLocalBinding": true,
      "httpProxyPort": 8080,
      "socksProxyPort": 8081
    }
  }
}
```

### Как sandbox работает с permissions

- **Read deny rules** → блокируют чтение файлов в sandbox
- **Edit allow rules** → разрешают запись (в дополнение к рабочей директории)
- **Edit deny rules** → блокируют запись в разрешённых путях
- **WebFetch allow/deny** → контролируют сетевой доступ

---

## Примеры конфигураций

### Минимальный набор для PHP-проекта

```json
{
  "permissions": {
    "allow": [
      "Bash(composer:*)",
      "Bash(php:*)",
      "Bash(phpunit:*)",
      "Bash(./vendor/bin/phpcs:*)",
      "Bash(./vendor/bin/phpstan:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./config/secrets.php)"
    ]
  }
}
```

### Конфигурация для Node.js/Frontend

```json
{
  "permissions": {
    "allow": [
      "Bash(npm:*)",
      "Bash(npx:*)",
      "Bash(yarn:*)",
      "Bash(pnpm:*)",
      "Bash(node:*)",
      "Bash(eslint:*)",
      "Bash(prettier:*)",
      "Bash(jest:*)",
      "Bash(vitest:*)",
      "Bash(tsc:*)",
      "Bash(git:*)",
      "WebFetch(domain:npmjs.com)",
      "WebFetch(domain:github.com)",
      "WebSearch"
    ],
    "ask": [
      "Bash(rm:*)",
      "Bash(mv:*)"
    ],
    "deny": [
      "Read(./.env*)",
      "Read(./secrets/**)",
      "Bash(sudo:*)"
    ],
    "defaultMode": "acceptEdits"
  }
}
```

### Строгая конфигурация для production-кода

```json
{
  "permissions": {
    "allow": [
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(cat:*)",
      "Bash(head:*)",
      "Bash(tail:*)",
      "Bash(wc:*)",
      "Bash(grep:*)",
      "Bash(find:*)"
    ],
    "ask": [
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Edit",
      "Write"
    ],
    "deny": [
      "Read(./.env*)",
      "Read(./secrets/**)",
      "Read(./config/production.*)",
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Bash(rm:*)",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(sudo:*)",
      "Bash(docker:*)",
      "Bash(kubectl:*)",
      "WebFetch",
      "WebSearch"
    ],
    "defaultMode": "default",
    "disableBypassPermissionsMode": "disable"
  }
}
```

### Конфигурация для Obsidian-плагина (интеграция Claude Code)

Специфика: плагин для работы с заметками, пользователи — не обязательно разработчики, vault может содержать приватные данные.

**Принцип:** минимум по умолчанию, Bash отключён полностью.

#### Поддерживаемые форматы Obsidian

| Тип | Расширения | Claude может работать |
|-----|------------|----------------------|
| Markdown | `.md` | ✅ Чтение/редактирование |
| Canvas | `.canvas` | ✅ JSON-формат, можно редактировать |
| Bases | `.base` | ✅ JSON-формат (базы данных) |
| Images | `.avif`, `.bmp`, `.gif`, `.jpeg`, `.jpg`, `.png`, `.svg`, `.webp` | ❌ Бинарные файлы |
| Audio | `.flac`, `.m4a`, `.mp3`, `.ogg`, `.wav`, `.webm`, `.3gp` | ❌ Бинарные файлы |
| Video | `.mkv`, `.mov`, `.mp4`, `.ogv`, `.webm` | ❌ Бинарные файлы |
| PDF | `.pdf` | ❌ Бинарные файлы |

#### Конфигурация permissions

```json
{
  "permissions": {
    "allow": [
      "Read(./**/*.md)",
      "Read(./**/*.canvas)",
      "Read(./**/*.base)",
      "Edit(./**/*.md)",
      "Edit(./**/*.canvas)",
      "Edit(./**/*.base)",
      "Write(./**/*.md)",
      "Write(./**/*.canvas)",
      "Write(./**/*.base)"
    ],
    "deny": [
      "Bash",
      "Read(./.obsidian/**)",
      "Edit(./.obsidian/**)",
      "Write(./.obsidian/**)"
    ]
  }
}
```

**Опциональные фичи (тумблеры в настройках плагина):**

```json
{
  "permissions": {
    "allow": [
      "WebSearch",
      "WebFetch"
    ]
  }
}
```

**Почему именно так:**

| Решение | Обоснование |
|---------|-------------|
| `.md`, `.canvas`, `.base` | Все текстовые форматы Obsidian |
| Bash отключён | Нет юзкейсов для заметок, лишняя attack surface |
| WebSearch/WebFetch опционально | Полезно для ресёрча, но требует явного согласия |
| `.obsidian/**` заблокирован | Конфиги Obsidian не должны редактироваться AI |

**UX в настройках плагина:**

```
Claude Code Integration

Базовые возможности (всегда включены):
• Чтение заметок (.md, .canvas, .base)
• Редактирование заметок
• Создание новых заметок

Дополнительно:
[ ] Поиск в интернете
    Claude сможет искать информацию при написании
    
[ ] Загрузка по ссылкам
    Claude сможет читать содержимое веб-страниц
```

---

### Конфигурация для CI/CD (GitHub Actions, GitLab CI)

```json
{
  "permissions": {
    "allow": [
      "Bash(npm:*)",
      "Bash(git:*)",
      "Bash(docker:*)",
      "Edit",
      "Write",
      "WebFetch",
      "WebSearch"
    ],
    "deny": [
      "Read(./.env.production)",
      "Read(./secrets/**)"
    ],
    "defaultMode": "bypassPermissions"
  }
}
```

### Конфигурация для изучения незнакомого проекта

```json
{
  "permissions": {
    "allow": [
      "Bash(cat:*)",
      "Bash(head:*)",
      "Bash(tail:*)",
      "Bash(wc:*)",
      "Bash(tree:*)",
      "Bash(find:*)",
      "Bash(grep:*)",
      "Bash(git log:*)",
      "Bash(git show:*)",
      "Bash(git blame:*)"
    ],
    "deny": [
      "Edit",
      "Write",
      "Bash(rm:*)",
      "Bash(mv:*)",
      "Read(./.env*)"
    ],
    "defaultMode": "plan"
  }
}
```

---

## Управление через CLI

### Команда /permissions

В интерактивном режиме Claude Code:

```
/permissions          # Показать текущие разрешения и их источники
```

### Команда /allowed-tools

```
/allowed-tools        # Интерактивное управление разрешениями
```

### Команда /config

```
/config               # Открыть интерфейс настроек
```

### Флаги запуска

```bash
# Пропустить все запросы разрешений (ОПАСНО!)
claude --dangerously-skip-permissions

# Добавить инструкции к системному промпту
claude --append-system-prompt "Always explain what you're doing"

# Указать модель
claude --model claude-sonnet-4-5-20250929
```

---

## Best Practices

### 1. Принцип минимальных привилегий

Разрешайте только то, что действительно нужно:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run lint)",
      "Bash(npm run test)"
    ]
  }
}
```

Не делайте так:
```json
{
  "permissions": {
    "allow": ["Bash"]  // Слишком широко!
  }
}
```

### 2. Защита секретов

Всегда блокируйте доступ к файлам с секретами:

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(./**/credentials.*)",
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Read(~/.config/gcloud/**)"
    ]
  }
}
```

### 3. Разделение проектных и личных настроек

- `.claude/settings.json` — общие правила команды (коммитить в git)
- `.claude/settings.local.json` — личные предпочтения (не коммитить)
- `~/.claude/settings.json` — глобальные настройки

### 4. Использование ask для опасных операций

```json
{
  "permissions": {
    "allow": [
      "Bash(git add:*)",
      "Bash(git commit:*)"
    ],
    "ask": [
      "Bash(git push:*)",
      "Bash(git checkout:*)",
      "Bash(git reset:*)",
      "Bash(rm:*)"
    ]
  }
}
```

### 5. Sandbox для экспериментов

Включайте sandbox при работе с незнакомым кодом:

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["git"]
  }
}
```

### 6. Ограничение сетевого доступа

```json
{
  "permissions": {
    "allow": [
      "WebFetch(domain:github.com)",
      "WebFetch(domain:stackoverflow.com)",
      "WebFetch(domain:docs.anthropic.com)"
    ],
    "deny": [
      "WebFetch"  // Блокируем всё остальное
    ]
  }
}
```

### 7. Hooks для автоматизации

Используйте hooks для автоматических проверок:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write(*.php)",
        "hooks": [
          {
            "type": "command",
            "command": "./vendor/bin/phpcs $file"
          }
        ]
      }
    ]
  }
}
```

### 8. Документирование разрешений

Добавляйте комментарии через CLAUDE.md:

```markdown
# Permissions Rationale

## Allowed
- npm/composer commands for package management
- git read operations for code review

## Denied
- .env files contain API keys
- Production configs should never be modified by AI
```

---

## Troubleshooting

### Разрешение не применяется

1. Проверьте приоритет файлов (deny перекрывает allow)
2. Используйте `/permissions` для просмотра активных правил
3. Убедитесь в правильности синтаксиса паттернов

### Bash-команда блокируется

Bash использует prefix matching:
- `Bash(npm run)` НЕ разрешит `npm run test` 
- `Bash(npm run:*)` разрешит `npm run test`, `npm run build` и т.д.

### Sandbox не работает

- Sandbox доступен только на macOS и Linux
- Проверьте, что `sandbox.enabled: true`
- Некоторые команды могут требовать `excludedCommands`

---

## Ссылки

- [Официальная документация](https://code.claude.com/docs/en/settings)
- [IAM и разрешения](https://code.claude.com/docs/en/iam)
- [Безопасность](https://code.claude.com/docs/en/security)
- [Hooks](https://code.claude.com/docs/en/hooks)
