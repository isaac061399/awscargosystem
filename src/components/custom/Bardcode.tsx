'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

const Barcode = ({
  value,
  height = 46,
  displayValue = false
}: {
  value: string;
  height?: number;
  displayValue?: boolean;
}) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    // CODE128 works great for tracking-like strings
    JsBarcode(ref.current, value, {
      format: 'CODE128',
      displayValue,
      lineColor: '#000',
      width: 2, // bar width (tune if needed)
      height, // bar height in px
      margin: 0,
      fontSize: 12
    });
  }, [value, height, displayValue]);

  return <svg ref={ref} />;
};

export default Barcode;
