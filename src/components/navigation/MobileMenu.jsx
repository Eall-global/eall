import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { FiSearch } from "react-icons/fi";
import MobileQuickActions from "./mobile/MobileQuickActions";
import MobileNavigation from "./mobile/MobileNavigation";
import MobileSocialLinks from "./mobile/MobileSocialLinks";

const MobileMenu = ({ isOpen, onClose, onSearch }) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query);
    setQuery("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="             
              fixed top-0 right-0
              h-full w-[85%] max-w-sm
              bg-white
              z-50
              shadow-2xl
              p-5
              flex flex-col
              gap-6
              overflow-y-auto
            "
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800!">Menu</h2>

              <button
                onClick={onClose}
                className="text-slate-800 hover:text-red-500 text-2xl"
              >
                <IoMdClose />
              </button>
            </div>

            {/* 🔍 SEARCH (PRIMARY UX ELEMENT) */}
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 border rounded-xl px-3 py-2"
            >
              <FiSearch className="text-slate-500" />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full outline-none text-sm"
              />
            </form>

            {/* 🚀 QUICK ACTIONS (CTA BLOCK) */}
            <MobileQuickActions onClose={onClose} />

            {/* NAVIGATION */}
            {/* <div className="border-t pt-4 flex flex-col gap-3 text-left">
             */}
            <MobileNavigation onClose={onClose} />
            {/* </div> */}

            <MobileSocialLinks />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
