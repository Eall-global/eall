const FilterBadge = ({ count }) => {
  if (!count) return null;

  return (
    <span
      className="
absolute
-top-2
-right-2
bg-sky-700
text-white
text-[10px]
font-bold
h-5
w-5
rounded-full
flex
items-center
justify-center
"
    >
      {count}
    </span>
  );
};

export default FilterBadge;
