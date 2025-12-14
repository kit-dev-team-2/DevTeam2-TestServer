// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.get('/', (_, res) => res.send('WS server OK'));
const server = http.createServer(app);

// 원하는 전송 주기 설정
const time = 1000;

const labels = ["Speech", "Dog", "Bark", "Vehicle", "Vehicle horn", "Siren", "Explosion"];
const types = ["detection"];

const wss = new WebSocket.Server({ server });
console.log('Data pool for random messages is ready.');

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log('WS connected:', ip);

    ws.on('message', (data, isBinary) => {
        if (!isBinary) {
            const msg = data.toString();
            let payload = null;

            // JSON 시도
            try {
                payload = JSON.parse(msg);
            } catch (e) {
                // JSON 아니면 그냥 문자열로 취급
            }

            // 🔹 수신 메시지는 로그에 기록하고 echo 응답
            console.log('RX:', msg);
            ws.send(JSON.stringify({ type: 'ack', t: Date.now(), echo: msg }));
        } else {
            console.log('RX bin:', data.length, 'bytes');
            ws.send(JSON.stringify({ type: 'ack-bin', bytes: data.length }));
        }
    });

    ws.on('close', () => console.log('WS closed', ip));

    const iv = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            // 전송할 메시지를 무작위로 조합
            const randomLabel = labels[Math.floor(Math.random() * labels.length)];
            const randomType = types[Math.floor(Math.random() * types.length)];

            const message = {
                type: randomType,
                timestamp: Date.now(), // 현재 Unix 시간 (밀리초)
                doa: Math.floor(Math.random() * 360), // 0 ~ 359 사이의 무작위 값
                tags: [{ label: randomLabel, score: Math.random() }]
            };
            ws.send(JSON.stringify(message));
            console.log('TX:', message);
        } else clearInterval(iv);
    }, time);
});

server.listen(8080, '0.0.0.0', () => {
    console.log('HTTP/WS on http://0.0.0.0:8080');
});
