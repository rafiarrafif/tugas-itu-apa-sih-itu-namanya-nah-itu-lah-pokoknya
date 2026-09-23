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
    MenuItemInput: {
      type: 'object',
      required: ['stallId', 'name', 'price', 'isAvailable'],
      properties: {
        stallId: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Nasi Goreng' },
        price: { type: 'integer', example: 25000 },
        isAvailable: { type: 'boolean', example: true },
      },
    },
    MenuItemUpdate: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Nasi Goreng Update' },
        price: { type: 'integer', example: 27000 },
        isAvailable: { type: 'boolean', example: false },
      },
    },
  },
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/index.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);
