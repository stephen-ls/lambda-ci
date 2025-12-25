import swaggerJsdoc from 'swagger-jsdoc';

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Payment API',
      version: '1.0.0',
    },
  },
  apis: [], // все описание ниже, без JSDoc-аннотаций
});
swaggerSpec.paths = {
  '/pay': {
    post: {
      summary: 'Perform payment action',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['action', 'data'],
              properties: {
                action: {
                  type: 'string',
                  example: 'charge',
                },
                data: {
                  type: 'object',
                  properties: {
                    recipients: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          address: { type: 'string' },
                          amount: { type: 'number' }
                        }
                      }
                    }
                  }
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Success response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  result: {
                    type: 'object',
                  },
                  error: {
                    type: 'string',
                    nullable: true,
                  },
                },
              },
            },
          },
        },
        500: {
          description: 'Internal error',
        },
      },
    },
  },
};

export default swaggerSpec;