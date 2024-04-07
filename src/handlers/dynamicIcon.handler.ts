import { Handler } from '..';
import { createCanvas, loadImage } from 'canvas';

export const dynamicIconHandler: Handler = (client) => {
    client.on('messageCreate', (message) => {
        if (message.content == 'icons') {
        }
    });
};

function generateIcon(coverage: number) {
    const canvas = createCanvas(256, 256);
}
