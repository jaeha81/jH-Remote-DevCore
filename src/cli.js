#!/usr/bin/env node

import { createLocalConnectorAgent } from './local-connector-agent.js';
import { transcribeTextFile } from './whisper-agent.js';

async function main(argv) {
  const args = parseArgs(argv);
  const transcript = await readTranscript(args);
  const agent = createLocalConnectorAgent();
  const result = await agent.handleTranscript(transcript);

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
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }

  return args;
}

async function readTranscript(args) {
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

  printHelp();
  process.exitCode = 1;
  return '';
}

function printHelp() {
  console.log(`Usage:
  node src/cli.js --text "현재 상태 알려줘"
  node src/cli.js --file .\\voice-command.txt

MVP:
  --text  direct command text
  --file  UTF-8 transcript text file
`);
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
