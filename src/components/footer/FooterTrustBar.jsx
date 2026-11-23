import { FiCheckCircle, FiLock } from "react-icons/fi";

const TRUST_BADGES = [
  "100% Genuine Products",
  "Official 12-Month Warranty",
  "UAE VAT (TRN) Tax Invoices",
  "Dubai Silicon Oasis Export Hub",
];

const PAYMENT_METHODS = [
  "Visa",
  "Mastercard",
  "Apple Pay",
  "Tabby",
  "Tamara",
  "Wave Transfer",
  "Cash on Delivery",
  "Bank Wire",
];

const FooterTrustBar = () => {
  return (
    <div className="border-y border-slate-800/80 bg-slate-950/80">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {TRUST_BADGES.map((item) => (
            <div
              key={item}
              className="flex items-center justify-center sm:justify-start gap-2 text-slate-300 text-xs sm:text-sm font-medium"
            >
              <FiCheckCircle className="text-sky-400 shrink-0 text-sm sm:text-base" />
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>

        <div className="pt-3.5 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <FiLock className="text-emerald-400" />
            Accepted Retail &amp; B2B Payment Methods
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {PAYMENT_METHODS.map((pm) => (
              <span
                key={pm}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300"
              >
                {pm}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterTrustBar;
