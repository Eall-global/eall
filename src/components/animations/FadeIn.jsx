import { motion } from "framer-motion";
import { fadeIn } from "../../utils/motionVariants";

const FadeIn = ({ children, className = "" }) => {
  return (
    <motion.div
      className={className}
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;
