import Head from 'next/head';
import Link from 'next/link';

// Editorial content data - in production this would come from a CMS
const articles = [
  {
    id: '1',
    title: 'The Art of Nightlife: Jakarta\'s Hidden Speakeasies',
    excerpt: 'Discover the most exclusive hidden bars in the capital city, where craftsmanship meets mystery.',
    category: 'Nightlife Guide',
    author: 'AfterHoursID Editorial',
    date: 'February 2026',
    readTime: '8 min read',
    image: '/images/guides/jakarta-speakeasies.jpg',
    slug: 'jakarta-speakeasies',
  },
  {
    id: '2',
    title: 'Luxury Wellness: Finding Serenity in Bali\'s Premier Spas',
    excerpt: 'From ancient healing traditions to modern spa technologies, explore Bali\'s most transformative wellness experiences.',
    category: 'Wellness',
    author: 'AfterHoursID Editorial',
    date: 'February 2026',
    readTime: '6 min read',
    image: '/images/guides/bali-wellness.jpg',
    slug: 'bali-wellness',
  },
  {
    id: '3',
    title: 'The Vibe Index: Understanding Indonesia\'s Nightlife Economy',
    excerpt: 'An in-depth analysis of how Indonesia\'s nightlife venues are transforming through technology and data.',
    category: 'Business',
    author: 'AfterHoursID Analytics',
    date: 'January 2026',
    readTime: '12 min read',
    image: '/images/guides/nightlife-economy.jpg',
    slug: 'nightlife-economy',
  },
  {
    id: '4',
    title: 'Dress to Impress: The Ultimate Clubbing Style Guide',
    excerpt: 'Navigate Indonesia\'s venue dress codes with confidence. From smart casual to black tie, we\'ve got you covered.',
    category: 'Style',
    author: 'AfterHoursID Editorial',
    date: 'January 2026',
    readTime: '5 min read',
    image: '/images/guides/clubbing-style.jpg',
    slug: 'clubbing-style',
  },
  {
    id: '5',
    title: 'Sound & Vision: Inside Indonesia\'s Best Sound Systems',
    excerpt: 'From Funktion-One to d&b audiotechnik, we explore the venues delivering world-class audio experiences.',
    category: 'Tech',
    author: 'AfterHoursID Editorial',
    date: 'January 2026',
    readTime: '7 min read',
    image: '/images/guides/sound-systems.jpg',
    slug: 'sound-systems',
  },
  {
    id: '6',
    title: 'The Bottle Service Experience: A Complete Guide',
    excerpt: 'Everything you need to know about Indonesia\'s premium table service culture, from etiquette to value.',
    category: 'Nightlife Guide',
    author: 'AfterHoursID Editorial',
    date: 'December 2025',
    readTime: '10 min read',
    image: '/images/guides/bottle-service.jpg',
    slug: 'bottle-service',
  },
];

const categories = [
  'All',
  'Nightlife Guide',
  'Wellness',
  'Business',
  'Style',
  'Tech',
];

export default function GuidesPage() {
  return (
    <>
      <Head>
        <title>Guides & Editorial | AfterHoursID</title>
        <meta name="description" content="Expert guides on Indonesia's nightlife, wellness, and luxury lifestyle." />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Minimal Header */}
        <header className="border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-xl font-bold tracking-wider">
                AFTER<span className="text-yellow-400">HOURS</span>ID
              </Link>
              <nav className="hidden md:flex items-center gap-8">
                <Link href="/discovery" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Discover
                </Link>
                <Link href="/guides" className="text-sm text-yellow-400">
                  Guides
                </Link>
                <Link href="/partners" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Partners
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-yellow-400 text-sm tracking-[0.2em] uppercase mb-4">Editorial</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Lifestyle & <span className="text-gray-400">Hospitality</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Expert insights on Indonesia's nightlife, wellness venues, and luxury experiences.
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="px-6 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-4 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`px-4 py-2 text-sm rounded-full border transition-all ${
                    category === 'All'
                      ? 'bg-white text-black border-white'
                      : 'border-white/20 text-gray-400 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="group cursor-pointer"
                >
                  {/* Image Placeholder */}
                  <div className="relative aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                    <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-4xl">
                      📰
                    </div>
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 text-xs font-medium bg-black/60 backdrop-blur-sm rounded-full text-white border border-white/10">
                        {article.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{article.date}</span>
                      <span>•</span>
                      <span>{article.readTime}</span>
                    </div>
                    <h2 className="text-xl font-semibold leading-tight group-hover:text-yellow-400 transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                      {article.excerpt}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="px-6 py-20 border-t border-white/10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Stay Informed</h2>
            <p className="text-gray-400 mb-8">
              Get the latest guides and insights delivered to your inbox.
            </p>
            <form className="flex gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-3 bg-gray-900 border border-white/10 rounded-lg focus:border-yellow-500 outline-none transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © 2026 AfterHoursID. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
