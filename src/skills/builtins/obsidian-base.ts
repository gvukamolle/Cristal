export const OBSIDIAN_BASE_SKILL = `---
name: obsidian-base
description: Works with Obsidian Bases (.base files) - structured databases built from notes with queries and views.
---

# Obsidian Bases Skill

Bases transform your notes into queryable databases with custom views, filters, and formulas.

## File Format

- Extension: \`.base\`
- Format: YAML
- Purpose: Define data sources, properties, filters, formulas, and views

## Basic Structure

\`\`\`yaml
sources:
  - path: "Notes"
    types:
      - markdown

properties:
  status:
    displayName: Status

filters:
  - name: "Active"
    query: 'status = "active"'

formulas:
  daysOld: '(today() - file.cTime).days'

views:
  - type: table
    name: "Main View"
\`\`\`

## Sources Section

Define where to pull data from:

\`\`\`yaml
sources:
  # Single folder
  - path: "Projects"
    types:
      - markdown

  # Multiple folders
  - path: "Tasks"
  - path: "Notes/Work"

  # Include subfolders (recursive)
  - path: "Archive"
    recursive: true

  # Filter by file pattern
  - path: "Daily"
    pattern: "*.md"
\`\`\`

## Properties Section

Configure how properties are displayed:

\`\`\`yaml
properties:
  # Frontmatter property
  status:
    displayName: "Task Status"
    type: text

  # File metadata
  file.cTime:
    displayName: "Created"
    type: date

  file.mTime:
    displayName: "Modified"
    type: date

  file.name:
    displayName: "Name"
    type: text

  file.path:
    displayName: "Location"
    type: text

  file.size:
    displayName: "Size"
    type: number

  # Formula property
  formula.daysOld:
    displayName: "Age (days)"
    type: number
\`\`\`

### Property Types

- \`text\` - String values
- \`number\` - Numeric values
- \`date\` - Date/datetime values
- \`checkbox\` - Boolean true/false
- \`select\` - Single selection
- \`multiselect\` - Multiple selections
- \`link\` - Internal links
- \`formula\` - Computed values

## Filters Section

Create reusable filter conditions:

\`\`\`yaml
filters:
  # Simple equality
  - name: "Active Tasks"
    query: 'status = "active"'

  # Comparison operators
  - name: "High Priority"
    query: 'priority > 3'

  # Date comparisons
  - name: "This Week"
    query: 'date >= startOfWeek() and date <= endOfWeek()'

  # Tag filters
  - name: "Work Related"
    query: 'file.hasTag("work")'

  # Complex conditions
  - name: "Urgent and Unfinished"
    query: 'priority >= 4 and status != "done"'
\`\`\`

### Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| \`=\` | Equals | \`status = "done"\` |
| \`!=\` | Not equals | \`status != "archived"\` |
| \`>\` | Greater than | \`priority > 3\` |
| \`<\` | Less than | \`age < 30\` |
| \`>=\` | Greater or equal | \`date >= today()\` |
| \`<=\` | Less or equal | \`price <= 100\` |
| \`contains\` | String contains | \`title contains "meeting"\` |

### Logical Operators

\`\`\`yaml
filters:
  # AND
  - name: "Both conditions"
    query: 'status = "active" and priority > 3'

  # OR
  - name: "Either condition"
    query: 'status = "urgent" or priority = 5'

  # NOT
  - name: "Exclude archived"
    query: 'not status = "archived"'

  # Nested
  - name: "Complex"
    query: '(status = "active" or status = "pending") and priority >= 3'
\`\`\`

## Formulas Section

Define computed properties:

\`\`\`yaml
formulas:
  # Date calculations
  daysOld: '(today() - file.cTime).days'
  daysUntilDue: '(dueDate - today()).days'

  # Arithmetic
  total: 'price * quantity'
  discount: 'price * 0.1'
  finalPrice: 'price - formula.discount'

  # Conditionals
  statusEmoji: 'if(status = "done", "✓", "○")'
  urgencyLevel: 'if(priority >= 4, "High", if(priority >= 2, "Medium", "Low"))'

  # String formatting
  formatted: 'file.name + " (" + status + ")"'

  # Date formatting
  createdFormatted: 'file.cTime.format("YYYY-MM-DD")'
\`\`\`

### Formula Functions

**Date functions:**
- \`today()\` - Current date
- \`now()\` - Current datetime
- \`startOfWeek()\` - Start of current week
- \`endOfWeek()\` - End of current week
- \`startOfMonth()\` - Start of current month
- \`date.format("YYYY-MM-DD")\` - Format date

**Math functions:**
- \`round(number)\` - Round to integer
- \`floor(number)\` - Round down
- \`ceil(number)\` - Round up
- \`abs(number)\` - Absolute value
- \`min(a, b)\` - Minimum value
- \`max(a, b)\` - Maximum value

**String functions:**
- \`lower(text)\` - Lowercase
- \`upper(text)\` - Uppercase
- \`trim(text)\` - Remove whitespace
- \`length(text)\` - String length

## Views Section

Configure how data is displayed:

\`\`\`yaml
views:
  # Table view
  - type: table
    name: "All Tasks"
    columns:
      - file.name
      - status
      - priority
      - dueDate
    sort:
      - property: priority
        direction: desc
    filters: [0]  # Index of filter to apply
    limit: 100

  # Calendar view
  - type: calendar
    name: "Schedule"
    dateProperty: dueDate
    filters: [1]

  # Board/Kanban view
  - type: board
    name: "Task Board"
    groupBy: status
    columns:
      - "backlog"
      - "active"
      - "done"
\`\`\`

### View Types

1. **Table** - Spreadsheet-like rows and columns
2. **Calendar** - Date-based calendar view
3. **Board** - Kanban-style columns
4. **Gallery** - Card-based grid

### Sort Configuration

\`\`\`yaml
views:
  - type: table
    sort:
      # Single sort
      - property: date
        direction: desc

      # Multiple sorts (secondary, tertiary)
      - property: priority
        direction: desc
      - property: file.name
        direction: asc
\`\`\`

## Complete Example

\`\`\`yaml
sources:
  - path: "Projects"
    types:
      - markdown
  - path: "Tasks"

properties:
  status:
    displayName: "Status"
    type: select
  priority:
    displayName: "Priority"
    type: number
  dueDate:
    displayName: "Due Date"
    type: date
  file.cTime:
    displayName: "Created"
  formula.urgency:
    displayName: "Urgency"

filters:
  - name: "Active Tasks"
    query: 'status != "done" and status != "archived"'
  - name: "High Priority"
    query: 'priority >= 4'
  - name: "Due This Week"
    query: 'dueDate >= today() and dueDate <= endOfWeek()'
  - name: "Overdue"
    query: 'dueDate < today() and status != "done"'

formulas:
  urgency: 'if(dueDate < today(), "Overdue", if(dueDate <= endOfWeek(), "Soon", "Later"))'
  daysUntilDue: '(dueDate - today()).days'

views:
  - type: table
    name: "All Tasks"
    columns:
      - file.name
      - status
      - priority
      - dueDate
      - formula.urgency
    sort:
      - property: priority
        direction: desc
      - property: dueDate
        direction: asc

  - type: board
    name: "Kanban"
    groupBy: status
    columns:
      - "backlog"
      - "in-progress"
      - "review"
      - "done"

  - type: calendar
    name: "Schedule"
    dateProperty: dueDate
    filters: [0]
\`\`\`

## Best Practices

1. **Start simple** - Begin with basic sources and add complexity
2. **Use meaningful names** - Clear filter and view names
3. **Index filters** - Reference filters by index in views
4. **Leverage formulas** - Compute derived properties
5. **Multiple views** - Different perspectives on same data
6. **Test queries** - Verify filters return expected results
`;
