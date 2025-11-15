#!/usr/bin/env node
// Advanced Interactive CLI with customization options

import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESOURCE_TYPES = [
  { name: 'Complete Resource (Customizable)', value: 'resource' },
  { name: 'Controller only', value: 'controller' },
  { name: 'Route only', value: 'route' },
  { name: 'Service only', value: 'service' },
  { name: 'Middleware', value: 'middleware' },
  { name: 'Migration only', value: 'migration' }
];

// Generate customizable controller
const generateCustomController = (name, options) => {
  const controllerName = name.charAt(0).toUpperCase() + name.slice(1);
  const fileName = `${name}Controller.js`;
  const filePath = path.join(process.cwd(), 'src', 'controllers', fileName);

  if (fs.existsSync(filePath)) {
    console.error(`❌ Controller ${fileName} already exists!`);
    return false;
  }

  const { includeGetAll, includeGetById, includeCreate, includeUpdate, includeDelete, includePagination, includeAuth } = options;

  let imports = `import { supabase, supabaseAdmin } from '../config/supabase.js';
import { successResponse } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { logAudit } from '../services/auditService.js';`;

  if (includePagination) {
    imports += `\nimport { parsePagination } from '../utils/helpers.js';`;
  }

  let code = imports + '\n\n';
  code += `/**\n * @swagger\n * tags:\n *   name: ${controllerName}\n *   description: ${controllerName} management\n */\n\n`;

  // Get All
  if (includeGetAll) {
    code += `/**
 * Get all ${name}s
 * @swagger
 * /api/v1/${name}s:
 *   get:
 *     summary: Get all ${name}s
 *     tags: [${controllerName}]`;
    
    if (includeAuth) {
      code += `\n *     security:\n *       - bearerAuth: []`;
    }
    
    if (includePagination) {
      code += `\n *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer`;
    }
    
    code += `\n *     responses:
 *       200:
 *         description: Success
 */
export const getAll${controllerName}s = async (req, res, next) => {
  try {
`;

    if (includePagination) {
      code += `    const { page, limit, offset } = parsePagination(req.query);

    const { data, error, count } = await supabaseAdmin
      .from('${name}s')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    logger.info(\`Retrieved \${data.length} ${name}s\`, { userId: req.user?.id });

    return successResponse(res, {
      ${name}s: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
`;
    } else {
      code += `    const { data, error } = await supabaseAdmin
      .from('${name}s')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    logger.info(\`Retrieved \${data.length} ${name}s\`, { userId: req.user?.id });

    return successResponse(res, data);
`;
    }

    code += `  } catch (error) {
    next(error);
  }
};

`;
  }

  // Get By ID
  if (includeGetById) {
    code += `/**
 * Get ${name} by ID
 * @swagger
 * /api/v1/${name}s/{id}:
 *   get:
 *     summary: Get ${name} by ID
 *     tags: [${controllerName}]`;
    
    if (includeAuth) {
      code += `\n *     security:\n *       - bearerAuth: []`;
    }
    
    code += `\n *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not found
 */
export const get${controllerName}ById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('${name}s')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError('${controllerName} not found');
    }

    logger.info(\`Retrieved ${name}\`, { ${name}Id: id, userId: req.user?.id });

    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

`;
  }

  // Create
  if (includeCreate) {
    code += `/**
 * Create new ${name}
 * @swagger
 * /api/v1/${name}s:
 *   post:
 *     summary: Create new ${name}
 *     tags: [${controllerName}]`;
    
    if (includeAuth) {
      code += `\n *     security:\n *       - bearerAuth: []`;
    }
    
    code += `\n *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
export const create${controllerName} = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('${name}s')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await logAudit({
      userId: req.user?.id || 'system',
      action: '${name}_created',
      resourceType: '${name}',
      resourceId: data.id,
      metadata: { ${name}: data },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.success(\`${controllerName} created\`, { ${name}Id: data.id, userId: req.user?.id });

    return successResponse(res, data, '${controllerName} created successfully', 201);
  } catch (error) {
    next(error);
  }
};

`;
  }

  // Update
  if (includeUpdate) {
    code += `/**
 * Update ${name}
 * @swagger
 * /api/v1/${name}s/{id}:
 *   put:
 *     summary: Update ${name}
 *     tags: [${controllerName}]`;
    
    if (includeAuth) {
      code += `\n *     security:\n *       - bearerAuth: []`;
    }
    
    code += `\n *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 */
export const update${controllerName} = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('${name}s')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundError('${controllerName} not found');
    }

    // Audit log
    await logAudit({
      userId: req.user?.id || 'system',
      action: '${name}_updated',
      resourceType: '${name}',
      resourceId: id,
      metadata: { changes: req.body },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.success(\`${controllerName} updated\`, { ${name}Id: id, userId: req.user?.id });

    return successResponse(res, data, '${controllerName} updated successfully');
  } catch (error) {
    next(error);
  }
};

`;
  }

  // Delete
  if (includeDelete) {
    code += `/**
 * Delete ${name}
 * @swagger
 * /api/v1/${name}s/{id}:
 *   delete:
 *     summary: Delete ${name}
 *     tags: [${controllerName}]`;
    
    if (includeAuth) {
      code += `\n *     security:\n *       - bearerAuth: []`;
    }
    
    code += `\n *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
export const delete${controllerName} = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('${name}s')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Audit log
    await logAudit({
      userId: req.user?.id || 'system',
      action: '${name}_deleted',
      resourceType: '${name}',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.success(\`${controllerName} deleted\`, { ${name}Id: id, userId: req.user?.id });

    return successResponse(res, null, '${controllerName} deleted successfully');
  } catch (error) {
    next(error);
  }
};

`;
  }

  // Export
  code += `export default {\n`;
  if (includeGetAll) code += `  getAll${controllerName}s,\n`;
  if (includeGetById) code += `  get${controllerName}ById,\n`;
  if (includeCreate) code += `  create${controllerName},\n`;
  if (includeUpdate) code += `  update${controllerName},\n`;
  if (includeDelete) code += `  delete${controllerName}\n`;
  code += `};\n`;

  fs.writeFileSync(filePath, code);
  console.log(`✅ Controller created: ${filePath}`);
  return true;
};

// Generate customizable route
const generateCustomRoute = (name, options) => {
  const controllerName = name.charAt(0).toUpperCase() + name.slice(1);
  const fileName = `${name}Routes.js`;
  const filePath = path.join(process.cwd(), 'src', 'routes', fileName);

  if (fs.existsSync(filePath)) {
    console.error(`❌ Route ${fileName} already exists!`);
    return false;
  }

  const { includeGetAll, includeGetById, includeCreate, includeUpdate, includeDelete, includeAuth, requireAdmin } = options;

  let code = `import express from 'express';\n`;
  
  // Imports
  let imports = [];
  if (includeGetAll) imports.push(`getAll${controllerName}s`);
  if (includeGetById) imports.push(`get${controllerName}ById`);
  if (includeCreate) imports.push(`create${controllerName}`);
  if (includeUpdate) imports.push(`update${controllerName}`);
  if (includeDelete) imports.push(`delete${controllerName}`);
  
  code += `import {\n  ${imports.join(',\n  ')}\n} from '../controllers/${name}Controller.js';\n`;
  
  if (includeAuth) {
    code += `import { authenticate, authorize } from '../middleware/auth.js';\n`;
  }
  
  code += `import { validate } from '../utils/validation.js';\n\n`;
  code += `const router = express.Router();\n\n`;

  // Routes
  if (includeGetAll) {
    code += `// Get all ${name}s\n`;
    code += `router.get('/', `;
    if (includeAuth) code += `authenticate, `;
    code += `getAll${controllerName}s);\n\n`;
  }

  if (includeGetById) {
    code += `// Get ${name} by ID\n`;
    code += `router.get('/:id', `;
    if (includeAuth) code += `authenticate, `;
    code += `get${controllerName}ById);\n\n`;
  }

  if (includeCreate) {
    code += `// Create ${name}\n`;
    code += `router.post(\n  '/',\n`;
    if (includeAuth) code += `  authenticate,\n`;
    code += `  // validate(schemas.create${controllerName}), // Add validation schema\n`;
    code += `  create${controllerName}\n);\n\n`;
  }

  if (includeUpdate) {
    code += `// Update ${name}\n`;
    code += `router.put(\n  '/:id',\n`;
    if (includeAuth) code += `  authenticate,\n`;
    code += `  // validate(schemas.update${controllerName}), // Add validation schema\n`;
    code += `  update${controllerName}\n);\n\n`;
  }

  if (includeDelete) {
    code += `// Delete ${name}\n`;
    code += `router.delete(\n  '/:id',\n`;
    if (includeAuth) code += `  authenticate,\n`;
    if (requireAdmin) code += `  authorize('admin'), // Only admin can delete\n`;
    code += `  delete${controllerName}\n);\n\n`;
  }

  code += `export default router;\n`;

  fs.writeFileSync(filePath, code);
  console.log(`✅ Route created: ${filePath}`);
  return true;
};

// Auto-register route in index.js
const registerRoute = (name) => {
  const indexPath = path.join(process.cwd(), 'src', 'routes', 'index.js');
  
  if (!fs.existsSync(indexPath)) {
    console.error('❌ src/routes/index.js not found!');
    return false;
  }

  let content = fs.readFileSync(indexPath, 'utf-8');
  
  // Check if already registered
  if (content.includes(`${name}Routes`)) {
    console.log(`⚠️  Route already registered in index.js`);
    return false;
  }

  // Add import
  const importLine = `import ${name}Routes from './${name}Routes.js';`;
  const importRegex = /import.*Routes.*from.*;\n/g;
  const imports = content.match(importRegex) || [];
  const lastImport = imports[imports.length - 1];
  
  if (lastImport) {
    content = content.replace(lastImport, lastImport + importLine + '\n');
  } else {
    // Add after express import
    content = content.replace(
      /import express from 'express';/,
      `import express from 'express';\n${importLine}`
    );
  }

  // Add route registration
  const routeRegex = /router\.use\('\/\w+',\s*\w+Routes\);/g;
  const routes = content.match(routeRegex) || [];
  const lastRoute = routes[routes.length - 1];
  
  const routeLine = `router.use('/${name}s', ${name}Routes);`;
  
  if (lastRoute) {
    content = content.replace(lastRoute, lastRoute + '\n' + routeLine);
  } else {
    // Add before export
    content = content.replace(
      /export default router;/,
      `${routeLine}\n\nexport default router;`
    );
  }

  fs.writeFileSync(indexPath, content);
  console.log(`✅ Route registered in src/routes/index.js`);
  return true;
};

// Create migration
const createMigration = async (name) => {
  const { execSync } = await import('child_process');
  try {
    execSync(`npx supabase migration new add_${name}s_table`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('❌ Error creating migration:', error.message);
    return false;
  }
};

// Main CLI
const main = async () => {
  console.log('\n🎨 Advanced Supabase API Resource Generator\n');

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'What would you like to create?',
      choices: RESOURCE_TYPES
    },
    {
      type: 'input',
      name: 'name',
      message: 'Resource name (singular, lowercase):',
      validate: (input) => {
        if (!input) return 'Name is required';
        if (!/^[a-z]+$/.test(input)) return 'Name must be lowercase letters only';
        return true;
      }
    }
  ]);

  const { type, name } = answers;

  if (type === 'resource') {
    // Ask for customization options
    const options = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'operations',
        message: 'Select operations to include:',
        choices: [
          { name: 'Get All (List)', value: 'getAll', checked: true },
          { name: 'Get By ID', value: 'getById', checked: true },
          { name: 'Create', value: 'create', checked: true },
          { name: 'Update', value: 'update', checked: true },
          { name: 'Delete', value: 'delete', checked: true }
        ]
      },
      {
        type: 'confirm',
        name: 'includePagination',
        message: 'Include pagination for Get All?',
        default: true,
        when: (answers) => answers.operations.includes('getAll')
      },
      {
        type: 'confirm',
        name: 'includeAuth',
        message: 'Require authentication?',
        default: true
      },
      {
        type: 'confirm',
        name: 'requireAdmin',
        message: 'Require admin role for delete?',
        default: true,
        when: (answers) => answers.operations.includes('delete') && answers.includeAuth
      },
      {
        type: 'confirm',
        name: 'autoRegister',
        message: 'Auto-register route in src/routes/index.js?',
        default: true
      }
    ]);

    console.log('\n🚀 Creating resource with custom options...\n');

    // Create migration
    console.log('1️⃣  Creating migration...');
    await createMigration(name);

    // Create controller
    console.log('\n2️⃣  Creating controller...');
    const controllerOptions = {
      includeGetAll: options.operations.includes('getAll'),
      includeGetById: options.operations.includes('getById'),
      includeCreate: options.operations.includes('create'),
      includeUpdate: options.operations.includes('update'),
      includeDelete: options.operations.includes('delete'),
      includePagination: options.includePagination || false,
      includeAuth: options.includeAuth
    };
    generateCustomController(name, controllerOptions);

    // Create route
    console.log('\n3️⃣  Creating route...');
    const routeOptions = {
      ...controllerOptions,
      requireAdmin: options.requireAdmin || false
    };
    generateCustomRoute(name, routeOptions);

    // Auto-register
    if (options.autoRegister) {
      console.log('\n4️⃣  Registering route...');
      registerRoute(name);
    }

    console.log('\n✅ Resource created successfully!\n');
    console.log('📝 Next steps:');
    console.log(`1. Edit migration: supabase/migrations/*_add_${name}s_table.sql`);
    console.log(`2. Apply migration: npm run migration:up`);
    if (!options.autoRegister) {
      console.log(`3. Register route in src/routes/index.js:`);
      console.log(`   import ${name}Routes from './${name}Routes.js';`);
      console.log(`   router.use('/${name}s', ${name}Routes);`);
    }
    console.log(`${options.autoRegister ? '3' : '4'}. Test in Swagger UI: http://localhost:3000/api-docs\n`);
  } else {
    // Handle other types (controller, route, service, etc.)
    console.log(`\n⚠️  Use 'npm run create' for basic generation or implement other types here.\n`);
  }
};

main().catch(console.error);
