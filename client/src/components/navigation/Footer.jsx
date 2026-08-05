import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-border-soft py-6 bg-bg-base text-center text-sm text-text-secondary">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} SnapGram AI. All rights reserved.</p>
        <div className="flex space-x-6">
          <Link to="/about" className="hover:text-text-primary transition-colors">About</Link>
          <Link to="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
};
