export const OBSIDIAN_LINKS_SKILL = `---
name: obsidian-links
description: Understands and works with the Obsidian link graph - backlinks, outlinks, and note connections.
---

# Obsidian Links Skill

Obsidian's power comes from its link-based knowledge graph. This skill covers link management and graph understanding.

## Link Types in Obsidian

### 1. Wikilinks (Internal Links)

Default Obsidian format:

\`\`\`markdown
[[Note Name]]                    # Basic link
[[Note Name|Alias]]              # Display different text
[[Folder/Note Name]]             # Path to note
[[Note Name#Heading]]            # Link to section
[[Note Name#^block-id]]          # Link to block
\`\`\`

### 2. Markdown Links

Standard Markdown format:

\`\`\`markdown
[Display Text](Note%20Name.md)
[Display Text](Folder/Note%20Name.md)
[Display Text](Note%20Name.md#heading)
\`\`\`

### 3. External Links

\`\`\`markdown
[Website](https://example.com)
<https://example.com>
\`\`\`

## Graph Concepts

### Outgoing Links (Outlinks)

Links FROM the current note TO other notes:

\`\`\`
Current Note
├── [[Linked Note 1]]  →  Outlink
├── [[Linked Note 2]]  →  Outlink
└── [[Linked Note 3]]  →  Outlink
\`\`\`

### Incoming Links (Backlinks)

Links FROM other notes TO the current note:

\`\`\`
Other Note 1  →  [[Current Note]]  →  Backlink
Other Note 2  →  [[Current Note]]  →  Backlink
Other Note 3  →  [[Current Note]]  →  Backlink
\`\`\`

### Unlinked Mentions

Text that matches a note name but isn't linked:

\`\`\`markdown
# In some note
The concept of "Current Note" is important...
# "Current Note" appears as text but isn't [[Current Note]]
\`\`\`

## Link Strategies

### Hub Notes (MOCs - Maps of Content)

Central notes that link to related topics:

\`\`\`markdown
# Programming MOC

## Languages
- [[JavaScript]]
- [[Python]]
- [[Rust]]

## Concepts
- [[Data Structures]]
- [[Algorithms]]
- [[Design Patterns]]

## Projects
- [[Project Alpha]]
- [[Project Beta]]
\`\`\`

### Atomic Notes

Small, focused notes that link to each other:

\`\`\`markdown
# Encapsulation

Encapsulation is a fundamental [[OOP Concepts|OOP]] principle.

Related concepts:
- [[Abstraction]]
- [[Information Hiding]]
- [[Access Modifiers]]

See also: [[SOLID Principles]]
\`\`\`

### Daily Notes with Links

Connect daily notes to permanent notes:

\`\`\`markdown
# 2024-01-15

## Tasks
- [ ] Review [[Project Alpha]] documentation
- [x] Meeting about [[Feature Request 123]]

## Notes
- Discussed [[Microservices Architecture]] with team
- New idea: [[Event Sourcing]] pattern might work

## Links
- [[2024-01-14]] | [[2024-01-16]]
\`\`\`

## Link Patterns

### Bidirectional Linking

When you link A→B, always consider if B→A makes sense:

\`\`\`markdown
# Note A
See also: [[Note B]]

# Note B
Related: [[Note A]]
\`\`\`

### Contextual Links

Add context around links:

\`\`\`markdown
# Bad
[[JavaScript]]

# Good
[[JavaScript]] is used for web development.

# Better
We chose [[JavaScript]] because it offers:
- Browser compatibility
- Large ecosystem ([[npm]])
- [[Async Programming]] support
\`\`\`

### Section Links

Link to specific sections for precision:

\`\`\`markdown
See [[JavaScript#Arrow Functions]] for the syntax.
Refer to [[API Documentation#Authentication]] for auth details.
\`\`\`

### Block Links

Link to specific paragraphs or items:

\`\`\`markdown
# Source Note
This is an important insight. ^important-insight

# Other Note
As mentioned in [[Source Note#^important-insight]]...
\`\`\`

## Graph Analysis

### Finding Orphan Notes

Notes with no incoming or outgoing links:

\`\`\`
Orphan Note (no connections)
├── No [[outgoing links]]
└── No backlinks
\`\`\`

**Strategy:** Review orphans periodically and either:
- Add relevant links
- Merge with related notes
- Delete if no longer needed

### Identifying Hubs

Notes with many connections are hubs:

\`\`\`
Hub Note
├── 15 outgoing links
├── 23 backlinks
└── High centrality in graph
\`\`\`

**Hub types:**
- **Index notes** - Entry points to topics
- **MOCs** - Curated collections
- **Concept notes** - Fundamental ideas

### Cluster Detection

Groups of interconnected notes:

\`\`\`
Cluster: Programming
├── [[JavaScript]] ↔ [[TypeScript]]
├── [[React]] ↔ [[JavaScript]]
├── [[Node.js]] ↔ [[JavaScript]]
└── [[npm]] ↔ [[Node.js]]
\`\`\`

## Link Maintenance

### Broken Links

Detect and fix broken links:

\`\`\`markdown
# Broken link (target doesn't exist)
[[Nonexistent Note]]

# Fix options:
1. Create the missing note
2. Update link to correct note name
3. Remove the link if irrelevant
\`\`\`

### Link Refactoring

When renaming notes:
- Obsidian auto-updates wikilinks
- Review context after rename
- Check for unlinked mentions

### Link Cleanup

Regular maintenance tasks:
1. Review orphan notes
2. Check broken links
3. Convert unlinked mentions to links
4. Consolidate duplicate concepts

## Best Practices

### Linking Guidelines

1. **Link on first mention** - Link concepts when first introduced
2. **Don't over-link** - Not every word needs a link
3. **Use descriptive aliases** - \`[[Technical Term|plain language]]\`
4. **Link both directions** - Connect related notes bidirectionally
5. **Review backlinks** - Regularly check what links to your notes

### Naming Conventions

1. **Consistent naming** - Use same format for similar notes
2. **Avoid special characters** - Stick to alphanumeric and spaces
3. **Singular nouns** - "Book" not "Books" for concept notes
4. **Descriptive titles** - "Setting Up Node.js" not "Setup"

### Graph Health

1. **No isolated notes** - Every note should have at least one link
2. **Clear entry points** - Maintain index/MOC notes
3. **Reasonable clusters** - Related notes should be connected
4. **Avoid link spam** - Quality over quantity

## Link Queries (Dataview)

Query links using Dataview plugin:

\`\`\`dataview
// Notes linking to current note
LIST
FROM [[]]
WHERE contains(file.outlinks, this.file.link)

// Outgoing links from current note
LIST file.outlinks
FROM "current note"

// Notes with most backlinks
TABLE length(file.inlinks) as Backlinks
SORT length(file.inlinks) DESC
LIMIT 10
\`\`\`
`;
