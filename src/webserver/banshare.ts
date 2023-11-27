import { Request, Response } from 'express';
import { Client, Colors, EmbedBuilder } from 'discord.js';

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
    const channel = client.channels.cache.get(process.env.LOGS_CHANNEL);
    const server = req.body.server;
    const userid = req.body.userid;
    const reason = req.body.reason;

    const user = await client.users.fetch(userid);

    const guild = client.guilds.cache.get(process.env.SERVER_ID);
    const guildMember = await guild?.members.fetch(userid);
    const present = guildMember !== undefined;

    const embed = new EmbedBuilder()
        .setTitle(`Incoming ban from ${server}`)
        .addFields(
            { name: 'Username', value: user.username },
            { name: 'User ID', value: user.id },
            { name: 'Present in server', value: `${present}` },
            { name: 'Reason', value: reason },
            { name: 'Banned From', value: server }
        )
        .setColor(Colors.Red)
        .setTimestamp();
};

const verify_signature = (req: Request) => {
    return process.env.SIMULATED_BAN_SHARE_KEY === req.headers['x-api-key'];
};
