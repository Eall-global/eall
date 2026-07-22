import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

const news = [
  {
    title: "E-ALL Expands Distribution Network in Middle East",
    date: "June 2026",
  },
  {
    title: "New Partnership with Global Smartphone Manufacturers",
    date: "May 2026",
  },
  {
    title: "Strengthening Supply Chain for African Markets",
    date: "April 2026",
  },
];

const NewsSection = () => {
  return (
    <section>
      <Container className="py-20">
        <SectionTitle
          className="flex flex-col items-center text-center"
          label="News"
          title="Latest Updates"
          description="Stay updated with our business growth and global partnerships."
        />

        <div className="grid md:grid-cols-3 gap-8 mt-10">
          {news.map((item, index) => (
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
              <p className="text-sm text-slate-500 mb-2">{item.date}</p>

              <h3 className="font-semibold text-slate-800">{item.title}</h3>

              <button className="mt-4 text-blue-700 font-medium hover:underline">
                Read More →
              </button>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default NewsSection;
