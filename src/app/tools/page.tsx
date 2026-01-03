import Link from "next/link";

export default async function AsciiStandardCode() {
  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="mb-8 text-3xl">Tools</h1>
      <ul className="list-disc pl-6">
        <li>
          <Link
            href="/tools/ascii-standard-code/"
            className="text-blue-600 hover:underline"
          >
            ASCII Standard Code
          </Link>
        </li>
        <li>
          <Link
            href="/tools/asset-formation-simulator/"
            className="text-blue-600 hover:underline"
          >
            資産形成シミュレーション
          </Link>
        </li>
      </ul>
    </main>
  );
}
