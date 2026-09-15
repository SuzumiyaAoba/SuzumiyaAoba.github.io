export type TocThumbValues = [top: number, height: number];

export function findTocLink(
  container: HTMLElement,
  href: string
): HTMLElement | undefined {
  return [...container.querySelectorAll<HTMLElement>("a[href]")].find(
    (element) => element.getAttribute("href") === href
  );
}

export function calcThumb(
  container: HTMLElement,
  active: string[]
): TocThumbValues {
  if (active.length === 0 || container.clientHeight === 0) {
    return [0, 0];
  }
  let upper = Infinity;
  let lower = 0;
  for (const id of active) {
    const element = findTocLink(container, `#${id}`);
    if (!element) {
      continue;
    }
    const styles = getComputedStyle(element);
    upper = Math.min(
      upper,
      element.offsetTop + Number.parseFloat(styles.paddingTop)
    );
    lower = Math.max(
      lower,
      element.offsetTop +
        element.clientHeight -
        Number.parseFloat(styles.paddingBottom)
    );
  }
  return Number.isFinite(upper) ? [upper, lower - upper] : [0, 0];
}

export function updateThumb(
  element: HTMLElement,
  [top, height]: TocThumbValues
): void {
  element.style.setProperty("--toc-top", `${top}px`);
  element.style.setProperty("--toc-height", `${height}px`);
}
