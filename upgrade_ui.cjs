const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Imports
code = code.replace(/import \{ \n  Wallet,/g, "import { motion, AnimatePresence } from 'motion/react';\nimport { \n  Sun,\n  Moon,\n  Wallet,");

// 2. State
const stateInjection = `  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);
`;

code = code.replace(/export default function App\(\) \{\n/g, `export default function App() {\n${stateInjection}\n`);

// 3. Dark mode replacements
code = code.replace(/bg-white/g, 'bg-white dark:bg-slate-900');
code = code.replace(/bg-\[\#f8fafc\]/g, 'bg-[#f8fafc] dark:bg-[#0f172a]'); // slate-950/900 equivalent
code = code.replace(/text-slate-900/g, 'text-slate-900 dark:text-slate-50');
code = code.replace(/text-slate-800/g, 'text-slate-800 dark:text-slate-100');
code = code.replace(/text-slate-700/g, 'text-slate-700 dark:text-slate-200');
code = code.replace(/text-slate-600/g, 'text-slate-600 dark:text-slate-300');
code = code.replace(/text-slate-500/g, 'text-slate-500 dark:text-slate-400');
code = code.replace(/text-slate-400/g, 'text-slate-400 dark:text-slate-500');
code = code.replace(/border-slate-200/g, 'border-slate-200 dark:border-slate-700/50');
code = code.replace(/border-slate-300/g, 'border-slate-300 dark:border-slate-700');
code = code.replace(/bg-slate-100/g, 'bg-slate-100 dark:bg-slate-800');
code = code.replace(/bg-slate-50 /g, 'bg-slate-50 dark:bg-slate-800/50 ');
code = code.replace(/bg-slate-50\/60/g, 'bg-slate-50/60 dark:bg-slate-800/40');
code = code.replace(/hover:bg-slate-50/g, 'hover:bg-slate-50 dark:hover:bg-slate-800');

// 4. Header & Theme Toggle
const headerReplacement = `          {/* Date Range & Theme Toggle */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-md px-2 focus-within:ring-2 focus-within:ring-teal-500 transition-shadow">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-2">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none px-2 py-1.5 text-sm font-medium w-full sm:w-36 focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-200 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-md px-2 focus-within:ring-2 focus-within:ring-teal-500 transition-shadow">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-2">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none px-2 py-1.5 text-sm font-medium w-full sm:w-36 focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-200 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-110 active:scale-95"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>`;

code = code.replace(/\{\/\* Date Range Selection tools \*\/\}[\s\S]*?<\/div>\n          <\/div>/m, headerReplacement);

// 5. Main container animation
code = code.replace(/<main className="flex-1 max-w-6xl mx-auto px-5 py-8 w-full">/g, '<motion.main \n        initial={{ opacity: 0, y: 20 }}\n        animate={{ opacity: 1, y: 0 }}\n        transition={{ duration: 0.5, ease: "easeOut" }}\n        className="flex-1 max-w-6xl mx-auto px-5 py-8 w-full">');
code = code.replace(/<\/main>/g, '</motion.main>');

// 6. Refined Card styling (shadows, rounded-2xl, hover states)
code = code.replace(/rounded-xl/g, 'rounded-2xl');
code = code.replace(/shadow-sm/g, 'shadow-lg shadow-slate-200/40 dark:shadow-slate-900/50 hover:shadow-xl dark:hover:shadow-black/50 transition-all duration-300');
code = code.replace(/shadow-md/g, 'shadow-xl shadow-slate-200/50 dark:shadow-slate-900/60');
code = code.replace(/border /g, 'border border-slate-200/60 dark:border-slate-700/50 ');

// Buttons & Elements hover scale
code = code.replace(/hover:bg-teal-600/g, 'hover:bg-teal-600 hover:scale-[1.02] active:scale-[0.98] transition-all');
code = code.replace(/hover:bg-rose-600/g, 'hover:bg-rose-600 hover:scale-[1.02] active:scale-[0.98] transition-all');
code = code.replace(/cursor-pointer/g, 'cursor-pointer hover:scale-105 active:scale-95 transition-transform');

// 7. Staggered list for transactions
const listInjectionRegex = /<div className="divide-y divide-slate-200 dark:divide-slate-700\/50">\s*\{filteredTransactions\.map\(\(tx\) => \{[\s\S]*?return \(\s*<div\s*key=\{tx\.id\}\s*className="grid grid-cols-\[100px_1fr_120px_140px_100px\] gap-4 p-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"\s*>/m;
const listInjectionFallbackRegex = /<div className="divide-y divide-slate-200 dark:divide-slate-700\/50">\s*\{filteredTransactions\.map\(\(tx\) => \{/m;

// Because we replaced some strings earlier (like border-slate-200), we just use a generic matcher for the map
code = code.replace(/<div className="divide-y(.*?)>\s*\{filteredTransactions\.map\(\(tx\) => \{[\s\S]*?return \(\s*<div\s*key=\{tx\.id\}\s*className="(.*?grid-cols-.*?)"\s*>/m, (match, divideClasses, gridClasses) => {
  return `<div className="divide-y${divideClasses}>\n                <AnimatePresence>\n                {filteredTransactions.map((tx, index) => {\n                  const cat = CATEGORIES.find(c => c.name === tx.category) || CATEGORIES[6];\n                  return (\n                    <motion.div \n                      key={tx.id}\n                      initial={{ opacity: 0, x: -10 }}\n                      animate={{ opacity: 1, x: 0 }}\n                      exit={{ opacity: 0, scale: 0.95 }}\n                      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.5) }}\n                      className="${gridClasses}"\n                    >`;
});

code = code.replace(/<\/div>\n\s*\);\n\s*\}\)\}\n\s*<\/div>/m, '</motion.div>\n                  );\n                })}\n                </AnimatePresence>\n              </div>');


fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx transformed successfully!");
