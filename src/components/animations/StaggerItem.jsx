import { motion } from "framer-motion";
import { slideRight } from "../../utils/motionVariants";

const StaggerItem = ({ children, className = "" }) => {
  return (
    <motion.div className={className} variants={slideRight}>
      {children}
    </motion.div>
  );
};

export default StaggerItem;
