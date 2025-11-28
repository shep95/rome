import { useEffect, useCallback, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import nomadDemo1 from '@/assets/nomad-demo-1.png';
import nomadDemo2 from '@/assets/nomad-demo-2.png';
import nomadDemo3 from '@/assets/nomad-demo-3.png';

export const NomadShowcase = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 30 },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

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
          <div className="relative group">
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
            
            {/* Navigation Buttons */}
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Indicator dots */}
          <div className="flex justify-center gap-2 mt-6">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  selectedIndex === index 
                    ? 'bg-primary w-8' 
                    : 'bg-muted hover:bg-muted-foreground/50'
                }`}
                onClick={() => scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Contact Information */}
          <div className="text-center mt-8">
            <p className="text-lg md:text-xl text-muted-foreground">
              To use the Nomad Agent, please contact{' '}
              <a 
                href="mailto:asher@zorakcorp.com" 
                className="text-primary hover:underline font-medium"
              >
                asher@zorakcorp.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
