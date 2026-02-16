export default function Footer() {
  const currentYear = 2026;

  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4 mt-auto">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-6">
          <p>© {currentYear} VISERA. All rights reserved.</p>
          <span className="text-gray-300">|</span>
          <p className="text-xs">Version 1.0.0</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-primary transition-colors">
            Help
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Documentation
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
