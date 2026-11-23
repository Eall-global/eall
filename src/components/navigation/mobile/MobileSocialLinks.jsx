import { FaFacebookSquare, FaLinkedin, FaTiktok } from "react-icons/fa";
import { GrInstagram } from "react-icons/gr";

const MobileSocialLinks = () => {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Follow E-ALL
      </span>
      <div className="flex items-center gap-3.5 text-lg">
        <a
          href="https://facebook.com/"
          target="_blank"
          rel="noreferrer"
          aria-label="Facebook"
          className="text-sky-600 hover:opacity-80 transition"
        >
          <FaFacebookSquare />
        </a>
        <a
          href="https://instagram.com/eall.global"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
          className="text-pink-500 hover:opacity-80 transition"
        >
          <GrInstagram />
        </a>
        <a
          href="https://linkedin.com"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          className="text-sky-700 hover:opacity-80 transition"
        >
          <FaLinkedin />
        </a>
        <a
          href="https://tiktok.com/@eall.global"
          target="_blank"
          rel="noreferrer"
          aria-label="TikTok"
          className="text-slate-800 hover:opacity-80 transition"
        >
          <FaTiktok />
        </a>
      </div>
    </div>
  );
};

export default MobileSocialLinks;
