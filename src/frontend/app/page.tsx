import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Vision } from "@/components/vision"
import { About } from "@/components/about"
import { Values } from "@/components/values"
import Ministries from "@/components/ministries"
import { Events } from "@/components/events"
import { Assemblies } from "@/components/assemblies"
import { Gallery } from "@/components/gallery"
import { Testimonials } from "@/components/testimonials"
import { Newsletter } from "@/components/newsletter"
import { Footer } from "@/components/footer"
import { HashScroll } from "@/components/hash-scroll"

export default function HomePage() {
  return (
    <main>
      <HashScroll />
      <Header />
      <Hero />
      <Vision />
      <About />
      <Values />
      <Ministries />
      <Events />
      <Assemblies />
      <Gallery />
      <Testimonials />
      <Newsletter />
      <Footer />
    </main>
  )
}
