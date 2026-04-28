(async () => {
  const fs = require("fs");

  const [eriadata, yaguradata, hokodata, asaridata,
    eria_new, yagura_new, hoko_new, asari_new
  ] = await Promise.all([
    fetch("data/eria.json").then(res => res.json()),
    fetch("data/yagura.json").then(res => res.json()),
    fetch("data/hoko.json").then(res => res.json()),
    fetch("data/asari.json").then(res => res.json()),
    fetch('https://splatoon3.ink/data/xrank/xrank.detail.p-15.splatzones.json').then(res => res.json()),
    fetch('https://splatoon3.ink/data/xrank/xrank.detail.p-15.towercontrol.json').then(res => res.json()),
    fetch('https://splatoon3.ink/data/xrank/xrank.detail.p-15.rainmaker.json').then(res => res.json()),
    fetch('https://splatoon3.ink/data/xrank/xrank.detail.p-15.clamblitz.json').then(res => res.json())
  ]);
  const weaponNameMap = {
    "Splattershot": "スプラシューター",
    "Tentatek Splattershot": "スプラシューターコラボ",
    "Hero Shot Replica": "ヒーローシューターレプリカ",
    "Splattershot Jr.": "わかばシューター",
    "Custom Splattershot Jr.": "もみじシューター",
    "Sploosh-o-matic": "ボールドマーカー",
    "Neo Sploosh-o-matic": "ボールドマーカーネオ",
    "Splash-o-matic": "シャープマーカー",
    "Neo Splash-o-matic": "シャープマーカーネオ",
    "Aerospray MG": "プロモデラーMG",
    "Aerospray RG": "プロモデラーRG",
    "N-ZAP '85": "N-ZAP85",
    "N-ZAP '89": "N-ZAP89",
    ".52 Gal": ".52ガロン",
    ".52 Gal Deco": ".52ガロンデコ",
    ".96 Gal": ".96ガロン",
    ".96 Gal Deco": ".96ガロンデコ",
    "Splattershot Pro": "プライムシューター",
    "Forge Splattershot Pro": "プライムシューターコラボ",
    "Splattershot Nova": "スペースシューター",
    "Annaki Splattershot Nova": "スペースシューターコラボ",
    "Jet Squelcher": "ジェットスイーパー",
    "Custom Jet Squelcher": "ジェットスイーパーカスタム",
    "L-3 Nozzlenose": "L3リールガン",
    "L-3 Nozzlenose D": "L3リールガンD",
    "H-3 Nozzlenose": "H3リールガン",
    "H-3 Nozzlenose D": "H3リールガンD",
    "Squeezer": "ボトルガイザー",
    "Foil Squeezer": "ボトルガイザーフォイル",
    "Carbon Roller": "カーボンローラー",
    "Carbon Roller Deco": "カーボンローラーデコ",
    "Splat Roller": "スプラローラー",
    "Krak-On Splat Roller": "スプラローラーコラボ",
    "Flingza Roller": "ヴァリアブルローラー",
    "Foil Flingza Roller": "ヴァリアブルローラーフォイル",
    "Dynamo Roller": "ダイナモローラー",
    "Gold Dynamo Roller": "ダイナモローラーテスラ",
    "Big Swig Roller": "ワイドローラー",
    "Big Swig Roller Express": "ワイドローラーコラボ",
    "Classic Squiffer": "スクイックリンα",
    "New Squiffer": "スクイックリンβ",
    "Splat Charger": "スプラチャージャー",
    "Z+F Splat Charger": "スプラチャージャーコラボ",
    "Splatterscope": "スプラスコープ",
    "Z+F Splatterscope": "スプラスコープコラボ",
    "E-liter 4K": "リッター4K",
    "E-liter 4K Scope": "4Kスコープ",
    "Custom E-liter 4K": "リッター4Kカスタム",
    "Custom E-liter 4K Scope": "4Kスコープカスタム",
    "Bamboozler 14 Mk I": "14式竹筒銃・甲",
    "Bamboozler 14 Mk II": "14式竹筒銃・乙",
    "Goo Tuber": "ソイチューバー",
    "Custom Goo Tuber": "ソイチューバーカスタム",
    "Snipewriter 5H": "R-PEN/5H",
    "Snipewriter 5B": "R-PEN/5B",
    "Slosher": "バケットスロッシャー",
    "Slosher Deco": "バケットスロッシャーデコ",
    "Tri-Slosher": "ヒッセン",
    "Tri-Slosher Nouveau": "ヒッセン・ヒュー",
    "Sloshing Machine": "スクリュースロッシャー",
    "Sloshing Machine Neo": "スクリュースロッシャーネオ",
    "Bloblobber": "オーバーフロッシャー",
    "Bloblobber Deco": "オーバーフロッシャーデコ",
    "Explosher": "エクスプロッシャー",
    "Custom Explosher": "エクスプロッシャーカスタム",
    "Dread Wringer": "モップリン",
    "Dread Wringer D": "モップリンD",
    "Mini Splatling": "スプラスピナー",
    "Zink Mini Splatling": "スプラスピナーコラボ",
    "Heavy Splatling": "バレルスピナー",
    "Heavy Splatling Deco": "バレルスピナーデコ",
    "Nautilus 47": "ノーチラス47",
    "Nautilus 79": "ノーチラス79",
    "Ballpoint Splatling": "クーゲルシュライバー",
    "Ballpoint Splatling Nouveau": "クーゲルシュライバー・ヒュー",
    "Hydra Splatling": "ハイドラント",
    "Custom Hydra Splatling": "ハイドラントカスタム",
    "Heavy Edit Splatling": "イグザミナー",
    "Heavy Edit Splatling Nouveau": "イグザミナー・ヒュー",
    "Dapple Dualies": "スパッタリー",
    "Dapple Dualies Nouveau": "スパッタリー・ヒュー",
    "Splat Dualies": "スプラマニューバー",
    "Enperry Splat Dualies": "スプラマニューバーコラボ",
    "Glooga Dualies": "ケルビン525",
    "Glooga Dualies Deco": "ケルビン525デコ",
    "Dualie Squelchers": "デュアルスイーパー",
    "Custom Dualie Squelchers": "デュアルスイーパーカスタム",
    "Dark Tetra Dualies": "クアッドホッパーブラック",
    "Light Tetra Dualies": "クアッドホッパーホワイト",
    "Douser Dualies FF": "ガエンFF",
    "Custom Douser Dualies FF": "ガエンFFカスタム",
    "Splat Brella": "パラシェルター",
    "Sorella Brella": "パラシェルターソレーラ",
    "Tenta Brella": "キャンピングシェルター",
    "Tenta Sorella Brella": "キャンピングシェルターソレーラ",
    "Undercover Brella": "スパイガジェット",
    "Undercover Sorella Brella": "スパイガジェットソレーラ",
    "Recycled Brella 24 Mk I": "24式張替傘・甲",
    "Recycled Brella 24 Mk II": "24式張替傘・乙",
    "Luna Blaster": "ノヴァブラスター",
    "Luna Blaster Neo": "ノヴァブラスターネオ",
    "Blaster": "ホットブラスター",
    "Custom Blaster": "ホットブラスターカスタム",
    "Range Blaster": "ロングブラスター",
    "Custom Range Blaster": "ロングブラスターカスタム",
    "Clash Blaster": "クラッシュブラスター",
    "Clash Blaster Neo": "クラッシュブラスターネオ",
    "Rapid Blaster": "ラピッドブラスター",
    "Rapid Blaster Deco": "ラピッドブラスターデコ",
    "Rapid Blaster Pro": "Rブラスターエリート",
    "Rapid Blaster Pro Deco": "Rブラスターエリートデコ",
    "S-BLAST '92": "S-BLAST92",
    "S-BLAST '91": "S-BLAST91",
    "Inkbrush": "パブロ",
    "Inkbrush Nouveau": "パブロ・ヒュー",
    "Octobrush": "ホクサイ",
    "Octobrush Nouveau": "ホクサイ・ヒュー",
    "Painbrush": "フィンセント",
    "Painbrush Nouveau": "フィンセント・ヒュー",
    "Tri-Stringer": "トライストリンガー",
    "Inkline Tri-Stringer": "トライストリンガーコラボ",
    "REEF-LUX 450": "LACT-450",
    "REEF-LUX 450 Deco": "LACT-450デコ",
    "Wellstring V": "フルイドⅤ",
    "Custom Wellstring V": "フルイドⅤカスタム",
    "Splatana Wiper": "ドライブワイパー",
    "Splatana Wiper Deco": "ドライブワイパーデコ",
    "Splatana Stamper": "ジムワイパー",
    "Splatana Stamper Nouveau": "ジムワイパー・ヒュー",
    "Mint Decavitator": "デンタルワイパーミント",
    "Charcoal Decavitator": "デンタルワイパースミ",
    "Order Shot Replica": "オーダーシューターレプリカ",
    "Order Roller Replica": "オーダーローラーレプリカ",
    "Order Slosher Replica": "オーダースロッシャーレプリカ",
    "Order Stringer Replica": "オーダーストリンガーレプリカ",
    "Order Dualie Replicas": "オーダーマニューバーレプリカ",
    "Order Splatana Replica": "オーダーワイパーレプリカ",
    "Orderbrush Replica": "オーダーブラシレプリカ",
    "Octo Shot Replica": "オクタシューターレプリカ",
    "Order Splatling Replica": "オーダースピナーレプリカ",
    "Order Blaster Replica": "オーダーブラスターレプリカ",
    "Order Charger Replica": "オーダーチャージャーレプリカ",
    "Order Brella Replica": "オーダーシェルターレプリカ",
    "Splash-o-matic GCK-O": "シャープマーカーGECK",
    "Splattershot Pro FRZ-N": "プライムシューターFRZN",
    "Jet Squelcher COB-R": "ジェットスイーパーCOBR",
    "H-3 Nozzlenose VIP-R": "H3リールガンSNAK",
    "Rapid Blaster Pro WNT-R": "RブラスターエリートWNTR",
    "Carbon Roller ANG-L": "カーボンローラーANGL",
    "Painbrush BRN-Z": "フィンセントBRNZ",
    "Splat Charger CAM-O": "スプラチャージャーFRST",
    "Splatterscope CAM-O": "スプラスコープFRST",
    "Tri-Slosher ASH-N": "ヒッセンASH",
    "Mini Splatling RTL-R": "スプラスピナーPYTN",
    "Dapple Dualies NOC-T": "スパッタリーOWL",
    "Tenta Brella CRE-M": "キャンピングシェルターCREM",
    "REEF-LUX 450 MIL-K": "LACT-450MILK",
    "Splatana Wiper RUS-T": "ドライブワイパーRUST",
    "Colorz Aerospray": "プロモデラー彩",
    "Glamorz Splattershot": "スプラシューター煌",
    "Clawz .96 Gal": ".96ガロン爪",
    "Glitterz L-3 Nozzlenose": "L3リールガン箔",
    "Gleamz Blaster": "ホットブラスター艶",
    "Starz Dynamo Roller": "ダイナモローラー冥",
    "Planetz Big Swig Roller": "ワイドローラー惑",
    "Cometz Octobrush": "ホクサイ彗",
    "Hornz Dread Wringer": "モップリン角",
    "Torrentz Hydra Splatling": "ハイドラント圧",
    "Twinklez Splat Dualies": "スプラマニューバー耀",
    "Hoofz Dualie Squelchers": "デュアルスイーパー蹄",
    "Patternz Undercover Brella": "スパイガジェット繚",
    "Bulbz Tri-Stringer": "トライストリンガー燈",
    "Stickerz Splatana Stamper": "ジムワイパー封"
  };
  const eria = eria_new.data.node.xRankingAr.edges.map(edge => {
    return {
      weapon: weaponNameMap[edge.node.weapon.name] || edge.node.weapon.name,
      name: edge.node.name,
      power: edge.node.xPower,
      season: 15
    };
  });
  const hoko = hoko_new.data.node.xRankingGl.edges.map(edge => {
    return {
      weapon: weaponNameMap[edge.node.weapon.name] || edge.node.weapon.name,
      name: edge.node.name,
      power: edge.node.xPower,
      season: 15
    };
  });
  const yagura = yagura_new.data.node.xRankingLf.edges.map(edge => {
    return {
      weapon: weaponNameMap[edge.node.weapon.name] || edge.node.weapon.name,
      name: edge.node.name,
      power: edge.node.xPower,
      season: 15
    };
  });

  const asari = asari_new.data.node.xRankingCl.edges.map(edge => {
    return {
      weapon: weaponNameMap[edge.node.weapon.name] || edge.node.weapon.name,
      name: edge.node.name,
      power: edge.node.xPower,
      season: 15
    };
  });

  // 下500件を置き換え
  const updated_e = [
    ...eriadata,
    ...eria
  ];
  const updated_y = [
    ...yaguradata,
    ...yagura
  ];
  const updated_h = [
    ...hokodata,
    ...hoko
  ];
  const updated_a = [
    ...asaridata,
    ...asari
  ];

  // 書き込み（整形つき）
  fs.writeFileSync("data/eria.json", JSON.stringify(updated_e, null, 2), "utf-8");
  fs.writeFileSync("data/yagura.json", JSON.stringify(updated_y, null, 2), "utf-8");
  fs.writeFileSync("data/hoko.json", JSON.stringify(updated_h, null, 2), "utf-8");
  fs.writeFileSync("data/asari.json", JSON.stringify(updated_a, null, 2), "utf-8");
})();
