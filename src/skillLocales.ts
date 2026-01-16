import type { LanguageCode } from "./systemPrompts";

/**
 * Localized skill info (name is always the ID, but we can add display names in the future)
 */
export interface SkillLocale {
	description: string;
}

/**
 * Skill descriptions for all supported languages
 */
export type SkillLocales = Record<string, SkillLocale>;

const skillLocales: Record<LanguageCode, SkillLocales> = {
	ru: {
		"obsidian-markdown": {
			description: "Создает и редактирует Markdown-заметки в Obsidian. Используйте для .md файлов, форматирования, frontmatter и внутренних ссылок."
		},
		"obsidian-canvas": {
			description: "Создает и редактирует Canvas-файлы (.canvas) — визуальные доски для организации заметок и идей."
		},
		"obsidian-base": {
			description: "Работает с Obsidian Bases (.base файлы) — структурированными базами данных из заметок с запросами и представлениями."
		},
		"obsidian-links": {
			description: "Понимает и работает с графом ссылок Obsidian — обратными ссылками, исходящими ссылками и связями между заметками."
		},
		"obsidian-tags": {
			description: "Работает с тегами Obsidian — встроенными тегами, вложенными тегами, иерархиями тегов и организацией по тегам."
		},
		"obsidian-dataview": {
			description: "Пишет запросы Dataview для Obsidian — LIST, TABLE, TASK представления с фильтрами, сортировкой и группировкой."
		}
	},
	en: {
		"obsidian-markdown": {
			description: "Creates and edits Markdown notes in Obsidian. Use for .md files, formatting, frontmatter, and internal links."
		},
		"obsidian-canvas": {
			description: "Creates and edits Canvas files (.canvas) - visual boards for organizing notes and ideas."
		},
		"obsidian-base": {
			description: "Works with Obsidian Bases (.base files) - structured databases built from notes with queries and views."
		},
		"obsidian-links": {
			description: "Understands and works with the Obsidian link graph - backlinks, outlinks, and note connections."
		},
		"obsidian-tags": {
			description: "Works with Obsidian tags - inline tags, nested tags, tag hierarchies, and tag-based organization."
		},
		"obsidian-dataview": {
			description: "Writes Dataview queries for Obsidian - LIST, TABLE, TASK views with filters, sorting, and grouping."
		}
	},
	fr: {
		"obsidian-markdown": {
			description: "Crée et modifie des notes Markdown dans Obsidian. Pour les fichiers .md, le formatage, le frontmatter et les liens internes."
		},
		"obsidian-canvas": {
			description: "Crée et modifie des fichiers Canvas (.canvas) - tableaux visuels pour organiser notes et idées."
		},
		"obsidian-base": {
			description: "Travaille avec Obsidian Bases (.base) - bases de données structurées à partir de notes avec requêtes et vues."
		},
		"obsidian-links": {
			description: "Comprend et travaille avec le graphe de liens Obsidian - rétroliens, liens sortants et connexions entre notes."
		},
		"obsidian-tags": {
			description: "Travaille avec les tags Obsidian - tags en ligne, tags imbriqués, hiérarchies et organisation par tags."
		},
		"obsidian-dataview": {
			description: "Écrit des requêtes Dataview pour Obsidian - vues LIST, TABLE, TASK avec filtres, tri et regroupement."
		}
	},
	de: {
		"obsidian-markdown": {
			description: "Erstellt und bearbeitet Markdown-Notizen in Obsidian. Für .md-Dateien, Formatierung, Frontmatter und interne Links."
		},
		"obsidian-canvas": {
			description: "Erstellt und bearbeitet Canvas-Dateien (.canvas) - visuelle Tafeln zur Organisation von Notizen und Ideen."
		},
		"obsidian-base": {
			description: "Arbeitet mit Obsidian Bases (.base-Dateien) - strukturierten Datenbanken aus Notizen mit Abfragen und Ansichten."
		},
		"obsidian-links": {
			description: "Versteht und arbeitet mit dem Obsidian-Linkgraphen - Backlinks, ausgehende Links und Notizverbindungen."
		},
		"obsidian-tags": {
			description: "Arbeitet mit Obsidian-Tags - Inline-Tags, verschachtelte Tags, Tag-Hierarchien und Tag-basierte Organisation."
		},
		"obsidian-dataview": {
			description: "Schreibt Dataview-Abfragen für Obsidian - LIST, TABLE, TASK-Ansichten mit Filtern, Sortierung und Gruppierung."
		}
	},
	es: {
		"obsidian-markdown": {
			description: "Crea y edita notas Markdown en Obsidian. Para archivos .md, formato, frontmatter y enlaces internos."
		},
		"obsidian-canvas": {
			description: "Crea y edita archivos Canvas (.canvas) - tableros visuales para organizar notas e ideas."
		},
		"obsidian-base": {
			description: "Trabaja con Obsidian Bases (.base) - bases de datos estructuradas desde notas con consultas y vistas."
		},
		"obsidian-links": {
			description: "Entiende y trabaja con el grafo de enlaces de Obsidian - backlinks, enlaces salientes y conexiones entre notas."
		},
		"obsidian-tags": {
			description: "Trabaja con etiquetas de Obsidian - etiquetas en línea, anidadas, jerarquías y organización por etiquetas."
		},
		"obsidian-dataview": {
			description: "Escribe consultas Dataview para Obsidian - vistas LIST, TABLE, TASK con filtros, ordenación y agrupación."
		}
	},
	hi: {
		"obsidian-markdown": {
			description: "Obsidian में Markdown नोट्स बनाता और संपादित करता है। .md फाइलों, फॉर्मेटिंग, frontmatter और आंतरिक लिंक के लिए।"
		},
		"obsidian-canvas": {
			description: "Canvas फाइलें (.canvas) बनाता और संपादित करता है - नोट्स और विचारों को व्यवस्थित करने के लिए विजुअल बोर्ड।"
		},
		"obsidian-base": {
			description: "Obsidian Bases (.base फाइलें) के साथ काम करता है - क्वेरी और व्यू के साथ नोट्स से बने स्ट्रक्चर्ड डेटाबेस।"
		},
		"obsidian-links": {
			description: "Obsidian लिंक ग्राफ को समझता है और उसके साथ काम करता है - बैकलिंक्स, आउटलिंक्स और नोट कनेक्शन।"
		},
		"obsidian-tags": {
			description: "Obsidian टैग्स के साथ काम करता है - इनलाइन टैग्स, नेस्टेड टैग्स, टैग हायरार्की और टैग-आधारित संगठन।"
		},
		"obsidian-dataview": {
			description: "Obsidian के लिए Dataview क्वेरी लिखता है - फिल्टर, सॉर्टिंग और ग्रुपिंग के साथ LIST, TABLE, TASK व्यू।"
		}
	},
	zh: {
		"obsidian-markdown": {
			description: "在 Obsidian 中创建和编辑 Markdown 笔记。用于 .md 文件、格式化、frontmatter 和内部链接。"
		},
		"obsidian-canvas": {
			description: "创建和编辑 Canvas 文件（.canvas）- 用于组织笔记和想法的可视化画板。"
		},
		"obsidian-base": {
			description: "使用 Obsidian Bases（.base 文件）- 从笔记构建的结构化数据库，支持查询和视图。"
		},
		"obsidian-links": {
			description: "理解并使用 Obsidian 链接图 - 反向链接、出站链接和笔记连接。"
		},
		"obsidian-tags": {
			description: "使用 Obsidian 标签 - 内联标签、嵌套标签、标签层次结构和基于标签的组织。"
		},
		"obsidian-dataview": {
			description: "为 Obsidian 编写 Dataview 查询 - 带有筛选、排序和分组的 LIST、TABLE、TASK 视图。"
		}
	},
	ja: {
		"obsidian-markdown": {
			description: "Obsidian で Markdown ノートを作成・編集。.md ファイル、フォーマット、frontmatter、内部リンクに対応。"
		},
		"obsidian-canvas": {
			description: "Canvas ファイル（.canvas）を作成・編集 - ノートとアイデアを整理するビジュアルボード。"
		},
		"obsidian-base": {
			description: "Obsidian Bases（.base ファイル）を操作 - クエリとビューを持つノートからの構造化データベース。"
		},
		"obsidian-links": {
			description: "Obsidian リンクグラフの理解と操作 - バックリンク、アウトリンク、ノート間の接続。"
		},
		"obsidian-tags": {
			description: "Obsidian タグの操作 - インラインタグ、ネストタグ、タグ階層、タグベースの整理。"
		},
		"obsidian-dataview": {
			description: "Obsidian 用 Dataview クエリの作成 - フィルター、ソート、グループ化を含む LIST、TABLE、TASK ビュー。"
		}
	}
};

/**
 * Get localized skill description
 * Falls back to English if translation not found
 */
export function getSkillDescription(skillId: string, language: LanguageCode): string | null {
	const langSkills = skillLocales[language];
	if (langSkills && langSkills[skillId]) {
		return langSkills[skillId].description;
	}
	// Fallback to English
	const enSkills = skillLocales.en;
	if (enSkills && enSkills[skillId]) {
		return enSkills[skillId].description;
	}
	return null;
}

/**
 * Check if skill has localized description
 */
export function hasLocalizedDescription(skillId: string): boolean {
	return skillId in skillLocales.en;
}
