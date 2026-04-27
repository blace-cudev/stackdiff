#!/usr/bin/env node
import { program } from 'commander';
import { getPackageJsonFromBranch, branchExists, getCurrentBranch } from './gitResolver';
import { parsePackageJson, flattenDependencies } from './packageParser';
import { diffDependencies } from './diffEngine';
import { generateReport, ReportOptions } from './reporter';

program
  .name('stackdiff')
  .description('Compare dependency trees across branches and surface breaking version changes')
  .version('1.0.0');

program
  .command('compare')
  .description('Compare dependencies between two branches')
  .argument('<base>', 'Base branch to compare from')
  .argument('[target]', 'Target branch to compare to (defaults to current branch)')
  .option('-f, --format <format>', 'Output format: text, json, markdown', 'text')
  .option('-b, --breaking-only', 'Show only breaking changes', false)
  .option('--no-color', 'Disable colored output')
  .action(async (base: string, target: string | undefined, options) => {
    try {
      const targetBranch = target ?? (await getCurrentBranch());

      if (!(await branchExists(base))) {
        console.error(`Error: Branch "${base}" does not exist.`);
        process.exit(1);
      }

      if (!(await branchExists(targetBranch))) {
        console.error(`Error: Branch "${targetBranch}" does not exist.`);
        process.exit(1);
      }

      const [baseRaw, targetRaw] = await Promise.all([
        getPackageJsonFromBranch(base),
        getPackageJsonFromBranch(targetBranch),
      ]);

      const basePkg = parsePackageJson(baseRaw);
      const targetPkg = parsePackageJson(targetRaw);

      const baseDeps = flattenDependencies(basePkg);
      const targetDeps = flattenDependencies(targetPkg);

      const diffs = diffDependencies(baseDeps, targetDeps);

      const reportOptions: ReportOptions = {
        format: options.format as 'text' | 'json' | 'markdown',
        showBreakingOnly: options.breakingOnly,
        color: options.color,
      };

      const report = generateReport(diffs, reportOptions);
      console.log(report);

      const hasBreaking = diffs.some((d) => d.breaking);
      process.exit(hasBreaking ? 1 : 0);
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : String(err));
      process.exit(2);
    }
  });

program.parse();
