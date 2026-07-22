import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
} from "react-icons/fa";

import { socialLinks } from "./footerData";

const icons = {
  Facebook: FaFacebookF,
  Instagram: FaInstagram,
  LinkedIn: FaLinkedinIn,
  TikTok: FaTiktok,
};

const FooterSocial = () => {
  return (
    <div className="flex gap-3">
      {socialLinks.map((item) => {
        const Icon = icons[item.name];

        return (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="
              w-10
              h-10
              rounded-full
              bg-slate-900
              hover:bg-sky-600
              transition
              flex
              items-center
              justify-center
            "
          >
            <Icon className="text-white" />
          </a>
        );
      })}
    </div>
  );
};

export default FooterSocial;
