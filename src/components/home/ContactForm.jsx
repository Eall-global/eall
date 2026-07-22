import { FaEnvelopeOpenText, FaPhoneAlt } from "react-icons/fa";
import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";
import { IoLocationSharp } from "react-icons/io5";

const ContactForm = () => {
  return (
    <section className="py-20 bg-white">
      <Container>
        <SectionTitle
          label="Contact"
          title="Get in Touch With Us"
          description="Reach out for partnerships, wholesale inquiries, or product information."
        />

        <div className="grid md:grid-cols-2 gap-10 mt-10">
          {/* LEFT INFO */}
          <div className="space-y-4 text-slate-600 border border-slate-200 p-6 rounded-xl shadow">
            <p className=" flex gap-4 items-center px-4 py-3">
              <IoLocationSharp /> Dubai, United Arab Emirates
            </p>
            <p className=" flex gap-4 items-center px-4 py-3">
              <FaEnvelopeOpenText /> info@e-all.com
            </p>
            <p className=" flex gap-4 items-center px-4 py-3">
              <FaPhoneAlt /> +971 50 000 0000
            </p>

            <p className="mt-6">
              We respond to all business inquiries within 24 hours.
            </p>
          </div>

          {/* RIGHT FORM */}
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              className="w-full border border-slate-200 p-3 rounded-xl"
            />

            <input
              type="email"
              placeholder="Email Address"
              className="w-full border border-slate-200 p-3 rounded-xl"
            />

            <input
              type="text"
              placeholder="Company Name"
              className="w-full border border-slate-200 p-3 rounded-xl"
            />

            <textarea
              placeholder="Your Message"
              rows="5"
              className="w-full border border-slate-200 p-3 rounded-xl"
            />

            <button
              type="submit"
              className="
                w-full
                bg-blue-700
                text-white
                py-3
                rounded-xl
                font-semibold
                hover:bg-blue-800
                transition
              "
            >
              Send Message
            </button>
          </form>
        </div>
      </Container>
    </section>
  );
};

export default ContactForm;
