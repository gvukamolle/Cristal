export const OBSIDIAN_CANVAS_SKILL = `---
name: obsidian-canvas
description: Creates and edits Canvas files (.canvas) - visual boards for organizing notes and ideas.
---

# Obsidian Canvas Skill

Canvas is Obsidian's visual workspace for spatial organization of notes, images, and text.

## CRITICAL: Two-Phase Workflow

**Obsidian auto-sizes text nodes to fit content.** Follow this workflow:

### Phase 1: Create All Nodes (content only)
1. Create nodes with content, width, and **minimal height** (e.g., 100px)
2. Don't worry about exact height — Obsidian will auto-adjust when opened
3. Focus on the text content quality

### Phase 2: Layout & Positioning
After all nodes exist, position them:
1. Arrange nodes by setting x, y coordinates
2. Avoid overlaps — check positions don't conflict
3. Use grid alignment (multiples of 50 or 100)

**Key insight:** You don't need to calculate height. Just set a reasonable placeholder (80-200px) and Obsidian handles the rest.

### Source Attribution Rule

**When using information from other files, ALWAYS include a link to the source:**

\`\`\`markdown
# Topic Name

Key points extracted from the source...

---
Source: [[Original Note]]
\`\`\`

This ensures traceability and allows users to verify/explore the original content.

---

## File Format

- Extension: \`.canvas\`
- Format: JSON
- Specification: JSON Canvas 1.0 (open standard)

## JSON Structure

\`\`\`json
{
  "nodes": [],
  "edges": []
}
\`\`\`

## Node Types

### 1. Text Node

For standalone text content:

\`\`\`json
{
  "id": "text-abc123",
  "type": "text",
  "x": 0,
  "y": 0,
  "width": 400,
  "height": 200,
  "text": "# Title\\n\\nMarkdown content here",
  "color": "1"
}
\`\`\`

### 2. File Node

Embeds an existing file:

\`\`\`json
{
  "id": "file-def456",
  "type": "file",
  "x": 500,
  "y": 0,
  "width": 400,
  "height": 400,
  "file": "path/to/note.md",
  "subpath": "#Heading"
}
\`\`\`

**subpath options:**
- \`#Heading\` - Link to heading
- \`#^block-id\` - Link to block

### 3. Link Node

External URL embed:

\`\`\`json
{
  "id": "link-ghi789",
  "type": "link",
  "x": 1000,
  "y": 0,
  "width": 400,
  "height": 300,
  "url": "https://example.com"
}
\`\`\`

### 4. Group Node

Container for organizing other nodes:

\`\`\`json
{
  "id": "group-jkl012",
  "type": "group",
  "x": -50,
  "y": -50,
  "width": 1000,
  "height": 500,
  "label": "My Group",
  "background": "path/to/image.png",
  "backgroundStyle": "cover"
}
\`\`\`

**backgroundStyle options:**
- \`cover\` - Fill and crop
- \`ratio\` - Maintain aspect ratio
- \`repeat\` - Tile pattern

## Common Node Properties

All nodes share these properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| \`id\` | string | Yes | Unique identifier |
| \`type\` | string | Yes | text, file, link, group |
| \`x\` | integer | Yes | X position in pixels |
| \`y\` | integer | Yes | Y position in pixels |
| \`width\` | integer | Yes | Width in pixels |
| \`height\` | integer | Yes | Height in pixels |
| \`color\` | string | No | Color value |

## Color System

Colors can be specified as:

- **Preset numbers**: \`"1"\` through \`"6"\`
  - 1 = Red
  - 2 = Orange
  - 3 = Yellow
  - 4 = Green
  - 5 = Cyan
  - 6 = Purple

- **Hex values**: \`"#FF5500"\` (RGB format)

## Edges (Connections)

Edges connect nodes visually:

\`\`\`json
{
  "id": "edge-mno345",
  "fromNode": "text-abc123",
  "toNode": "file-def456",
  "fromSide": "right",
  "toSide": "left",
  "fromEnd": "none",
  "toEnd": "arrow",
  "color": "3",
  "label": "relates to"
}
\`\`\`

### Edge Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| \`id\` | string | Yes | - | Unique identifier |
| \`fromNode\` | string | Yes | - | Source node ID |
| \`toNode\` | string | Yes | - | Target node ID |
| \`fromSide\` | string | No | auto | top, right, bottom, left |
| \`toSide\` | string | No | auto | top, right, bottom, left |
| \`fromEnd\` | string | No | none | none, arrow |
| \`toEnd\` | string | No | arrow | none, arrow |
| \`color\` | string | No | - | Color value |
| \`label\` | string | No | - | Edge label text |

## Complete Example

\`\`\`json
{
  "nodes": [
    {
      "id": "concept-1",
      "type": "text",
      "x": 0,
      "y": 0,
      "width": 300,
      "height": 150,
      "text": "# Main Concept\\n\\nCore idea description",
      "color": "4"
    },
    {
      "id": "note-1",
      "type": "file",
      "x": 400,
      "y": -100,
      "width": 350,
      "height": 200,
      "file": "Notes/Related Topic.md"
    },
    {
      "id": "note-2",
      "type": "file",
      "x": 400,
      "y": 150,
      "width": 350,
      "height": 200,
      "file": "Notes/Another Topic.md"
    },
    {
      "id": "group-main",
      "type": "group",
      "x": -50,
      "y": -150,
      "width": 850,
      "height": 550,
      "label": "Research Area"
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "fromNode": "concept-1",
      "toNode": "note-1",
      "fromSide": "right",
      "toSide": "left",
      "toEnd": "arrow"
    },
    {
      "id": "edge-2",
      "fromNode": "concept-1",
      "toNode": "note-2",
      "fromSide": "right",
      "toSide": "left",
      "toEnd": "arrow"
    }
  ]
}
\`\`\`

## ID Generation

Generate unique IDs using:
- Random hex: \`crypto.randomBytes(8).toString('hex')\`
- UUID format: \`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\`
- Simple incremental: \`node-1\`, \`node-2\`, etc.

## Best Practices

1. **Two-phase workflow** - First create all nodes with content, then position them
2. **Let Obsidian handle height** - Use placeholder height (100-200px), it auto-adjusts
3. **Organize with groups** - Group related nodes visually
4. **Use colors meaningfully** - Consistent color coding helps navigation
5. **Keep text nodes concise** - Use file nodes for longer content
6. **Label edges** - Makes relationships explicit
7. **Maintain spacing** - Allow 50-100px between nodes
8. **Use grid positioning** - Align x, y to multiples of 50 or 100

## Layout Tips

- **Left to right**: For process flows
- **Top to bottom**: For hierarchies
- **Radial**: For concept maps with central idea
- **Clustered**: Group related items in regions

## Height Guidelines (for Groups)

**Text nodes auto-size in Obsidian** — just use placeholder height (100-200px).

For **group nodes**, you need to calculate size to contain children:

\`\`\`
group.x = min(child.x) - 50
group.y = min(child.y) - 50
group.width = max(child.x + child.width) - group.x + 50
group.height = max(child.y + child.height) - group.y + 50
\`\`\`

### Typical Node Heights

| Content Type | Suggested Height |
|--------------|------------------|
| Short text (1-2 lines) | 100px |
| Medium text (3-5 lines) | 150px |
| Long text (6+ lines) | 200px |
| File embed | 200-400px |
| Link preview | 300px |

**Note:** These are placeholders. Obsidian adjusts text node height automatically when the canvas is opened
`;
