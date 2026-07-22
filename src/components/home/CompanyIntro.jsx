import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

const CompanyIntro = () => {
  return (
    <section className="py-20 bg-white">
      <Container>
        <SectionTitle
          label="About E-ALL"
          title="Electronics All (E-ALL)"
          description="A trusted global distributor of smartphones, accessories, and consumer electronics, serving businesses across Africa, the Middle East, and international markets."
        />

        <div className="grid md:grid-cols-2 gap-10 items-center mt-10">
          {/* LEFT TEXT */}
          <div className="flex flex-col gap-5 text-slate-700 leading-7 text-justify">
            <p>
              E-ALL specializes in supplying genuine mobile devices,
              accessories, and electronic products sourced directly from
              globally recognized manufacturers.
            </p>

            <p>
              We support retailers, wholesalers, and enterprise clients with
              scalable distribution solutions, competitive pricing, and reliable
              logistics networks.
            </p>

            <p>
              Our mission is to power global connectivity by delivering
              authentic technology products with consistency and trust.
            </p>

            <div className="flex gap-4 pt-4">
              <button className="px-6 py-3 bg-sky-700 text-white rounded-xl hover:bg-sky-800 transition">
                Learn More
              </button>

              <button className="px-6 py-3 border border-sky-700 text-sky-700 rounded-xl hover:bg-sky-700 hover:text-white transition">
                Our Brands
              </button>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1580910051074-3eb694886505"
              alt="E-ALL Distribution"
              className="rounded-2xl shadow-lg w-full object-cover"
            />

            {/* Floating badge */}
            <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-xl shadow text-sm font-semibold">
              Global Distribution Network
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default CompanyIntro;
