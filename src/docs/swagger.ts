import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: { title: 'Review Kantin API', version: '1.0.0' },
  servers: [{ url: 'http://localhost:3000' }],
  definitions: {
    StallInput: {
      type: 'object',
      required: ['ownerId', 'name'],
      properties: {
        ownerId: { type: 'integer', example: 2 },
        name: { type: 'string', example: 'Warung Baru' },
        category: { type: 'string', example: 'Nasi' },
        location: { type: 'string', example: 'Kantin FK' },
        description: { type: 'string' },
      },
    },
    UserInput: {
      type: 'object',
      required: ['name', 'email', 'password', 'role'],
      properties: {
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        password: { type: 'string', example: 'SecurePassword123!' },
        role: { type: 'string', enum: ['admin', 'owner', 'customer'], example: 'customer' },
      },
    },
  },
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/index.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);
