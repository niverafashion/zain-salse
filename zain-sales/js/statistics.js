/* =====================================
   ZAIN SALES - STATISTICS
===================================== */

const $ = id => document.getElementById(id);

const numberFormat = new Intl.NumberFormat("en-IQ");

const statsState = {
  user: null,
  loading: false
};

function number(value) {
  return numberFormat.format(Number(value) || 0);
}

function dateInBaghdad(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baghdad",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function dateParts(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function shiftDate(value, days) {
  const date = dateParts(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function showStatsMessage(text, error = false) {
  const element = $("statisticsMessage");

  element.textContent = text;
  element.classList.toggle("error", error);
}

function makeElement(tag, text, className = "") {
  const element = document.createElement(tag);
  element.textContent = text ?? "";

  if (className) {
    element.className = className;
  }

  return element;
}

/* DATE PRESETS */

function selectPeriod(period) {
  const today = dateInBaghdad();

  let from = today;

  if (period === "week") {
    from = shiftDate(today, -6);
  }

  if (period === "month") {
    from = today.slice(0, 7) + "-01";
  }

  if (period === "year") {
    from = today.slice(0, 4) + "-01-01";
  }

  $("statsDateFrom").value = from;
  $("statsDateTo").value = today;

  document.querySelectorAll(".period-button")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.period === period
      );
    });
}

/* LOAD ALL MATCHING ROWS IN BATCHES */

async function fetchAll(buildQuery) {
  const result = [];
  const batchSize = 500;
  let offset = 0;

  while (true) {
    const { data, error } = await buildQuery()
      .range(offset, offset + batchSize - 1);

    if (error) throw error;

    const rows = data || [];
    result.push(...rows);

    if (rows.length < batchSize) break;

    offset += batchSize;
  }

  return result;
}

/* DATA LOADING */

async function loadReport() {
  if (statsState.loading) return;

  const from = $("statsDateFrom").value;
  const to = $("statsDateTo").value;

  if (!from || !to || from > to) {
    showStatsMessage(
      "تأكد من اختيار فترة زمنية صحيحة.",
      true
    );
    return;
  }

  statsState.loading = true;
  $("applyStatsFilter").disabled = true;

  showStatsMessage("جاري تحميل التقرير...");

  try {
    // Iraq currently uses UTC+03:00
    // throughout the year.
    const paymentFrom = `${from}T00:00:00+03:00`;
    const paymentUntil =
      `${shiftDate(to, 1)}T00:00:00+03:00`;

    const [sales, payments] = await Promise.all([

      fetchAll(() =>
        supabaseClient
          .from("sales_summary")
          .select(`
            id,
            sale_date,
            package_id,
            package_name,
            sale_amount,
            received_amount,
            remaining_amount,
            payment_status
          `)
          .eq("user_id", statsState.user.id)
          .gte("sale_date", from)
          .lte("sale_date", to)
          .order("sale_date")
          .order("id")
      ),

      fetchAll(() =>
        supabaseClient
          .from("payments")
          .select("id,amount,paid_at")
          .eq("user_id", statsState.user.id)
          .is("voided_at", null)
          .gte("paid_at", paymentFrom)
          .lt("paid_at", paymentUntil)
          .order("paid_at")
          .order("id")
      )

    ]);

    renderReport(sales, payments, from, to);
    showStatsMessage("");

  } catch (error) {
    console.error("Statistics error:", error);

    showStatsMessage(
      "تعذر تحميل التقرير. تأكد من الاتصال وصلاحيات قاعدة البيانات.",
      true
    );

  } finally {
    statsState.loading = false;
    $("applyStatsFilter").disabled = false;
  }
}

/* REPORT CALCULATIONS */

function renderReport(sales, payments, from, to) {
  const salesValue = sales.reduce(
    (sum, sale) =>
      sum + Number(sale.sale_amount || 0),
    0
  );

  const receiptsValue = payments.reduce(
    (sum, payment) =>
      sum + Number(payment.amount || 0),
    0
  );

  const debtsValue = sales.reduce(
    (sum, sale) =>
      sum + Number(sale.remaining_amount || 0),
    0
  );

  $("statsSalesCount").textContent =
    number(sales.length);

  $("statsSalesValue").textContent =
    number(salesValue);

  $("statsReceipts").textContent =
    number(receiptsValue);

  $("statsDebts").textContent =
    number(debtsValue);

  renderPackageBreakdown(sales);
  renderPaymentBreakdown(sales);
  renderDailyReport(sales, payments, from, to);
}

/* PACKAGE BREAKDOWN */

function renderPackageBreakdown(sales) {
  const container = $("packageBreakdown");
  container.replaceChildren();

  if (!sales.length) {
    container.appendChild(
      makeElement(
        "p",
        "ماكو مبيعات خلال الفترة المحددة.",
        "stats-empty"
      )
    );
    return;
  }

  const packages = new Map();

  sales.forEach(sale => {
    const name = sale.package_name || "باقة أخرى";

    const current = packages.get(name) || {
      count: 0,
      value: 0
    };

    current.count++;
    current.value += Number(sale.sale_amount || 0);

    packages.set(name, current);
  });

  const sorted = [...packages.entries()]
    .sort((a, b) => b[1].count - a[1].count);

  sorted.forEach(([name, data]) => {
    const percentage =
      (data.count / sales.length) * 100;

    const item = makeElement(
      "div",
      "",
      "stats-breakdown-item"
    );

    const heading = makeElement(
      "div",
      "",
      "stats-breakdown-heading"
    );

    heading.append(
      makeElement("strong", name),
      makeElement(
        "span",
        `${number(data.count)} خط`
      )
    );

    const track = makeElement(
      "div",
      "",
      "stats-progress-track"
    );

    const fill = makeElement(
      "div",
      "",
      "stats-progress-fill"
    );

    fill.style.width = `${percentage}%`;
    track.appendChild(fill);

    item.append(
      heading,
      track,
      makeElement(
        "small",
        `${number(data.value)} د.ع · ${percentage.toFixed(1)}%`
      )
    );

    container.appendChild(item);
  });
}

/* PAYMENT STATUS BREAKDOWN */

function renderPaymentBreakdown(sales) {
  const container = $("paymentBreakdown");
  container.replaceChildren();

  const categories = [
    {
      status: "paid",
      label: "مدفوع بالكامل",
      color: "paid"
    },
    {
      status: "partial",
      label: "مدفوع جزئياً",
      color: "partial"
    },
    {
      status: "unpaid",
      label: "غير مدفوع",
      color: "unpaid"
    }
  ];

  categories.forEach(category => {
    const count = sales.filter(
      sale => sale.payment_status === category.status
    ).length;

    const percentage = sales.length
      ? count / sales.length * 100
      : 0;

    const item = makeElement(
      "div",
      "",
      "stats-payment-item"
    );

    const heading = makeElement(
      "div",
      "",
      "stats-breakdown-heading"
    );

    const label = makeElement(
      "span",
      category.label,
      `stats-payment-label ${category.color}`
    );

    heading.append(
      label,
      makeElement(
        "strong",
        `${number(count)} (${percentage.toFixed(1)}%)`
      )
    );

    const track = makeElement(
      "div",
      "",
      "stats-progress-track"
    );

    const fill = makeElement(
      "div",
      "",
      `stats-progress-fill ${category.color}`
    );

    fill.style.width = `${percentage}%`;
    track.appendChild(fill);

    item.append(heading, track);
    container.appendChild(item);
  });
}

/* DAILY SALES AND RECEIPTS */

function renderDailyReport(sales, payments, from, to) {
  const daily = new Map();

  function getDay(date) {
    if (!daily.has(date)) {
      daily.set(date, {
        date,
        count: 0,
        salesValue: 0,
        receipts: 0
      });
    }

    return daily.get(date);
  }

  sales.forEach(sale => {
    const day = getDay(sale.sale_date);

    day.count++;
    day.salesValue += Number(sale.sale_amount || 0);
  });

  payments.forEach(payment => {
    const date = dateInBaghdad(
      new Date(payment.paid_at)
    );

    const day = getDay(date);
    day.receipts += Number(payment.amount || 0);
  });

  // Fill missing dates with zeros.
  let current = from;

  while (current <= to) {
    getDay(current);
    current = shiftDate(current, 1);
  }

  const days = [...daily.values()]
    .sort((a, b) => a.date.localeCompare(b.date));

  renderDailyTable(days);
  renderBarChart(
    "statsSalesChart",
    days,
    "count",
    false
  );

  renderBarChart(
    "statsReceiptsChart",
    days,
    "receipts",
    true
  );
}

/* CHARTS */

function renderBarChart(
  containerId,
  days,
  valueKey,
  currency
) {
  const container = $(containerId);
  container.replaceChildren();

  const max = Math.max(
    1,
    ...days.map(day => day[valueKey])
  );

  // A very long date range would create
  // hundreds of tiny bars. Aggregate the
  // visual chart by month when needed.
  let points = days;

  if (days.length > 45) {
    const monthly = new Map();

    days.forEach(day => {
      const key = day.date.slice(0, 7);

      if (!monthly.has(key)) {
        monthly.set(key, {
          date: key,
          count: 0,
          receipts: 0
        });
      }

      const month = monthly.get(key);
      month.count += day.count;
      month.receipts += day.receipts;
    });

    points = [...monthly.values()];
  }

  const chartMax = Math.max(
    1,
    ...points.map(point => point[valueKey])
  );

  points.forEach(point => {
    const column = makeElement(
      "div",
      "",
      "stats-chart-column"
    );

    const value = Number(point[valueKey]);

    const valueLabel = makeElement(
      "span",
      number(value),
      "stats-chart-value"
    );

    const bar = makeElement(
      "div",
      "",
      currency
        ? "stats-chart-bar receipt"
        : "stats-chart-bar"
    );

    bar.style.height =
      `${Math.max(3, value / chartMax * 190)}px`;

    bar.title = currency
      ? `${point.date}: ${number(value)} د.ع`
      : `${point.date}: ${number(value)} خط`;

    const label = makeElement(
      "span",
      points.length > 45
        ? point.date
        : point.date.slice(5),
      "stats-chart-label"
    );

    column.append(valueLabel, bar, label);
    container.appendChild(column);
  });
}

/* DAILY TABLE */

function renderDailyTable(days) {
  const tbody = $("dailyStatsBody");
  tbody.replaceChildren();

  // Newest date first.
  [...days].reverse().forEach(day => {
    const tr = document.createElement("tr");

    [
      day.date,
      number(day.count),
      number(day.salesValue),
      number(day.receipts)
    ].forEach(value => {
      tr.appendChild(
        makeElement("td", value)
      );
    });

    tbody.appendChild(tr);
  });
}

/* MOBILE SIDEBAR */

function initializeSidebar() {
  const sidebar = $("sidebar");
  const overlay = $("sidebarOverlay");
  const button = $("menuBtn");

  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    button.setAttribute("aria-expanded", "false");
  }

  button.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");

    overlay.classList.toggle("show", open);
    button.setAttribute("aria-expanded", String(open));
  });

  overlay.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeSidebar();
  });
}

/* INITIALIZATION */

async function initializeStatistics() {
  const user = await requireAuth();

  if (!user) return;

  statsState.user = user;
  $("content").hidden = false;

  initializeSidebar();

  $("logoutBtn").addEventListener(
    "click",
    logout
  );

  $("currentDate").textContent =
    new Intl.DateTimeFormat("ar-IQ", {
      timeZone: "Asia/Baghdad",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date());

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  $("sidebarUserName").textContent =
    profile?.full_name?.trim()
    || user.email?.split("@")[0]
    || "مندوب المبيعات";

  document.querySelectorAll(".period-button")
    .forEach(button => {
      button.addEventListener("click", () => {
        selectPeriod(button.dataset.period);
        loadReport();
      });
    });

  $("statisticsFilterForm")
    .addEventListener("submit", event => {
      event.preventDefault();

      document.querySelectorAll(".period-button")
        .forEach(button => {
          button.classList.remove("active");
        });

      loadReport();
    });

  $("printReport").addEventListener(
    "click",
    () => window.print()
  );

  selectPeriod("month");
  await loadReport();
}

initializeStatistics().catch(error => {
  console.error(error);
  showStatsMessage(
    "تعذر فتح صفحة الإحصائيات.",
    true
  );
});