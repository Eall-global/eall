import { motion } from "framer-motion";

const SectionTitle = ({ label, title, description, className = "" }) => {
  const isCenter = className.includes("text-center");

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`mb-14 ${className}`}
    >
      {label && (
        <p
          className={`
            uppercase
            tracking-wider
            font-semibold
            text-[12px]
            mb-3
            ${isCenter ? "text-[#FF5500]" : "text-sky-700"}
          `}
        >
          {label}
        </p>
      )}

      <h2
        className="text-4xl! !lg:text-5xl text-slate-900! leading-relaxed! tracking-tight!"
        style={{ fontFamily: "sans-serif", fontWeight: 400 }}
      >
        {title}
      </h2>

      {description && (
        <p className="mt-5 text-slate-600 text-md leading-relaxed mx-auto max-w-xl">
          {description}
        </p>
      )}
    </motion.div>
  );
};

export default SectionTitle;
