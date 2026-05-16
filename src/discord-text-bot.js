import { createAgentRoomClient } from './agent-room-client.js';
import { createApprovalManager } from './approval-manager.js';
import { loadConfig } from './config.js';
import { createDiscordIngress } from './discord-ingress.js';
import { createDiscordResponder } from './discord-responder.js';
import { createLocalConnectorAgent } from './local-connector-agent.js';

export function createDiscordTextBot({
  config = loadConfig(),
  ingress = createDiscordIngress(config.discord),
  connector = createLocalConnectorAgent(),
  agentRoomClient = createAgentRoomClient(config.agentRoom),
  responder = createDiscordResponder(config.discord),
  approvals = createApprovalManager(),
  approvalIdFactory
} = {}) {
  const approvalStore = approvalIdFactory ? createApprovalManager({ idFactory: approvalIdFactory }) : approvals;

  return {
    async handleMessageCreate(event) {
      const parsed = ingress.parseMessageCreate(event);
      if (!parsed.accepted) {
        return {
          handled: false,
          reason: parsed.reason
        };
      }

      const routing = await connector.handleTranscript(parsed.transcript);
      const channelId = parsed.discord?.channelId ?? event.channel_id;

      if (routing.risk === 'blocked') {
        const reply = await responder.sendMessage(channelId, formatBlockedReply(routing));
        return { handled: true, routing, reply };
      }

      if (routing.risk === 'approval_required') {
        const approval = approvalStore.create(routing);
        const reply = await responder.sendMessage(channelId, formatApprovalReply(routing, approval));
        return { handled: true, routing, approval, reply };
      }

      const delivery = await maybeDeliver(agentRoomClient, routing);
      const reply = await responder.sendMessage(channelId, formatSafeReply(routing, delivery));
      return { handled: true, routing, delivery, reply };
    },

    approvals: approvalStore
  };
}

async function maybeDeliver(agentRoomClient, routing) {
  if (routing.action.route.channel !== 'agent_room') {
    return {
      sent: false,
      reason: 'route_not_agent_room',
      target: routing.action.route.target
    };
  }

  return agentRoomClient.send(routing.agentRoomMessage);
}

function formatSafeReply(routing, delivery) {
  return `[safe] ${routing.intent} -> ${routing.action.type} (sent=${delivery.sent})`;
}

function formatApprovalReply(routing, approval) {
  return `[승인 필요] ${routing.intent} / approval=${approval.id}`;
}

function formatBlockedReply(routing) {
  return `[차단] ${routing.reason}`;
}
