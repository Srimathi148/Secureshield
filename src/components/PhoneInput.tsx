import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import {
  COUNTRIES,
  POPULAR_COUNTRIES,
  type CountryOption,
  parsePhoneNumber,
} from '../data/countries';

export interface PhoneInputProps {
  id?: string;
  value: string;
  onChange: (fullNumber: string, country: CountryOption) => void;
  defaultCountryCode?: string; // 'IN' or 'US'
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  label?: string;
  error?: string | null;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  id = 'phone-input',
  value,
  onChange,
  defaultCountryCode = 'IN',
  required = false,
  disabled = false,
  className = '',
  placeholder,
  label,
  error,
}) => {
  // Parse incoming value to determine initial country and national number
  const parsed = parsePhoneNumber(value, defaultCountryCode);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(parsed.country);
  const [nationalNumber, setNationalNumber] = useState<string>(parsed.nationalNumber);

  // Dropdown open & search state
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastEmittedValueRef = useRef<string>(value);

  // Sync state if external value changes (e.g. form reset or profile load)
  useEffect(() => {
    if (value === lastEmittedValueRef.current) return;
    lastEmittedValueRef.current = value;

    const updated = parsePhoneNumber(value, defaultCountryCode);
    if (value && value.trim().startsWith('+')) {
      setSelectedCountry(updated.country);
      setNationalNumber(updated.nationalNumber);
    } else {
      setNationalNumber(updated.nationalNumber);
    }
  }, [value, defaultCountryCode]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input on open
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle country selection
  const handleSelectCountry = (country: CountryOption) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');

    // Reconstruct full international number
    const trimmed = nationalNumber.trim();
    const fullNumber = trimmed ? `${country.dialCode} ${trimmed}` : '';
    lastEmittedValueRef.current = fullNumber;
    onChange(fullNumber, country);

    // Re-focus number input for speedy typing
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Handle national number input change
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;

    // Check if the user pasted a full international number starting with +
    if (rawVal.trim().startsWith('+')) {
      const parsedPaste = parsePhoneNumber(rawVal, selectedCountry.code);
      setSelectedCountry(parsedPaste.country);
      setNationalNumber(parsedPaste.nationalNumber);
      const full = parsedPaste.nationalNumber ? `${parsedPaste.country.dialCode} ${parsedPaste.nationalNumber}` : '';
      lastEmittedValueRef.current = full;
      onChange(full, parsedPaste.country);
      return;
    }

    // Allow digits, spaces, parentheses, hyphens
    const sanitized = rawVal.replace(/[^\d\s\-()]/g, '');
    setNationalNumber(sanitized);

    const trimmed = sanitized.trim();
    const fullNumber = trimmed ? `${selectedCountry.dialCode} ${trimmed}` : '';
    lastEmittedValueRef.current = fullNumber;
    onChange(fullNumber, selectedCountry);
  };

  // Filter countries by search query
  const filteredCountries = COUNTRIES.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dialCode.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label */}
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Input container with Country Selector & Phone Number input */}
      <div className="relative" ref={dropdownRef}>
        <div
          className={`flex items-stretch rounded-xl border bg-slate-50 dark:bg-slate-950 transition-all ${
            isOpen
              ? 'ring-2 ring-cyber-500/20 border-cyber-500'
              : error
              ? 'border-rose-300 dark:border-rose-900 ring-2 ring-rose-500/10'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          {/* Country Trigger Button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800 rounded-l-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors focus:outline-none"
            aria-label={`Selected country: ${selectedCountry.name}, dial code ${selectedCountry.dialCode}`}
            title="Click to change country"
          >
            <span className="text-base leading-none" role="img" aria-label={selectedCountry.name}>
              {selectedCountry.flag}
            </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {selectedCountry.dialCode}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-cyber-500' : ''
              }`}
            />
          </button>

          {/* National Number Input */}
          <div className="relative flex-1 flex items-center">
            <input
              ref={inputRef}
              id={id}
              type="tel"
              required={required}
              disabled={disabled}
              placeholder={placeholder || selectedCountry.format}
              value={nationalNumber}
              onChange={handleNumberChange}
              className="w-full px-3 py-2.5 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />

            {nationalNumber && !disabled && (
              <button
                type="button"
                onClick={() => {
                  setNationalNumber('');
                  onChange('', selectedCountry);
                  inputRef.current?.focus();
                }}
                className="p-1.5 mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                title="Clear number"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-80 max-w-[92vw] z-50 bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Search header */}
            <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search country or code (e.g. India, +91, US)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyber-500 focus:ring-1 focus:ring-cyber-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Suggested / Popular section (if no search active) */}
            {!searchQuery && (
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 py-1">
                  Suggested Countries
                </div>
                <div className="grid grid-cols-2 gap-1 mt-0.5">
                  {POPULAR_COUNTRIES.map((country) => {
                    const isSelected = selectedCountry.code === country.code;
                    return (
                      <button
                        key={`pop-${country.code}`}
                        type="button"
                        onClick={() => handleSelectCountry(country)}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${
                          isSelected
                            ? 'bg-cyber-500/15 text-cyber-700 dark:text-cyber-300 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="text-sm">{country.flag}</span>
                        <span className="truncate flex-1">{country.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{country.dialCode}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scrollable country list */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
              {filteredCountries.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No countries matching "{searchQuery}"
                </div>
              ) : (
                filteredCountries.map((country) => {
                  const isSelected = selectedCountry.code === country.code;
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleSelectCountry(country)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-left transition-colors ${
                        isSelected
                          ? 'bg-cyber-500/15 text-cyber-700 dark:text-cyber-300 font-semibold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-base">{country.flag}</span>
                        <span className="truncate">{country.name}</span>
                        <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {country.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="font-mono font-medium text-slate-500 dark:text-slate-400">
                          {country.dialCode}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyber-500 shrink-0" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom info footer */}
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 text-[10px] font-mono text-slate-400 flex items-center justify-between px-3">
              <span>{COUNTRIES.length} countries supported</span>
              <span>Selected: {selectedCountry.name} ({selectedCountry.dialCode})</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected country format hint / badge */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span className="flex items-center gap-1">
          <span>{selectedCountry.flag}</span>
          <span className="font-medium text-slate-600 dark:text-slate-400">{selectedCountry.name} format:</span>
          <span className="font-mono text-slate-500">{selectedCountry.dialCode} {selectedCountry.format}</span>
        </span>
        {nationalNumber.trim() && (
          <span className="font-mono text-[10px] text-cyber-600 dark:text-cyber-400 font-semibold">
            {selectedCountry.dialCode} {nationalNumber.trim()}
          </span>
        )}
      </div>

      {error && (
        <div className="text-[11px] text-rose-500 dark:text-rose-400 font-medium px-1">
          {error}
        </div>
      )}
    </div>
  );
};
