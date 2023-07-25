import { LogProvider } from '../handlers/log.handler'
import { mcLoGs } from './mclogs';
import { r0x0 } from './0x0';
import { pasteGG } from './pastegg';
import { hastebin } from './haste';
import { pastebin } from './pastebin';

export const logProviders: LogProvider[] = [
    mcLoGs,
    r0x0,
    pasteGG,
    hastebin,
    pastebin
]

export default logProviders