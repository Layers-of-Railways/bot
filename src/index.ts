import { Client, GatewayIntentBits, Partials } from 'discord.js';

import 'dotenv/config';
import commandHandler from './handlers/command.handler';
import { logHandler } from './handlers/log.handler';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Channel],
});

client.once('ready', async () => {
  console.log('Discord bot ready!');

  if (process.env.LOGS_CHANNEL) {
    const logsChannel = await client.channels.fetch(process.env.LOGS_CHANNEL);

    if (!logsChannel?.isTextBased()) return;

    await logsChannel.send({ content: 'Bot is ready! :D' });
  }

  if (process.env.NODE_ENV !== 'development')
    console.warn('Running in production mode!');

  client.user?.presence.set({
    activities: [{ name: `Steam 'n' Rails` }],
    status: 'online',
  });
});

export type Handler = (client: Client<false>) => void;


const handlers: Handler[] = [
  commandHandler,
  logHandler
]

for (const handler of handlers) {
  handler(client)
}

client.login(process.env.DISCORD_TOKEN)