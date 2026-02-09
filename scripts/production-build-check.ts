#!/usr/bin/env tsx

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { logger } from '../server/utils/logger';

interface BuildCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

const ALLOWED_COMMANDS = ['npm', 'npx'] as const;
type AllowedCommand = typeof ALLOWED_COMMANDS[number];

function isAllowedCommand(command: string): command is AllowedCommand {
  return ALLOWED_COMMANDS.includes(command as AllowedCommand);
}

async function runCommand(command: AllowedCommand, args: string[]): Promise<{ success: boolean; output: string }> {
  if (!isAllowedCommand(command)) {
    return { success: false, output: `Command not allowed: ${command}` };
  }
  
  return new Promise((resolve) => {
    const proc = spawn(command, args, { stdio: 'pipe' });
    let output = '';
    
    proc.stdout?.on('data', (data) => output += data.toString());
    proc.stderr?.on('data', (data) => output += data.toString());
    
    proc.on('close', (code) => {
      resolve({ success: code === 0, output });
    });
  });
}

async function checkClientBuild(): Promise<BuildCheck> {
  try {
    const result = await runCommand('npm', ['run', 'build:client']);
    
    if (!result.success) {
      return {
        name: 'Client Build',
        status: 'fail',
        message: 'Client build failed',
        details: result.output
      };
    }
    
    if (existsSync('client/dist')) {
      return {
        name: 'Client Build',
        status: 'pass',
        message: 'Client build successful'
      };
    }
    
    return {
      name: 'Client Build',
      status: 'warning',
      message: 'Build completed but dist folder not found'
    };
  } catch (error: any) {
    return {
      name: 'Client Build',
      status: 'fail',
      message: `Build error: ${error.message}`
    };
  }
}

async function checkServerBuild(): Promise<BuildCheck> {
  try {
    const result = await runCommand('npm', ['run', 'build:server']);
    
    if (!result.success) {
      return {
        name: 'Server Build',
        status: 'fail',
        message: 'Server build failed',
        details: result.output
      };
    }
    
    return {
      name: 'Server Build',
      status: 'pass',
      message: 'Server build successful'
    };
  } catch (error: any) {
    return {
      name: 'Server Build',
      status: 'fail',
      message: `Build error: ${error.message}`
    };
  }
}

async function checkLinting(): Promise<BuildCheck> {
  try {
    const result = await runCommand('npm', ['run', 'lint']);
    
    if (!result.success) {
      return {
        name: 'Code Linting',
        status: 'warning',
        message: 'Linting issues found',
        details: result.output
      };
    }
    
    return {
      name: 'Code Linting',
      status: 'pass',
      message: 'No linting issues'
    };
  } catch (error: any) {
    return {
      name: 'Code Linting',
      status: 'fail',
      message: `Linting error: ${error.message}`
    };
  }
}

async function checkTypeScript(): Promise<BuildCheck> {
  try {
    const result = await runCommand('npx', ['tsc', '--noEmit']);
    
    if (!result.success) {
      return {
        name: 'TypeScript Check',
        status: 'fail',
        message: 'TypeScript errors found',
        details: result.output
      };
    }
    
    return {
      name: 'TypeScript Check',
      status: 'pass',
      message: 'No TypeScript errors'
    };
  } catch (error: any) {
    return {
      name: 'TypeScript Check',
      status: 'fail',
      message: `TypeScript check error: ${error.message}`
    };
  }
}

async function checkDependencies(): Promise<BuildCheck> {
  try {
    const result = await runCommand('npm', ['audit']);
    
    if (result.output.includes('high') || result.output.includes('critical')) {
      return {
        name: 'Dependency Security',
        status: 'warning',
        message: 'Security vulnerabilities found',
        details: result.output
      };
    }
    
    return {
      name: 'Dependency Security',
      status: 'pass',
      message: 'No critical vulnerabilities'
    };
  } catch (error: any) {
    return {
      name: 'Dependency Security',
      status: 'fail',
      message: `Audit error: ${error.message}`
    };
  }
}

async function main() {
  console.log('🔍 Production Build Error and Bug Check');
  console.log('=====================================\n');

  const checks = await Promise.all([
    checkClientBuild(),
    checkServerBuild(),
    checkLinting(),
    checkTypeScript(),
    checkDependencies()
  ]);

  const passed = checks.filter(c => c.status === 'pass').length;
  const warnings = checks.filter(c => c.status === 'warning').length;
  const failed = checks.filter(c => c.status === 'fail').length;

  // Display results
  for (const check of checks) {
    const icon = check.status === 'pass' ? '✅' : 
                check.status === 'warning' ? '⚠️' : '❌';
    
    console.log(`${icon} ${check.name}: ${check.message}`);
    if (check.details) {
      console.log(`   Details: ${check.details.slice(0, 200)}${check.details.length > 200 ? '...' : ''}`);
    }
    console.log();
  }

  // Summary
  console.log('📊 Build Check Summary:');
  console.log(`✅ Passed: ${passed}/${checks.length}`);
  console.log(`⚠️  Warnings: ${warnings}/${checks.length}`);
  console.log(`❌ Failed: ${failed}/${checks.length}\n`);

  if (failed === 0 && warnings <= 1) {
    console.log('🎉 BUILD READY FOR PRODUCTION');
    console.log('All critical checks passed. Ready for deployment.');
  } else if (failed === 0) {
    console.log('⚠️  BUILD READY WITH WARNINGS');
    console.log('Build is functional but has minor issues.');
  } else {
    console.log('❌ BUILD NOT READY');
    console.log('Critical issues must be resolved before production.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
