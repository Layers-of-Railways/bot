import { Command } from '../../handlers/command.handler';
import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import prisma from '../../utils/prisma';

export const migrateWarningsCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('migrate-warnings')
        .setDescription("Migrate warnings to zeppelin")
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    async execute(interaction) {
        if (!interaction.guild) return;

        const warnings = await prisma.warning.findMany()

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        for (const warning: {id: string, reason: string, timestamp: Date, issuerId: string, userId: string} in warnings) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const date = Math.floor(new Date(warning.timestamp).getTime() / 1000);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const issuer = await interaction.guild.members.fetch(warning.issuerId).
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            interaction.guild.channels.fetch("1133014478628343818").send(`!note ${warning.userId} ${warning.reason} | Migrated warning, Originally created at <t:${date}>, By ${issuer.username}`)
        }
    },
};
