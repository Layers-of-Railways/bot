import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    GuildMember,
    GuildNSFWLevel,
    Message,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    PermissionsBitField,
    TextBasedChannel,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { Handler } from '..';
import { Button } from './button.handler';

const banButton = new Button(
    'ban-spammer',
    async (interaction, data: { userId: string }) => {
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

        const modal = new ModalBuilder()
            .setCustomId(`ban`)
            .setTitle(`Ban ${user.username}`)

            .addComponents(
                new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('banReason')
                        .setLabel('Ban reason')
                        .setStyle(TextInputStyle.Paragraph)
                        .setValue('spam (autodetected)')
                )
            );
        await interaction.showModal(modal);
        interaction
            .awaitModalSubmit({
                filter: (interaction) =>
                    interaction.customId == modal.data.custom_id,
                time: 300_000,
            })
            .then(async (modalResponse) => {
                interaction.guild?.bans.create(data.userId, {
                    reason: modalResponse.components[0].components[0].value,
                });
                await modalResponse.reply({
                    content: `<@${data.userId}> (\`${data.userId}\`) was banned.`,
                    ephemeral: true,
                });
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
                if (interaction.guild != null) {
                    const channel = await interaction.guild.channels.fetch(
                        process.env.BAN_LOGS_CHANNEL
                    );
                    if (channel?.isTextBased()) {
                        channel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle('User Banned for spam')
                                    .setDescription(
                                        `<@!${data.userId}> was banned!`
                                    )
                                    .setFields([
                                        {
                                            name: 'Reason',
                                            value: modalResponse.components[0]
                                                .components[0].value,
                                        },
                                    ])
                                    .setAuthor({
                                        iconURL:
                                            interaction.user.avatar ??
                                            undefined,
                                        name: interaction.user.username,
                                    }),
                            ],
                        });
                    }
                }
            });
    }
);

const getMessageSuspicion = async (message: Message) => {
    let suspicionLevel = 0;
    const links = message.content.matchAll(
        /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?)|(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?/g
    );
    if (message.content.toLowerCase().includes('nitro')) suspicionLevel += 5;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of links) suspicionLevel += 5;

    const invites = message.content.matchAll(
        /\s*(?:https:\/\/)?(?:discord\.gg\/|discord\.com\/invite\/)[a-zA-Z0-9]+\s*/g
    );
    for (const inviteLink of invites) {
        const invite = await message.client.fetchInvite(inviteLink[0]);
        suspicionLevel += 10;
        if (invite.guild?.name.includes('18')) suspicionLevel += 20;
        if (
            invite.guild?.nsfwLevel == GuildNSFWLevel.Explicit ||
            invite.guild?.nsfwLevel == GuildNSFWLevel.AgeRestricted
        )
            suspicionLevel += 20;
    }
    return suspicionLevel;
};

export const spamHandler: Handler = (client) => {
    client.on('messageCreate', async (message: Message) => {
        let suspicionLevel = await getMessageSuspicion(message);
        if (suspicionLevel > 10) {
            if (!message.inGuild()) return;

            suspicionLevel += (
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
                        .map(getMessageSuspicion)
                )
            ).reduce((a, b) => a + b);

            const logChannel = await message.guild?.channels.fetch(
                process.env.LOGS_CHANNEL
            );
            if (logChannel?.isTextBased())
                logChannel.send({
                    embeds: [
                        new EmbedBuilder({
                            description: `suspicion level ${suspicionLevel} for ${message.author}, from message ${message.url}`,
                        }),
                    ],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                            banButton.button(
                                { label: 'Ban', style: ButtonStyle.Danger },
                                { userId: message.author.id }
                            )
                        ),
                    ],
                });
        }
    });
};
