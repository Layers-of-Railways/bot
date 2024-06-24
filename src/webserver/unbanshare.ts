import { Request, Response } from 'express';
import {
    ButtonStyle,
    Client,
    Colors,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ModalActionRowComponentBuilder,
    TextInputBuilder,
    PermissionsBitField,
    TextInputStyle,
    GuildMember,
} from 'discord.js';
import { Button } from '../handlers/button.handler';
import { Modal } from '../handlers/modal.handler';

const unbanModal = new Modal(
    'unban-banshare',
    async (interaction, data: { userId: string }) => {
        try {
            await interaction.guild?.bans.remove(
                data.userId,
                interaction.components[0].components[0].value
            );
            await interaction.reply({
                content: `<@${data.userId}> (\`${data.userId}\`) was unbanned.`,
                ephemeral: true,
            });
            if (interaction.message) {
                await interaction.message.edit({
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setCustomId('fakeUnbanButton')
                                .setLabel('Unban')
                                .setStyle(ButtonStyle.Danger)
                                .setDisabled(true)
                        ),
                    ],
                });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `Couldn't unban <@${data.userId}>`,
                ephemeral: true,
            });
        }
    }
);

const unbanButton = new Button(
    'unban-banshare',
    async (interaction, data: { userId: string }) => {
        const user = await interaction.client.users.fetch(data.userId);
        if (
            !(interaction.member as GuildMember)?.permissions.has(
                PermissionsBitField.Flags.BanMembers
            )
        ) {
            return await interaction.reply({
                content: 'You do not have permission to unban this user',
                ephemeral: true,
            });
        }

        const reason = `${
            interaction.message.embeds[0].fields[4].value ?? 'Simulated'
        } Unban share: ${
            interaction.message.embeds[0].fields[3].value ??
            'no reason provided'
        }`;

        const modal = unbanModal.modal(
            {
                title: `Ban ${user.username}`,
                components: [
                    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                        new TextInputBuilder()
                            .setCustomId('unbanReason')
                            .setLabel('Unban reason')
                            .setStyle(TextInputStyle.Paragraph)
                            .setValue(reason)
                    ),
                ],
            },
            { userId: data.userId }
        );

        await interaction.showModal(modal);
    }
);

export const handleUnbanShare = (
    client: Client,
    req: Request,
    res: Response
) => {
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

    handleUnban(client, req);

    res.status(200).send('Webhook received successfully');
};

const handleUnban = async (client: Client, req: Request) => {
    const channel = client.channels.cache.get(
        process.env.SIMULATED_BAN_SHARE_LOGS_CHANNEL
    );
    const server = req.body.server;
    const userId = req.body.userid;
    const reason = req.body.reason;

    const user = await client.users.fetch(userId);

    const guild = client.guilds.cache.get(process.env.SERVER_ID);
    const guildMember = await guild?.members.fetch(userId);

    const embed = new EmbedBuilder()
        .setTitle(`Incoming unban from ${server}`)
        .addFields(
            { name: 'User', value: `<@!${user.id}>` },
            { name: 'Username', value: user.username },
            { name: 'User ID', value: user.id },
            { name: 'Reason', value: reason },
            { name: 'Unbanned From', value: server }
        )
        .setColor(Colors.Blurple)
        .setTimestamp();
    channel?.isTextBased() &&
        (await channel.send({
            embeds: [embed],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    unbanButton.button(
                        {
                            label: 'Unban',
                            style: ButtonStyle.Primary,
                            disabled: guildMember ? true : false,
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
