const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

// Helper to walk directory
function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath, callback);
    } else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
      callback(dirPath);
    }
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Fix Badge & Status Constant Maps
  // ContractDetailPage.tsx
  if (filePath.endsWith('ContractDetailPage.tsx')) {
    content = content.replace(/'bg-purple-100 text-purple-700 border-purple-200'/g, "'bg-sky-500/10 text-sky-300 border-sky-500/20'");
    content = content.replace(/'bg-blue-100 text-blue-700 border-blue-200'/g, "'bg-sky-500/10 text-sky-300 border-sky-500/20'");
    content = content.replace(/'bg-cyan-100 text-cyan-700 border-cyan-200'/g, "'bg-sky-500/10 text-sky-300 border-sky-500/20'");
    content = content.replace(/'bg-teal-100 text-teal-700 border-teal-200'/g, "'bg-sky-500/10 text-sky-300 border-sky-500/20'");
    content = content.replace(/'bg-orange-100 text-orange-700 border-orange-200'/g, "'bg-sky-500/10 text-sky-300 border-sky-500/20'");
    content = content.replace(/'bg-green-100 text-green-700 border-green-200'/g, "'bg-sky-500/10 text-sky-300 border-sky-500/20'");
    content = content.replace(/'bg-indigo-100 text-indigo-700 border-indigo-200'/g, "'bg-sky-500/10 text-sky-300 border-sky-500/20'");
    content = content.replace(/'bg-yellow-100 text-yellow-700 border-yellow-200'/g, "'bg-sky-500/10 text-sky-300 border-sky-500/20'");
    
    content = content.replace(/'bg-red-100 text-red-700 border border-red-200'/g, "'bg-rose-500/10 text-rose-300 border border-rose-500/20'");
    content = content.replace(/'bg-emerald-100 text-emerald-700 border border-emerald-200'/g, "'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'");
    content = content.replace(/'bg-amber-100 text-amber-700 border border-amber-200'/g, "'bg-amber-500/10 text-amber-300 border border-amber-500/20'");

    // Banners and badges in ContractDetailPage
    content = content.replace(/bg-blue-100 text-blue-700 ring-2 ring-blue-400/g, "bg-sky-500/10 text-sky-300 ring-2 ring-sky-500/20");
    content = content.replace(/border-amber-300 bg-amber-50[\s\S]*?text-amber-900/g, "border-amber-500/25 bg-amber-500/10 text-amber-300");
    content = content.replace(/bg-red-50 text-red-600/g, "bg-rose-500/10 text-rose-300");
    content = content.replace(/bg-amber-50 text-amber-600/g, "bg-amber-500/10 text-amber-300");
    content = content.replace(/bg-emerald-50 text-emerald-600/g, "bg-emerald-500/10 text-emerald-300");
    content = content.replace(/text-blue-500\/50/g, "text-sky-300");
    content = content.replace(/bg-blue-500\/30/g, "bg-sky-500/10");
    content = content.replace(/bg-indigo-50 border-indigo-200 text-indigo-800/g, "bg-sky-500/10 border-sky-500/20 text-sky-300");
    content = content.replace(/bg-blue-50 border-blue-200 text-blue-800/g, "bg-sky-500/10 border-sky-500/20 text-sky-300");
    content = content.replace(/bg-amber-50 border-amber-200 text-amber-800/g, "bg-amber-500/10 border-amber-500/20 text-amber-300");
    content = content.replace(/hover:bg-blue-50/g, "hover:bg-obsidian-800");
    content = content.replace(/bg-blue-50 text-blue-700/g, "bg-sky-500/10 text-sky-300");
    content = content.replace(/bg-gradient-to-r from-blue-50 to-indigo-50/g, "bg-obsidian-800 border-b border-white/10");
    content = content.replace(/bg-amber-50 text-amber-700 border-amber-200/g, "bg-amber-500/10 text-amber-300 border-amber-500/20");
    content = content.replace(/bg-gray-900/g, "bg-obsidian-700");
    content = content.replace(/bg-purple-100 text-purple-700/g, "bg-sky-500/10 text-sky-300");
    content = content.replace(/border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800/g, "border-sky-500/20 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300");
    content = content.replace(/hover:bg-gray-200/g, "hover:bg-white/10");
    content = content.replace(/opacity-60 cursor-not-allowed/g, "text-slate-500 cursor-not-allowed");
    content = content.replace(/disabled:opacity-50/g, "disabled:text-slate-500 disabled:bg-white/5");
  }

  // RequestsPage.tsx
  if (filePath.endsWith('RequestsPage.tsx')) {
    content = content.replace(/'bg-blue-50 text-blue-700'/g, "'bg-sky-500/10 text-sky-300 border border-sky-500/20'");
    content = content.replace(/'bg-amber-50 text-amber-700'/g, "'bg-amber-500/10 text-amber-300 border border-amber-500/20'");
    content = content.replace(/'bg-green-50 text-green-700'/g, "'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'");
    content = content.replace(/'bg-red-50 text-red-600'/g, "'bg-rose-500/10 text-rose-300 border border-rose-500/20'");
    content = content.replace(/'bg-orange-50 text-orange-700'/g, "'bg-amber-500/10 text-amber-300 border border-amber-500/20'");
    
    content = content.replace(/'bg-blue-50 text-blue-600'/g, "'bg-sky-500/10 text-sky-300 border border-sky-500/20'");
    content = content.replace(/'bg-red-50 text-red-600'/g, "'bg-rose-500/10 text-rose-300 border border-rose-500/20'");

    const pastelColors = ['purple', 'blue', 'cyan', 'teal', 'orange', 'pink', 'indigo', 'violet', 'green', 'yellow'];
    pastelColors.forEach(color => {
      content = content.replace(new RegExp(`'bg-${color}-100'`, 'g'), "'bg-sky-500/10 text-sky-300 border border-sky-500/20'");
    });

    content = content.replace(/bg-blue-100 text-blue-700/g, "bg-sky-500/10 text-sky-300 border border-sky-500/20");
    content = content.replace(/text-blue-500 bg-blue-50/g, "text-sky-300 bg-sky-500/10");
  }

  // MattersPage.tsx
  if (filePath.endsWith('MattersPage.tsx')) {
    content = content.replace(/hover:border-indigo-300 hover:bg-indigo-50\/30/g, "hover:border-sky-500/30 hover:bg-sky-500/10");
    content = content.replace(/bg-emerald-50 text-emerald-700 border-emerald-200/g, "bg-emerald-500/10 text-emerald-300 border-emerald-500/20");
    content = content.replace(/bg-amber-50 text-amber-700 border-amber-200/g, "bg-amber-500/10 text-amber-300 border-amber-500/20");
    content = content.replace(/text-indigo-700 bg-indigo-50 border-indigo-200/g, "text-sky-300 bg-sky-500/10 border-sky-500/20");
    content = content.replace(/opacity-0 group-hover:opacity-100/g, "opacity-0 group-hover:opacity-100 focus-visible:opacity-100");
    // Fix CSS variables
    content = content.replace(/bg-background/g, "bg-obsidian-900");
    content = content.replace(/bg-card/g, "bg-obsidian-700");
    content = content.replace(/border-border/g, "border-white/10");
    content = content.replace(/text-muted-foreground/g, "text-slate-400");
    content = content.replace(/text-foreground/g, "text-white");
    content = content.replace(/bg-red-50/g, "bg-rose-500/10");
    content = content.replace(/text-red-700/g, "text-rose-300");
  }

  // ApprovalsPage.tsx
  if (filePath.endsWith('ApprovalsPage.tsx')) {
    content = content.replace(/border-white\/\[0\.06\]/g, "border-white/10");
    content = content.replace(/border-amber-300 bg-amber-50/g, "border-amber-500/25 bg-amber-500/10");
    content = content.replace(/text-amber-900/g, "text-amber-300");
    content = content.replace(/text-amber-800\/80/g, "text-amber-300");
    content = content.replace(/hover:text-amber-950/g, "hover:text-amber-200");
    content = content.replace(/border-emerald-500 bg-emerald-50 text-emerald-700/g, "border-emerald-500/20 bg-emerald-500/10 text-emerald-300");
    content = content.replace(/border-red-500 bg-red-50 text-red-700/g, "border-rose-500/20 bg-rose-500/10 text-rose-300");
    content = content.replace(/bg-blue-50 border-blue-200/g, "bg-sky-500/10 border-sky-500/20");
    content = content.replace(/focus:ring-1 focus:ring-blue-400/g, "focus:ring-2 focus:ring-brass-400");
  }

  // SettingsPage.tsx
  if (filePath.endsWith('SettingsPage.tsx')) {
    content = content.replace(/'bg-blue-50 text-blue-700 border-blue-200'/g, "'bg-sky-500/10 text-sky-300 border-sky-500/20'");
    content = content.replace(/'bg-purple-50'/g, "'bg-sky-500/10 border border-sky-500/20 text-sky-300'");
    content = content.replace(/'bg-green-50'/g, "'bg-sky-500/10 border border-sky-500/20 text-sky-300'");
    content = content.replace(/'bg-amber-50'/g, "'bg-sky-500/10 border border-sky-500/20 text-sky-300'");
    content = content.replace(/'bg-orange-50'/g, "'bg-sky-500/10 border border-sky-500/20 text-sky-300'");
    content = content.replace(/'bg-pink-50'/g, "'bg-sky-500/10 border border-sky-500/20 text-sky-300'");
    content = content.replace(/text-slate-400 hover:bg-obsidian-800/g, "text-slate-300 hover:bg-obsidian-800");
    content = content.replace(/border-2 border-blue-200/g, "border border-white/10");
    content = content.replace(/border-blue-500 bg-blue-50 text-blue-700/g, "border-sky-500 bg-sky-500/10 text-sky-300");
    content = content.replace(/bg-red-50 border-red-200/g, "bg-rose-500/10 border-rose-500/20");
    content = content.replace(/text-red-700/g, "text-rose-300");
    content = content.replace(/hover:bg-red-50/g, "hover:bg-rose-500/10");
    content = content.replace(/text-red-600/g, "text-rose-300");
    content = content.replace(/border-blue-500 bg-blue-50 ring-2 ring-blue-500\/20/g, "border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/20");
    content = content.replace(/text-blue-700/g, "text-sky-300");
    content = content.replace(/bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/g, "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20");
    content = content.replace(/bg-red-50 text-red-700 ring-1 ring-red-200/g, "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20");
  }

  // ApprovalCard.tsx
  if (filePath.endsWith('ApprovalCard.tsx')) {
    content = content.replace(/'bg-yellow-50 border-yellow-200 text-yellow-800'/g, "'bg-amber-500/10 border-amber-500/20 text-amber-300'");
    content = content.replace(/'bg-orange-50 border-orange-200 text-orange-800'/g, "'bg-amber-500/10 border-amber-500/20 text-amber-300'");
    content = content.replace(/'bg-red-50 border-red-200 text-red-800'/g, "'bg-rose-500/10 border-rose-500/20 text-rose-300'");
    content = content.replace(/'bg-red-100 border-red-400 text-red-900'/g, "'bg-rose-500/20 border-rose-500/30 text-rose-400'");
    content = content.replace(/'text-emerald-700 bg-emerald-50'/g, "'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'");
    content = content.replace(/'text-amber-700 bg-amber-50'/g, "'text-amber-300 bg-amber-500/10 border border-amber-500/20'");
    content = content.replace(/'text-red-700 bg-red-50'/g, "'text-rose-300 bg-rose-500/10 border border-rose-500/20'");
    content = content.replace(/bg-blue-100 text-blue-700/g, "bg-sky-500/10 text-sky-300 border border-sky-500/20");
    content = content.replace(/text-emerald-700 border-emerald-300 hover:bg-emerald-50/g, "text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10");
    content = content.replace(/text-red-600 border-red-300 hover:bg-red-50/g, "text-rose-300 border-rose-500/30 hover:bg-rose-500/10");
    content = content.replace(/text-red-600/g, "text-rose-300");
  }

  // DecisionStrip.tsx
  if (filePath.endsWith('DecisionStrip.tsx')) {
    content = content.replace(/'text-emerald-700 bg-emerald-50 border-emerald-200'/g, "'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'");
    content = content.replace(/'text-amber-700 bg-amber-50 border-amber-200'/g, "'text-amber-300 bg-amber-500/10 border-amber-500/20'");
    content = content.replace(/'text-red-700 bg-red-50 border-red-200'/g, "'text-rose-300 bg-rose-500/10 border-rose-500/20'");
    content = content.replace(/border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50\/40/g, "border-white/10 bg-obsidian-800");
    content = content.replace(/border-red-200 text-red-700 hover:bg-red-50/g, "border-rose-500/20 text-rose-300 hover:bg-rose-500/10");
    content = content.replace(/opacity-60/g, "text-slate-500");
  }

  // StatusPill.tsx
  if (filePath.endsWith('StatusPill.tsx')) {
    content = content.replace(/text-red-700/g, "text-rose-300");
    content = content.replace(/text-amber-700/g, "text-amber-300");
    content = content.replace(/text-emerald-700/g, "text-emerald-300");
    content = content.replace(/text-blue-700/g, "text-sky-300");
    content = content.replace(/bg-gray-200/g, "bg-white/10");
  }

  // FocusedReviewDrawer.tsx
  if (filePath.endsWith('FocusedReviewDrawer.tsx')) {
    content = content.replace(/'bg-emerald-50 text-emerald-700'/g, "'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'");
    content = content.replace(/'bg-blue-50 text-blue-700'/g, "'bg-sky-500/10 text-sky-300 border border-sky-500/20'");
    content = content.replace(/'bg-amber-50 text-amber-700'/g, "'bg-amber-500/10 text-amber-300 border border-amber-500/20'");
    content = content.replace(/'bg-red-50 text-red-700'/g, "'bg-rose-500/10 text-rose-300 border border-rose-500/20'");
  }

  // Sidebar.tsx
  if (filePath.endsWith('Sidebar.tsx')) {
    content = content.replace(/text-slate-500 opacity-60/g, "text-slate-500");
    content = content.replace(/opacity-60/g, "text-slate-500");
  }

  // LoginPage.tsx
  if (filePath.endsWith('LoginPage.tsx')) {
    content = content.replace(/bg-obsidian-700\/\[0\.03\]/g, "bg-white/[0.03]");
    content = content.replace(/bg-obsidian-700\/\[0\.02\]/g, "bg-white/[0.03]");
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Modified ${filePath}`);
  }
}

walk(SRC_DIR, processFile);
