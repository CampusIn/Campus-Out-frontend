import React, { useState, useEffect, useRef, useMemo, useId, forwardRef, useImperativeHandle } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const Spinner = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite', color: '#64748b' }}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M21 12a9 9 0 1 1-6.2-8.6" />
  </svg>
);

const Combobox = forwardRef((
  {
    options = [],
    onSearch,
    value: valueProp,
    defaultValue,
    placeholder = "Search...",
    emptyMessage = "No results found",
    onChange,
    disabled = false,
    style = {}
  },
  ref
) => {
  const reduceMotion = useReducedMotion();
  const listboxId = useId();
  const isControlled = valueProp !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const value = isControlled ? valueProp : internal;

  const selectedOption = useMemo(() => {
    return options.find((o) => o.value === value);
  }, [options, value]);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [asyncResults, setAsyncResults] = useState([]);
  const rootRef = useRef(null);
  const reqId = useRef(0);

  useImperativeHandle(ref, () => rootRef.current);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Reset query when closed
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  // Async search
  useEffect(() => {
    if (!onSearch || !open) return;
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(() => {
      onSearch(query).then((res) => {
        if (id === reqId.current) {
          setAsyncResults(res || []);
          setLoading(false);
          setActive(0);
        }
      });
    }, 180);
    return () => clearTimeout(t);
  }, [query, onSearch, open]);

  const results = useMemo(() => {
    if (onSearch) return asyncResults;
    return options.filter((o) =>
      o.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query, onSearch, asyncResults]);

  const commit = (opt) => {
    if (disabled) return;
    if (!isControlled) setInternal(opt.value);
    onChange?.(opt.value, opt);
    setQuery("");
    setOpen(false);
  };

  const spring = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 520, damping: 32 };

  // Set the input display label
  const displayLabel = open ? query : (selectedOption?.label ?? "");

  return (
    <div
      ref={rootRef}
      className="godui-combobox-container"
      style={{ ...style }}
    >
      <div className="godui-combobox-input-wrapper">
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          value={displayLabel}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => !disabled && setOpen(true)}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && open && results[active]) {
              e.preventDefault();
              commit(results[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="godui-combobox-input"
        />
        <span className="godui-combobox-icon">
          {loading ? (
            <Spinner />
          ) : (
            <ChevronDown 
              size={16} 
              style={{ 
                transition: 'transform 0.2s', 
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                color: '#64748b'
              }} 
            />
          )}
        </span>
      </div>

      <AnimatePresence>
        {open && !disabled && (
          <motion.ul
            id={listboxId}
            role="listbox"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 }}
            transition={spring}
            className="godui-combobox-dropdown"
          >
            {!loading && results.length === 0 && (
              <li className="godui-combobox-empty">
                {emptyMessage}
              </li>
            )}
            {results.map((opt, i) => {
              const isActive = i === active;
              const isSelected = opt.value === value;
              return (
                <motion.li
                  key={opt.value}
                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : i * 0.02 }}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => commit(opt)}
                  className={`godui-combobox-option ${isActive ? "active" : ""} ${isSelected ? "selected" : ""}`}
                >
                  <div className="godui-combobox-option-details">
                    <span className="godui-combobox-option-label">{opt.label}</span>
                    {opt.description && (
                      <span className="godui-combobox-option-desc">{opt.description}</span>
                    )}
                  </div>
                  {isSelected && (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      style={{ width: '16px', height: '16px', color: 'currentColor' }}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
});

Combobox.displayName = "Combobox";

export default Combobox;
