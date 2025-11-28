import { useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import nomadDemo1 from '@/assets/nomad-demo-1.png';
import nomadDemo2 from '@/assets/nomad-demo-2.png';
import nomadDemo3 from '@/assets/nomad-demo-3.png';

export const NomadShowcase = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 30 },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  useEffect(() => {
    if (!emblaApi) return;
  }, [emblaApi]);

  const slides = [
    { image: nomadDemo1, alt: 'NOMAD AI Assistant Security Analysis' },
    { image: nomadDemo2, alt: 'NOMAD AI Assistant Blockchain Analysis' },
    { image: nomadDemo3, alt: 'NOMAD AI Assistant IP Geolocation Analysis' }
  ];

  return (
    <section className="relative py-20 bg-transparent">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 text-foreground">
          Nomad Agent For Businesses & Governments In The Field
        </h2>
        
        <div className="max-w-6xl mx-auto">
          <div className="overflow-hidden rounded-xl shadow-2xl" ref={emblaRef}>
            <div className="flex">
              {slides.map((slide, index) => (
                <div key={index} className="flex-[0_0_100%] min-w-0">
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Indicator dots */}
          <div className="flex justify-center gap-2 mt-6">
            {slides.map((_, index) => (
              <button
                key={index}
                className="w-2 h-2 rounded-full bg-muted hover:bg-primary transition-colors"
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
