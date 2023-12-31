import {
    Colors,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from 'discord.js';
import { Command } from '../../handlers/command.handler';
import '../../utils/prisma';
import prisma from '../../utils/prisma';

export const deleteWarningCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('delete-warning')
        .setDescription('Delete a warning')
        .addStringOption((option) =>
            option
                .setName('warning-id')
                .setDescription('delete a warning by id')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    async execute(interaction) {
        const warning = interaction.options.get('warning-id', true);
        const warningId = warning.value as string;

        try {
            const warning = await prisma.warning.findUnique({
                where: { id: warningId },
            });

            const reason = warning?.reason;

            if (warning) {
                await prisma.warning.delete({
                    where: { id: warningId },
                });

                const user = await prisma.user.findUnique({
                    where: { id: warning.userId },
                });

                if (user) {
                    const member = await interaction.client.users.fetch(
                        user.id
                    );

                    const embed = new EmbedBuilder()
                        .setTitle(`Warning removed`)
                        .setDescription(
                            `Your warning with reason: ${reason} was removed`
                        )
                        .setColor(Colors.Green)
                        .setTimestamp();

                    member.send({
                        embeds: [embed],
                    });

                    const delEmbed = new EmbedBuilder()
                        .setTitle(
                            `Deleted warning with id ${warningId} for ${member.username}`
                        )
                        .setColor(Colors.Red);

                    await interaction.reply({
                        embeds: [delEmbed],
                    });
                }
            } else {
                await interaction.reply({
                    content: `Warning with id ${warningId} not found`,
                    ephemeral: true,
                });
            }
        } catch (error) {
            await interaction.reply({
                content: `Error deleting warning with id ${warningId}`,
                ephemeral: true,
            });
        }
    },
};
