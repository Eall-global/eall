import { FaFacebookSquare, FaLinkedin, FaTiktok } from "react-icons/fa";

import { GrInstagram } from "react-icons/gr";

const MobileSocialLinks = () => {
  return (
    <section className="border-t pt-6">
      <p className="text-xs uppercase tracking-wider text-slate-500 mb-4!">
        Follow Us
      </p>

      <div className="flex justify-center gap-6 text-2xl">
        <a href="https://facebook.com/" target="_blank" rel="noreferrer">
          <FaFacebookSquare className="text-sky-600" />
        </a>

        <a
          href="https://instagram.com/eall.global"
          target="_blank"
          rel="noreferrer"
        >
          <GrInstagram className="text-pink-500" />
        </a>

        <a href="https://linkedin.com" target="_blank" rel="noreferrer">
          <FaLinkedin className="text-sky-700" />
        </a>

        <a
          href="https://tiktok.com/@eall.global"
          target="_blank"
          rel="noreferrer"
        >
          <FaTiktok />
        </a>
      </div>
    </section>
  );
};

export default MobileSocialLinks;
