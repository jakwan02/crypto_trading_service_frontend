const ja = {
  common: {
    appName: "CoinDash",
    tagline: "AI暗号資産インテリジェンス",
    pro: "PRO",
    proUpgrade: "アップグレード",
    login: "ログイン",
    loginGoogle: "Googleでログイン",
    logout: "ログアウト",
    account: "アカウント",
    alerts: "アラート",
    guest: "ゲスト",
    user: "ユーザー",
    recentAlerts: "最近のアラート",
    navigation: "ナビゲーション",
    viewAll: "すべて表示",
    more: "もっと見る",
    loading: "読み込み中",
    searchSymbol: "シンボル検索",
    marketSpot: "スポット",
    marketUm: "UM",
    live: "LIVE",
    notifications: {
      label: "通知",
      item1: {
        title: "BTC 1時間で+5.2%急騰",
        time: "たった今"
      },
      item2: {
        title: "ETHの出来高急増を検知",
        time: "12分前"
      },
      item3: {
        title: "市場のボラティリティ警告",
        time: "1時間前"
      }
    },
    payment: "支払い",
    paymentDesc: "残高が少ないときにすばやくチャージできます。"
  },
  nav: {
    home: "ホーム",
    market: "マーケット",
    charts: "チャート",
    ai: "AIインサイト",
    news: "ニュース",
    alerts: "アラート",
    payment: "支払い"
  },
  home: {
    hero: {
      badge: "AIマーケットダッシュボード",
      title: "市場の流れを読み、重要な変化を素早く捉える",
      description:
        "リアルタイムデータ、チャート、アラート、プレミアム分析を1つのダッシュボードで統合し、判断を加速します。",
      ctaMarket: "マーケットへ",
      ctaAlerts: "アラートを設定"
    },
    focus: {
      title: "今日の注目",
      item1: "リアルタイム価格更新",
      item1Meta: "~200ms",
      item2: "ボラティリティ警報",
      item2Meta: "24h",
      item3: "出来高/売買代金分離",
      item3Meta: "Base/Quote"
    },
    pulse: {
      title: "マーケットパルス",
      desc: "ライブデータで今日の市場の流れを要約します。",
      totalSymbols: "総シンボル数",
      totalSymbolsMeta: "現在の市場",
      totalQuote: "24h売買代金",
      totalQuoteMeta: "クォート出来高合計",
      avgChange: "平均変動率",
      avgChangeMeta: "市場モメンタム",
      gainers: "上昇上位",
      losers: "下落上位",
      loading: "データ読み込み中"
    },
    volumeSpike: {
      title: "出来高スパイク",
      top: "Top 6",
      goMarket: "マーケットを見る"
    },
    aiHighlights: {
      title: "AIハイライト",
      card1Title: "マーケットモメンタム",
      card1Desc: "中立→強気シグナルを検出",
      card2Title: "BTCボラティリティ",
      card2Desc: "短期過熱の警告",
      card3Title: "アルトセクター",
      card3Desc: "主要アルトの循環買い",
      upsell: "Proで全AIレポートと指標を開放。",
      upgrade: "アップグレード"
    },
    news: {
      title: "ライブニュース",
      items: {
        item1: {
          title: "ビットコイン現物ETFの流入が継続",
          time: "10分前"
        },
        item2: {
          title: "アルトコイン出来高が増加、ボラティリティ拡大",
          time: "35分前"
        },
        item3: {
          title: "FOMC発表を控え市場は様子見",
          time: "1時間前"
        }
      }
    },
    quick: {
      title: "クイックアクション",
      item1: "価格アラートを設定して急変を見逃さない。",
      item2: "お気に入りコインをウォッチリストで管理。",
      item3: "リスク警告で撤退タイミングを逃さない。",
      goAlerts: "アラートへ"
    }
  },
  market: {
    title: "マーケット概要",
    desc: "価格・出来高・変動率で市場をスクリーニング。",
    filterAll: "すべて",
    filterGainers: "上昇",
    filterLosers: "下落",
    searchPlaceholder: "シンボルまたはベース資産を検索",
    freeLimit: "無料プランは上位50銘柄のみ表示。全銘柄とリアルタイム更新はPro専用。"
  },
  table: {
    metricsWindow: "指標ウィンドウ",
    sortableHint: "ソート可能な列のみクリックできます。",
    symbol: "シンボル",
    price: "価格",
    volume: "出来高",
    turnover: "売買代金",
    change: "{{tf}} 変動率",
    onboardDate: "上場日",
    empty: "表示するシンボルがありません。",
    error: "シンボルの読み込みに失敗しました。",
    loading: "読み込み中...",
    limitNotice: "無料プランは上位{{count}}銘柄のみ表示。"
  },
  chart: {
    hubTitle: "チャートハブ",
    hubDesc: "シンボルを選んで詳細チャートと分析を表示。",
    chartTitle: "{{symbol}} チャート",
    chartDesc: "リアルタイムチャートとAIサマリーを確認。",
    invalidSymbol: "無効なシンボルです。",
    alertCta: "アラート設定",
    aiCta: "AIインサイト",
    currentPrice: "現在価格",
    change: "{{tf}} 変動率",
    volume: "{{tf}} 出来高",
    quoteVolume: "{{tf}} 売買代金",
    freeHistory: "無料プランは直近1か月の履歴のみ表示。",
    aiSignal: "AIシグナル",
    aiUpsell: "詳細なシグナルとレポートはProで。",
    techIndicators: "テクニカル指標",
    news: "ニュース",
    selectSymbol: "シンボルを選択してください。",
    loadError: "チャートデータの読み込みに失敗しました。",
    loadingMore: "読み込み中...",
    loadMore: "過去データを読み込む",
    aiSignals: {
      signal1Title: "上昇確率",
      signal1Desc: "62% · ボラ拡大ゾーン",
      signal2Title: "リスク警告",
      signal2Desc: "短期過熱、トレンド確認が必要"
    },
    techValues: {
      rsi: "58 · 中立",
      macd: "強気転換",
      bollingerLabel: "ボリンジャーバンド",
      bollingerValue: "上限付近"
    },
    newsItems: {
      item1: "BTC規制アップデート",
      item2: "取引所流動性拡大レポート",
      item3: "クジラウォレット移動を検知"
    }
  },
  ai: {
    title: "AIインサイト",
    desc: "AI指標とシグナルを一箇所で確認。",
    updated: "3分前更新",
    viewDetail: "詳細を見る",
    proLock: "すべての指標を開放するにはProへ。",
    upgrade: "アップグレード",
    valueLabel: "現在値",
    categories: {
      all: "すべて",
      momentum: "モメンタム",
      onchain: "オンチェーン",
      derivatives: "デリバティブ",
      risk: "リスク"
    },
    signals: {
      momentumScore: {
        title: "AIモメンタムスコア",
        summary: "モメンタムが強気方向へ"
      },
      funding: {
        title: "資金調達率の状況",
        summary: "ロング優勢、過熱に注意"
      },
      whaleFlow: {
        title: "クジラ純流入",
        summary: "流入拡大、蓄積の兆し"
      },
      volatility: {
        title: "ボラティリティ警告",
        summary: "拡大ゾーンに突入"
      },
      sectorRotation: {
        title: "セクターローテーション",
        summary: "主要アルトに回転の強さ"
      },
      liquidationHeatmap: {
        title: "清算ヒートマップ",
        summary: "+4%付近に集中"
      }
    },
    values: {
      high: "高",
      altPlus: "アルト+"
    }
  },
  news: {
    title: "ニュースハブ",
    desc: "主要ヘッドラインと市場トピックを一目で。",
    search: "ニュース検索",
    viewFull: "全文を見る",
    summary: "要約がここに表示されます。クリックで全文を読む。",
    sources: {
      all: "すべて",
      coindesk: "CoinDesk",
      cointelegraph: "Cointelegraph",
      bloomberg: "Bloomberg",
      theBlock: "The Block"
    },
    tags: {
      market: "市場",
      alt: "アルト",
      exchange: "取引所",
      regulation: "規制",
      onchain: "オンチェーン"
    },
    items: {
      news1: {
        title: "ビットコイン現物ETFの流入拡大",
        time: "10分前"
      },
      news2: {
        title: "アルトコイン出来高増加、ボラ拡大",
        time: "35分前"
      },
      news3: {
        title: "取引所流動性指標が改善",
        time: "1時間前"
      },
      news4: {
        title: "規制当局がステーブルコイン指針を発表",
        time: "2時間前"
      },
      news5: {
        title: "大口ウォレット移動を検知",
        time: "3時間前"
      }
    }
  },
  alertsPage: {
    title: "アラート",
    desc: "価格、ボラティリティ、ニュースのイベントを通知。",
    permissionCta: "権限をリクエスト",
    permissionUnsupported: "このブラウザはWebプッシュに対応していません。",
    permissionGranted: "Webプッシュが有効です。",
    permissionDenied: "通知がブロックされています。設定で許可してください。",
    permissionDefault: "重要アラートのためWebプッシュを許可してください。",
    newAlert: "新しいアラート",
    summary: "アラート概要",
    save: "アラート保存",
    on: "ON",
    off: "OFF",
    statusLimit: "無料プランは最大5件まで。",
    statusSaved: "アラートを作成しました。",
    fields: {
      symbol: "シンボル",
      condition: "条件",
      value: "値",
      window: "ウィンドウ"
    },
    conditions: {
      priceUp: "価格上昇",
      priceDown: "価格下落",
      changeSpike: "変動急増",
      volumeSpike: "出来高急増",
      newsKeyword: "ニュースキーワード"
    },
    freeLimit: "無料プランは最大5件まで。",
    proUnlimited: "Proは無制限に作成できます。"
  },
  auth: {
    loginTitle: "ログイン",
    loginDesc: "メールとパスワード、またはGoogleで続けます。",
    loginButton: "ログイン",
    signupTitle: "新規登録",
    signupDesc: "メールで登録し、メール認証を完了してください。",
    signupButton: "新規登録",
    googleCta: "Googleで続ける",
    or: "または",
    emailLabel: "メール",
    emailPlaceholder: "name@example.com",
    passwordLabel: "パスワード",
    passwordPlaceholder: "12文字以上のパスワードを入力",
    passwordPolicyHint: "12文字以上・空白なしで入力してください。",
    passwordConfirmLabel: "パスワード確認",
    passwordConfirmPlaceholder: "もう一度入力",
    otpLabel: "認証コード",
    otpPlaceholder: "6桁のコード",
    otpCta: "コード確認",
    mfaPrompt: "2段階認証コードの入力が必要です。",
    forgotLink: "パスワードを忘れた場合",
    signupLink: "新規登録",
    loginLink: "ログイン",
    hasAccount: "アカウントをお持ちですか？",
    redirecting: "Googleログインを開始します。",
    agreement: "続行することで利用規約とプライバシーポリシーに同意したことになります。",
    loginFailed: "ログインに失敗しました。もう一度お試しください。",
    signupFailed: "登録に失敗しました。もう一度お試しください。",
    signupSuccess: "登録が完了しました。メールを確認して認証してください。",
    emailExists: "既に登録されたメールアドレスです。",
    passwordTooShort: "パスワードは12文字以上で入力してください。",
    passwordNoWhitespace: "パスワードに空白は使用できません。",
    passwordMismatch: "パスワードが一致しません。",
    forgotTitle: "パスワード再設定",
    forgotDesc: "再設定リンクをメールで送信します。",
    forgotCta: "再設定リンクを送信",
    forgotSuccess: "メールをご確認ください。",
    resetTitle: "新しいパスワード",
    resetDesc: "新しいパスワードを入力してください。",
    resetCta: "パスワード更新",
    resetSuccess: "パスワードを更新しました。",
    resetMissingToken: "再設定トークンがありません。",
    verifyTitle: "メール認証",
    verifyDesc: "メール認証を完了してアカウントを有効化してください。",
    verifyCta: "メール認証を行う",
    verifyResend: "認証メールを再送",
    verifySent: "認証メールを再送しました。",
    verifySuccess: "メール認証が完了しました。",
    verifyChecking: "メール認証を確認中です。",
    verifyAlready: "既に認証済みのメールです。",
    verifyExpired: "認証トークンの有効期限が切れています。",
    verifyInvalid: "認証トークンが無効です。",
    verifyCtaLogin: "ログイン",
    verifyCtaHome: "ホームへ",
    verifyResendCooldown: "{{seconds}}秒後に再送できます",
    verifyMissingToken: "認証トークンが必要です。メールのリンクを開いてください。",
    verifyMissingEmail: "メールアドレスを入力してください。",
    errorInvalidCredentials: "メールアドレスまたはパスワードが正しくありません。",
    attemptsLeft: "残り試行回数: {{count}}",
    errorAccountLocked: "セキュリティのためアカウントがロックされています。",
    lockedUntil: "{{time}}以降に再試行してください。",
    lockedRemaining: "残り時間: {{remain}}",
    lockedResetCta: "パスワード再設定で解除",
    lockedCtaHint: "パスワード再設定で即時解除できます。",
    errorMfaRequired: "2段階認証コードの入力が必要です。",
    errorInvalidMfa: "認証コードが正しくありません。",
    errorInvalidToken: "トークンが無効です。",
    errorExpiredToken: "トークンの有効期限が切れています。",
    errorEmailNotVerified: "メール認証が必要です。",
    verifyNowCta: "メール認証へ",
    verifyAutoRedirect: "まもなくログイン画面へ移動します。",
    requestFailed: "リクエストに失敗しました。もう一度お試しください。"
  },
  security: {
    title: "セキュリティ設定",
    desc: "2段階認証とアカウント保護を管理します。",
    mfaHelpTitle: "2FA設定ガイド",
    mfaHelpStep1: "認証アプリ（Google Authenticator、Authyなど）をインストールします。",
    mfaHelpStep2: "QRをスキャンするか手動キーを入力してアカウントを追加します。",
    mfaHelpStep3: "アプリに表示される6桁コードを入力して有効化します。",
    mfaHelpBackupWarning: "バックアップコードは復旧に必要です。安全な場所に保管してください。",
    copy: "コピー",
    copied: "コピーしました",
    mfaTitle: "2段階認証(2FA)",
    mfaStatusOn: "2FAが有効です。",
    mfaStatusOff: "2FAが無効です。",
    mfaSetupCta: "2FAを開始",
    mfaManualKey: "手動入力キー",
    mfaCodeLabel: "認証コード",
    mfaCodePlaceholder: "6桁コード",
    mfaConfirmCta: "2FAを有効化",
    mfaDisable: "2FAを無効化",
    mfaEnabled: "2FAが有効になりました。",
    mfaDisabled: "2FAが無効になりました。",
    backupTitle: "バックアップコード",
    backupDownload: "ダウンロード",
    backupRegenerate: "バックアップコード再発行",
    backupRegenerated: "バックアップコードを再発行しました。",
    backupOneTimeNotice: "バックアップコードは1回のみ表示されます。安全な場所に保管してください。",
    passwordLabel: "パスワード",
    passwordPlaceholder: "パスワードを入力",
    passwordChangeTitle: "パスワード変更",
    passwordChangeDesc: "現在のパスワードを確認して新しいパスワードを設定します。",
    currentPasswordLabel: "現在のパスワード",
    newPasswordLabel: "新しいパスワード",
    newPasswordConfirmLabel: "新しいパスワード（確認）",
    newPasswordPlaceholder: "12文字以上、空白なし",
    newPasswordConfirmPlaceholder: "新しいパスワードを再入力",
    passwordChangeCta: "パスワード変更",
    passwordChangeDone: "パスワードを変更しました。",
    deleteTitle: "退会",
    deleteDesc: "退会すると即時ログアウトし、一定期間後にデータが削除されます。",
    deletePurge: "{{days}}日後にデータが完全に削除されます。",
    deleteReason: "退会理由(任意)",
    deleteReasonPlaceholder: "理由を入力してください",
    deleteCta: "アカウント削除",
    deleteDone: "退会が完了しました。"
  },
  account: {
    title: "アカウント",
    desc: "プロフィール、サブスク、セキュリティを管理。",
    profile: "プロフィール",
    name: "名前",
    email: "メール",
    loginRequired: "ログインが必要です",
    joinDate: "登録日",
    joinDatePending: "サーバーデータ連携予定",
    editProfile: "プロフィール編集",
    plan: "サブスクリプション",
    currentPlan: "現在のプラン",
    pro: "Pro",
    free: "無料",
    planMetaPro: "サーバーデータ連携予定です。",
    planMetaFree: "サーバーデータ連携予定です。",
    planCta: "Proにアップグレード",
    security: "セキュリティ",
    securityDesc: "2FAとアカウント保護を管理します。",
    securityCta: "セキュリティ設定を開く",
    payment: "支払い方法",
    paymentDesc: "保存済みカード: **** 4242",
    paymentNext: "次回請求: 2025-12-31",
    paymentEdit: "支払い方法を更新",
    notify: "通知",
    notifyDesc: "Webプッシュ、メール、アプリを管理。",
    notifyCta: "アラートへ"
  },
  upgrade: {
    title: "Proにアップグレード",
    desc: "月額サブスクリプションで高度データを利用。",
    planTitle: "Pro特典",
    features: {
      item1: "全シンボルのリアルタイム更新",
      item2: "即時プッシュの無制限アラート",
      item3: "AIレポートのフルアクセス",
      item4: "広告なし＆高度指標"
    },
    price: "₩29,000 / 月",
    priceNote: "VAT込み · いつでも解約可能",
    payTitle: "支払い情報",
    cta: "月額サブスクを開始",
    active: "Proはすでに有効です。",
    statusActivated: "Proが有効になりました。アカウントで確認してください。",
    statusPending: "決済は準備中です。利用可能になり次第お知らせします。",
    cardNumber: "カード番号",
    cardNumberPlaceholder: "1234 5678 9012 3456",
    cardExpiry: "有効期限",
    cardExpiryPlaceholder: "MM/YY",
    cvc: "CVC",
    cvcPlaceholder: "123"
  },
  payment: {
    amountLabel: "チャージ金額",
    amountPlaceholder: "例: 300000",
    methodLabel: "支払い方法",
    methods: {
      card: "クレジットカード",
      bank: "銀行振込",
      crypto: "暗号資産ウォレット"
    },
    cardNumber: "カード番号",
    cardNumberPlaceholder: "1234 5678 9012 3456",
    cardExpiry: "有効期限",
    cardExpiryPlaceholder: "MM/YY",
    bankAccount: "入金口座",
    bankAccountPlaceholder: "KB 123-456-789012",
    walletAddress: "ウォレットアドレス",
    walletAddressPlaceholder: "0x....",
    memoLabel: "メモ（任意）",
    memoPlaceholder: "特記事項があれば入力。",
    submit: "支払い申請を送信",
    statusSubmitted: "支払い申請を送信しました。承認状況をご確認ください。",
    summaryTitle: "支払い概要",
    summary: {
      amount: "金額",
      method: "方法",
      fee: "推定手数料(1.5%)",
      total: "合計",
      note: "実際の連携ではカード認証や入金確認が入ります。"
    }
  },
  education: {
    title: "教育",
    desc: "判断を支えるステップガイド。",
    more: "詳細を見る",
    newsletter: "購読",
    notice: "準備中のコンテンツが近日公開。ニュースレターに登録してください。",
    levels: {
      beginner: "初級",
      intermediate: "中級"
    },
    lessons: {
      lesson1: {
        title: "市場の基礎を読む",
        summary: "価格・出来高・変動率でトレンド把握"
      },
      lesson2: {
        title: "リスク管理戦略",
        summary: "ポジションサイズと損切/利確計画"
      },
      lesson3: {
        title: "チャート攻略",
        summary: "ローソク足と重要な支持・抵抗帯を分析"
      }
    }
  },
  legal: {
    privacyTitle: "プライバシーポリシー",
    privacyDesc: "CoinDashはユーザーのプライバシーを重視します。",
    privacyItems: {
      item1: "1. メールとログイン情報はサービス提供のためにのみ処理されます。",
      item2: "2. 支払い情報は承認・保存時に暗号化されます。",
      item3: "3. ユーザーはいつでも個人情報の閲覧・修正を申請できます。",
      item4: "4. 詳細はサポートへお問い合わせください。"
    },
    termsTitle: "利用規約",
    termsDesc: "本規約は基本的なサービス利用を定めます。",
    termsItems: {
      item1: "1. 会員はリアルタイムデータを判断の参考として利用します。",
      item2: "2. 当サービスは市場データ提供に注力し、損益に責任を負いません。",
      item3: "3. 決済およびKYC機能は別途案内します。",
      item4: "4. 詳細な規約はサポートへお問い合わせください。"
    }
  },
  footer: {
    company: "CoinDash Labs",
    policy: "ポリシー",
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    subscription: "サブスクリプション",
    businessNumber: "事業者番号: 123-45-67890",
    ceo: "代表者: Hong Gil-dong",
    address: "ソウル特別市 江南区 テヘラン路 123",
    email: "メール: support@coindash.com",
    copyright: "© 2025 CoinDash Labs. All rights reserved."
  }
};

export default ja;
