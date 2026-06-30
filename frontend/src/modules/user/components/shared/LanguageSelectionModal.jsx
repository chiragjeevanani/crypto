import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';

const INDIAN_LANGUAGES = [
  { name: 'English', native: 'English', gradient: 'from-blue-600 to-indigo-700' },
  { name: 'Hindi', native: 'हिन्दी', gradient: 'from-orange-500 to-red-600' },
  { name: 'Bengali', native: 'বাংলা', gradient: 'from-pink-500 to-rose-600' },
  { name: 'Marathi', native: 'മराठी', gradient: 'from-amber-500 to-orange-600' },
  { name: 'Punjabi', native: 'ਪੰਜਾਬੀ', gradient: 'from-yellow-400 to-amber-500' },
  { name: 'Gujarati', native: 'ગુજરાતી', gradient: 'from-purple-500 to-indigo-600' },
  { name: 'Tamil', native: 'தமிழ்', gradient: 'from-emerald-500 to-teal-600' },
  { name: 'Malayalam', native: 'മലയാളം', gradient: 'from-teal-400 to-cyan-600' },
  { name: 'Kannada', native: 'ಕನ್ನಡ', gradient: 'from-violet-500 to-purple-600' },
  { name: 'Telugu', native: 'తెలుగు', gradient: 'from-cyan-500 to-blue-600' },
  { name: 'Bhojpuri', native: 'भोजपुरी', gradient: 'from-blue-500 to-indigo-600' },
  { name: 'Odia', native: 'ଓଡ଼ିଆ', gradient: 'from-fuchsia-500 to-purple-700' },
  { name: 'Rajasthani', native: 'राजस्थानी', gradient: 'from-pink-400 to-pink-600' },
  { name: 'Assamese', native: 'অসমীয়া', gradient: 'from-emerald-600 to-green-700' },
  { name: 'Haryanvi', native: 'हरयाणवी', gradient: 'from-lime-500 to-green-600' }
];

export default function LanguageSelectionModal() {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const updateProfile = useUserStore((state) => state.updateProfile);

  const toggleLanguage = (langName) => {
    if (selected.includes(langName)) {
      setSelected(selected.filter((item) => item !== langName));
    } else {
      if (selected.length >= 3) {
        // Limit to 3 choices
        alert("You can choose up to 3 languages as preferences.");
        return;
      }
      setSelected([...selected, langName]);
    }
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      alert("Please select at least 1 language to continue.");
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        languages: selected,
        hasSelectedLanguages: true
      });
    } catch (err) {
      console.error("Failed to save language preferences:", err);
      alert("Failed to save language preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md overflow-y-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[520px] bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative text-white"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Choose <span className="text-amber-500">Your Language</span>
          </h2>
          <p className="text-neutral-400 text-sm">
            Available in 14+ Indian Languages. Select up to 3 preferences.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1 mb-8 custom-scrollbar">
          {INDIAN_LANGUAGES.map((lang) => {
            const isSelected = selected.includes(lang.name);
            return (
              <motion.div
                key={lang.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleLanguage(lang.name)}
                className={`relative rounded-2xl p-4 cursor-pointer overflow-hidden h-24 flex flex-col justify-between transition-all shadow-lg ${
                  isSelected 
                    ? `bg-gradient-to-br ${lang.gradient} ring-2 ring-white shadow-xl` 
                    : 'bg-neutral-800 border border-neutral-700 hover:bg-neutral-700/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                    {lang.name}
                  </span>
                  {isSelected && (
                    <div className="bg-white rounded-full p-0.5 flex items-center justify-center shadow-md">
                      <Check className="text-neutral-900 w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <span className="text-xl font-bold tracking-tight text-white">
                    {lang.native}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || selected.length === 0}
            className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              selected.length > 0 && !loading
                ? 'bg-amber-500 hover:bg-amber-600 text-neutral-900 active:scale-98 shadow-lg shadow-amber-500/20 cursor-pointer'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
            }`}
          >
            {loading ? 'Saving Preferences...' : 'Proceed to Home'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
          
          <div className="text-center">
            <span className="text-neutral-500 text-xs">
              Selected {selected.length} of 3 maximum preferences
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
