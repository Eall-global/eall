import { motion } from "framer-motion";
import { scaleIn } from "../../utils/motionVariants";

const ScaleIn = ({ children, className = "" }) => {
  return (
    <motion.div
      className={className}
      variants={scaleIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default ScaleIn;
