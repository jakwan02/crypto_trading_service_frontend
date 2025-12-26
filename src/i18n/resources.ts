"use client";

const ko = {
  common: {
    appName: "CoinDash",
    tagline: "AI crypto intelligence",
    pro: "PRO",
    proUpgrade: "Pro 업그레이드",
    loginGoogle: "Google 로그인",
    logout: "로그아웃",
    account: "계정 관리",
    alerts: "알림 관리",
    guest: "게스트",
    user: "사용자",
    recentAlerts: "최근 알림",
    navigation: "Navigation",
    viewAll: "전체 보기",
    more: "더보기",
    loading: "로딩 중",
    searchSymbol: "심볼 검색",
    marketSpot: "Spot",
    marketUm: "UM",
    live: "LIVE",
    payment: "Payment",
    paymentDesc: "잔액이 부족할 때 빠르게 충전하고 거래를 이어가세요."
  },
  nav: {
    home: "Home",
    market: "Market",
    charts: "Charts",
    ai: "AI Insights",
    news: "News",
    alerts: "Alerts"
  },
  home: {
    hero: {
      badge: "AI market dashboard",
      title: "지금 시장 흐름을 읽고, 중요한 변화만 빠르게 포착하세요",
      description:
        "실시간 데이터, 차트, 알림, 프리미엄 분석을 한 화면에서 연결해 투자 판단 시간을 줄입니다.",
      ctaMarket: "마켓 바로가기",
      ctaAlerts: "알림 설정"
    },
    focus: {
      title: "Today’s Focus",
      item1: "실시간 가격 업데이트",
      item1Meta: "~200ms",
      item2: "급변동 알림",
      item2Meta: "24h",
      item3: "거래량/거래대금 분리",
      item3Meta: "Base/Quote"
    },
    pulse: {
      title: "Market Pulse",
      desc: "실시간 데이터 기반으로 오늘의 시장 흐름을 요약합니다.",
      totalSymbols: "전체 심볼",
      totalSymbolsMeta: "현재 마켓 기준",
      totalQuote: "24h 거래대금",
      totalQuoteMeta: "Quote Volume 합계",
      avgChange: "평균 변동률",
      avgChangeMeta: "시장 모멘텀",
      gainers: "Top Gainers",
      losers: "Top Losers",
      loading: "데이터 로딩 중"
    },
    volumeSpike: {
      title: "Volume Spike",
      top: "Top 6",
      goMarket: "마켓 전체 보기"
    },
    aiHighlights: {
      title: "AI Highlights",
      card1Title: "시장 모멘텀",
      card1Desc: "중립 → 강세 전환 신호 감지",
      card2Title: "BTC 변동성",
      card2Desc: "단기 과열 경고, 변동성 상향",
      card3Title: "알트 섹터",
      card3Desc: "메이저 알트 순환 매수 집중",
      upsell: "Pro 구독 시 전체 AI 리포트와 세부 지표를 확인할 수 있습니다.",
      upgrade: "업그레이드"
    },
    news: {
      title: "실시간 뉴스"
    },
    quick: {
      title: "빠른 액션",
      item1: "가격 알림을 설정하고 급변동을 실시간으로 받아보세요.",
      item2: "자주 보는 코인을 워치리스트로 묶어 빠르게 확인할 수 있습니다.",
      item3: "리스크 경고 알림을 통해 손절 타이밍을 놓치지 않습니다.",
      goAlerts: "알림 관리로 이동"
    }
  },
  market: {
    title: "Market Overview",
    desc: "실시간 가격, 거래량, 변동률을 기준으로 시장을 스크리닝합니다.",
    filterAll: "전체",
    filterGainers: "상승",
    filterLosers: "하락",
    searchPlaceholder: "심볼 또는 베이스 자산 검색",
    freeLimit: "무료 플랜은 상위 50개 심볼만 제공합니다. 전체 심볼과 실시간 업데이트는 Pro에서 이용할 수 있습니다."
  },
  table: {
    metricsWindow: "Metrics window",
    sortableHint: "정렬 가능한 열만 클릭됩니다.",
    symbol: "Symbol",
    price: "Price",
    volume: "거래량",
    turnover: "거래대금",
    change: "Change",
    onboardDate: "Onboard Date",
    empty: "표시할 심볼이 없습니다.",
    error: "심볼 데이터를 불러오는 중 오류가 발생했습니다.",
    loading: "로딩 중...",
    limitNotice: "무료 플랜은 상위 {{count}}개까지만 표시됩니다."
  },
  chart: {
    hubTitle: "Chart Hub",
    hubDesc: "심볼을 선택해 상세 차트와 분석을 확인하세요.",
    chartTitle: "{{symbol}} Chart",
    chartDesc: "실시간 차트와 AI 분석 요약을 함께 확인할 수 있습니다.",
    invalidSymbol: "심볼이 올바르지 않습니다.",
    alertCta: "알림 설정",
    aiCta: "AI 인사이트",
    currentPrice: "Current Price",
    change: "{{tf}} Change",
    volume: "{{tf}} 거래량",
    quoteVolume: "{{tf}} 거래대금",
    freeHistory: "무료 플랜은 최근 1개월 히스토리만 제공됩니다.",
    aiSignal: "AI Signal",
    aiUpsell: "Pro로 업그레이드하면 상세 신호와 리포트를 제공합니다.",
    techIndicators: "Tech Indicators",
    news: "News"
  },
  ai: {
    title: "AI Insights",
    desc: "AI가 산출한 지표와 시장 신호를 한 곳에서 확인합니다.",
    updated: "최신 업데이트 3분 전",
    viewDetail: "상세 보기",
    proLock: "Pro 구독 시 전체 지표를 확인할 수 있습니다.",
    upgrade: "업그레이드"
  },
  news: {
    title: "News Hub",
    desc: "주요 뉴스와 시장 이슈를 한눈에 확인하고 빠르게 대응하세요.",
    search: "뉴스 검색",
    viewFull: "전문 보기"
  },
  alertsPage: {
    title: "Alerts",
    desc: "가격, 변동성, 뉴스 이벤트를 조건으로 알림을 설정하세요.",
    permissionCta: "알림 권한 요청",
    permissionUnsupported: "현재 브라우저에서는 웹 푸시 알림이 지원되지 않습니다.",
    permissionGranted: "웹 푸시 알림이 활성화되어 있습니다.",
    permissionDenied: "브라우저 알림이 차단되어 있습니다. 설정에서 권한을 허용해주세요.",
    permissionDefault: "중요한 시장 알림을 받으려면 웹 푸시 권한을 허용해주세요.",
    newAlert: "새 알림 만들기",
    summary: "알림 요약",
    save: "알림 저장",
    on: "ON",
    off: "OFF",
    freeLimit: "무료 플랜은 5개까지 등록 가능합니다.",
    proUnlimited: "Pro 회원은 무제한 알림을 등록할 수 있습니다."
  },
  auth: {
    loginTitle: "Google로 로그인",
    loginDesc: "간편한 소셜 로그인을 통해 즉시 서비스에 접근할 수 있습니다.",
    loginCta: "Google로 계속하기",
    signupTitle: "가입 안내",
    signupDesc: "CoinDash는 Google 소셜 로그인만 제공합니다. 클릭 한 번으로 계정이 생성됩니다.",
    signupCta: "Google로 가입하기",
    loginHelp: "로그인 도움말",
    signupLink: "처음 방문하셨나요? 가입 안내",
    loginLink: "로그인",
    hasAccount: "이미 계정이 있으신가요?",
    redirecting: "Google 로그인으로 이동합니다."
  },
  account: {
    title: "Account",
    desc: "프로필, 구독, 보안 설정을 한 곳에서 관리하세요.",
    profile: "프로필",
    name: "이름",
    email: "이메일",
    loginRequired: "로그인 필요",
    joinDate: "가입일",
    editProfile: "프로필 편집",
    plan: "구독 상태",
    currentPlan: "현재 플랜",
    pro: "Pro",
    free: "Free",
    planMetaPro: "다음 결제일: 2025-12-31",
    planMetaFree: "Pro로 업그레이드하면 모든 지표를 확인할 수 있습니다.",
    planCta: "Pro 업그레이드",
    security: "보안",
    securityDesc: "2FA, 로그인 알림, 세션 관리 기능을 설정하세요.",
    securityCta: "보안 설정 관리",
    payment: "결제 수단",
    paymentDesc: "등록된 카드: **** 4242",
    paymentNext: "다음 결제일: 2025-12-31",
    paymentEdit: "결제 수단 변경",
    notify: "알림 설정",
    notifyDesc: "웹 푸시 · 이메일 · 앱 알림 채널을 관리하세요.",
    notifyCta: "알림 관리 이동"
  },
  upgrade: {
    title: "Pro 업그레이드",
    desc: "월 단위 구독으로 고급 데이터를 실시간으로 받아보세요.",
    planTitle: "Pro 플랜 혜택",
    price: "월 29,000원",
    priceNote: "VAT 포함 · 언제든 해지 가능",
    payTitle: "결제 정보",
    cta: "월 구독 시작하기",
    active: "이미 Pro 플랜이 활성화되어 있습니다."
  },
  education: {
    title: "Education",
    desc: "투자 결정을 돕는 핵심 가이드를 단계별로 제공합니다.",
    more: "자세히 보기",
    newsletter: "뉴스레터 신청",
    notice: "더 많은 콘텐츠는 곧 업데이트됩니다. 최신 자료는 뉴스레터로 안내드립니다."
  },
  legal: {
    privacyTitle: "Privacy Policy",
    privacyDesc: "CoinDash는 개인정보 보호를 최우선으로 합니다.",
    termsTitle: "Terms of Service",
    termsDesc: "본 서비스 약관은 서비스 이용과 관련된 기본 사항을 정의합니다."
  },
  footer: {
    company: "CoinDash Labs",
    policy: "Policy",
    terms: "서비스 이용약관",
    privacy: "개인정보 처리방침",
    subscription: "구독 관리"
  }
};

const en = {
  common: {
    appName: "CoinDash",
    tagline: "AI crypto intelligence",
    pro: "PRO",
    proUpgrade: "Upgrade",
    loginGoogle: "Google Login",
    logout: "Logout",
    account: "Account",
    alerts: "Alerts",
    guest: "Guest",
    user: "User",
    recentAlerts: "Recent alerts",
    navigation: "Navigation",
    viewAll: "View all",
    more: "More",
    loading: "Loading",
    searchSymbol: "Search symbol",
    marketSpot: "Spot",
    marketUm: "UM",
    live: "LIVE",
    payment: "Payment",
    paymentDesc: "Add funds quickly when your balance is low."
  },
  nav: {
    home: "Home",
    market: "Market",
    charts: "Charts",
    ai: "AI Insights",
    news: "News",
    alerts: "Alerts"
  },
  home: {
    hero: {
      badge: "AI market dashboard",
      title: "Read the market flow and spot key changes faster",
      description:
        "Connect real-time data, charts, alerts, and premium analysis in one dashboard to speed up decisions.",
      ctaMarket: "Go to Market",
      ctaAlerts: "Set Alerts"
    },
    focus: {
      title: "Today’s Focus",
      item1: "Real-time price update",
      item1Meta: "~200ms",
      item2: "Volatility alerts",
      item2Meta: "24h",
      item3: "Volume/Turnover split",
      item3Meta: "Base/Quote"
    },
    pulse: {
      title: "Market Pulse",
      desc: "Summarize today’s market flow with live data.",
      totalSymbols: "Total Symbols",
      totalSymbolsMeta: "Current market",
      totalQuote: "24h Turnover",
      totalQuoteMeta: "Quote Volume total",
      avgChange: "Avg Change",
      avgChangeMeta: "Market momentum",
      gainers: "Top Gainers",
      losers: "Top Losers",
      loading: "Loading data"
    },
    volumeSpike: {
      title: "Volume Spike",
      top: "Top 6",
      goMarket: "View market"
    },
    aiHighlights: {
      title: "AI Highlights",
      card1Title: "Market Momentum",
      card1Desc: "Neutral → Bullish signal detected",
      card2Title: "BTC Volatility",
      card2Desc: "Short-term overheated warning",
      card3Title: "Alt Sector",
      card3Desc: "Major alt rotation buying",
      upsell: "Upgrade to Pro for full AI reports and indicators.",
      upgrade: "Upgrade"
    },
    news: {
      title: "Live News"
    },
    quick: {
      title: "Quick Actions",
      item1: "Set price alerts to catch rapid changes.",
      item2: "Group favorite coins in a watchlist.",
      item3: "Risk alerts help you avoid missing exits.",
      goAlerts: "Go to Alerts"
    }
  },
  market: {
    title: "Market Overview",
    desc: "Screen the market by live price, volume, and change.",
    filterAll: "All",
    filterGainers: "Gainers",
    filterLosers: "Losers",
    searchPlaceholder: "Search symbol or base asset",
    freeLimit: "Free plan shows top 50 symbols. Full list and real-time updates are for Pro."
  },
  table: {
    metricsWindow: "Metrics window",
    sortableHint: "Only sortable columns can be clicked.",
    symbol: "Symbol",
    price: "Price",
    volume: "Volume",
    turnover: "Turnover",
    change: "Change",
    onboardDate: "Onboard Date",
    empty: "No symbols to display.",
    error: "Failed to load symbols.",
    loading: "Loading...",
    limitNotice: "Free plan shows top {{count}} symbols only."
  },
  chart: {
    hubTitle: "Chart Hub",
    hubDesc: "Pick a symbol to view detailed charts and analysis.",
    chartTitle: "{{symbol}} Chart",
    chartDesc: "View real-time chart with AI summary.",
    invalidSymbol: "Invalid symbol.",
    alertCta: "Set Alert",
    aiCta: "AI Insights",
    currentPrice: "Current Price",
    change: "{{tf}} Change",
    volume: "{{tf}} Volume",
    quoteVolume: "{{tf}} Turnover",
    freeHistory: "Free plan shows only the last 1 month of history.",
    aiSignal: "AI Signal",
    aiUpsell: "Upgrade to Pro for detailed signals and reports.",
    techIndicators: "Tech Indicators",
    news: "News"
  },
  ai: {
    title: "AI Insights",
    desc: "View AI-driven indicators and signals in one place.",
    updated: "Updated 3 minutes ago",
    viewDetail: "View detail",
    proLock: "Upgrade to Pro to unlock all indicators.",
    upgrade: "Upgrade"
  },
  news: {
    title: "News Hub",
    desc: "Track key headlines and market issues at a glance.",
    search: "Search news",
    viewFull: "Read full"
  },
  alertsPage: {
    title: "Alerts",
    desc: "Create alerts for price, volatility, and news events.",
    permissionCta: "Request permission",
    permissionUnsupported: "Web push notifications are not supported in this browser.",
    permissionGranted: "Web push notifications are enabled.",
    permissionDenied: "Notifications are blocked. Please allow permission in settings.",
    permissionDefault: "Allow web push permission to receive important alerts.",
    newAlert: "Create new alert",
    summary: "Alert summary",
    save: "Save alert",
    on: "ON",
    off: "OFF",
    freeLimit: "Free plan allows up to 5 alerts.",
    proUnlimited: "Pro members can create unlimited alerts."
  },
  auth: {
    loginTitle: "Login with Google",
    loginDesc: "Access the service instantly with social login.",
    loginCta: "Continue with Google",
    signupTitle: "Sign Up",
    signupDesc: "CoinDash uses Google login only. One click to create an account.",
    signupCta: "Sign up with Google",
    loginHelp: "Login help",
    signupLink: "New here? Sign up",
    loginLink: "Login",
    hasAccount: "Already have an account?",
    redirecting: "Redirecting to Google login."
  },
  account: {
    title: "Account",
    desc: "Manage profile, subscription, and security in one place.",
    profile: "Profile",
    name: "Name",
    email: "Email",
    loginRequired: "Login required",
    joinDate: "Join date",
    editProfile: "Edit profile",
    plan: "Subscription",
    currentPlan: "Current plan",
    pro: "Pro",
    free: "Free",
    planMetaPro: "Next billing: 2025-12-31",
    planMetaFree: "Upgrade to Pro for full indicators.",
    planCta: "Upgrade to Pro",
    security: "Security",
    securityDesc: "Configure 2FA, login alerts, and sessions.",
    securityCta: "Manage security",
    payment: "Payment method",
    paymentDesc: "Saved card: **** 4242",
    paymentNext: "Next billing: 2025-12-31",
    paymentEdit: "Update payment method",
    notify: "Notifications",
    notifyDesc: "Manage web push, email, and app channels.",
    notifyCta: "Go to alerts"
  },
  upgrade: {
    title: "Upgrade to Pro",
    desc: "Monthly subscription for advanced data.",
    planTitle: "Pro benefits",
    price: "₩29,000 / month",
    priceNote: "VAT included · Cancel anytime",
    payTitle: "Payment details",
    cta: "Start monthly subscription",
    active: "Pro is already active."
  },
  education: {
    title: "Education",
    desc: "Step-by-step guides for better decisions.",
    more: "View details",
    newsletter: "Subscribe",
    notice: "More content coming soon. Subscribe to our newsletter."
  },
  legal: {
    privacyTitle: "Privacy Policy",
    privacyDesc: "CoinDash prioritizes user privacy.",
    termsTitle: "Terms of Service",
    termsDesc: "These terms define basic service usage."
  },
  footer: {
    company: "CoinDash Labs",
    policy: "Policy",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    subscription: "Subscription"
  }
};

export const resources = {
  ko,
  en,
  ja: en,
  de: en
} as const;
