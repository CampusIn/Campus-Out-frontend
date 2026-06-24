import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select Option', 
  disabled = false, 
  style = {} 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (val) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => 
    typeof opt === 'object' ? opt.value === value : opt === value
  );

  const displayLabel = selectedOption 
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : placeholder;

  return (
    <div 
      ref={dropdownRef} 
      className="custom-select-container" 
      style={{ position: 'relative', width: '100%', ...style }}
    >
      <button
        type="button"
        className="input-pill"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          height: style.height || '46px',
          fontSize: '0.85rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          width: '100%',
          backgroundColor: '#f8fafc',
          border: '1.5px solid #eef0eb',
          borderRadius: style.borderRadius || '50px',
          textAlign: 'left',
          color: value ? 'var(--vendor-text-main)' : '#64748b',
          fontWeight: 600,
          fontFamily: 'Outfit, sans-serif',
          marginBottom: 0
        }}
      >
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {displayLabel}
        </span>
        <ChevronDown 
          size={16} 
          style={{ 
            color: '#64748b', 
            transition: 'transform 0.2s', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0 
          }} 
        />
      </button>

      {isOpen && (
        <ul
          className="custom-select-options-list"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            border: '1px solid #eef0eb',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            padding: '6px',
            margin: 0,
            listStyle: 'none',
            zIndex: 999,
            maxHeight: '220px',
            overflowY: 'auto',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '0.85rem'
          }}
        >
          {placeholder && (
            <li
              onClick={() => handleSelect('')}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'background-color 0.15s',
                fontWeight: 600
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8faf9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              {placeholder}
            </li>
          )}
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            const isSelected = optVal === value;

            return (
              <li
                key={optVal}
                onClick={() => handleSelect(optVal)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--vendor-primary-light)' : 'transparent',
                  color: isSelected ? 'var(--vendor-primary)' : 'var(--vendor-text-main)',
                  fontWeight: isSelected ? 800 : 600,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.target.style.backgroundColor = '#f8faf9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {optLabel}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
