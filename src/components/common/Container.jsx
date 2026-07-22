const Container = ({ children, className = "" }) => {
  return (
    <div
      className={`
        w-full
        mx-auto
        px-5
        md:px-8
        bg-white
        lg:px-10
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Container;
