import { HiOutlineArrowRight } from "react-icons/hi";
import { FiBriefcase } from "react-icons/fi";
import Button from "../common/Button";

const QuoteButton = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      variant="primary"
      size="sm"
      iconLeft={<FiBriefcase className="text-sm" />}
      iconRight={<HiOutlineArrowRight className="text-xs" />}
      className="text-xs font-bold tracking-tight rounded-xl shadow-xs"
    >
      B2B Wholesale
    </Button>
  );
};

export default QuoteButton;
