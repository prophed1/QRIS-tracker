import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { 
  Sun,
  Moon,
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
import { supabase } from "./lib/supabase";

const CATEGORIES: { name: CategoryType; icon: string; color: string }[] = [
  { name: "Food & Beverage", icon: "🍔", color: "#F97316" }, // Orange
  { name: "Groceries", icon: "🛒", color: "#10B981" },       // Emerald Green
  { name: "Transportation", icon: "🚗", color: "#3B82F6" },  // Blue
  { name: "Shopping", icon: "🛍️", color: "#8B5CF6" },        // Purple
  { name: "Bills & Utilities", icon: "💳", color: "#EC4899" }, // Pink
  { name: "Entertainment", icon: "🎬", color: "#EAB308" },   // Yellow
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
  const [theme, setTheme] = useState<"light" | "dark">(() => {
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

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<number>(10000000); // 10,000,000 IDR default
  
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
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
    notes?: string;
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
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const formatDate = (d: Date) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(now));

    // Load from local storage securely
    try {
      const stored = localStorage.getItem("bsi_tracker_data");
      if (stored) {
        const parsed: AppData = JSON.parse(stored);
        if (typeof parsed.budget === "number" && parsed.budget > 0) {
          setBudget(parsed.budget);
        }
      }
    } catch (e) {
      console.error("Failed to load local config", e);
    }

    // Load from Supabase
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });
        if (error) throw error;
        if (data) {
          // Sort explicitly by date to match chronological rendering
          const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTransactions(sorted as Transaction[]);
        }
      } catch (e: any) {
        console.error("Failed to load from Supabase", e);
        if (e.message) {
          console.error("Supabase error message:", e.message);
        }
      }
    };
    
    fetchTransactions();
  }, []);

  // Save budget to local storage on change
  useEffect(() => {
    if (startDate && endDate) {
      const dataToSave: AppData = {
        budget,
        transactions: [] // Don't duplicate transactions in localStorage anymore
      };
      localStorage.setItem("bsi_tracker_data", JSON.stringify(dataToSave));
    }
  }, [budget, startDate, endDate]);

  // Calculations
  const filteredTransactions = transactions.filter((t) => {
    if (!t.date) return false;
    return t.date >= startDate && t.date <= endDate;
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

      const response = await fetch("/api/paxsenix/parse", {
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
        throw new Error(data.error || "Failed to process image with Paxsenix API.");
      }

      // Populate verification form
      setVerificationForm({
        date: data.date || new Date().toISOString().split('T')[0],
        amount: Number(data.amount) || 0,
        merchant: data.merchant || "Unknown Store",
        category: (data.category as CategoryType) || "Others",
        notes: data.notes || ""
      });

    } catch (err: any) {
      console.error(err);
      setProcessingError(err.message || "Something went wrong. Please confirm your internet and API config.");
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
      const response = await fetch("/api/paxsenix/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "text",
          text: rawTextMutation.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process text statement with Paxsenix API.");
      }

      setVerificationForm({
        date: data.date || new Date().toISOString().split('T')[0],
        amount: Number(data.amount) || 0,
        merchant: data.merchant || "Unknown Store",
        category: (data.category as CategoryType) || "Others",
        notes: data.notes || ""
      });

    } catch (err: any) {
      console.error(err);
      setProcessingError(err.message || "Failed to process mutation statement.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Save parsed Transaction
  const handleConfirmSave = async () => {
    if (!verificationForm) return;

    setIsProcessing(true);
    const newTx = {
      date: verificationForm.date,
      amount: Number(verificationForm.amount),
      merchant: verificationForm.merchant,
      category: verificationForm.category,
      notes: verificationForm.notes
    };

    try {
      // Insert to Supabase DB
      const { data, error } = await supabase
        .from('transactions')
        .insert([newTx])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setTransactions((prev) => [data[0] as Transaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
      setVerificationForm(null);
      setRawTextMutation("");
    } catch (err: any) {
      console.error("Failed to insert transaction:", err);
      toast.error("Failed to insert transaction: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel form
  const handleCancelForm = () => {
    setVerificationForm(null);
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  // Clear Range's Transactions
  const handleClearRange = async () => {
    if (confirm(`Are you sure you want to delete all transactions between ${startDate} and ${endDate}?`)) {
      const idsToDelete = transactions
        .filter((t) => {
          return t.date && t.date >= startDate && t.date <= endDate;
        })
        .map(t => t.id);

      if (idsToDelete.length === 0) return;

      try {
        const { error } = await supabase.from('transactions').delete().in('id', idsToDelete);
        if (error) throw error;
        setTransactions((prev) => prev.filter((t) => !idsToDelete.includes(t.id)));
      } catch (err) {
        console.error("Failed to clear range", err);
      }
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
    const originalTitle = document.title;
    document.title = `QRIS_Tracker_${startDate}_to_${endDate}`;
    window.print();
    document.title = originalTitle;
  };

  // Data Importer from JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const imported = JSON.parse(text);
        if (Array.isArray(imported)) {
          // Prepare for Supabase
          const currentIds = new Set(transactions.map((t) => t.id));
          const newTransactions = imported
            .filter((t: any) => !currentIds.has(t.id))
            .map((t: any) => ({
              date: t.date,
              amount: Number(t.amount) || 0,
              merchant: String(t.merchant),
              category: String(t.category)
            })); // Omit ID so Supabase uses its UUID DEFAULT

          if (newTransactions.length > 0) {
            const { data, error } = await supabase.from('transactions').insert(newTransactions).select();
            if (error) throw error;
            if (data) {
              setTransactions((prev) => [...data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
              toast.success(`${data.length} transactions imported successfully.`);
            }
          } else {
             toast.info("No new transactions to import.");
          }
        } else {
          toast.error("Invalid JSON format.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse or import JSON file.");
      }
    };
    reader.readAsText(file);
    if (importInputRef.current) importInputRef.current.value = "";
  };

  // Data exporter to backup JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredTransactions, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `QRIS_Tracker_${startDate}_to_${endDate}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050A15] text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <Toaster position="top-center" richColors theme={theme === 'dark' ? 'dark' : 'light'} />
      {/* Upper Navigation / App Branded bar */}
      <header className="h-16 bg-white/80 dark:bg-[#050A15]/80 backdrop-blur-md border-b border-slate-200/60 dark:border-[#1D2A43]/50 flex items-center justify-between px-6 shrink-0 print:hidden sticky top-0 z-40 transition-colors duration-300">
        <div className="flex w-full max-w-6xl mx-auto flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Expense Tracker
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-300 font-medium">
                API Version: <span className="text-teal-600 dark:text-teal-400 font-bold uppercase">v1 Stable</span>
              </p>
            </div>
          </div>
          
                    {/* Date Range & Theme Toggle */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-[#111C34] rounded-md px-2 focus-within:ring-2 focus-within:ring-teal-500 transition-shadow">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-2">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none px-2 py-1.5 text-sm font-medium w-full sm:w-36 focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-200 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div className="flex items-center bg-slate-100 dark:bg-[#111C34] rounded-md px-2 focus-within:ring-2 focus-within:ring-teal-500 transition-shadow">
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
              className="p-2 rounded-full bg-slate-100 dark:bg-[#111C34] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-110 active:scale-95"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main core canvas layout */}
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-1 max-w-6xl mx-auto px-5 py-8 w-full">
        
        {/* Metric Cards Banner Grid */}
        <section id="metrics-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: Expenses */}
          <div className="bg-white dark:bg-[#0B1324] rounded-2xl border border-slate-200/60 dark:border-[#1D2A43]/50 p-5 shadow-lg shadow-slate-200/40 dark:shadow-slate-900/50 hover:shadow-xl dark:hover:shadow-black/50 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 dark:bg-rose-900/40 rounded-bl-full -z-0 opacity-40 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Total Expenses</span>
                <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-mono">
                {formatRupiah(totalExpenses)}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-300 font-medium mt-1.5 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
                <span>{filteredTransactions.length} transaction entries this month</span>
              </p>
            </div>
          </div>

          {/* Card 2: Safe Budget limits */}
          <div className="bg-white dark:bg-[#0B1324] rounded-2xl border border-slate-200/60 dark:border-[#1D2A43]/50 p-5 shadow-lg shadow-slate-200/40 dark:shadow-slate-900/50 hover:shadow-xl dark:hover:shadow-black/50 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-teal-50 dark:bg-teal-900/40 rounded-bl-full -z-0 opacity-45 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Monthly Target</span>
                <button 
                  onClick={handleOpenBudgetModal}
                  className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:text-teal-400 px-2 py-1 rounded bg-teal-50 dark:bg-teal-500/20 hover:bg-teal-100 dark:hover:bg-teal-500/40 transition-colors cursor-pointer hover:scale-105 active:scale-95 transition-transform print:hidden"
                >
                  Edit Budget
                </button>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-mono">
                {formatRupiah(budget)}
              </h2>
              <div className="w-full bg-slate-100 dark:bg-[#111C34] rounded-full h-1.5 mt-3">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${budgetUsagePercent >= 90 ? 'bg-rose-500' : 'bg-teal-600'}`}
                  style={{ width: `${budgetUsagePercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-300 font-medium mt-1.5 flex justify-between">
                <span>Usage Progress</span>
                <span className="font-mono">{Math.round(budgetUsagePercent)}% utilized</span>
              </p>
            </div>
          </div>

          {/* Card 3: Free / Over Limits balances */}
          <div className="bg-white dark:bg-[#0B1324] rounded-2xl border border-slate-200/60 dark:border-[#1D2A43]/50 p-5 shadow-lg shadow-slate-200/40 dark:shadow-slate-900/50 hover:shadow-xl dark:hover:shadow-black/50 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/40 rounded-bl-full -z-0 opacity-40 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Available Balance</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Scale className="w-4 h-4" />
                </span>
              </div>
              <h2 className={`text-3xl font-bold tracking-tight font-mono ${remainingBudget >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}`}>
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
          <div className="lg:col-span-7 bg-white dark:bg-[#0B1324] rounded-2xl border border-slate-200/60 dark:border-[#1D2A43]/50 shadow-lg shadow-slate-200/40 dark:shadow-slate-900/50 hover:shadow-xl dark:hover:shadow-black/50 transition-all duration-300 overflow-hidden print:hidden flex flex-col">
            {/* Headers Tabs block */}
            <div className="flex border-b">
              <button 
                disabled={isOffline}
                onClick={() => { setActiveTab("receipt"); handleCancelForm(); }}
                className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2.5 transition-all-custom cursor-pointer hover:scale-105 active:scale-95 transition-transform ${isOffline ? 'opacity-40 cursor-not-allowed' : ''} ${activeTab === 'receipt' ? 'border-b-2 border-teal-600 text-teal-700 dark:text-teal-400 bg-teal-50/30 dark:bg-teal-900/30' : 'border-b-2 border-transparent text-slate-500 dark:text-slate-300 hover:text-slate-600 dark:text-slate-300'}`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Scan Receipt</span>
              </button>
              <button 
                disabled={isOffline}
                onClick={() => { setActiveTab("text"); handleCancelForm(); }}
                className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2.5 transition-all-custom cursor-pointer hover:scale-105 active:scale-95 transition-transform ${isOffline ? 'opacity-40 cursor-not-allowed' : ''} ${activeTab === 'text' ? 'border-b-2 border-teal-600 text-teal-700 dark:text-teal-400 bg-teal-50/30 dark:bg-teal-900/30' : 'border-b-2 border-transparent text-slate-500 dark:text-slate-300 hover:text-slate-600 dark:text-slate-300'}`}
              >
                <FileText className="w-4 h-4" />
                <span>Mutation Text</span>
              </button>
              <button 
                onClick={() => { setActiveTab("manual"); handleCancelForm(); setVerificationForm({ date: new Date().toISOString().split('T')[0], amount: 0, merchant: "", category: "Others" }); }}
                className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2.5 transition-all-custom cursor-pointer hover:scale-105 active:scale-95 transition-transform ${activeTab === 'manual' ? 'border-b-2 border-teal-600 text-teal-700 dark:text-teal-400 bg-teal-50/30 dark:bg-teal-900/30' : 'border-b-2 border-transparent text-slate-500 dark:text-slate-300 hover:text-slate-600 dark:text-slate-300'}`}
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
                      className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 text-center group cursor-pointer hover:scale-105 active:scale-95 transition-transform transition-all min-h-[190px] relative ${dragActive ? 'border-teal-400 bg-teal-50/20 dark:bg-[#111C34]/50' : 'border-slate-200 dark:border-[#1D2A43]/50 hover:border-teal-400 hover:bg-teal-50/20 dark:hover:bg-[#111C34]/50'}`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/jpeg,image/png,image/webp" 
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      />
                      
                      <div className="w-12 h-12 bg-slate-50 dark:bg-[#111C34]/50 rounded-full flex items-center justify-center mb-3 group-hover:bg-white dark:bg-[#0B1324] text-slate-500 dark:text-slate-300 group-hover:text-teal-600 dark:text-teal-400 transition-colors">
                        <Upload className="w-6 h-6" />
                      </div>
                      
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Drag & drop receipt image
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                        or click to browse files
                      </p>
                      
                      <span className="text-[10px] uppercase tracking-wider font-mono bg-teal-50 dark:bg-teal-500/20 text-teal-800 dark:text-teal-400 px-2 py-0.5 rounded-md font-semibold mt-3">
                        JPG, PNG, WEBP (Max 5MB)
                      </span>
                    </div>
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
                      onClick={handleTextMutationParse}
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
                      animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="mb-4 relative"
                    >
                      <Cpu className="text-teal-600 dark:text-teal-400 w-9 h-9" />
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
                  className={`mt-6 border border-slate-200/60 dark:border-[#1D2A43]/50 border-teal-100 dark:border-teal-800/50 bg-teal-50/30 dark:bg-teal-950/40 rounded-2xl p-5 relative overflow-hidden ${activeTab === 'manual' ? 'mt-0' : ''}`}
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
                      onClick={handleConfirmSave}
                      disabled={isProcessing}
                      className={`flex-1 ${isProcessing ? 'bg-teal-800/60 cursor-not-allowed' : 'bg-teal-800 hover:bg-teal-900 cursor-pointer hover:scale-105 active:scale-95 transition-transform'} text-white font-semibold py-2 rounded-lg text-sm transition-colors shadow-xs`}
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
            </div>
          </div>

          {/* Container Part B: Category Expense Breakdown Donut SVG Chart & Legible legend item */}
          <div className="lg:col-span-12 xl:lg:col-span-5 bg-white dark:bg-[#0B1324] rounded-2xl border border-slate-200/60 dark:border-[#1D2A43]/50 shadow-lg shadow-slate-200/40 dark:shadow-slate-900/50 hover:shadow-xl dark:hover:shadow-black/50 transition-all duration-300 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                  Monthly Expenses Distribution
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-300 font-mono">Structure</span>
              </div>

              {/* SVG Doughnut chart area */}
              <div className="flex justify-center my-4 w-full group">
                {sumOfNonEmpty === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center h-48">
                    <div className="w-32 h-32 rounded-full border-8 border-slate-100/80 flex items-center justify-center mb-2">
                      <FolderOpen className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-300 font-medium font-sans">No transactions registered this month</p>
                  </div>
                ) : (
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {/* Base circle background */}
                      <circle cx="50" cy="50" r={donutRadius} fill="transparent" className="stroke-slate-100 dark:stroke-[#111C34]" strokeWidth={strokeWidth} />
                      
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
                              className="origin-center transition-all duration-300 cursor-pointer hover:scale-[1.03] active:scale-95 hover:stroke-[10px]"
                            />
                          );
                        });
                      })()}
                    </svg>

                    {/* Center summary text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 text-center px-4">
                      <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-300 uppercase tracking-[0.05em] font-semibold leading-tight whitespace-nowrap">Total Spent</span>
                      <span className="text-[11px] sm:text-[13px] font-bold text-slate-900 dark:text-slate-50 font-mono tracking-tighter truncate w-full mt-0.5">{formatRupiah(totalExpenses)}</span>
                    </div>
                  </div>
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
                    className="flex justify-between items-center text-xs p-2.5 rounded-2xl border border-slate-200/60 dark:border-[#1D2A43]/50 border-slate-100 dark:border-[#1D2A43]/50 hover:bg-slate-50 dark:hover:bg-[#111C34]/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{cat.icon} {cat.name}</span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-semibold font-mono text-slate-900 dark:text-slate-50">{formatRupiah(amount)}</span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 block w-9 text-right font-mono">{percent}%</span>
                    </div>
                  </div>
                  );
                })}
              </div>
          </div>
        </section>

        {/* Section C: Transaction Table list log historic */}
        <section id="table-canvas" className="flex-1 bg-white dark:bg-[#0B1324] rounded-2xl border border-slate-200/60 dark:border-[#1D2A43]/50 shadow-lg shadow-slate-200/40 dark:shadow-slate-900/50 hover:shadow-xl dark:hover:shadow-black/50 transition-all duration-300 flex flex-col overflow-hidden">
          
          {/* Header toolbar options with exporter and dynamic elements */}
          <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0B1324] sticky top-0 z-10 w-full overflow-hidden">
            <div className="shrink-0">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                Transaction History Logs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 font-medium">
                Detailed transaction entries matching filter indices
              </p>
            </div>
            
            {/* Download controls exporter */}
            <div className="flex items-center gap-2.5 select-none print:hidden overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide">
              <button 
                onClick={() => importInputRef.current?.click()}
                className="shrink-0 text-xs font-bold text-teal-700 dark:text-teal-400 border border-slate-200/60 dark:border-[#1D2A43]/50 hover:bg-slate-50 dark:hover:bg-[#111C34]/10 hover:border-teal-700/50 bg-white dark:bg-[#0B1324] shadow-3xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer hover:scale-105 active:scale-95 transition-transform"
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
                className="shrink-0 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-[#1D2A43]/50 hover:bg-slate-50 dark:hover:bg-[#111C34]/30 bg-white dark:bg-[#0B1324] shadow-3xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
              
              <button 
                onClick={handleExportJSON}
                className="shrink-0 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-[#1D2A43]/50 hover:bg-slate-50 dark:hover:bg-[#111C34]/30 bg-white dark:bg-[#0B1324] shadow-3xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Backup JSON</span>
              </button>

              <button 
                onClick={handleClearRange}
                disabled={filteredTransactions.length === 0}
                className="shrink-0 text-xs font-bold text-rose-600 disabled:opacity-40 disabled:pointer-events-none hover:bg-rose-50/60 dark:hover:bg-rose-900/30 transition-colors px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Table proper list logs */}
          <div className="overflow-x-auto w-full pb-4 scrollbar-thin scrollbar-thumb-teal-500 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse min-w-[700px] whitespace-nowrap">
              <thead className="bg-slate-50/50 dark:bg-[#0B1324]">
                <tr className="border-b border-slate-200 dark:border-[#1D2A43]/50 text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-300 select-none">
                  <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase border-b border-slate-200 dark:border-[#1D2A43]/50">Date</th>
                  <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase border-b border-slate-200 dark:border-[#1D2A43]/50">Merchant / Destination</th>
                  <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase border-b border-slate-200 dark:border-[#1D2A43]/50">Expense Category</th>
                  <th className="p-4 text-right text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase border-b border-slate-200 dark:border-[#1D2A43]/50">Amount</th>
                  <th className="p-4 text-center print:hidden text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase border-b border-slate-200 dark:border-[#1D2A43]/50">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 dark:divide-[#1D2A43]/50">
                <AnimatePresence>
                {filteredTransactions.map((tx, index) => {
                  const catMatch = CATEGORIES.find(c => c.name === tx.category) || CATEGORIES[6];
                  
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.5) }}
                      key={tx.id} 
                      className="hover:bg-slate-50 dark:hover:bg-[#111C34]/80 transition-colors group"
                    >
                      <td className="p-4 font-medium text-slate-500 dark:text-slate-400 font-mono">
                        {tx.date}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{tx.merchant}</div>
                        {tx.notes && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5 max-w-[200px] truncate" title={tx.notes}>
                            {tx.notes}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span 
                          className="px-2.5 py-1 text-xs font-extrabold rounded-full border border-slate-200/60 dark:border-[#1D2A43]/50 flex items-center gap-1.5 w-max"
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
                      <td className="p-4 text-right font-bold text-slate-900 dark:text-slate-50 font-mono">
                        {formatRupiah(tx.amount)}
                      </td>
                      <td className="p-4 text-center print:hidden">
                        <button 
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="text-slate-300 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50/50 transition-all cursor-pointer hover:scale-105 active:scale-95 transition-transform opacity-50 hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
                </AnimatePresence>
              </tbody>
            </table>
            
            {/* Empty block status feedback */}
            {filteredTransactions.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 px-6 flex flex-col items-center justify-center"
              >
                <div className="w-20 h-20 bg-slate-50 dark:bg-[#111C34]/50 rounded-full flex items-center justify-center mb-4 ring-8 ring-white dark:ring-[#050A15]">
                  <FolderOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg mb-1">No transactions found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  You don't have any recorded transactions for this month. Try uploading a screenshot or using the text parser to add one.
                </p>
              </motion.div>
            )}
          </div>
        </section>

      </motion.main>

      {/* Footer credits blocks */}
      <footer className="h-10 bg-slate-900 flex items-center justify-between px-6 shrink-0 mt-auto select-none print:hidden">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
            <span className="text-[10px] text-slate-500 dark:text-slate-300 font-bold uppercase tracking-wider">
              {isOffline ? 'Offline Mode (Local Only)' : 'GPT-4o (Paxsenix) Stable Connection'}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-300 font-medium tracking-tight">System Deployment: Vercel &bull; May 29, 2026</p>
      </footer>

      {/* Styled Budget modification Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs select-none">
          <div className="bg-white dark:bg-[#0B1324] rounded-2xl max-w-sm w-full border border-slate-200/60 dark:border-[#1D2A43]/50 border-slate-100 p-6 shadow-xl animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-900 dark:text-slate-50 text-sm">Update Monthly Limit Target</h4>
              <button 
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1 rounded bg-slate-50 dark:bg-[#111C34]/50 hover:bg-slate-100 dark:bg-[#111C34] text-slate-500 dark:text-slate-300 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-300 mb-3 leading-relaxed">
              Setting a monthly budget will configure progress thresholds and overspending notification indicators. Enter digits:
            </p>

            <div className="relative mb-4">
              <input 
                type="number"
                value={tempBudget}
                onChange={(e) => setTempBudget(e.target.value)}
                className="w-full border border-slate-200/60 dark:border-[#1D2A43]/50 rounded-2xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-teal-600 font-mono font-bold"
                placeholder="Ex. 10000000"
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-500 dark:text-slate-300 font-bold">
                IDR
              </span>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleSaveBudget}
                className="flex-1 bg-teal-800 hover:bg-teal-900 text-white font-semibold py-2 rounded-2xl text-sm transition-colors cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              >
                Save Limit
              </button>
              <button 
                onClick={() => setIsBudgetModalOpen(false)}
                className="px-4 bg-slate-50 dark:bg-[#111C34]/50 hover:bg-slate-100 dark:bg-[#111C34] text-slate-600 dark:text-slate-300 font-semibold py-2 rounded-2xl text-sm transition-colors cursor-pointer hover:scale-105 active:scale-95 transition-transform"
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
