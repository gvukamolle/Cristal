# Crystal

**Claude directly in Obsidian.** Claude Code CLI integration for working with notes — full power of Claude without web interface limitations.

---

## What is this?

Crystal is an Obsidian plugin that integrates Claude Code CLI directly into your note vault:
- **Claude** (Anthropic) — powerful analysis, reasoning, extended thinking for complex tasks

Not just a chatbot, but a full-featured agent with access to your vault. It **sees your notes**, can **edit them**, **search the web**, and work within the context of your knowledge base.

### Why is this cool?

- **Direct work with notes** — mention files via `@`, the agent sees their content and can edit them
- **Fine-tuned agent** — permissions, models, Extended Thinking, personalization
- **Skills system** — 6 built-in skills for Obsidian + custom skill support
- **Usage statistics** — token tracking, visual limits, daily history
- **One-click editing** — AI responses can be instantly inserted into notes (replace, append, copy)
- **Web search and analysis** — Claude can search and read web pages (configurable permissions)
- **Extended Thinking** — deep analysis for complex tasks
- **8 interface languages** — Russian, English, French, German, Spanish, Hindi, Chinese, Japanese
- **Slash commands** — quick actions: `/summarize`, `/translate`, `/rewrite` and more + custom commands
- **Model selection** — Claude Haiku/Sonnet/Opus 4.5

---

## Features

### Fine-tuned Agent

**Models:**
| Model | Characteristic |
|-------|---------------|
| **Claude Haiku 4.5** | Fast and economical — for simple tasks |
| **Claude Sonnet 4.5** | Balanced — optimal choice |
| **Claude Opus 4.5** | Most powerful — for complex analysis |

**Permissions:**
| Permission | Description |
|------------|-------------|
| `fileRead` | Read files from vault |
| `fileWrite` | Create new files |
| `fileEdit` | Edit existing files |
| `webSearch` | Search the internet |
| `webFetch` | Load and analyze web pages |
| `task` | Run sub-agents for complex tasks |
| `extendedThinking` | Deep analysis mode |

**Extended Thinking:**
Enable for tasks requiring deep analysis — Claude will "think out loud" before responding. Especially useful for:
- Complex analytical tasks
- Multi-step reasoning
- Tasks with ambiguous requirements

**Personalization:**
Customize the agent:
- Your name and role
- Work context (what you do)
- Preferred communication style
- Current focus/projects

### Skills System

6 built-in skills for working with Obsidian:

| Skill | Description |
|-------|-------------|
| `obsidian-markdown` | Creating and editing Markdown notes |
| `obsidian-canvas` | Working with Canvas (visual boards) |
| `obsidian-base` | Working with Bases (structured DBs) |
| `obsidian-links` | Understanding the link graph (backlinks, outlinks) |
| `obsidian-tags` | Working with tags and hierarchies |
| `obsidian-dataview` | Writing Dataview queries |

**Custom skills:**
Create your own skills in `.crystal/skills/<skill-name>/SKILL.md`

### Working with Notes
- Mention files via `@` — agent sees content
- Attach files and images
- "Replace", "Append", "Copy" buttons for quick response insertion
- Create new notes from AI responses

### Built-in Commands
| Command | Description |
|---------|-------------|
| `/summarize` | Brief summary of a note |
| `/translate` | Translate to specified language |
| `/rewrite` | Rewrite more clearly |
| `/expand` | Develop and expand ideas |
| `/fix` | Fix errors and typos |
| `/bullets` | Convert to bullet list |
| `/questions` | Generate questions on the topic |
| `/difficulty` | Explain simpler or more complex |
| `/compact` | Compress conversation context |

### Usage Statistics
- **Token tracking** — input/output tokens for each session
- **Cache tokens** — display of cache_read and cache_creation tokens
- **Visual limits** — progress bars for 5-hour and weekly limits
- **Daily history** — view usage for recent days

---

## Requirements

- **Claude subscription** — Pro ($20/month) or Max ($100/month)
- **Claude Code CLI** — free tool from Anthropic
- **Node.js 18+** — for CLI operation
- **Obsidian Desktop** — plugin works only on desktop version

---

## Installation

### 1. Install Claude CLI

```bash
npm i -g @anthropic-ai/claude-code
```

**OAuth Authentication:**
1. Run `claude` command in terminal
2. Browser will open for OAuth authorization
3. Log in with your Claude.ai account credentials
4. Tokens are automatically saved:
   - macOS: in Keychain
   - Linux/WSL: in `~/.claude/.credentials.json`

### 2. Install Plugin

**From Community Plugins (recommended):**
1. Open **Settings → Community plugins**
2. Search for "Crystal"
3. Click Install, then Enable

**Manual installation:**
1. Download latest release from GitHub
2. Extract `main.js`, `manifest.json`, `styles.css` to `<vault>/.obsidian/plugins/crystal-cli-llm/`
3. Enable in Obsidian settings

---

## Usage

### Basic
Just type in chat — Claude will respond. Use `@` to mention files from your vault.

### Commands
Start a message with `/` to see available commands. For example:
- `/summarize` — create summary of current note
- `/translate english` — translate to English

### Context
- **@file.md** — Claude sees file content
- **File attachment** — drag file to chat or use button
- **Selected text** — select text in note, right-click and choose "Crystal: Mention in request"

### Response Buttons
After Claude's response, buttons appear:
- **Replace** — replace content of current note
- **Append** — add to end of note
- **Copy** — copy to clipboard
- **New page** — create new note with response

---

## Configuration

Open **Settings → Crystal** for configuration:

### Models
- **Claude Haiku 4.5** — fast, for simple tasks
- **Claude Sonnet 4.5** — balanced (recommended)
- **Claude Opus 4.5** — most powerful, for complex analysis

### Permissions
Control Claude's capabilities:
- **Files** — read, write, edit
- **Web** — search and load pages
- **Sub-agents** — run additional tasks
- **Extended Thinking** — deep analysis

### Skills
Choose skills needed for your work:
- Markdown, Canvas, Bases, Links, Tags, Dataview
- Create your own skills

### Personalization
Set up context for more relevant responses:
- Name and role
- Work context
- Communication style
- Current projects

### Commands
- Enable/disable built-in commands
- Create custom slash commands with arbitrary prompts

### Interface Language
Choice of 8 languages: Russian, English, French, German, Spanish, Hindi, Chinese, Japanese.

---

## Troubleshooting

### CLI not found
Run `npm i -g @anthropic-ai/claude-code` and check `claude --version`

### Authorization error
Run `claude` in terminal and re-authorize via OAuth

### Token expired
CLI automatically refreshes tokens. If not working — re-authorize via `claude`

### Plugin not appearing
Reload Obsidian (`Cmd/Ctrl + R`)

### High token usage
Check statistics in settings, use smaller models (Haiku instead of Sonnet)

---

## Development

### Building from source

```bash
git clone https://github.com/gvukamolle/Crystal.git
cd Crystal
npm install
npm run build
```

### Installing to vault

```bash
npm run install-plugin [path-to-vault]
```

Default path: `/Users/timofeygrushko/Documents/Big Base`

After installation, reload Obsidian (`Cmd/Ctrl + R`) and enable the plugin in settings.

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Watch mode — auto-rebuild on changes |
| `npm run build` | Production build (type check + bundle) |
| `npm run install-plugin` | Install plugin to vault via symlink |
| `npm run lint` | Run ESLint |

---

## Author

[Timofey Grushko](https://github.com/gvukamolle)

## License

MIT
