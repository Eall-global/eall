import React from "react";
import Container from "../common/Container";

const ContactHero = () => {
  return (
    <section className=" mt-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center text-left">
        <div style={{ opacity: 1, transform: "none" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-[#0047D5]">
            Get In Touch
          </p>
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight leading-tight text-gray-900! flex flex-col">
            Let's talk<span className="text-[#0047D5]">business</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed max-w-lg text-gray-500">
            Whether you need pricing, stock availability, or want to explore a
            partnership — we're one message away.
          </p>
        </div>
        <div className=" lg:p-10" style={{ opacity: 1, transform: "none" }}>
          <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
            <img
              src="/effect.png"
              alt="Abstract glowing fiber optic connectivity representing global business communication"
              className="w-full aspect-16/10 object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactHero;
