export const OBSIDIAN_MARKDOWN_SKILL = `---
name: obsidian-markdown
description: Creates and edits Markdown notes in Obsidian. Use for .md files, formatting, frontmatter, and internal links.
---

# Obsidian Markdown Skill

You are working with Obsidian, a knowledge management app. This skill covers Markdown note creation and editing.

## File Format

- Extension: \`.md\` (Markdown)
- Encoding: UTF-8
- Line endings: LF preferred

## YAML Frontmatter

Properties are defined in YAML frontmatter at the start of the file:

\`\`\`yaml
---
title: Note Title
date: 2024-01-15
tags: [tag1, tag2]
aliases: [alias1, alias2]
cssclass: custom-class
status: draft
---
\`\`\`

**Common properties:**
- \`tags\` - Array of tags (alternative to inline #tags)
- \`aliases\` - Alternative names for the note
- \`cssclass\` - Custom CSS class for styling
- \`date\`, \`created\`, \`modified\` - Date properties
- Custom properties work with Dataview plugin

## Internal Links (Wikilinks)

Obsidian uses double-bracket syntax for internal links:

\`\`\`markdown
[[Note Name]]                    # Link to note
[[Note Name|Display Text]]       # Custom display text
[[Note Name#Heading]]            # Link to heading
[[Note Name#^block-id]]          # Link to specific block
[[Folder/Subfolder/Note]]        # Link with path
\`\`\`

**Best practices:**
- Use descriptive note names
- Avoid special characters in names: \` * " \\ / < > : | ? \`
- Links auto-update when notes are renamed

## Embeds (Transclusions)

Embed content from other notes using \`!\` prefix:

\`\`\`markdown
![[Note Name]]                   # Embed entire note
![[Note Name#Heading]]           # Embed specific section
![[Note Name#^block-id]]         # Embed specific block
![[Image.png]]                   # Embed image
![[Image.png|400]]               # Image with width
![[Image.png|400x300]]           # Image with dimensions
![[Audio.mp3]]                   # Embed audio
![[Video.mp4]]                   # Embed video
\`\`\`

## Headings and Structure

\`\`\`markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
\`\`\`

**Structure tips:**
- Use one H1 per note (usually the title)
- Headings create collapsible sections in Obsidian
- Headings are linkable with \`#\` syntax

## Text Formatting

\`\`\`markdown
**bold** or __bold__
*italic* or _italic_
***bold italic***
~~strikethrough~~
==highlight==
\`inline code\`
> blockquote
> [!note] Callout title
\`\`\`

## Callouts

Styled blocks for highlighting information:

\`\`\`markdown
> [!note] Title
> Content here

> [!warning]
> Warning without title

> [!tip]+ Collapsible (open by default)
> Expandable content

> [!danger]- Collapsed by default
> Hidden content
\`\`\`

**Callout types:** note, abstract, summary, tldr, info, todo, tip, hint, important, success, check, done, question, help, faq, warning, caution, attention, failure, fail, missing, danger, error, bug, example, quote, cite

## Lists

\`\`\`markdown
- Unordered item
- Another item
  - Nested item

1. Ordered item
2. Second item
   1. Nested numbered

- [ ] Unchecked task
- [x] Completed task
- [/] In progress
- [-] Cancelled
\`\`\`

## Code Blocks

\`\`\`markdown
\\\`\`\`javascript
const greeting = "Hello";
console.log(greeting);
\\\`\`\`

\\\`\`\`python
def hello():
    print("Hello")
\\\`\`\`
\`\`\`

## Tables

\`\`\`markdown
| Header 1 | Header 2 | Header 3 |
|----------|:--------:|---------:|
| Left     | Center   | Right    |
| Data     | Data     | Data     |
\`\`\`

## Footnotes

\`\`\`markdown
Here is a footnote reference[^1].

[^1]: This is the footnote content.
\`\`\`

## Math (LaTeX)

\`\`\`markdown
Inline math: $E = mc^2$

Block math:
$$
\\sum_{i=1}^{n} x_i = x_1 + x_2 + ... + x_n
$$
\`\`\`

## Comments

\`\`\`markdown
%%
This is a comment.
Not visible in preview mode.
%%

Inline comment: %%hidden%%
\`\`\`

## Block References

Create referenceable blocks with \`^id\`:

\`\`\`markdown
This is a block ^my-block-id

Reference it: [[Note#^my-block-id]]
\`\`\`

## Best Practices

1. **One idea per note** - Atomic notes are easier to link
2. **Descriptive titles** - Makes linking intuitive
3. **Use frontmatter** - For metadata and Dataview queries
4. **Link liberally** - Build your knowledge graph
5. **Use headings** - For structure and navigation
6. **Regular formatting** - Keep notes consistent
`;
