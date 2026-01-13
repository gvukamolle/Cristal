# Системы разрешений в AI-кодинг CLI: полный технический справочник

Три главных AI-кодинг CLI — **Claude Code**, **OpenAI Codex CLI** и **Gemini CLI** — реализовали продвинутые системы разрешений, балансирующие между продуктивностью разработчика и безопасностью. 

**Ключевые различия в подходах:**
- **Claude Code** — самая гранулярная модель с gitignore-паттернами для путей
- **Codex CLI** — наиболее надёжная OS-level песочница с Starlark-политиками
- **Gemini CLI** — гибкий allowlist инструментов с контейнерной изоляцией

Все три реализуют иерархию приоритетов **deny > ask > allow**, поддерживают per-project переопределения и предоставляют пути для enterprise-конфигураций.

---

## Оглавление

1. [Claude Code](#claude-code)
2. [OpenAI Codex CLI](#openai-codex-cli)
3. [Gemini CLI](#gemini-cli)
4. [Сравнительный анализ](#сравнительный-анализ)
5. [Примеры конфигураций](#примеры-конфигураций)
6. [Переменные окружения](#переменные-окружения)

---

## Claude Code

Claude Code реализует комплексную систему разрешений с **пятью уровнями конфигурации** и тремя категориями разрешений (allow, ask, deny).

### Инструменты, требующие разрешения

| Инструмент | Описание | Требует подтверждения |
|------------|----------|----------------------|
| `Bash` | Выполнение shell-команд | Да |
| `Edit` | Точечные изменения файлов | Да |
| `Write` | Создание или перезапись файлов | Да |
| `MultiEdit` | Множественные правки файлов | Да |
| `WebFetch` | Получение контента по URL | Да |
| `WebSearch` | Веб-поиск с фильтрацией доменов | Да |
| `NotebookEdit` | Изменения Jupyter-ноутбуков | Да |
| `Skill` | Выполнение skills в разговоре | Да |
| `SlashCommand` | Кастомные slash-команды | Да |

**Read-only инструменты** (`Read`, `Glob`, `Grep`, `Task`) работают без запросов. Это позволяет Claude свободно исследовать кодовую базу, но требовать подтверждения для изменений.

### Иерархия конфигурационных файлов

Claude Code читает настройки из пяти мест, более высокие имеют приоритет:

| Приоритет | Расположение | Назначение |
|-----------|--------------|------------|
| 1 (высший) | Enterprise managed policies | Не может быть переопределён пользователями |
| 2 | CLI-аргументы | `--allowedTools`, `--disallowedTools` |
| 3 | `.claude/settings.local.json` | Локальные настройки проекта (auto-gitignore) |
| 4 | `.claude/settings.json` | Общие настройки проекта (коммитятся) |
| 5 (низший) | `~/.claude/settings.json` | Глобальные пользовательские настройки |

**Пути enterprise-политик:**
- macOS: `/Library/Application Support/ClaudeCode/managed-settings.json`
- Linux/WSL: `/etc/claude-code/managed-settings.json`
- Windows: `C:\Program Files\ClaudeCode\managed-settings.json`

### Синтаксис правил разрешений

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run build)",
      "Bash(git:*)",
      "Edit(/src/**/*.ts)",
      "WebFetch(domain:github.com)",
      "mcp__github__list_issues"
    ],
    "ask": [
      "Bash(npm publish:*)",
      "Bash(docker run:*)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(~/.ssh/**)",
      "Bash(rm -rf:*)",
      "Bash(sudo:*)"
    ],
    "defaultMode": "default",
    "additionalDirectories": ["/shared/libs"]
  }
}
```

### Паттерны для разных инструментов

**Bash-паттерны** используют prefix matching с wildcard `:*`:
- `Bash(git:*)` — разрешает любую команду, начинающуюся с `git`
- `Bash(npm run build)` — разрешает только точную команду
- Claude понимает shell-операторы: `Bash(safe-cmd:*)` НЕ разрешит `safe-cmd && malicious-cmd`

**File path паттерны** следуют gitignore-спецификации:
- `//path` — абсолютный путь от корня файловой системы
- `~/path` — путь от домашней директории
- `/path` — путь относительно расположения settings.json
- `path` или `./path` — путь относительно текущей директории
- `**` — любая вложенность директорий
- `*` — любые символы в имени файла

**WebFetch паттерны** используют domain-matching:
- `WebFetch(domain:example.com)` — разрешает запросы к домену

**MCP-паттерны** используют формат `mcp__<server>__<tool>`:
- `mcp__github__list_issues` — конкретный инструмент
- `mcp__github` — все инструменты сервера (wildcards не поддерживаются)

### Режимы разрешений

| Режим | Поведение |
|-------|-----------|
| `default` | Стандартный запрос для каждого инструмента при первом использовании |
| `acceptEdits` | Авто-подтверждение изменений файлов на сессию |
| `plan` | Только чтение — никаких модификаций |
| `bypassPermissions` | Пропуск всех запросов (требует безопасного окружения) |

**Переключение в runtime:** `Shift+Tab` или команда `/permissions`

### Конфигурация песочницы

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["docker", "git"],
    "network": {
      "allowUnixSockets": ["/var/run/docker.sock"],
      "allowLocalBinding": true,
      "httpProxyPort": 8080
    }
  }
}
```

Когда sandbox включён:
- Write-операции ограничены рабочей директорией и поддиректориями
- Сетевой доступ идёт через proxy, который применяет правила `WebFetch`
- Команды из `excludedCommands` выполняются вне sandbox

### CLI-флаги

```bash
# Разрешить конкретные инструменты без запросов
claude --allowedTools "Bash(git:*)" "Bash(npm test:*)" "Read"

# Заблокировать опасные операции
claude --disallowedTools "Bash(rm:*)" "Bash(sudo:*)" "WebFetch"

# Запуск в plan-режиме (только чтение)
claude --permission-mode plan

# Пропустить все запросы разрешений (опасно!)
claude --dangerously-skip-permissions

# Добавить дополнительные рабочие директории
claude --add-dir ../libs ../shared
```

---

## OpenAI Codex CLI

Codex CLI строит безопасность вокруг **OS-level песочницы** как первичного слоя защиты. Система комбинирует sandbox-режимы с approval-политиками.

### Режимы песочницы

| Режим | Значение флага | Поведение |
|-------|----------------|-----------|
| **Read-Only** | `read-only` | По умолчанию. Только чтение файлов, без записи и системных изменений |
| **Workspace Write** | `workspace-write` | Чтение/запись в CWD, `/tmp`, `$TMPDIR`; сеть отключена |
| **Full Access** | `danger-full-access` | Без ограничений — полный доступ к ФС и сети |

**Реализация на уровне ОС:**
- macOS: **Apple Seatbelt** (`sandbox-exec`)
- Linux: **Landlock + seccomp**

Это обеспечивает реальную изоляцию, а не только полагается на compliance модели.

### Политики подтверждения

| Политика | Значение | Когда появляются запросы |
|----------|----------|--------------------------|
| **Untrusted** | `untrusted` | Только известные безопасные read-команды авто-выполняются; остальные — запрос |
| **On-Failure** | `on-failure` | Авто-выполнение в sandbox; запрос только при ошибках |
| **On-Request** | `on-request` | Модель решает, когда запрашивать подтверждение |
| **Never** | `never` | Без запросов (комбинировать с sandbox для безопасности) |

### Конфигурация через config.toml

Файл: `~/.codex/config.toml`

```toml
# Основные настройки
approval_policy = "on-request"
sandbox_mode = "workspace-write"

# Настройки sandbox для workspace-write режима
[sandbox_workspace_write]
writable_roots = ["/additional/allowed/path"]
network_access = false
exclude_tmpdir_env_var = false
exclude_slash_tmp = false

# Фильтрация переменных окружения shell
[shell_environment_policy]
inherit = "all"                    # all | core | none
exclude = ["AWS_*", "AZURE_*"]     # Glob-паттерны для исключения
set = { CI = "1" }                 # Принудительно установленные значения

# Флаги функций
[features]
web_search_request = true          # Включить веб-поиск
exec_policy = true                 # Включить execution policies

# Доверие к проектам
[projects."/path/to/trusted/project"]
trust_level = "trusted"

# Именованные профили для быстрого переключения
[profiles.full_auto]
approval_policy = "on-failure"
sandbox_mode = "workspace-write"

[profiles.readonly_strict]
approval_policy = "never"
sandbox_mode = "read-only"
```

### Execution Policies через Starlark

Codex поддерживает fine-grained контроль команд через `.rules` файлы на Starlark (Python-подобный язык):

```python
# ~/.codex/rules/default.rules

# Разрешить просмотр GitHub PR с запросом
prefix_rule(
    pattern = ["gh", "pr", "view"],
    decision = "prompt",
    justification = "Просмотр PR безопасен, но требует подтверждения",
    match = ["gh pr view 123", "gh pr view --repo org/repo"],
    not_match = ["gh pr --repo org/repo view 123"],
)

# Полностью заблокировать force push
prefix_rule(
    pattern = ["git", "push", "--force"],
    decision = "forbidden",
    justification = "Force push может уничтожить историю",
)

# Разрешить npm-скрипты без запроса
prefix_rule(
    pattern = ["npm", "run"],
    decision = "allow",
    justification = "Скрипты пакетов обычно безопасны",
)
```

**Тестирование правил:**
```bash
codex execpolicy check --pretty --rules ~/.codex/rules/default.rules -- gh pr view 123
```

### CLI-флаги

```bash
# Стандартное использование (workspace write + prompt on request)
codex

# Только чтение для исследования
codex --sandbox read-only --ask-for-approval never

# Полная автоматизация
codex --full-auto  # Эквивалент: -s workspace-write -a on-failure

# Обход всех защит (опасно — только в изолированных контейнерах!)
codex --dangerously-bypass-approvals-and-sandbox
codex --yolo  # Алиас

# Добавить записываемые директории
codex --add-dir /additional/path

# Использовать именованный профиль
codex --profile full_auto

# Переопределить значения конфига
codex --config sandbox_workspace_write.network_access=true
```

### Enterprise managed configuration

Пути для enterprise-политик:
- Linux/macOS: `/etc/codex/managed_config.toml`
- Windows: `~/.codex/managed_config.toml`
- macOS MDM: Preference domain `com.openai.codex`, key `config_toml_base64`

Managed configuration имеет приоритет над пользовательскими настройками.

---

## Gemini CLI

Gemini CLI реализует разрешения через **allowlist и blocklist инструментов** в комбинации с контейнерной или macOS Seatbelt песочницей.

### Встроенные инструменты

| Внутреннее имя | Отображаемое имя | Требует подтверждения |
|----------------|------------------|----------------------|
| `read_file` | ReadFile | Нет |
| `write_file` | WriteFile | Да |
| `replace` | Edit | Да |
| `run_shell_command` | Shell | Да |
| `web_fetch` | WebFetch | Да |
| `google_web_search` | GoogleSearch | Да |
| `glob` | FindFiles | Нет |
| `list_directory` | ReadFolder | Нет |
| `search_file_content` | SearchText | Нет |
| `save_memory` | SaveMemory | Нет |

### Массивы разрешений инструментов

В `settings.json` используются три массива:

```json
{
  "tools": {
    "core": [
      "ReadFileTool",
      "GlobTool",
      "run_shell_command(git)",
      "run_shell_command(npm test)"
    ],
    "allowed": [
      "run_shell_command(npm test)",
      "run_shell_command(git status)"
    ],
    "exclude": [
      "run_shell_command(rm -rf)",
      "write_file"
    ]
  }
}
```

| Массив | Назначение |
|--------|------------|
| `tools.core` | **Allowlist** — ограничивает доступные инструменты. Если задан, только перечисленные могут использоваться |
| `tools.allowed` | Инструменты, которые обходят диалоги подтверждения (session allowlist) |
| `tools.exclude` | **Blocklist** — имеет абсолютный приоритет над другими списками |

Shell-паттерны используют prefix matching: `run_shell_command(git)` разрешает `git status`, `git commit` и т.д.

### Расположение конфигурационных файлов

| Тип | Путь | Назначение |
|-----|------|------------|
| System defaults | `/etc/gemini-cli/system-defaults.json` | Базовые значения (Linux) |
| User settings | `~/.gemini/settings.json` | Пользовательская конфигурация |
| Project settings | `.gemini/settings.json` | Per-project переопределения |
| System overrides | `/etc/gemini-cli/settings.json` | Enterprise enforcement |

### Полная структура settings.json

```json
{
  "$schema": "https://raw.githubusercontent.com/google-gemini/gemini-cli/main/schemas/settings.schema.json",
  
  "security": {
    "disableYoloMode": false,
    "enablePermanentToolApproval": false,
    "blockGitExtensions": false,
    "environmentVariableRedaction": {
      "enabled": true,
      "allowed": ["MY_PUBLIC_VAR"],
      "blocked": ["INTERNAL_SECRET"]
    }
  },
  
  "tools": {
    "sandbox": "docker",
    "autoAccept": false,
    "core": ["ReadFileTool", "GlobTool", "run_shell_command(git)"],
    "allowed": ["run_shell_command(npm test)"],
    "exclude": ["run_shell_command(rm -rf)"],
    "shell": {
      "enableInteractiveShell": true,
      "inactivityTimeout": 300,
      "pager": "cat"
    }
  },
  
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "$GITHUB_TOKEN" },
      "trust": false,
      "includeTools": ["get_file_contents", "list_commits"],
      "excludeTools": ["delete_repository"]
    }
  },
  
  "admin": {
    "secureModeEnabled": false,
    "extensions": { "enabled": true },
    "mcp": { "enabled": true }
  }
}
```

### Конфигурация песочницы

Gemini поддерживает несколько sandbox-бэкендов:

```bash
# Переменная окружения
export GEMINI_SANDBOX=docker      # Использовать Docker-контейнеры
export GEMINI_SANDBOX=podman      # Использовать Podman
export GEMINI_SANDBOX=sandbox-exec # macOS Seatbelt

# CLI-флаг
gemini --sandbox
gemini -s
```

**macOS Seatbelt профили** (через `SEATBELT_PROFILE`):

| Профиль | Доступ на запись | Сеть |
|---------|------------------|------|
| `permissive-open` | Папка проекта | Разрешена |
| `permissive-closed` | Папка проекта | Заблокирована |
| `restrictive-open` | Строгие лимиты | Разрешена |
| `restrictive-closed` | Максимальные ограничения | Заблокирована |

Кастомные профили можно создавать в `.gemini/sandbox-macos-<n>.sb`.

### Режимы подтверждения и CLI-флаги

```bash
# Режим по умолчанию (запрос для каждого инструмента)
gemini

# Авто-подтверждение только правок файлов
gemini --approval-mode auto_edit

# Авто-подтверждение всего (sandbox включается автоматически)
gemini --yolo
gemini --approval-mode yolo

# Указать разрешённые инструменты
gemini --allowed-tools "run_shell_command(git),run_shell_command(npm)"

# Отключить все расширения
gemini --extensions none
```

### Контроль инструментов MCP-серверов

Per-server разрешения для fine-grained контроля:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "mcp-server-filesystem",
      "trust": false,
      "includeTools": ["read_file", "list_directory"],
      "excludeTools": ["write_file", "delete_file"]
    }
  },
  "mcp": {
    "allowed": ["trusted-server"],
    "excluded": ["untrusted-server"]
  }
}
```

Настройка `trust: true` обходит все запросы подтверждения для инструментов сервера — использовать осторожно.

---

## Сравнительный анализ

### Архитектуры моделей разрешений

| Аспект | Claude Code | Codex CLI | Gemini CLI |
|--------|-------------|-----------|------------|
| **Первичная модель** | Pattern-based правила | OS-level sandbox | Tool allowlisting |
| **Matching команд** | Prefix с `:*` wildcard | Starlark rules (prefix) | Prefix matching |
| **Контроль путей файлов** | Gitignore-паттерны | Writable roots | Directory-level |
| **Контроль сети** | Domain allowlist | Глобальный on/off | Зависит от sandbox |
| **Формат конфига** | JSON | TOML | JSON |

### Дефолтные postures безопасности

Все три по умолчанию **запрашивают подтверждение перед модификациями**, но их защитные механизмы различаются:

- **Claude Code** — полагается в первую очередь на правила разрешений, исполняемые агентом, с опциональным OS sandboxing
- **Codex CLI** — использует OS-level песочницу как первичную защиту, делая compliance модели менее критичным
- **Gemini CLI** — комбинирует blocklist инструментов с container/Seatbelt песочницей при включении

### Правила приоритета

Все три реализуют идентичный приоритет: **deny > ask > allow**. Инструмент, присутствующий и в allow, и в deny, будет запрещён.

### Сравнение гранулярности

| Инструмент | Сильная сторона |
|------------|-----------------|
| **Claude Code** | Самый гранулярный — gitignore-паттерны позволяют правила типа `Read(./**/*.key)` для блокировки всех файлов с определённым расширением |
| **Codex CLI** | Самая надёжная изоляция — Landlock/Seatbelt sandbox предотвращает обходы даже при попытках модели выполнить неавторизованные операции |
| **Gemini CLI** | Самая простая модель — allowlist по имени инструмента понятен, но менее гибок для сложных сценариев |

### Модели доверия

| Инструмент | Session Trust | Permanent Trust | Project Trust |
|------------|---------------|-----------------|---------------|
| Claude Code | Per-tool на сессию | Per project+command | `.claude/settings.json` |
| Codex CLI | Через approval policy | Via project trust level | `[projects]` в config |
| Gemini CLI | Session allowlist | Опционально (выкл. по умолч.) | `.gemini/settings.json` |

---

## Примеры конфигураций

### Рестриктивное окружение разработки

**Claude Code** (`.claude/settings.json`):
```json
{
  "permissions": {
    "allow": [
      "Read",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(npm test:*)"
    ],
    "deny": [
      "Read(./.env*)",
      "Read(~/.ssh/**)",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(sudo:*)",
      "Bash(rm -rf:*)",
      "WebFetch"
    ],
    "defaultMode": "default"
  }
}
```

**Codex CLI** (`~/.codex/config.toml`):
```toml
sandbox_mode = "read-only"
approval_policy = "untrusted"

[shell_environment_policy]
exclude = ["*_KEY", "*_SECRET", "*_TOKEN"]
```

**Gemini CLI** (`.gemini/settings.json`):
```json
{
  "tools": {
    "core": ["ReadFileTool", "GlobTool", "run_shell_command(git status)"],
    "exclude": ["write_file", "run_shell_command(rm)", "web_fetch"]
  },
  "security": {
    "disableYoloMode": true
  }
}
```

### Permissive-сетап для автоматизации

**Claude Code:**
```bash
claude --dangerously-skip-permissions  # Только в изолированном окружении
```

**Codex CLI:**
```bash
codex --full-auto --skip-git-repo-check
# Или для полного обхода:
codex --yolo  # Только в контейнерах
```

**Gemini CLI:**
```bash
gemini --yolo --sandbox  # Sandbox включается автоматически с yolo
```

### Enterprise lockdown конфигурация

**Claude Code** (`/Library/Application Support/ClaudeCode/managed-settings.json`):
```json
{
  "permissions": {
    "deny": [
      "Read(**/.env*)",
      "Read(**/secrets/**)",
      "Bash(sudo:*)",
      "Bash(curl:*)",
      "WebFetch"
    ],
    "disableBypassPermissionsMode": "disable"
  }
}
```

**Codex CLI** (`/etc/codex/managed_config.toml`):
```toml
sandbox_mode = "workspace-write"
approval_policy = "on-request"

[sandbox_workspace_write]
network_access = false

[features]
web_search_request = false
```

**Gemini CLI** (`/etc/gemini-cli/settings.json`):
```json
{
  "security": {
    "disableYoloMode": true,
    "enablePermanentToolApproval": false
  },
  "admin": {
    "secureModeEnabled": true,
    "mcp": { "enabled": false }
  }
}
```

---

## Переменные окружения

| Назначение | Claude Code | Codex CLI | Gemini CLI |
|------------|-------------|-----------|------------|
| API-аутентификация | `ANTHROPIC_API_KEY` | `OPENAI_API_KEY` | `GEMINI_API_KEY` |
| Config home | — | `CODEX_HOME` | — |
| Контроль sandbox | — | — | `GEMINI_SANDBOX` |
| Отключение телеметрии | `DISABLE_TELEMETRY` | — | — |
| Sandbox-профиль | — | — | `SEATBELT_PROFILE` |

---

## Выводы

Три AI-кодинг CLI представляют разные философии в дизайне разрешений:

| Инструмент | Лучше всего подходит для |
|------------|--------------------------|
| **Claude Code** | Команд, которым нужен точный, pattern-based контроль доступа |
| **Codex CLI** | Окружений, требующих defense-in-depth через OS-level изоляцию |
| **Gemini CLI** | Ситуаций, где важна простота администрирования и аудита |

**Ключевой архитектурный инсайт:** Codex CLI's OS-level sandbox обеспечивает защиту даже против misbehavior модели, тогда как Claude Code и Gemini CLI больше полагаются на соблюдение моделью настроенных правил.

---

## Официальные источники

**Claude Code:**
- https://code.claude.com/docs/en/settings
- https://code.claude.com/docs/en/sandboxing
- https://code.claude.com/docs/en/iam

**OpenAI Codex CLI:**
- https://developers.openai.com/codex/cli/reference/
- https://developers.openai.com/codex/config-basic/

**Gemini CLI:**
- https://geminicli.com/docs/cli/configuration/
- https://geminicli.com/docs/cli/sandbox/
