import { useState } from "react";
import { FiX } from "react-icons/fi";
import useSearch from "./useSearch";
import SearchResults from "./SearchResults";

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const results = useSearch(query);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <div className="bg-white w-full max-w-3xl rounded-2xl p-6 shadow-xl">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Search Products & Brands</h2>

          <button onClick={onClose}>
            <FiX className="text-2xl" />
          </button>
        </div>

        {/* INPUT */}
        <input
          type="text"
          placeholder="Search for Apple, Samsung, iPhone..."
          className="w-full mt-4 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {/* RESULTS */}
        <SearchResults results={results} />
      </div>
    </div>
  );
};

export default SearchModal;
