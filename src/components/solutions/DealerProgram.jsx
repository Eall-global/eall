import Container from "../common/Container";

import { Link } from "react-router-dom";

const DealerProgram = () => {
  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-gray-100">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-5xl text-slate-900!">Become An E-ALL Partner</h2>

        <p className="mt-6 text-lg text-sky-100">
          Join our dealer network and access trusted electronics supply,
          competitive pricing and business support.
        </p>

        <Link
          to="/contact"
          className="inline-block mt-8 bg-white text-sky-700 px-8 py-4 rounded-xl font-semibold"
        >
          Apply As Dealer
        </Link>
      </div>
    </section>
  );
};

export default DealerProgram;
