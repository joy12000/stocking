import { Suspense } from 'react'
import { Header } from '@/components/header'
import { Recommendations } from '@/components/recommendations'
import { NewsSection } from '@/components/news-section'
import { Footer } from '@/components/footer'
import { LoadingSpinner } from '@/components/loading-spinner'

export default function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <>
      <div style={{ padding: '20px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', marginBottom: '20px' }}>
        <h1 style={{ fontWeight: 'bold', fontSize: '20px' }}>--- DEBUG INFO ---</h1>
        <p>NEXT_PUBLIC_SUPABASE_URL: {supabaseUrl || "IS NOT SET"}</p>
      </div>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-12">
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
