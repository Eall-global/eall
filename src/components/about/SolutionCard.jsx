import { motion } from "framer-motion";

const SolutionCard = ({ item }) => {
  const Icon = item.icon;

  return (
    <motion.div
      whileHover={{
        y: -6,
      }}
      transition={{
        duration: 0.25,
      }}
      className="
        bg-white
        rounded-2xl
        border
        border-slate-100
        shadow-sm
        hover:shadow-xl
        p-6
        group
      "
    >
      <div
        className="
          w-12
          h-12
          rounded-xl
          bg-sky-100
          text-sky-700
          flex
          items-center
          justify-center
          text-2xl
          group-hover:bg-sky-700
          group-hover:text-white
          transition
        "
      >
        <Icon />
      </div>

      <h3
        className="
          mt-5
          text-lg
          font-bold
          text-slate-900
        "
      >
        {item.title}
      </h3>

      <p
        className="
          mt-3
          text-sm
          leading-6
          text-slate-600
        "
      >
        {item.description}
      </p>
    </motion.div>
  );
};

export default SolutionCard;
