import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

const variants = {
  light: {
    card: "bg-white border border-slate-200 hover:border-sky-600",
    title: "text-slate-900",
    text: "text-slate-600",
    icon: "bg-[#0047D5]/10 text-sky-700",
    button: "text-sky-700 hover:text-sky-900",
  },

  dark: {
    card: "bg-slate-900 border border-slate-700 hover:border-sky-500",
    title: "text-white",
    text: "text-slate-300",
    icon: "bg-sky-700 text-white",
    button: "text-sky-400 hover:text-sky-300",
  },
};

const InfoCard = ({
  icon,
  title,
  description,
  badge,
  link,
  buttonText = "Learn More",
  variant = "light",
}) => {
  const style = variants[variant];

  return (
    <div
      className={` ${style.card} rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative group `}
    >
      {badge && (
        <span className="text-xl text-gray-100 group-hover:text-[#0047D5]/20 transition-colors duration-500  absolute top-6 right-8  font-semibold">
          {badge}
        </span>
      )}

      <div
        className={` ${style.icon} w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold transition group-hover:scale-110 `}
      >
        {icon}
      </div>

      <h3 className={`${style.title} text-lg font-semibold mt-6`}>{title}</h3>

      <p className={`${style.text} mt-2 text-xs leading-relaxed`}>
        {description}
      </p>

      {link && (
        <Link
          to={link}
          className={`${style.button} inline-flex items-center gap-2 mt-8 font-semibold`}
        >
          {buttonText}
          <FiArrowRight />
        </Link>
      )}
    </div>
  );
};

export default InfoCard;
