import React, { useState } from "react";
import { Client } from "@gradio/client";
import {
  ChevronDown,
  ChevronUp,
  Loader,
  SortAsc,
  SortDesc,
} from "lucide-react";

const NoteManager = () => {
  const [note, setNote] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest"); // or "oldest"

  const handleSummarize = async () => {
    const trimmedNote = note.trim();
    if (!trimmedNote) return;

    const alreadyExists = history.find((n) => n.original === trimmedNote);
    if (alreadyExists) return;

    setLoading(true);
    try {
      const client = await Client.connect("Shinichi876/quick_note_summarizer");
      const result = await client.predict("/predict", {
        input_text: trimmedNote,
      });

      const newEntry = {
        original: trimmedNote,
        summary: result.data,
        timestamp: Date.now(),
      };

      const updatedHistory =
        sortOrder === "newest"
          ? [newEntry, ...history]
          : [...history, newEntry];

      setHistory(updatedHistory);
      setNote("");
    } catch (error) {
      console.error("Summarization error:", error);
    }
    setLoading(false);
  };

  const toggleOpen = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const toggleSort = () => {
    const newOrder = sortOrder === "newest" ? "oldest" : "newest";
    setSortOrder(newOrder);
    setHistory([...history].reverse());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4 md:p-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-purple-800 mb-6">
          🗂️ AI Note Manager
        </h1>

        {/* Note input */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <textarea
            className="w-full border border-gray-300 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Write or paste your note here..."
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex justify-between items-center">
            <button
              onClick={handleSummarize}
              disabled={loading || !note.trim()}
              className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader className="animate-spin w-4 h-4" />
                  Summarizing...
                </span>
              ) : (
                "Add & Summarize"
              )}
            </button>

            <button
              onClick={toggleSort}
              className="flex items-center gap-1 text-purple-700 text-sm hover:underline"
            >
              {sortOrder === "newest" ? (
                <>
                  <SortDesc size={16} />
                  Newest First
                </>
              ) : (
                <>
                  <SortAsc size={16} />
                  Oldest First
                </>
              )}
            </button>
          </div>
        </div>

        {/* Note List */}
        <div className="mt-8 space-y-4">
          {history.length === 0 ? (
            <p className="text-center text-gray-400 mt-10">
              No notes added yet.
            </p>
          ) : (
            history.map((entry, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl shadow hover:shadow-md transition-all duration-300"
              >
                <button
                  onClick={() => toggleOpen(index)}
                  className="w-full flex justify-between items-center p-4 text-left group"
                >
                  <div className="flex gap-3 items-start">
                    <span className="text-sm font-bold text-purple-500 mt-1">
                      {sortOrder === "newest"
                        ? history.length - index
                        : index + 1}
                      .
                    </span>
                    <div className="text-gray-700 font-medium line-clamp-2 text-left">
                      {entry.original.slice(0, 100)}...
                    </div>
                  </div>
                  {openIndex === index ? (
                    <ChevronUp className="text-purple-600 group-hover:rotate-180 transition-transform" />
                  ) : (
                    <ChevronDown className="text-gray-400 group-hover:rotate-180 transition-transform" />
                  )}
                </button>

                {/* Summary section */}
                <div
                  className={`px-4 overflow-hidden transition-all duration-500 ease-in-out ${
                    openIndex === index ? "max-h-96 py-4" : "max-h-0"
                  }`}
                >
                  <p className="text-sm text-purple-900 whitespace-pre-wrap">
                    {entry.summary}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteManager;
