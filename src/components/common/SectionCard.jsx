const SectionCard = ({ title, children, className = "" }) => {
  return (
    <section
      className={`
        bg-white
        rounded-2xl
        border
        border-slate-200
        shadow-sm
        p-8
        ${className}
      `}
    >
      {title && (
        <h2
          className="
            text-xl!
            font-bold
            text-slate-900!
            mb-6
            text-left
          "
        >
          {title}
        </h2>
      )}

      {children}
    </section>
  );
};

export default SectionCard;
