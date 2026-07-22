import { motion } from "framer-motion";
import { brands } from "../../data/brandsData";

const positions = [
  "top-8 left-10",
  "top-20 left-40",
  "top-12 right-10",
  "top-6 right-48",
  "top-36 left-4",
  "top-32 right-24",
  "bottom-28 left-28",
  "bottom-20 right-24",
  "bottom-4 right-6",
  "bottom-4 left-6",
  "bottom-8 left-1/2 -translate-x-1/2",
  "top-52 left-1/2 -translate-x-1/2",
];

const BrandCollage = () => {
  const logoBrands = brands.slice(0, 12);

  return (
    <div
      className="
relative
h-105
w-full
overflow-hidden
"
    >
      {/* LEFT FADE */}

      <div
        className="
absolute
left-0
top-0
bottom-0
w-32
bg-linear-to-r
from-white
to-transparent
z-10
pointer-events-none
"
      />

      {/* RIGHT FADE */}

      <div
        className="
absolute
right-0
top-0
bottom-0
w-32
bg-linear-to-l
from-white
to-transparent
z-10
pointer-events-none
"
      />

      {logoBrands.map((brand, index) => (
        <motion.div
          key={brand.slug}
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 0.45 + index * 0.07,
            y: 0,
          }}
          transition={{
            duration: 0.6,
            delay: index * 0.1,
          }}
          whileHover={{
            opacity: 1,
            scale: 1.08,
          }}
          className={`
absolute
${positions[index]}

w-24
h-16

md:w-32
md:h-20

flex
items-center
justify-center

transition
duration-300
`}
        >
          <img
            src={brand.logo}
            alt={brand.name}
            className="
max-w-full
max-h-full
object-contain
"
          />
        </motion.div>
      ))}
    </div>
  );
};

export default BrandCollage;
