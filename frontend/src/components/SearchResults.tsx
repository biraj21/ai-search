import { Globe, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Source } from "@/types";
import Tooltip from "./ui/Tooltip";

interface SearchResultsProps {
  sources: Source[];
  content: string;
  isStreaming: boolean;
  hasStartedStreaming: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({ sources, content, isStreaming, hasStartedStreaming }) => {
  const responseRef = useRef<HTMLDivElement>(null);
  const [sourcesExpanded, setSourcesExpanded] = useState(true);

  // Auto-collapse sources when streaming starts
  useEffect(() => {
    if (hasStartedStreaming && sourcesExpanded) {
      setSourcesExpanded(false);
    }
  }, [hasStartedStreaming]);

  useEffect(() => {
    if (responseRef.current && isStreaming) {
      responseRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [content, isStreaming]);

  if (!content && !isStreaming && !sources.length) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {sources.length > 0 && (
        <div>
          {/* Sources Header with Toggle */}
          <button
            onClick={() => setSourcesExpanded(!sourcesExpanded)}
            className="flex items-center justify-between w-full p-3 bg-gray-900/50 border border-gray-800 rounded-lg hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-200">
                {sources.length} Source{sources.length !== 1 ? "s" : ""}
              </span>
              {!sourcesExpanded && (
                <div className="flex items-center gap-1">
                  {sources.slice(0, 3).map((source, index) => (
                    <div key={index} className="flex items-center">
                      {source.image && (
                        <img
                          src={source.image}
                          className="w-4 h-4 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.remove();
                          }}
                        />
                      )}
                    </div>
                  ))}
                  {sources.length > 3 && <span className="text-xs text-gray-500 ml-1">+{sources.length - 3}</span>}
                </div>
              )}
            </div>
            {sourcesExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Expandable Sources Grid */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              sourcesExpanded ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sources.map((source, index) => (
                <a
                  href={source.link}
                  target="_blank"
                  rel="noreferrer"
                  key={source.link}
                  className="block p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-gray-400 bg-gray-800 rounded border border-gray-700">
                      {index + 1}
                    </span>
                    {source.image && (
                      <img
                        src={source.image}
                        className="w-4 h-4 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.remove();
                        }}
                      />
                    )}
                  </div>
                  <h3 className="font-medium text-white text-sm line-clamp-2 mb-2 leading-tight">{source.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-1">{source.displayLink}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Answer Section */}
      {(content || isStreaming) && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="flex items-center font-medium text-lg mb-4 text-gray-200">
            <Sparkles className="w-4 mr-2 text-gray-400" />
            Answer
          </h2>

          {!content && isStreaming && (
            <div className="flex items-center gap-3 text-gray-400 py-8">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
              <span>Analyzing sources and generating answer...</span>
            </div>
          )}

          {content && (
            <div ref={responseRef} className="reading-optimized text-gray-100" id="search-response">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => {
                    return <div role="paragraph" className="paragraph" {...props} />;
                  },

                  a: ({ node, children, ...props }) => {
                    if (!node) {
                      throw new Error("node is undefined");
                    }

                    // @ts-ignore (probably their types are wrong idk)
                    const index = Number(node.children[0].value);
                    if (isNaN(index) || index < 0 || index >= sources.length) {
                      return (
                        <a {...props} target="_blank" rel="noreferrer">
                          {children}
                        </a>
                      );
                    }

                    const source = sources[index - 1];
                    props.href = source.link;

                    return (
                      <Tooltip
                        content={
                          <div className="w-64">
                            <div className="flex items-center mb-2 text-sm text-gray-400">
                              {source.image && (
                                <img
                                  src={source.image}
                                  className="w-4 h-4 object-cover rounded mr-2"
                                  onError={(e) => {
                                    e.currentTarget.remove();
                                  }}
                                />
                              )}
                              <small className="line-clamp-1">{source.displayLink}</small>
                            </div>
                            <h3 className="font-medium text-white mb-1 text-sm">{source.title}</h3>
                            <p className="line-clamp-3 text-sm text-gray-300 leading-relaxed">{source.snippet}</p>
                          </div>
                        }
                      >
                        <a {...props} href={source.link} target="_blank" rel="noreferrer" className="citation">
                          {index}
                        </a>
                      </Tooltip>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-flex items-center ml-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                  <span
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse ml-1"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse ml-1"
                    style={{ animationDelay: "0.4s" }}
                  ></span>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
