import ContactHero from "../components/Contact/ContactHero";
import ContactLinks from "../components/Contact/ContactLinks";
import B2BProcurementHub from "../components/Contact/B2BProcurementHub";
import Container from "../components/common/Container";

const Contact = () => {
  return (
    <div className="w-full bg-white pt-[88px] sm:pt-[104px] xl:pt-[148px]">
      <Container className="py-6 sm:py-10 lg:py-12 w-full px-4 sm:px-6 lg:px-8">
        <ContactHero />
        <ContactLinks />
        <B2BProcurementHub />
      </Container>
    </div>
  );
};

export default Contact;
