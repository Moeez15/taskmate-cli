# taskmate-cli

A mini coding agent CLI built with Node.js that implements the [Agent Skills specification](https://github.com/anthropics/agent-skills-spec). Powered by Claude Sonnet.

## How it works

1. **Discovery** — scans the `skills/` directory for available `SKILL.md` files
2. **Activation** — uses a forced Claude tool call to select only skills relevant to the user's prompt
3. **Response** — injects the activated skill bodies into the system prompt and streams Claude's answer

## Skills included

| Skill | Description |
|---|---|
| `welcome-me` | Welcomes new users and explains how to get started |
| `doc-coauthoring` | Guides users through a structured workflow for co-authoring documentation |
| `internal-comms` | Helps write internal communications (status reports, newsletters, FAQs, etc.) |

## Prerequisites

Before setting up, make sure you have:

- **Node.js** v18 or higher — check with `node --version`
- **npm** — comes with Node.js
- **An Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)

## Setup

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd taskmate-cli
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install tsx globally

`tsx` is required to run TypeScript directly from any directory:

```bash
npm install -g tsx
```

### 4. Set your Anthropic API key

Create a `.env` file in the project root:

```bash
ANTHROPIC_API_KEY=your-key-here
```

> Get your API key from [console.anthropic.com](https://console.anthropic.com)

### 5. Link the CLI globally

```bash
npm link
```

This registers `taskmate-cli` as a global command. Only needs to be done once.

## Run

```bash
taskmate-cli
```

This works from any directory. Type `exit` to quit.

To run locally without linking:

```bash
npm start
```

## Project structure

```
taskmate-cli/
├── skills/
│   ├── welcome-me/
│   │   └── SKILL.md
│   ├── doc-coauthoring/
│   │   └── SKILL.md
│   └── internal-comms/
│       └── SKILL.md
├── src/
│   ├── agent.ts    
│   ├── activation.ts  
│   ├── catalog.ts     
│   └── discovery.ts    
├── index.ts
├── tsconfig.json
└── package.json
```

## Submission

**Time spent:** 6 hours

**Challenges:**
This was my first time building a CLI agent that can respond using different skills, so there was a lot to figure out. The hardest part was really understanding the Agent Skills specification and making sure my implementation followed all the rules. It took some trial and error to get the skill-matching logic right especially making sure the welcome-me skill only triggered for the right prompts. Figuring out how to load skills dynamically and keeping the code clean and readable at the same time was tricky, but it was also a really interesting learning experience.


## Example prompts

**Onboarding**
```
I'm new to this project, what should I do?
```

**doc-coauthoring**
```
Help me draft a proposal for migrating our database from MySQL to PostgreSQL. 
```

**internal-comms**
```
1. Draft a company newsletter highlighting that Q1 results exceeded expectations by 15%, announcing the opening of a new London office, and promoting the annual hackathon taking place June 12–14.

2. Write a 3P for the whole engineering org — we hired 12 people, launched the v2 API, and we're blocked on the vendor contract for cloud migration.
```

**No skill**
```
What is 2 + 2?
```

## Video Walkthrough
<div>
    <a href="https://www.loom.com/share/101c831956f845198679c979be0df803">
      <p>taskmate-cli Demo Walkthrough</p>
    </a>
    <a href="https://www.loom.com/share/101c831956f845198679c979be0df803">
      <img style="max-width:300px;" src="https://cdn.loom.com/sessions/thumbnails/101c831956f845198679c979be0df803-2b823e48f2946695-full-play.gif#t=0.1">
    </a>
</div>

## License

Copyright [yyyy] [name of copyright owner]

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

> http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
