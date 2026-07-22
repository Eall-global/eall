import { motion } from "framer-motion";

const variants = {
  primary:
    "bg-[#FF5500] hover:bg-[#e64d00] text-white shadow-sm hover:shadow-md",

  secondary:
    "bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow-md",

  outline:
    "border border-sky-700 text-sky-700 hover:bg-sky-700 hover:text-white",

  white: "bg-white text-slate-900 hover:bg-slate-100 shadow-lg",
};

const sizes = {
  sm: "px-4 py-2 text-sm",

  md: "px-6 py-3 text-base",

  lg: "px-8 py-4 text-lg",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  className = "",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-xl
        font-semibold
        transition-all
        duration-300
        disabled:opacity-60
        disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {iconLeft}

      {loading ? "Loading..." : children}

      {iconRight}
    </motion.button>
  );
};

export default Button;
