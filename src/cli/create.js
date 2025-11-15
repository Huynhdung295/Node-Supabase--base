#!/usr/bin/env node
// Interactive CLI for creating resources (like NestJS CLI)

import inquirer from 'inquirer';
import { generateController } from '../generators/controllerGenerator.js';
import { generateRoute } from '../generators/routeGenerator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESOURCE_TYPES = [
  { name: 'Complete Resource (Controller + Route + Migration)', value: 'resource' },
  { name: 'Controller only', value: 'controller' },
  { name: 'Route only', value: 'route' },
  { name: 'Service', value: 'service' },
  { name: 'Middleware', value: 'middleware' },
  { name: 'Migration', value: 'migration' }
];

const createService = (name) => {
  const serviceName = name.charAt(0).toUpperCase() + name.slice(1);
  const fileName = `${name}Service.js`;
  const filePath = path.join(process.cwd(), 'src', 'services', fileName);

  if (fs.existsSync(filePath)) {
    console.error(`❌ Service ${fileName} already exists!`);
    return false;
  }

  const template = `// ${serviceName} Service

import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

/**
 * Get all ${name}s
 */
export const getAll${serviceName}s = async (options = {}) => {
  try {
    const { limit = 10, offset = 0 } = options;

    const { data, error, count } = await supabaseAdmin
      .from('${name}s')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return { data, count };
  } catch (error) {
    logger.error(\`Error getting ${name}s\`, { error: error.message });
    throw error;
  }
};

/**
 * Get ${name} by ID
 */
export const get${serviceName}ById = async (id) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('${name}s')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error(\`Error getting ${name}\`, { error: error.message, id });
    throw error;
  }
};

/**
 * Create ${name}
 */
export const create${serviceName} = async (${name}Data) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('${name}s')
      .insert(${name}Data)
      .select()
      .single();

    if (error) throw error;

    logger.success(\`${serviceName} created\`, { id: data.id });
    return data;
  } catch (error) {
    logger.error(\`Error creating ${name}\`, { error: error.message });
    throw error;
  }
};

/**
 * Update ${name}
 */
export const update${serviceName} = async (id, updates) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('${name}s')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.success(\`${serviceName} updated\`, { id });
    return data;
  } catch (error) {
    logger.error(\`Error updating ${name}\`, { error: error.message, id });
    throw error;
  }
};

/**
 * Delete ${name}
 */
export const delete${serviceName} = async (id) => {
  try {
    const { error } = await supabaseAdmin
      .from('${name}s')
      .delete()
      .eq('id', id);

    if (error) throw error;

    logger.success(\`${serviceName} deleted\`, { id });
    return true;
  } catch (error) {
    logger.error(\`Error deleting ${name}\`, { error: error.message, id });
    throw error;
  }
};

export default {
  getAll${serviceName}s,
  get${serviceName}ById,
  create${serviceName},
  update${serviceName},
  delete${serviceName}
};
`;

  fs.writeFileSync(filePath, template);
  console.log(`✅ Service created: ${filePath}`);
  return true;
};

const createMiddleware = (name) => {
  const fileName = `${name}.js`;
  const filePath = path.join(process.cwd(), 'src', 'middleware', fileName);

  if (fs.existsSync(filePath)) {
    console.error(`❌ Middleware ${fileName} already exists!`);
    return false;
  }

  const template = `// ${name.charAt(0).toUpperCase() + name.slice(1)} Middleware

import { logger } from '../utils/logger.js';

/**
 * ${name} middleware
 */
export const ${name} = (req, res, next) => {
  try {
    // TODO: Implement middleware logic
    
    logger.info('${name} middleware executed', {
      method: req.method,
      url: req.url
    });

    next();
  } catch (error) {
    next(error);
  }
};

export default ${name};
`;

  fs.writeFileSync(filePath, template);
  console.log(`✅ Middleware created: ${filePath}`);
  return true;
};

const createMigration = async (name) => {
  const { execSync } = await import('child_process');
  try {
    execSync(`npx supabase migration new ${name}`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('❌ Error creating migration:', error.message);
    return false;
  }
};

const createResource = async (name) => {
  console.log(`\n🚀 Creating complete resource: ${name}\n`);

  // 1. Create migration
  console.log('1️⃣  Creating migration...');
  await createMigration(`add_${name}s_table`);

  // 2. Create service
  console.log('\n2️⃣  Creating service...');
  createService(name);

  // 3. Create controller
  console.log('\n3️⃣  Creating controller...');
  generateController(name);

  // 4. Create route
  console.log('\n4️⃣  Creating route...');
  generateRoute(name);

  console.log('\n✅ Resource created successfully!\n');
  console.log('📝 Next steps:');
  console.log(`1. Edit migration: supabase/migrations/*_add_${name}s_table.sql`);
  console.log(`2. Apply migration: npm run migration:up`);
  console.log(`3. Register route in src/routes/index.js:`);
  console.log(`   import ${name}Routes from './${name}Routes.js';`);
  console.log(`   router.use('/${name}s', ${name}Routes);`);
  console.log(`4. Test in Swagger UI: http://localhost:3000/api-docs\n`);
};

const main = async () => {
  console.log('\n🎨 Supabase API Resource Generator\n');

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

  console.log('');

  switch (type) {
    case 'resource':
      await createResource(name);
      break;
    case 'controller':
      generateController(name);
      break;
    case 'route':
      generateRoute(name);
      break;
    case 'service':
      createService(name);
      break;
    case 'middleware':
      createMiddleware(name);
      break;
    case 'migration':
      await createMigration(name);
      break;
  }
};

main().catch(console.error);
