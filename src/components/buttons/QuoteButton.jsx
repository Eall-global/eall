import { HiOutlineArrowRight } from "react-icons/hi";
import Button from "../common/Button";

const QuoteButton = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      variant="primary"
      size="sm"
      iconRight={<HiOutlineArrowRight />}
    >
      Get a Quote
    </Button>
  );
};

export default QuoteButton;
