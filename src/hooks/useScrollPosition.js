import { useEffect, useState } from "react";

const useScrollPosition = (threshold = 80) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > threshold;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);

    // initial check
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return scrolled;
};

export default useScrollPosition;
