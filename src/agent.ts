import Anthropic from '@anthropic-ai/sdk'
import { discoverSkills } from './discovery.js'
import { buildCatalog } from './catalog.js'
import { activateSkills } from './activation.js'

const client = new Anthropic()

/**
 * Runs the agent for a single user prompt:
 *   1. Discover available skills from the filesystem
 *   2. Ask Claude which skills are relevant (activation phase)
 *   3. Build a system prompt: base instructions + catalog + activated skill bodies
 *   4. Stream Claude's response to stdout
 */
export async function runAgent(userPrompt: string, projectRoot: string): Promise<void> {
  
  const skills = await discoverSkills(projectRoot)
  const activatedContent = await activateSkills(userPrompt, skills, client)
  const catalog = buildCatalog(skills)

  const systemParts = [
    'You are a helpful coding agent. Answer the user\'s request clearly and concisely.',
    catalog,
    activatedContent,
  ].filter(Boolean)

  const system = systemParts.join('\n\n')

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    system,
    messages: [{ role: 'user', content: userPrompt }],
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      process.stdout.write(event.delta.text)
    }
  }

  process.stdout.write('\n')
}
