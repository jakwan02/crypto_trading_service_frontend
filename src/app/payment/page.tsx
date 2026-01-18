import { redirect } from "next/navigation";

export default function PaymentPage() {
  // 변경 이유: legacy URL(/payment)은 Billing Portal(/billing)로 리다이렉트
  redirect("/billing");
}
