#!/usr/bin/env node
// Generator for creating new routes with boilerplate code

import fs from 'fs';
import path from 'path';

const generateRoute = (name) => {
  const controllerName = name.charAt(0).toUpperCase() + name.slice(1);
  const fileName = `${name}Routes.js`;
  const filePath = path.join(process.cwd(), 'src', 'routes', fileName);

  if (fs.existsSync(filePath)) {
    console.error(`❌ Route ${fileName} already exists!`);
    process.exit(1);
  }

  const template = `import express from 'express';
import {
  getAll${controllerName}s,
  get${controllerName}ById,
  create${controllerName},
  update${controllerName},
  delete${controllerName}
} from '../controllers/${name}Controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../utils/validation.js';
import { schemas } from '../utils/validation.js';

const router = express.Router();

// Get all ${name}s (authenticated users)
router.get('/', authenticate, getAll${controllerName}s);

// Get ${name} by ID (authenticated users)
router.get('/:id', authenticate, get${controllerName}ById);

// Create ${name} (authenticated users)
router.post(
  '/',
  authenticate,
  // validate(schemas.create${controllerName}), // Add validation schema
  create${controllerName}
);

// Update ${name} (owner or admin)
router.put(
  '/:id',
  authenticate,
  // validate(schemas.update${controllerName}), // Add validation schema
  update${controllerName}
);

// Delete ${name} (owner or admin)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'), // Only admin can delete
  delete${controllerName}
);

export default router;
`;

  fs.writeFileSync(filePath, template);
  console.log(`✅ Route created: ${filePath}`);
  console.log('\nNext steps:');
  console.log(`1. Import in src/routes/index.js:`);
  console.log(`   import ${name}Routes from './${name}Routes.js';`);
  console.log(`   router.use('/${name}s', ${name}Routes);`);
  console.log(`2. Add validation schemas in src/utils/validation.js`);
  console.log(`3. Test endpoints with Swagger UI`);
};

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const name = process.argv[2];
  
  if (!name) {
    console.error('❌ Please provide a route name');
    console.log('Usage: npm run generate:route <name>');
    console.log('Example: npm run generate:route post');
    process.exit(1);
  }

  generateRoute(name);
}

export { generateRoute };
