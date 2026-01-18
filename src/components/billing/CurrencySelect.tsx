"use client";

import { useCallback } from "react";
import type { BillingCurrency } from "@/types/billing";

type Props = {
  value: BillingCurrency;
  onChange: (value: BillingCurrency) => void;
  disabled?: boolean;
  allowed?: BillingCurrency[];
};

const ALL: BillingCurrency[] = ["KRW", "USD", "JPY", "EUR"];

export default function CurrencySelect({ value, onChange, disabled, allowed }: Props) {
  const options = allowed && allowed.length ? allowed : ALL;
  const handle = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value as BillingCurrency),
    [onChange]
  );

  return (
    <select
      value={value}
      onChange={handle}
      disabled={disabled}
      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
    >
      {options.map((ccy) => (
        <option key={ccy} value={ccy}>
          {ccy}
        </option>
      ))}
    </select>
  );
}

