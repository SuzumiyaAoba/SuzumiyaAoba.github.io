import { Exo_2, Fira_Code, Zen_Maru_Gothic } from "next/font/google";

const zen_maru_gothic = Zen_Maru_Gothic({
  weight: ["300", "400", "700", "900"],
  subsets: [],
  variable: "--font-body",
});

const exo_2 = Exo_2({
  weight: ["400"],
  subsets: [],
  variable: "--font-title",
});

const mono = Fira_Code({
  weight: ["400"],
  subsets: [],
  variable: "--font-mono",
});

export { exo_2, mono, zen_maru_gothic };
