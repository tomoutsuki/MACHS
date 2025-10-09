const request = require('supertest');
const app = require('./server');
const mongoose = require('mongoose');

describe('EHR System API', () => {
  beforeAll(async () => {
    // Connect to test database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/machs_ehr_test';
    await mongoose.connect(MONGODB_URI);
  });

  afterAll(async () => {
    // Clean up test database
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    test('GET /health should return service status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'MACHS EHR System');
    });
  });

  describe('Patient Management', () => {
    let patientId;

    test('POST /patients should create a new patient', async () => {
      const patientData = {
        firstName: 'Test',
        lastName: 'Patient',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        email: 'test@example.com',
        phone: '+1-555-0000'
      };

      const response = await request(app)
        .post('/patients')
        .send(patientData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Patient created successfully');
      expect(response.body.patient).toHaveProperty('patientId');
      patientId = response.body.patient.patientId;
    });

    test('GET /patients should return all patients', async () => {
      const response = await request(app)
        .get('/patients')
        .expect(200);

      expect(response.body).toHaveProperty('patients');
      expect(Array.isArray(response.body.patients)).toBe(true);
    });

    test('GET /patients/:id should return specific patient', async () => {
      const response = await request(app)
        .get(`/patients/${patientId}`)
        .expect(200);

      expect(response.body).toHaveProperty('patientId', patientId);
      expect(response.body).toHaveProperty('firstName', 'Test');
    });

    test('PUT /patients/:id should update patient', async () => {
      const updateData = {
        firstName: 'Updated'
      };

      const response = await request(app)
        .put(`/patients/${patientId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.patient).toHaveProperty('firstName', 'Updated');
    });

    test('DELETE /patients/:id should delete patient', async () => {
      const response = await request(app)
        .delete(`/patients/${patientId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Patient deleted successfully');
    });
  });

  describe('Error Handling', () => {
    test('GET /patients/nonexistent should return 404', async () => {
      await request(app)
        .get('/patients/nonexistent')
        .expect(404);
    });

    test('POST /patients with invalid data should return 500', async () => {
      const invalidData = {
        firstName: 'Test'
        // Missing required fields
      };

      await request(app)
        .post('/patients')
        .send(invalidData)
        .expect(500);
    });
  });
});