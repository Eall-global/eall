import Container from "../../components/common/Container";
import SectionTitle from "../../components/common/SectionTitle";
import ProductCard from "../../components/products/ProductCard";

const ProductListingPage = ({
  title,
  description,
  products = [],
  breadcrumbs = [],
}) => {
  return (
    <section className=" min-h-fit">
      <Container className="py-20">
        {/* Breadcrumb */}
        {breadcrumbs.length > 0 && (
          <nav className="text-sm text-slate-500 mb-8 flex flex-wrap items-center gap-2 mt-10">
            {breadcrumbs.map((item, index) => (
              <span key={index} className="flex items-center gap-2">
                {index > 0 && <span className="text-slate-400">/</span>}

                {item.href ? (
                  <a
                    href={item.href}
                    className="hover:text-blue-600 transition"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="font-medium text-slate-700">
                    {item.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Page Heading */}
        <SectionTitle description={description} className="text-left" />

        {/* Product Count */}
        <div className=" mt-4 flex items-center justify-between">
          <p className="text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {products.length}
            </span>{" "}
            Products
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mt-10">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
              <h3 className="text-xl font-semibold text-slate-700">
                No Products Found
              </h3>

              <p className="mt-3 text-slate-500">
                Products for this section will be available soon.
              </p>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
};

export default ProductListingPage;
