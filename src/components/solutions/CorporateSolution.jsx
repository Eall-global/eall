import { FiCheckCircle } from "react-icons/fi";
import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

const CorporateSolution = () => {
  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-white">
      <SectionTitle
        className=" text-left"
        label="CORPORATE SOLUTIONS"
        title="Technology Procurement For Organizations"
        description="Helping businesses and institutions source technology products efficiently for their operational needs."
      />

      <div className="mt-12 grid md:grid-cols-3 gap-8">
        {[
          "Bulk Device Procurement",
          "Customized Business Quotations",
          "Dedicated Account Management",
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl bg-slate-50 p-8 font-semibold text-lg flex gap-4 items-center"
          >
            <FiCheckCircle className="text-sky-700" /> {item}
          </div>
        ))}
      </div>
    </section>
  );
};

export default CorporateSolution;
