import { motion } from "framer-motion";
import { staggerContainer } from "../../utils/motionVariants";

const StaggerContainer = ({ children, className = "" }) => {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default StaggerContainer;
