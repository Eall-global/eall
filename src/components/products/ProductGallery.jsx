import { useState, useEffect } from "react";
import { FiImage } from "react-icons/fi";

const ProductGallery = ({ gallery = [], name }) => {
  const images = gallery.length ? gallery : ["/placeholder-product.png"];

  const [activeImage, setActiveImage] = useState(images[0]);

  useEffect(() => {
    setActiveImage(images[0]);
  }, [gallery]);

  return (
    <div className="space-y-5">
      {/* Main Image */}
      <div
        className="
          bg-white
          border
          border-slate-200
          rounded-3xl
          overflow-hidden
          aspect-square
          flex
          items-center
          justify-center
          group
        "
      >
        <img
          src={activeImage}
          alt={name}
          className="
            w-full
            h-full
            object-contain
            p-8
            transition-transform
            duration-500
            group-hover:scale-110
          "
        />
      </div>

      {/* Thumbnails */}
      <div className="flex justify-center gap-4 flex-wrap">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setActiveImage(image)}
            className={`
              rounded-xl
              border
              overflow-hidden
              transition
              ${
                activeImage === image
                  ? "border-sky-600 ring-2 ring-sky-200"
                  : "border-slate-200 hover:border-slate-400"
              }
            `}
          >
            <img
              src={image}
              alt={`${name} ${index + 1}`}
              className="
                w-20
                h-20
                object-contain
                bg-white
                p-2
              "
            />
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-slate-500">
        {images.length} Product {images.length === 1 ? "Image" : "Images"}{" "}
        Available
      </p>

      {/* Empty State */}
      {!gallery.length && (
        <div
          className="
            flex
            items-center
            justify-center
            gap-2
            text-sm
            text-slate-400
          "
        >
          <FiImage />
          Additional product images coming soon.
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
