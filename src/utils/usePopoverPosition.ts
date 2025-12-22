import * as React from "react";

export type PopoverPlacement = "bottom" | "top" | "left" | "right";
export type PopoverAlign = "start" | "center" | "end";

const DEFAULT_PLACEMENTS: ReadonlyArray<PopoverPlacement> = [
  "bottom",
  "top",
  "left",
  "right",
];

export type PopoverPositionOptions = {
  gutter?: number;
  padding?: number;
  strategy?: "fixed" | "absolute";
  /**
   * Placement preference order. The first placement that fits is chosen; otherwise
   * the placement with the most available space is used.
   *
   * Default: ['bottom', 'top', 'left', 'right']
   */
  placements?: PopoverPlacement[];
  /**
   * Cross-axis alignment:
   * - For `top`/`bottom` this aligns horizontally (x-axis).
   * - For `left`/`right` this aligns vertically (y-axis).
   *
   * Default: 'end' (RTL-friendly for top/bottom).
   */
  align?: PopoverAlign;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function usePopoverPosition<
  TAnchor extends HTMLElement,
  TPopover extends HTMLElement
>(
  open: boolean,
  anchorRef: React.RefObject<TAnchor | null>,
  popoverRef: React.RefObject<TPopover | null>,
  opts: PopoverPositionOptions = {}
) {
  const gutter = opts.gutter ?? 8;
  const padding = opts.padding ?? 8;
  const strategy = opts.strategy ?? "fixed";
  const align = opts.align ?? "end";
  const placementsKey = opts.placements?.join("|") ?? "";
  const placements = React.useMemo<ReadonlyArray<PopoverPlacement>>(
    () =>
      opts.placements && opts.placements.length
        ? opts.placements
        : DEFAULT_PLACEMENTS,
    [placementsKey]
  );

  const [placement, setPlacement] = React.useState<PopoverPlacement>("bottom");
  const [style, setStyle] = React.useState<React.CSSProperties>(() => ({
    position: strategy,
    top: 0,
    left: 0,
  }));

  const update = React.useCallback(() => {
    const anchorEl = anchorRef.current;
    const popEl = popoverRef.current;
    if (!anchorEl || !popEl) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const popRect = popEl.getBoundingClientRect();

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceBelow = vh - anchorRect.bottom - padding;
    const spaceAbove = anchorRect.top - padding;
    const spaceLeft = anchorRect.left - padding;
    const spaceRight = vw - anchorRect.right - padding;

    function mainAxisSpace(p: PopoverPlacement) {
      if (p === "bottom") return spaceBelow;
      if (p === "top") return spaceAbove;
      if (p === "left") return spaceLeft;
      return spaceRight;
    }

    function fits(p: PopoverPlacement) {
      if (p === "bottom" || p === "top")
        return popRect.height + gutter <= mainAxisSpace(p);
      return popRect.width + gutter <= mainAxisSpace(p);
    }

    let nextPlacement: PopoverPlacement =
      placements.find(fits) ??
      placements.reduce(
        (best, p) => (mainAxisSpace(p) > mainAxisSpace(best) ? p : best),
        placements[0]
      );

    // Compute initial top/left relative to chosen placement
    let top = 0;
    let left = 0;

    if (nextPlacement === "bottom" || nextPlacement === "top") {
      top =
        nextPlacement === "bottom"
          ? anchorRect.bottom + gutter
          : anchorRect.top - gutter - popRect.height;

      if (align === "start") left = anchorRect.left;
      else if (align === "center")
        left = anchorRect.left + (anchorRect.width - popRect.width) / 2;
      else left = anchorRect.right - popRect.width;
    } else {
      left =
        nextPlacement === "right"
          ? anchorRect.right + gutter
          : anchorRect.left - gutter - popRect.width;

      if (align === "start") top = anchorRect.top;
      else if (align === "center")
        top = anchorRect.top + (anchorRect.height - popRect.height) / 2;
      else top = anchorRect.bottom - popRect.height;
    }

    // Clamp within viewport
    top = clamp(top, padding, vh - padding - popRect.height);
    left = clamp(left, padding, vw - padding - popRect.width);

    if (strategy === "absolute") {
      top += window.scrollY;
      left += window.scrollX;
    }

    setPlacement((prev) => (prev === nextPlacement ? prev : nextPlacement));
    setStyle((prev) => {
      if (prev.position === strategy && prev.top === top && prev.left === left)
        return prev;
      return { position: strategy, top, left };
    });
  }, [align, anchorRef, gutter, padding, popoverRef, strategy, placements]);

  useIsomorphicLayoutEffect(() => {
    if (!open) return;
    update();
    // Run again next frame to account for first-measure differences (fonts/layout).
    const raf = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(raf);
  }, [open, update]);

  React.useEffect(() => {
    if (!open) return;
    let rafId = 0;
    const schedule = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        update();
      });
    };
    window.addEventListener("resize", schedule);
    // Capture scroll on any ancestor.
    document.addEventListener("scroll", schedule, true);
    return () => {
      window.removeEventListener("resize", schedule);
      document.removeEventListener("scroll", schedule, true);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [open, update]);

  return { style, placement, update };
}
