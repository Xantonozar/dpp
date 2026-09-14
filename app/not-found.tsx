import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="font-display text-4xl font-bold text-ink mb-2">404</h1>
      <p className="text-muted mb-6">Page not found</p>
      <Link
        href="/"
        className="px-4 py-2 bg-green text-white font-medium rounded-xl hover:bg-green-dark transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
