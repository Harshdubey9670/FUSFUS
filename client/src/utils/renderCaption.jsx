import { Link } from "react-router-dom";

/**
 * Renders a post caption with clickable #hashtag and @mention links.
 * Plain text is rendered as-is; tokens become styled <Link> elements.
 */
export const RenderCaption = ({ caption }) => {
  if (!caption) return null;

  // Split by hashtags AND mentions, keeping the delimiters
  const parts = caption.split(/(#\w+|@\w+)/g);

  return (
    <span className="text-text-primary whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (/^#\w+$/.test(part)) {
          const tag = part.slice(1).toLowerCase();
          return (
            <Link
              key={index}
              to={`/app/hashtag/${tag}`}
              className="text-primary-500 hover:text-primary-400 font-medium transition-colors"
              onClick={e => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        if (/^@\w+$/.test(part)) {
          const username = part.slice(1).toLowerCase();
          return (
            <Link
              key={index}
              to={`/app/profile/u/${username}`}
              className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
              onClick={e => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};
