import { LogProvider } from '../handlers/log.handler';

const reg = /https:\/\/0x0.st\/\w*.\w*/;

export const r0x0: LogProvider = {
    hostnames: ['0x0.st'],
    async parse(text) {
        const r = text.match(reg);
        if (r == null || !r[0]) return;
        const link = r[0];
        let log: string;
        try {
            const f = await fetch(link);
            if (f.status != 200) {
                throw 'nope';
            }
            log = await f.text();
        } catch (err) {
            console.log('Log analyze fail', err);
            return;
        }
        return log;
    },
};
