import katex from "katex";
export function MathText({
  tex,
  block = false,
}: {
  tex: string;
  block?: boolean;
}) {
  return (
    <span
      className={block ? "math-block" : "math-inline"}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, {
          throwOnError: false,
          displayMode: block,
          output: "htmlAndMathml",
        }),
      }}
    />
  );
}
