import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Trash2 } from "lucide-react";

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  required?: boolean;
  onAddNew?: () => void;
  addNewLabel?: string;
  onDeleteOption?: (value: string | number) => void;
}

export function CustomSelect({ options, value, onChange, placeholder = "Selecione...", required = false, onAddNew, addNewLabel, onDeleteOption }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Hidden native select for form validation (e.g. required attribute) */}
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="opacity-0 absolute inset-0 pointer-events-none -z-10 w-full h-full"
        tabIndex={-1}
      >
        <option value="" disabled></option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 text-left border ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-700'} rounded-xl bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none flex items-center justify-between transition-all`}
      >
        <span className={selectedOption ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 dark:text-slate-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm text-center font-medium">Nenhuma opção disponível</div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                    String(value) === String(option.value)
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                  }`}
                >
                  <span className="flex-1">{option.label}</span>
                  <div className="flex items-center gap-2">
                    {onDeleteOption && (
                      <Trash2
                        className="w-4 h-4 text-slate-400 hover:text-red-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteOption(option.value);
                        }}
                      />
                    )}
                    {String(value) === String(option.value) && <Check className="w-4 h-4 text-primary" />}
                  </div>
                </button>
              ))
            )}
          </div>
          {onAddNew && (
            <div className="border-t border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-800/50">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
                className="w-full text-left px-3 py-2 text-sm text-primary dark:text-violet-400 font-bold rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
              >
                + {addNewLabel || "Adicionar nova"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
