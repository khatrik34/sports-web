"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="shell page">
      <h1>The Boundary is temporarily unavailable.</h1>
      <p>We could not load the latest content. Please try again shortly.</p>
      <button className="dark-button" onClick={reset}>
        TRY AGAIN
      </button>
    </div>
  );
}
