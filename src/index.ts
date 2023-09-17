import {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    Events,
} from 'discord.js';

import 'dotenv/config';
import commandHandler from './handlers/command.handler';
import { logHandler } from './handlers/log.handler';
import { reloadGlobalSlashCommands } from './handlers/command.handler';
import './webserver';
import { buttonHandler } from './handlers/button.handler';

export const client = new Client({
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

client.once(Events.ClientReady, async () => {
    console.log('Discord bot ready!');

    if (process.env.LOGS_CHANNEL) {
        const logsChannel = await client.channels.fetch(
            process.env.LOGS_CHANNEL
        );

        if (!logsChannel?.isTextBased()) return;

        const mode =
            process.env.NODE_ENV === 'development'
                ? 'development'
                : 'production';

        const embed = new EmbedBuilder()
            .setDescription(
                `## Bot is ready!
                Time: <t:${Math.floor(Date.now() / 1000)}:R>
                Running in **${mode}** mode
                Webserver running on port: **${process.env.WEBSERVER_PORT}**
                OS: **${process.platform}**
                CPU Architecture: **${process.arch}**
                Memory: **${
                    Math.round(
                        (process.memoryUsage().heapUsed / 1024 / 1024) * 100
                    ) / 100
                } MB**
                Node.js version: **${process.version}**
                TypeScript version: **${
                    process.env.npm_package_devDependencies_typescript
                }**
                Discord.js version: **${
                    process.env.npm_package_dependencies_discord_js
                }**
                Express version: **${
                    process.env.npm_package_dependencies_express
                }**
                `
            )
            .setColor('Green');

        await logsChannel.send({ embeds: [embed] });
    }

    if (process.env.NODE_ENV !== 'development')
        console.warn('Running in production mode!');

    client.user?.presence.set({
        activities: [{ name: `Steam 'n' Rails` }],
        status: 'online',
    });
});

export type Handler = (client: Client<false>) => void;

const handlers: Handler[] = [commandHandler, logHandler, buttonHandler];

for (const handler of handlers) {
    handler(client);
}

reloadGlobalSlashCommands()
    .then(() => {
        client.login(process.env.DISCORD_TOKEN);
    })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
