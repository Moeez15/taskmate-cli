#!/usr/bin/env -S node --import tsx/esm
import 'dotenv/config'
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { runAgent } from './src/agent.js'

const rl = readline.createInterface({ input, output })


while (true) {
  const userPrompt = (await rl.question('Agent: ')).trim()

  if (!userPrompt) continue
  if (userPrompt.toLowerCase() === 'exit') {
    console.log('Goodbye!')
    rl.close()
    process.exit(0)
  }

  await runAgent(userPrompt, process.cwd())
  console.log()
}
