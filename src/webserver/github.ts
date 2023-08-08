import * as crypto from 'crypto';
import { Request, Response } from 'express';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client,
    EmbedBuilder,
} from 'discord.js';
import { Commit } from '../types/github';

const WEBHOOK_SECRET: string = process.env.GITHUB_SECRET;

const commitMap = new Map<string, Commit>();
const githubMap = new Map<number, string>();

export const handleWebhook = (client: Client, req: Request, res: Response) => {
    if (!verify_signature(req)) {
        res.status(401).send('Unauthorized');
        return;
    }

    if (req.body.ref) {
        // This is run on the push webhook event
        actionPush(req);
    }

    if (req.body.action === 'in_progress') {
        // this is run on the workflow_run webhook event
        // when the workflow is started
        if (isBuildRun(req)) {
            actionStart(client, req);
        }
    }

    if (req.body.action === 'completed') {
        // this is run on the workflow_run webhook event
        // when the workflow is completed
        if (isBuildRun(req)) {
            actionCompleted(client, req);
        }
    }

    res.status(200).send('Webhook received successfully');
};

const actionPush = async (req: Request) => {
    const commits = {
        commits: req.body.commits,
    };
    commitMap.set(req.body.after, commits);
};

const actionStart = async (client: Client, req: Request) => {
    const workflow_run = req.body.workflow_run;
    const repository = req.body.repository;
    const organization = req.body.organization;
    const sender = req.body.sender;
    const unix_started_at = Math.floor(
        Date.parse(workflow_run.run_started_at) / 1000
    );
    const version = await getVersion(workflow_run.url, workflow_run.run_number);

    const commitString = generateCommitsString(workflow_run.head_sha);

    const embed = new EmbedBuilder()
        .setAuthor({
            name: `${repository.name}/${workflow_run.head_branch}`,
            iconURL: organization.avatar_url,
            url: workflow_run.html_url,
        })
        .setDescription(
            `## Build <t:${unix_started_at}:R>
            Status: Build is running for **#${workflow_run.run_number}** ${process.env.LOADING_EMOJI}
            Version: **${version}**
            ${commitString}
            `
        )
        .setFooter({
            text: sender.login,
            iconURL: sender.avatar_url,
        })
        .setColor('Blue');

    const channel = await client.channels.fetch(
        process.env.GITHUB_STATUS_CHANNEL
    );
    if (!channel?.isTextBased()) return;
    channel.send({ embeds: [embed] }).then((message) => {
        githubMap.set(workflow_run.id, message.id);
    });
};

const actionCompleted = async (client: Client, req: Request) => {
    const workflow_run = req.body.workflow_run;
    const repository = req.body.repository;
    const organization = req.body.organization;
    const sender = req.body.sender;
    const unix_started_at = Math.floor(
        Date.parse(workflow_run.run_started_at) / 1000
    );
    const version = await getVersion(workflow_run.url, workflow_run.run_number);

    const status =
        workflow_run.conclusion === 'success'
            ? `${process.env.SUCCESS_EMOJI} Success`
            : `${process.env.FAIL_EMOJI} Failed`;
    const statusColor = workflow_run.conclusion === 'success' ? 'Green' : 'Red';

    const runTimeInSeconds =
        (Date.parse(workflow_run.updated_at) -
            Date.parse(workflow_run.created_at)) /
        1000;
    const timeTaken = getTimeTaken(runTimeInSeconds);

    const commitString = generateCommitsString(workflow_run.head_sha);

    const channel = await client.channels.fetch(
        process.env.GITHUB_STATUS_CHANNEL
    );
    if (!channel?.isTextBased()) return;
    if (!githubMap.has(workflow_run.id)) return;
    const oldMessage = await channel.messages.fetch(
        githubMap.get(workflow_run.id)!
    );

    const embed = new EmbedBuilder()
        .setAuthor({
            name: `${repository.name}/${workflow_run.head_branch}`,
            iconURL: organization.avatar_url,
            url: workflow_run.html_url,
        })
        .setDescription(
            `## Build <t:${unix_started_at}:R>
            Status: **${status} #${workflow_run.run_number}** in ${timeTaken}
            Version: **${version}**
            ${commitString}
            `
        )
        .setFooter({
            text: sender.login,
            iconURL: sender.avatar_url,
        })
        .setColor(statusColor);

    if (workflow_run.conclusion == 'success') {
        const mod_version = await getRawVersion(workflow_run.url, 'mod');
        const minecraft_version = await getRawVersion(
            workflow_run.url,
            'minecraft'
        );

        const fabricJar = generateMavenUrl(
            mod_version,
            minecraft_version,
            workflow_run.run_number,
            'fabric'
        );
        const forgeJar = generateMavenUrl(
            mod_version,
            minecraft_version,
            workflow_run.run_number,
            'forge'
        );

        const fabricButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel('Fabric')
            .setURL(fabricJar);
        const forgeButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel('Forge')
            .setURL(forgeJar);

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            fabricButton,
            forgeButton
        );

        oldMessage.edit({ embeds: [embed], components: [actionRow] });
        githubMap.delete(workflow_run.id);
    } else {
        oldMessage.edit({ embeds: [embed] });
        githubMap.delete(workflow_run.id);
    }
};

const generateMavenUrl = (
    mod_version: string,
    minecraft_version: string,
    run_number: string,
    loaderType: string
) => {
    const baseRepo = process.env.MAVEN_REPO;
    const modVersion = `${mod_version}+${loaderType}-mc${minecraft_version}-build.${run_number}`;
    return `${baseRepo}/Steam_Rails-${loaderType}-${minecraft_version}/${modVersion}/Steam_Rails-${loaderType}-${minecraft_version}-${modVersion}.jar`;
};

const generateCommitsString = (head_sha: string) => {
    if (!commitMap.get(head_sha)) {
        return 'No commits found';
    }
    const commitsArray = commitMap.get(head_sha);
    if (!commitsArray) return;
    const commitString = commitsArray.commits
        .map((commit) => {
            const committer = commit.committer;
            const userProfile = `https://github.com/${committer.username}`;
            const messageWithoutHashtag = commit.message.replace(/#/g, ''); // Remove all '#' symbols
            return `[➤](${commit.url}) ${messageWithoutHashtag} - [${committer.username}](${userProfile})`;
        })
        .join('\n');

    if (commitString.length > 3072) {
        const url = `https://github.com/Layers-of-Railways/Railway/commits/${head_sha}`;
        return `Commits are too long to display please check [here](${url})`;
    }

    return commitString;
};

const getTimeTaken = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    const minutesString =
        minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : '';
    const secondsString =
        seconds > 0 ? `${seconds} second${seconds !== 1 ? 's' : ''}` : '';

    const timeTaken = `${minutesString}${
        minutesString && secondsString ? ' and ' : ''
    }${secondsString}`;

    return timeTaken;
};

const getVersion = async (apiurl: URL, run_number: string) => {
    const runDataRequest = await fetch(apiurl);
    const runData = await runDataRequest.json();

    const request = await fetch(
        `https://raw.githubusercontent.com/${runData.repository.full_name}/${runData.head_commit.id}/gradle.properties`
    );
    const data = await request.text();

    const lines = data.split('\n');
    const modVersionLine = lines.find((line) => line.startsWith('mod_version'));
    const minecraftVersionLine = lines.find((line) =>
        line.startsWith('minecraft_version')
    );
    if (modVersionLine && minecraftVersionLine) {
        const modVersion = modVersionLine.split('=')[1].trim();
        const minecraftVersion = minecraftVersionLine.split('=')[1].trim();
        return `${modVersion}-mc${minecraftVersion}-build.${run_number}`;
    } else {
        return "Couldn't find version";
    }
};

const getRawVersion = async (apiurl: URL, type: string) => {
    const runDataRequest = await fetch(apiurl);
    const runData = await runDataRequest.json();

    const request = await fetch(
        `https://raw.githubusercontent.com/${runData.repository.full_name}/${runData.head_commit.id}/gradle.properties`
    );
    const data = await request.text();

    const lines = data.split('\n');
    const modVersionLine = lines.find((line) => line.startsWith('mod_version'));
    const minecraftVersionLine = lines.find((line) =>
        line.startsWith('minecraft_version')
    );
    if (modVersionLine && minecraftVersionLine) {
        const modVersion = modVersionLine.split('=')[1].trim();
        const minecraftVersion = minecraftVersionLine.split('=')[1].trim();
        if (type == 'mod') {
            return modVersion;
        } else if (type == 'minecraft') {
            return minecraftVersion;
        }
        return "Couldn't find version";
    } else {
        return "Couldn't find version";
    }
};

const verify_signature = (req: Request) => {
    const signature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');
    return `sha256=${signature}` === req.headers['x-hub-signature-256'];
};

const isBuildRun = (req: Request) => {
    if (req.body.workflow_run.path == '.github/workflows/build.yml') {
        return true;
    } else {
        return false;
    }
};
