/* ======================================
   ZAIN SALES - DASHBOARD LOGIC
====================================== */

document.addEventListener("DOMContentLoaded", async () => {

  const user = await requireSubscription();

  if (!user) {
    return;
  }


  /* ======================================
     HELPERS
  ====================================== */

  const moneyFormatter = new Intl.NumberFormat("en-IQ");


  function formatMoney(value) {

    return moneyFormatter.format(
      Number(value) || 0
    );

  }


  function baghdadDate(date = new Date()) {

    return new Intl.DateTimeFormat("sv-SE", {

      timeZone: "Asia/Baghdad",

      year: "numeric",
      month: "2-digit",
      day: "2-digit"

    }).format(date);

  }


  function showDashboardMessage(
    message,
    isError = false
  ) {

    const element =
      document.getElementById(
        "dashboardMessage"
      );

    if (!element) {
      return;
    }

    element.textContent = message;

    element.classList.toggle(
      "error",
      isError
    );

  }


  /* ======================================
     1. DISPLAY CURRENT DATE
  ====================================== */

  function displayCurrentDate() {

    const element =
      document.getElementById(
        "currentDate"
      );

    if (!element) {
      return;
    }


    const date =
      new Intl.DateTimeFormat(
        "ar-IQ",
        {
          timeZone: "Asia/Baghdad",
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        }
      ).format(new Date());


    element.textContent = date;

  }


  /* ======================================
     2. REPRESENTATIVE PROFILE
  ====================================== */

  async function loadRepresentativeProfile(user) {

    try {

      const {
        data: profile,
        error
      } = await supabaseClient
        .from("profiles")
        .select(`
          full_name,
          avatar_url
        `)
        .eq("id", user.id)
        .maybeSingle();


      if (error) {

        console.error(
          "Profile loading error:",
          error
        );

        return;

      }


      const representativeName =
        profile?.full_name?.trim() ||
        user.email?.split("@")[0] ||
        "مندوب المبيعات";


      const sidebarUserName =
        document.getElementById(
          "sidebarUserName"
        );

      const welcomeName =
        document.getElementById(
          "welcomeName"
        );


      if (sidebarUserName) {

        sidebarUserName.textContent =
          representativeName;

      }


      if (welcomeName) {

        welcomeName.textContent =
          representativeName;

      }


      const avatarUrl =
        profile?.avatar_url?.trim();


      const sidebarAvatar =
        document.getElementById(
          "sidebarUserAvatar"
        );

      const headerAvatar =
        document.getElementById(
          "headerUserAvatar"
        );


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

      } else {

        setAvatarFallback(
          sidebarAvatar,
          representativeName
        );

        setAvatarFallback(
          headerAvatar,
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


  /* ======================================
     AVATAR IMAGE
  ====================================== */

  function setAvatarImage(
    element,
    imageUrl,
    name
  ) {

    if (!element) {
      return;
    }


    const testImage =
      new Image();


    testImage.onload = () => {

      element.textContent = "";

      element.style.backgroundImage =
        `url("${imageUrl}")`;

      element.style.backgroundSize =
        "cover";

      element.style.backgroundPosition =
        "center";

      element.style.backgroundRepeat =
        "no-repeat";

      element.style.overflow =
        "hidden";

    };


    testImage.onerror = () => {

      setAvatarFallback(
        element,
        name
      );

    };


    testImage.src = imageUrl;

  }


  /* ======================================
     AVATAR FALLBACK
  ====================================== */

  function setAvatarFallback(
    element,
    name
  ) {

    if (!element) {
      return;
    }


    const firstCharacter =
      String(name || "Z")
        .trim()
        .charAt(0)
        .toUpperCase() || "Z";


    element.style.backgroundImage =
      "none";

    element.textContent =
      firstCharacter;

  }


  /* ======================================
     3. STATISTICS
  ====================================== */

  async function loadStatistics(user) {

    const today =
      baghdadDate();


    const month =
      today.slice(0, 7) +
      "-01";


    const [
      todayResult,
      monthResult,
      debtResult
    ] = await Promise.all([

      supabaseClient
        .from("daily_sales_stats")
        .select(
          "total_lines,total_sales"
        )
        .eq("user_id", user.id)
        .eq("sale_date", today)
        .maybeSingle(),


      supabaseClient
        .from("monthly_sales_stats")
        .select(
          "total_lines"
        )
        .eq("user_id", user.id)
        .eq("month", month)
        .maybeSingle(),


      supabaseClient
        .from("sales_summary")
        .select(
          "remaining_amount"
        )
        .eq("user_id", user.id)
        .gt(
          "remaining_amount",
          0
        )

    ]);


    if (
      todayResult.error ||
      monthResult.error ||
      debtResult.error
    ) {

      console.error(
        "Statistics errors:",
        {
          today: todayResult.error,
          month: monthResult.error,
          debts: debtResult.error
        }
      );


      throw new Error(
        "تعذر تحميل إحصائيات المبيعات."
      );

    }


    const todayData =
      todayResult.data;


    const monthData =
      monthResult.data;


    const debts =
      debtResult.data || [];


    const totalDebts =
      debts.reduce(
        (
          sum,
          sale
        ) => {

          return (
            sum +
            Number(
              sale.remaining_amount || 0
            )
          );

        },
        0
      );


    const todaySales =
      document.getElementById(
        "todaySales"
      );

    const todayRevenue =
      document.getElementById(
        "todayRevenue"
      );

    const monthlySales =
      document.getElementById(
        "monthlySales"
      );

    const totalDebtsElement =
      document.getElementById(
        "totalDebts"
      );


    if (todaySales) {

      todaySales.textContent =
        formatMoney(
          todayData?.total_lines
        );

    }


    if (todayRevenue) {

      todayRevenue.textContent =
        formatMoney(
          todayData?.total_sales
        );

    }


    if (monthlySales) {

      monthlySales.textContent =
        formatMoney(
          monthData?.total_lines
        );

    }


    if (totalDebtsElement) {

      totalDebtsElement.textContent =
        formatMoney(
          totalDebts
        );

    }

  }


  /* ======================================
     4. WEEKLY SALES CHART
  ====================================== */

  async function loadWeeklyChart(user) {

    const chart =
      document.getElementById(
        "salesChart"
      );


    if (!chart) {
      return;
    }


    const today =
      baghdadDate();


    const start =
      new Date(
        today + "T12:00:00Z"
      );


    start.setUTCDate(
      start.getUTCDate() - 6
    );


    const startDate =
      start
        .toISOString()
        .slice(0, 10);


    const {
      data,
      error
    } = await supabaseClient
      .from("daily_sales_stats")
      .select(
        "sale_date,total_lines"
      )
      .eq("user_id", user.id)
      .gte(
        "sale_date",
        startDate
      )
      .lte(
        "sale_date",
        today
      )
      .order(
        "sale_date",
        {
          ascending: true
        }
      );


    if (error) {

      throw new Error(
        "تعذر تحميل مخطط المبيعات."
      );

    }


    const salesMap =
      new Map(
        (data || []).map(
          item => [
            item.sale_date,
            Number(
              item.total_lines
            )
          ]
        )
      );


    const days = [];


    for (
      let i = 0;
      i < 7;
      i++
    ) {

      const date =
        new Date(start);


      date.setUTCDate(
        start.getUTCDate() + i
      );


      const key =
        date
          .toISOString()
          .slice(0, 10);


      const dayName =
        new Intl.DateTimeFormat(
          "ar-IQ",
          {
            weekday: "short",
            timeZone: "UTC"
          }
        ).format(date);


      days.push({

        name: dayName,

        count:
          salesMap.get(key) || 0

      });

    }


    const maxSales =
      Math.max(
        1,
        ...days.map(
          day => day.count
        )
      );


    chart.replaceChildren();


    days.forEach(day => {

      const column =
        document.createElement(
          "div"
        );

      column.className =
        "chart-column";


      const value =
        document.createElement(
          "span"
        );

      value.className =
        "chart-value";

      value.textContent =
        day.count;


      const bar =
        document.createElement(
          "div"
        );

      bar.className =
        "chart-bar";


      const percentage =
        day.count / maxSales;


      bar.style.height =
        `${Math.max(
          3,
          percentage * 180
        )}px`;


      const label =
        document.createElement(
          "span"
        );

      label.className =
        "chart-day";

      label.textContent =
        day.name;


      column.append(
        value,
        bar,
        label
      );


      chart.appendChild(
        column
      );

    });

  }


  /* ======================================
     5. RECENT SALES
  ====================================== */

  async function loadRecentSales(user) {

    const tbody =
      document.getElementById(
        "recentSalesBody"
      );


    if (!tbody) {
      return;
    }


    const {
      data,
      error
    } = await supabaseClient
      .from("sales_summary")
      .select(`
        id,
        customer_name,
        phone_number,
        package_name,
        sale_amount,
        payment_status,
        sale_date,
        created_at
      `)
      .eq(
        "user_id",
        user.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(5);


    if (error) {

      throw new Error(
        "تعذر تحميل آخر عمليات البيع."
      );

    }


    tbody.replaceChildren();


    if (
      !data ||
      data.length === 0
    ) {

      const row =
        document.createElement(
          "tr"
        );


      const cell =
        document.createElement(
          "td"
        );


      cell.colSpan = 6;

      cell.className =
        "empty-table";

      cell.textContent =
        "ماكو مبيعات مسجلة لحد الآن.";


      row.appendChild(
        cell
      );


      tbody.appendChild(
        row
      );


      return;

    }


    const paymentLabels = {

      paid:
        "مدفوع",

      partial:
        "مدفوع جزئياً",

      unpaid:
        "غير مدفوع"

    };


    data.forEach(
      sale => {

        const row =
          document.createElement(
            "tr"
          );


        const values = [

          sale.customer_name,

          sale.phone_number,

          sale.package_name,

          formatMoney(
            sale.sale_amount
          ),

          paymentLabels[
            sale.payment_status
          ] ||
          "غير معروف",

          sale.sale_date

        ];


        values.forEach(
          (
            value,
            index
          ) => {

            const cell =
              document.createElement(
                "td"
              );


            cell.textContent =
              value ?? "";


            if (index === 0) {

              cell.className =
                "customer-name";

            }


            if (index === 1) {

              cell.className =
                "phone-cell";

            }


            if (index === 4) {

              const badge =
                document.createElement(
                  "span"
                );


              badge.className =
                `payment-badge ${
                  sale.payment_status || ""
                }`;


              badge.textContent =
                value;


              cell.replaceChildren(
                badge
              );

            }


            row.appendChild(
              cell
            );

          }
        );


        tbody.appendChild(
          row
        );

      }
    );

  }


  /* ======================================
     6. RECOMMENDATION ENGINE
     STAGE 1 - INTERNAL DATA ONLY
  ====================================== */


  function normalizeArabicText(
    value
  ) {

    return String(
      value || ""
    )
      .trim()
      .replace(
        /\s+/g,
        " "
      )
      .replace(
        /[\u064B-\u065F\u0670]/g,
        ""
      )
      .replace(
        /أ|إ|آ/g,
        "ا"
      )
      .replace(
        /ى/g,
        "ي"
      )
      .replace(
        /ة/g,
        "ه"
      );

  }


  function normalizeRecommendationArea(
    value
  ) {

    let area =
      normalizeArabicText(
        value
      );


    area =
      area.replace(
        /^(حي|منطقه|منطقة|ناحيه|ناحية)\s+/,
        ""
      );


    const aliases = {

      "منصور":
        "المنصور",

      "المنصور":
        "المنصور",

      "اور":
        "أور",

      "أور":
        "أور"

    };


    return (
      aliases[area] ||
      area
    );

  }


  function getRecommendationLevelLabel(
    level
  ) {

    const labels = {

      excellent:
        "فرصة ممتازة",

      very_good:
        "فرصة قوية",

      good:
        "فرصة جيدة",

      average:
        "فرصة متوسطة",

      weak:
        "فرصة ضعيفة"

    };


    return (
      labels[level] ||
      "فرصة بيع"
    );

  }


  function getRecommendationLevelClass(
    level
  ) {

    const classes = {

      excellent:
        "excellent",

      very_good:
        "very-good",

      good:
        "good",

      average:
        "average",

      weak:
        "weak"

    };


    return (
      classes[level] ||
      "average"
    );

  }


  function formatRecommendationHour(
    hour
  ) {

    if (
      hour === null ||
      hour === undefined ||
      hour === ""
    ) {

      return "غير محدد";

    }


    const numericHour =
      Number(hour);


    if (
      Number.isNaN(
        numericHour
      )
    ) {

      return "غير محدد";

    }


    const suffix =
      numericHour >= 12
        ? "م"
        : "ص";


    let displayHour =
      numericHour % 12;


    if (
      displayHour === 0
    ) {

      displayHour = 12;

    }


    return `${displayHour} ${suffix}`;

  }


  function getRecommendationBestDay(
    day
  ) {

    const days = {

      0: "الأحد",

      1: "الاثنين",

      2: "الثلاثاء",

      3: "الأربعاء",

      4: "الخميس",

      5: "الجمعة",

      6: "السبت"

    };


    return (
      days[Number(day)] ||
      "غير محدد"
    );

  }


  function createRecommendationStat(
    label,
    value
  ) {

    const item =
      document.createElement(
        "div"
      );

    item.className =
      "recommendation-stat";


    const valueElement =
      document.createElement(
        "strong"
      );

    valueElement.textContent =
      value;


    const labelElement =
      document.createElement(
        "span"
      );

    labelElement.textContent =
      label;


    item.append(
      valueElement,
      labelElement
    );


    return item;

  }


  function createRecommendationCard(
    recommendation,
    index
  ) {

    const card =
      document.createElement(
        "article"
      );


    const levelClass =
      getRecommendationLevelClass(
        recommendation.recommendation_level
      );


    card.className =
      `recommendation-card ${levelClass}`;


    if (index === 0) {

      card.classList.add(
        "recommendation-primary"
      );

    }


    /* RANK */

    const rank =
      document.createElement(
        "div"
      );

    rank.className =
      "recommendation-rank";

    rank.textContent =
      `0${index + 1}`;


    /* TOP */

    const top =
      document.createElement(
        "div"
      );

    top.className =
      "recommendation-card-top";


    const titleArea =
      document.createElement(
        "div"
      );

    titleArea.className =
      "recommendation-area";


    const areaName =
      document.createElement(
        "h4"
      );

    areaName.textContent =
      normalizeRecommendationArea(
        recommendation.area
      );


    const level =
      document.createElement(
        "span"
      );

    level.className =
      "recommendation-level";

    level.textContent =
      getRecommendationLevelLabel(
        recommendation.recommendation_level
      );


    titleArea.append(
      areaName,
      level
    );


    const score =
      document.createElement(
        "div"
      );

    score.className =
      "recommendation-score";


    const scoreNumber =
      document.createElement(
        "strong"
      );

    scoreNumber.textContent =
      Math.round(
        Number(
          recommendation.opportunity_score
        ) || 0
      );


    const scoreLabel =
      document.createElement(
        "span"
      );

    scoreLabel.textContent =
      "/100";


    score.append(
      scoreNumber,
      scoreLabel
    );


    top.append(
      rank,
      titleArea,
      score
    );


    /* STATS */

    const stats =
      document.createElement(
        "div"
      );

    stats.className =
      "recommendation-stats";


    stats.append(

      createRecommendationStat(
        "مبيعات",
        formatMoney(
          recommendation.total_sales
        )
      ),

      createRecommendationStat(
        "آخر 30 يوم",
        formatMoney(
          recommendation.recent_sales
        )
      ),

      createRecommendationStat(
        "نفس الساعة",
        formatMoney(
          recommendation.same_hour_sales
        )
      )

    );


    /* TIMING */

    const timing =
      document.createElement(
        "div"
      );

    timing.className =
      "recommendation-timing";


    const bestHour =
      document.createElement(
        "span"
      );


    bestHour.textContent =
      `أفضل وقت: ${
        formatRecommendationHour(
          recommendation.best_hour
        )
      }`;


    const bestDay =
      document.createElement(
        "span"
      );


    bestDay.textContent =
      `أفضل يوم: ${
        getRecommendationBestDay(
          recommendation.best_day
        )
      }`;


    timing.append(
      bestHour,
      bestDay
    );


    /* REASON */

    const reason =
      document.createElement(
        "p"
      );

    reason.className =
      "recommendation-reason";

    reason.textContent =
      recommendation.reason ||
      "المنطقة لديها مؤشرات جيدة حسب سجل المبيعات.";


    /* CONFIDENCE */

    const confidence =
      document.createElement(
        "div"
      );

    confidence.className =
      "recommendation-confidence";


    const confidenceHeader =
      document.createElement(
        "div"
      );


    const confidenceLabel =
      document.createElement(
        "span"
      );

    confidenceLabel.textContent =
      "ثقة التوصية";


    const confidenceValue =
      document.createElement(
        "strong"
      );


    const confidenceNumber =
      Math.round(
        Number(
          recommendation.confidence
        ) || 0
      );


    confidenceValue.textContent =
      `${confidenceNumber}%`;


    confidenceHeader.append(
      confidenceLabel,
      confidenceValue
    );


    const confidenceTrack =
      document.createElement(
        "div"
      );

    confidenceTrack.className =
      "recommendation-confidence-track";


    const confidenceBar =
      document.createElement(
        "div"
      );

    confidenceBar.className =
      "recommendation-confidence-bar";


    confidenceBar.style.width =
      `${Math.min(
        100,
        Math.max(
          0,
          confidenceNumber
        )
      )}%`;


    confidenceTrack.appendChild(
      confidenceBar
    );


    confidence.append(
      confidenceHeader,
      confidenceTrack
    );


    card.append(
      top,
      stats,
      timing,
      reason,
      confidence
    );


    return card;

  }


  async function loadRecommendations() {

    const container =
      document.getElementById(
        "recommendationsContainer"
      );


    if (!container) {
      return;
    }


    try {

      const {
        data,
        error
      } = await supabaseClient.rpc(
        "get_sales_opportunities",
        {
          p_hour: null,
          p_day_of_week: null,
          p_limit: 5
        }
      );


      if (error) {

        console.error(
          "Recommendations RPC error:",
          error
        );


        throw new Error(
          "تعذر تحميل اقتراحات المناطق."
        );

      }


      container.replaceChildren();


      if (
        !data ||
        data.length === 0
      ) {

        const empty =
          document.createElement(
            "div"
          );


        empty.className =
          "recommendation-empty";


        empty.textContent =
          "ما عدنا بيانات كافية حتى نقترح وجهة حالياً. سجّل مبيعاتك مع المنطقة والوقت حتى يبدأ النظام بالتعلم.";


        container.appendChild(
          empty
        );


        return;

      }


      const recommendations =
        data.slice(
          0,
          3
        );


      recommendations.forEach(
        (
          recommendation,
          index
        ) => {

          container.appendChild(
            createRecommendationCard(
              recommendation,
              index
            )
          );

        }
      );

    } catch (error) {

      console.error(
        "Recommendation loading error:",
        error
      );


      container.replaceChildren();


      const errorElement =
        document.createElement(
          "div"
        );


      errorElement.className =
        "recommendation-empty error";


      errorElement.textContent =
        "تعذر تحليل وجهات البيع حالياً.";


      container.appendChild(
        errorElement
      );

    }

  }


  /* ======================================
     7. MOBILE SIDEBAR
  ====================================== */

  function initializeSidebar() {

    const sidebar =
      document.getElementById(
        "sidebar"
      );

    const overlay =
      document.getElementById(
        "sidebarOverlay"
      );

    const menuBtn =
      document.getElementById(
        "menuBtn"
      );


    if (
      !sidebar ||
      !overlay ||
      !menuBtn
    ) {

      return;

    }


    function closeSidebar() {

      sidebar.classList.remove(
        "open"
      );

      overlay.classList.remove(
        "show"
      );

      menuBtn.setAttribute(
        "aria-expanded",
        "false"
      );

    }


    menuBtn.addEventListener(
      "click",
      () => {

        const isOpen =
          sidebar.classList.toggle(
            "open"
          );


        overlay.classList.toggle(
          "show",
          isOpen
        );


        menuBtn.setAttribute(
          "aria-expanded",
          String(isOpen)
        );

      }
    );


    overlay.addEventListener(
      "click",
      closeSidebar
    );


    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Escape"
        ) {

          closeSidebar();

        }

      }
    );


    document
      .querySelectorAll(
        ".sidebar-nav a"
      )
      .forEach(
        link => {

          link.addEventListener(
            "click",
            closeSidebar
          );

        }
      );

  }


  /* ======================================
     8. INITIALIZE DASHBOARD
  ====================================== */

  async function initializeDashboard() {

    const currentUser =
      await requireAuth();


    if (!currentUser) {
      return;
    }


    const content =
      document.getElementById(
        "content"
      );


    if (content) {

      content.hidden = false;

    }


    displayCurrentDate();

    initializeSidebar();


    const logoutBtn =
      document.getElementById(
        "logoutBtn"
      );


    if (logoutBtn) {

      logoutBtn.addEventListener(
        "click",
        logout
      );

    }


    /*
      مهم:

      نخلي كل أقسام الداشبورد تشتغل
      بشكل مستقل.

      إذا فشل قسم التوصيات مثلاً،
      ما نخلي باقي الصفحة تتعطل.
    */

    const tasks =
      await Promise.allSettled([

        loadRepresentativeProfile(
          currentUser
        ),

        loadStatistics(
          currentUser
        ),

        loadWeeklyChart(
          currentUser
        ),

        loadRecentSales(
          currentUser
        ),

        loadRecommendations()

      ]);


    const failures =
      tasks.filter(
        task =>
          task.status ===
          "rejected"
      );


    if (
      failures.length > 0
    ) {

      console.error(
        "Dashboard errors:",
        failures
      );


      showDashboardMessage(
        "تعذر تحميل بعض البيانات. حدّث الصفحة وحاول مرة ثانية.",
        true
      );

    } else {

      showDashboardMessage(
        ""
      );

    }

  }


  /* ======================================
     START
  ====================================== */

  initializeDashboard()
    .catch(error => {

      console.error(
        "Dashboard initialization:",
        error
      );


      showDashboardMessage(
        "حدث خطأ أثناء فتح لوحة التحكم.",
        true
      );

    });

});