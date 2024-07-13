import { Exo_2, Zen_Maru_Gothic } from "next/font/google";

const zen_maru_gothic = Zen_Maru_Gothic({
  weight: ["300", "400"],
  subsets: [],
});

const exo_2 = Exo_2({
  weight: ["400"],
  subsets: [],
  variable: "--font-title",
});

export { zen_maru_gothic, exo_2 };
