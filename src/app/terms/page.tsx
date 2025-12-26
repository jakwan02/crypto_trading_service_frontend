export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-500">
          본 서비스 약관은 서비스 이용과 관련된 기본 사항을 정의합니다.
        </p>
        <div className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
          <p>1. 회원은 제공되는 실시간 데이터를 투자 판단의 참고 자료로 활용합니다.</p>
          <p>2. 서비스는 시장 데이터 제공에 집중하며, 투자 손익에 대한 책임을 지지 않습니다.</p>
          <p>3. 결제 및 KYC 기능은 추후 별도 안내에 따라 제공됩니다.</p>
          <p>4. 자세한 약관은 고객센터를 통해 확인할 수 있습니다.</p>
        </div>
      </div>
    </main>
  );
}
