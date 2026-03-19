import { readFile } from 'node:fs/promises'
import { join, dirname, basename } from 'node:path'
import { glob } from 'glob'
import matter from 'gray-matter'

export interface Skill {
  name: string
  description: string
  location: string
  body: string
}

/**
 * Discovers all skills available in the project by scanning well-known paths.
 * Follows the Agent Skills spec's priority order: project-level overrides user-level.
 * Deduplicates by skill name — first path wins.
 */
export async function discoverSkills(projectRoot: string): Promise<Skill[]> {
  const scanPaths = [
    join(projectRoot, 'skills'),
  ]

  const skills: Skill[] = []
  const seen = new Set<string>()

  for (const scanPath of scanPaths) {
    let skillFiles: string[]

    try {
      skillFiles = await glob('*/SKILL.md', {
        cwd: scanPath,
        absolute: true,
        ignore: ['.git/**', 'node_modules/**'],
      })
    } catch {
      continue
    }

    for (const skillFile of skillFiles) {
      const skill = await parseSkillFile(skillFile)
      if (skill && !seen.has(skill.name)) {
        seen.add(skill.name)
        skills.push(skill)
      }
    }
  }

  return skills
}

/**
 * Parses a single SKILL.md file into a Skill object.
 * Returns null if the file is invalid or missing required fields.
 */
async function parseSkillFile(filePath: string): Promise<Skill | null> {
  let content: string

  try {
    content = await readFile(filePath, 'utf-8')
  } catch {
    console.warn(`[discovery] Could not read ${filePath} — skipping`)
    return null
  }

  let parsed: matter.GrayMatterFile<string>

  try {
    parsed = matter(content)
  } catch {
    console.warn(`[discovery] Unparseable YAML frontmatter in ${filePath} — skipping`)
    return null
  }

  const { data, content: body } = parsed
  const name = data.name as string | undefined
  const description = data.description as string | undefined

  if (!description || description.trim() === '') {
    console.warn(`[discovery] Missing description in ${filePath} — skipping`)
    return null
  }

  if (!name || name.trim() === '') {
    console.warn(`[discovery] Missing name in ${filePath} — skipping`)
    return null
  }

  const dirName = basename(dirname(filePath))
  if (name !== dirName) {
    console.warn(
      `[discovery] Skill name "${name}" doesn't match directory "${dirName}" in ${filePath}`
    )
  }

  return {
    name: name.trim(),
    description: description.trim(),
    location: filePath,
    body: body.trim(),
  }
}
