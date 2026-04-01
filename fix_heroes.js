#!/usr/bin/env node
const fs = require('fs');
const file = '/Users/jamespitts/Downloads/aa2-scan/app/(tabs)/index.tsx';

let content = fs.readFileSync(file, 'utf8');

// Fix 1: tab-scan.png does not exist — set to null
content = content.replace(
  /scan:\s+require\(['"].*tab-scan\.png['"]\)/,
  "scan:       null"
);

// Fix 2: tab-species.png does not exist — set to null  
content = content.replace(
  /species:\s+require\(['"].*tab-species\.png['"]\)/,
  "species:    null"
);

// Fix 3: tab-horse is .jpg not .png
content = content.replace(
  /horse:\s+require\(['"].*tab-horse\.png['"]\)/,
  "horse:      require('../../assets/images/tab-horse.jpg')"
);

fs.writeFileSync(file, content, 'utf8');

// Verify
const lines = content.split('\n').filter(l => l.includes('TAB_HEROES') || l.includes('tab-'));
console.log('✅ Fixed. Verify:');
lines.forEach(l => console.log(' ', l.trim()));
