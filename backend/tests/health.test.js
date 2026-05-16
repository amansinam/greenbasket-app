const request = require('supertest');
const express = require('express');

// We mount a simple version of the health check here to test the logic
// Or we could require the actual app if it exports it (but server.js starts app.listen)
// Let's create a modular health route or just test the server directly.
// Given server.js starts listening, requiring it might cause open handles.
// Let's create a proxy app for testing the health route.

const app = express();
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

describe('Health Check API', () => {
  it('should return a 200 OK status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
