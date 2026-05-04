const CurrentSeason = 15

const isMobile = (window.innerWidth <= 768) ? true : false;

if (isMobile) {
  const rcg = document.querySelector("#rankingTable colgroup");
  rcg.innerHTML = `
    <col style="width: 10%">
    <col style="width: 15%">
    <col style="width: 50%">
    <col style="width: 10%">
    <col style="width: 15%">
  `
};

function showPage(page) {
  // ページ切り替え
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page).classList.add('active');

  // ボタンの状態切り替え
  document.querySelectorAll('header button').forEach(btn => {
    btn.classList.remove('active-btn');
  });

  document.querySelector(`button[onclick="showPage('${page}')"]`)
    .classList.add('active-btn');
}

const buttons = document.querySelectorAll("#chart-controls button");

buttons.forEach(btn => {
  btn.addEventListener("click", () => {

    // 全部からactiveを外す
    buttons.forEach(b => b.classList.remove("active"));

    // 押したやつに付ける
    btn.classList.add("active");

  });
  btn.addEventListener("click", () => {
    createChart(btn.dataset.mode);
  });
});

const buttons_ = document.querySelectorAll("#weapon-controls button");

buttons_.forEach(btn => {
  btn.addEventListener("click", () => {

    // 全部からactiveを外す
    buttons_.forEach(b => b.classList.remove("active"));

    // 押したやつに付ける
    btn.classList.add("active");

    createList(btn.dataset.mode);
  });
});

function getSeason(num) {
  const seasons = {
    2: "2022冬",
    3: "2023春",
    4: "2023夏",
    5: "2023秋",
    6: "2023冬",
    7: "2024春",
    8: "2024夏",
    9: "2024秋",
    10: "2024冬",
    11: "2025春",
    12: "2025夏",
    13: "2025秋",
    14: "2025冬",
    15: "2026春"
  };

  return seasons[num] || "不明";
}

function countByWeapon(data, season, options = {}) {
  const result = {};
  const r_f = document.getElementById("ranking_filter").value;
  if (season == "all") {
    let count = {};
    data.forEach(item => {
      if (count[item.season]>=r_f) return;
      const w = normalizeWeapon(item.weapon, options);
      result[w] = (result[w] || 0) + 1;
      count[item.season] = (count[item.season] || 0) + 1;
    });
  } else {
    let i = 0
    data.forEach(item => {
      if (item.season !== season) return;
      if (i>=r_f) return;
      const w = normalizeWeapon(item.weapon, options);
      result[w] = (result[w] || 0) + 1;
      i++
    });   
  };
  return result;
}

function countBySeason(modeData, season, targets) {
  return modeData.filter(d =>
    d.season === season && targets.includes(normalizeWeapon(d.weapon,{merge:true}))
  ).length;
}

function countWeaponsDetail(data, weapons, season) {
  const result = {};

  weapons.forEach(w => result[w] = 0);

  if (season == "all") {
    data.forEach(item => {
      const w = normalizeWeapon(item.weapon,{merge:true})
      if (weapons.includes(w)) {
        result[w]++;
      }
    });
  } else {
    data.forEach(item => {
      const w = normalizeWeapon(item.weapon,{merge:true})
      if (item.season === season && weapons.includes(w)) {
        result[w]++;
      }
    });
  }

  return result;
}

let weapons, weaponMaster;
let aliasMap = {}, mainMap = {}, subMap = {}, specialMap = {}, categoryMap = {}, rangeMap = {};

fetch("data/weapons.json")
  .then(response => response.json())
  .then(data => {
    weapons = data;
  })
  .catch(err => {
    console.error("JSON読み込み失敗", err);
  });

fetch("data/weapondata.json")
  .then(response => response.json())
  .then(data_ => {
    weaponMaster = data_;
    Object.entries(weaponMaster).forEach(([main, data]) => {
      aliasMap[main] = data.alias;
      mainMap[main] = data.main;
      subMap[main] = data.sub;
      specialMap[main] = data.special;
      categoryMap[main] = data.category;
      rangeMap[main] = data.range;
    });
  }).catch(err => {
    console.error("JSON読み込み失敗", err);
  });

function normalizeWeapon(weapon, options) {
  let w = weapon;

  if (options.merge) {
    w = aliasMap[w] || w;
  }

  if (options.main) {
    w = mainMap[w] || w;
  }

  if (options.sub) {
    w = subMap[w] || w;
  }
  
  if (options.special) {
    w = specialMap[w] || w;
  }

  if (options.category) {
    w = categoryMap[w] || w;
  }

  if (options.range) {
    w = rangeMap[w] || w;
  }

  return w;
}

let normalizeMap;
fetch("data/normalizeurl.json")
  .then(response => response.json())
  .then(data => {
    normalizeMap = data;
  })

function normalizeUrl(n) {
  return normalizeMap[n] ?? n;
}

let truenameMap;
fetch("data/truename.json")
  .then(response => response.json())
  .then(data => {
    truenameMap = data;
  })

function trueName(n,m=false) {
  if (m) return truenameMap[n] ?? n;
  const map = Object.fromEntries(Object.entries(truenameMap).slice(0, 7))
  return map[n] ?? n;
}

let colorMap;

fetch("data/colors.json")
  .then(response => response.json())
  .then(data => {
    colorMap = data;
  })

function mixColors(color1, color2, ratio = 0.5) {
  // #RRGGBB → 数値に変換
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  // RGBに分解
  const r1 = (c1 >> 16) & 255;
  const g1 = (c1 >> 8) & 255;
  const b1 = c1 & 255;

  const r2 = (c2 >> 16) & 255;
  const g2 = (c2 >> 8) & 255;
  const b2 = c2 & 255;

  // 混ぜる（ratio = 0〜1）
  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

  // 16進に戻す
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1);
}

function smartFix(n1,n2) {
  if (n2 == 1) return n1
  else if (n2 == 2 || n2 == 5 || n2 == 10) return n1.toFixed(1)
  else return n1.toFixed(2)
}

const iconPlugin = {
  id: "iconPlugin",
  afterDraw(chart) {
    const { ctx, scales } = chart;
    const yScale = scales.y;

    chart.data.labels.forEach((label, i) => {
      const y = yScale.getPixelForValue(i);
      const img = new Image();
      img.src = "assets/" + normalizeUrl(label) + ".png"

      if (img && img.complete) {
        ctx.drawImage(img, 10, y - 12, 24, 24);
      }
    });
  }
};
const modes = {
  total: { label: "全体", index: 6 },
  eria:  { label: "エリア", index: 2 },
  yagura:{ label: "ヤグラ", index: 3 },
  hoko:  { label: "ホコ", index: 4 },
  asari: { label: "アサリ", index: 5 }
};

function getTop10Data(rows, colIndex) {
  return Array.from(rows)
    .map(row => {
      return [
        row.children[1].textContent,
        Number(row.children[colIndex].textContent)
      ];
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}

function getData(rows, colIndex) {
  return Array.from(rows)
    .map(row => {
      return [
        row.children[1].textContent,
        Number(row.children[colIndex].textContent)
      ];
    })
    .sort((a, b) => b[1] - a[1])
}

function getMainData(rows) {
  const totals = {};

  Array.from(rows).forEach(row => {
    const name = row.children[1].textContent;
    const value = Number(row.children[6].textContent);

    const category = mainMap[name] || 'その他';

    if (!totals[category]) {
      totals[category] = 0;
    }
    totals[category] += value;
  });

  return Object.entries(totals)
    .map(([key, value]) => [key, value])
    .sort((a, b) => b[1] - a[1]);
}

let myChart = null;

function createChart(title) {
  const weapon = document.getElementById("weapon_").value;
  const rows = document.querySelectorAll("#statsTable tbody tr");
  const ctx = document.getElementById("mainChart");
  const container = document.getElementById("chart-container");

  const mode = modes[title];

  if (myChart) {
    myChart.destroy();
  }

  if (weapon == "w_cate" || weapon == "w_rang") {
    ctx.removeAttribute("height")
    container.style.height = isMobile ? "350px" : "600px";
    const d = getData(rows, mode.index);
    const labels = d.map(e => e[0]);
    const values = d.map(e => e[1]);

    const backgroundColors = labels.map(label => colorMap[label] || "#cccccc");
    myChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: backgroundColors
        }],
      },
      options: {
        responsive: true,
        plugins: {
          datalabels: {
            formatter: (value, context) => {
              let sum = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              let percentage = (value / sum * 100)
              if (percentage < 5) return null;
              return context.chart.data.labels[context.dataIndex] + "\n "+ percentage.toFixed(1) + "%";
            },
            color: "#fff",
            textAlign: "center",
            anchor: 'center',
            align: 'end',
            offset: 2.5
          },
          legend: {
            display: !isMobile,
            position: 'right'
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  } else {
    container.style.height = "";
    let data, t;
    if (weapon == "sub" || weapon == "special") {
      if (isMobile) {
        weapon == "sub" ? ctx.height = 450 : ctx.height = 530;
      } else {
        weapon == "sub" ? ctx.height = 200 : ctx.height = 250;
      };
      data = getData(rows, mode.index);
      t = mode.label + " ランキング"
    }
    else {
      ctx.removeAttribute("height")
      if (isMobile) ctx.height = 350
      data = getTop10Data(rows, mode.index);
      t =  mode.label + " TOP10"
    }


    const labels = data.map(e => e[0]);
    const values = data.map(e => e[1]);
    myChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          data: values
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        scales: {
          y: {
            ticks: {
              display: false // ←文字ラベル消す
            }
          }
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: t
          }
        }
      },
      plugins: [iconPlugin]
    });   
  }
}

let myChart2 = null, myChart3 = null;

function lineChart(b) {
  const container = document.getElementById("chart-container2");
  const container2 = document.getElementById("chart-container3");
  container.style.height = "";
  container2.style.height = 0;
  const labels = ["2022冬", "2023春", "2023夏", "2023秋", "2023冬", "2024春", "2024夏", 
    "2024秋", "2024冬", "2025春", "2025夏", "2025秋", "2025冬", "2026春"]
  const title = b ? "人数" : "割合"
  const ctx = document.getElementById('mainChart2');
  const rows = document.querySelectorAll("#analysisTable tbody tr");
  const data = Array.from(rows)
    .map(row => {
      return Number(row.children[5].textContent);
    })
  if (myChart2) {
    myChart2.destroy();
  }
  if (myChart3) {
    myChart3.destroy();
  }
  myChart2 = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: data,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true
    }
  });
}

function pieChart() {
  const container = document.getElementById("chart-container2");
  const container2 = document.getElementById("chart-container3");
  if (isMobile) {
    container.style.height = "350px";
    container2.style.height = "350px";
  } else {
    container.style.height = "750px";
    container2.style.height = "750px";
  }
  const ctx = document.getElementById('mainChart2');
  const ctx2 = document.getElementById('mainChart3');
  const rows = document.querySelectorAll("#analysisTable tbody tr");
  if (myChart2) {
    myChart2.destroy();
  }
  if (myChart3) {
    myChart3.destroy();
  }
  const d = getData(rows, 6);
  const main_d = getMainData(rows)
  const labels = d.map(e => e[0]);
  const values = d.map(e => e[1]);
  const main_labels = main_d.map(e => e[0]);
  const main_values = main_d.map(e => e[1]);
  const backgroundColors = labels.map(label => colorMap[label] || "#cccccc");
  const main_backgroundColors = main_labels.map(label => colorMap[label] || "#cccccc");
  myChart2 = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: backgroundColors
      }],
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          formatter: (value, context) => {
            let sum = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            let percentage = (value / sum * 100)
            if (percentage < 5) return null;
            return context.chart.data.labels[context.dataIndex] + "\n "+ percentage.toFixed(1) + "%";
          },
          color: "#fff",
          textAlign: "center",
          anchor: 'center',
          align: 'end',
          offset: 2.5
        },
        legend: {
          display: !isMobile,
          position: 'right',
          labels: {
            generateLabels(chart) {
              const original = Chart.overrides.pie.plugins.legend.labels.generateLabels;
              const labels = original(chart);

              return labels.slice(0, 20); // ←ここで制限
            }
          }
        },
        title: {
          display: true,
          text: "割合(ブキ別)"
        }
      }
    },
    plugins: [ChartDataLabels]
  });
  myChart3 = new Chart(ctx2, {
    type: "pie",
    data: {
      labels: main_labels,
      datasets: [{
        data: main_values,
        backgroundColor: main_backgroundColors
      }],
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          formatter: (value, context) => {
            let sum = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            let percentage = (value / sum * 100)
            if (percentage < 5) return null;
            return context.chart.data.labels[context.dataIndex] + "\n "+ percentage.toFixed(1) + "%";
          },
          color: "#fff",
          textAlign: "center",
          anchor: 'center',
          align: 'end',
          offset: 2.5
        },
        legend: {
          display: !isMobile,
          position: 'right'
        },
        title: {
          display: true,
          text: "割合(メイン別)"
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function createList(w) {
  const container = document.getElementById("buttons-container");
  container.innerHTML = "";
  selectedSet.clear();
  render()
  if (w == "category" || w == "range") {
    const tag_container = document.createElement("div");
    tag_container.id = "tag-container"
    let btn;
    if (w=="category") {
      btn =  `
        <button class="tag-btn tag1">シューター</button>
        <button class="tag-btn tag2">ローラー</button>
        <button class="tag-btn tag3">チャージャー</button>
        <button class="tag-btn tag4">ブラスター</button>
        <button class="tag-btn tag5">スロッシャー</button>
        <button class="tag-btn tag6">スピナー</button>
        <button class="tag-btn tag7">フデ</button>
        <button class="tag-btn tag8">マニューバー</button>
        <button class="tag-btn tag9">シェルター</button>
        <button class="tag-btn tag10">ストリンガー</button>
        <button class="tag-btn tag11">ワイパー</button>
      `
    } else {
      btn =  `
        <button class="tag-btn tag12">短射程</button>
        <button class="tag-btn tag13">中射程</button>
        <button class="tag-btn tag14">長射程</button>
        <button class="tag-btn tag15">中チャー</button>
        <button class="tag-btn tag16">長チャー</button>
      `
    }
    tag_container.innerHTML = btn;
    const buttons = tag_container.querySelectorAll(".tag-btn");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        selectedSet.clear();
        let n = btn.textContent;
        addTag(n);
      });
    });
    container.appendChild(tag_container)
  } else {
    const gird_container = document.createElement("div");
    gird_container.id = "grid-container"
    const icons = [];
    let wp;
    if (w == "set") wp = weapons.slice(0, 160)
    else if (w == "main") wp = weapons.slice(206, 271)
    else if (w == "sub") wp = weapons.slice(173, 187)
    else if (w == "special") wp = weapons.slice(187, 206);
    wp.forEach((w) => {
      icons.push(`${normalizeUrl(w)}.png`);
    });
    // DOMに追加
    icons.forEach((fileName, i) => {
      const img = document.createElement("img");
      img.src = `assets/${fileName}`; // パスは適宜変更
      img.classList.add("icon");
      if (w == "main") {
        if (i <= 13) {
          img.classList.add('tag1');
        } else if (i >= 14 && i <= 18) {
          img.classList.add('tag2');
        } else if (i >= 19 && i <= 26) {
          img.classList.add('tag3');
        } else if (i >= 27 && i <= 33) {
          img.classList.add('tag4');
        } else if (i >= 34 && i <= 39) {
          img.classList.add('tag5');
        } else if (i >= 40 && i <= 45) {
          img.classList.add('tag6');
        } else if (i >= 46 && i <= 48) {
          img.classList.add('tag7');
        } else if (i >= 49 && i <= 54) {
          img.classList.add('tag8');
        } else if (i >= 55 && i <= 58) {
          img.classList.add('tag9');
        } else if (i >= 59 && i <= 61) {
          img.classList.add('tag10');
        }
        else if (i >= 62) {
          img.classList.add('tag11');
        }
        img.addEventListener("click", () => {
          let n = trueName(fileName.slice(0, -4),true)
          if (n == "R-PEN/5H") n = "R-PEN";
          addTag(n)
        });
      } else if (w == "set") {
        if (i <= 35) {
          img.classList.add('tag1');
        } else if (i >= 36 && i <= 48) {
          img.classList.add('tag2');
        } else if (i >= 49 && i <= 66) {
          img.classList.add('tag3');
        } else if (i >= 67 && i <= 82) {
          img.classList.add('tag4');
        } else if (i >= 83 && i <= 96) {
          img.classList.add('tag5');
        } else if (i >= 97 && i <= 110) {
          img.classList.add('tag6');
        } else if (i >= 111 && i <= 118) {
          img.classList.add('tag7');
        } else if (i >= 119 && i <= 133) {
          img.classList.add('tag8');
        } else if (i >= 134 && i <= 143) {
          img.classList.add('tag9');
        } else if (i >= 144 && i <= 151) {
          img.classList.add('tag10');
        }
        else if (i >= 152) {
          img.classList.add('tag11');
        }
        img.addEventListener("click", () => {
          let n = trueName(fileName.slice(0, -4));
          addTag(n)
        });
      } else {
        img.addEventListener("click", () => {
          selectedSet.clear();
          let n = trueName(fileName.slice(0, -4));
          addTag(n)
        });
      }
      gird_container.appendChild(img);
    });
    container.appendChild(gird_container)
  }
}
function applyFilter() {
  const season = document.getElementById("season").value;
  const rule = document.getElementById("rule").value;
  const weaponInput = document.getElementById("weapon").value.trim();
  const nameInput = document.getElementById("name").value.trim();
  
  // 空欄なら「all」にする
  const weapon = weaponInput === "" ? "all" : weaponInput;
  const name = nameInput === "" ? "all" : nameInput;

  const exactMatch = document.getElementById("exactMatch").checked;

  fetch("data/"+rule+".json")
  .then(res => res.json())
  .then(data => {
    let filtered = data;
    if (season != "all") {
      filtered = filtered.filter(item => item.season === Number(season));
    }
    if (weapon != "all") {
      if (exactMatch) {
        filtered = filtered.filter(item => item.weapon === weapon);
      } else {
        filtered = filtered.filter(item => item.weapon.includes(weapon));
      }
    }
    if (name != "all") {
      filtered = filtered.filter(item => item.name.includes(name));
    }
    filtered.sort((a, b) => b.power - a.power);
    const tbody = document.querySelector("#rankingTable tbody");
    tbody.innerHTML = "";
    if (isMobile) {
      filtered.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="center">${index + 1}</td>
          <td class="center">${item.power.toFixed(1)}</td>
          <td >${item.name}</td>
          <td>
            <img src="assets/${normalizeUrl(item.weapon)}.png" class="weapon-iconmb" alt = ${item.weapon}>
          </td>
          <td class="center">${getSeason(item.season)}</td>
        `;

        tbody.appendChild(row);
      });
    } else {
      filtered.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="center">${index + 1}</td>
          <td class="center">${item.power.toFixed(1)}</td>
          <td >${item.name}</td>
          <td>
            <img src="assets/${normalizeUrl(item.weapon)}.png" class="weapon-icon" alt = ${item.weapon}>
            ${item.weapon}
          </td>
          <td class="center">${getSeason(item.season)}</td>
        `;

        tbody.appendChild(row);
      });
    }
  });
}

async function applyFilter_() {
  const season = Number.isInteger(Number(document.getElementById("season_").value))
  ? Number(document.getElementById("season_").value) : document.getElementById("season_").value

  const r_f = Number(document.getElementById("ranking_filter").value);
  if (!Number.isInteger(r_f) || r_f < 1 || r_f > 500) {
    return;
  }
  const sortby = document.getElementById("sort").value;
  const weapon = document.getElementById("weapon_").value;
  const merge = document.getElementById("merge").checked;
  const not_percent = document.getElementById("not_percent").checked;
  const merge_c = document.getElementById("merge_c").checked;

  const [eriadata, yaguradata, hokodata, asaridata] = await Promise.all([
    fetch("data/eria.json").then(res => res.json()),
    fetch("data/yagura.json").then(res => res.json()),
    fetch("data/hoko.json").then(res => res.json()),
    fetch("data/asari.json").then(res => res.json())
  ]);

  let opt = {}, wp;
  let calc_adjust = false;
  if (weapon == "w_cate" || weapon == "w_rang") calc_adjust = true;

  if (weapon == "w_set") {
    if (merge) {
      opt["merge"] = true;
      wp = weapons.slice(0, 160);
    } else {
      wp = weapons.slice(0, 173);
    }
  } else if (weapon == "w_main") {
    opt["merge"] = true;
    opt["main"] = true;
    wp = weapons.slice(206, 271);
  } else if (weapon == "w_cate") {
    opt["merge"] = true;
    opt["category"] = true;
    wp = weapons.slice(271, 282);
  } else if (weapon == "w_rang") {
    opt["merge"] = true;
    opt["range"] = true;
    wp = weapons.slice(282, 287);
  } else if (weapon == "sub") {
    opt["merge"] = true;
    opt["sub"] = true;
    wp = weapons.slice(173, 187);
  } else if (weapon == "special") {
    opt["merge"] = true;
    opt["special"] = true;
    wp = weapons.slice(187, 206);
  }
  const eria = countByWeapon(eriadata, season, opt);
  const yagura = countByWeapon(yaguradata, season, opt);
  const hoko = countByWeapon(hokodata, season, opt);
  const asari = countByWeapon(asaridata, season, opt);

  const eria_p = countByWeapon(eriadata, season-1, opt);
  const yagura_p = countByWeapon(yaguradata, season-1, opt);
  const hoko_p = countByWeapon(hokodata, season-1, opt);
  const asari_p = countByWeapon(asaridata, season-1, opt);
  let result = [];

  wp.forEach(w => {
    let e = eria[w]   || 0;
    let y = yagura[w] || 0;
    let h = hoko[w]   || 0;
    let a = asari[w]  || 0;
    let ps = (eria_p[w] || 0) + (yagura_p[w] || 0) + (hoko_p[w] || 0) + (asari_p[w] || 0);
    let s = e + y + h + a
    let d = s - ps;
    if (!not_percent) {
      let adjustment = r_f / 100
      if (season=="all") adjustment=adjustment*(CurrentSeason-1)
      e = smartFix(e/adjustment,adjustment)
      y = smartFix(y/adjustment,adjustment)
      h = smartFix(h/adjustment,adjustment)
      a = smartFix(a/adjustment,adjustment)
      s = smartFix(s/(adjustment*4),adjustment*4)
      d = smartFix(d/(adjustment*4),adjustment*4)
    }
    if (d>0) {d = "+"+d};
    if (season == 2 || season == "all") {
      d = "-";
    };
    if (calc_adjust) {
      let dict = {'シューター': 14, 'ローラー': 5, 'チャージャー': 8, 'スロッシャー': 6, 'スピナー': 6 , 'マニューバー': 6,
             'シェルター': 4, 'ブラスター': 7, 'フデ': 3, 'ストリンガー': 3, 'ワイパー': 3,
            '短射程':23,'中射程':24,'長射程':10,'中チャー':3,'長チャー':5}
      if (merge_c) {
        dict["チャージャー"] = 6
        dict["長チャー"] = 3
      }
      wm = (s/dict[w]).toFixed(2)
      result.push({
        weapon: w,
        エリア: e,
        ヤグラ: y,
        ホコ: h,
        アサリ: a,
        合計: s,
        割メイン: wm,
        増減: d
      });
    } else {
      result.push({
        weapon: w,
        エリア: e,
        ヤグラ: y,
        ホコ: h,
        アサリ: a,
        合計: s,
        増減: d
      });
    }
  });
  if ((weapon == "w_set" || weapon == "w_main") && merge_c) {
    const groupMap = {
      "スプラチャージャー": "スプチャ系",
      "スプラスコープ": "スプチャ系",
      "スプラチャージャーコラボ": "チャーコラ系",
      "スプラスコープコラボ": "チャーコラ系",
      "スプラチャージャーFRST": "チャーフロ系",
      "スプラスコープFRST": "チャーフロ系",
      "リッター4K": "リッター系",
      "4Kスコープ": "リッター系",
      "リッター4Kカスタム": "リッカス系",
      "4Kスコープカスタム": "リッカス系"
    };
    // グループ合計を計算
    const groupTotals = {};

    result.forEach(item => {
      const group = groupMap[item.weapon] || item.weapon;
      groupTotals[group] = (groupTotals[group] || 0) + item[sortby];
    });

    // ① グループごとにまとめる
    const groups = {};

    result.forEach(item => {
      const group = groupMap[item.weapon] || item.weapon;
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });

    // ② グループごとの合計を出す
    const groupedArray = Object.entries(groups).map(([group, items]) => {
      const total = items.reduce((sum, i) => sum + i[sortby], 0);
      return { group, items, total };
    });

    // ③ グループ単位でソート
    groupedArray.sort((a, b) => b.total - a.total);

    // ④ 各グループ内をソートしてフラット化
    result = groupedArray.flatMap(g =>
      g.items.sort((a, b) => b[sortby] - a[sortby])
    );

    let currentRank = 0;
    let prevGroup = null;
    let prevGroupTotal = null;
    let prevTotal = null;

    // 同順位の人数カウント（グループ外用）
    let tieCount = 0;

    result.forEach((item, index) => {
      const group = groupMap[item.weapon] || item.weapon;
      const groupTotal = groupTotals[group];
      const total = item[sortby];

      if (index === 0) {
        currentRank = 1;
        tieCount = 1;
      } else if (group === prevGroup && groupTotal === prevGroupTotal) {
        // 同グループ → 完全に同順位（人数にも含めない）
        // tieCountは増やさない
      } else if (total === prevTotal) {
        // グループは違うが同値 → 同順位（人数カウントは増やす）
        tieCount += 1;
      } else {
        // 新しい順位
        currentRank += tieCount;
        tieCount = 1;
      }

      item.順位 = currentRank;

      prevGroup = group;
      prevGroupTotal = groupTotal;
      prevTotal = total;
    });
  } else {
    // ===== ソート =====
    result.sort((a, b) => b[sortby] - a[sortby]);
    // ===== 順位つけ =====
    let currentRank = 0;
    let prevTotal = null;

    result.forEach((item, index) => {
      if (item[sortby] !== prevTotal) {
        currentRank = index + 1; // 新しい順位
      }
      item.順位 = currentRank;
      prevTotal = item[sortby];
    });
  }

  const cg = document.querySelector("#statsTable colgroup");
  const th = document.querySelector("#statsTable thead");
  if (calc_adjust) {
    cg.innerHTML = `
      <col style="width: 7%">
      <col style="width: 23%">
      <col style="width: 10%">
      <col style="width: 10%">
      <col style="width: 10%">
      <col style="width: 10%">
      <col style="width: 10%">
      <col style="width: 10%">
      <col style="width: 10%">
    `
    th.innerHTML = `
      <tr>
        <th class="rk">順位</th>
        <th>ウェポン</th>
        <th class="center">エリア</th>
        <th class="center">ヤグラ</th>
        <th class="center">ホコ</th>
        <th class="center">アサリ</th>
        <th class="center">全体</th>
        <th class="wm">/メイン数</th>
        <th class="center">増減</th>
      </tr>
    `
  } else {
    cg.innerHTML = `
      <col style="width: 8%">
      <col style="width: 32%">
      <col style="width: 10%">
      <col style="width: 10%">
      <col style="width: 10%">
      <col style="width: 10%">
      <col style="width: 10%">
      <col style="width: 10%">
    `
    th.innerHTML = `
      <tr>
        <th class="center">順位</th>
        <th>ウェポン</th>
        <th class="center">エリア</th>
        <th class="center">ヤグラ</th>
        <th class="center">ホコ</th>
        <th class="center">アサリ</th>
        <th class="center">全体</th>
        <th class="center">増減</th>
      </tr>
    `
  }

  const tbody = document.querySelector("#statsTable tbody");
  tbody.innerHTML = "";
  if (isMobile) {
    if (calc_adjust) {
      result.forEach((item, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td class="center">${item.順位}</td>
          <td class="hidden">${item.weapon}</td>
          <td class="right">${item.エリア}</td>
          <td class="right">${item.ヤグラ}</td>
          <td class="right">${item.ホコ}</td>
          <td class="right">${item.アサリ}</td>
          <td class="right">${item.合計}</td>
          <td class="right">${item.割メイン}</td>
          <td class="center">${item.増減}</td>
        `;

        tbody.appendChild(row);
      });
    } else {
      result.forEach((item, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td class="center">${item.順位}</td>
          <td class="hidden">${item.weapon}</td>
          <td class="right">${item.エリア}</td>
          <td class="right">${item.ヤグラ}</td>
          <td class="right">${item.ホコ}</td>
          <td class="right">${item.アサリ}</td>
          <td class="right">${item.合計}</td>
          <td class="center">${item.増減}</td>
        `;

        tbody.appendChild(row);
      });
    }
  } else {
    if (calc_adjust) {
      result.forEach((item, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td class="center">${item.順位}</td>
          <td>${item.weapon}</td>
          <td class="right">${item.エリア}</td>
          <td class="right">${item.ヤグラ}</td>
          <td class="right">${item.ホコ}</td>
          <td class="right">${item.アサリ}</td>
          <td class="right">${item.合計}</td>
          <td class="right">${item.割メイン}</td>
          <td class="center">${item.増減}</td>
        `;

        tbody.appendChild(row);
      });
    } else {
      result.forEach((item, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td class="center">${item.順位}</td>
          <td>${item.weapon}</td>
          <td class="right">${item.エリア}</td>
          <td class="right">${item.ヤグラ}</td>
          <td class="right">${item.ホコ}</td>
          <td class="right">${item.アサリ}</td>
          <td class="right">${item.合計}</td>
          <td class="center">${item.増減}</td>
        `;

        tbody.appendChild(row);
      });
    }
  }
const rows = document.querySelectorAll("#statsTable tbody tr");
const weaponCol = 1;
const normalCols = [2, 3, 4, 5]; // エリア〜アサリ
const totalCols = calc_adjust ? [6,7]:[6]; // 合計 
const diffCol = calc_adjust ? 8 : 7; // 増減列

// ① 最大の絶対値を取得
let maxAbs = 0;
// 最大値をそれぞれ取得
let maxNormal = 0;
let maxTotal = 0;
let maxTotal_ = 0;

rows.forEach(row => {
  const value = Number(row.children[diffCol].textContent);
  const abs = Math.abs(value);
  if (abs > maxAbs) maxAbs = abs;

  normalCols.forEach(i => {
    const v = Number(row.children[i].textContent);
    if (v > maxNormal) maxNormal = v;
  });

  const total = Number(row.children[totalCols[0]].textContent);
  if (total > maxTotal) maxTotal = total;
  if (totalCols[1]) {
    const total = Number(row.children[totalCols[1]].textContent);
    if (total > maxTotal_) maxTotal_ = total;
  }
});


// ② 色付け
rows.forEach(row => {
  // エリア〜アサリ
  normalCols.forEach(i => {
    const cell = row.children[i];
    const value = Number(cell.textContent);
    const ratio = value / maxNormal;
    const alpha = ratio * 0.7;

    cell.style.backgroundColor = `rgba(255, 140, 0, ${alpha})`;
  });

  // 合計
  totalCols.forEach(i => {
    let mt;
    if (i==totalCols[0]){
      mt = maxTotal
    } else {
      mt = maxTotal_
    }
    const cell = row.children[i];
    const value = Number(cell.textContent);
    const ratio = value / mt;
    const alpha = ratio * 0.7;

    cell.style.backgroundColor = `rgba(0, 150, 255, ${alpha})`;
  });

  const diffcell = row.children[diffCol];
  const value = Number(diffcell.textContent);
  const ratio = Math.abs(value) / maxAbs; // 0〜1
  const alpha = ratio * 0.7;

  if (value > 0) {
    // 赤
    diffcell.style.backgroundColor = `rgba(255, 74, 74, ${alpha})`;
  } else {
    // 青
    diffcell.style.backgroundColor = `rgba(88, 73, 255, ${alpha})`;
  }

  const cell = row.children[weaponCol]; // ウェポン名
  let name = cell.textContent.trim();

  if (weapon == "w_cate" || weapon == "w_rang") {
    cell.style.backgroundColor = colorMap[name]+"40";
  } else if (weapon == "w_set"||weapon=="w_main") {
    if (weapon=="w_main"&&name[0]!="."){
      name = normalizeUrl(name)
      if (name=="R-PEN5H") name="R-PEN/5H"
    }
    const ct = categoryMap[name] || name;
    const ra = rangeMap[name] || name;
    cell.style.backgroundColor = mixColors(colorMap[ct], colorMap[ra], 0.2)+"40";
  }
  // 画像作成
  const img = document.createElement("img");
  const iconUrl = "assets/" + normalizeUrl(name) + ".png";
  if (!iconUrl) return;
  img.alt = name;
  img.src = iconUrl;
  if (isMobile) {
    if (weapon == "sub" || weapon == "special") img.classList.add("weapon-iconmb_");
    else img.classList.add("weapon-iconmb");
  } else {
    if (weapon == "sub" || weapon == "special") img.classList.add("weapon-icon_");
    else img.classList.add("weapon-icon");
  }

  // テキストの前に追加
  cell.prepend(img);  
});

  createChart("total");
  buttons.forEach(b => b.classList.remove("active"));
  buttons[0].classList.add("active");
}

async function display() {
  const [eriadata, yaguradata, hokodata, asaridata] = await Promise.all([
    fetch("data/eria.json").then(res => res.json()),
    fetch("data/yagura.json").then(res => res.json()),
    fetch("data/hoko.json").then(res => res.json()),
    fetch("data/asari.json").then(res => res.json())
  ]);
  const season = Number.isInteger(Number(document.getElementById("season__").value))
  ? Number(document.getElementById("season__").value) : document.getElementById("season__").value;
  const sortby = document.getElementById("sort_").value;
  const not_percent = document.getElementById("not_percent_").checked;
  let choices = Array.from(document.getElementById("choice").querySelectorAll('.tag')).map(tag => {
    return tag.childNodes[0].textContent.trim();
  });
  const type = document.querySelectorAll("#weapon-controls button.active")[0].dataset.mode;

  const table = document.getElementById("analysisTable")
  table.innerHTML = ""

  if (type!="set") {
    if (type == "main") {
      let l = []
      choices.forEach(n => {
        l = l.concat(findByBaseName(n,mainMap))
      });
      choices = l;
    } else {
      let map;
      if (type == "sub") map = subMap
      else if (type == "special") map = specialMap
      else if (type == "category") map = categoryMap
      else map = rangeMap
      choices = findByBaseName(choices[0],map);
    }
  }

  if (season=="seasonal") {
    table.innerHTML = `
          <colgroup>
            <col style="width: 13%">
            <col style="width: 14.5%">
            <col style="width: 14.5%">
            <col style="width: 14.5%">
            <col style="width: 14.5%">
            <col style="width: 14.5%">
            <col style="width: 14.5%">
          </colgroup>
          <thead>
            <tr>
              <th class="center">シーズン</th>
              <th class="center">エリア</th>
              <th class="center">ヤグラ</th>
              <th class="center">ホコ</th>
              <th class="center">アサリ</th>
              <th class="center">全体</th>
              <th class="center">増減</th>
            </tr>
          </thead>
          <tbody></tbody>
    `
    const tbody = document.querySelector("#analysisTable tbody");

    let prevTotal = 0;

    for (let season = 2; season <= CurrentSeason; season++) {

      const eriaCount   = countBySeason(eriadata, season, choices);
      const yaguraCount = countBySeason(yaguradata, season, choices);
      const hokoCount   = countBySeason(hokodata, season, choices);
      const asariCount  = countBySeason(asaridata, season, choices);

      const total = eriaCount + yaguraCount + hokoCount + asariCount;
      const diff = total - prevTotal;

      const tr = document.createElement("tr");
      let e = eriaCount, y = yaguraCount, h = hokoCount, a = asariCount, t = total, d = diff;
      if (!not_percent) {
        e = e/5
        y = y/5
        h = h/5
        a = a/5
        t = t/20
        d = d/20
      }
      tr.innerHTML = `
        <td class="center">${getSeason(season)}</td>
        <td class="right">${e.toFixed(1)}</td>
        <td class="right">${y.toFixed(1)}</td>
        <td class="right">${h.toFixed(1)}</td>
        <td class="right">${a.toFixed(1)}</td>
        <td class="right">${t.toFixed(2)}</td>
        <td class="right">
          ${season === 2 ? "-" : (d > 0 ? "+" + d : d)}
        </td>
      `;

      tbody.appendChild(tr);

      prevTotal = total;
    }
    const rows = document.querySelectorAll("#analysisTable tbody tr");
    const normalCols = [1, 2, 3, 4]; // エリア〜アサリ
    const totalCol = 5; // 合計 
    const diffCol = 6 // 増減列

    // ① 最大の絶対値を取得
    let maxAbs = 0;

    let maxNormal = -Infinity, minNormal = Infinity;
    let maxTotal = -Infinity, minTotal = Infinity;

    rows.forEach(row => {
      const value = Number(row.children[diffCol].textContent);
      const abs = Math.abs(value);
      if (abs > maxAbs) maxAbs = abs;

      normalCols.forEach(i => {
        const v = Number(row.children[i].textContent);
        if (v > maxNormal) maxNormal = v;
        if (v < minNormal) minNormal = v;
      });

      const total = Number(row.children[totalCol].textContent);
      if (total > maxTotal) maxTotal = total;
      if (total < minTotal) minTotal = total;
    });


    // ② 色付け
    rows.forEach(row => {
      // エリア〜アサリ
      normalCols.forEach(i => {
        const cell = row.children[i];
        const value = Number(cell.textContent);
        const ratio = (value - minNormal) / (maxNormal - minNormal || 1);
        const alpha = ratio * 0.7;

        cell.style.backgroundColor = `rgba(255, 140, 0, ${alpha})`;
      });

      const totalcell = row.children[totalCol];
      const totalvalue = Number(totalcell.textContent);
      const totalratio = (totalvalue - minTotal) / (maxTotal - minTotal || 1);
      const totalalpha = totalratio * 0.7;

      totalcell.style.backgroundColor = `rgba(0, 150, 255, ${totalalpha})`;

      const diffcell = row.children[diffCol];
      const value = Number(diffcell.textContent);
      const ratio = Math.abs(value) / maxAbs; // 0〜1
      const alpha = ratio * 0.7;       // 最低0.2は色つける

      if (value > 0) {
        // 赤
        diffcell.style.backgroundColor = `rgba(255, 74, 74, ${alpha})`;
      } else {
        // 青
        diffcell.style.backgroundColor = `rgba(88, 73, 255, ${alpha})`;
      }
    });
    lineChart(not_percent)
  } else {
    table.innerHTML = `
      <colgroup>
        <col style="width: 8%">
        <col style="width: 32%">
        <col style="width: 10%">
        <col style="width: 10%">
        <col style="width: 10%">
        <col style="width: 10%">
        <col style="width: 10%">
        <col style="width: 10%">
      </colgroup>
      <thead>
        <tr>
          <th class="center">順位</th>
          <th>ウェポン</th>
          <th class="center">エリア</th>
          <th class="center">ヤグラ</th>
          <th class="center">ホコ</th>
          <th class="center">アサリ</th>
          <th class="center">全体</th>
          <th class="center">増減</th>
        </tr>
      </thead>
      <tbody></tbody>
    `
    const tbody = document.querySelector("#analysisTable tbody");

    const eria = countWeaponsDetail(eriadata, choices, season)
    const yagura = countWeaponsDetail(yaguradata, choices, season)
    const hoko = countWeaponsDetail(hokodata, choices, season)
    const asari = countWeaponsDetail(asaridata, choices, season)

    const eria_p = countWeaponsDetail(eriadata, choices, season-1)
    const yagura_p = countWeaponsDetail(yaguradata, choices, season-1)
    const hoko_p = countWeaponsDetail(hokodata, choices, season-1)
    const asari_p = countWeaponsDetail(asaridata, choices, season-1)
    let result = [];
    choices.forEach(w => {
      let e = eria[w]   || 0;
      let y = yagura[w] || 0;
      let h = hoko[w]   || 0;
      let a = asari[w]  || 0;
      let ps = (eria_p[w] || 0) + (yagura_p[w] || 0) + (hoko_p[w] || 0) + (asari_p[w] || 0);
      let s = e + y + h + a
      let d = s - ps;
      if (!not_percent) {
        let adjustment = 5;
        if (season == "all") adjustment = adjustment * (CurrentSeason-1)
        e = smartFix(e/adjustment,adjustment)
        y = smartFix(y/adjustment,adjustment)
        h = smartFix(h/adjustment,adjustment)
        a = smartFix(a/adjustment,adjustment)
        s = smartFix(s/(adjustment*4),adjustment*4)
        d = smartFix(d/(adjustment*4),adjustment*4)
      }
      if (d>0) {d = "+"+d};
      if (season == 2 || season == "all") {
        d = "-";
      };
      result.push({
        weapon: w,
        エリア: e,
        ヤグラ: y,
        ホコ: h,
        アサリ: a,
        合計: s,
        増減: d
      });
    });
    // ===== ソート =====
    result.sort((a, b) => b[sortby] - a[sortby]);
    // ===== 順位つけ =====
    let currentRank = 0;
    let prevTotal = null;

    result.forEach((item, index) => {
      if (item[sortby] !== prevTotal) {
        currentRank = index + 1; // 新しい順位
      }
      item.順位 = currentRank;
      prevTotal = item[sortby];
    });
    if (isMobile) {
      result.forEach((item, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td class="center">${item.順位}</td>
          <td class="hidden">${item.weapon}</td>
          <td class="center">${item.エリア}</td>
          <td class="center">${item.ヤグラ}</td>
          <td class="center">${item.ホコ}</td>
          <td class="center">${item.アサリ}</td>
          <td class="center">${item.合計}</td>
          <td class="center">${item.増減}</td>
        `;

        tbody.appendChild(row);
      });
    } else {
      result.forEach((item, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td class="center">${item.順位}</td>
          <td>${item.weapon}</td>
          <td class="right">${item.エリア}</td>
          <td class="right">${item.ヤグラ}</td>
          <td class="right">${item.ホコ}</td>
          <td class="right">${item.アサリ}</td>
          <td class="right">${item.合計}</td>
          <td class="center">${item.増減}</td>
        `;

        tbody.appendChild(row);
      });
    };

    const rows = document.querySelectorAll("#analysisTable tbody tr");
    const weaponCol = 1;
    const normalCols = [2, 3, 4, 5]; // エリア〜アサリ
    const totalCol = 6; // 合計 
    const diffCol = 7; // 増減列

    // ① 最大の絶対値を取得
    let maxAbs = 0;
    // 最大値をそれぞれ取得
    let maxNormal = -Infinity, minNormal = Infinity;
    let maxTotal = -Infinity, minTotal = Infinity;

    rows.forEach(row => {
      const value = Number(row.children[diffCol].textContent);
      const abs = Math.abs(value);
      if (abs > maxAbs) maxAbs = abs;

      normalCols.forEach(i => {
        const v = Number(row.children[i].textContent);
        if (v > maxNormal) maxNormal = v;
        if (v < minNormal) minNormal = v;
      });

      const total = Number(row.children[totalCol].textContent);
      if (total > maxTotal) maxTotal = total;
      if (total < minTotal) minTotal = total;
    });


    // ② 色付け
    rows.forEach(row => {
      // エリア〜アサリ
      normalCols.forEach(i => {
        const cell = row.children[i];
        const value = Number(cell.textContent);
        const ratio = (value - minNormal) / (maxNormal - minNormal || 1);
        const alpha = ratio * 0.7;

        cell.style.backgroundColor = `rgba(255, 140, 0, ${alpha})`;
      });

      const totalcell = row.children[totalCol];
      const totalvalue = Number(totalcell.textContent);
      const totalratio = (totalvalue - minTotal) / (maxTotal - minTotal || 1);
      const totalalpha = totalratio * 0.7;

      totalcell.style.backgroundColor = `rgba(0, 150, 255, ${totalalpha})`;

      const diffcell = row.children[diffCol];
      const value = Number(diffcell.textContent);
      const ratio = Math.abs(value) / maxAbs; // 0〜1
      const alpha = ratio * 0.7;

      if (value > 0) {
        // 赤
        diffcell.style.backgroundColor = `rgba(255, 74, 74, ${alpha})`;
      } else {
        // 青
        diffcell.style.backgroundColor = `rgba(88, 73, 255, ${alpha})`;
      }

      const cell = row.children[weaponCol]; // ウェポン名
      let name = cell.textContent.trim();
      const ct = categoryMap[name] || name;
      const ra = rangeMap[name] || name;
      cell.style.backgroundColor = mixColors(colorMap[ct], colorMap[ra], 0.2)+"40";
      // 画像作成
      const img = document.createElement("img");
      const iconUrl = "assets/" + normalizeUrl(name) + ".png";
      if (!iconUrl) return;
      img.alt = name;
      img.src = iconUrl;
      if (isMobile) img.classList.add("weapon-iconmb")
      else img.classList.add("weapon-icon");

      // テキストの前に追加
      cell.prepend(img);  
    });
    pieChart()
  }
}

const input = document.getElementById("weapon");
const suggestions = document.getElementById("suggestions");

input.addEventListener("input", () => {
  const value = input.value.trim();
  suggestions.innerHTML = "";

  if (value === "") return;

  let wp = weapons.slice(0, 173);
  // 部分一致でフィルタ
  const filtered = wp.filter(w =>
    w.includes(value)
  );

  filtered.forEach(w => {
    const li = document.createElement("li");
    li.textContent = w;

    li.addEventListener("click", () => {
      input.value = w;
      suggestions.innerHTML = "";
    });

    suggestions.appendChild(li);
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".filter-group")) {
    suggestions.innerHTML = "";
  }
});

const selectedSet = new Set();
const choice = document.getElementById("choice");

function render() {
  choice.innerHTML = "";

  selectedSet.forEach(value => {
    const tag = document.createElement("span");
    tag.className = "tag";

    tag.textContent = value;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";

    removeBtn.onclick = () => {
      selectedSet.delete(value);
      render();
    };

    tag.appendChild(removeBtn);
    choice.appendChild(tag);
  });
}

function addTag(n) {
  const value = n;
  if (!selectedSet.has(value)) {
    selectedSet.add(value);
    render();
  };
}

function findByBaseName(baseName, data) {
  return Object.keys(data).filter(key => !aliasMap[key] && data[key] === baseName);
}
