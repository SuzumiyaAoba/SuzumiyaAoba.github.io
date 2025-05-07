"use client";

import React from "react";
import Image from "next/image";

const BuyMeACoffee = () => {
  return (
    <>
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
      <a href="https://www.buymeacoffee.com/suzumiyaaoba" target="_blank">
        <Image
          src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
          alt="Buy Me A Coffee"
          width={217}
          height={60}
          style={{
            padding: "0",
            border: "none",
          }}
          unoptimized
        />
      </a>
    </>
  );
};

export default BuyMeACoffee;
