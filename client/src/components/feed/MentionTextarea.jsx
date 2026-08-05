import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, AtSign } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import api from "../../services/api";

/**
 * A smart textarea that shows a @mention autocomplete dropdown.
 * Drop-in replacement for <textarea> in the caption field.
 */
export const MentionTextarea = ({ value, onChange, placeholder, maxLength, className }) => {
  const [mentionQuery, setMentionQuery] = useState(null); // string after '@', or null
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState(null);
  const textareaRef = useRef(null);

  // Debounce the mention query
  useEffect(() => {
    if (mentionQuery === null) return;
    const t = setTimeout(() => setDebouncedQuery(mentionQuery), 250);
    return () => clearTimeout(t);
  }, [mentionQuery]);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery === null || debouncedQuery === "") {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api.get(`/api/search/users?q=${encodeURIComponent(debouncedQuery)}`)
      .then(res => {
        if (!cancelled && res.data.success) {
          setSuggestions(res.data.data.slice(0, 6));
          setActiveIndex(0);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Detect @ pattern while typing
  const handleChange = (e) => {
    const val = e.target.value;
    onChange(e);

    // Find the @ before the cursor
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
    } else {
      setMentionQuery(null);
      setSuggestions([]);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (suggestions.length === 0 || mentionQuery === null) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      insertMention(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setMentionQuery(null);
      setSuggestions([]);
    }
  };

  const insertMention = (user) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const currentVal = value;
    const textBeforeCursor = currentVal.slice(0, cursorPos);
    const textAfterCursor = currentVal.slice(cursorPos);

    // Replace the @partial with @username + space
    const replaced = textBeforeCursor.replace(/@(\w*)$/, `@${user.username} `);
    const newValue = replaced + textAfterCursor;

    // Fire synthetic onChange
    onChange({ target: { value: newValue } });

    // Reset dropdown
    setMentionQuery(null);
    setSuggestions([]);

    // Move cursor to after the inserted username
    const newCursorPos = replaced.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const showDropdown = mentionQuery !== null && (loading || suggestions.length > 0);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        className={className}
      />

      {/* Mention Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-bg-surface border border-border-soft rounded-2xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-text-secondary text-sm">
              <AtSign className="w-4 h-4" />
              No users found
            </div>
          ) : (
            suggestions.map((user, index) => (
              <button
                key={user._id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); insertMention(user); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  index === activeIndex ? "bg-primary-500/10" : "hover:bg-bg-surface-hover"
                }`}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-border-soft">
                  <Avatar src={user.profilePicture || user.avatar} alt={user.username} className="w-full h-full rounded-full" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-text-primary text-sm truncate">@{user.username}</span>
                  {user.fullName && <span className="text-text-secondary text-xs truncate">{user.fullName}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
