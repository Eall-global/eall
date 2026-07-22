import { motion } from "framer-motion";
import { slideLeft } from "../../utils/motionVariants";

const SlideLeft = ({ children, className = "" }) => {
  return (
    <motion.div
      className={className}
      variants={slideLeft}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default SlideLeft;
