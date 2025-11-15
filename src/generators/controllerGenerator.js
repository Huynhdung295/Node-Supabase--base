#!/usr/bin/env node
// Generator for creating new controllers with boilerplate code

import fs from 'fs';
import path from 'path';

const generateController = (name) => {
  const controllerName = name.charAt(0).toUpperCase() + name.slice(1);
  const fileName = `${name}Controller.js`;
  const filePath = path.join(process.cwd(), 'src', 'controllers', fileName);

  if (fs.existsSync(filePath)) {
    console.error(`❌ Controller ${fileName} already exists!`);
    process.exit(1);
  }

  const template = `import { supabase, supabaseAdmin } from '../config/supabase.js';
import { successResponse } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { logAudit } from '../services/auditService.js';
import { parsePagination } from '../utils/helpers.js';

/**
 * @swagger
 * tags:
 *   name: ${controllerName}
 *   description: ${controllerName} management
 */

/**
 * Get all ${name}s
 * @swagger
 * /api/v1/${name}s:
 *   get:
 *     summary: Get all ${name}s
 *     tags: [${controllerName}]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Success
 */
export const getAll${controllerName}s = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);

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
  } catch (error) {
    next(error);
  }
};

/**
 * Get ${name} by ID
 * @swagger
 * /api/v1/${name}s/{id}:
 *   get:
 *     summary: Get ${name} by ID
 *     tags: [${controllerName}]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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

/**
 * Create new ${name}
 * @swagger
 * /api/v1/${name}s:
 *   post:
 *     summary: Create new ${name}
 *     tags: [${controllerName}]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
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
      userId: req.user.id,
      action: '${name}_created',
      resourceType: '${name}',
      resourceId: data.id,
      metadata: { ${name}: data },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.success(\`${controllerName} created\`, { ${name}Id: data.id, userId: req.user.id });

    return successResponse(res, data, '${controllerName} created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update ${name}
 * @swagger
 * /api/v1/${name}s/{id}:
 *   put:
 *     summary: Update ${name}
 *     tags: [${controllerName}]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
      userId: req.user.id,
      action: '${name}_updated',
      resourceType: '${name}',
      resourceId: id,
      metadata: { changes: req.body },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.success(\`${controllerName} updated\`, { ${name}Id: id, userId: req.user.id });

    return successResponse(res, data, '${controllerName} updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete ${name}
 * @swagger
 * /api/v1/${name}s/{id}:
 *   delete:
 *     summary: Delete ${name}
 *     tags: [${controllerName}]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
      userId: req.user.id,
      action: '${name}_deleted',
      resourceType: '${name}',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.success(\`${controllerName} deleted\`, { ${name}Id: id, userId: req.user.id });

    return successResponse(res, null, '${controllerName} deleted successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  getAll${controllerName}s,
  get${controllerName}ById,
  create${controllerName},
  update${controllerName},
  delete${controllerName}
};
`;

  fs.writeFileSync(filePath, template);
  console.log(`✅ Controller created: ${filePath}`);
  console.log('\nNext steps:');
  console.log(`1. Create routes file: src/routes/${name}Routes.js`);
  console.log(`2. Add validation schema in src/utils/validation.js`);
  console.log(`3. Create database migration for ${name}s table`);
  console.log(`4. Import and use in src/routes/index.js`);
};

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const name = process.argv[2];
  
  if (!name) {
    console.error('❌ Please provide a controller name');
    console.log('Usage: npm run generate:controller <name>');
    console.log('Example: npm run generate:controller post');
    process.exit(1);
  }

  generateController(name);
}

export { generateController };
