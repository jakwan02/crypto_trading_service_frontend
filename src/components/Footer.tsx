import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 text-xs text-gray-500">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="font-medium text-gray-700">CoinDash Labs</p>
            <p>사업자등록번호: 123-45-67890</p>
            <p>대표자: 홍길동</p>
            <p>주소: 서울특별시 강남구 테헤란로 123</p>
            <p>이메일: support@coindash.com</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-gray-700">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-gray-700">
              Privacy Policy
            </Link>
          </div>
        </div>
        <p className="mt-6 text-[11px] text-gray-400">(c) 2025 CoinDash Labs. All rights reserved.</p>
      </div>
    </footer>
  );
}
