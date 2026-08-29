import { motion } from "framer-motion";

/**
 * Common SectionTitle component supporting:
 * - Two Theme Color Types: Orange (#FF5500) and Blue (#0047D5 / text-sky-700)
 * - Responsive Description Width: Full width on mobile (100%), 70% width on web layout (md:w-[70%])
 * - Proper Alignment Matching (Center or Left aligned)
 */
const SectionTitle = ({
  label,
  title,
  description,
  className = "",
  variant, // 'orange' | 'blue'
  color,   // 'orange' | 'blue'
}) => {
  const isCenter = className.includes("text-center") || className.includes("items-center");

  // Determine color theme: explicit prop or deduced from alignment
  const chosenColor = color || variant || (isCenter ? "orange" : "blue");
  const labelColorClass = chosenColor === "orange" ? "text-[#FF5500]" : "text-sky-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`mb-10 sm:mb-14 w-full ${className}`}
    >
      {label && (
        <p
          className={`
            uppercase
            tracking-wider
            font-bold
            text-[11.5px]
            sm:text-xs
            mb-2.5
            ${labelColorClass}
          `}
        >
          {label}
        </p>
      )}

      {title && (
        <h2
          className="text-2xl sm:text-3xl lg:text-4xl text-slate-900 leading-tight tracking-tight font-normal"
          style={{ fontFamily: "sans-serif" }}
        >
          {title}
        </h2>
      )}

      {description && (
        <p
          className={`
            mt-3
            sm:mt-4
            text-xs
            sm:text-sm
            md:text-base
            text-slate-600
            leading-relaxed
            w-full
            md:w-[70%]
            ${isCenter ? "text-center mx-auto" : "text-left ml-0 mr-auto"}
          `}
        >
          {description}
        </p>
      )}
    </motion.div>
  );
};

export default SectionTitle;
