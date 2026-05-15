const request = require('supertest');
const app = require('../src/app');

describe('GET /', () => {
  it('mengembalikan status 200 dan field app', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('app', 'projects-devops');
    expect(res.body).toHaveProperty('status', 'running');
  });
});

describe('GET /health', () => {
  it('mengembalikan status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
  });
});

describe('GET /health/details', () => {
  it('mengembalikan info system dan memory', async () => {
    const res = await request(app).get('/health/details');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('system');
    expect(res.body.system).toHaveProperty('nodeVersion');
    expect(res.body).toHaveProperty('memory');
    expect(res.body.memory).toHaveProperty('heapUsedMB');
  });
});

describe('GET /health/ready', () => {
  it('mengembalikan status ready', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ready');
  });
});

describe('GET /route-yang-tidak-ada', () => {
  it('mengembalikan 404', async () => {
    const res = await request(app).get('/tidak-ada');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Not Found');
  });
});
