const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
====================================================================
  วิธีเอา Connection String จาก Supabase:
  1. ไปที่ Supabase Dashboard -> Settings -> Database
  2. เลื่อนลงมาที่หัวข้อ "Connection string" แล้วเลือกแท็บ "URI"
  3. ติ๊กถูกที่ "Use connection pooling" (ให้แน่ใจว่าเป็น Transaction mode)
  4. ก๊อปปี้ URL มาวางได้เลย (อย่าลืมแก้ [YOUR-PASSWORD] เป็นรหัสผ่านจริง)
====================================================================
`);

rl.question('กรุณาวาง Transaction Pooler Connection String: ', (connectionString) => {
  rl.close();
  
  if (!connectionString || !connectionString.startsWith('postgres')) {
    console.error('❌ รูปแบบ Connection String ไม่ถูกต้อง');
    process.exit(1);
  }

  const client = new Client({
    connectionString: connectionString.trim(),
    ssl: { rejectUnauthorized: false }
  });

  console.log('🔄 กำลังเชื่อมต่อกับ Supabase Database...');

  client.connect()
    .then(async () => {
      console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ! กำลังดึงข้อมูลโครงสร้าง...');

      // 1. ดึง Functions (RPCs) และ Triggers
      console.log('📥 กำลังดึงข้อมูล Database Functions...');
      const funcRes = await client.query(`
        SELECT 
          p.proname as function_name,
          pg_get_functiondef(p.oid) as function_definition
        FROM 
          pg_proc p
        JOIN 
          pg_namespace n ON p.pronamespace = n.oid
        WHERE 
          n.nspname = 'public'
          AND p.prokind = 'f';
      `);

      let functionsSql = `-- ============================================================
-- ICSN Playgroup - Database Functions & RPCs (Auto-generated)
-- Generated on: ${new Date().toISOString()}
-- ============================================================

`;
      funcRes.rows.forEach(row => {
        functionsSql += `-- Function: ${row.function_name}\n${row.function_definition};\n\n`;
      });

      fs.writeFileSync(path.join(__dirname, 'functions.sql'), functionsSql, 'utf8');
      console.log('💾 บันทึกไฟล์ database/functions.sql เรียบร้อย');

      // 2. ดึง RLS Policies
      console.log('📥 กำลังดึงข้อมูล RLS Policies...');
      const policyRes = await client.query(`
        SELECT 
          tablename,
          policyname,
          cmd,
          roles,
          qual,
          with_check
        FROM 
          pg_policies
        WHERE 
          schemaname = 'public';
      `);

      let policiesSql = `-- ============================================================
-- ICSN Playgroup - RLS Policies (Auto-generated)
-- Generated on: ${new Date().toISOString()}
-- ============================================================

`;
      policyRes.rows.forEach(row => {
        let rolesList = 'public';
        if (Array.isArray(row.roles)) {
          rolesList = row.roles.join(', ');
        } else if (typeof row.roles === 'string') {
          rolesList = row.roles.replace(/^{|}$/g, '').replace(/,/g, ', ');
        }
        policiesSql += `-- Table: ${row.tablename} | Policy: ${row.policyname}\n`;
        policiesSql += `CREATE POLICY "${row.policyname}" ON public.${row.tablename} \n`;
        policiesSql += `AS PERMISSIVE FOR ${row.cmd} TO ${rolesList}\n`;
        if (row.qual) policiesSql += `USING (${row.qual})\n`;
        if (row.with_check) policiesSql += `WITH CHECK (${row.with_check});\n`;
        policiesSql += `;\n\n`;
      });

      fs.writeFileSync(path.join(__dirname, 'policies.sql'), policiesSql, 'utf8');
      console.log('💾 บันทึกไฟล์ database/policies.sql เรียบร้อย');

      // 3. ดึงโครงสร้าง Tables
      console.log('📥 กำลังดึงข้อมูลโครงสร้าง Tables...');
      const tableRes = await client.query(`
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM 
          information_schema.columns
        WHERE 
          table_schema = 'public'
        ORDER BY 
          table_name, ordinal_position;
      `);

      let tablesSql = `-- ============================================================
-- ICSN Playgroup - Tables Schema Reference (Auto-generated)
-- Generated on: ${new Date().toISOString()}
-- ============================================================

`;
      let currentTable = '';
      tableRes.rows.forEach(row => {
        if (currentTable !== row.table_name) {
          if (currentTable !== '') {
            tablesSql += `);\n\n`;
          }
          currentTable = row.table_name;
          tablesSql += `CREATE TABLE public.${currentTable} (\n`;
        } else {
          tablesSql += `,\n`;
        }
        
        let colDef = `  ${row.column_name} ${row.data_type}`;
        if (row.is_nullable === 'NO') colDef += ' NOT NULL';
        if (row.column_default) colDef += ` DEFAULT ${row.column_default}`;
        tablesSql += colDef;
      });
      if (currentTable !== '') {
        tablesSql += `\n);\n`;
      }

      fs.writeFileSync(path.join(__dirname, 'tables.sql'), tablesSql, 'utf8');
      console.log('💾 บันทึกไฟล์ database/tables.sql เรียบร้อย');

      console.log('🎉 เสร็จสิ้นกระบวนการสำรองข้อมูลโครงสร้าง Database (Docker-Free)!');
    })
    .catch(err => {
      console.error('❌ เกิดข้อผิดพลาด:', err.message);
    })
    .finally(() => {
      client.end();
    });
});
