/* ======================================
   ZAIN SALES - DASHBOARD LOGIC
====================================== */
document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireSubscription();

  if (!user) return;
const moneyFormatter = new Intl.NumberFormat("en-IQ");

function formatMoney(value) {
  return moneyFormatter.format(Number(value) || 0);
}

function baghdadDate(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Baghdad",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function showDashboardMessage(message, isError = false) {
  const element = document.getElementById("dashboardMessage");

  element.textContent = message;
  element.classList.toggle("error", isError);
}

// 1. DISPLAY DATE

function displayCurrentDate() {
  const date = new Intl.DateTimeFormat("ar-IQ", {
    timeZone: "Asia/Baghdad",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  document.getElementById("currentDate").textContent = date;
}

// 2. DISPLAY USER

async function displayUser(user) {
  const { data } = await supabaseClient
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const name = data?.full_name?.trim()
    || user.email?.split("@")[0]
    || "مندوب المبيعات";

  document.getElementById("welcomeName").textContent = name;
  document.getElementById("sidebarUserName").textContent = name;
}

// 3. STATISTICS

async function loadStatistics(user) {
  const today = baghdadDate();
  const month = today.slice(0, 7) + "-01";

  const [
    todayResult,
    monthResult,
    debtResult
  ] = await Promise.all([

    supabaseClient
      .from("daily_sales_stats")
      .select("total_lines,total_sales")
      .eq("user_id", user.id)
      .eq("sale_date", today)
      .maybeSingle(),

    supabaseClient
      .from("monthly_sales_stats")
      .select("total_lines")
      .eq("user_id", user.id)
      .eq("month", month)
      .maybeSingle(),

    supabaseClient
      .from("sales_summary")
      .select("remaining_amount")
      .eq("user_id", user.id)
      .gt("remaining_amount", 0)

  ]);

  if (
    todayResult.error ||
    monthResult.error ||
    debtResult.error
  ) {
    throw new Error("تعذر تحميل إحصائيات المبيعات.");
  }

  const todayData = todayResult.data;
  const monthData = monthResult.data;
  const debts = debtResult.data || [];

  const totalDebts = debts.reduce(
    (sum, sale) =>
      sum + Number(sale.remaining_amount || 0),
    0
  );

  document.getElementById("todaySales").textContent =
    formatMoney(todayData?.total_lines);

  document.getElementById("todayRevenue").textContent =
    formatMoney(todayData?.total_sales);

  document.getElementById("monthlySales").textContent =
    formatMoney(monthData?.total_lines);

  document.getElementById("totalDebts").textContent =
    formatMoney(totalDebts);
}

// 4. WEEKLY SALES CHART

async function loadWeeklyChart(user) {
  const chart = document.getElementById("salesChart");

  const today = baghdadDate();
  const start = new Date(today + "T12:00:00Z");
  start.setUTCDate(start.getUTCDate() - 6);

  const startDate = start.toISOString().slice(0, 10);

  const { data, error } = await supabaseClient
    .from("daily_sales_stats")
    .select("sale_date,total_lines")
    .eq("user_id", user.id)
    .gte("sale_date", startDate)
    .lte("sale_date", today)
    .order("sale_date");

  if (error) {
    throw new Error("تعذر تحميل مخطط المبيعات.");
  }

  const salesMap = new Map(
    (data || []).map(item => [
      item.sale_date,
      Number(item.total_lines)
    ])
  );

  const days = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);

    const key = date.toISOString().slice(0, 10);

    const dayName = new Intl.DateTimeFormat("ar-IQ", {
      weekday: "short",
      timeZone: "UTC"
    }).format(date);

    days.push({
      name: dayName,
      count: salesMap.get(key) || 0
    });
  }

  const maxSales = Math.max(
    1,
    ...days.map(day => day.count)
  );

  chart.replaceChildren();

  days.forEach(day => {
    const column = document.createElement("div");
    column.className = "chart-column";

    const value = document.createElement("span");
    value.className = "chart-value";
    value.textContent = day.count;

    const bar = document.createElement("div");
    bar.className = "chart-bar";

    const percentage = day.count / maxSales;
    bar.style.height = `${Math.max(3, percentage * 180)}px`;

    const label = document.createElement("span");
    label.className = "chart-day";
    label.textContent = day.name;

    column.append(value, bar, label);
    chart.appendChild(column);
  });
}

// 5. RECENT SALES

async function loadRecentSales(user) {
  const tbody = document.getElementById("recentSalesBody");

  const { data, error } = await supabaseClient
    .from("sales_summary")
    .select(`
      id,
      customer_name,
      phone_number,
      package_name,
      sale_amount,
      payment_status,
      sale_date
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error("تعذر تحميل آخر عمليات البيع.");
  }

  tbody.replaceChildren();

  if (!data || data.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 6;
    cell.className = "empty-table";
    cell.textContent = "ماكو مبيعات مسجلة لحد الآن.";

    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  const paymentLabels = {
    paid: "مدفوع",
    partial: "مدفوع جزئياً",
    unpaid: "غير مدفوع"
  };

  data.forEach(sale => {
    const row = document.createElement("tr");

    const values = [
      sale.customer_name,
      sale.phone_number,
      sale.package_name,
      formatMoney(sale.sale_amount),
      paymentLabels[sale.payment_status] || "غير معروف",
      sale.sale_date
    ];

    values.forEach((value, index) => {
      const cell = document.createElement("td");

      // textContent prevents customer data
      // from being interpreted as HTML.
      cell.textContent = value ?? "";

      if (index === 0) {
        cell.className = "customer-name";
      }

      if (index === 1) {
        cell.className = "phone-cell";
      }

      if (index === 4) {
        const badge = document.createElement("span");

        badge.className =
          `payment-badge ${sale.payment_status}`;

        badge.textContent = value;

        cell.replaceChildren(badge);
      }

      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });
}

// 6. MOBILE SIDEBAR

function initializeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const menuBtn = document.getElementById("menuBtn");

  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  menuBtn.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");

    overlay.classList.toggle("show", isOpen);
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  overlay.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeSidebar();
    }
  });
}

// 7. INITIALIZE DASHBOARD

async function initializeDashboard() {
  const user = await requireAuth();

  if (!user) return;

  document.getElementById("content").hidden = false;

  displayCurrentDate();
  initializeSidebar();

  document.getElementById("logoutBtn")
    .addEventListener("click", logout);

  const tasks = await Promise.allSettled([
    displayUser(user),
    loadStatistics(user),
    loadWeeklyChart(user),
    loadRecentSales(user)
  ]);

  const failures = tasks.filter(
    task => task.status === "rejected"
  );

  if (failures.length > 0) {
    console.error("Dashboard errors:", failures);

    showDashboardMessage(
      "تعذر تحميل بعض البيانات. حدّث الصفحة وحاول مرة ثانية.",
      true
    );
  } else {
    showDashboardMessage("");
  }
}

initializeDashboard().catch(error => {
  console.error("Dashboard initialization:", error);
  showDashboardMessage(
    "حدث خطأ أثناء فتح لوحة التحكم.",
    true
  );
});
});
// =====================================================
// بيانات المندوب - الاسم والصورة
// =====================================================

async function loadRepresentativeProfile() {

  try {

    // جلب المستخدم الحالي
    const {
      data: userData,
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
      return;
    }

    const user = userData.user;


    // جلب بيانات المندوب من profiles
    const {
      data: profile,
      error: profileError
    } = await supabaseClient
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();


    if (profileError) {

      console.error(
        "Profile loading error:",
        profileError
      );

      return;
    }


    // =================================================
    // الاسم
    // =================================================

    const representativeName =
      profile?.full_name?.trim() ||
      "مندوب المبيعات";


    const sidebarUserName =
      document.getElementById("sidebarUserName");

    const welcomeName =
      document.getElementById("welcomeName");


    if (sidebarUserName) {

      sidebarUserName.textContent =
        representativeName;

    }


    if (welcomeName) {

      welcomeName.textContent =
        representativeName;

    }


    // =================================================
    // الصورة
    // =================================================

    const avatarUrl =
      profile?.avatar_url?.trim();


    const sidebarAvatar =
      document.getElementById("sidebarUserAvatar");

    const headerAvatar =
      document.getElementById("headerUserAvatar");


    // إذا عنده صورة
    if (avatarUrl) {

      setAvatarImage(
        sidebarAvatar,
        avatarUrl,
        representativeName
      );

      setAvatarImage(
        headerAvatar,
        avatarUrl,
        representativeName
      );

    }


  } catch (error) {

    console.error(
      "Representative profile error:",
      error
    );

  }

}


// =====================================================
// وضع صورة المندوب
// =====================================================

function setAvatarImage(
  element,
  imageUrl,
  name
) {
  if (!element) {
    return;
  }

  if (!imageUrl) {
    element.textContent = "Z";
    element.style.backgroundImage = "none";
    return;
  }

  // تنظيف أي محتوى سابق
  element.textContent = "";

  // تثبيت الصورة داخل نفس العنصر
  element.style.backgroundImage =
    `url("${imageUrl}")`;

  element.style.backgroundSize = "cover";
  element.style.backgroundPosition = "center";
  element.style.backgroundRepeat = "no-repeat";

  // منع الصورة من التأثير على حجم العنصر
  element.style.overflow = "hidden";

  // إذا فشل تحميل الصورة
  const testImage = new Image();

  testImage.onload = () => {
    element.style.backgroundImage =
      `url("${imageUrl}")`;
  };

  testImage.onerror = () => {
    element.style.backgroundImage = "none";
    element.textContent = "Z";
  };

  testImage.src = imageUrl;
}


// =====================================================
// تشغيل تحميل بيانات المندوب
// =====================================================

loadRepresentativeProfile();