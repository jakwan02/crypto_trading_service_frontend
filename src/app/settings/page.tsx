import { redirect } from "next/navigation";

export default function SettingsRedirectPage() {
  // 변경 이유: 서버 온보딩 next_action이 과거에 /settings를 반환해 404가 발생하므로,
  // 변경 이유: /account/settings로 호환 리다이렉트를 제공한다.
  redirect("/account/settings");
}

