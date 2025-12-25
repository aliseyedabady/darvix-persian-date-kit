import * as React from "react";

export type CalendarHeaderProps = {
  title: React.ReactNode;
  onPrev: () => void;
  onNext: () => void;
  onTitleClick: () => void;
  prevIcon?: React.ReactNode;
  nextIcon?: React.ReactNode;
  className?: string;
  classes?: Partial<{
    header: string;
    navButton: string;
    monthLabel: string;
  }>;
};

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export function CalendarHeader(props: CalendarHeaderProps) {
  const { title, onPrev, onNext, onTitleClick, prevIcon, nextIcon, className, classes } =
    props;

  return (
    <div className={cx("dvx-pdp__header", className, classes?.header)}>
      <button
        type="button"
        className={cx("dvx-pdp__nav", classes?.navButton)}
        onClick={onPrev}
        aria-label="Previous month"
      >
        {prevIcon ?? "‹"}
      </button>
      <button
        type="button"
        className={cx("dvx-pdp__monthLabel", classes?.monthLabel)}
        onClick={onTitleClick}
        aria-label="Choose month and year"
      >
        {title}
      </button>
      <button
        type="button"
        className={cx("dvx-pdp__nav", classes?.navButton)}
        onClick={onNext}
        aria-label="Next month"
      >
        {nextIcon ?? "›"}
      </button>
    </div>
  );
}


