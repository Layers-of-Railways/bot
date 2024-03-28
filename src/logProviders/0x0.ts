import { LogProvider } from '../handlers/log.handler';

const reg = /https:\/\/0x0.st\/\w*.\w*/;

export const r0x0: LogProvider = {
    hostnames: ['0x0.st'],
    async parse(text) {
        const r = text.match(reg);
        if (r == null || !r[0]) return;
        const link = r[0];
        const f = await fetch(link);
        if (f.status != 200) return;
        return await f.text();
    },
};
