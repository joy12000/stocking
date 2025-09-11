import { Suspense } from 'react'
import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { Recommendations } from '@/components/recommendations'
import { NewsSection } from '@/components/news-section'
import { Footer } from '@/components/footer'
import { LoadingSpinner } from '@/components/loading-spinner'

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Hero />
        
        <div className="mt-12 space-y-12">
          <Suspense fallback={<LoadingSpinner />}>
            <Recommendations />
          </Suspense>
          
          <Suspense fallback={<LoadingSpinner />}>
            <NewsSection />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}
