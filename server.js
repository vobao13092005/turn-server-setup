// server.js
const express = require("express");
const ws = require("ws");
const https = require("https");
const fs = require("fs");

const bindingAddress = '192.168.1.34';
const bindingPort = 443;

const app = express();
app.use(express.static('public'));

const server = https.createServer({
    key: fs.readFileSync("certs/key.pem"),
    cert: fs.readFileSync("certs/cert.pem"),
}, app);

const wss = new ws.WebSocketServer({ server });

const rooms = new Map();

wss.on('connection', (ws) => {
    ws.roomId = null;

    ws.on('message', (msgRaw) => {
        let msg;
        try { msg = JSON.parse(msgRaw); } catch (e) { return; }

        if (msg.type === 'join') {
            const room = String(msg.room || 'default');
            ws.roomId = room;
            if (!rooms.has(room)) rooms.set(room, new Set());
            rooms.get(room).add(ws);

            const participants = Array.from(rooms.get(room)).length;
            ws.send(JSON.stringify({ type: 'joined', participants }));
            console.log('Client joined', room, ' total:', participants);
            return;
        }

        const room = ws.roomId;
        if (!room) return;
        const peers = rooms.get(room);
        if (!peers) return;

        for (const peer of peers) {
            if (peer !== ws && peer.readyState === ws.OPEN) {
                peer.send(JSON.stringify(msg));
            }
        }
    });

    ws.on('close', () => {
        const room = ws.roomId;
        if (!room) return;
        const set = rooms.get(room);
        if (!set) return;
        set.delete(ws);
        if (set.size === 0) rooms.delete(room);
        else {
            for (const peer of set) {
                if (peer.readyState === ws.OPEN) {
                    peer.send(JSON.stringify({ type: 'peer-left' }));
                }
            }
        }
        console.log('Client left room', room);
    });
});

server.listen(bindingPort, bindingAddress, () => {
    console.log(`✅ HTTPS + WSS server running at: https://${bindingAddress}:${bindingPort}`);
});
