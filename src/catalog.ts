import type { Skill } from './discovery.js'

/**
 * Builds the skill catalog section injected into the system prompt.
 *
 * Follows the Agent Skills spec's Tier 1 progressive disclosure:
 * only name + description (+ location) are revealed here — full SKILL.md
 * bodies are loaded later by activation.ts when a skill is actually needed.
 *
 * Returns an empty string when no skills are available (spec: omit entirely).
 */
export function buildCatalog(skills: Skill[]): string {
  if (skills.length === 0) return ''

  const skillEntries = skills
    .map(
      (skill) =>
        `<skill>\n<name>${skill.name}</name>\n<description>${skill.description}</description>\n<location>${skill.location}</location>\n</skill>`
    )
    .join('\n')

  const catalog = `<available_skills>\n${skillEntries}\n</available_skills>`

  const instructions = `The following skills provide specialized instructions for specific tasks.
When a task matches a skill's description, activate that skill to load its full instructions before responding.
Only activate skills that are genuinely relevant to the user's request — do not load skills speculatively.`

  return `${instructions}\n\n${catalog}`
}
