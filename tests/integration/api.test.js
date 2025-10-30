const express = require('express');
const request = require('supertest');
const app = require('../src/app');

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('POST /webhook/telegram', () => {
    it('should handle telegram webhook', async () => {
      const mockUpdate = {
        update_id: 123456,
        message: {
          message_id: 1,
          from: {
            id: 12345,
            first_name: 'Test',
            username: 'testuser'
          },
          chat: {
            id: 12345,
            type: 'private'
          },
          text: '/start'
        }
      };

      const response = await request(app)
        .post('/webhook/telegram')
        .send(mockUpdate)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
    });
  });
});
