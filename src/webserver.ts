import express from 'express';
import { client } from './index';
import { handleBanShare } from './webserver/banshare';
import { handleUnbanShare } from './webserver/unbanshare';

const app = express();

app.use(express.json());

app.get('/', function (_, res) {
    res.status(200).send('Request received successfully');
});

app.post('/banshare', function (req, res) {
    handleBanShare(client, req, res);
});

app.post('/unbanshare', function (req, res) {
    handleUnbanShare(client, req, res);
});

const port = process.env.WEBSERVER_PORT || 3000;
app.listen(port);
console.log(`Webserver is running on port: ${port}`);
