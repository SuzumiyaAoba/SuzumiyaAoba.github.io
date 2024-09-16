"use client";

import Image from "next/image";
import React from "react";

const BuyMeACoffee = () => {
  return (
    <>
      <a href="https://www.buymeacoffee.com/suzumiyaaoba" target="_blank">
        <Image
          src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
          width={217}
          height={60}
          alt="Buy Me A Coffee"
          style={{
            height: "60px !important",
            width: "217px !important",
          }}
        />
      </a>
      <script
        type="text/javascript"
        src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
        data-name="bmc-button"
        data-slug="suzumiyaaoba"
        data-color="#FFDD00"
        data-emoji=""
        data-font="Cookie"
        data-text="Buy me a coffee"
        data-outline-color="#000000"
        data-font-color="#000000"
        data-coffee-color="#ffffff"
        async
      ></script>
    </>
  );
};

export default BuyMeACoffee;
