const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// First, fix the AnimatePresence in the tabs
// Actually, let's just do a clean regex replacement for the tab content block

let newTabs = `{/* Content Tabs area */}
            <div className="p-6 overflow-hidden min-h-[250px] relative">
              <AnimatePresence mode="wait">
                {activeTab === 'receipt' && !isOffline && (
                  <motion.div
                    key="receipt"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={\`border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 text-center group cursor-pointer hover:scale-105 active:scale-95 transition-transform transition-all min-h-[190px] relative \${dragActive ? 'border-teal-400 bg-teal-50/20 dark:bg-[#111C34]/50' : 'border-slate-200 dark:border-[#1D2A43]/50 hover:border-teal-400 hover:bg-teal-50/20 dark:hover:bg-[#111C34]/50'}\`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/jpeg,image/png,image/webp" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageSelection(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      />
                      
                      <div className="w-12 h-12 bg-slate-50 dark:bg-[#111C34]/50 rounded-full flex items-center justify-center mb-3 group-hover:bg-white dark:bg-[#0B1324] text-slate-500 dark:text-slate-300 group-hover:text-teal-600 dark:text-teal-400 transition-colors">
                        <Upload className="w-6 h-6" />
                      </div>
                      
                      {selectedImage ? (
                        <p className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                          {selectedImage.name}
                        </p>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Drag & drop receipt image
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                            or click to browse files
                          </p>
                        </>
                      )}
                      
                      <span className="text-[10px] uppercase tracking-wider font-mono bg-teal-50 dark:bg-teal-500/20 text-teal-800 dark:text-teal-400 px-2 py-0.5 rounded-md font-semibold mt-3">
                        JPG, PNG, WEBP (Max 5MB)
                      </span>
                    </div>

                    <button 
                      onClick={() => handleParse("receipt")}
                      disabled={isProcessing || !selectedImage}
                      className="w-full mt-4 bg-teal-800 hover:bg-teal-900 disabled:bg-slate-200 dark:disabled:bg-[#111C34] disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-2xl text-sm transition-colors flex justify-center items-center gap-2.5 shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Process Receipt with Gemini AI</span>
                    </button>
                  </motion.div>
                )}

                {activeTab === 'text' && !isOffline && (
                  <motion.div
                    key="text"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <textarea 
                        value={rawTextMutation}
                        onChange={(e) => setRawTextMutation(e.target.value)}
                        placeholder="Paste your e-wallet mutation or chat message here...&#10;Example: 'Grab Ride 45,000' or 'Lunch at McD 120,000'"
                        className="w-full border border-slate-200/60 dark:border-[#1D2A43]/50 rounded-2xl p-3.5 text-sm placeholder:text-slate-400 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-600 transition-shadow bg-slate-50/25 dark:bg-[#0B1324]/50 min-h-[190px] resize-none"
                      />
                    </div>
                    <button 
                      onClick={() => handleParse("text")}
                      disabled={isProcessing || !rawTextMutation.trim()}
                      className="w-full bg-teal-800 hover:bg-teal-900 disabled:bg-slate-200 dark:disabled:bg-[#111C34] disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-2xl text-sm transition-colors flex justify-center items-center gap-2.5 shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Process Statement with GPT-4o</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status / Loading blocks */}
              <AnimatePresence>
              {isProcessing && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mt-6 bg-slate-50/80 dark:bg-[#111C34]/50 rounded-2xl border border-slate-200/60 dark:border-[#1D2A43]/50 p-6 overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  <div className="flex flex-col items-center justify-center mb-6">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    >
                      <Cpu className="text-teal-600 dark:text-teal-400 w-8 h-8 mb-3 opacity-80" />
                    </motion.div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Securely processing with GPT-4o...
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Converting receipt elements to structured JSON
                    </p>
                  </div>
                  
                  {/* Skeleton layout resembling receipt extraction */}
                  <div className="space-y-4 max-w-sm mx-auto opacity-70">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        <div className="h-10 w-full bg-slate-200/60 dark:bg-slate-800 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        <div className="h-10 w-full bg-slate-200/60 dark:bg-slate-800 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
                      <div className="h-10 w-full bg-slate-200/60 dark:bg-slate-800 rounded-xl" />
                    </div>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>

              {/* Extraction Verification block fields */}
              <AnimatePresence>
              {(verificationForm || activeTab === 'manual') && verificationForm && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={\`mt-6 border border-slate-200/60 dark:border-[#1D2A43]/50 border-teal-100 dark:border-teal-800/50 bg-teal-50/30 dark:bg-teal-950/40 rounded-2xl p-5 relative overflow-hidden \${activeTab === 'manual' ? 'mt-0' : ''}\`}
                >
                  <h3 className="text-sm font-semibold text-teal-950 dark:text-teal-50 mb-4 flex items-center gap-2">
                    <CheckSquare className="w-4.5 h-4.5 text-teal-700 dark:text-teal-400" />
                    {activeTab === 'manual' ? "Add New Transaction" : "Verify AI-Extracted Details"}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-300 mb-1">Date</label>
                      <input 
                        type="date" 
                        value={verificationForm.date}
                        onChange={(e) => setVerificationForm({ ...verificationForm, date: e.target.value })}
                        className="w-full border border-slate-200/60 dark:border-[#1D2A43]/50 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-[#0B1324] focus:outline-none focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-300 mb-1">Amount (IDR)</label>
                      <input 
                        type="number" 
                        value={verificationForm.amount}
                        onChange={(e) => setVerificationForm({ ...verificationForm, amount: Number(e.target.value) })}
                        className="w-full border border-slate-200/60 dark:border-[#1D2A43]/50 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-[#0B1324] focus:outline-none focus:border-teal-600 font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-300 mb-1">Merchant / Vendor</label>
                      <input 
                        type="text" 
                        value={verificationForm.merchant}
                        onChange={(e) => setVerificationForm({ ...verificationForm, merchant: e.target.value })}
                        className="w-full border border-slate-200/60 dark:border-[#1D2A43]/50 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-[#0B1324] focus:outline-none focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-300 mb-1">Category</label>
                      <select 
                        value={verificationForm.category}
                        onChange={(e) => setVerificationForm({ ...verificationForm, category: e.target.value as CategoryType })}
                        className="w-full border border-slate-200/60 dark:border-[#1D2A43]/50 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-[#0B1324] focus:outline-none focus:border-teal-600"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-300 mb-1">Notes (Optional)</label>
                      <input 
                        type="text" 
                        value={verificationForm.notes || ''}
                        onChange={(e) => setVerificationForm({ ...verificationForm, notes: e.target.value })}
                        className="w-full border border-slate-200/60 dark:border-[#1D2A43]/50 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-[#0B1324] focus:outline-none focus:border-teal-600"
                        placeholder="Additional details..."
                      />
                    </div>
                  </div>
                  
                  <div className="mt-5 flex gap-3">
                    <button 
                      onClick={handleConfirmTransaction}
                      disabled={isProcessing}
                      className={\`flex-1 \${isProcessing ? 'bg-teal-800/60 cursor-not-allowed' : 'bg-teal-800 hover:bg-teal-900 cursor-pointer hover:scale-105 active:scale-95 transition-transform'} text-white font-semibold py-2 rounded-lg text-sm transition-colors shadow-xs\`}
                    >
                      {isProcessing ? "Saving..." : "Confirm & Save Transaction"}
                    </button>
                    <button 
                      onClick={handleCancelForm}
                      className="px-4 bg-white dark:bg-[#0B1324] border border-slate-200/60 dark:border-[#1D2A43]/50 hover:bg-slate-50 dark:hover:bg-[#111C34]/80 text-slate-600 dark:text-slate-300 font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    >
                      {activeTab === 'manual' ? "Clear" : "Dismiss"}
                    </button>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>`;

const startIndex = code.indexOf('{/* Content Tabs area */}');
const endIndex = code.indexOf('{/* Container Part B: Category Expense Breakdown Donut SVG Chart & Legible legend item */}');
code = code.substring(0, startIndex) + newTabs + '\\n\\n          ' + code.substring(endIndex);

fs.writeFileSync('src/App.tsx', code);
