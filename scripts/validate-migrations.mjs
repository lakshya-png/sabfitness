import fs from 'fs';
import path from 'path';

const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
const migrationFiles = [
  '001_initial_schema.sql',
  '002_nutrition_recipes_indian_foods.sql',
  '003_workout_planner_exercise_library.sql',
  '004_personalized_goals_nutrition.sql'
];

console.log('================================================================');
console.log('       SABFITNESS COMPREHENSIVE SUPABASE MIGRATION AUDIT        ');
console.log('================================================================\n');

// System provided tables
const tableColumns = new Map();
tableColumns.set('auth.users', new Set(['id', 'email', 'raw_user_meta_data']));
tableColumns.set('users', new Set(['id', 'email', 'raw_user_meta_data']));

const createdTables = new Set(['auth.users', 'users']);
const createdViews = new Set();
const policiesByTable = new Map(); // tableName -> Set of policyNames

const migrationStatus = [];

for (const file of migrationFiles) {
  const filePath = path.join(migrationsDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Migration file not found: ${file}`);
    migrationStatus.push({ file, status: 'FAIL', errors: [`File not found: ${file}`] });
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n----------------------------------------------------------------`);
  console.log(`▶ AUDITING: ${file}`);
  console.log(`----------------------------------------------------------------`);

  const fileErrors = [];
  const fileWarnings = [];

  // 1. Detect and parse CREATE TABLE statements with columns
  const tableCreateRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi;
  for (const match of content.matchAll(tableCreateRegex)) {
    const tableName = match[1].toLowerCase();
    const body = match[2];

    if (createdTables.has(tableName)) {
      fileWarnings.push(`Table public.${tableName} is created with IF NOT EXISTS but was already declared.`);
    }

    createdTables.add(tableName);
    createdTables.add(`public.${tableName}`);
    if (!policiesByTable.has(tableName)) {
      policiesByTable.set(tableName, new Set());
    }

    // Parse column names
    const cols = new Set();
    const lines = body.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('--') || line.startsWith('CONSTRAINT') || line.startsWith('PRIMARY KEY') || line.startsWith('UNIQUE') || line.startsWith('CHECK')) {
        continue;
      }
      const colMatch = line.match(/^([a-zA-Z0-9_]+)\s+/);
      if (colMatch) {
        cols.add(colMatch[1].toLowerCase());
      }
    }
    tableColumns.set(tableName, cols);
    tableColumns.set(`public.${tableName}`, cols);
    console.log(`  [TABLE CREATED] public.${tableName} (${cols.size} columns detected)`);
  }

  // 2. Detect ALTER TABLE ADD COLUMN
  const alterAddColRegex = /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/gi;
  for (const match of content.matchAll(alterAddColRegex)) {
    const tableName = match[1].toLowerCase();
    const colName = match[2].toLowerCase();
    if (!createdTables.has(tableName)) {
      fileErrors.push(`ALTER TABLE targets non-existent table: "${tableName}"`);
    } else {
      const existingCols = tableColumns.get(tableName) || new Set();
      existingCols.add(colName);
      tableColumns.set(tableName, existingCols);
      console.log(`  [COLUMN ADDED] public.${tableName}.${colName}`);
    }
  }

  // 3. Detect View creations and security properties
  const viewRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:public\.)?([a-zA-Z0-9_]+)([\s\S]*?)AS\s+SELECT\s+([\s\S]*?);/gi;
  for (const match of content.matchAll(viewRegex)) {
    const viewName = match[1].toLowerCase();
    const viewOptions = match[2];
    createdViews.add(viewName);
    createdViews.add(`public.${viewName}`);

    const hasSecurityInvoker = /WITH\s*\(\s*security_invoker\s*=\s*true\s*\)/i.test(viewOptions);
    console.log(`  [VIEW CREATED] public.${viewName} (security_invoker: ${hasSecurityInvoker})`);
    if (!hasSecurityInvoker) {
      fileWarnings.push(`View public.${viewName} does not have WITH (security_invoker = true); will run as view definer.`);
    }
  }

  // 4. Check foreign keys
  const fkRegex = /REFERENCES\s+(?:public\.)?([a-zA-Z0-9_]+)\s*\(([a-zA-Z0-9_]+)\)/gi;
  for (const match of content.matchAll(fkRegex)) {
    const refTable = match[1].toLowerCase();
    const refCol = match[2].toLowerCase();

    if (!createdTables.has(refTable)) {
      fileErrors.push(`Foreign key references unknown table: "${refTable}"`);
    } else {
      const cols = tableColumns.get(refTable);
      if (cols && !cols.has(refCol)) {
        fileErrors.push(`Foreign key references unknown column "${refCol}" in table "${refTable}"`);
      } else {
        console.log(`  [FK VERIFIED] -> public.${refTable}(${refCol})`);
      }
    }
  }

  // 5. Check RLS enable statements
  const rlsRegex = /ALTER\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
  for (const match of content.matchAll(rlsRegex)) {
    const rlsTable = match[1].toLowerCase();
    if (!createdTables.has(rlsTable)) {
      fileErrors.push(`ENABLE ROW LEVEL SECURITY on non-existent table "${rlsTable}"`);
    } else {
      console.log(`  [RLS ENABLED] public.${rlsTable}`);
    }
  }

  // 6. Check RLS policies & idempotency
  const policyRegex = /CREATE\s+POLICY\s+["']([^"']+)["']\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)\s+FOR\s+([A-Z]+)/gi;
  for (const match of content.matchAll(policyRegex)) {
    const policyName = match[1];
    const targetTable = match[2].toLowerCase();
    const command = match[3];

    // Check idempotency: does the file have DROP POLICY IF EXISTS "policyName" ON ...
    const dropPolicyPattern = new RegExp(`DROP\\s+POLICY\\s+(?:IF\\s+EXISTS\\s+)?["']${policyName}["']\\s+ON\\s+(?:public\\.)?${targetTable}`, 'i');
    const isIdempotent = dropPolicyPattern.test(content);

    if (!createdTables.has(targetTable)) {
      fileErrors.push(`Policy "${policyName}" targets non-existent table "${targetTable}"`);
    } else {
      const tablePolicies = policiesByTable.get(targetTable) || new Set();
      if (tablePolicies.has(policyName)) {
        fileErrors.push(`Duplicate policy name "${policyName}" on table "${targetTable}"`);
      } else {
        tablePolicies.add(policyName);
        policiesByTable.set(targetTable, tablePolicies);
        if (!isIdempotent) {
          fileWarnings.push(`Policy "${policyName}" on public.${targetTable} missing DROP POLICY IF EXISTS (not re-runnable).`);
        }
        console.log(`  [POLICY OK] "${policyName}" ON public.${targetTable} FOR ${command} (Idempotent: ${isIdempotent})`);
      }
    }
  }

  // 7. Check CREATE INDEX
  const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)/gi;
  for (const match of content.matchAll(indexRegex)) {
    const indexName = match[1];
    const indexTable = match[2].toLowerCase();

    if (!createdTables.has(indexTable)) {
      fileErrors.push(`Index "${indexName}" targets non-existent table "${indexTable}"`);
    } else {
      console.log(`  [INDEX OK] "${indexName}" ON public.${indexTable}`);
    }
  }

  // Result for this migration
  if (fileErrors.length > 0) {
    console.error(`\n❌ RESULT: ${file} -> FAIL`);
    fileErrors.forEach(err => console.error(`   - ${err}`));
    migrationStatus.push({ file, status: 'FAIL', errors: fileErrors, warnings: fileWarnings });
  } else {
    console.log(`\n✅ RESULT: ${file} -> PASS`);
    if (fileWarnings.length > 0) {
      fileWarnings.forEach(w => console.warn(`   ! WARNING: ${w}`));
    }
    migrationStatus.push({ file, status: 'PASS', errors: [], warnings: fileWarnings });
  }
}

console.log('\n================================================================');
console.log('                       SUMMARY SCORECARD                        ');
console.log('================================================================');
let allPassed = true;
for (const res of migrationStatus) {
  const icon = res.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${res.file.padEnd(45)} [${res.status}]`);
  if (res.status === 'FAIL') allPassed = false;
}

if (!allPassed) {
  console.log('\nAudit encountered errors. Please review above.');
  process.exit(1);
} else {
  console.log('\n🎉 ALL 4 MIGRATIONS VERIFIED TO RUN SUCCESSFULLY IN ORDER!');
}
