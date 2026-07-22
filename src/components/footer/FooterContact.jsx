import { FiMapPin, FiPhone, FiMail, FiClock } from "react-icons/fi";

import { contact } from "./footerData";

const FooterContact = () => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-5">Contact</h3>

      <div className="space-y-5">
        <div className="flex gap-3">
          <FiMapPin className="text-sky-400 mt-1" />

          <div className="text-slate-400 text-sm leading-6">
            {contact.address.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <FiPhone className="text-sky-400 mt-1" />

          <span className="text-slate-400 text-sm">{contact.phone}</span>
        </div>

        <div className="flex gap-3">
          <FiMail className="text-sky-400 mt-1" />

          <span className="text-slate-400 text-sm">{contact.email}</span>
        </div>

        <div className="flex gap-3">
          <FiClock className="text-sky-400 mt-1" />

          <div className="text-slate-400 text-sm">
            {contact.hours.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterContact;
