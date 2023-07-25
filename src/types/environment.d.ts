export { };

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DISCORD_TOKEN: string;
            SAY_LOGS_CHANNEL: string;
            LOGS_CHANNEL: string;
        }
    }
}
