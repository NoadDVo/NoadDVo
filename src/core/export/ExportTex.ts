const DEFAULT_TIKZ_LIBRARIES = "calc,angles,quotes,intersections,arrows.meta";

export function wrapTikzInStandaloneDocument(tikzCode: string): string {
  return [
    "\\documentclass[tikz,border=5pt]{standalone}",
    "\\usepackage{tikz}",
    `\\usetikzlibrary{${DEFAULT_TIKZ_LIBRARIES}}`,
    "",
    "\\begin{document}",
    "",
    tikzCode.trim(),
    "",
    "\\end{document}",
    "",
  ].join("\n");
}
