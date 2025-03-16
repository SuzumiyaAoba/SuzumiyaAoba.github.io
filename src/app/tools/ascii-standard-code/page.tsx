import StandardCode from "@/components/svg/StandardCode";

export default async function AsciiStandardCode() {
  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="my-8 text-3xl">ASCII Standard Code</h1>
      <div className="mb-8">
        <a
          href="https://www.rfc-editor.org/rfc/rfc20#section-2"
          className="text-blue-600"
        >
          RFC 20
        </a>{" "}
        の Standard Code にあるテーブルの SVG バージョン。 ASCII コードから 16
        進数、2進数への変換表。
      </div>
      <StandardCode />
    </main>
  );
}
