
import React from 'react';
import { APP_TITLE } from '../constants';
import { PlusIcon } from './icons';

interface HeaderProps {
  onAddItemClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddItemClick }) => {
  return (
    <header className="bg-primary-700 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <div className="text-xs text-primary-200">EKIP MEDICAL CENTRE</div>
          <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
        </div>
        <button
          onClick={onAddItemClick}
          className="bg-success-500 hover:bg-success-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors duration-150"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add New Item
        </button>
      </div>
    </header>
  );
};

export default Header;
