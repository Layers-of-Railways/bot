import {
    ButtonStyle,
    EmbedBuilder,
    Events,
    Message,
    inlineCode,
} from 'discord.js';

// log providers
import logProviders from '../logProviders/_logProviders';
import logAnalyzers from '../logIssueAnalyzers/_logIssueAnalyzers';

import { Handler } from '..';
import { Log } from '../logs/Log';
import { Button } from './button.handler';
import { ActionRowBuilder, ButtonBuilder } from '@discordjs/builders';
import { nullType } from 'valibot';

export type LogAnalyzer = (
    url: string
) => Promise<null | { name: string; value: string }>;
export interface LogProvider {
    hostnames: string[];
    parse: (url: string) => Promise<void | string>;
}

export type Analyzer = (
    log: Log
) => Promise<{ name: string; value: string } | null>;

const hostnameMap = new Map<string, (text: string) => Promise<void | string>>();

for (const provider of logProviders) {
    provider.hostnames.forEach((hostname) =>
        hostnameMap.set(hostname, provider.parse)
    );
}

async function parseWebLog(text: string): Promise<string | void> {
    const reg = text.match(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/
    );
    if (!reg) return;
    const url = reg[0];
    const hostname = url.split('/')[2];
    if (!hostnameMap.has(hostname)) return;
    return hostnameMap.get(hostname)!(url);
}

async function findIssues(log: Log) {
    const issues: { name: string; value: string }[] = [];

    for (const analyzer of logAnalyzers) {
        const issue = await analyzer(log);
        if (issue) issues.push(issue);
    }

    return issues;
}

const getLogText = async (message: Message) => {
    const attachment = message.attachments.find(
        (attachment) => attachment.contentType == 'text/plain; charset=utf-8'
    );

    if (!message.content && !attachment) return;
    if (!message.channel.isTextBased()) return;

    if (message.author === message.client.user) return;

    return attachment
        ? await (await fetch(attachment.url)).text()
        : await parseWebLog(message.content);
};

const uploadButton = new Button(
    'uploadmclogs',
    nullType(),
    async (interaction) => {
        if (!interaction.message.reference?.messageId) return;
        const message = interaction.channel?.messages.cache.get(
            interaction.message.reference?.messageId
        );
        if (!message) return;
        const log = await getLogText(message);
        if (!log) return;
        const res = await fetch('https://api.mclo.gs/1/log', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `content=${encodeURIComponent(log)}`,
            method: 'POST',
        });
        const data = await res.json();
        if (!data.success)
            return interaction.reply({
                ephemeral: true,
                content: "couldn't upload to mclo.gs",
            });
        interaction.message.edit({
            embeds: [
                ...interaction.message.embeds,
                new EmbedBuilder({
                    title: 'Uploaded to mclo.gs',
                    url: data.url,
                    description: `id: ${data.id}`,
                }),
            ],
            components: [],
        });
    }
);

export const logHandler: Handler = (client) => {
    client.on(Events.MessageCreate, async (message) => {
        if (message.author.id == message.client.user.id) return;
        try {
            if (message.channel.partial) await message.channel.fetch();
            if (message.author.partial) await message.author.fetch();

            const log = await getLogText(message);

            const attachment = message.attachments.find(
                (attachment) =>
                    attachment.contentType == 'text/plain; charset=utf-8'
            );

            if (!log) return;

            const regexPasses = [
                /---- Minecraft Crash Report ----/, // Forge Crash report
                /\n\\|[\\s\\d]+\\| Minecraft\\s+\\| minecraft\\s+\\| (\\S+).+\n/, // Quilt mod table
                /: Loading Minecraft (\\S+)/, // Fabric, Quilt
                /--fml.mcVersion, ([^\\s,]+)/, // Forge
                /--version, ([^,]+),/, // ATLauncher
                / --version (\\S+) /, // MMC, Prism, PolyMC
            ];

            if (!regexPasses.find((reg) => log.match(reg))) return;

            const parsedLog = new Log(log);

            const logInfo: { name: string; value: string; inline?: boolean }[] =
                [];

            if (parsedLog.javaVersion) {
                logInfo.push({
                    name: 'Java Version',
                    value: inlineCode(parsedLog.javaVersion),
                });
            }

            if (parsedLog.gameVersion) {
                logInfo.push({
                    name: 'Minecraft Version',
                    value: inlineCode(parsedLog.gameVersion),
                });
            }

            if (parsedLog.loader) {
                logInfo.push({
                    name: 'Mod Loader',
                    value: inlineCode(
                        `${parsedLog.loader.name} (${parsedLog.loader.version})`
                    ),
                    inline: !!parsedLog.mods,
                });
            }

            if (parsedLog.mods) {
                logInfo.push({
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                });
                logInfo.push({
                    name: 'Mods loaded',
                    value: inlineCode(parsedLog.mods.size.toString()),
                    inline: true,
                });
            }

            logInfo.push({
                name: 'Errors',
                value: inlineCode(parsedLog.errorCount.toString()),
                inline: true,
            });

            logInfo.push({
                name: '\u200b',
                value: '\u200b',
                inline: true,
            });

            logInfo.push({
                name: 'Warnings',
                value: inlineCode(parsedLog.warnCount.toString()),
                inline: true,
            });

            if (parsedLog.mods?.has('create')) {
                logInfo.push({
                    name: 'Create version',
                    value: parsedLog.mods.get('create')!,
                    inline: true,
                });
                if (parsedLog.mods?.has('create'))
                    logInfo.push({
                        name: '\u200b',
                        value: '\u200b',
                        inline: true,
                    });
            }

            if (parsedLog.mods?.has('railways'))
                logInfo.push({
                    name: "Steam 'n' Rails version",
                    value: parsedLog.mods.get('railways')!,
                    inline: true,
                });

            const logInfoEmbed = new EmbedBuilder()
                .setTitle('Log File')
                .setDescription('__Environment info__')
                .setColor('Green')
                .setFields(...logInfo);

            const issues = await findIssues(parsedLog);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                uploadButton.button(
                    {
                        style: ButtonStyle.Secondary,
                        label: 'Upload to mclo.gs',
                    },
                    null
                )
            );

            if (!issues.length) {
                message.reply({
                    embeds: [logInfoEmbed],
                    components: attachment ? [row] : undefined,
                });
                return;
            }

            const issuesEmbed = new EmbedBuilder()
                .setTitle('Log analysis')
                .setDescription(
                    `${issues.length} issue${
                        issues.length == 1 ? '' : 's'
                    } found automatically`
                )
                .setFields(...issues)
                .setColor('Red');

            console.log(attachment);
            message.reply({
                embeds: [logInfoEmbed, issuesEmbed],
                components: attachment ? [row] : undefined,
            });
            return;
        } catch (error) {
            console.error('Unhandled exception on MessageCreate', error);
        }
    });
};
