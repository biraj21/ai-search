import { Brain } from "lucide-react";
import { useState } from "react";

import SearchInput from "./components/SearchInput";
import SearchResults from "./components/SearchResults";
import { Source } from "./types";

// we only have one endpoint for now so let's keep it simple
const SEARCH_ENDPOINT = "http://localhost:8080/search";

function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSearch = async (query: string) => {
    setSources([]);
    setContent("");
    setIsStreaming(true);

    await streamResult(
      query,
      (newContent) => {
        setContent((prev) => prev + newContent);
      },
      setSources
    );

    setIsStreaming(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Compact header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800 border border-gray-700">
              <Brain className="w-4 h-4 text-gray-300" />
            </div>
            <h1 className="text-xl font-semibold text-white">AI Search</h1>
          </div>
        </div>

        <div className="space-y-6">
          <SearchInput onSearch={handleSearch} isLoading={isStreaming} />
          {(sources.length > 0 || content || isStreaming) && (
            <SearchResults
              sources={sources}
              content={content}
              isStreaming={isStreaming}
              hasStartedStreaming={!!content}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

const streamResult = async (
  query: string,
  onAnswer: (newContent: string) => void,
  onSources: (sources: Source[]) => void
) => {
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set("q", query);

  // first thing would be sources
  let sourcesReceived = false;

  const buffer: string[] = [];

  const evtSource = new EventSource(url.toString());
  evtSource.onmessage = async (event) => {
    try {
      if (event.data === "[DONE]") {
        const rest = buffer.join("");
        if (rest) {
          onAnswer(rest);
        }

        evtSource.close();
        return;
      }

      const data = JSON.parse(event.data);
      if (!sourcesReceived) {
        onSources(data);
        sourcesReceived = true;
        return;
      }

      const content: string | undefined = data.choices[0].delta.content;
      if (!content) {
        return;
      }

      const joined = buffer.join("") + content;
      if (joined.split(/\s+/).length > 4) {
        onAnswer(joined);
        buffer.length = 0;
      } else {
        buffer.push(content);
      }
    } catch (error) {
      console.error("error while streaming response:", error);
      evtSource.close();
    }
  };
};
