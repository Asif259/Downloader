export default function Home() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            <span className="text-gradient">UniDL</span>
            <span className="text-text-primary ml-2">Universal Downloader</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Paste a link from Instagram, TikTok, YouTube, X, or any direct file URL to safely download content.
          </p>
        </header>

        {/* Input Section Placeholder */}
        <section className="glass-panel p-8">
          <p className="text-text-secondary">Link Input Component (To be implemented in Phase 4)</p>
        </section>

        {/* Preview Section Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <section className="glass-panel p-8 flex items-center justify-center min-h-[300px]">
            <p className="text-text-secondary">Preview Card Component</p>
          </section>

          {/* Queue Section Placeholder */}
          <section className="glass-panel p-8 flex items-center justify-center min-h-[300px]">
            <p className="text-text-secondary">Download Queue Component</p>
          </section>
        </div>

        {/* History Section Placeholder */}
        <section className="glass-panel p-8 mt-8 flex items-center justify-center min-h-[400px]">
          <p className="text-text-secondary">History Table Component</p>
        </section>

      </div>
    </main>
  );
}
