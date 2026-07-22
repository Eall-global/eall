import { FiMail } from "react-icons/fi";
import Container from "../common/Container";

const FooterTopCTA = () => {
  return (
    <section className="bg-linear-to-r from-sky-700 via-blue-700 to-slate-900">
      <div className="p-6 lg:p-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Stay Connected with E-ALL
          </h2>

          <p className="mt-4 text-sky-100 leading-7">
            Receive the latest product launches, exclusive offers, industry
            news, and technology updates delivered directly to your inbox.
          </p>

          <form className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <div className="relative flex-1 max-w-xl">
              <FiMail
                className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
              />

              <input
                type="email"
                placeholder="Enter your email address"
                className="
                    w-full
                    pl-12
                    pr-4
                    py-4
                    rounded-xl
                    bg-white
                    text-slate-800
                    focus:outline-none
                    focus:ring-4
                    focus:ring-sky-300
                  "
              />
            </div>

            <button
              className="
                  px-8
                  py-4
                  rounded-xl
                  bg-slate-900
                  text-white
                  font-semibold
                  hover:bg-black
                  transition
                "
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default FooterTopCTA;
