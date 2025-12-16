export default function Home() {
  return (
    <main className="container mx-auto max-w-4xl p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-purple-700">
          PDF Maker
        </h1>
      </header>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">
          Welcome to PDF Maker. Upload your markdown files to convert them to professionally styled PDFs.
        </p>
      </div>
    </main>
  );
}
