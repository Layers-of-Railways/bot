import express from 'express';
import { handleWebhook } from './webserver/github';
import { client } from './index';
import { handleRequest } from './webserver/minecraft';

const app = express();

app.use(express.json());

app.get('/', function (req, res) {
    res.status(200).send('Request received successfully');
});

app.post('/github-webhook', function (req, res) {
    handleWebhook(client, req, res);
});

app.post('/minecraft-webhook', function (req, res) {
    handleRequest(client, req, res);
});

const port = process.env.WEBSERVER_PORT || 3000;
app.listen(port);
console.log(`Webserver is running on port: ${port}`);
