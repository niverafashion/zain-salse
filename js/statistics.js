/* =====================================
   ZAIN SALES - STATISTICS
===================================== */

document.addEventListener("DOMContentLoaded", async () => {

  const user = await requireSubscription();

  if (!user) return;


  /* =====================================
     HELPERS
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

    const [year, month, day] =
      value.split("-").map(Number);

    return new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12
      )
    );

  }


  function shiftDate(value, days) {

    const date = dateParts(value);

    date.setUTCDate(
      date.getUTCDate() + days
    );

    return date
      .toISOString()
      .slice(0, 10);

  }


  function showStatsMessage(
    text,
    error = false
  ) {

    const element =
      $("statisticsMessage");

    if (!element) return;

    element.textContent = text;

    element.classList.toggle(
      "error",
      error
    );

  }


  function makeElement(
    tag,
    text,
    className = ""
  ) {

    const element =
      document.createElement(tag);

    element.textContent =
      text ?? "";

    if (className) {
      element.className =
        className;
    }

    return element;

  }


  /* =====================================
     DATE PRESETS
  ===================================== */

  function selectPeriod(period) {

    const today =
      dateInBaghdad();

    let from = today;


    if (period === "week") {

      from =
        shiftDate(
          today,
          -6
        );

    }


    if (period === "month") {

      from =
        today.slice(0, 7)
        + "-01";

    }


    if (period === "year") {

      from =
        today.slice(0, 4)
        + "-01-01";

    }


    $("statsDateFrom").value =
      from;

    $("statsDateTo").value =
      today;


    document
      .querySelectorAll(
        ".period-button"
      )
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.period === period
        );

      });

  }


  /* =====================================
     LOAD ALL ROWS
  ===================================== */

  async function fetchAll(
    buildQuery
  ) {

    const result = [];

    const batchSize = 500;

    let offset = 0;


    while (true) {

      const {
        data,
        error
      } =
        await buildQuery()
          .range(
            offset,
            offset + batchSize - 1
          );


      if (error) {
        throw error;
      }


      const rows =
        data || [];


      result.push(
        ...rows
      );


      if (
        rows.length <
        batchSize
      ) {
        break;
      }


      offset +=
        batchSize;

    }


    return result;

  }


  /* =====================================
     LOAD REPORT
  ===================================== */

  async function loadReport() {

    if (statsState.loading) {
      return;
    }


    const from =
      $("statsDateFrom").value;

    const to =
      $("statsDateTo").value;


    if (
      !from ||
      !to ||
      from > to
    ) {

      showStatsMessage(
        "تأكد من اختيار فترة زمنية صحيحة.",
        true
      );

      return;

    }


    statsState.loading =
      true;


    $("applyStatsFilter")
      .disabled = true;


    showStatsMessage(
      "جاري تحميل التقرير..."
    );


    try {

      /*
        وقت الدفعات حسب توقيت بغداد
      */

      const paymentFrom =
        `${from}T00:00:00+03:00`;


      const paymentUntil =
        `${shiftDate(
          to,
          1
        )}T00:00:00+03:00`;


      const [
        sales,
        payments
      ] =
        await Promise.all([


          /* SALES */

          fetchAll(() =>

            supabaseClient
              .from("sales_summary")
              .select(`
                id,
                sale_date,
                sale_time,
                sale_area,
                package_id,
                package_name,
                sale_amount,
                received_amount,
                remaining_amount,
                payment_status
              `)
              .eq(
                "user_id",
                statsState.user.id
              )
              .gte(
                "sale_date",
                from
              )
              .lte(
                "sale_date",
                to
              )
              .order(
                "sale_date"
              )
              .order("id")

          ),


          /* PAYMENTS */

          fetchAll(() =>

            supabaseClient
              .from("payments")
              .select(`
                id,
                amount,
                paid_at
              `)
              .eq(
                "user_id",
                statsState.user.id
              )
              .is(
                "voided_at",
                null
              )
              .gte(
                "paid_at",
                paymentFrom
              )
              .lt(
                "paid_at",
                paymentUntil
              )
              .order(
                "paid_at"
              )
              .order("id")

          )

        ]);


      renderReport(
        sales,
        payments,
        from,
        to
      );


      showStatsMessage("");


    } catch (error) {

      console.error(
        "Statistics error:",
        error
      );


      showStatsMessage(
        "تعذر تحميل التقرير. تأكد من الاتصال وصلاحيات قاعدة البيانات.",
        true
      );


    } finally {

      statsState.loading =
        false;

      $("applyStatsFilter")
        .disabled = false;

    }

  }


  /* =====================================
     REPORT CALCULATIONS
  ===================================== */

  function renderReport(
    sales,
    payments,
    from,
    to
  ) {


    /*
      إجمالي قيمة المبيعات
    */

    const salesValue =
      sales.reduce(
        (sum, sale) =>
          sum +
          Number(
            sale.sale_amount || 0
          ),
        0
      );


    /*
      إجمالي المقبوضات
    */

    const receiptsValue =
      payments.reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0
          ),
        0
      );


    /*
      إجمالي الدين
    */

    const debtsValue =
      sales.reduce(
        (sum, sale) =>
          sum +
          Number(
            sale.remaining_amount || 0
          ),
        0
      );


    $("statsSalesCount")
      .textContent =
      number(
        sales.length
      );


    $("statsSalesValue")
      .textContent =
      number(
        salesValue
      );


    $("statsReceipts")
      .textContent =
      number(
        receiptsValue
      );


    $("statsDebts")
      .textContent =
      number(
        debtsValue
      );


    /*
      التحليلات القديمة
    */

    renderPackageBreakdown(
      sales
    );


    renderPaymentBreakdown(
      sales
    );


    renderDailyReport(
      sales,
      payments,
      from,
      to
    );


    /*
      التحليلات الجديدة
    */

    renderTimeAnalysis(
      sales
    );


    renderAreaAnalysis(
      sales
    );


    renderAreaTimeAnalysis(
      sales
    );

  }


  /* =====================================
     PACKAGE BREAKDOWN
  ===================================== */

  function renderPackageBreakdown(
    sales
  ) {

    const container =
      $("packageBreakdown");

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


    const packages =
      new Map();


    sales.forEach(
      sale => {

        const name =
          sale.package_name
          || "باقة أخرى";


        const current =
          packages.get(name)
          || {
            count: 0,
            value: 0
          };


        current.count++;


        current.value +=
          Number(
            sale.sale_amount || 0
          );


        packages.set(
          name,
          current
        );

      }
    );


    const sorted =
      [...packages.entries()]
        .sort(
          (a, b) =>
            b[1].count -
            a[1].count
        );


    sorted.forEach(
      ([name, data]) => {

        const percentage =
          sales.length
            ? (
              data.count /
              sales.length
            ) * 100
            : 0;


        const item =
          makeElement(
            "div",
            "",
            "stats-breakdown-item"
          );


        const heading =
          makeElement(
            "div",
            "",
            "stats-breakdown-heading"
          );


        heading.append(

          makeElement(
            "strong",
            name
          ),

          makeElement(
            "span",
            `${number(data.count)} خط`
          )

        );


        const track =
          makeElement(
            "div",
            "",
            "stats-progress-track"
          );


        const fill =
          makeElement(
            "div",
            "",
            "stats-progress-fill"
          );


        fill.style.width =
          `${percentage}%`;


        track.appendChild(
          fill
        );


        item.append(

          heading,

          track,

          makeElement(
            "small",
            `${number(
              data.value
            )} د.ع · ${percentage.toFixed(1)}%`
          )

        );


        container.appendChild(
          item
        );

      }
    );

  }


  /* =====================================
     PAYMENT STATUS
  ===================================== */

  function renderPaymentBreakdown(
    sales
  ) {

    const container =
      $("paymentBreakdown");

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


    categories.forEach(
      category => {

        const count =
          sales.filter(
            sale =>
              sale.payment_status ===
              category.status
          ).length;


        const percentage =
          sales.length
            ? (
              count /
              sales.length
            ) * 100
            : 0;


        const item =
          makeElement(
            "div",
            "",
            "stats-payment-item"
          );


        const heading =
          makeElement(
            "div",
            "",
            "stats-breakdown-heading"
          );


        const label =
          makeElement(
            "span",
            category.label,
            `stats-payment-label ${category.color}`
          );


        heading.append(

          label,

          makeElement(
            "strong",
            `${number(
              count
            )} (${percentage.toFixed(1)}%)`
          )

        );


        const track =
          makeElement(
            "div",
            "",
            "stats-progress-track"
          );


        const fill =
          makeElement(
            "div",
            "",
            `stats-progress-fill ${category.color}`
          );


        fill.style.width =
          `${percentage}%`;


        track.appendChild(
          fill
        );


        item.append(
          heading,
          track
        );


        container.appendChild(
          item
        );

      }
    );

  }


  /* =====================================
     DAILY REPORT
  ===================================== */

  function renderDailyReport(
    sales,
    payments,
    from,
    to
  ) {

    const daily =
      new Map();


    function getDay(date) {

      if (!daily.has(date)) {

        daily.set(
          date,
          {
            date,
            count: 0,
            salesValue: 0,
            receipts: 0
          }
        );

      }


      return daily.get(date);

    }


    sales.forEach(
      sale => {

        const day =
          getDay(
            sale.sale_date
          );


        day.count++;


        day.salesValue +=
          Number(
            sale.sale_amount || 0
          );

      }
    );


    payments.forEach(
      payment => {

        const date =
          dateInBaghdad(
            new Date(
              payment.paid_at
            )
          );


        const day =
          getDay(date);


        day.receipts +=
          Number(
            payment.amount || 0
          );

      }
    );


    /*
      إضافة الأيام الفارغة
    */

    let current =
      from;


    while (
      current <= to
    ) {

      getDay(current);

      current =
        shiftDate(
          current,
          1
        );

    }


    const days =
      [...daily.values()]
        .sort(
          (a, b) =>
            a.date.localeCompare(
              b.date
            )
        );


    renderDailyTable(
      days
    );


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


  /* =====================================
     BAR CHART
  ===================================== */

  function renderBarChart(
    containerId,
    days,
    valueKey,
    currency
  ) {

    const container =
      $(containerId);


    container.replaceChildren();


    if (!days.length) {
      return;
    }


    /*
      الفترات الطويلة تتحول
      إلى تحليل شهري للمخطط
    */

    let points =
      days;


    if (days.length > 45) {

      const monthly =
        new Map();


      days.forEach(
        day => {

          const key =
            day.date.slice(
              0,
              7
            );


          if (!monthly.has(key)) {

            monthly.set(
              key,
              {
                date: key,
                count: 0,
                receipts: 0
              }
            );

          }


          const month =
            monthly.get(key);


          month.count +=
            day.count;


          month.receipts +=
            day.receipts;

        }
      );


      points =
        [...monthly.values()];

    }


    const chartMax =
      Math.max(
        1,
        ...points.map(
          point =>
            Number(
              point[valueKey]
            ) || 0
        )
      );


    points.forEach(
      point => {

        const column =
          makeElement(
            "div",
            "",
            "stats-chart-column"
          );


        const value =
          Number(
            point[valueKey]
          ) || 0;


        const valueLabel =
          makeElement(
            "span",
            number(value),
            "stats-chart-value"
          );


        const bar =
          makeElement(
            "div",
            "",
            currency
              ? "stats-chart-bar receipt"
              : "stats-chart-bar"
          );


        bar.style.height =
          `${Math.max(
            3,
            value /
              chartMax *
              190
          )}px`;


        bar.title =
          currency
            ? `${point.date}: ${number(value)} د.ع`
            : `${point.date}: ${number(value)} خط`;


        const label =
          makeElement(
            "span",
            points.length > 45
              ? point.date
              : point.date.slice(5),
            "stats-chart-label"
          );


        column.append(
          valueLabel,
          bar,
          label
        );


        container.appendChild(
          column
        );

      }
    );

  }


  /* =====================================
     DAILY TABLE
  ===================================== */

  function renderDailyTable(
    days
  ) {

    const tbody =
      $("dailyStatsBody");


    tbody.replaceChildren();


    if (!days.length) {

      const tr =
        document.createElement(
          "tr"
        );


      const td =
        makeElement(
          "td",
          "ماكو بيانات خلال الفترة المحددة.",
          "empty-table"
        );


      td.colSpan = 4;


      tr.appendChild(td);


      tbody.appendChild(tr);


      return;

    }


    /*
      الأحدث أولاً
    */

    [...days]
      .reverse()
      .forEach(
        day => {

          const tr =
            document.createElement(
              "tr"
            );


          [

            day.date,

            number(
              day.count
            ),

            number(
              day.salesValue
            ),

            number(
              day.receipts
            )

          ].forEach(
            value => {

              tr.appendChild(
                makeElement(
                  "td",
                  value
                )
              );

            }
          );


          tbody.appendChild(
            tr
          );

        }
      );

  }


  /* =====================================
     TIME ANALYSIS
  ===================================== */

  function renderTimeAnalysis(
    sales
  ) {

    const hourCounts =
      new Map();


    for (
      let hour = 0;
      hour < 24;
      hour++
    ) {

      hourCounts.set(
        hour,
        0
      );

    }


    const weekdayCounts =
      new Map();


    const weekdayNames = [

      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت"

    ];


    weekdayNames.forEach(
      day => {

        weekdayCounts.set(
          day,
          0
        );

      }
    );


    /*
      الفترات الزمنية
    */

    const periodCounts = {

      "صباحاً": 0,
      "ظهراً": 0,
      "مساءً": 0,
      "ليلاً": 0

    };


    sales.forEach(
      sale => {

        /*
          تحليل الساعة
        */

        const hour =
          getSaleHour(
            sale.sale_time
          );


        if (
          hour !== null
        ) {

          hourCounts.set(
            hour,
            (
              hourCounts.get(hour)
              || 0
            ) + 1
          );


          const period =
            getTimePeriod(
              hour
            );


          periodCounts[period]++;

        }


        /*
          تحليل يوم الأسبوع
        */

        if (sale.sale_date) {

          const date =
            dateParts(
              sale.sale_date
            );


          const dayIndex =
            date.getUTCDay();


          const dayName =
            weekdayNames[
              dayIndex
            ];


          weekdayCounts.set(
            dayName,
            (
              weekdayCounts.get(
                dayName
              ) || 0
            ) + 1
          );

        }

      }
    );


    /*
      أفضل ساعة
    */

    const bestHour =
      [...hourCounts.entries()]
        .sort(
          (a, b) =>
            b[1] - a[1]
        )[0];


    /*
      أفضل يوم
    */

    const bestDay =
      [...weekdayCounts.entries()]
        .sort(
          (a, b) =>
            b[1] - a[1]
        )[0];


    /*
      أفضل فترة
    */

    const bestPeriod =
      [...Object.entries(
        periodCounts
      )]
        .sort(
          (a, b) =>
            b[1] - a[1]
        )[0];


    if (
      bestHour &&
      bestHour[1] > 0
    ) {

      $("bestSaleHour")
        .textContent =
        formatHour(
          bestHour[0]
        );

    } else {

      $("bestSaleHour")
        .textContent =
        "لا توجد بيانات";

    }


    if (
      bestDay &&
      bestDay[1] > 0
    ) {

      $("bestSaleDay")
        .textContent =
        bestDay[0];

    } else {

      $("bestSaleDay")
        .textContent =
        "لا توجد بيانات";

    }


    if (
      bestPeriod &&
      bestPeriod[1] > 0
    ) {

      $("bestSalePeriod")
        .textContent =
        bestPeriod[0];

    } else {

      $("bestSalePeriod")
        .textContent =
        "لا توجد بيانات";

    }


    renderHourBars(
      hourCounts
    );


    renderWeekdayBars(
      weekdayCounts
    );

  }


  /* =====================================
     SALE HOUR
  ===================================== */

  function getSaleHour(
    saleTime
  ) {

    if (
      !saleTime
    ) {
      return null;
    }


    /*
      يدعم:
      17:30
      17:30:00
      17:30:00+03:00
    */

    const match =
      String(
        saleTime
      ).match(
        /^(\d{1,2})/
      );


    if (!match) {
      return null;
    }


    const hour =
      Number(
        match[1]
      );


    if (
      hour < 0 ||
      hour > 23
    ) {

      return null;

    }


    return hour;

  }


  /* =====================================
     TIME PERIOD
  ===================================== */

  function getTimePeriod(
    hour
  ) {

    if (
      hour >= 5 &&
      hour < 12
    ) {

      return "صباحاً";

    }


    if (
      hour >= 12 &&
      hour < 17
    ) {

      return "ظهراً";

    }


    if (
      hour >= 17 &&
      hour < 22
    ) {

      return "مساءً";

    }


    return "ليلاً";

  }


  /* =====================================
     FORMAT HOUR
  ===================================== */

  function formatHour(
    hour
  ) {

    const h =
      Number(hour);


    if (h === 0) {
      return "12:00 AM";
    }


    if (h === 12) {
      return "12:00 PM";
    }


    if (h < 12) {

      return `${String(h).padStart(2, "0")}:00 AM`;

    }


    return `${String(h - 12).padStart(2, "0")}:00 PM`;

  }


  /* =====================================
     HOUR BARS
  ===================================== */

  function renderHourBars(
    hourCounts
  ) {

    const container =
      $("hourAnalysis");


    container.replaceChildren();


    const max =
      Math.max(
        1,
        ...hourCounts.values()
      );


    hourCounts.forEach(
      (count, hour) => {

        /*
          كل الساعات تظهر حتى تكون
          الصورة واضحة للمندوب.
        */

        const item =
          makeElement(
            "div",
            "",
            "analytics-bar-item"
          );


        const top =
          makeElement(
            "div",
            "",
            "analytics-bar-top"
          );


        top.append(

          makeElement(
            "span",
            formatHourShort(
              hour
            )
          ),

          makeElement(
            "strong",
            number(count)
          )

        );


        const track =
          makeElement(
            "div",
            "",
            "analytics-bar-track"
          );


        const fill =
          makeElement(
            "div",
            "",
            "analytics-bar-fill"
          );


        fill.style.width =
          `${Math.max(
            count > 0
              ? 5
              : 0,
            count /
              max *
              100
          )}%`;


        track.appendChild(
          fill
        );


        item.append(
          top,
          track
        );


        container.appendChild(
          item
        );

      }
    );

  }


  /* =====================================
     SHORT HOUR
  ===================================== */

  function formatHourShort(
    hour
  ) {

    const h =
      Number(hour);


    if (h === 0) {
      return "12:00 AM";
    }


    if (h === 12) {
      return "12:00 PM";
    }


    if (h < 12) {

      return `${String(h).padStart(2, "0")}:00 AM`;

    }


    return `${String(h - 12).padStart(2, "0")}:00 PM`;

  }


  /* =====================================
     WEEKDAY BARS
  ===================================== */

  function renderWeekdayBars(
    weekdayCounts
  ) {

    const container =
      $("weekdayAnalysis");


    container.replaceChildren();


    const max =
      Math.max(
        1,
        ...weekdayCounts.values()
      );


    weekdayCounts.forEach(
      (count, day) => {

        const item =
          makeElement(
            "div",
            "",
            "analytics-bar-item"
          );


        const top =
          makeElement(
            "div",
            "",
            "analytics-bar-top"
          );


        top.append(

          makeElement(
            "span",
            day
          ),

          makeElement(
            "strong",
            number(count)
          )

        );


        const track =
          makeElement(
            "div",
            "",
            "analytics-bar-track"
          );


        const fill =
          makeElement(
            "div",
            "",
            "analytics-bar-fill weekday-fill"
          );


        fill.style.width =
          `${Math.max(
            count > 0
              ? 5
              : 0,
            count /
              max *
              100
          )}%`;


        track.appendChild(
          fill
        );


        item.append(
          top,
          track
        );


        container.appendChild(
          item
        );

      }
    );

  }


  /* =====================================
     AREA ANALYSIS
  ===================================== */

  function renderAreaAnalysis(
    sales
  ) {

    const container =
      $("areaAnalysis");


    container.replaceChildren();


    /*
      فقط المبيعات التي عندها منطقة
    */

    const areas =
      new Map();


    sales.forEach(
      sale => {

        const area =
          normalizeArea(
            sale.sale_area
          );


        if (!area) {
          return;
        }


        const current =
          areas.get(area)
          || {
            count: 0,
            value: 0
          };


        current.count++;


        current.value +=
          Number(
            sale.sale_amount || 0
          );


        areas.set(
          area,
          current
        );

      }
    );


    if (!areas.size) {

      container.appendChild(

        makeElement(
          "div",
          "ماكو بيانات مناطق ضمن الفترة المحددة.",
          "stats-empty"
        )

      );


      $("bestSaleArea")
        .textContent =
        "لا توجد بيانات";


      $("bestAreaSalesCount")
        .textContent =
        "—";


      $("bestAreaSalesValue")
        .textContent =
        "—";


      return;

    }


    const sorted =
      [...areas.entries()]
        .sort(
          (a, b) =>
            b[1].count -
            a[1].count
        );


    const best =
      sorted[0];


    /*
      أفضل منطقة
    */

    $("bestSaleArea")
      .textContent =
      best[0];


    $("bestAreaSalesCount")
      .textContent =
      number(
        best[1].count
      );


    $("bestAreaSalesValue")
      .textContent =
      `${number(
        best[1].value
      )} د.ع`;


    const max =
      best[1].count;


    /*
      عرض المناطق
    */

    sorted.forEach(
      ([area, data], index) => {

        const percentage =
          data.count /
          max *
          100;


        const item =
          makeElement(
            "div",
            "",
            "area-analysis-item"
          );


        const header =
          makeElement(
            "div",
            "",
            "area-analysis-header"
          );


        const right =
          makeElement(
            "div",
            "",
            "area-analysis-name"
          );


        right.append(

          makeElement(
            "span",
            String(
              index + 1
            ),
            "area-rank"
          ),

          makeElement(
            "strong",
            area
          )

        );


        const count =
          makeElement(
            "span",
            `${number(
              data.count
            )} عملية`,
            "area-analysis-count"
          );


        header.append(
          right,
          count
        );


        const track =
          makeElement(
            "div",
            "",
            "stats-progress-track"
          );


        const fill =
          makeElement(
            "div",
            "",
            "stats-progress-fill area-fill"
          );


        fill.style.width =
          `${percentage}%`;


        track.appendChild(
          fill
        );


        const footer =
          makeElement(
            "small",
            `${number(
              data.value
            )} د.ع`,
            "area-analysis-value"
          );


        item.append(
          header,
          track,
          footer
        );


        container.appendChild(
          item
        );

      }
    );

  }


  /* =====================================
     NORMALIZE AREA
  ===================================== */

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


  function normalizeArea(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }


    let area =
      normalizeArabicText(
        value
      );


    /*
      إزالة كلمات بداية الاسم
      التي لا تغيّر المنطقة فعلياً.
    */

    area =
      area.replace(
        /^(حي|منطقه|منطقة|ناحيه|ناحية)\s+/,
        ""
      );


    /*
      أسماء المناطق المعروفة.
      نقدر نوسعها مستقبلاً بسهولة.
    */

    const aliases = {

      "منصور":
        "المنصور",

      "المنصور":
        "المنصور",

      "حي المنصور":
        "المنصور",

      "اور":
        "أور",

      "أور":
        "أور",

      "حي اور":
        "أور",

      "حي أور":
        "أور"

    };


    /*
      بعد إزالة البادئة، نبحث
      مرة ثانية عن الاسم الموحد.
    */

    const normalizedAliases = {

      "منصور":
        "المنصور",

      "المنصور":
        "المنصور",

      "اور":
        "أور",

      "أور":
        "أور"

    };


    if (
      normalizedAliases[area]
    ) {

      return normalizedAliases[area];

    }


    /*
      تنظيف إضافي للنص.
    */

    area =
      area
        .replace(
          /^حي\s+/,
          ""
        )
        .trim();


    if (
      normalizedAliases[area]
    ) {

      return normalizedAliases[area];

    }


    /*
      إذا ما كان الاسم ضمن
      القائمة، نرجعه بعد التنظيف
      بدون تغيير جوهري.
    */

    return area;

  }


  /* =====================================
     AREA + TIME ANALYSIS
  ===================================== */

  function renderAreaTimeAnalysis(
    sales
  ) {

    const tbody =
      $("areaTimeAnalysisBody");


    tbody.replaceChildren();


    const areas =
      new Map();


    sales.forEach(
      sale => {

        const area =
          normalizeArea(
            sale.sale_area
          );


        if (!area) {
          return;
        }


        if (!areas.has(area)) {

          areas.set(
            area,
            {
              count: 0,
              value: 0,
              hours: new Map()
            }
          );

        }


        const data =
          areas.get(area);


        data.count++;


        data.value +=
          Number(
            sale.sale_amount || 0
          );


        const hour =
          getSaleHour(
            sale.sale_time
          );


        if (
          hour !== null
        ) {

          data.hours.set(
            hour,
            (
              data.hours.get(hour)
              || 0
            ) + 1
          );

        }

      }
    );


    if (!areas.size) {

      const tr =
        document.createElement(
          "tr"
        );


      const td =
        makeElement(
          "td",
          "ماكو بيانات كافية لتحليل المناطق والأوقات.",
          "empty-table"
        );


      td.colSpan = 4;


      tr.appendChild(td);


      tbody.appendChild(tr);


      return;

    }


    const sorted =
      [...areas.entries()]
        .sort(
          (a, b) =>
            b[1].count -
            a[1].count
        );


    sorted.forEach(
      ([area, data]) => {

        const bestHour =
          [...data.hours.entries()]
            .sort(
              (a, b) =>
                b[1] -
                a[1]
            )[0];


        const tr =
          document.createElement(
            "tr"
          );


        const bestTime =
          bestHour &&
          bestHour[1] > 0

            ? formatHour(
                bestHour[0]
              )

            : "لا توجد بيانات";


        const values = [

          area,

          number(
            data.count
          ),

          bestTime,

          `${number(
            data.value
          )} د.ع`

        ];


        values.forEach(
          value => {

            tr.appendChild(
              makeElement(
                "td",
                value
              )
            );

          }
        );


        tbody.appendChild(
          tr
        );

      }
    );

  }


  /* =====================================
     ANALYTICS TABS
  ===================================== */

  function initializeAnalyticsTabs() {

    const tabs =
      document.querySelectorAll(
        ".statistics-tab"
      );


    const contents =
      document.querySelectorAll(
        ".statistics-tab-content"
      );


    if (
      !tabs.length ||
      !contents.length
    ) {

      return;

    }


    function activateTab(
      tabName
    ) {

      tabs.forEach(
        tab => {

          const active =
            tab.dataset.analyticsTab ===
            tabName;


          tab.classList.toggle(
            "active",
            active
          );


          tab.setAttribute(
            "aria-selected",
            String(active)
          );

        }
      );


      contents.forEach(
        content => {

          const active =
            content.dataset.analyticsContent ===
            tabName;


          content.classList.toggle(
            "active",
            active
          );


          content.hidden =
            !active;

        }
      );

    }


    tabs.forEach(
      tab => {

        tab.addEventListener(
          "click",
          () => {

            activateTab(
              tab.dataset.analyticsTab
            );

          }
        );

      }
    );


    /*
      نضمن أن أول تبويب هو
      الظاهر عند فتح الصفحة.
    */

    const initialTab =
      document.querySelector(
        ".statistics-tab.active"
      );


    activateTab(
      initialTab?.dataset.analyticsTab
      || "sales"
    );

  }


  /* =====================================
     MOBILE SIDEBAR
  ===================================== */

  function initializeSidebar() {

    const sidebar =
      $("sidebar");

    const overlay =
      $("sidebarOverlay");

    const button =
      $("menuBtn");


    if (
      !sidebar ||
      !overlay ||
      !button
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

      button.setAttribute(
        "aria-expanded",
        "false"
      );

    }


    button.addEventListener(
      "click",
      () => {

        const open =
          sidebar.classList.toggle(
            "open"
          );


        overlay.classList.toggle(
          "show",
          open
        );


        button.setAttribute(
          "aria-expanded",
          String(open)
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
          event.key ===
          "Escape"
        ) {

          closeSidebar();

        }

      }
    );

  }


  /* =====================================
     INITIALIZATION
  ===================================== */

  async function initializeStatistics() {

    /*
      requireSubscription
      تم تنفيذه بالأعلى قبل الدخول
    */

    const currentUser =
      await requireAuth();


    if (!currentUser) {
      return;
    }


    statsState.user =
      currentUser;


    $("content").hidden =
      false;


    initializeSidebar();


    /*
      Analytics Tabs
    */

    initializeAnalyticsTabs();
initializeStatisticsNavigation();

    /*
      Logout
    */

    $("logoutBtn")
      .addEventListener(
        "click",
        logout
      );


    /*
      Current date
    */

    $("currentDate")
      .textContent =

      new Intl.DateTimeFormat(
        "ar-IQ",
        {
          timeZone:
            "Asia/Baghdad",

          weekday:
            "long",

          day:
            "numeric",

          month:
            "long",

          year:
            "numeric"
        }
      ).format(
        new Date()
      );


    /*
      Profile
    */

    const {
      data: profile
    } = await supabaseClient

      .from("profiles")

      .select(`
        full_name,
        avatar_url
      `)

      .eq(
        "id",
        currentUser.id
      )

      .maybeSingle();


    $("sidebarUserName")
      .textContent =

      profile?.full_name?.trim()
      ||
      currentUser.email
        ?.split("@")[0]
      ||
      "مندوب المبيعات";


    /*
      Avatar
    */

    setStatisticsAvatar(
      $("sidebarUserAvatar"),
      profile?.avatar_url,
      profile?.full_name
    );


    setStatisticsAvatar(
      $("headerUserAvatar"),
      profile?.avatar_url,
      profile?.full_name
    );


    /*
      Period buttons
    */

    document
      .querySelectorAll(
        ".period-button"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              selectPeriod(
                button.dataset.period
              );


              loadReport();

            }
          );

        }
      );


    /*
      Custom date form
    */

    $("statisticsFilterForm")
      .addEventListener(
        "submit",
        event => {

          event.preventDefault();


          document
            .querySelectorAll(
              ".period-button"
            )
            .forEach(
              button => {

                button.classList.remove(
                  "active"
                );

              }
            );


          loadReport();

        }
      );


    /*
      Print
    */

    $("printReport")
      .addEventListener(
        "click",
        () => {
          window.print();
        }
      );


    /*
      Default period
    */

    selectPeriod(
      "month"
    );


    await loadReport();

  }


  /* =====================================
     STATISTICS AVATAR
  ===================================== */

  function setStatisticsAvatar(
    element,
    imageUrl,
    name
  ) {

    if (!element) {
      return;
    }


    if (!imageUrl) {

      element.textContent =
        getInitial(
          name
        );


      element.style.backgroundImage =
        "none";


      return;

    }


    element.textContent =
      "";


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


    const testImage =
      new Image();


    testImage.onload = () => {

      element.style.backgroundImage =
        `url("${imageUrl}")`;

    };


    testImage.onerror = () => {

      element.style.backgroundImage =
        "none";


      element.textContent =
        getInitial(
          name
        );

    };


    testImage.src =
      imageUrl;

  }


  /* =====================================
     INITIAL LETTER
  ===================================== */

  function getInitial(
    name
  ) {

    const value =
      String(
        name || ""
      ).trim();


    if (!value) {
      return "Z";
    }


    return value.charAt(0);

  }


  /* =====================================
     START
  ===================================== */

  initializeStatistics()
    .catch(
      error => {

        console.error(
          error
        );


        showStatsMessage(
          "تعذر فتح صفحة الإحصائيات.",
          true
        );

      }
    );

});
function initializeStatisticsNavigation() {

  /* ======================================
     ELEMENTS
  ====================================== */

  const tabs = [
    ...document.querySelectorAll(".statistics-tab")
  ];

  const tabsScroll =
    document.getElementById("statisticsTabsScroll");

  const prevButton =
    document.getElementById("statisticsTabsPrev");

  const nextButton =
    document.getElementById("statisticsTabsNext");

  const scrollTopButton =
    document.getElementById("scrollToTopBtn");


  /* ======================================
     TABS NAVIGATION
  ====================================== */

  if (tabs.length) {

    function getActiveIndex() {

      const index =
        tabs.findIndex(
          tab =>
            tab.classList.contains("active")
        );

      return index >= 0
        ? index
        : 0;

    }


    function updateArrowState() {

      const activeIndex =
        getActiveIndex();


      if (prevButton) {

        prevButton.classList.toggle(
          "disabled",
          activeIndex <= 0
        );

      }


      if (nextButton) {

        nextButton.classList.toggle(
          "disabled",
          activeIndex >= tabs.length - 1
        );

      }

    }


    function activateTabByIndex(
      index
    ) {

      if (!tabs.length) {
        return;
      }


      const safeIndex =
        Math.max(
          0,
          Math.min(
            index,
            tabs.length - 1
          )
        );


      /*
        إذا ضغطنا على السهم،
        نستخدم نفس نظام التبويبات
        الموجود عندك.
      */

      tabs[safeIndex].click();


      /*
        نخلي التبويب المختار
        واضح للمستخدم.
      */

      tabs[safeIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });


      updateArrowState();

    }


    /*
      إذا المستخدم ضغط على أحد
      الأقسام مباشرة، نحدث حالة الأسهم.
    */

    tabs.forEach(
      tab => {

        tab.addEventListener(
          "click",
          () => {

            requestAnimationFrame(
              updateArrowState
            );

          }
        );

      }
    );


    /*
      القسم السابق
    */

    if (prevButton) {

      prevButton.addEventListener(
        "click",
        () => {

          const activeIndex =
            getActiveIndex();


          if (activeIndex > 0) {

            activateTabByIndex(
              activeIndex - 1
            );

          }

        }
      );

    }


    /*
      القسم التالي
    */

    if (nextButton) {

      nextButton.addEventListener(
        "click",
        () => {

          const activeIndex =
            getActiveIndex();


          if (
            activeIndex <
            tabs.length - 1
          ) {

            activateTabByIndex(
              activeIndex + 1
            );

          }

        }
      );

    }


    /*
      الحالة الأولى للأسهم
    */

    updateArrowState();

  }


  /* ======================================
     SCROLL TO TOP
  ====================================== */

  if (scrollTopButton) {

    function updateScrollTopButton() {

      const shouldShow =
        window.scrollY > 350;


      scrollTopButton.classList.toggle(
        "show",
        shouldShow
      );

    }


    window.addEventListener(
      "scroll",
      updateScrollTopButton,
      {
        passive: true
      }
    );


    scrollTopButton.addEventListener(
      "click",
      () => {

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }
    );


    /*
      فحص أولي عند فتح الصفحة
    */

    updateScrollTopButton();

  }

}
