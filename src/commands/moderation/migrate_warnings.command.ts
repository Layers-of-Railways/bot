import { Command } from '../../handlers/command.handler';
import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import prisma from '../../utils/prisma';

export const migrateWarningsCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('migrate-warnings')
        .setDescription('Migrate warnings to zeppelin')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    async execute(interaction) {
        if (!interaction.guild) return;

        await interaction.deferReply();

        const warnings = await prisma.warning.findMany();

        for (const warning of warnings) {
            const date = Math.floor(
                new Date(warning.timestamp).getTime() / 1000
            );
            const dateString: string = `<t:${date}>`;

            if (interaction.guild !== null && interaction.channel !== null) {
                let issuerString: string = 'Unknown Moderator';
                try {
                    const issuer = await interaction.guild.members.fetch(
                        warning.issuerId
                    );
                    issuerString = issuer.user.username;
                } catch {
                    issuerString = warning.issuerId;
                }

                await interaction.channel.send(
                    `!note ${warning.userId} ${warning.reason} | Migrated warning, Originally created at ${dateString}, By ${issuerString}`
                );
            }
        }

        await interaction.editReply('Finished going through all warnings!');
    },
};
