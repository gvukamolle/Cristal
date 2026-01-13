#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read manifest.json to get the plugin ID
const manifestPath = path.join(__dirname, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const pluginId = manifest.id;

// Get vault path from command line or use default
const vaultPath = process.argv[2] || '/Users/timofeygrushko/Documents/Big Base';
const pluginsDir = path.join(vaultPath, '.obsidian', 'plugins');
const pluginDir = path.join(pluginsDir, pluginId);

// Ensure plugins directory exists
if (!fs.existsSync(pluginsDir)) {
  console.error(`❌ Plugins directory not found: ${pluginsDir}`);
  console.error('Please provide a valid vault path as argument:');
  console.error('  npm run install "/path/to/vault"');
  process.exit(1);
}

// Remove existing plugin directory/symlink if exists
if (fs.existsSync(pluginDir)) {
  const stats = fs.lstatSync(pluginDir);
  if (stats.isSymbolicLink()) {
    fs.unlinkSync(pluginDir);
    console.log(`🗑️  Removed existing symlink: ${pluginDir}`);
  } else {
    console.error(`❌ Plugin directory already exists (not a symlink): ${pluginDir}`);
    console.error('Please remove it manually first.');
    process.exit(1);
  }
}

// Create symlink
try {
  fs.symlinkSync(__dirname, pluginDir);
  console.log(`✅ Plugin installed successfully!`);
  console.log(`   Plugin ID: ${pluginId}`);
  console.log(`   Symlink: ${pluginDir} -> ${__dirname}`);
  console.log(`\n🔄 Reload Obsidian (Cmd+R) to activate the plugin.`);
} catch (error) {
  console.error(`❌ Failed to create symlink: ${error.message}`);
  process.exit(1);
}
