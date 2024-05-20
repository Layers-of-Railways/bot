import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    GuildMember,
    GuildNSFWLevel,
    Message,
    ModalActionRowComponentBuilder,
    PermissionsBitField,
    TextBasedChannel,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { Handler } from '..';
import { Button } from './button.handler';
import { Modal } from './modal.handler';

const banModal = new Modal(
    'ban-spammer',
    async (interaction, data: { userId: string; reason: string }) => {
        interaction.guild?.bans.create(data.userId, {
            reason: interaction.components[0].components[0].value,
            deleteMessageSeconds: 3600 * 3,
        });
        await interaction.reply({
            content: `<@${data.userId}> (\`${data.userId}\`) was banned.`,
            ephemeral: true,
        });
        if (interaction.message) {
            await interaction.message.edit({
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId('fakeBanButton')
                            .setLabel('Ban')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true)
                    ),
                ],
            });
        }
    }
);

const banButton = new Button(
    'ban-spammer',
    async (interaction, data: { userId: string; reason: string }) => {
        const user = await interaction.client.users.fetch(data.userId);
        if (
            !(interaction.member as GuildMember)?.permissions.has(
                PermissionsBitField.Flags.BanMembers
            )
        ) {
            return await interaction.reply({
                content: 'You do not have permission to ban this user',
                ephemeral: true,
            });
        }

        const modal = banModal.modal(
            {
                title: `Ban ${user.username}`,
                components: [
                    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                        new TextInputBuilder()
                            .setCustomId('banReason')
                            .setLabel('Ban reason')
                            .setStyle(TextInputStyle.Paragraph)
                            .setValue(`(autodetected)\n${data.reason}`)
                    ),
                ],
            },
            { reason: data.reason, userId: data.userId }
        );

        await interaction.showModal(modal);
    }
);

const getMessageSuspicions = async (message: Message) => {
    let level = 0;
    const reasons = new Set<string>();
    const links = message.content.matchAll(
        /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?)|(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?/g
    );
    if (message.content.toLowerCase().includes('nitro')) level += 5;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of links) level += 5;

    const invites = message.content.matchAll(
        /\s*(?:https:\/\/)?(?:discord\.gg\/|discord\.com\/invite\/)[a-zA-Z0-9]+\s*/g
    );
    for (const inviteLink of invites) {
        try {
            const invite = await message.client.fetchInvite(inviteLink[0]);
            level += 10;
            reasons.add('discord invites');
            if (invite.guild?.name.includes('18')) level += 20;
            if (
                invite.guild?.nsfwLevel == GuildNSFWLevel.Explicit ||
                invite.guild?.nsfwLevel == GuildNSFWLevel.AgeRestricted
            ) {
                level += 20;
                reasons.add('18+ discord invites');
            }
            const phishGGData = await (
                await fetch(
                    `https://api.phish.gg/server?id=${invite.guild?.id}`
                )
            ).json();
            if (phishGGData.match) {
                level += 100;
                reasons.add(phishGGData.reason);
            }
        } catch {
            /* empty */
        }
    }
    return { level, reasons };
};

export const spamHandler: Handler = (client) => {
    client.on('messageCreate', async (message: Message) => {
        const suspicion = await getMessageSuspicions(message);
        if (suspicion.level > 10) {
            if (!message.inGuild()) return;

            const otherSuspicions = (
                await Promise.all(
                    (
                        await Promise.all(
                            message.guild.channels.cache
                                .filter((channel) => channel.isTextBased())
                                .map(async (channel) => {
                                    return (
                                        await (
                                            channel as TextBasedChannel
                                        ).messages.fetch({ limit: 10 })
                                    ).filter(
                                        (msg) =>
                                            msg.author.id == message.author.id
                                    );
                                })
                        )
                    )
                        .reduce((a, b) => a.concat(b))
                        .map(getMessageSuspicions)
                )
            ).reduce((a, b) => ({
                level: a.level + b.level,
                reasons: new Set([...a.reasons, ...b.reasons]),
            }));

            suspicion.level += otherSuspicions.level;
            suspicion.reasons = new Set([
                ...suspicion.reasons,
                ...otherSuspicions.reasons,
            ]);

            const logChannel = await message.guild?.channels.fetch(
                process.env.MESSAGE_LOGS_CHANNEL
            );
            if (logChannel?.isTextBased())
                logChannel.send({
                    embeds: [
                        new EmbedBuilder({
                            description: `suspicion level ${
                                suspicion.level
                            } for ${message.author}, from message ${
                                message.url
                            }\nreasons:\n${[...suspicion.reasons.values()].join(
                                '\n'
                            )}`,
                        }),
                    ],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                            banButton.button(
                                { label: 'Ban', style: ButtonStyle.Danger },
                                {
                                    userId: message.author.id,
                                    reason: 'spam', //TODO: fix the reasons once button accepts longer params
                                    // [
                                    //     ...suspicion.reasons.values(),
                                    // ].join(),
                                }
                            )
                        ),
                    ],
                });
        }
    });
};
