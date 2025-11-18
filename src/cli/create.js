#!/usr/bin/env node
// UNIFIED CLI - One command for everything (like NestJS/Angular)

import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// PRESETS
// ============================================

const PRESETS = {
  ultimate: {
    name: '🎯 Ultimate (All features)',
    description: 'Full CRUD + Search + Export + Tests + RLS',
    operations: ['getAll', 'getById', 'create', 'update', 'delete', 'search', 'export'],
    pagination: true,
    auth: true,
    adminDelete: true,
    validation: true,
    tests: true,
    softDelete: false,
    timestamps: true,
    search: true,
    export: true,
    rls: true
  },
  crud: {
    name: '📦 CRUD (Standard)',
    description: 'Basic CRUD operations with auth',
    operations: ['getAll', 'getById', 'create', 'update', 'delete'],
    pagination: true,
    auth: true,
    adminDelete: true,
    validation: true,
    tests: false,
    softDelete: false,
    timestamps: true,
    search: false,
    export: false,
    rls: true
  },
  readonly: {
    name: '📖 Read-Only (Public)',
    description: 'Get All + Get By ID, no auth',
    operations: ['getAll', 'getById'],
    pagination: true,
    auth: false,
    adminDelete: false,
    validation: false,
    tests: false,
    softDelete: false,
    timestamps: true,
    search: false,
    export: false,
    rls: false
  },
  protected: {
    name: '🔐 User-Protected',
    description: 'Users manage their own data',
    operations: ['getAll', 'getById', 'create', 'update', 'delete'],
    pagination: true,
    auth: true,
    adminDelete: false,
    validation: true,
    tests: false,
    softDelete: false,
    timestamps: true,
    search: false,
    export: false,
    rls: true
  },
  admin: {
    name: '👑 Admin-Only',
    description: 'All operations require admin',
    operations: ['getAll', 'getById', 'create', 'update', 'delete'],
    pagination: true,
    auth: true,
    adminAll: true,
    validation: true,
    tests: false,
    softDelete: false,
    timestamps: true,
    search: false,
    export: true,
    rls: true
  },
  custom: {
    name: '🎨 Custom',
    description: 'Choose everything yourself'
  }
};

// ============================================
// GENERATORS
// ============================================

const generateMigration = (name, options) => {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const fileName = `${timestamp}_add_${name}s_table.sql`;
  const filePath = path.join(process.cwd(), 'supabase', 'migrations', fileName);

  let sql = `-- Create ${name}s table\n\n`;
  sql += `CREATE TABLE IF NOT EXISTS public.${name}s (\n`;
  sql += `  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n`;
  
  if (options.auth) {
    sql += `  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,\n`;
  }
  
  sql += `  name TEXT NOT NULL,\n`;
  sql += `  description TEXT,\n`;
  
  if (options.softDelete) {
    sql += `  deleted_at TIMESTAMPTZ,\n`;
  }
  
  if (options.timestamps) {
    sql += `  created_at TIMESTAMPTZ DEFAULT NOW(),\n`;
    sql += `  updated_at TIMESTAMPTZ DEFAULT NOW()\n`;
  }
  
  sql += `);\n\n`;
  
  // Indexes
  sql += `-- Indexes\n`;
  if (options.auth) {
    sql += `CREATE INDEX idx_${name}s_user_id ON public.${name}s(user_id);\n`;
  }
  if (options.timestamps) {
    sql += `CREATE INDEX idx_${name}s_created_at ON public.${name}s(created_at DESC);\n`;
  }
  
  // Full-text search
  if (options.search) {
    sql += `\n-- Full-text search\n`;
    sql += `ALTER TABLE public.${name}s ADD COLUMN search_vector tsvector;\n`;
    sql += `CREATE INDEX idx_${name}s_search ON public.${name}s USING gin(search_vector);\n`;
    sql += `\nCREATE OR REPLACE FUNCTION update_${name}s_search_vector()\n`;
    sql += `RETURNS TRIGGER AS $$\n`;
    sql += `BEGIN\n`;
    sql += `  NEW.search_vector := to_tsvector('english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, ''));\n`;
    sql += `  RETURN NEW;\n`;
    sql += `END;\n`;
    sql += `$$ LANGUAGE plpgsql;\n\n`;
    sql += `CREATE TRIGGER ${name}s_search_vector_update\n`;
    sql += `BEFORE INSERT OR UPDATE ON public.${name}s\n`;
    sql += `FOR EACH ROW EXECUTE FUNCTION update_${name}s_search_vector();\n`;
  }
  
  // Updated_at trigger
  if (options.timestamps) {
    sql += `\n-- Updated_at trigger\n`;
    sql += `CREATE OR REPLACE FUNCTION update_updated_at_column()\n`;
    sql += `RETURNS TRIGGER AS $$\n`;
    sql += `BEGIN\n`;
    sql += `  NEW.updated_at = NOW();\n`;
    sql += `  RETURN NEW;\n`;
    sql += `END;\n`;
    sql += `$$ LANGUAGE plpgsql;\n\n`;
    sql += `CREATE TRIGGER update_${name}s_updated_at\n`;
    sql += `BEFORE UPDATE ON public.${name}s\n`;
    sql += `FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n`;
  }
  
  // RLS
  if (options.rls) {
    sql += `\n-- Row Level Security\n`;
    sql += `ALTER TABLE public.${name}s ENABLE ROW LEVEL SECURITY;\n\n`;
    sql += `CREATE POLICY "${name}s_select_policy" ON public.${name}s FOR SELECT USING (true);\n`;
    if (options.auth) {
      sql += `CREATE POLICY "${name}s_insert_policy" ON public.${name}s FOR INSERT WITH CHECK (auth.uid() = user_id);\n`;
      sql += `CREATE POLICY "${name}s_update_policy" ON public.${name}s FOR UPDATE USING (auth.uid() = user_id);\n`;
      sql += `CREATE POLICY "${name}s_delete_policy" ON public.${name}s FOR DELETE USING (auth.uid() = user_id);\n`;
    }
  }
  
  fs.writeFileSync(filePath, sql);
  return fileName;
};

const generateController = (name, options) => {
  const capitalName = name.charAt(0).toUpperCase() + name.slice(1);
  const fileName = `${name}Controller.js`;
  const filePath = path.join(process.cwd(), 'src', 'controllers', fileName);

  if (fs.existsSync(filePath)) {
    throw new Error(`Controller ${fileName} already exists!`);
  }

  let code = `import { supabaseAdmin } from '../config/supabase.js';\n`;
  code += `import { successResponse } from '../utils/response.js';\n`;
  code += `import { NotFoundError } from '../middleware/errorHandler.js';\n`;
  code += `import { logger } from '../utils/logger.js';\n`;
  code += `import { logAudit } from '../services/auditService.js';\n`;
  if (options.pagination) {
    code += `import { parsePagination } from '../utils/helpers.js';\n`;
  }
  code += `\n`;

  // Swagger tags
  code += `/**\n * @swagger\n * tags:\n *   name: ${capitalName}\n *   description: ${capitalName} management\n */\n\n`;

  // Generate operations with full Swagger docs
  options.operations.forEach(op => {
    if (op === 'getAll') {
      code += `/**\n * @swagger\n * /api/v1/${name}s:\n *   get:\n *     summary: Get all ${name}s\n *     tags: [${capitalName}]\n`;
      if (options.auth) code += ` *     security:\n *       - bearerAuth: []\n`;
      if (options.pagination) {
        code += ` *     parameters:\n *       - in: query\n *         name: page\n *         schema:\n *           type: integer\n *       - in: query\n *         name: limit\n *         schema:\n *           type: integer\n`;
      }
      code += ` *     responses:\n *       200:\n *         description: Success\n */\n`;
      code += `export const getAll${capitalName}s = async (req, res, next) => {\n`;
      code += `  try {\n`;
      if (options.pagination) {
        code += `    const { page, limit, offset } = parsePagination(req.query);\n`;
        code += `    const { data, error, count } = await supabaseAdmin.from('${name}s').select('*', { count: 'exact' }).range(offset, offset + limit - 1).order('created_at', { ascending: false });\n`;
        code += `    if (error) throw error;\n`;
        code += `    return successResponse(res, { ${name}s: data, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });\n`;
      } else {
        code += `    const { data, error } = await supabaseAdmin.from('${name}s').select('*').order('created_at', { ascending: false });\n`;
        code += `    if (error) throw error;\n`;
        code += `    return successResponse(res, data);\n`;
      }
      code += `  } catch (error) { next(error); }\n};\n\n`;
    }
    
    if (op === 'getById') {
      code += `/**\n * @swagger\n * /api/v1/${name}s/{id}:\n *   get:\n *     summary: Get ${name} by ID\n *     tags: [${capitalName}]\n`;
      if (options.auth) code += ` *     security:\n *       - bearerAuth: []\n`;
      code += ` *     parameters:\n *       - in: path\n *         name: id\n *         required: true\n *         schema:\n *           type: string\n`;
      code += ` *     responses:\n *       200:\n *         description: Success\n *       404:\n *         description: Not found\n */\n`;
      code += `export const get${capitalName}ById = async (req, res, next) => {\n`;
      code += `  try {\n`;
      code += `    const { id } = req.params;\n`;
      code += `    const { data, error } = await supabaseAdmin.from('${name}s').select('*').eq('id', id).single();\n`;
      code += `    if (error || !data) throw new NotFoundError('${capitalName} not found');\n`;
      code += `    return successResponse(res, data);\n`;
      code += `  } catch (error) { next(error); }\n};\n\n`;
    }
    
    if (op === 'search') {
      code += `/**\n * @swagger\n * /api/v1/${name}s/search:\n *   get:\n *     summary: Search ${name}s\n *     tags: [${capitalName}]\n`;
      if (options.auth) code += ` *     security:\n *       - bearerAuth: []\n`;
      code += ` *     parameters:\n *       - in: query\n *         name: q\n *         required: true\n *         schema:\n *           type: string\n`;
      code += ` *     responses:\n *       200:\n *         description: Success\n */\n`;
      code += `export const search${capitalName}s = async (req, res, next) => {\n`;
      code += `  try {\n`;
      code += `    const { q } = req.query;\n`;
      code += `    const { data, error } = await supabaseAdmin.from('${name}s').select('*').textSearch('search_vector', q);\n`;
      code += `    if (error) throw error;\n`;
      code += `    return successResponse(res, data);\n`;
      code += `  } catch (error) { next(error); }\n};\n\n`;
    }
    
    if (op === 'export') {
      code += `/**\n * @swagger\n * /api/v1/${name}s/export:\n *   get:\n *     summary: Export ${name}s\n *     tags: [${capitalName}]\n`;
      if (options.auth) code += ` *     security:\n *       - bearerAuth: []\n`;
      code += ` *     parameters:\n *       - in: query\n *         name: format\n *         schema:\n *           type: string\n *           enum: [json, csv]\n`;
      code += ` *     responses:\n *       200:\n *         description: Success\n */\n`;
      code += `export const export${capitalName}s = async (req, res, next) => {\n`;
      code += `  try {\n`;
      code += `    const { format = 'json' } = req.query;\n`;
      code += `    const { data, error } = await supabaseAdmin.from('${name}s').select('*');\n`;
      code += `    if (error) throw error;\n`;
      code += `    if (format === 'csv') {\n`;
      code += `      res.setHeader('Content-Type', 'text/csv');\n`;
      code += `      res.setHeader('Content-Disposition', 'attachment; filename=${name}s.csv');\n`;
      code += `      // TODO: Convert to CSV\n`;
      code += `      return res.send(data);\n`;
      code += `    }\n`;
      code += `    return successResponse(res, data);\n`;
      code += `  } catch (error) { next(error); }\n};\n\n`;
    }
    
    if (op === 'create') {
      code += `/**\n * @swagger\n * /api/v1/${name}s:\n *   post:\n *     summary: Create new ${name}\n *     tags: [${capitalName}]\n`;
      if (options.auth) code += ` *     security:\n *       - bearerAuth: []\n`;
      code += ` *     requestBody:\n *       required: true\n *       content:\n *         application/json:\n *           schema:\n *             type: object\n *             properties:\n *               name:\n *                 type: string\n`;
      code += ` *     responses:\n *       201:\n *         description: Created\n */\n`;
      code += `export const create${capitalName} = async (req, res, next) => {\n`;
      code += `  try {\n`;
      code += `    const { data, error } = await supabaseAdmin.from('${name}s').insert(req.body).select().single();\n`;
      code += `    if (error) throw error;\n`;
      code += `    await logAudit({ userId: req.user?.id || 'system', action: '${name}_created', resourceType: '${name}', resourceId: data.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] });\n`;
      code += `    return successResponse(res, data, '${capitalName} created successfully', 201);\n`;
      code += `  } catch (error) { next(error); }\n};\n\n`;
    }
    
    if (op === 'update') {
      code += `/**\n * @swagger\n * /api/v1/${name}s/{id}:\n *   put:\n *     summary: Update ${name}\n *     tags: [${capitalName}]\n`;
      if (options.auth) code += ` *     security:\n *       - bearerAuth: []\n`;
      code += ` *     parameters:\n *       - in: path\n *         name: id\n *         required: true\n *         schema:\n *           type: string\n`;
      code += ` *     requestBody:\n *       required: true\n *       content:\n *         application/json:\n *           schema:\n *             type: object\n`;
      code += ` *     responses:\n *       200:\n *         description: Updated\n */\n`;
      code += `export const update${capitalName} = async (req, res, next) => {\n`;
      code += `  try {\n`;
      code += `    const { id } = req.params;\n`;
      code += `    const { data, error } = await supabaseAdmin.from('${name}s').update(req.body).eq('id', id).select().single();\n`;
      code += `    if (error || !data) throw new NotFoundError('${capitalName} not found');\n`;
      code += `    await logAudit({ userId: req.user?.id || 'system', action: '${name}_updated', resourceType: '${name}', resourceId: id, metadata: { changes: req.body }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });\n`;
      code += `    return successResponse(res, data, '${capitalName} updated successfully');\n`;
      code += `  } catch (error) { next(error); }\n};\n\n`;
    }
    
    if (op === 'delete') {
      code += `/**\n * @swagger\n * /api/v1/${name}s/{id}:\n *   delete:\n *     summary: Delete ${name}\n *     tags: [${capitalName}]\n`;
      if (options.auth) code += ` *     security:\n *       - bearerAuth: []\n`;
      code += ` *     parameters:\n *       - in: path\n *         name: id\n *         required: true\n *         schema:\n *           type: string\n`;
      code += ` *     responses:\n *       200:\n *         description: Deleted\n */\n`;
      code += `export const delete${capitalName} = async (req, res, next) => {\n`;
      code += `  try {\n`;
      code += `    const { id } = req.params;\n`;
      if (options.softDelete) {
        code += `    const { error } = await supabaseAdmin.from('${name}s').update({ deleted_at: new Date() }).eq('id', id);\n`;
      } else {
        code += `    const { error } = await supabaseAdmin.from('${name}s').delete().eq('id', id);\n`;
      }
      code += `    if (error) throw error;\n`;
      code += `    await logAudit({ userId: req.user?.id || 'system', action: '${name}_deleted', resourceType: '${name}', resourceId: id, ipAddress: req.ip, userAgent: req.headers['user-agent'] });\n`;
      code += `    return successResponse(res, null, '${capitalName} deleted successfully');\n`;
      code += `  } catch (error) { next(error); }\n};\n\n`;
    }
  });

  code += `export default { ${options.operations.map(op => {
    if (op === 'getAll') return `getAll${capitalName}s`;
    if (op === 'getById') return `get${capitalName}ById`;
    if (op === 'create') return `create${capitalName}`;
    if (op === 'update') return `update${capitalName}`;
    if (op === 'delete') return `delete${capitalName}`;
    if (op === 'search') return `search${capitalName}s`;
    if (op === 'export') return `export${capitalName}s`;
  }).filter(Boolean).join(', ')} };\n`;

  fs.writeFileSync(filePath, code);
  return fileName;
};

const generateRoute = (name, options) => {
  const capitalName = name.charAt(0).toUpperCase() + name.slice(1);
  const fileName = `${name}Routes.js`;
  const filePath = path.join(process.cwd(), 'src', 'routes', fileName);

  if (fs.existsSync(filePath)) {
    throw new Error(`Route ${fileName} already exists!`);
  }

  let code = `import express from 'express';\n`;
  code += `import * as controller from '../controllers/${name}Controller.js';\n`;
  if (options.auth) {
    code += `import { authenticate, authorize } from '../middleware/auth.js';\n`;
  }
  if (options.validation) {
    code += `import { validate, schemas } from '../utils/validation.js';\n`;
  }
  code += `\nconst router = express.Router();\n\n`;

  options.operations.forEach(op => {
    const auth = options.auth ? 'authenticate, ' : '';
    const admin = options.adminAll || (op === 'delete' && options.adminDelete) ? "authorize('admin'), " : '';
    
    if (op === 'getAll') {
      code += `router.get('/', ${auth}controller.getAll${capitalName}s);\n`;
    }
    if (op === 'getById') {
      code += `router.get('/:id', ${auth}controller.get${capitalName}ById);\n`;
    }
    if (op === 'search') {
      code += `router.get('/search', ${auth}controller.search${capitalName}s);\n`;
    }
    if (op === 'export') {
      code += `router.get('/export', ${auth}controller.export${capitalName}s);\n`;
    }
    if (op === 'create') {
      const validation = options.validation ? `validate(schemas.create${capitalName}), ` : '';
      code += `router.post('/', ${auth}${validation}controller.create${capitalName});\n`;
    }
    if (op === 'update') {
      const validation = options.validation ? `validate(schemas.update${capitalName}), ` : '';
      code += `router.put('/:id', ${auth}${validation}controller.update${capitalName});\n`;
    }
    if (op === 'delete') {
      code += `router.delete('/:id', ${auth}${admin}controller.delete${capitalName});\n`;
    }
  });

  code += `\nexport default router;\n`;

  fs.writeFileSync(filePath, code);
  return fileName;
};

const addValidation = (name) => {
  const validationPath = path.join(process.cwd(), 'src', 'utils', 'validation.js');
  let content = fs.readFileSync(validationPath, 'utf-8');
  
  const capitalName = name.charAt(0).toUpperCase() + name.slice(1);
  
  const schemas = `  create${capitalName}: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().allow('', null)
  }),

  update${capitalName}: Joi.object({
    name: Joi.string().min(2).max(200),
    description: Joi.string().allow('', null)
  }).min(1),

`;
  
  content = content.replace(/};(\s*)export const validate/, `${schemas}};$1export const validate`);
  fs.writeFileSync(validationPath, content);
};

const registerRoute = (name) => {
  const indexPath = path.join(process.cwd(), 'src', 'routes', 'index.js');
  let content = fs.readFileSync(indexPath, 'utf-8');
  
  if (content.includes(`${name}Routes`)) {
    return false;
  }

  // Add import
  const importLine = `import ${name}Routes from './${name}Routes.js';`;
  const importRegex = /import.*Routes.*from.*;\n/g;
  const imports = content.match(importRegex) || [];
  const lastImport = imports[imports.length - 1];
  
  if (lastImport) {
    content = content.replace(lastImport, lastImport + importLine + '\n');
  }

  // Add route
  const routeLine = `router.use('/${name}s', ${name}Routes);`;
  const routeRegex = /router\.use\('\/\w+',\s*\w+Routes\);/g;
  const routes = content.match(routeRegex) || [];
  const lastRoute = routes[routes.length - 1];
  
  if (lastRoute) {
    content = content.replace(lastRoute, lastRoute + '\n' + routeLine);
  }

  fs.writeFileSync(indexPath, content);
  return true;
};

const generateTests = (name, options) => {
  const testPath = path.join(process.cwd(), 'tests', 'integration', `${name}.test.js`);
  const capitalName = name.charAt(0).toUpperCase() + name.slice(1);
  
  let code = `import request from 'supertest';\nimport app from '../../src/server.js';\n\n`;
  code += `describe('${capitalName} Endpoints', () => {\n`;
  code += `  let token;\n  let ${name}Id;\n\n`;
  code += `  beforeAll(async () => {\n`;
  code += `    const response = await request(app).post('/api/v1/auth/login').send({ email: 'user@example.com', password: 'user123' });\n`;
  code += `    token = response.body.data.access_token;\n  });\n\n`;
  
  if (options.operations.includes('create')) {
    code += `  test('should create ${name}', async () => {\n`;
    code += `    const response = await request(app).post('/api/v1/${name}s')`;
    if (options.auth) code += `.set('Authorization', \`Bearer \${token}\`)`;
    code += `.send({ name: 'Test' }).expect(201);\n`;
    code += `    ${name}Id = response.body.data.id;\n  });\n\n`;
  }
  
  code += `});\n`;
  
  fs.writeFileSync(testPath, code);
};

// ============================================
// MAIN CLI
// ============================================

const main = async () => {
  console.log('\n🚀 Supabase API Generator\n');

  const { preset } = await inquirer.prompt([
    {
      type: 'list',
      name: 'preset',
      message: 'Choose a preset:',
      choices: Object.entries(PRESETS).map(([key, value]) => ({
        name: `${value.name} - ${value.description || ''}`,
        value: key
      }))
    }
  ]);

  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Resource name (singular, lowercase):',
      validate: (input) => {
        if (!input) return 'Name is required';
        if (!/^[a-z]+$/.test(input)) return 'Must be lowercase letters only';
        return true;
      }
    }
  ]);

  let options = PRESETS[preset];

  if (preset === 'custom') {
    options = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'operations',
        message: 'Select operations:',
        choices: [
          { name: 'Get All', value: 'getAll', checked: true },
          { name: 'Get By ID', value: 'getById', checked: true },
          { name: 'Create', value: 'create', checked: true },
          { name: 'Update', value: 'update', checked: true },
          { name: 'Delete', value: 'delete', checked: true }
        ]
      },
      { type: 'confirm', name: 'pagination', message: 'Pagination?', default: true },
      { type: 'confirm', name: 'auth', message: 'Authentication?', default: true },
      { type: 'confirm', name: 'adminDelete', message: 'Admin-only delete?', default: true, when: (a) => a.operations.includes('delete') && a.auth },
      { type: 'confirm', name: 'validation', message: 'Validation?', default: true },
      { type: 'confirm', name: 'tests', message: 'Tests?', default: false },
      { type: 'confirm', name: 'softDelete', message: 'Soft delete?', default: false },
      { type: 'confirm', name: 'timestamps', message: 'Timestamps?', default: true },
      { type: 'confirm', name: 'rls', message: 'RLS policies?', default: true }
    ]);
  }

  console.log('\n🎯 Generating resource...\n');

  try {
    // 1. Migration
    console.log('1️⃣  Creating migration...');
    const migrationFile = generateMigration(name, options);
    console.log(`   ✅ ${migrationFile}`);

    // 2. Controller
    console.log('\n2️⃣  Creating controller...');
    const controllerFile = generateController(name, options);
    console.log(`   ✅ ${controllerFile}`);

    // 3. Route
    console.log('\n3️⃣  Creating route...');
    const routeFile = generateRoute(name, options);
    console.log(`   ✅ ${routeFile}`);

    // 4. Validation
    if (options.validation) {
      console.log('\n4️⃣  Adding validation...');
      addValidation(name);
      console.log(`   ✅ Updated validation.js`);
    }

    // 5. Auto-register
    console.log(`\n${options.validation ? '5️⃣' : '4️⃣'}  Auto-registering route...`);
    registerRoute(name);
    console.log(`   ✅ Updated routes/index.js`);

    // 6. Tests
    if (options.tests) {
      console.log(`\n${options.validation ? '6️⃣' : '5️⃣'}  Creating tests...`);
      generateTests(name, options);
      console.log(`   ✅ Created ${name}.test.js`);
    }

    console.log('\n✅ Resource generated successfully!\n');
    console.log('📝 Next steps:');
    console.log(`1. Edit migration: supabase/migrations/*_add_${name}s_table.sql`);
    console.log(`2. Customize columns and business logic`);
    console.log(`3. Apply migration: npm run migration:up`);
    console.log(`4. Test in Swagger: http://localhost:3000/api-docs\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
};

main().catch(console.error);
