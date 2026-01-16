export const OBSIDIAN_DATAVIEW_SKILL = `---
name: obsidian-dataview
description: Writes Dataview queries for Obsidian - LIST, TABLE, TASK views with filters, sorting, and grouping.
---

# Obsidian Dataview Skill

Dataview is a powerful query language for Obsidian that treats your vault as a database.

## Query Types

### LIST Query

Simple list of notes:

\`\`\`dataview
LIST
FROM "Notes"
WHERE status = "active"
SORT file.name ASC
\`\`\`

With additional info:

\`\`\`dataview
LIST status + " - " + priority
FROM #project
\`\`\`

### TABLE Query

Spreadsheet-like view:

\`\`\`dataview
TABLE status, priority, due-date
FROM "Tasks"
WHERE status != "done"
SORT priority DESC
\`\`\`

With aliases:

\`\`\`dataview
TABLE
  status AS "Status",
  priority AS "Priority",
  due-date AS "Due Date"
FROM #task
\`\`\`

### TASK Query

List tasks from notes:

\`\`\`dataview
TASK
FROM "Projects"
WHERE !completed
GROUP BY file.link
\`\`\`

### CALENDAR Query

Calendar view by date:

\`\`\`dataview
CALENDAR date
FROM "Daily Notes"
\`\`\`

## Source Specifiers (FROM)

### Folders

\`\`\`dataview
FROM "Folder"                    # Specific folder
FROM "Folder/Subfolder"          # Nested folder
FROM ""                          # Root folder
\`\`\`

### Tags

\`\`\`dataview
FROM #tag                        # Tagged notes
FROM #project/active             # Nested tags
FROM #tag1 AND #tag2             # Multiple tags
FROM #tag1 OR #tag2              # Either tag
\`\`\`

### Links

\`\`\`dataview
FROM [[Note]]                    # Notes linking TO Note
FROM outgoing([[Note]])          # Notes Note links TO
\`\`\`

### Combinations

\`\`\`dataview
FROM "Folder" AND #tag
FROM #project OR #task
FROM "Notes" AND -#archived      # Exclude tag
\`\`\`

## Filtering (WHERE)

### Comparison Operators

\`\`\`dataview
WHERE status = "active"          # Equals
WHERE priority != "low"          # Not equals
WHERE rating > 3                 # Greater than
WHERE rating >= 3                # Greater or equal
WHERE rating < 5                 # Less than
WHERE rating <= 5                # Less or equal
\`\`\`

### String Operations

\`\`\`dataview
WHERE contains(title, "meeting")
WHERE startswith(file.name, "2024")
WHERE endswith(file.name, "md")
WHERE regexmatch("\\d{4}", file.name)
\`\`\`

### List Operations

\`\`\`dataview
WHERE contains(tags, "important")
WHERE length(file.outlinks) > 5
WHERE any(tags, (t) => t = "urgent")
WHERE all(tasks, (t) => t.completed)
\`\`\`

### Date Operations

\`\`\`dataview
WHERE date = date(today)
WHERE date > date(today) - dur(7 days)
WHERE date >= date("2024-01-01")
WHERE date.year = 2024
WHERE date.month = 1
\`\`\`

### Null Checks

\`\`\`dataview
WHERE status                     # Has value
WHERE !status                    # No value (null)
WHERE status = null              # Explicitly null
\`\`\`

### Logical Operators

\`\`\`dataview
WHERE status = "active" AND priority > 3
WHERE status = "urgent" OR priority = 5
WHERE !(status = "archived")
WHERE (a OR b) AND c
\`\`\`

## Sorting (SORT)

### Basic Sorting

\`\`\`dataview
SORT file.name ASC               # Alphabetical
SORT file.name DESC              # Reverse alphabetical
SORT date DESC                   # Newest first
SORT priority DESC               # Highest first
\`\`\`

### Multiple Sorts

\`\`\`dataview
SORT priority DESC, date ASC
SORT status ASC, file.name ASC
\`\`\`

## Grouping (GROUP BY)

\`\`\`dataview
TABLE rows.file.link
FROM #task
GROUP BY status
\`\`\`

With formatting:

\`\`\`dataview
TABLE length(rows) AS "Count", rows.file.link AS "Notes"
FROM #project
GROUP BY status
\`\`\`

## Limiting (LIMIT)

\`\`\`dataview
LIST
FROM "Notes"
SORT file.mtime DESC
LIMIT 10                         # First 10 results
\`\`\`

## Flattening (FLATTEN)

Expand arrays into rows:

\`\`\`dataview
TABLE tags
FROM "Notes"
FLATTEN tags
\`\`\`

## File Metadata

### Common Properties

\`\`\`dataview
file.name          # File name without extension
file.path          # Full path
file.folder        # Parent folder
file.link          # Clickable link
file.size          # File size in bytes
file.ctime         # Creation time
file.cday          # Creation date
file.mtime         # Modified time
file.mday          # Modified date
file.tags          # All tags
file.etags         # Explicit tags only
file.inlinks       # Incoming links
file.outlinks      # Outgoing links
file.aliases       # Aliases from frontmatter
file.tasks         # Tasks in the file
file.lists         # List items in the file
\`\`\`

## Inline Queries

### Inline Expressions

\`\`\`markdown
Today is \`= date(today)\`
This file: \`= this.file.name\`
Days until deadline: \`= (deadline - date(today)).days\`
\`\`\`

### Inline DQL

\`\`\`markdown
\`= length(filter(file.tasks, (t) => !t.completed))\` incomplete tasks
\`\`\`

## Functions

### String Functions

\`\`\`dataview
upper("text")                    # "TEXT"
lower("TEXT")                    # "text"
replace("hello", "l", "L")       # "heLLo"
regexreplace("a1b2", "\\d", "X")  # "aXbX"
split("a,b,c", ",")              # ["a", "b", "c"]
join(list, ", ")                 # "a, b, c"
substring("hello", 0, 2)         # "he"
truncate("long text", 5)         # "long..."
\`\`\`

### Date Functions

\`\`\`dataview
date(today)                      # Today's date
date(now)                        # Current datetime
date("2024-01-15")               # Parse date
dur(7 days)                      # Duration
dur(2 weeks)
dur(1 month)
date.year                        # Extract year
date.month                       # Extract month
date.day                         # Extract day
date.hour                        # Extract hour
dateformat(date, "yyyy-MM-dd")   # Format date
\`\`\`

### List Functions

\`\`\`dataview
length(list)                     # Count items
contains(list, item)             # Check membership
reverse(list)                    # Reverse order
sort(list)                       # Sort ascending
flat(nested)                     # Flatten nested lists
filter(list, (x) => x > 0)       # Filter items
map(list, (x) => x * 2)          # Transform items
sum(numbers)                     # Sum of numbers
min(list)                        # Minimum value
max(list)                        # Maximum value
average(list)                    # Average value
\`\`\`

### Object Functions

\`\`\`dataview
default(value, fallback)         # Use fallback if null
choice(condition, a, b)          # If-then-else
typeof(value)                    # Get type
\`\`\`

## Common Patterns

### Recent Notes

\`\`\`dataview
TABLE file.mtime AS "Modified"
FROM "Notes"
SORT file.mtime DESC
LIMIT 10
\`\`\`

### Notes by Tag Count

\`\`\`dataview
TABLE length(file.tags) AS "Tags"
FROM "Notes"
SORT length(file.tags) DESC
\`\`\`

### Incomplete Tasks

\`\`\`dataview
TASK
FROM "Projects"
WHERE !completed AND contains(text, "#urgent")
\`\`\`

### Orphan Notes

\`\`\`dataview
LIST
FROM "Notes"
WHERE length(file.inlinks) = 0 AND length(file.outlinks) = 0
\`\`\`

### This Week's Notes

\`\`\`dataview
LIST
FROM "Daily Notes"
WHERE file.cday >= date(today) - dur(7 days)
SORT file.cday DESC
\`\`\`

### Notes Mentioning This Note

\`\`\`dataview
LIST
FROM [[]]
WHERE file.name != this.file.name
\`\`\`

### Project Dashboard

\`\`\`dataview
TABLE
  length(filter(file.tasks, (t) => !t.completed)) AS "Open",
  length(filter(file.tasks, (t) => t.completed)) AS "Done",
  round(length(filter(file.tasks, (t) => t.completed)) / length(file.tasks) * 100) + "%" AS "Progress"
FROM #project
WHERE file.tasks
SORT file.name ASC
\`\`\`

## DataviewJS

For complex queries, use JavaScript:

\`\`\`dataviewjs
const pages = dv.pages("#project")
  .where(p => p.status === "active")
  .sort(p => p.priority, "desc");

dv.table(
  ["Name", "Status", "Priority"],
  pages.map(p => [p.file.link, p.status, p.priority])
);
\`\`\`

## Best Practices

1. **Use appropriate query type** - LIST for simple, TABLE for data, TASK for todos
2. **Filter early** - Use WHERE before SORT for performance
3. **Limit results** - Use LIMIT for large vaults
4. **Use aliases** - Make tables readable with AS
5. **Test incrementally** - Build complex queries step by step
6. **Document queries** - Comment your query intent
`;
