import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Exchange Commission Management API',
      version: '1.0.0',
      description: 'Comprehensive API for managing users, exchanges, tiers, commissions, and transactions with Supabase backend',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api/${process.env.API_VERSION || 'v1'}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authenticated users'
        },
        crawlerToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-crawler-token',
          description: 'Crawler authentication token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            full_name: { type: 'string' },
            avatar_url: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['user', 'cs', 'admin', 'system'] },
            status: { type: 'string', enum: ['active', 'inactive', 'banned'] },
            current_tier_id: { type: 'string', format: 'uuid', nullable: true },
            ref_code: { type: 'string' },
            referrer_id: { type: 'string', format: 'uuid', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Exchange: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', description: 'Exchange code (e.g., BINANCE, MEXC)' },
            name: { type: 'string' },
            logo_url: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['active', 'inactive'] },
            config_json: { type: 'object' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Tier: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', description: 'Tier name (e.g., Bronze, Silver, Gold)' },
            slug: { type: 'string' },
            priority: { type: 'integer', description: 'Display order' },
            color_hex: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Connection: {
          type: 'object',
          description: 'User-Exchange connection link',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            exchange_id: { type: 'string', format: 'uuid' },
            exchange_uid: { type: 'string', description: 'User UID on exchange platform' },
            status: { type: 'string', enum: ['pending', 'verified', 'rejected'] },
            total_volume: { type: 'number', format: 'double' },
            custom_commission_rate: { type: 'number', format: 'float', nullable: true },
            notes: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            link_id: { type: 'string', format: 'uuid' },
            exchange_id: { type: 'string', format: 'uuid' },
            raw_volume: { type: 'number', format: 'double' },
            commission_amount: { type: 'number', format: 'double' },
            rate_snapshot: { type: 'number', format: 'float' },
            transaction_date: { type: 'string', format: 'date-time' },
            raw_data: { type: 'object' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Claim: {
          type: 'object',
          description: 'Withdrawal/claim request',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            amount: { type: 'number', format: 'double' },
            status: { type: 'string', enum: ['wait_email_confirm', 'pending', 'approved', 'rejected'] },
            verification_code: { type: 'string' },
            notes: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            processed_at: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object', nullable: true }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Admin - Users', description: 'Admin user management' },
      { name: 'Admin - Connections', description: 'Admin connection management' },
      { name: 'Admin - Exchanges', description: 'Admin exchange CRUD' },
      { name: 'Admin - Tiers', description: 'Admin tier management' },
      { name: 'Admin - System', description: 'Admin system settings & crawler tokens' },
      { name: 'Admin - Statistics', description: 'Admin dashboard statistics' },
      { name: 'Admin - Claims', description: 'Admin claim management' },
      { name: 'CS - Users', description: 'CS user operations' },
      { name: 'CS - Connections', description: 'CS connection approval' },
      { name: 'CS - Statistics', description: 'CS dashboard' },
      { name: 'CS - Claims', description: 'CS claim processing' },
      { name: 'Profile - Main', description: 'User profile management' },
      { name: 'Profile - Connections', description: 'User exchange connections' },
      { name: 'Profile - Transactions', description: 'User balance & transactions' },
      { name: 'Claims - User', description: 'User withdrawal requests' },
      { name: 'Crawler', description: 'Crawler integration API' },
      { name: 'Exchanges - Public', description: 'Public exchange information' },
      { name: 'Tiers - Public', description: 'Public tier information' }
    ]
  },
  // CRITICAL: Use **/*.js to scan all subdirectories
  apis: [
    './src/routes/*.js',
    './src/routes/**/*.js',
    './src/controllers/*.js',
    './src/controllers/**/*.js'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);
