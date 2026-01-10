const en = {
  common: {
    appName: "CoinDash",
    tagline: "AI crypto intelligence",
    pro: "PRO",
    proUpgrade: "Upgrade",
    login: "Login",
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
    notifications: {
      label: "Notifications",
      item1: {
        title: "BTC +5.2% surge in 1h",
        time: "Just now"
      },
      item2: {
        title: "ETH volume spike detected",
        time: "12 min ago"
      },
      item3: {
        title: "Market volatility alert",
        time: "1 hour ago"
      }
    },
    payment: "Payment",
    paymentDesc: "Add funds quickly when your balance is low."
  },
  nav: {
    home: "Home",
    market: "Market",
    charts: "Charts",
    ai: "AI Insights",
    news: "News",
    alerts: "Alerts",
    payment: "Payment"
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
      title: "Live News",
      items: {
        item1: {
          title: "Bitcoin spot ETF inflows continue",
          time: "10 min ago"
        },
        item2: {
          title: "Altcoin volume spikes as volatility rises",
          time: "35 min ago"
        },
        item3: {
          title: "Markets cautious ahead of Fed announcement",
          time: "1 hour ago"
        }
      }
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
    change: "{{tf}} Change",
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
    news: "News",
    selectSymbol: "Select a symbol to view the chart.",
    loadError: "Failed to load chart data.",
    loadingMore: "Loading...",
    loadMore: "Load previous data",
    aiSignals: {
      signal1Title: "Upside probability",
      signal1Desc: "62% · Volatility expansion zone",
      signal2Title: "Risk alert",
      signal2Desc: "Short-term overheated, trend confirmation needed"
    },
    techValues: {
      rsi: "58 · Neutral",
      macd: "Bullish turn",
      bollingerLabel: "Bollinger Bands",
      bollingerValue: "Near upper band"
    },
    newsItems: {
      item1: "BTC regulation update",
      item2: "Exchange liquidity expansion report",
      item3: "Whale wallet movement detected"
    }
  },
  ai: {
    title: "AI Insights",
    desc: "View AI-driven indicators and signals in one place.",
    updated: "Updated 3 minutes ago",
    viewDetail: "View detail",
    proLock: "Upgrade to Pro to unlock all indicators.",
    upgrade: "Upgrade",
    valueLabel: "Current value",
    categories: {
      all: "All",
      momentum: "Momentum",
      onchain: "On-chain",
      derivatives: "Derivatives",
      risk: "Risk"
    },
    signals: {
      momentumScore: {
        title: "AI Momentum Score",
        summary: "Momentum shifts toward bullish"
      },
      funding: {
        title: "Funding Rate Condition",
        summary: "Longs dominant, watch for overheating"
      },
      whaleFlow: {
        title: "Whale Net Inflow",
        summary: "Inflow expanding, accumulation possible"
      },
      volatility: {
        title: "Volatility Alert",
        summary: "Entering expansion zone"
      },
      sectorRotation: {
        title: "Sector Rotation",
        summary: "Major alts show rotation strength"
      },
      liquidationHeatmap: {
        title: "Liquidation Heatmap",
        summary: "Concentration near +4% band"
      }
    },
    values: {
      high: "High",
      altPlus: "Alt +"
    }
  },
  news: {
    title: "News Hub",
    desc: "Track key headlines and market issues at a glance.",
    search: "Search news",
    viewFull: "Read full",
    summary: "Summary highlights appear here. Click to read the full story.",
    sources: {
      all: "All",
      coindesk: "CoinDesk",
      cointelegraph: "Cointelegraph",
      bloomberg: "Bloomberg",
      theBlock: "The Block"
    },
    tags: {
      market: "Market",
      alt: "Alt",
      exchange: "Exchange",
      regulation: "Regulation",
      onchain: "On-chain"
    },
    items: {
      news1: {
        title: "Bitcoin spot ETF inflows expand",
        time: "10 min ago"
      },
      news2: {
        title: "Altcoin volume spikes as volatility rises",
        time: "35 min ago"
      },
      news3: {
        title: "Exchange liquidity indicators improve",
        time: "1 hour ago"
      },
      news4: {
        title: "Regulators release stablecoin guidelines",
        time: "2 hours ago"
      },
      news5: {
        title: "Large whale wallet movement detected",
        time: "3 hours ago"
      }
    }
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
    statusLimit: "Free plan allows up to 5 alerts.",
    statusSaved: "Alert has been created.",
    fields: {
      symbol: "Symbol",
      condition: "Condition",
      value: "Value",
      window: "Window"
    },
    conditions: {
      priceUp: "Price up",
      priceDown: "Price down",
      changeSpike: "Change spike",
      volumeSpike: "Volume spike",
      newsKeyword: "News keyword"
    },
    freeLimit: "Free plan allows up to 5 alerts.",
    proUnlimited: "Pro members can create unlimited alerts."
  },
  auth: {
    loginTitle: "Sign in",
    loginDesc: "Use your email and password, or continue with Google.",
    loginButton: "Sign in",
    signupTitle: "Create account",
    signupDesc: "Sign up with email and verify your address.",
    signupButton: "Create account",
    googleCta: "Continue with Google",
    or: "or",
    emailLabel: "Email",
    emailPlaceholder: "name@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter a password (12+ characters)",
    passwordConfirmLabel: "Confirm password",
    passwordConfirmPlaceholder: "Re-enter your password",
    otpLabel: "Verification code",
    otpPlaceholder: "6-digit code",
    otpCta: "Verify code",
    mfaPrompt: "Two-factor authentication is required.",
    forgotLink: "Forgot your password?",
    signupLink: "Create account",
    loginLink: "Sign in",
    hasAccount: "Already have an account?",
    redirecting: "Starting Google sign-in.",
    agreement: "By continuing, you agree to the Terms of Service and Privacy Policy.",
    loginFailed: "Sign-in failed. Please try again.",
    signupFailed: "Sign-up failed. Please try again.",
    signupSuccess: "Account created. Check your email to verify.",
    emailExists: "This email is already registered.",
    passwordTooShort: "Password must be at least 12 characters.",
    passwordNoWhitespace: "Password cannot contain spaces.",
    passwordMismatch: "Passwords do not match.",
    forgotTitle: "Reset your password",
    forgotDesc: "We’ll send a reset link to your email.",
    forgotCta: "Send reset link",
    forgotSuccess: "Check your email for the reset link.",
    resetTitle: "Set a new password",
    resetDesc: "Enter your new password below.",
    resetCta: "Update password",
    resetSuccess: "Your password has been updated.",
    resetMissingToken: "Reset token is missing.",
    verifyTitle: "Verify your email",
    verifyDesc: "Complete email verification to activate your account.",
    verifyCta: "Verify email",
    verifyResend: "Resend verification email",
    verifySent: "Verification email sent again.",
    verifySuccess: "Email verification completed.",
    verifyMissingToken: "Verification token is required. Open the link in your email.",
    verifyMissingEmail: "Please enter your email."
  },
  account: {
    title: "Account",
    desc: "Manage profile, subscription, and security in one place.",
    profile: "Profile",
    name: "Name",
    email: "Email",
    loginRequired: "Login required",
    joinDate: "Join date",
    joinDatePending: "Server data pending",
    editProfile: "Edit profile",
    plan: "Subscription",
    currentPlan: "Current plan",
    pro: "Pro",
    free: "Free",
    planMetaPro: "Server data will be linked here.",
    planMetaFree: "Server data will be linked here.",
    planCta: "Upgrade to Pro",
    security: "Security",
    securityDesc: "2FA, login alerts, and sessions will be linked to server data.",
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
    features: {
      item1: "Real-time updates for all symbols",
      item2: "Unlimited alerts with instant push",
      item3: "Full access to AI insight reports",
      item4: "Ad-free experience and advanced indicators"
    },
    price: "₩29,000 / month",
    priceNote: "VAT included · Cancel anytime",
    payTitle: "Payment details",
    cta: "Start monthly subscription",
    active: "Pro is already active.",
    statusActivated: "Pro is now active. Check your account page for status.",
    statusPending: "Payments are not ready yet. We will notify you when available.",
    cardNumber: "Card number",
    cardNumberPlaceholder: "1234 5678 9012 3456",
    cardExpiry: "Expiry",
    cardExpiryPlaceholder: "MM/YY",
    cvc: "CVC",
    cvcPlaceholder: "123"
  },
  payment: {
    amountLabel: "Top-up amount",
    amountPlaceholder: "e.g., 300000",
    methodLabel: "Payment method",
    methods: {
      card: "Credit card",
      bank: "Bank transfer",
      crypto: "Crypto wallet"
    },
    cardNumber: "Card number",
    cardNumberPlaceholder: "1234 5678 9012 3456",
    cardExpiry: "Expiry",
    cardExpiryPlaceholder: "MM/YY",
    bankAccount: "Deposit account",
    bankAccountPlaceholder: "KB 123-456-789012",
    walletAddress: "Wallet address",
    walletAddressPlaceholder: "0x....",
    memoLabel: "Memo (optional)",
    memoPlaceholder: "Add any special notes.",
    submit: "Submit payment request",
    statusSubmitted: "Payment request sent. Please check the approval status.",
    summaryTitle: "Payment summary",
    summary: {
      amount: "Amount",
      method: "Method",
      fee: "Estimated fee (1.5%)",
      total: "Total",
      note: "Actual integrations add card verification or bank confirmation steps."
    }
  },
  education: {
    title: "Education",
    desc: "Step-by-step guides for better decisions.",
    more: "View details",
    newsletter: "Subscribe",
    notice: "More content coming soon. Subscribe to our newsletter.",
    levels: {
      beginner: "Beginner",
      intermediate: "Intermediate"
    },
    lessons: {
      lesson1: {
        title: "Reading market basics",
        summary: "Use price, volume, and change to identify trends"
      },
      lesson2: {
        title: "Risk management strategy",
        summary: "Position sizing and stop/take-profit planning"
      },
      lesson3: {
        title: "Chart playbook",
        summary: "Analyze candles and key support/resistance zones"
      }
    }
  },
  legal: {
    privacyTitle: "Privacy Policy",
    privacyDesc: "CoinDash prioritizes user privacy.",
    privacyItems: {
      item1: "1. Email and login data are processed only for service delivery.",
      item2: "2. Payment details are encrypted during approval and storage.",
      item3: "3. Users may request access or corrections to personal data at any time.",
      item4: "4. For more details, contact customer support."
    },
    termsTitle: "Terms of Service",
    termsDesc: "These terms define basic service usage.",
    termsItems: {
      item1: "1. Members use real-time data as reference for decisions.",
      item2: "2. The service focuses on market data and is not responsible for gains or losses.",
      item3: "3. Payment and KYC features will be announced separately.",
      item4: "4. Full terms are available via customer support."
    }
  },
  footer: {
    company: "CoinDash Labs",
    policy: "Policy",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    subscription: "Subscription",
    businessNumber: "Business registration: 123-45-67890",
    ceo: "CEO: Hong Gil-dong",
    address: "123 Teheran-ro, Gangnam-gu, Seoul",
    email: "Email: support@coindash.com",
    copyright: "(c) 2025 CoinDash Labs. All rights reserved."
  }
};

export default en;
