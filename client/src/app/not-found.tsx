import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-dark-50">404</h1>
      <p className="text-dark-400">Page not found</p>
      <Link
        href="/feed"
        className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
      >
        Go home
      </Link>
    </div>
  );
}
