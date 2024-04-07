import { LogProvider } from '../handlers/log.handler';

const reg = /https:\/\/paste.gg\/p\/\w*\/\w*/;

export const pasteGG: LogProvider = {
    hostnames: ['paste.gg'],
    async parse(text) {
        const r = text.match(reg);
        if (r == null || !r[0]) return null;
        const link = r[0];
        const id = link.replace(/https:\/\/paste.gg\/p\/\*\//, '');
        if (!id) return null;
        const pasteJson = await (
            await fetch('https://api.paste.gg/v1/pastes/' + id)
        ).json();
        if (pasteJson.status != 'success') return;
        const pasteData = await (
            await fetch(
                'https://api.paste.gg/v1/pastes/' +
                    id +
                    '/files/' +
                    pasteJson.result.files[0].id
            )
        ).json();
        if (pasteData.status != 'success') return;
        return pasteData.result.content.value;
    },
};
