import React, { useState, useEffect, useRef } from "react";
import { 
  Wallet, 
  ArrowUpRight, 
  Scale, 
  Image as ImageIcon, 
  FileText, 
  Cpu, 
  CheckSquare, 
  Trash2, 
  Download, 
  PlusCircle, 
  X, 
  Calendar, 
  DollarSign, 
  RefreshCw,
  TrendingUp,
  FolderOpen,
  WifiOff,
  Upload,
  Edit3
} from "lucide-react";
import { Transaction, AppData, CategoryType } from "./types";

const CATEGORIES: { name: CategoryType; icon: string; color: string }[] = [
  { name: "Food & Beverage", icon: "🍔", color: "#0d9488" }, // Teal
  { name: "Groceries", icon: "🛒", color: "#0284c7" },       // Sky
  { name: "Transportation", icon: "🚗", color: "#4f46e5" },  // Indigo
  { name: "Shopping", icon: "🛍️", color: "#db2777" },        // Pink
  { name: "Bills & Utilities", icon: "💳", color: "#ea580c" }, // Orange
  { name: "Entertainment", icon: "🎬", color: "#e11d48" },   // Rose
  { name: "Others", icon: "📦", color: "#64748b" }           // Slate
];

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" }
];

const YEARS = ["2024", "2025", "2026", "2027", "2028", "2029", "2030"];

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<number>(10000000); // 10,000,000 IDR default
  
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  
  const [activeTab, setActiveTab] = useState<"receipt" | "text" | "manual">("receipt");
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // App state for loading and edits
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [rawTextMutation, setRawTextMutation] = useState<string>("");
  
  // Verification states
  const [verificationForm, setVerificationForm] = useState<{
    date: string;
    amount: number;
    merchant: string;
    category: CategoryType;
  } | null>(null);

  // Modal budgets state
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [tempBudget, setTempBudget] = useState<string>("");

  // Refs for upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'manual' && !verificationForm) {
      setVerificationForm({ date: new Date().toISOString().split('T')[0], amount: 0, merchant: "", category: "Others" });
    }
  }, [activeTab, verificationForm]);

  // Initialize values on load
  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); };
    const handleOffline = () => { setIsOffline(true); setActiveTab("manual"); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (!navigator.onLine) {
      setActiveTab("manual");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    // Current date values
    const now = new Date();
    setSelectedMonth(String(now.getMonth() + 1).padStart(2, '0'));
    setSelectedYear(String(now.getFullYear()));

    // Load from local storage securely
    try {
      const stored = localStorage.getItem("bsi_tracker_data");
      if (stored) {
        const parsed: AppData = JSON.parse(stored);
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          setTransactions(parsed.transactions);
        }
        if (typeof parsed.budget === "number" && parsed.budget > 0) {
          setBudget(parsed.budget);
        }
      } else {
        // Fallback or seed initial data
        setTransactions([
          {
            id: "1",
            date: "2026-05-28",
            amount: 75000,
            merchant: "Kopi Kenangan",
            category: "Food & Beverage"
          },
          {
            id: "2",
            date: "2026-05-27",
            amount: 320000,
            merchant: "Superindo",
            category: "Groceries"
          },
          {
            id: "3",
            date: "2026-05-25",
            amount: 45000,
            merchant: "Go-Ride",
            category: "Transportation"
          }
        ]);
      }
    } catch (e) {
      console.error("Failed to load transactions", e);
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      const dataToSave: AppData = {
        budget,
        transactions
      };
      localStorage.setItem("bsi_tracker_data", JSON.stringify(dataToSave));
    }
  }, [transactions, budget, selectedMonth, selectedYear]);

  // Calculations
  const filteredTransactions = transactions.filter((t) => {
    if (!t.date) return false;
    const [year, month] = t.date.split("-");
    return year === selectedYear && month === selectedMonth;
  });

  const totalExpenses = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const remainingBudget = budget - totalExpenses;
  const budgetUsagePercent = budget > 0 ? Math.min((totalExpenses / budget) * 100, 100) : 0;

  // Render variables
  const formatRupiah = (num: number) => {
    return "Rp " + Number(num).toLocaleString("id-ID");
  };

  // Convert files to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1000;
          let { width, height } = img;
          
          if (width > height && width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          } else if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress as JPEG
          } else {
            resolve(reader.result as string);
          }
        };
        img.onerror = () => resolve(reader.result as string); // Fallback for diff file types
        img.src = reader.result as string;
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processImageFile(e.target.files[0]);
    }
  };

  // Call API for Receipt OCR
  const processImageFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingError(null);
    setVerificationForm(null);

    try {
      const base64String = await fileToBase64(file);
      const matched = base64String.match(/^data:(.*);base64,(.*)$/);
      if (!matched) {
        throw new Error("Invalid image format or failed to read base64");
      }
      const mimeType = matched[1];
      const base64Content = matched[2];

      const response = await fetch("/api/gemini/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "receipt",
          base64: base64Content,
          mimeType: mimeType
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process image with Gemini AI.");
      }

      // Populate verification form
      setVerificationForm({
        date: data.date || new Date().toISOString().split('T')[0],
        amount: Number(data.amount) || 0,
        merchant: data.merchant || "Unknown Store",
        category: (data.category as CategoryType) || "Others"
      });

    } catch (err: any) {
      console.error(err);
      setProcessingError(err.message || "Something went wrong. Please confirm your internet and Gemini config.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Call API for statement text mutations
  const handleTextMutationParse = async () => {
    if (!rawTextMutation.trim()) return;

    setIsProcessing(true);
    setProcessingError(null);
    setVerificationForm(null);

    try {
      const response = await fetch("/api/gemini/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "text",
          text: rawTextMutation.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process text statement with Gemini AI.");
      }

      setVerificationForm({
        date: data.date || new Date().toISOString().split('T')[0],
        amount: Number(data.amount) || 0,
        merchant: data.merchant || "Unknown Store",
        category: (data.category as CategoryType) || "Others"
      });

    } catch (err: any) {
      console.error(err);
      setProcessingError(err.message || "Failed to process mutation statement.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Save parsed Transaction
  const handleConfirmSave = () => {
    if (!verificationForm) return;

    const newTx: Transaction = {
      id: String(Date.now()),
      date: verificationForm.date,
      amount: Number(verificationForm.amount),
      merchant: verificationForm.merchant,
      category: verificationForm.category
    };

    setTransactions((prev) => [newTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setVerificationForm(null);
    setRawTextMutation("");
  };

  // Cancel form
  const handleCancelForm = () => {
    setVerificationForm(null);
  };

  // Delete Transaction
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Clear Month's Transactions
  const handleClearMonth = () => {
    if (confirm("Are you sure you want to delete all transactions recorded for this month?")) {
      setTransactions((prev) => prev.filter((t) => {
        const [year, month] = t.date.split("-");
        return !(year === selectedYear && month === selectedMonth);
      }));
    }
  };

  // Budget modification
  const handleOpenBudgetModal = () => {
    setTempBudget(String(budget));
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = () => {
    const num = Number(tempBudget);
    if (!isNaN(num) && num >= 0) {
      setBudget(num);
      setIsBudgetModalOpen(false);
    }
  };

  // Draw modern SVG circular Ring segment chart
  const categoriesSum = CATEGORIES.reduce((acc, cat) => {
    const total = filteredTransactions
      .filter((t) => t.category === cat.name)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    acc[cat.name] = total;
    return acc;
  }, {} as Record<CategoryType, number>);

  const actualDataCategories = CATEGORIES.filter(cat => (categoriesSum[cat.name] || 0) > 0);
  const sumOfNonEmpty = actualDataCategories.reduce((sum, cat) => sum + categoriesSum[cat.name], 0);

  // SVG Circular Coordinates Calculator
  let accumulatedPercent = 0;
  const donutRadius = 35;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * donutRadius; // ~219.91

  // Handle local print capability beautifully
  const handlePrint = () => {
    window.print();
  };

  // Data Importer from JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = JSON.parse(text);
        if (Array.isArray(imported)) {
          setTransactions((prev) => {
            const currentIds = new Set(prev.map((t) => t.id));
            const newTransactions = imported.filter((t) => !currentIds.has(t.id));
            return [...prev, ...newTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          });
          alert("Transactions imported successfully.");
        } else {
          alert("Invalid JSON format.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    if (importInputRef.current) importInputRef.current.value = "";
  };

  // Data exporter to backup JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `BSI_Expense_Tracker_${selectedYear}_${selectedMonth}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900 flex flex-col antialiased">
      {/* Upper Navigation / App Branded bar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 print:hidden sticky top-0 z-40">
        <div className="flex w-full max-w-6xl mx-auto flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Expense Tracker
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                API Version: <span className="text-teal-600 font-bold uppercase">v1 Stable</span>
              </p>
            </div>
          </div>
          
          {/* Month/Year Selection tools */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-100 border-none rounded-md px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 w-full sm:w-40 appearance-none pr-8"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            <div className="relative flex-1 sm:flex-none">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-100 border-none rounded-md px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 w-full sm:w-28 appearance-none pr-8"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main core canvas layout */}
      <main className="flex-1 max-w-6xl mx-auto px-5 py-8 w-full">
        
        {/* Metric Cards Banner Grid */}
        <section id="metrics-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: Expenses */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 rounded-bl-full -z-0 opacity-40 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Expenses</span>
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
                {formatRupiah(totalExpenses)}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                <span>{filteredTransactions.length} transaction entries this month</span>
              </p>
            </div>
          </div>

          {/* Card 2: Safe Budget limits */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-teal-50 rounded-bl-full -z-0 opacity-45 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Target</span>
                <button 
                  onClick={handleOpenBudgetModal}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 transition-colors cursor-pointer print:hidden"
                >
                  Edit Budget
                </button>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
                {formatRupiah(budget)}
              </h2>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${budgetUsagePercent >= 90 ? 'bg-rose-500' : 'bg-teal-600'}`}
                  style={{ width: `${budgetUsagePercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1.5 flex justify-between">
                <span>Usage Progress</span>
                <span className="font-mono">{Math.round(budgetUsagePercent)}% utilized</span>
              </p>
            </div>
          </div>

          {/* Card 3: Free / Over Limits balances */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-40 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Balance</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Scale className="w-4 h-4" />
                </span>
              </div>
              <h2 className={`text-3xl font-bold tracking-tight font-mono ${remainingBudget >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatRupiah(remainingBudget)}
              </h2>
              <p className="text-xs font-medium mt-2">
                {remainingBudget >= 0 ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-600" /> Healthy Balance
                  </span>
                ) : (
                  <span className="text-rose-500 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping" /> Overspending Detected!
                  </span>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Section B: App Controls (Split Flex layout: Left Parser upload, Right Pie metrics breakdown) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          
          {/* Container Part A: Parsers & Extrusion Tools */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:hidden flex flex-col">
            {/* Headers Tabs block */}
            <div className="flex border-b">
              <button 
                disabled={isOffline}
                onClick={() => { setActiveTab("receipt"); handleCancelForm(); }}
                className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2.5 transition-all-custom cursor-pointer ${isOffline ? 'opacity-40 cursor-not-allowed' : ''} ${activeTab === 'receipt' ? 'border-b-2 border-teal-600 text-teal-700 bg-teal-50/30' : 'border-b-2 border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Scan Receipt</span>
              </button>
              <button 
                disabled={isOffline}
                onClick={() => { setActiveTab("text"); handleCancelForm(); }}
                className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2.5 transition-all-custom cursor-pointer ${isOffline ? 'opacity-40 cursor-not-allowed' : ''} ${activeTab === 'text' ? 'border-b-2 border-teal-600 text-teal-700 bg-teal-50/30' : 'border-b-2 border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <FileText className="w-4 h-4" />
                <span>Mutation Text</span>
              </button>
              <button 
                onClick={() => { setActiveTab("manual"); handleCancelForm(); setVerificationForm({ date: new Date().toISOString().split('T')[0], amount: 0, merchant: "", category: "Others" }); }}
                className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2.5 transition-all-custom cursor-pointer ${activeTab === 'manual' ? 'border-b-2 border-teal-600 text-teal-700 bg-teal-50/30' : 'border-b-2 border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <Edit3 className="w-4 h-4 hidden sm:block" />
                <span>Manual</span>
              </button>
            </div>

            {isOffline && (
              <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-center justify-center gap-2 text-amber-700 text-xs font-bold shrink-0">
                <WifiOff className="w-4 h-4" />
                <span>You are offline. AI features are disabled.</span>
              </div>
            )}

            {/* Content Tabs area */}
            <div className="p-6">
              {activeTab === 'receipt' && !isOffline && (
                <div>
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 text-center group cursor-pointer transition-all min-h-[190px] relative ${dragActive ? 'border-teal-400 bg-teal-50/20' : 'border-slate-200 hover:border-teal-400 hover:bg-teal-50/20'}`}
                  >
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-white text-slate-400 group-hover:text-teal-600 transition-colors">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">
                      Upload Receipt Screenshot
                    </p>
                    <p className="text-xs text-slate-400 mt-1 min-h-[1.5rem]">
                      Drag and drop image here, or browse local files
                    </p>
                    <span className="text-[10px] uppercase tracking-wider font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md font-semibold mt-3">
                      Auto-detects Bank Receipts & QRIS
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'text' && !isOffline && (
                <div className="space-y-4">
                  <div className="relative">
                    <textarea 
                      value={rawTextMutation}
                      onChange={(e) => setRawTextMutation(e.target.value)}
                      rows={5}
                      className="w-full border border-slate-200 rounded-xl p-3.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-600 transition-shadow bg-slate-50/25"
                      placeholder="Paste BSI Mobile transaction SMS, mutation text, QRIS notification receipts, or transaction notification lines here..."
                    />
                  </div>
                  <button 
                    onClick={handleTextMutationParse}
                    disabled={isProcessing || !rawTextMutation.trim()}
                    className="w-full bg-teal-800 hover:bg-teal-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors flex justify-center items-center gap-2.5 shadow-xs cursor-pointer"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>Process Statement with Gemini AI</span>
                  </button>
                </div>
              )}

              {/* Status / Loading blocks */}
              {isProcessing && (
                <div className="mt-6 text-center py-6 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col items-center justify-center animate-pulse">
                  <RefreshCw className="animate-spin text-teal-700 w-6 h-6 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    Securely processing with Gemini AI...
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Converting receipt elements to structured JSON. Please wait.
                  </p>
                </div>
              )}

              {processingError && (
                <div className="mt-6 border border-rose-100 bg-rose-50/40 rounded-xl p-4 text-xs text-rose-700">
                  <p className="font-bold mb-1 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-600" />
                    AI Processing Refused OR Interrupted
                  </p>
                  <p className="leading-relaxed whitespace-pre-line">{processingError}</p>
                </div>
              )}

              {/* Extraction Verification block fields */}
              {(verificationForm || activeTab === 'manual') && verificationForm && (
                <div className={`mt-6 border border-teal-100 bg-teal-50/30 rounded-xl p-5 relative overflow-hidden ${activeTab === 'manual' ? 'mt-0' : ''}`}>
                  <h3 className="text-sm font-semibold text-teal-950 mb-4 flex items-center gap-2">
                    <CheckSquare className="w-4.5 h-4.5 text-teal-700" />
                    {activeTab === 'manual' ? "Add New Transaction" : "Verify AI-Extracted Details"}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Date</label>
                      <input 
                        type="date" 
                        value={verificationForm.date}
                        onChange={(e) => setVerificationForm({ ...verificationForm, date: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Amount (IDR)</label>
                      <input 
                        type="number" 
                        value={verificationForm.amount}
                        onChange={(e) => setVerificationForm({ ...verificationForm, amount: Number(e.target.value) })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-teal-600 font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Merchant / Vendor</label>
                      <input 
                        type="text" 
                        value={verificationForm.merchant}
                        onChange={(e) => setVerificationForm({ ...verificationForm, merchant: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Category type</label>
                      <select 
                        value={verificationForm.category}
                        onChange={(e) => setVerificationForm({ ...verificationForm, category: e.target.value as CategoryType })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-teal-600 font-semibold"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.name} value={cat.name}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-5">
                    <button 
                      onClick={handleConfirmSave}
                      className="flex-1 bg-teal-800 hover:bg-teal-900 text-white font-semibold py-2 rounded-lg text-sm transition-colors shadow-xs cursor-pointer"
                    >
                      Confirm & Save Transaction
                    </button>
                    <button 
                      onClick={handleCancelForm}
                      className="px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      {activeTab === 'manual' ? "Clear" : "Dismiss"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Container Part B: Category Expense Breakdown Donut SVG Chart & Legible legend item */}
          <div className="lg:col-span-12 xl:lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold tracking-tight text-slate-800">
                  Monthly Expenses Distribution
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Structure</span>
              </div>

              {/* SVG Doughnut chart area */}
              <div className="flex justify-center my-4 relative h-48 w-full group">
                {sumOfNonEmpty === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-32 h-32 rounded-full border-8 border-slate-100/80 flex items-center justify-center mb-2">
                      <FolderOpen className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-xs text-slate-400 font-medium font-sans">No transactions registered this month</p>
                  </div>
                ) : (
                  <>
                    <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90">
                      {/* Base circle background */}
                      <circle cx="50" cy="50" r={donutRadius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidth} />
                      
                      {/* Active SVG segments */}
                      {(() => {
                        accumulatedPercent = 0;
                        return actualDataCategories.map((cat, idx) => {
                          const value = categoriesSum[cat.name] || 0;
                          const fractionPercentage = value / sumOfNonEmpty;
                          const dashArray = fractionPercentage * circumference;
                          const dashOffset = accumulatedPercent * circumference;
                          accumulatedPercent += fractionPercentage;

                          return (
                            <circle
                              key={cat.name}
                              cx="50"
                              cy="50"
                              r={donutRadius}
                              fill="transparent"
                              stroke={cat.color}
                              strokeWidth={strokeWidth}
                              strokeDasharray={`${dashArray} ${circumference}`}
                              strokeDashoffset={-dashOffset}
                              className="transition-all duration-300 cursor-pointer hover:stroke-[10px]"
                            />
                          );
                        });
                      })()}
                    </svg>

                    {/* Center summary text */}
                    <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Total Spent</span>
                      <span className="text-sm font-bold text-slate-900 font-mono mt-0.5">{formatRupiah(totalExpenses)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Custom Interactive active legend items breakdown list */}
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
              {CATEGORIES.map((cat) => {
                const amount = categoriesSum[cat.name] || 0;
                const percent = sumOfNonEmpty > 0 ? Math.round((amount / sumOfNonEmpty) * 100) : 0;
                if (amount === 0) return null;

                return (
                  <div 
                    key={cat.name} 
                    className="flex justify-between items-center text-xs p-2.5 rounded-xl border border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-slate-700">{cat.icon} {cat.name}</span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-semibold font-mono text-slate-900">{formatRupiah(amount)}</span>
                      <span className="text-[10px] font-bold text-slate-400 block w-9 text-right font-mono">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section C: Transaction Table list log historic */}
        <section id="table-canvas" className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          
          {/* Header toolbar options with exporter and dynamic elements */}
          <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
              <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                Transaction History Logs
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Detailed transaction entries matching filter indices
              </p>
            </div>
            
            {/* Download controls exporter */}
            <div className="flex items-center gap-2.5 select-none print:hidden">
              <button 
                onClick={() => importInputRef.current?.click()}
                className="text-xs font-bold text-teal-700 border border-slate-200 hover:bg-slate-50/10 hover:border-teal-700/50 bg-white shadow-3xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
              </button>
              <input
                type="file"
                ref={importInputRef}
                onChange={handleImportJSON}
                accept="application/json"
                className="hidden"
              />

              <button 
                onClick={handlePrint}
                className="text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50/30 bg-white shadow-3xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
              
              <button 
                onClick={handleExportJSON}
                className="text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50/30 bg-white shadow-3xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Backup JSON</span>
              </button>

              <button 
                onClick={handleClearMonth}
                disabled={filteredTransactions.length === 0}
                className="text-xs font-bold text-rose-600 disabled:opacity-40 disabled:pointer-events-none hover:bg-rose-50/60 transition-colors px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Table proper list logs */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50">
                <tr className="border-b text-[10px] uppercase font-bold tracking-widest text-slate-400 select-none">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase border-b">Date</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase border-b">Merchant / Destination</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase border-b">Expense Category</th>
                  <th className="p-4 text-right text-[10px] font-bold text-slate-400 uppercase border-b">Amount</th>
                  <th className="p-4 text-center print:hidden text-[10px] font-bold text-slate-400 uppercase border-b">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const catMatch = CATEGORIES.find(c => c.name === tx.category) || CATEGORIES[6];
                  
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-4 font-medium text-slate-500 font-mono">
                        {tx.date}
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {tx.merchant}
                      </td>
                      <td className="p-4">
                        <span 
                          className="px-2.5 py-1 text-xs font-extrabold rounded-full border flex items-center gap-1.5 w-max"
                          style={{ 
                            color: catMatch.color, 
                            borderColor: `${catMatch.color}15`, 
                            backgroundColor: `${catMatch.color}08` 
                          }}
                        >
                          <span>{catMatch.icon}</span>
                          <span>{catMatch.name}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900 font-mono">
                        {formatRupiah(tx.amount)}
                      </td>
                      <td className="p-4 text-center print:hidden">
                        <button 
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="text-slate-300 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50/50 transition-all cursor-pointer opacity-50 hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Empty block status feedback */}
            {filteredTransactions.length === 0 && (
              <div className="text-center py-14 text-slate-400/80 p-6 flex flex-col items-center justify-center">
                <FolderOpen className="w-9 h-9 mx-auto mb-2 text-slate-200" />
                <p className="font-semibold text-slate-500 text-sm">No recorded transactions.</p>
                <p className="text-xs text-slate-400 mt-0.5">Filter of month status is empty. Try uploading a screenshot or using the text parser.</p>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Footer credits blocks */}
      <footer className="h-10 bg-slate-900 flex items-center justify-between px-6 shrink-0 mt-auto select-none print:hidden">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {isOffline ? 'Offline Mode (Local Only)' : 'Gemini AI v1.5 Stable Connection'}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 font-medium tracking-tight">System Deployment: Vercel &bull; May 29, 2026</p>
      </footer>

      {/* Styled Budget modification Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs select-none">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-100 p-6 shadow-xl animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-900 text-sm">Update Monthly Limit Target</h4>
              <button 
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Setting a monthly budget will configure progress thresholds and overspending notification indicators. Enter digits:
            </p>

            <div className="relative mb-4">
              <input 
                type="number"
                value={tempBudget}
                onChange={(e) => setTempBudget(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-teal-600 font-mono font-bold"
                placeholder="Ex. 10000000"
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 font-bold">
                IDR
              </span>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleSaveBudget}
                className="flex-1 bg-teal-800 hover:bg-teal-900 text-white font-semibold py-2 rounded-xl text-sm transition-colors cursor-pointer"
              >
                Save Limit
              </button>
              <button 
                onClick={() => setIsBudgetModalOpen(false)}
                className="px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold py-2 rounded-xl text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
