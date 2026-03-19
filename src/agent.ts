import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { discoverSkills } from './discovery.js'
import { buildCatalog } from './catalog.js'
import { activateSkills } from './activation.js'

const readFileTool: Anthropic.Tool = {
  name: 'read_file',
  description: 'Read the contents of a file within the skills directory.',
  input_schema: {
    type: 'object' as const,
    properties: {
      path: {
        type: 'string',
        description: 'Absolute path to the file to read',
      },
    },
    required: ['path'],
  },
}

function executeReadFile(filePath: string, projectRoot: string): string {
  const skillsDir = resolve(join(projectRoot, 'skills'))
  const resolvedPath = resolve(filePath)

  if (!resolvedPath.startsWith(skillsDir)) {
    return `Error: Access denied. Can only read files within ${skillsDir}`
  }

  try {
    return readFileSync(resolvedPath, 'utf-8')
  } catch {
    return `Error: Could not read file ${filePath}`
  }
}

/**
 * Runs the agent for a single user prompt:
 *   1. Discover available skills from the filesystem
 *   2. Ask Claude which skills are relevant (activation phase)
 *   3. Build a system prompt: base instructions + catalog + activated skill bodies
 *   4. Run an agentic loop — execute any file read tool calls, then print the final response
 */
export async function runAgent(userPrompt: string, projectRoot: string): Promise<void> {
  const client = new Anthropic()
  const skills = await discoverSkills(projectRoot)
  const activatedContent = await activateSkills(userPrompt, skills, client)
  const catalog = buildCatalog(skills)

  const systemParts = [
    'You are a helpful coding agent. Answer the user\'s request clearly and concisely.',
    catalog,
    activatedContent,
  ].filter(Boolean)

  const system = systemParts.join('\n\n')
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userPrompt },
  ]

  while (true) {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system,
      tools: [readFileTool],
      messages,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        process.stdout.write(event.delta.text)
      }
    }

    const response = await stream.finalMessage()

    if (response.stop_reason === 'end_turn') break

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content })

      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const { path } = block.input as { path: string }
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: executeReadFile(path, projectRoot),
          })
        }
      }

      messages.push({ role: 'user', content: toolResults })
    }
  }

  process.stdout.write('\n')
}
