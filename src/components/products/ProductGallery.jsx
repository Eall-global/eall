import { useState, useEffect, useRef } from "react";
import { FiImage } from "react-icons/fi";

const ProductGallery = ({ gallery = [], name }) => {
  const images = gallery.length ? gallery : ["/placeholder-product.png"];
  const touchStart = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeImage = images[currentIndex];
  const galleryRef = useRef(null);

  useEffect(() => {
    setCurrentIndex(0);
  }, [gallery]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  useEffect(() => {
    const gallery = galleryRef.current;

    if (!gallery) return;

    const handleKey = (e) => {
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };

    gallery.addEventListener("keydown", handleKey);

    return () => gallery.removeEventListener("keydown", handleKey);
  }, []);

  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStart.current == null) return;

    const distance = touchStart.current - e.changedTouches[0].clientX;

    if (distance > 60) nextImage();

    if (distance < -60) prevImage();

    touchStart.current = null;
  };

  return (
    <section>
      <div className="space-y-5">
        {/* Main Image */}
        <div
          ref={galleryRef}
          tabIndex={0}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="
          relative
          bg-white
          border
          border-slate-200
          rounded-3xl
          overflow-hidden
         h-80 sm:h-105 lg:h-130 xl:h-150
          flex
          items-center
          justify-center
          group
        "
        >
          <div
            className="flex h-full transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {images.map((image) => (
              <div
                key={image}
                className="min-w-full h-full flex items-center justify-center"
              >
                <img
                  src={image}
                  alt={name}
                  className="
max-w-full
max-h-full
object-contain
p-6
lg:p-8
transition-transform
duration-300
group-hover:scale-105
"
                />
              </div>
            ))}
          </div>
          <button
            onClick={prevImage}
            className="
        absolute
        left-4
        top-1/2
        -translate-y-1/2
        hidden
lg:flex

items-center
justify-center

w-11
h-11

rounded-full

bg-white/90
backdrop-blur
shadow-md

hover:bg-white
transition
    "
          >
            ‹
          </button>

          <button
            onClick={nextImage}
            className="
        absolute
        right-4
        top-1/2
        -translate-y-1/2
       hidden
lg:flex

items-center
justify-center

w-11
h-11

rounded-full

bg-white/90
backdrop-blur
shadow-md

hover:bg-white
transition
    "
          >
            ›
          </button>
        </div>

        {/* Thumbnails */}
        <div className="flex justify-center gap-3 overflow-x-auto scrollbar-hide pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
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
    </section>
  );
};

export default ProductGallery;
