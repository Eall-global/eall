import { FiStar, FiCheckCircle } from "react-icons/fi";

const REVIEWS = [
  {
    name: "Ahmed Al-Mansoori",
    role: "Verified Retail Buyer • Dubai, UAE",
    tag: "Retail Order",
    tagCls: "bg-sky-50 text-sky-700 border-sky-200/80",
    rating: 5,
    message:
      "Ordered my iPhone with same-day Dubai delivery. Sealed official box, instant VAT tax invoice, and verified the IMEI straight on E-ALL’s portal.",
  },
  {
    name: "Rashid Mobile Trading LLC",
    role: "Wholesale Dealer • Deira, Dubai",
    tag: "B2B Bulk",
    tagCls: "bg-orange-50 text-orange-700 border-orange-200/80",
    rating: 5,
    message:
      "Our go-to partner for HMD and Nokia carton stock. Transparent landed pricing, fast EXW pickup from Dubai Silicon Oasis, and reliable stock allocation.",
  },
  {
    name: "Kofi Mensah Enterprises",
    role: "Regional Distributor • Accra & Nairobi",
    tag: "Export Partner",
    tagCls: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    rating: 5,
    message:
      "Consistent genuine units, proper export documentation, and responsive WhatsApp account managers for every CIF air cargo shipment.",
  },
];

const Testimonials = () => {
  return (
    <section className="py-10 sm:py-12 bg-white border-t border-slate-200/70 text-left">
      <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
              Verified Customer &amp; Dealer Reviews
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-0.5">
              Trusted by Shoppers &amp; Distributors Across UAE, GCC &amp; Africa
            </h2>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-800 self-start sm:self-auto">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className="fill-amber-400 text-xs" />
              ))}
            </div>
            <span>4.9 / 5 Verified Rating</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {REVIEWS.map((review) => (
            <div
              key={review.name}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(review.rating)].map((_, i) => (
                      <FiStar key={i} className="fill-amber-400 text-xs" />
                    ))}
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${review.tagCls}`}
                  >
                    {review.tag}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  &ldquo;{review.message}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {review.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">{review.role}</p>
                </div>
                <FiCheckCircle className="text-emerald-500 text-base shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
