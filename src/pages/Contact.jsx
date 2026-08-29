import React from "react";
import ContactHero from "../components/Contact/ContactHero";
import ContactLinks from "../components/Contact/ContactLinks";
import B2BProcurementHub from "../components/Contact/B2BProcurementHub";
import Container from "../components/common/Container";

const Contact = () => {
  return (
    <div className="w-full bg-white">
      <Container className="py-6 sm:py-10 lg:py-12 w-full max-w-[1600px] px-4 sm:px-8 lg:px-12">
        <ContactHero />
        <ContactLinks />
        <B2BProcurementHub />
      </Container>
    </div>
  );
};

export default Contact;
