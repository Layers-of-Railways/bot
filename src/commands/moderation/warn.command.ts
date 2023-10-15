import {
    Colors,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from 'discord.js';
import { Command } from '../../handlers/command.handler';
import '../../utils/prisma';
import prisma from '../../utils/prisma';

export const warnCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('User to warn')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('reason')
                .setDescription('Reason for warning')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    async execute(interaction) {
        if (!interaction.guild) return;

        const user = interaction.options.getUser('user', true);
        const member = await interaction.guild.members.fetch(user.id);

        const reason = interaction.options.get('reason', true);

        if (!member) {
            await interaction.reply({
                content: 'User not found.',
                ephemeral: true,
            });
            return;
        }

        if (member.id === interaction.user.id) {
            return await interaction.reply({
                content: 'You cannot warn yourself.',
                ephemeral: true,
            });
        }

        try {
            const userRecord = await prisma.user.findUnique({
                where: { id: member.id },
            });

            if (!userRecord) {
                await prisma.user.create({
                    data: { id: member.id },
                });
            }

            await prisma.warning.create({
                data: {
                    reason: reason.value as string,
                    issuerId: interaction.user.id,
                    User: {
                        connect: { id: member.id },
                    },
                },
            });

            const warnedEmbed = new EmbedBuilder()
                .setTitle('You have been warned!')
                .setDescription(
                    `You have been warned in ${interaction.guild.name}.`
                )
                .addFields({ name: 'Reason', value: reason.value as string })
                .setColor(Colors.Red)
                .setTimestamp();

            await member.send({ embeds: [warnedEmbed] });

            const warnEmbed = new EmbedBuilder()
                .setTitle('User Warned')
                .setDescription(`Warned ${member.user.username}`)
                .addFields({ name: 'Reason', value: reason.value as string })
                .setColor(Colors.Red)
                .setTimestamp();

            await interaction.reply({
                embeds: [warnEmbed],
            });
        } catch (error) {
            console.error('Error creating warning:', error);
            await interaction.reply({
                content: 'An error occurred while creating the warning.',
                ephemeral: true,
            });
        }
    },
};
