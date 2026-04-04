"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { API_URL } from "@/lib/api"

interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  category: string;
}

const defaultGalleryItems: GalleryItem[] = [
  {
    id: "1",
    src: "/images/gallery-1.jpg",
    alt: "Culte dominical",
    category: "Cultes",
  },
  {
    id: "2",
    src: "/images/gallery-2.jpg",
    alt: "Etude biblique jeunesse",
    category: "Jeunesse",
  },
  {
    id: "3",
    src: "/images/gallery-3.jpg",
    alt: "Mission de rue",
    category: "Missions",
  },
  {
    id: "4",
    src: "/images/gallery-4.jpg",
    alt: "Bapteme",
    category: "Evenements",
  },
  {
    id: "5",
    src: "/images/gallery-5.jpg",
    alt: "Chorale",
    category: "Cultes",
  },
  {
    id: "6",
    src: "/images/gallery-6.jpg",
    alt: "Repas communautaire",
    category: "Evenements",
  },
]

export function Gallery() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(defaultGalleryItems)
  const [categories, setCategories] = useState<string[]>(["Tous", "Cultes", "Jeunesse", "Missions", "Evenements"])
  const [isVisible, setIsVisible] = useState(false)
  const [activeCategory, setActiveCategory] = useState("Tous")
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  // Helper function to get the correct image URL
  const getImageUrl = (src: string) => {
    if (!src) return "/placeholder.svg";
    // If it starts with /uploads, prepend backend URL
    if (src.startsWith('/uploads')) {
      return `${API_URL}${src}`;
    }
    // Otherwise return as is (external URL)
    return src;
  };

  // Fetch gallery images from backend
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        const response = await fetch(`${API_URL}/api/gallery`);
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setGalleryItems(data);
            
            // Extract unique categories from data
            const uniqueCategories = Array.from(new Set(data.map((item: GalleryItem) => item.category)));
            setCategories(["Tous", ...uniqueCategories]);
          }
        }
      } catch (error) {
        console.error('Error fetching gallery images:', error);
        // Keep default gallery items on error
      }
    };

    fetchGalleryImages();
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const filteredItems =
    activeCategory === "Tous"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeCategory)

  return (
    <section
      id="galerie"
      ref={sectionRef}
      className="py-20 md:py-28 bg-secondary"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">
            Souvenirs
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mt-3 mb-4">
            Notre Galerie Photo
          </h2>
          <div className="w-20 h-1 bg-accent mx-auto" />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all",
                activeCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-muted-foreground hover:bg-primary/10"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {filteredItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setLightboxImage(getImageUrl(item.src))}
              className={cn(
                "relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer transition-all duration-700",
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              )}
              style={{
                transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
              }}
            >
              <Image
                src={getImageUrl(item.src)}
                alt={item.alt}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/50 transition-colors duration-300 flex items-center justify-center">
                <span className="text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300">
                  {item.alt}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* See More Button */}
        <div className="text-center mt-10">
          <button className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-full font-medium hover:bg-primary hover:text-white transition-colors">
            Voir plus de photos
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X size={32} />
          </button>
          <div className="relative max-w-5xl w-full aspect-[16/10]">
            <Image
              src={lightboxImage || "/placeholder.svg"}
              alt="Image agrandie"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </section>
  )
}
