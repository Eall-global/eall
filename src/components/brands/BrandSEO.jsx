import { Helmet } from "react-helmet-async";

const BrandSEO = ({ brand }) => {
  return (
    <Helmet>
      <title>{brand.name} Products Distributor | E-ALL</title>

      <meta
        name="description"
        content={`${brand.name} products supplied by E-ALL.
Wholesale electronics distribution,
bulk orders and business solutions.`}
      />

      <meta
        name="keywords"
        content={`
${brand.name},
${brand.name} distributor,
${brand.name} wholesale UAE,
electronics supplier
`}
      />
    </Helmet>
  );
};

export default BrandSEO;
