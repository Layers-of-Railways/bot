import { Handler } from '..';
import { PNGStream, createCanvas, loadImage } from 'canvas';

async function stream2buffer(stream: PNGStream): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _buf = Array<any>();

        stream.on('data', (chunk) => _buf.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(_buf)));
        stream.on('error', (err) => reject(`error converting stream - ${err}`));
    });
}

export const dynamicIconHandler: Handler = (client) => {
    const startTime = 1712518661_000;
    const endTime = 1712595600_000;
    const totalTime = endTime - startTime;
    let timeout: NodeJS.Timeout | undefined = undefined;
    if (Date.now() > endTime) return;
    client.on('messageCreate', async (message) => {
        if (message.content != 'start numismatics icon thingy please') return;
        if (!message.member?.permissions.has('Administrator')) {
            await message.reply('nuh uh');
            return;
        }
        if (timeout) {
            await message.reply('it already started silly');
            return;
        }
        await message.reply('ok!!');
        const updateIcon = async () => {
            const currentTime = Date.now() - startTime;
            const currentProgress = currentTime / totalTime;
            console.log(
                `Current Progress at ${new Date().toLocaleString()} is ${currentProgress}`
            );
            message.guild?.setIcon(
                await stream2buffer(await generateIcon(currentProgress / 2))
            );
            if (Date.now() > endTime) {
                clearInterval(timeout);
            }
        };
        await updateIcon();
        timeout = setInterval(updateIcon, 3600_000);
    });
};

async function generateIcon(progress: number) {
    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
        await loadImage(__dirname + '/../assets/railways_icon.png'),
        0,
        0
    );
    const x = progress * canvas.width * 2 - canvas.width;
    const y = -(Math.sin(progress * Math.PI) * 256 - 256);
    ctx.drawImage(
        await loadImage(__dirname + '/../assets/numismatics_icon.png'),
        x,
        y
    );
    return canvas.createPNGStream({});
}
