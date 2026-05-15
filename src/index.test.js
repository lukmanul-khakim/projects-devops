'use strict';

const request = require('supertest');
const app = require('./app');

describe('GET /', () => {
    it('should return 200 and app info', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.body.app).toBe('devops-portfolio');
        expect(res.body.status).toBe('running');
    });
});

describe('GET /health', () => {
    it('should return 200', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
    });
});

describe('GET /route-tidak-ada', () => {
    it('should return 404', async () => {
        const res = await request(app).get('/route-tidak-ada');
        expect(res.statusCode).toBe(404);
    });
});
