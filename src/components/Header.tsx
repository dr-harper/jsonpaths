const Header = () => {
  return (
    <header className="bg-gradient-to-r from-primary to-primary-dark text-white py-4 px-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg 
            className="w-8 h-8" 
            viewBox="0 0 32 32" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="8" cy="8" r="3" fill="#06B6D4"/>
            <circle cx="24" cy="8" r="3" fill="#06B6D4"/>
            <circle cx="16" cy="16" r="3" fill="#06B6D4"/>
            <circle cx="8" cy="24" r="3" fill="#06B6D4"/>
            <circle cx="24" cy="24" r="3" fill="#06B6D4"/>
            <path d="M8 11v10M24 11v10M11 8h10M11 24h10M11 16h10" stroke="#06B6D4" strokeWidth="1.5"/>
          </svg>
          <div>
            <h1 className="text-2xl font-bold">JSON Path Navigator</h1>
            <p className="text-sm text-blue-100">Navigate JSON, Generate Multi-Language Paths</p>
          </div>
        </div>
        <div className="text-sm text-blue-100">
          v1.0.0
        </div>
      </div>
    </header>
  );
};

export default Header;