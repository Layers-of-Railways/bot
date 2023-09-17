import { Request, Response } from 'express';
import { Client } from 'discord.js';

export const handleRequest = (client: Client, req: Request, res: Response) => {
    res.status(200).send('Webhook received successfully');
};
