import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: (Option | { label: string; options: Option[] })[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, multiple = false, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  const handleOptionClick = (optionValue: string) => {
    if (multiple) {
      const newValue = Array.isArray(value) ? [...value] : [];
      const index = newValue.indexOf(optionValue);
      if (index > -1) {
        newValue.splice(index, 1);
      } else {
        newValue.push(optionValue);
      }
      onChange(newValue);
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getDisplayValue = () => {
    if (multiple) {
      if (Array.isArray(value) && value.length > 0) {
        return `${value.length} selected`;
      }
      return placeholder;
    }
    const selectedOption = options.flatMap(opt => 'options' in opt ? opt.options : [opt]).find(opt => opt.value === value);
    return selectedOption ? selectedOption.label : placeholder;
  };

  const filteredOptions = options.map(option => {
    if ('options' in option) {
      const filteredSubOptions = option.options.filter(subOption =>
        subOption.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return { ...option, options: filteredSubOptions };
    }
    return option;
  }).filter(option => {
    if ('options' in option) {
      return option.options.length > 0;
    }
    return option.label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="relative" ref={selectRef}>
      <div
        className="w-full p-3 bg-black bg-opacity-20 border border-gray-600 rounded-lg flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-white">{getDisplayValue()}</span>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 flex flex-col">
          <div className="p-2 border-b border-gray-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full p-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto">
            {filteredOptions.map((option, index) => (
              'options' in option ? (
                <div key={index}>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400">{option.label}</div>
                  {option.options.map(subOption => (
                    <div
                      key={subOption.value}
                      className={`p-3 cursor-pointer text-white hover:bg-blue-600/50 ${multiple && Array.isArray(value) && value.includes(subOption.value) ? 'bg-blue-600' : ''}`}
                      onClick={() => handleOptionClick(subOption.value)}
                    >
                      {subOption.label}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  key={option.value}
                  className={`p-3 cursor-pointer text-white hover:bg-blue-600/50 ${!multiple && value === option.value ? 'bg-blue-600' : ''}`}
                  onClick={() => handleOptionClick(option.value)}
                >
                  {option.label}
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
