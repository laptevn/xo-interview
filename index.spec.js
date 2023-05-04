const request = require("supertest");
const API_URL = 'https://nlb7fskk98.execute-api.us-east-1.amazonaws.com';
const RESET_ENDPOINT = '/prod/reset-memcached';
const CHARGE_ENDPOINT = '/prod/charge-request-memcached';

describe('API tests', () => {
    it('General flow', async () => {
        var response = await request(API_URL).post(RESET_ENDPOINT);
        expect(response.statusCode).toBe(200);
        expect(response.body).toBe(null);

        for (let i = 95; i >= 0; i -= 5) {
            response = await request(API_URL).post(CHARGE_ENDPOINT);
            expect(response.statusCode).toBe(200);
            expect(response.body).toStrictEqual({
                charges: 5,
                isAuthorized: true,
                remainingBalance: i
            });
        }

        response = await request(API_URL).post(CHARGE_ENDPOINT);
        expect(response.statusCode).toBe(200);
        expect(response.body).toStrictEqual({
            charges: 0,
            isAuthorized: false,
            remainingBalance: 0
        });
    }, 20000)

    it('Concurrent requests', async () => {
        var response = await request(API_URL).post(RESET_ENDPOINT);
        expect(response.statusCode).toBe(200);
        expect(response.body).toBe(null);

        const charges = new Set();
        for (let sequentialCounter = 0; sequentialCounter < 2; ++sequentialCounter) {
            const promises = [];
            for (let i = 0; i < 10; ++i) {
                promises.push(new Promise(async (resolve) => {
                    const response = await request(API_URL).post(CHARGE_ENDPOINT);
                    expect(response.statusCode).toBe(200);
                    charges.add(response.body.remainingBalance);
                    resolve(true);
                }))
            }

            await Promise.all(promises);
        }

        expect(charges.size).toBe(20);

        response = await request(API_URL).post(CHARGE_ENDPOINT);
        expect(response.statusCode).toBe(200);
        expect(response.body).toStrictEqual({
            charges: 0,
            isAuthorized: false,
            remainingBalance: 0
        });
    }, 10000)
})

