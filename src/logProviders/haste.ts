import { LogProvider } from '../handlers/log.handler';

const reg = /https:\/\/hst.sh\/[\w]*/;

export const hastebin: LogProvider = {
    hostnames: ['hst.sh'],
    async parse(text) {
        const r = text.match(reg);
        if (r == null || !r[0]) return;
        const link = r[0];
        const id = link.replace('https://hst.sh/', '');
        if (!id) return;
        let log: string;
        try {
            const f = await fetch(`https://hst.sh/raw/${id}`);
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
