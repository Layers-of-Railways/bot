import { Request, Response } from 'express';
import {
    ButtonStyle,
    Client,
    Colors,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ModalBuilder,
    ModalActionRowComponentBuilder,
    TextInputBuilder,
    PermissionsBitField,
    TextInputStyle,
    GuildMember,
} from 'discord.js';
import { Button } from '../handlers/button.handler';

const banButton = new Button(
    'ban',
    async (interaction, data: { userId: string }) => {
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
        const reason =
            'Simulated Ban share: ' +
            (interaction.message.embeds[0].fields[4].value ??
                'no reason provided');
        const modal = new ModalBuilder()
            .setCustomId(`ban`)
            .setTitle(`Ban <@${data.userId}>`)
            .addComponents(
                new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('banReason')
                        .setLabel('Ban reason')
                        .setStyle(TextInputStyle.Short)
                        .setValue(reason)
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
                                    .setTitle('User Banned via Banshare')
                                    .setDescription(
                                        `<@!${data.userId}> was banned!`
                                    )
                                    .setFields([
                                        {
                                            name: 'Reason',
                                            value: modalResponse.components[0]
                                                .components[0].value,
                                        },
                                        {
                                            name: 'By',
                                            value: interaction.user.username,
                                        },
                                    ]),
                            ],
                        });
                    }
                }
            });
    }
);

export const handleBanShare = (client: Client, req: Request, res: Response) => {
    if (!verify_signature(req)) {
        res.status(401).send('Unauthorized');
        return;
    }

    if (
        req.body === undefined ||
        req.body.server === undefined ||
        req.body.userid === undefined ||
        req.body.reason === undefined
    ) {
        return res.status(400).send('Invalid request body');
    }

    handleBan(client, req);

    res.status(200).send('Webhook received successfully');
};

const handleBan = async (client: Client, req: Request) => {
    const channel = client.channels.cache.get(
        process.env.SIMULATED_BAN_SHARE_LOGS_CHANNEL
    );
    const server = req.body.server;
    const userId = req.body.userid;
    const reason = req.body.reason;

    const user = await client.users.fetch(userId);

    const guild = client.guilds.cache.get(process.env.SERVER_ID);
    const guildMember = await guild?.members.fetch(userId);
    const present = guildMember !== undefined;

    const embed = new EmbedBuilder()
        .setTitle(`Incoming ban from ${server}`)
        .addFields(
            { name: 'User', value: `<@!${user.id}>` },
            { name: 'Username', value: user.username },
            { name: 'User ID', value: user.id },
            { name: 'Present in server', value: `${present}` },
            { name: 'Reason', value: reason },
            { name: 'Banned From', value: server }
        )
        .setColor(Colors.Red)
        .setTimestamp();
    channel?.isTextBased() &&
        (await channel.send({
            embeds: [embed],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    banButton.button(
                        {
                            label: 'Ban',
                            style: ButtonStyle.Danger,
                            disabled: guildMember ? !guildMember.bannable : false
                        },
                        { userId }
                    )
                ),
            ],
        }));
};

const verify_signature = (req: Request) => {
    return process.env.SIMULATED_BAN_SHARE_KEY === req.headers['x-api-key'];
};
