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
        const f = await fetch(`https://hst.sh/raw/${id}`);
        if (f.status != 200) return;
        return await f.text();
    },
};
