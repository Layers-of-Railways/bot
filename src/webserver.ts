import express from 'express';
import { handleGithubWebhook } from './webserver/github';
import { client } from './index';
import { handleBanShare } from './webserver/banshare';

const app = express();

app.use(express.json());

app.get('/', function (req, res) {
    res.status(200).send('Request received successfully');
});

app.post('/github-webhook', function (req, res) {
    handleGithubWebhook(client, req, res);
});

app.post('/banshare', function (req, res) {
    handleBanShare(client, req, res);
});

const port = process.env.WEBSERVER_PORT || 3000;
app.listen(port);
console.log(`Webserver is running on port: ${port}`);
