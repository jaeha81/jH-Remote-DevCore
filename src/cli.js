#!/usr/bin/env node

import { createLocalConnectorAgent } from './local-connector-agent.js';
import { transcribeTextFile } from './whisper-agent.js';
import { loadConfig } from './config.js';
import { createAgentRoomClient } from './agent-room-client.js';
import { createTranscriberFromConfig } from './whisper-provider.js';
import { createDiscordIngress } from './discord-ingress.js';
import { readFile } from 'node:fs/promises';

async function main(argv) {
  const args = parseArgs(argv);
  const config = loadConfig();
  const transcript = await readTranscript(args, config);
  const agent = createLocalConnectorAgent();
  const routing = await agent.handleTranscript(transcript);
  const agentRoom = createAgentRoomClient(config.agentRoom);
  const delivery = await maybeDeliver(agentRoom, routing);
  const result = {
    ...routing,
    delivery
  };

  console.log(JSON.stringify(result, null, 2));
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--text') {
      args.text = argv[index + 1];
      index += 1;
    } else if (arg === '--file') {
      args.file = argv[index + 1];
      index += 1;
    } else if (arg === '--voice-file') {
      args.voiceFile = argv[index + 1];
      index += 1;
    } else if (arg === '--discord-message') {
      args.discordMessage = argv[index + 1];
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }

  return args;
}

async function readTranscript(args, config) {
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.text) {
    return args.text;
  }

  if (args.file) {
    return transcribeTextFile(args.file);
  }

  if (args.voiceFile) {
    const transcriber = createTranscriberFromConfig({
      ...config.whisper,
      filePath: args.voiceFile
    });
    return transcriber.transcribe();
  }

  if (args.discordMessage) {
    const event = JSON.parse(await readFile(args.discordMessage, 'utf8'));
    const ingress = createDiscordIngress(config.discord);
    const parsed = ingress.parseMessageCreate(event);
    if (!parsed.accepted) {
      throw new Error(`Discord message ignored: ${parsed.reason}`);
    }
    return parsed.transcript;
  }

  printHelp();
  process.exitCode = 1;
  return '';
}

function printHelp() {
  console.log(`Usage:
  node src/cli.js --text "현재 상태 알려줘"
  node src/cli.js --file .\\voice-command.txt
  node src/cli.js --voice-file .\\voice.webm
  node src/cli.js --discord-message .\\discord-message.json

MVP:
  --text  direct command text
  --file  UTF-8 transcript text file
  --voice-file  audio file through WHISPER_PROVIDER
  --discord-message  Discord MESSAGE_CREATE JSON file

Agent Room:
  AGENT_ROOM_ENABLED=false by default, so CLI returns dry-run delivery.
`);
}

async function maybeDeliver(agentRoom, routing) {
  if (routing.action.route.channel !== 'agent_room') {
    return {
      sent: false,
      reason: 'route_not_agent_room',
      target: routing.action.route.target
    };
  }

  return agentRoom.send(routing.agentRoomMessage);
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
