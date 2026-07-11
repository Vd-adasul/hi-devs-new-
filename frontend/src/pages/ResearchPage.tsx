import React, { useState } from 'react';
import { api } from '../lib/api.js';
import {
  Search,
  BookOpen,
  FileText
} from 'lucide-react';
import { VoiceInput } from '../components/common/VoiceInput.js';
import { VoiceOutput } from '../components/common/VoiceOutput.js';

export default function ResearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [memo, setMemo] = useState('');
  const [generatingMemo, setGeneratingMemo] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setMemo('');

    try {
      const res = await api.get(`/research/search?query=${encodeURIComponent(query)}`);
      setResults(res.data.data || []);
    } catch (err) {
      alert('Indian Kanoon precedent lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMemo = async () => {
    if (results.length === 0) return;
    setGeneratingMemo(true);

    try {
      const docIds = results.map(r => r.tid);
      const res = await api.post('/research/memo', { query, docIds });
      setMemo(res.data.memo);
    } catch (err) {
      alert('Failed to generate statutory memo.');
    } finally {
      setGeneratingMemo(false);
    }
  };

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto bg-white text-gray-900 rounded-xl shadow-sm border border-gray-100 mt-4" data-testid="research-page">
      <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            Statutory Research
          </h1>
          <p className="text-[12px] text-gray-500 mt-1">
            Search Indian Kanoon legal precedents and synthesize structured legal memos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Search Panel */}
        <div className="bg-gray-50 border border-gray-200/60 shadow-sm rounded-xl p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Precedent Lookup</h3>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search precedents (e.g. section 138)..."
                className="w-full bg-white border border-gray-300 rounded-lg py-1.5 pl-9 pr-4 text-sm placeholder-gray-400 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
            <VoiceInput onTranscript={(t) => setQuery(prev => `${prev} ${t}`)} />
            <button type="submit" disabled={loading} className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs py-1.5 px-4 font-semibold transition-colors disabled:opacity-50">
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {/* Results list */}
          <div className="flex flex-col gap-3 max-h-80 overflow-y-auto mt-2">
            {results.map((res) => (
              <div key={res.tid} className="p-3 border border-gray-200 bg-white rounded-lg text-xs shadow-sm">
                <h4 className="font-bold text-gray-800 leading-tight">{res.title}</h4>
                <div className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded mt-1.5 inline-block border border-indigo-100">
                  Doc ID: {res.tid}
                </div>
              </div>
            ))}
            {results.length > 0 && (
              <button
                onClick={handleGenerateMemo}
                disabled={generatingMemo}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs py-2 mt-2 font-semibold transition-colors disabled:opacity-50"
              >
                <FileText size={14} />
                {generatingMemo ? 'Assembling Statutory Memo...' : 'Synthesize Research Memo'}
              </button>
            )}
            {results.length === 0 && !loading && (
              <p className="text-xs text-gray-400 text-center py-12">Search to fetch Indian Kanoon precedents.</p>
            )}
          </div>
        </div>

        {/* Memo Viewer */}
        <div className="md:col-span-2 bg-gray-50 border border-gray-200/60 shadow-sm rounded-xl p-5 flex flex-col gap-4 min-h-[350px]">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-600" /> Compiled Statutory Memo
            </h3>
            {memo && <VoiceOutput text={memo} label="Hear statutory memo summary" />}
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {memo ? (
              <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap bg-white border border-gray-200 rounded-lg p-4 shadow-sm font-sans">
                {memo}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-24 bg-white border border-gray-200 border-dashed rounded-lg">
                Research memo will be rendered here after synthesizing Indian Kanoon precedent listings.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
