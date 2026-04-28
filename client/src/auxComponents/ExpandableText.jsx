import { useMemo, useState } from "react";

export const ExpandableText = ({
  text,
  limit = 30,
  className = "",
  textClassName = "",
  buttonClassName = "",
  preserveLineBreaks = true,
}) => {
  const [expanded, setExpanded] = useState(false);

  const normalizedText = useMemo(() => {
    return typeof text === "string" ? text.trim() : "";
  }, [text]);

  if (!normalizedText) return <span className={className}>—</span>;

  const isLong = normalizedText.length > limit;
  const displayedText =
    !isLong || expanded
      ? normalizedText
      : `${normalizedText.slice(0, limit).trim()}...`;

  return (
    <div className={className}>
      <div
        className={`${textClassName} ${
          preserveLineBreaks ? "whitespace-pre-wrap break-words" : ""
        }`}
      >
        {displayedText}
      </div>

      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={`mt-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-500 ${buttonClassName}`}
        >
          {expanded ? "Скрыть" : "Показать больше"}
        </button>
      ) : null}
    </div>
  );
};