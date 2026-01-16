export const OBSIDIAN_TAGS_SKILL = `---
name: obsidian-tags
description: Works with Obsidian tags - inline tags, nested tags, tag hierarchies, and tag-based organization.
---

# Obsidian Tags Skill

Tags provide flexible categorization in Obsidian. This skill covers tag syntax, hierarchies, and organization strategies.

## Tag Syntax

### Inline Tags

Tags in note content:

\`\`\`markdown
This note is about #programming and #javascript.

#project/active #priority/high
\`\`\`

### Frontmatter Tags

Tags in YAML frontmatter:

\`\`\`yaml
---
tags:
  - programming
  - javascript
  - tutorial
---
\`\`\`

Or single-line format:

\`\`\`yaml
---
tags: [programming, javascript, tutorial]
---
\`\`\`

## Tag Naming Rules

### Valid Tags

\`\`\`markdown
#valid
#Valid123
#valid-tag
#valid_tag
#valid/nested
#123start    # Can start with numbers
\`\`\`

### Invalid Tags

\`\`\`markdown
#invalid tag   # No spaces
#invalid.tag   # No periods
#invalid!tag   # No special chars (except - _ /)
\`\`\`

## Nested Tags (Hierarchies)

Create tag hierarchies with forward slash:

\`\`\`markdown
#project
#project/active
#project/active/high-priority
#project/completed
#project/archived

#status
#status/todo
#status/in-progress
#status/done
#status/blocked
\`\`\`

### Hierarchy Benefits

1. **Inheritance** - Searching #project finds all nested tags
2. **Organization** - Clear categorical structure
3. **Filtering** - Can filter at any level
4. **Scalability** - Add subcategories as needed

## Tag Organization Strategies

### By Status

\`\`\`markdown
#status/inbox
#status/todo
#status/doing
#status/waiting
#status/done
#status/archived
\`\`\`

### By Area of Life

\`\`\`markdown
#area/work
#area/personal
#area/health
#area/finance
#area/learning
\`\`\`

### By Project

\`\`\`markdown
#project/website-redesign
#project/mobile-app
#project/documentation
#project/research
\`\`\`

### By Content Type

\`\`\`markdown
#type/note
#type/article
#type/book
#type/meeting
#type/person
#type/idea
#type/reference
\`\`\`

### By Priority

\`\`\`markdown
#priority/urgent
#priority/high
#priority/medium
#priority/low
#priority/someday
\`\`\`

### By Time Period

\`\`\`markdown
#date/2024
#date/2024/q1
#date/2024/01
#date/weekly
\`\`\`

## Tag vs. Link vs. Folder

### When to Use Tags

- Cross-cutting concerns
- Multiple categories per note
- Temporary status markers
- Quick filtering

### When to Use Links

- Permanent relationships
- Concept connections
- Navigation structure
- Knowledge graph building

### When to Use Folders

- File organization
- Access control
- Large-scale grouping
- Template locations

### Combined Example

\`\`\`markdown
# Meeting Notes - Project Alpha

Location: Notes/Meetings/2024-01-15.md (folder)

---
tags: [meeting, project-alpha, action-items]
---

Discussed [[Project Alpha]] timeline with [[John Smith]].

#status/needs-review #priority/high
\`\`\`

## Tag Workflow Patterns

### GTD (Getting Things Done)

\`\`\`markdown
#inbox          # Unprocessed items
#next-action    # Next physical actions
#waiting        # Waiting for someone
#someday-maybe  # Future possibilities
#reference      # Reference material

#context/home
#context/office
#context/phone
#context/computer
\`\`\`

### PARA Method

\`\`\`markdown
#para/projects   # Active projects
#para/areas      # Ongoing responsibilities
#para/resources  # Reference material
#para/archives   # Inactive items
\`\`\`

### Zettelkasten

\`\`\`markdown
#zettel/fleeting   # Quick captures
#zettel/literature # From sources
#zettel/permanent  # Processed ideas
#zettel/hub        # Index notes
\`\`\`

## Searching with Tags

### Basic Search

\`\`\`
tag:#programming
tag:#project/active
\`\`\`

### Combined Searches

\`\`\`
tag:#programming tag:#tutorial
tag:#project/active -tag:#status/done
tag:#2024 (tag:#meeting OR tag:#note)
\`\`\`

### Dataview Queries

\`\`\`dataview
// Notes with specific tag
LIST
FROM #programming

// Notes with nested tags
LIST
FROM #project/active

// Notes with multiple tags
LIST
FROM #programming AND #tutorial

// Count notes per tag
TABLE length(rows) as Count
FROM #status
GROUP BY file.tags
\`\`\`

## Tag Maintenance

### Tag Pane

Obsidian's tag pane shows:
- All tags in vault
- Nested hierarchy
- Tag count

### Renaming Tags

To rename a tag across all notes:
1. Use Search and Replace
2. Or third-party plugins like "Tag Wrangler"

### Tag Cleanup

Regular maintenance:
1. Review unused tags
2. Consolidate similar tags
3. Update tag hierarchies
4. Remove obsolete tags

## Best Practices

### Consistency

1. **Case convention** - Choose lowercase or TitleCase and stick with it
2. **Separator convention** - Use \`-\` or \`_\` consistently
3. **Hierarchy depth** - Limit to 2-3 levels maximum
4. **Naming patterns** - Use predictable names

### Meaningful Tags

\`\`\`markdown
# Bad tags
#important       # Too vague
#misc            # Not useful
#stuff           # Meaningless

# Good tags
#priority/high
#status/needs-review
#topic/machine-learning
\`\`\`

### Tag Documentation

Create a tag index note:

\`\`\`markdown
# Tag Taxonomy

## Status Tags
- #status/inbox - Unprocessed items
- #status/active - Currently working on
- #status/done - Completed

## Project Tags
- #project/website - Website redesign project
- #project/mobile - Mobile app development

## Area Tags
- #area/work - Work-related notes
- #area/personal - Personal notes
\`\`\`

### Tag Limits

- Don't over-tag (3-7 tags per note is reasonable)
- Prefer specific tags over generic ones
- Use tags for filtering, not description
- Combine with links for relationships

## Common Tag Sets

### Note Types

\`\`\`markdown
#type/note
#type/reference
#type/log
#type/idea
#type/quote
#type/definition
\`\`\`

### Review Status

\`\`\`markdown
#review/needed
#review/in-progress
#review/complete
#review/approved
\`\`\`

### Source Types

\`\`\`markdown
#source/book
#source/article
#source/video
#source/podcast
#source/conversation
\`\`\`
`;
