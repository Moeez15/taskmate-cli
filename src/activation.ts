import Anthropic from '@anthropic-ai/sdk'
import { dirname } from 'node:path'
import type { Skill } from './discovery.js'
import { buildCatalog } from './catalog.js'

/**
 * Determines which skills are relevant to the user's prompt, then loads
 * their full SKILL.md bodies into context.
 *
 * Two-phase approach per the Agent Skills spec:
 *   Phase 1 — Selection: ask Claude (via forced tool call) which skills apply
 *   Phase 2 — Loading:   inject full body of each selected skill as <skill_content> blocks
 *
 * Returns a string of <skill_content> blocks to append to the system prompt,
 * or an empty string if no skills are relevant.
 */
export async function activateSkills(
  userPrompt: string,
  skills: Skill[],
  client: Anthropic
): Promise<string> {
  if (skills.length === 0) return ''

  const catalog = buildCatalog(skills)

  // Phase 1: ask Claude to select relevant skills using a forced tool call.
  // We use tool_choice "tool" to guarantee a structured response — no free-text.
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are a skill selector. Given a user's request and a catalog of available skills, identify which skills are relevant to the request.

${catalog}`,
    tools: [
      {
        name: 'select_skills',
        description:
          "Select the skills relevant to the user's request. Return an empty array if no skills apply.",
        input_schema: {
          type: 'object' as const,
          properties: {
            skill_names: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Names of skills to activate. Use exact names from the catalog. Empty array if none apply.',
            },
          },
          required: ['skill_names'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'select_skills' },
    messages: [{ role: 'user', content: userPrompt }],
  })

  // Extract selected skill names from the tool call response
  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
  )
  if (!toolUse) return ''

  const { skill_names } = toolUse.input as { skill_names: string[] }
  if (!skill_names || skill_names.length === 0) return ''

  // Phase 2: load full body for each selected skill.
  // We already have the parsed body from discovery — no need to re-read disk.
  const skillMap = new Map(skills.map((s) => [s.name, s]))
  const parts: string[] = []

  for (const name of skill_names) {
    const skill = skillMap.get(name)
    if (!skill) continue

    const skillDir = dirname(skill.location)

    parts.push(`<skill_content name="${skill.name}">
${skill.body}

Skill directory: ${skillDir}
</skill_content>`)
  }

  return parts.join('\n\n')
}
