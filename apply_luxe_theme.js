const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const frontendSrcDir = path.join(__dirname, 'frontend/src');

const replacements = [
  // Backgrounds
  { regex: /\bbg-white\b/g, replace: 'bg-obsidian-700' }, // Base card background
  { regex: /\bbg-gray-50\b/g, replace: 'bg-obsidian-900' },
  { regex: /\bbg-gray-100\b/g, replace: 'bg-obsidian-800' },
  { regex: /\bbg-slate-50\b/g, replace: 'bg-obsidian-900' },
  
  // Text Colors
  { regex: /\btext-gray-900\b/g, replace: 'text-white' },
  { regex: /\btext-gray-800\b/g, replace: 'text-white' },
  { regex: /\btext-gray-700\b/g, replace: 'text-slate-300' },
  { regex: /\btext-gray-600\b/g, replace: 'text-slate-400' },
  { regex: /\btext-gray-500\b/g, replace: 'text-slate-500' },
  { regex: /\btext-black\b/g, replace: 'text-white' },
  
  // Borders
  { regex: /\bborder-gray-100\b/g, replace: 'border-white/[0.06]' },
  { regex: /\bborder-gray-200\b/g, replace: 'border-white/10' },
  { regex: /\bborder-gray-300\b/g, replace: 'border-white/14' },
  
  // Dividers
  { regex: /\bdivide-gray-100\b/g, replace: 'divide-white/5' },
  { regex: /\bdivide-gray-200\b/g, replace: 'divide-white/10' },
];

let modifiedCount = 0;

walkDir(frontendSrcDir, (filePath) => {
  if (filePath.endsWith('.tsx')) {
    // Exclude the ContractEditor.tsx where we WANT white paper
    if (filePath.includes('ContractEditor.tsx') || filePath.includes('ContractViewer.tsx')) {
      return; 
    }
    // Also skip DashboardPage and AppShell as they are already styled
    if (filePath.includes('DashboardPage.tsx') || filePath.includes('AppShell.tsx')) {
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Apply simple class replacements
    replacements.forEach(({ regex, replace }) => {
      content = content.replace(regex, replace);
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedCount++;
      console.log(`Modified ${filePath}`);
    }
  }
});

console.log(`Total files modified: ${modifiedCount}`);
