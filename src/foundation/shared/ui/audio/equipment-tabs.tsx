"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/shared/ui/button";
import type { Locale } from "@/shared/lib/routing";
import { audioEquipment } from "@/shared/ui/audio/definitions/equipment";
import { EquipmentArticle } from "./equipment-article";

export function EquipmentTabs({ locale }: { locale: Locale }) {
  const id = useId();
  const [selected, setSelected] = useState(audioEquipment[0]?.id ?? "");
  const [focused, setFocused] = useState(selected);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const selectedIndex = audioEquipment.findIndex(
    (equipment) => equipment.id === selected
  );
  const selectedEquipment = audioEquipment[selectedIndex];

  useEffect(() => {
    const selectAnchor = () => {
      const anchor = window.location.hash.slice(1);
      if (audioEquipment.some((equipment) => equipment.id === anchor)) {
        setSelected(anchor);
        setFocused(anchor);
      }
    };
    selectAnchor();
    window.addEventListener("hashchange", selectAnchor);
    return () => window.removeEventListener("hashchange", selectAnchor);
  }, []);

  const moveFocus = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let next: number;
    switch (event.key) {
      case "ArrowRight": {
        next = (index + 1) % audioEquipment.length;
        break;
      }
      case "ArrowLeft": {
        next = (index + audioEquipment.length - 1) % audioEquipment.length;
        break;
      }
      case "Home": {
        next = 0;
        break;
      }
      case "End": {
        next = audioEquipment.length - 1;
        break;
      }
      default: {
        return;
      }
    }
    event.preventDefault();
    const equipment = audioEquipment[next];
    if (equipment) {
      buttons.current.get(equipment.id)?.focus();
    }
  };

  return (
    <section className="space-y-8" aria-labelledby={`${id}-label`}>
      <p id={`${id}-label`} className="section-label">
        {locale === "ja" ? "製品ごとのモデル" : "Individual products"}
      </p>
      <div
        role="tablist"
        aria-labelledby={`${id}-label`}
        className="flex flex-wrap gap-1.5"
      >
        {audioEquipment.map((equipment, index) => (
          <Button
            key={equipment.id}
            ref={(button) => {
              if (button) {
                buttons.current.set(equipment.id, button);
              } else {
                buttons.current.delete(equipment.id);
              }
            }}
            role="tab"
            id={`${id}-${equipment.id}-tab`}
            aria-controls={`${id}-panel`}
            aria-selected={selected === equipment.id}
            tabIndex={focused === equipment.id ? 0 : -1}
            variant={selected === equipment.id ? "secondary" : "outline"}
            size="sm"
            onFocus={() => setFocused(equipment.id)}
            onKeyDown={(event) => moveFocus(event, index)}
            onClick={() => {
              setSelected(equipment.id);
              window.history.replaceState(null, "", `#${equipment.id}`);
            }}
          >
            {equipment.name}
          </Button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${selected}-tab`}
        tabIndex={0}
      >
        {selectedEquipment && (
          <EquipmentArticle
            equipment={selectedEquipment}
            index={selectedIndex}
            locale={locale}
          />
        )}
      </div>
    </section>
  );
}
