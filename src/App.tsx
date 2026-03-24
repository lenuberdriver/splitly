/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Receipt, 
  X, 
  Copy, 
  RotateCcw, 
  Settings,
  ArrowRight,
  Hash,
  Wallet,
  Calendar,
  ChevronRight,
  PlusCircle,
  Sun,
  Moon,
  Edit2,
  Check,
  Languages,
  Minus
} from 'lucide-react';

const TRANSLATIONS = {
  en: {
    title: "Splitly",
    subtitle: "Modern Bill Splitter",
    toCollect: "To collect",
    totalSpent: "Total Spent",
    newEntry: "New Entry",
    addReceipt: "Add a receipt to split with your group.",
    source: "Source",
    amount: "Amount",
    splitBy: "Split By",
    addJournal: "Add to Journal",
    journalLog: "Journal Log",
    entries: "Entries",
    copyReport: "Copy Report",
    clearAll: "Clear All",
    yourShare: "Your Share",
    noEntries: "No entries yet",
    addFirst: "Add your first receipt to get started",
    manageSources: "Manage Sources",
    addRemoveSources: "Add or remove your frequent stores.",
    addSource: "Add Source",
    copied: "Report copied to clipboard!",
    wipeData: "WIPE DATA?",
    reportTitle: "[SPLITLY REPORT]",
    confirm: "Confirm",
    cancel: "Cancel",
    resetWarning: "This will permanently delete all entries in your journal. Are you sure?"
  },
  fr: {
    title: "Splitly",
    subtitle: "Partage de facture moderne",
    toCollect: "À collecter",
    totalSpent: "Total dépensé",
    newEntry: "Nouvelle entrée",
    addReceipt: "Ajoutez un reçu à partager avec votre groupe.",
    source: "Source",
    amount: "Montant",
    splitBy: "Diviser par",
    addJournal: "Ajouter au journal",
    journalLog: "Journal de bord",
    entries: "Entrées",
    copyReport: "Copier le rapport",
    clearAll: "Tout effacer",
    yourShare: "Votre part",
    noEntries: "Aucune entrée",
    addFirst: "Ajoutez votre premier reçu pour commencer",
    manageSources: "Gérer les sources",
    addRemoveSources: "Ajoutez ou supprimez vos magasins fréquents.",
    addSource: "Ajouter",
    copied: "Rapport copié dans le presse-papier !",
    wipeData: "EFFACER LES DONNÉES ?",
    reportTitle: "[RAPPORT SPLITLY]",
    confirm: "Confirmer",
    cancel: "Annuler",
    resetWarning: "Cela supprimera définitivement toutes les entrées de votre journal. Êtes-vous sûr ?"
  }
};

interface HistoryItem {
  id: number;
  store: string;
  amount: number;
  split: number;
  date: string;
  share: number;
  isEditing?: boolean;
}

const DEFAULT_STORES = [
  "AMAZON", "COSTCO", "WALMART", "IGA", "MAXI", "SAQ", "GAS", "FOOD"
].sort();

export default function App() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('brutal_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [stores, setStores] = useState<string[]>(() => {
    const saved = localStorage.getItem('brutal_stores');
    return saved ? JSON.parse(saved) : DEFAULT_STORES;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('splitly_theme');
    return saved === 'dark';
  });

  const [language, setLanguage] = useState<'en' | 'fr'>(() => {
    const saved = localStorage.getItem('splitly_lang');
    return (saved as 'en' | 'fr') || 'en';
  });

  const t = TRANSLATIONS[language];

  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [showCopyToast, setShowCopyToast] = useState(false);

  // Form states
  const [selectedStore, setSelectedStore] = useState(stores[0] || '');
  const [amount, setAmount] = useState('');
  const [splitBy, setSplitBy] = useState('2');

  useEffect(() => {
    localStorage.setItem('brutal_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('brutal_stores', JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem('splitly_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('splitly_lang', language);
  }, [language]);

  const grandTotal = useMemo(() => history.reduce((acc, i) => acc + i.share, 0), [history]);
  const spentTotal = useMemo(() => history.reduce((acc, i) => acc + i.amount, 0), [history]);

  const handleAddItem = () => {
    const a = parseFloat(amount);
    const d = parseFloat(splitBy) || 1;
    if (isNaN(a)) return;

    const newItem: HistoryItem = {
      id: Date.now(),
      store: selectedStore,
      amount: a,
      split: d,
      date: new Date().toISOString().split('T')[0],
      share: a / d,
    };

    setHistory(prev => [newItem, ...prev]);
    setAmount('');
  };

  const handleDeleteItem = (id: number) => {
    setHistory(prev => prev.filter(i => i.id !== id));
  };

  const handleToggleEdit = (id: number) => {
    setHistory(prev => prev.map(i => i.id === id ? { ...i, isEditing: !i.isEditing } : i));
  };

  const handleUpdateItem = (id: number, field: keyof HistoryItem, value: any) => {
    setHistory(prev => prev.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: value };
        // Recalculate share if amount or split changes
        if (field === 'amount' || field === 'split') {
          const a = parseFloat(updated.amount as any) || 0;
          const s = parseFloat(updated.split as any) || 1;
          updated.share = a / s;
        }
        return updated;
      }
      return i;
    }));
  };

  const handleCopy = () => {
    if (history.length === 0) return;
    let text = `${t.reportTitle}\n\n`;
    history.forEach(i => {
      text += `${i.store}: ${i.amount.toFixed(2)}$ / ${i.split} = ${i.share.toFixed(2)}$\n`;
    });
    text += `\n---------------------------\n`;
    text += `${t.totalSpent.toUpperCase()}: ${spentTotal.toFixed(2)}$\n`;
    text += `${t.toCollect.toUpperCase()}: ${grandTotal.toFixed(2)}$`;
    navigator.clipboard.writeText(text);
    
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  const handleReset = () => {
    setIsResetModalOpen(true);
  };

  const confirmReset = () => {
    setHistory([]);
    setIsResetModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 transition-colors duration-300">
      {/* Modern Header */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Receipt size={22} />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">{t.title}</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 leading-none">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setLanguage(prev => prev === 'en' ? 'fr' : 'en')}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Languages size={16} />
              <span className="uppercase">{language}</span>
            </button>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
              <button 
                onClick={() => setIsDarkMode(false)}
                className={`p-2 rounded-full transition-all ${!isDarkMode ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
              >
                <Sun size={18} />
              </button>
              <button 
                onClick={() => setIsDarkMode(true)}
                className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-400' : 'text-slate-400'}`}
              >
                <Moon size={18} />
              </button>
            </div>
            <button 
              onClick={() => setIsStoreModalOpen(true)}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel: Inputs */}
        <div className="lg:col-span-5 space-y-6 md:space-y-8">
          <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60 dark:border-slate-700 space-y-6 md:space-y-8">
            <header>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.newEntry}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t.addReceipt}</p>
            </header>

            <div className="space-y-6">
              {/* Store Select */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.source}</label>
                <div className="relative group">
                  <select 
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 pr-10 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    {stores.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Amount & Split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.amount}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 pl-8 font-bold text-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.splitBy}</label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSplitBy(prev => Math.max(1, parseInt(prev) - 1).toString())}
                      className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <div className="relative flex-1">
                      <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="number" 
                        value={splitBy}
                        onChange={(e) => setSplitBy(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-center"
                      />
                    </div>
                    <button 
                      onClick={() => setSplitBy(prev => (parseInt(prev) + 1).toString())}
                      className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleAddItem}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-4 md:py-5 font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {t.addJournal} <Plus size={20} />
              </button>
            </div>
          </section>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-sm">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                <Wallet size={20} />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.totalSpent}</p>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">${spentTotal.toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700 shadow-sm">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                <Users size={20} />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.toCollect}</p>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">${grandTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Right Panel: Journal */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {t.journalLog} <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">{history.length}</span>
            </h2>
            <div className="flex gap-2 md:gap-3">
              <button 
                onClick={handleCopy} 
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                title={t.copyReport}
              >
                <Copy size={18} />
              </button>
              <button 
                onClick={handleReset} 
                className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-red-400 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-500/20"
                title={t.clearAll}
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {history.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className={`bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between border border-slate-200/60 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all group ${item.isEditing ? 'border-indigo-500 ring-2 ring-indigo-500/10' : ''}`}
                >
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-colors">
                      <Receipt size={20} />
                    </div>
                    <div className="flex-1">
                      {item.isEditing ? (
                        <div className="flex flex-col gap-2">
                          <select 
                            value={item.store}
                            onChange={(e) => handleUpdateItem(item.id, 'store', e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-sm font-bold outline-none"
                          >
                            {stores.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={item.amount}
                              onChange={(e) => handleUpdateItem(item.id, 'amount', e.target.value)}
                              className="w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-xs font-bold outline-none"
                            />
                            <input 
                              type="number" 
                              value={item.split}
                              onChange={(e) => handleUpdateItem(item.id, 'split', e.target.value)}
                              className="w-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-xs font-bold outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-bold text-slate-800 dark:text-slate-100">{item.store}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            <Calendar size={12} />
                            <span>{item.date}</span>
                            <span className="text-slate-200 dark:text-slate-700">•</span>
                            <span>${item.amount.toFixed(2)} / {item.split}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-6">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{t.yourShare}</p>
                      <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">${item.share.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleToggleEdit(item.id)}
                        className={`p-2 rounded-xl transition-all ${item.isEditing ? 'bg-indigo-600 text-white' : 'opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400'}`}
                      >
                        {item.isEditing ? <Check size={18} /> : <Edit2 size={18} />}
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {history.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                  <Receipt size={32} />
                </div>
                <p className="font-bold text-slate-400">{t.noEntries}</p>
                <p className="text-xs text-slate-300 dark:text-slate-500">{t.addFirst}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Store Modal */}
      <AnimatePresence>
        {isStoreModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.manageSources}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t.addRemoveSources}</p>
                </div>
                <button 
                  onClick={() => setIsStoreModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 mb-8">
                <input 
                  type="text" 
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="e.g. Starbucks"
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <button 
                  onClick={() => {
                    if (newStoreName) {
                      setStores(prev => [...prev, newStoreName.toUpperCase()].sort());
                      setNewStoreName('');
                    }
                  }}
                  className="bg-indigo-600 text-white px-6 py-4 sm:py-0 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none whitespace-nowrap"
                >
                  {t.addSource}
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {stores.map(s => (
                  <div key={s} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{s}</span>
                    <button 
                      onClick={() => setStores(prev => prev.filter(x => x !== s))}
                      className="text-slate-300 dark:text-slate-600 hover:text-red-500 p-1 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                  <RotateCcw size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.clearAll}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{t.resetWarning}</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setIsResetModalOpen(false)}
                    className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    onClick={confirmReset}
                    className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-none"
                  >
                    {t.confirm}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Copy Toast */}
      <AnimatePresence>
        {showCopyToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 dark:border-slate-200"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white">
              <Check size={14} />
            </div>
            <span className="font-bold text-sm">{t.copied}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
