import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";
import {
  FiSmartphone,
  FiHeadphones,
  FiWatch,
  FiBatteryCharging,
} from "react-icons/fi";
import { MdOutlineDevices } from "react-icons/md";
import { FaWifi } from "react-icons/fa";

const categories = [
  {
    title: "Smartphones",
    icon: <FiSmartphone size={26} />,
  },
  {
    title: "Accessories",
    icon: <MdOutlineDevices size={26} />,
  },
  {
    title: "Audio Devices",
    icon: <FiHeadphones size={26} />,
  },
  {
    title: "Wearables",
    icon: <FiWatch size={26} />,
  },
  {
    title: "Power Solutions",
    icon: <FiBatteryCharging size={26} />,
  },
  {
    title: "Networking",
    icon: <FaWifi size={26} />,
  },
];

const ProductCategories = () => {
  return (
    <section className="py-20 bg-white">
      <Container>
        <SectionTitle
          className="flex flex-col items-center text-center"
          label="Products"
          title="Product Categories"
          description="Explore our wide range of electronics and mobile technology solutions tailored for retail and enterprise needs."
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-10">
          {categories.map((cat, index) => (
            <div
              key={index}
              className="
                group
                bg-slate-50
                hover:bg-blue-700
                transition
                rounded-xl
                p-6
                text-center
                cursor-pointer
              "
            >
              <div className="flex justify-center text-blue-700 group-hover:text-white transition">
                {cat.icon}
              </div>

              <h3 className="mt-4 font-semibold text-slate-800 group-hover:text-white transition">
                {cat.title}
              </h3>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default ProductCategories;
