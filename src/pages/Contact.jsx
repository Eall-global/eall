import React from "react";

import ContactHero from "../components/Contact/ContactHero";
import ContactLinks from "../components/Contact/ContactLinks";
import QuickEnquiry from "../components/Contact/QuickEnquiry";
import Container from "../components/common/Container";

const Contact = () => {
  return (
    <>
      <Container className=" py-10 lg:py-20">
        <ContactHero />
        <ContactLinks />
        <QuickEnquiry />
      </Container>
    </>
  );
};

export default Contact;
