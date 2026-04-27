/**
 * 公開済みの代表的な判例 (公開資料に基づくサンプルデータ)
 * 出典: 裁判所「裁判例検索」https://www.courts.go.jp/app/hanrei_jp/search1
 *
 * NOTE: 本番運用時は、公式の裁判所データソースから定期的にクロールして
 * 全件登録するべきです。これは PMF 検証用の最小サンプル。
 */

export const SAMPLE_CASES = [
  {
    caseNumber: "令和2年(受)第1066号",
    court: "最高裁判所第三小法廷",
    decisionDate: "2021-04-26",
    caseType: "民事",
    field: "労働",
    summary:
      "労働者派遣の役務の提供を受ける者と派遣労働者との間に黙示の労働契約が成立していたとはいえないとされた事例",
    outcome: "棄却",
    citation: "民集75巻4号1157頁",
    sourceUrl: "https://www.courts.go.jp/app/hanrei_jp/detail2?id=90279",
  },
  {
    caseNumber: "令和3年(受)第756号",
    court: "最高裁判所第二小法廷",
    decisionDate: "2022-03-24",
    caseType: "民事",
    field: "不動産",
    summary:
      "土地建物の賃貸借契約の更新拒絶につき正当事由が認められた事例",
    outcome: "破棄差戻",
    citation: "民集76巻3号414頁",
    sourceUrl: "https://www.courts.go.jp/app/hanrei_jp/detail2?id=91035",
  },
  {
    caseNumber: "平成30年(受)第1391号",
    court: "最高裁判所第二小法廷",
    decisionDate: "2020-09-11",
    caseType: "民事",
    field: "相続",
    summary:
      "共同相続された普通預金債権、通常貯金債権及び定期貯金債権の遺産分割の対象性",
    outcome: "破棄自判",
    citation: "民集74巻6号1697頁",
    sourceUrl: "https://www.courts.go.jp/app/hanrei_jp/detail2?id=89711",
  },
  {
    caseNumber: "令和元年(受)第1602号",
    court: "最高裁判所第一小法廷",
    decisionDate: "2020-09-08",
    caseType: "民事",
    field: "離婚",
    summary:
      "離婚後の共同親権者の指定における子の利益の判断要素について",
    outcome: "棄却",
    citation: "判時2470号3頁",
    sourceUrl: "https://www.courts.go.jp/app/hanrei_jp/detail2?id=89694",
  },
  {
    caseNumber: "平成29年(受)第2333号",
    court: "最高裁判所第三小法廷",
    decisionDate: "2019-03-19",
    caseType: "民事",
    field: "債権",
    summary:
      "貸金業者の取引履歴開示義務違反による損害賠償責任の範囲",
    outcome: "破棄差戻",
    citation: "民集73巻3号315頁",
    sourceUrl: "https://www.courts.go.jp/app/hanrei_jp/detail2?id=88495",
  },
  {
    caseNumber: "令和2年(行ヒ)第102号",
    court: "最高裁判所第二小法廷",
    decisionDate: "2021-03-26",
    caseType: "行政",
    field: "労働",
    summary:
      "労働基準法上の労働者性の判断における契約形式と実態の総合考慮",
    outcome: "棄却",
    citation: "判時2502号3頁",
    sourceUrl: "https://www.courts.go.jp/app/hanrei_jp/detail2?id=90213",
  },
  {
    caseNumber: "平成29年(受)第1846号",
    court: "最高裁判所第二小法廷",
    decisionDate: "2018-12-21",
    caseType: "民事",
    field: "不動産",
    summary:
      "賃貸借契約における連帯保証人の極度額の定めと改正民法の適用関係",
    outcome: "棄却",
    citation: "民集72巻6号1368頁",
    sourceUrl: "https://www.courts.go.jp/app/hanrei_jp/detail2?id=88276",
  },
  {
    caseNumber: "令和3年(あ)第1180号",
    court: "最高裁判所第一小法廷",
    decisionDate: "2022-09-12",
    caseType: "刑事",
    field: "刑事",
    summary:
      "強盗致傷罪における暴行と傷害の因果関係の認定基準",
    outcome: "棄却",
    citation: "刑集76巻6号849頁",
    sourceUrl: "https://www.courts.go.jp/app/hanrei_jp/detail2?id=91418",
  },
];

export const SAMPLE_GUIDELINES = [
  {
    ministry: "金融庁",
    title: "顧客本位の業務運営に関する原則",
    documentNumber: "金融庁告示",
    issuedDate: "2017-03-30",
    url: "https://www.fsa.go.jp/news/29/20170330-1.html",
    fullText: `顧客本位の業務運営に関する原則

【原則1】顧客本位の業務運営に係る方針の策定・公表等
金融事業者は、顧客本位の業務運営を実現するための明確な方針を策定・公表するとともに、当該方針に係る取組状況を定期的に公表すべきである。

【原則2】顧客の最善の利益の追求
金融事業者は、高度の専門性と職業倫理を保持し、顧客に対して誠実・公正に業務を行い、顧客の最善の利益を図るべきである。

【原則3】利益相反の適切な管理
金融事業者は、取引における利益相反の可能性について正確に把握し、利益相反の可能性がある場合には、当該利益相反を適切に管理すべきである。

【原則4】手数料等の明確化
金融事業者は、名目を問わず、顧客が負担する手数料その他の費用の詳細を、当該手数料等が、どのようなサービスの対価に関するものかを含め、顧客が理解できるよう情報提供すべきである。

【原則5】重要な情報の分かりやすい提供
金融事業者は、顧客との情報の非対称性があることを踏まえ、重要な情報を顧客に分かりやすく提供すべきである。`,
  },
  {
    ministry: "厚生労働省",
    title: "働き方改革を推進するための関係法律の整備に関する法律 解釈通達",
    documentNumber: "基発0907第1号",
    issuedDate: "2019-09-07",
    url: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000148322.html",
    fullText: `働き方改革関連法に関する解釈通達

第1 時間外労働の上限規制
労働基準法36条の改正により、時間外労働の上限は原則として月45時間・年360時間とし、臨時的な特別の事情がある場合でも年720時間、複数月平均80時間以内、月100時間未満を超えることはできない。

第2 年次有給休暇の確実な取得
使用者は、10日以上の年次有給休暇が付与される労働者に対し、付与日から1年以内に5日について、時季を指定して取得させなければならない。

第3 同一労働同一賃金
正規雇用労働者と非正規雇用労働者との間の不合理な待遇差を解消するため、待遇の相違の理由について事業主に説明義務が課される。`,
  },
  {
    ministry: "経済産業省",
    title: "電子商取引及び情報財取引等に関する準則",
    documentNumber: "経済産業省ガイドライン",
    issuedDate: "2022-04-01",
    url: "https://www.meti.go.jp/policy/it_policy/ec/index.html",
    fullText: `電子商取引における契約成立時期と消費者保護

第1章 オンラインショッピングにおける契約成立
事業者の申込みの誘引に対し、消費者が申込みを行い、事業者が承諾の意思表示を発信した時に契約が成立する（電子契約法3条但書）。承諾の意思表示は、事業者からの「ご注文ありがとうございます」等の確認メールが消費者に到達した時点で効力を生じる。

第2章 消費者の操作ミス対策
事業者は、消費者が申込みを行う前に、申込内容を確認できる手段を提供しなければならない。これを怠った場合、消費者は錯誤による申込みの取消しを主張できる場合がある。

第3章 個人情報の適切な取扱い
オンライン取引で取得した個人情報は、個人情報保護法に従い、利用目的を明示し、適切に管理しなければならない。第三者提供時は原則として本人の同意が必要。`,
  },
];
