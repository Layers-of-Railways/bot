import { LogProvider } from '../handlers/log.handler';

const reg = /https:\/\/mclo.gs\/\w*/;

export const mcLoGs: LogProvider = {
    hostnames: ['mclo.gs'],
    async parse(text) {
        const r = text.match(reg);
        if (r == null || !r[0]) return;
        const link = r[0];
        const id = link.replace('https://mclo.gs/', '');
        if (!id) return;
        const apiUrl = 'https://api.mclo.gs/1/raw/' + id;
        let log: string;
        try {
            const res = await fetch(apiUrl);
            if (res.status != 200) {
                throw 'nope';
            }
            log = await res.text();
        } catch (err) {
            console.log('Log analyze fail', err);
            return;
        }
        return log;
    },
};
