import {
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { getTags, getTagsSync } from '../handlers/tag.handler';
import { Command } from '../handlers/command.handler';

const tags = getTagsSync()

export const tagCommand: Command = {
  // @ts-expect-error idk why it gives an error
  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Send a tag')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('The tag name')
        .setRequired(true)
        .addChoices(...tags.map((b) => ({ name: b.name, value: b.name })))
    )
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to mention')
        .setRequired(false)
    ),
  async execute(i) {
    const tags = await getTags();
    const tagName = i.options.get('name', true).value as string;
    const mention = i.options.getUser('user', false);

    const tag = tags.find(
      (tag) => tag.name === tagName || tag.aliases?.includes(tagName)
    );

    if (!tag) {
      await i.reply({
        content: `Tag \`${tagName}\` does not exist.`,
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder();
    embed.setTitle(tag.title ?? tag.name);
    embed.setDescription(tag.content);
    if (tag.color) embed.setColor(tag.color);
    if (tag.image) embed.setImage(tag.image);
    if (tag.fields) embed.setFields(tag.fields);

    await i.reply({
      content: mention ? `<@${mention.id}> ` : undefined,
      embeds: [embed],
    });
  },
}
