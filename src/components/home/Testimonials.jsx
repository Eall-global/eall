import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

const testimonials = [
  {
    name: "Retail Partner - Dubai",
    message:
      "E-ALL has consistently delivered genuine products with excellent logistics support.",
  },
  {
    name: "Distributor - Kenya",
    message:
      "Reliable supplier with competitive pricing and fast response times.",
  },
  {
    name: "Wholesale Buyer - Saudi Arabia",
    message:
      "Their supply chain efficiency helped us scale our retail operations quickly.",
  },
];

const Testimonials = () => {
  return (
    <section>
      <Container className=" py-20 bg-gray-100!">
        <SectionTitle
          className="flex flex-col items-center text-center"
          label="Testimonials"
          title="What Our Partners Say"
          description="Trusted by retailers and distributors across multiple regions."
        />

        <div className="grid md:grid-cols-3 gap-8 mt-10">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="
                bg-white
                shadow-xs
                hover:shadow-sm
                p-6
                rounded-2xl
                border
                border-slate-100
                transition
              "
            >
              <p className="text-slate-600 italic mb-4">"{item.message}"</p>

              <h4 className="font-semibold text-blue-700">{item.name}</h4>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Testimonials;
