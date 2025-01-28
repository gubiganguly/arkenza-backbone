import ReactMarkdown from "react-markdown";
import "./TextHighlighter.css";

const TextHighlighter = ({
  text,
  highlightedWords,
  addBadWord,
  removeBadWord,
}: {
  text: string;
  highlightedWords: string[];
  addBadWord: (word: string) => void;
  removeBadWord: (word: string) => void;
}) => {
  const normalizeWord = (word: string) =>
    word
      .toLowerCase()
      .replace(/[^\w\s]|_/g, "")
      .replace(/\s+/g, ""); // Remove punctuation and convert to lowercase

  const handleWordClick = (word: string) => {
    const normalizedWord = normalizeWord(word);

    if (highlightedWords.includes(normalizedWord)) {
      removeBadWord(normalizedWord);
    } else {
      addBadWord(normalizedWord);
    }
  };

  const renderTextWithHighlight = (text: string) => {
    const words = text.split(" ");
    return words.map((word, index) => {
      const normalizedWord = normalizeWord(word);
      const isHighlighted = highlightedWords.includes(normalizedWord);
      return (
        <span
          key={index}
          className={
            isHighlighted ? "highlight-hover highlight" : "highlight-hover"
          }
          onClick={() => handleWordClick(word)}
        >
          {word}{" "}
        </span>
      );
    });
  };

  return (
    <div className="text-container pb-20">
      <ReactMarkdown
        components={{
          p: ({ node, ...props }) => (
            <p className="my-4 text-lg" {...props}>
              {renderTextWithHighlight(props.children as string)}
            </p>
          ),
          li: ({ node, ...props }) => (
            // @ts-expect-error - TypeScript doesn't know that the props are used
            <li {...props}>{renderTextWithHighlight(props.children)}</li>
          ),
          // You can add more elements here if needed
        }}
      >
        {text.toString()}
      </ReactMarkdown>
    </div>
  );
};

export default TextHighlighter;
