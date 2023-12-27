export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DISCORD_TOKEN: string;
            SERVER_ID: string;
            SAY_LOGS_CHANNEL: string;
            LOGS_CHANNEL: string;
            MAVEN_REPO: string;
            GITHUB_STATUS_CHANNEL: string;
            GITHUB_SECRET: string;
            LOADING_EMOJI: string;
            SUCCESS_EMOJI: string;
            FAIL_EMOJI: string;
            WEBSERVER_PORT: string;
            DATABASE_URL: string;
            SIMULATED_BAN_SHARE_KEY: string;
            SIMULATED_BAN_SHARE_LOGS_CHANNEL: string;
            NODE_ENV: 'development' | 'dev-prod' | 'production';
        }
    }
}
