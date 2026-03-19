#!/usr/bin/env tsx
import { parse } from 'dotenv'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { runAgent } from './src/agent.js'

const envPath = join(dirname(fileURLToPath(import.meta.url)), '.env')
if (existsSync(envPath)) {
  const parsed = parse(readFileSync(envPath))
  for (const [key, value] of Object.entries(parsed)) {
    if (!(key in process.env)) process.env[key] = value
  }
}

const rl = readline.createInterface({ input, output })
while (true) {
  const userPrompt = (await rl.question('Agent: ')).trim()

  if (!userPrompt) continue
  if (userPrompt.toLowerCase() === 'exit') {
    console.log('Goodbye!')
    rl.close()
    process.exit(0)
  }

  await runAgent(userPrompt, dirname(fileURLToPath(import.meta.url)))
  console.log()
}
