const ko = {
  common: {
    appName: "CoinDash",
    tagline: "AI crypto intelligence",
    pro: "PRO",
    proUpgrade: "Pro 업그레이드",
    login: "로그인",
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
    notifications: {
      label: "알림",
      item1: {
        title: "BTC 1시간 내 +5.2% 급등",
        time: "방금"
      },
      item2: {
        title: "ETH 거래량 급증 감지",
        time: "12분 전"
      },
      item3: {
        title: "시장 변동성 알림",
        time: "1시간 전"
      }
    },
    payment: "Payment",
    paymentDesc: "잔액이 부족할 때 빠르게 충전하고 거래를 이어가세요.",
    billing: "Billing",
    usage: "Usage",
    watchlists: "Watchlists"
  },
  nav: {
    home: "Home",
    market: "Market",
    charts: "Charts",
    ai: "AI Insights",
    news: "News",
    alerts: "Alerts",
    payment: "Payment",
    billing: "Billing",
    usage: "Usage",
    watchlists: "Watchlists"
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
      title: "실시간 뉴스",
      items: {
        item1: {
          title: "비트코인 현물 ETF 자금 유입 지속",
          time: "10분 전"
        },
        item2: {
          title: "알트코인 거래량 급증, 변동성 확대",
          time: "35분 전"
        },
        item3: {
          title: "미 연준 발표 앞두고 시장 관망세",
          time: "1시간 전"
        }
      }
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
    change: "{{tf}} 변동률",
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
    news: "News",
    selectSymbol: "심볼을 선택해주세요.",
    loadError: "차트 로딩 중 오류가 발생했습니다.",
    loadingMore: "로딩 중...",
    loadMore: "이전 데이터 불러오기",
    aiSignals: {
      signal1Title: "상승 확률",
      signal1Desc: "62% · 변동성 확대 구간",
      signal2Title: "리스크 알림",
      signal2Desc: "단기 과열, 추세 유지 확인 필요"
    },
    techValues: {
      rsi: "58 · 중립",
      macd: "상승 전환",
      bollingerLabel: "볼린저 밴드",
      bollingerValue: "상단 근접"
    },
    newsItems: {
      item1: "BTC 관련 규제 뉴스 업데이트",
      item2: "거래소 유동성 확대 보고서",
      item3: "고래 지갑 이동 감지"
    }
  },
  ai: {
    title: "AI Insights",
    desc: "AI가 산출한 지표와 시장 신호를 한 곳에서 확인합니다.",
    updated: "최신 업데이트 3분 전",
    viewDetail: "상세 보기",
    proLock: "Pro 구독 시 전체 지표를 확인할 수 있습니다.",
    upgrade: "업그레이드",
    valueLabel: "현재 값",
    categories: {
      all: "전체",
      momentum: "모멘텀",
      onchain: "온체인",
      derivatives: "파생",
      risk: "리스크"
    },
    signals: {
      momentumScore: {
        title: "AI 모멘텀 스코어",
        summary: "시장 모멘텀 강세 전환 신호"
      },
      funding: {
        title: "펀딩비 컨디션",
        summary: "롱 포지션 우위, 과열 주의"
      },
      whaleFlow: {
        title: "고래 지갑 순유입",
        summary: "순유입 확대, 매집 가능성"
      },
      volatility: {
        title: "변동성 경보",
        summary: "변동성 확장 구간 진입"
      },
      sectorRotation: {
        title: "섹터 로테이션",
        summary: "메이저 알트 순환 매수 강화"
      },
      liquidationHeatmap: {
        title: "청산 히트맵",
        summary: "상단 4% 구간 집중"
      }
    },
    values: {
      high: "높음",
      altPlus: "알트 +"
    }
  },
  news: {
    title: "News Hub",
    desc: "주요 뉴스와 시장 이슈를 한눈에 확인하고 빠르게 대응하세요.",
    search: "뉴스 검색",
    viewFull: "전문 보기",
    summary: "주요 내용 요약이 여기에 표시됩니다. 상세 뉴스는 클릭하여 원문으로 이동할 수 있습니다.",
    sources: {
      all: "전체",
      coindesk: "CoinDesk",
      cointelegraph: "Cointelegraph",
      bloomberg: "Bloomberg",
      theBlock: "The Block"
    },
    tags: {
      market: "시장",
      alt: "알트",
      exchange: "거래소",
      regulation: "규제",
      onchain: "온체인"
    },
    items: {
      news1: {
        title: "비트코인 현물 ETF 자금 유입 확대",
        time: "10분 전"
      },
      news2: {
        title: "알트코인 거래량 급증, 변동성 확대",
        time: "35분 전"
      },
      news3: {
        title: "거래소 유동성 지표 개선",
        time: "1시간 전"
      },
      news4: {
        title: "규제 당국, 스테이블코인 가이드라인 발표",
        time: "2시간 전"
      },
      news5: {
        title: "고래 지갑 대규모 이동 감지",
        time: "3시간 전"
      }
    }
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
    statusLimit: "무료 플랜은 최대 5개의 알림만 등록할 수 있습니다.",
    statusSaved: "알림이 등록되었습니다.",
    fields: {
      symbol: "코인",
      condition: "조건",
      value: "조건 값",
      window: "기간"
    },
    conditions: {
      priceUp: "가격 상승",
      priceDown: "가격 하락",
      changeSpike: "변동률 급등",
      volumeSpike: "거래량 급증",
      newsKeyword: "뉴스 키워드"
    },
    freeLimit: "무료 플랜은 5개까지 등록 가능합니다.",
    proUnlimited: "Pro 회원은 무제한 알림을 등록할 수 있습니다."
  },
  auth: {
    loginTitle: "로그인",
    loginDesc: "이메일과 비밀번호로 로그인하거나 Google로 계속하세요.",
    loginButton: "로그인",
    signupTitle: "회원가입",
    signupDesc: "이메일로 가입하고 이메일 인증을 완료하세요.",
    signupButton: "회원가입",
    googleCta: "Google로 계속하기",
    or: "또는",
    emailLabel: "이메일",
    emailPlaceholder: "이메일을 입력하세요",
    passwordLabel: "비밀번호",
    passwordPlaceholder: "비밀번호를 입력하세요",
    passwordPolicyHint: "비밀번호는 12자 이상, 공백 없이 입력하세요.",
    passwordConfirmLabel: "비밀번호 확인",
    passwordConfirmPlaceholder: "비밀번호를 다시 입력하세요",
    otpLabel: "인증 코드",
    otpPlaceholder: "인증 코드를 입력하세요",
    otpCta: "인증 코드 확인",
    mfaPrompt: "2단계 인증 코드 입력이 필요합니다.",
    forgotLink: "비밀번호를 잊으셨나요?",
    signupLink: "가입하기",
    loginLink: "로그인",
    hasAccount: "이미 계정이 있으신가요?",
    redirecting: "Google 로그인 진행 중입니다.",
    agreement: "로그인을 진행하면 서비스 약관과 개인정보 처리방침에 동의하게 됩니다.",
    loginFailed: "로그인에 실패했습니다. 다시 시도해주세요.",
    signupFailed: "회원가입에 실패했습니다. 다시 시도해주세요.",
    signupSuccess: "회원가입이 완료되었습니다. 이메일을 확인해 인증을 완료하세요.",
    emailExists: "이미 가입된 이메일입니다.",
    passwordTooShort: "비밀번호는 최소 12자 이상이어야 합니다.",
    passwordNoWhitespace: "비밀번호에는 공백을 사용할 수 없습니다.",
    passwordMismatch: "비밀번호가 일치하지 않습니다.",
    forgotTitle: "비밀번호 재설정",
    forgotDesc: "등록한 이메일로 재설정 링크를 보내드립니다.",
    forgotCta: "재설정 링크 보내기",
    forgotSuccess: "메일을 확인해주세요.",
    resetTitle: "새 비밀번호 설정",
    resetDesc: "새 비밀번호를 입력해 주세요.",
    resetCta: "비밀번호 변경",
    resetSuccess: "비밀번호가 변경되었습니다.",
    resetMissingToken: "재설정 토큰이 없습니다.",
    verifyTitle: "이메일 인증",
    verifyDesc: "이메일 인증을 완료해 계정을 활성화하세요.",
    verifyCta: "이메일 인증하기",
    verifyResend: "인증 메일 재발송",
    verifySent: "인증 메일을 다시 전송했습니다.",
    verifySuccess: "이메일 인증이 완료되었습니다.",
    verifyChecking: "이메일 인증을 확인 중입니다.",
    verifyAlready: "이미 인증된 이메일입니다.",
    verifyExpired: "인증 토큰이 만료되었습니다.",
    verifyInvalid: "인증 토큰이 유효하지 않습니다.",
    verifyCtaLogin: "로그인",
    verifyCtaHome: "홈으로",
    verifyResendCooldown: "{{seconds}}초 후 재발송 가능",
    verifyMissingToken: "인증 토큰이 필요합니다. 이메일의 인증 링크를 열어주세요.",
    verifyMissingEmail: "이메일을 입력해주세요.",
    errorInvalidCredentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
    attemptsLeft: "남은 시도: {{count}}회",
    errorAccountLocked: "보안상 계정이 잠겼습니다.",
    lockedUntil: "{{time}} 이후 다시 시도해 주세요.",
    lockedRemaining: "남은 시간: {{remain}}",
    lockedResetCta: "비밀번호 재설정으로 잠금 해제",
    lockedCtaHint: "비밀번호 재설정으로 바로 해제할 수 있습니다.",
    errorMfaRequired: "2단계 인증 코드 입력이 필요합니다.",
    errorInvalidMfa: "인증 코드가 올바르지 않습니다.",
    errorInvalidToken: "토큰이 유효하지 않습니다.",
    errorExpiredToken: "토큰이 만료되었습니다.",
    errorEmailNotVerified: "이메일 인증이 필요합니다.",
    errorAccountInactive: "탈퇴 처리된 계정입니다. 일정 기간 후 다시 가입할 수 있습니다.",
    errorAccountInactiveWithDays: "{{days}}일 후 다시 가입할 수 있습니다.",
    verifyNowCta: "이메일 인증하기",
    rejoinCta: "다시 가입하기",
    verifyAutoRedirect: "잠시 후 로그인 페이지로 이동합니다.",
    requestFailed: "요청 처리 중 오류가 발생했습니다."
  },
  security: {
    title: "보안 설정",
    desc: "2단계 인증과 계정 보호 설정을 관리하세요.",
    mfaHelpTitle: "2FA 설정 안내",
    mfaHelpStep1: "인증 앱(Google Authenticator, Authy 등)을 설치합니다.",
    mfaHelpStep2: "QR을 스캔하거나 수동 키를 입력해 계정을 추가합니다.",
    mfaHelpStep3: "앱에 표시된 6자리 코드를 입력해 활성화합니다.",
    mfaHelpBackupWarning: "백업 코드는 분실 시 복구에 필요합니다. 안전한 곳에 저장하세요.",
    copy: "복사",
    copied: "복사 완료",
    mfaTitle: "2단계 인증(2FA)",
    mfaStatusOn: "현재 2FA가 활성화되어 있습니다.",
    mfaStatusOff: "현재 2FA가 비활성화되어 있습니다.",
    mfaSetupCta: "2FA 설정 시작",
    mfaManualKey: "수동 입력 키",
    mfaCodeLabel: "인증 코드",
    mfaCodePlaceholder: "인증 코드를 입력하세요",
    mfaConfirmCta: "2FA 활성화",
    mfaDisable: "2FA 비활성화",
    mfaEnabled: "2FA가 활성화되었습니다.",
    mfaDisabled: "2FA가 비활성화되었습니다.",
    backupTitle: "백업 코드",
    backupDownload: "다운로드",
    backupRegenerate: "백업 코드 재발급",
    backupRegenerated: "백업 코드가 재발급되었습니다.",
    backupOneTimeNotice: "백업 코드는 최초 1회만 제공됩니다. 안전한 곳에 저장하세요.",
    passwordLabel: "비밀번호",
    passwordPlaceholder: "비밀번호를 입력하세요",
    passwordChangeTitle: "비밀번호 변경",
    passwordChangeDesc: "현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.",
    currentPasswordLabel: "현재 비밀번호",
    newPasswordLabel: "새 비밀번호",
    newPasswordConfirmLabel: "새 비밀번호 확인",
    newPasswordPlaceholder: "새 비밀번호를 입력하세요",
    newPasswordConfirmPlaceholder: "새 비밀번호를 다시 입력하세요",
    passwordChangeCta: "비밀번호 변경",
    passwordChangeDone: "비밀번호가 변경되었습니다.",
    passwordMissingTitle: "비밀번호 설정 필요",
    passwordMissingDesc: "현재 계정에 비밀번호가 없습니다. 탈퇴/2FA 비활성화는 Google 재인증으로 진행할 수 있고, 필요하면 비밀번호를 설정하세요.",
    passwordMissingCta: "비밀번호 설정",
    googleReauthTitle: "Google 재인증",
    googleReauthDesc: "Google 계정은 재인증으로 민감 작업을 진행합니다.",
    googleReauthCta: "Google 재인증하기",
    googleReauthDone: "Google 재인증이 완료되었습니다.",
    googleReauthDoneShort: "Google 재인증 완료",
    googleReauthRequired: "Google 재인증이 필요합니다.",
    passwordSetTitle: "비밀번호 설정",
    passwordSetDesc: "Google 가입 계정은 Google 재인증을 통해 로컬 비밀번호를 1회 설정할 수 있습니다.",
    passwordSetGoogleHintTitle: "Google 재인증",
    passwordSetGoogleHint: "아래 버튼을 눌러 Google 재인증을 진행하고, 최신 ID 토큰을 발급받습니다.",
    passwordSetGoogleCta: "Google 재인증하기",
    passwordSetGoogleDone: "Google 재인증이 완료되었습니다.",
    passwordSetGoogleDoneShort: "Google 재인증 완료",
    passwordSetGoogleRequired: "Google 재인증이 필요합니다.",
    passwordSetMfaHint: "2FA가 활성화된 계정은 TOTP 코드 또는 백업 코드를 입력해야 합니다.",
    passwordSetCta: "비밀번호 설정",
    passwordSetDone: "비밀번호가 설정되었습니다.",
    passwordSetBack: "돌아가기",
    passwordAlreadySet: "이미 비밀번호가 설정된 계정입니다.",
    deleteTitle: "탈퇴",
    deleteDesc: "탈퇴 즉시 로그아웃되며 일정 기간 후 데이터가 영구 삭제됩니다.",
    deletePurge: "데이터는 {{days}}일 후 영구 삭제됩니다.",
    deleteReason: "탈퇴 사유(선택)",
    deleteReasonPlaceholder: "사유를 입력하세요",
    deleteCta: "계정 탈퇴",
    deleteDone: "탈퇴가 완료되었습니다.",
    deletedTitle: "탈퇴 완료",
    deletedDesc: "계정이 비활성화되었고 로그아웃 처리되었습니다. 아래 안내를 확인한 뒤 이동하세요.",
    deletedPurgeAfter: "데이터는 {{days}}일 후 영구 삭제됩니다.",
    deletedRejoinHint: "영구 삭제 전에는 동일 이메일로 재가입이 제한될 수 있습니다.",
    deletedCtaLogin: "로그인 페이지로",
    deletedCtaSignup: "회원가입"
  },
  account: {
    title: "Account",
    desc: "프로필, 구독, 보안 설정을 한 곳에서 관리하세요.",
    profile: "프로필",
    name: "이름",
    email: "이메일",
    loginRequired: "로그인 필요",
    joinDate: "가입일",
    joinDatePending: "서버 데이터 연동 예정",
    editProfile: "환경설정",
    plan: "구독 상태",
    currentPlan: "현재 플랜",
    pro: "Pro",
    free: "Free",
    planMetaPro: "서버 데이터 연동 예정입니다.",
    planMetaFree: "서버 데이터 연동 예정입니다.",
    planCta: "Pro 업그레이드",
    security: "보안",
    securityDesc: "2FA 및 계정 보호 설정을 관리하세요.",
    securityCta: "보안 설정 열기",
    payment: "결제 수단",
    paymentDesc: "등록된 카드: **** 4242",
    paymentNext: "다음 결제일: 2025-12-31",
    paymentEdit: "결제 수단 변경",
    notify: "알림 설정",
    notifyDesc: "웹 푸시 · 이메일 · 앱 알림 채널을 관리하세요.",
    notifyCta: "알림 관리 이동"
  },
  accountSettings: {
    title: "환경설정",
    desc: "기본 거래 환경과 알림/마케팅 수신 동의를 관리하세요.",
    loadFailed: "환경설정을 불러오지 못했습니다.",
    empty: "설정 데이터를 준비 중입니다.",
    sectionTrade: "기본 거래 환경",
    marketDefault: "기본 마켓",
    sortDefault: "기본 정렬",
    tfDefault: "기본 TF",
    sectionDisplay: "표시",
    currency: "통화",
    language: "언어",
    theme: "테마",
    themeLight: "라이트",
    themeDark: "다크",
    timezone: "타임존",
    detectTz: "자동 감지",
    sectionNotify: "알림",
    alertEmail: "이메일",
    alertSms: "SMS",
    alertPush: "푸시",
    smsDisabled: "SMS는 전화번호 인증 기능이 준비되면 활성화됩니다.",
    quietEnabled: "야간 금지",
    quietStart: "시작",
    quietEnd: "종료",
    weeklyDigest: "주간 다이제스트",
    weeklyDigestDow: "요일",
    weeklyDigestHour: "시간",
    dow: {
      0: "일",
      1: "월",
      2: "화",
      3: "수",
      4: "목",
      5: "금",
      6: "토"
    },
    sectionMarketing: "마케팅 수신 동의",
    marketingDesc: "언제든 철회 가능하며, 변경 이력은 감사 로그로 저장됩니다.",
    mktEmail: "이메일",
    mktSms: "SMS",
    mktPush: "푸시",
    marketingImmediate: "마케팅 동의는 토글 즉시 서버에 반영됩니다.",
    saved: "저장되었습니다.",
    synced: "동기화됨",
    unsaved: "저장되지 않은 변경사항",
    saving: "저장 중…",
    save: "저장"
  },
  upgrade: {
    title: "Pro 업그레이드",
    desc: "월 단위 구독으로 고급 데이터를 실시간으로 받아보세요.",
    planTitle: "Pro 플랜 혜택",
    features: {
      item1: "전체 심볼 실시간 업데이트",
      item2: "무제한 알림 및 즉시 푸시",
      item3: "AI 인사이트 리포트 전체 공개",
      item4: "광고 제거 및 고급 지표 제공"
    },
    price: "월 29,000원",
    priceNote: "VAT 포함 · 언제든 해지 가능",
    payTitle: "결제 정보",
    cta: "월 구독 시작하기",
    active: "이미 Pro 플랜이 활성화되어 있습니다.",
    statusActivated: "Pro 구독이 활성화되었습니다. 계정 페이지에서 상태를 확인하세요.",
    statusPending: "결제는 준비 중입니다. 안내가 완료되면 알려드리겠습니다.",
    cardNumber: "카드 번호",
    cardNumberPlaceholder: "카드 번호를 입력하세요",
    cardExpiry: "만료일",
    cardExpiryPlaceholder: "만료일을 입력하세요",
    cvc: "CVC",
    cvcPlaceholder: "보안 코드를 입력하세요",
    kind: "상품",
    kindSub: "구독(sub)",
    kindPass30: "30일권(pass30)",
    currency: "통화",
    currencyNote: "표시 통화와 청구 통화는 다를 수 있습니다.",
    currencySubNote: "구독(sub)은 결제사 정책으로 USD만 지원합니다.",
    provider: "결제 수단",
    coupon: "쿠폰",
    couponPlaceholder: "쿠폰 코드(선택)",
    planCard: {
      title: { free: "무료", pro: "Pro" },
      badge: { current: "현재 이용 중", selectable: "선택 가능" },
      section: { api: "API", watchlists: "워치리스트", alerts: "알림", history: "히스토리" },
      apiLine: "분당 {{rpm}}회 · 일 {{day}}회",
      watchlistsLine: "리스트 {{lists}}개 · 리스트당 {{items}}개",
      alertsLine: "규칙 {{maxRules}}개",
      historyLine: "{{maxDays}}일"
    }
  },
  errors: {
    debug: "디버그 정보",
    retry: "재시도",
    unauthorized: {
      title: "로그인이 필요합니다",
      desc: "계속하려면 로그인해주세요."
    },
    conflict: {
      title: "이미 이용 중입니다",
      desc: "현재 이용 중인 상품이 있어 새 결제를 진행할 수 없습니다. Billing에서 해지/만료 후 다시 시도하세요."
    },
    rateLimit: {
      title: "사용량이 초과되었습니다",
      desc: "오늘 한도 또는 분당 한도를 초과했습니다. 잠시 후 다시 시도하거나 업그레이드하세요.",
      retryAfter: "{{seconds}} 후 다시 시도할 수 있습니다."
    },
    quotaExceeded: {
      title: "오늘 사용량이 초과되었습니다",
      desc: "오늘 한도를 모두 사용했습니다. 한도 초기화 후 다시 시도하거나 업그레이드하세요.",
      used: "사용량",
      resetAt: "초기화 시각",
      retryAfter: "재시도까지"
    },
    watchlistsLimit: {
      title: "워치리스트 한도 초과",
      desc: "현재 플랜 한도를 초과했습니다."
    },
    billing: {
      unsupportedProvider: {
        title: "지원하지 않는 결제 수단입니다",
        desc: "선택한 상품과 결제 수단 조합을 지원하지 않습니다. 다른 결제 수단을 선택하거나 상품을 변경하세요."
      },
      unsupportedCurrency: {
        title: "지원하지 않는 통화입니다",
        desc: "선택한 결제 수단에서 해당 통화를 지원하지 않습니다. 다른 통화를 선택해주세요."
      },
      originNotAllowed: {
        title: "결제를 시작할 수 없습니다",
        desc: "현재 접속한 주소에서 결제 시작이 허용되지 않습니다. 올바른 도메인/환경에서 다시 시도해주세요."
      },
      invalidPath: {
        title: "결제를 시작할 수 없습니다",
        desc: "결제 복귀 경로가 올바르지 않습니다. 잠시 후 다시 시도해주세요."
      },
      unavailable: {
        title: "결제 준비 중 문제가 발생했습니다",
        desc: "잠시 후 다시 시도해주세요."
      },
      backToUpgrade: "Upgrade로 이동",
      unsupportedPlanChange: {
        title: "플랜 변경이 지원되지 않습니다",
        desc: "현재 상태에서는 플랜 변경을 진행할 수 없습니다. Billing에서 상태를 확인하거나 기간 만료 후 다시 시도하세요."
      }
    },
    generic: {
      title: "요청에 실패했습니다",
      desc: "잠시 후 다시 시도해주세요."
    }
  },
  billing: {
    title: "Billing",
    desc: "플랜, 구독, 인보이스를 관리합니다.",
    goBilling: "Billing으로 이동",
    status: {
      title: "이용 상태",
      plan: "플랜",
      subscription: "구독",
      none: "없음",
      subStatus: {
        active: "활성",
        cancelAtPeriodEnd: "기간 종료 후 해지",
        canceled: "해지됨",
        pastDue: "결제 실패",
        unknown: "확인 필요"
      },
      pastDue: {
        title: "결제에 문제가 있습니다",
        desc: "결제 실패로 서비스가 제한될 수 있습니다. 결제 수단/결제 상태를 확인한 뒤 상태를 새로고침하세요.",
        helpCta: "무엇을 해야 하나요?",
        refreshCta: "상태 새로고침",
        help:
          "1) PayPal/Eximbay 등 결제사에서 결제 수단/잔액/승인 상태를 확인하세요.\n2) 결제 실패를 해결한 뒤 몇 분 후 다시 시도하거나, 이 화면에서 “상태 새로고침”을 눌러 반영 여부를 확인하세요.\n3) 지속되면 결제사 정책/오류로 인해 갱신이 제한될 수 있습니다."
      }
    },
    actions: {
      title: "관리",
      desc: "구독 해지/재활성, 재구매, 환불 요청을 수행합니다.",
      cancel: "해지",
      reactivate: "재활성",
      repurchase: "재구매"
    },
    sub: {
      none: "현재 활성 구독이 없습니다."
    },
    invoices: {
      title: "Invoices",
      desc: "인보이스 목록 및 다운로드",
      recent: "최근 인보이스",
      all: "전체 보기",
      status: {
        paid: "결제 완료",
        pending: "처리 중",
        unpaid: "미결제",
        failed: "실패",
        refunded: "환불",
        canceled: "취소",
        unknown: "확인 필요"
      },
      table: {
        date: "날짜",
        amount: "금액",
        currency: "통화",
        status: "상태",
        download: "다운로드",
        downloadCta: "열기",
        empty: "인보이스가 없습니다."
      }
    },
    refund: {
      cta: "환불 요청",
      formTitle: "환불 요청",
      selectPlaceholder: "인보이스를 선택하세요",
      reasonPlaceholder: "사유(선택)",
      submit: "요청 제출",
      submitted: "접수 완료",
      noInvoices: "환불 가능한 인보이스가 없습니다.",
      pickInvoice: "인보이스를 선택하세요."
    },
    return: {
      title: "결제 확인",
      desc: "결제 상태를 확인하고 권한을 갱신합니다.",
      checking: "결제 상태 확인 중...",
      noOrder: "order 정보가 없어 Billing 상태로 확인합니다.",
      canceledTitle: "결제가 취소되었습니다",
      canceledDesc: "원하시면 다시 결제를 진행하세요.",
      backUpgrade: "Upgrade로",
      successTitle: "업그레이드가 완료되었습니다",
      successDesc: "Billing에서 상태를 확인할 수 있습니다.",
      pendingTitle: "처리 중입니다",
      pendingDesc: "웹훅 지연이 있을 수 있습니다. Billing에서 상태를 확인하세요.",
      failedTitle: "결제가 실패했습니다",
      failedDesc: "Upgrade에서 다시 시도할 수 있습니다.",
      retryUpgrade: "다시 시도"
    }
  },
  usage: {
    title: "Usage",
    desc: "사용량과 한도를 확인합니다.",
    goUsage: "Usage로 이동",
    plan: "플랜",
    planHint: "플랜별 한도는 Billing/Plans 기준",
    callsToday: "오늘 API 호출",
    callsTodayHint: "calls_per_day 기준",
    rpm: "RPM",
    rpmHint: "분당 사용량",
    rpmHintNoUsed: "현재 사용량은 서버에서 제공되지 않을 수 있습니다.",
    entitlements: "엔티틀먼트",
    ent: {
      watchlistsMaxLists: "워치리스트 최대 개수",
      watchlistsMaxItems: "리스트당 최대 심볼",
      alertsMaxRules: "알림 최대 규칙",
      historyMaxDays: "히스토리 보관(일)"
    }
  },
  watchlists: {
    title: "Watchlists",
    desc: "관심 심볼을 리스트로 관리합니다.",
    listTitle: "목록",
    createTitle: "새 워치리스트",
    createNamePlaceholder: "이름",
    createTagsPlaceholder: "태그(쉼표로 구분)",
    createCta: "생성",
    pickOne: "워치리스트를 선택하세요.",
    itemsTitle: "아이템",
    addSymbol: "추가",
    updateCta: "수정",
    deleteCta: "삭제",
    editName: "이름",
    editTags: "태그",
    detailTitle: "Watchlist",
    detailDesc: "상세/공유/아이템 관리",
    back: "목록으로",
    invalidId: "잘못된 ID 입니다.",
    share: {
      cta: "공유 링크 생성",
      title: "공유 링크",
      copy: "복사",
      copied: "복사됨"
    },
    table: {
      market: "마켓",
      symbol: "심볼",
      remove: "삭제",
      removeCta: "삭제",
      empty: "아이템이 없습니다."
    },
    shared: {
      title: "Shared Watchlist",
      desc: "공유된 워치리스트입니다.",
      invalidToken: "유효하지 않은 토큰입니다.",
      empty: "아이템이 없습니다.",
      chart: "차트",
      viewChart: "차트 보기"
    }
  },
  devBilling: {
    title: "Dev Billing",
    desc: "개발용 mock 결제 플로우를 검증합니다.",
    kind: "상품",
    currency: "통화",
    start: "Mock 결제 시작",
    subUsdOnly: "sub는 USD만 허용됩니다."
  },
  payment: {
    amountLabel: "충전 금액",
    amountPlaceholder: "금액을 입력하세요",
    methodLabel: "결제 수단",
    methods: {
      card: "신용카드",
      bank: "계좌이체",
      crypto: "암호화폐 지갑"
    },
    cardNumber: "카드 번호",
    cardNumberPlaceholder: "카드 번호를 입력하세요",
    cardExpiry: "만료일",
    cardExpiryPlaceholder: "만료일을 입력하세요",
    bankAccount: "입금 계좌",
    bankAccountPlaceholder: "은행과 계좌번호를 입력하세요",
    walletAddress: "지갑 주소",
    walletAddressPlaceholder: "지갑 주소를 입력하세요",
    memoLabel: "요청 메모 (선택)",
    memoPlaceholder: "특이사항이 있다면 적어주세요.",
    submit: "결제 요청하기",
    statusSubmitted: "결제 요청이 전송되었습니다. 승인 결과를 확인해주세요.",
    summaryTitle: "결제 요약",
    summary: {
      amount: "충전 금액",
      method: "결제 수단",
      fee: "예상 수수료(1.5%)",
      total: "총 결제액",
      note: "실제 결제 연동 시 카드 인증/은행 확인 단계가 추가됩니다."
    }
  },
  education: {
    title: "Education",
    desc: "투자 결정을 돕는 핵심 가이드를 단계별로 제공합니다.",
    more: "자세히 보기",
    newsletter: "뉴스레터 신청",
    notice: "더 많은 콘텐츠는 곧 업데이트됩니다. 최신 자료는 뉴스레터로 안내드립니다.",
    levels: {
      beginner: "초급",
      intermediate: "중급"
    },
    lessons: {
      lesson1: {
        title: "시장 기초 읽기",
        summary: "가격·거래량·변동률 지표를 활용해 추세를 파악하는 방법"
      },
      lesson2: {
        title: "리스크 관리 전략",
        summary: "포지션 사이징과 손절/익절 전략 설계"
      },
      lesson3: {
        title: "차트 활용법",
        summary: "캔들 패턴과 주요 지지/저항 구간 분석"
      }
    }
  },
  legal: {
    privacyTitle: "Privacy Policy",
    privacyDesc: "CoinDash는 개인정보 보호를 최우선으로 합니다.",
    privacyItems: {
      item1: "1. 이메일, 로그인 정보는 서비스 제공 목적에 한해 처리됩니다.",
      item2: "2. 결제 정보는 승인 과정에서 암호화되어 저장 및 전송됩니다.",
      item3: "3. 사용자는 언제든지 개인정보 열람 및 수정 요청을 할 수 있습니다.",
      item4: "4. 자세한 정책은 고객센터를 통해 안내드립니다."
    },
    termsTitle: "Terms of Service",
    termsDesc: "본 서비스 약관은 서비스 이용과 관련된 기본 사항을 정의합니다.",
    termsItems: {
      item1: "1. 회원은 제공되는 실시간 데이터를 투자 판단의 참고 자료로 활용합니다.",
      item2: "2. 서비스는 시장 데이터 제공에 집중하며, 투자 손익에 대한 책임을 지지 않습니다.",
      item3: "3. 결제 및 KYC 기능은 추후 별도 안내에 따라 제공됩니다.",
      item4: "4. 자세한 약관은 고객센터를 통해 확인할 수 있습니다."
    }
  },
  footer: {
    company: "CoinDash Labs",
    policy: "Policy",
    terms: "서비스 이용약관",
    privacy: "개인정보 처리방침",
    subscription: "구독 관리",
    businessNumber: "사업자등록번호: 123-45-67890",
    ceo: "대표자: 홍길동",
    address: "주소: 서울특별시 강남구 테헤란로 123",
    email: "이메일: support@coindash.com",
    copyright: "(c) 2025 CoinDash Labs. All rights reserved."
  }
};

export default ko;
