import { motion } from "framer-motion";
import { slideRight } from "../../utils/motionVariants";

const SlideRight = ({ children, className = "" }) => {
  return (
    <motion.div
      className={className}
      variants={slideRight}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default SlideRight;
