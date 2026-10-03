let allRequests = [];

let currentFilter = "all";

let currentSearch = "";


/* =====================================================
   تشغيل لوحة الإدارة
   ===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    try {

      const user =
        await requireAuth();

      if (!user) {
        return;
      }


      const isAdmin =
        await checkAdmin();


      if (!isAdmin) {

        window.location.replace(
          "dashboard.html"
        );

        return;
      }


      setupLogout();

      setupFilters();

      setupSearch();

      await loadRequests();


    } catch (error) {

      console.error(
        "Admin initialization error:",
        error
      );


      showMessage(
        error.message ||
        "حدث خطأ أثناء تحميل لوحة الإدارة.",
        "error"
      );

    }

  }
);


/* =====================================================
   التحقق من الأدمن
   ===================================================== */

async function checkAdmin() {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "is_admin"
  );


  if (error) {

    console.error(
      "Admin check error:",
      error
    );


    throw new Error(
      "تعذر التحقق من صلاحيات الإدارة."
    );

  }


  return data === true;

}


/* =====================================================
   تسجيل الخروج
   ===================================================== */

function setupLogout() {

  const logoutBtn =
    document.getElementById(
      "logoutBtn"
    );


  if (!logoutBtn) {
    return;
  }


  logoutBtn.addEventListener(
    "click",
    async () => {

      logoutBtn.disabled = true;

      await logout();

    }
  );

}


/* =====================================================
   تحميل الطلبات
   ===================================================== */

async function loadRequests() {

  const container =
    document.getElementById(
      "requestsContainer"
    );


  if (!container) {
    return;
  }


  container.className =
    "loading";


  container.innerHTML =
    "جاري تحميل الطلبات...";


  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_admin_subscription_requests"
  );


  if (error) {

    console.error(
      "Load requests error:",
      error
    );


    container.className =
      "empty-state";


    container.innerHTML = `

      <div class="empty-state-icon">
        ⚠️
      </div>

      <div>
        تعذر تحميل طلبات الاشتراك.
      </div>

    `;


    showMessage(
      error.message ||
      "حدث خطأ أثناء تحميل الطلبات.",
      "error"
    );


    return;
  }


  allRequests =
    Array.isArray(data)
      ? data
      : [];


  updateStatistics(
    allRequests
  );


  updateFilterCounts(
    allRequests
  );


  applyFilters();

}


/* =====================================================
   الإحصائيات
   ===================================================== */

function updateStatistics(
  requests
) {

  const pendingRequests =
    requests.filter(
      request =>
        request.status === "pending"
    );


  const pendingCount =
    document.getElementById(
      "pendingCount"
    );


  const totalCount =
    document.getElementById(
      "totalCount"
    );


  const pendingAmount =
    document.getElementById(
      "pendingAmount"
    );


  if (pendingCount) {

    pendingCount.textContent =
      pendingRequests.length
        .toLocaleString("en-US");

  }


  if (totalCount) {

    totalCount.textContent =
      requests.length
        .toLocaleString("en-US");

  }


  if (pendingAmount) {

    const amount =
      pendingRequests.reduce(
        (
          total,
          request
        ) => {

          return (
            total +
            Number(
              request.amount || 0
            )
          );

        },
        0
      );


    pendingAmount.textContent =
      formatIQD(amount);

  }

}


/* =====================================================
   عدادات الفلاتر
   ===================================================== */

function updateFilterCounts(
  requests
) {

  const allCount =
    document.getElementById(
      "filterAllCount"
    );


  const pendingCount =
    document.getElementById(
      "filterPendingCount"
    );


  const approvedCount =
    document.getElementById(
      "filterApprovedCount"
    );


  const rejectedCount =
    document.getElementById(
      "filterRejectedCount"
    );


  if (allCount) {

    allCount.textContent =
      requests.length;

  }


  if (pendingCount) {

    pendingCount.textContent =
      requests.filter(
        request =>
          request.status === "pending"
      ).length;

  }


  if (approvedCount) {

    approvedCount.textContent =
      requests.filter(
        request =>
          request.status === "approved"
      ).length;

  }


  if (rejectedCount) {

    rejectedCount.textContent =
      requests.filter(
        request =>
          request.status === "rejected"
      ).length;

  }

}


/* =====================================================
   إعداد الفلاتر
   ===================================================== */

function setupFilters() {

  const buttons =
    document.querySelectorAll(
      ".filter-btn"
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          currentFilter =
            button.dataset.filter ||
            "all";


          buttons.forEach(
            item => {

              item.classList.remove(
                "active"
              );

            }
          );


          button.classList.add(
            "active"
          );


          applyFilters();

        }
      );

    }
  );

}


/* =====================================================
   إعداد البحث
   ===================================================== */

function setupSearch() {

  const searchInput =
    document.getElementById(
      "requestSearch"
    );


  if (!searchInput) {
    return;
  }


  searchInput.addEventListener(
    "input",
    () => {

      currentSearch =
        searchInput.value
          .trim()
          .toLowerCase();


      applyFilters();

    }
  );

}


/* =====================================================
   تطبيق الفلترة والبحث
   ===================================================== */

function applyFilters() {

  let filtered =
    [...allRequests];


  /* =========================
     فلترة الحالة
  ========================== */

  if (
    currentFilter !== "all"
  ) {

    filtered =
      filtered.filter(
        request =>
          request.status ===
          currentFilter
      );

  }


  /* =========================
     البحث
  ========================== */

  if (currentSearch) {

    filtered =
      filtered.filter(
        request => {

          const name =
            String(
              request.full_name || ""
            ).toLowerCase();


          const email =
            String(
              request.email || ""
            ).toLowerCase();


          const reference =
            String(
              request.payment_reference ||
              ""
            ).toLowerCase();


          return (
            name.includes(
              currentSearch
            ) ||

            email.includes(
              currentSearch
            ) ||

            reference.includes(
              currentSearch
            )
          );

        }
      );

  }


  renderRequests(
    filtered
  );

}


/* =====================================================
   عرض الطلبات
   ===================================================== */

function renderRequests(
  requests
) {

  const container =
    document.getElementById(
      "requestsContainer"
    );


  if (!container) {
    return;
  }


  if (!requests.length) {

    container.className =
      "filter-empty";


    container.innerHTML = `

      <div class="filter-empty-icon">
        🔍
      </div>

      <div>
        لا توجد طلبات تطابق البحث أو الفلتر المحدد.
      </div>

    `;


    return;
  }


  container.className = "";


  container.innerHTML =
    requests
      .map(
        request =>
          createRequestCard(
            request
          )
      )
      .join("");


  setupRequestButtons();

}


/* =====================================================
   إنشاء كرت الطلب
   ===================================================== */

function createRequestCard(
  request
) {

  const fullName =
    request.full_name ||
    "مندوب بدون اسم";


  const email =
    request.email ||
    "لا يوجد إيميل";


  const status =
    request.status ||
    "pending";


  const planName =
    request.plan_name ||
    "غير معروف";


  const paymentMethod =
    request.payment_method ||
    "manual";


  const paymentReference =
    request.payment_reference ||
    "غير مذكور";


  const customerNotes =
    request.customer_notes ||
    "";


  const date =
    formatDate(
      request.created_at
    );


  const statusClass =
    getStatusClass(
      status
    );


  return `

    <article
      class="
        request-card
        ${statusClass}
      "
    >

      <div class="request-top">

        <div class="request-user-area">

          <div class="request-avatar">
            ${getInitial(fullName)}
          </div>


          <div class="request-user-info">

            <div class="request-user">
              ${escapeHtml(fullName)}
            </div>


            <div class="request-email">
              ${escapeHtml(email)}
            </div>

          </div>

        </div>


        <span
          class="
            status-badge
            status-${escapeHtml(status)}
          "
        >
          ${getStatusText(status)}
        </span>

      </div>


      <div class="request-info">

        <div class="info-box">

          <span>
            الباقة
          </span>

          <strong>
            ${escapeHtml(planName)}
          </strong>

        </div>


        <div class="info-box price-box">

          <span>
            المبلغ
          </span>

          <strong>
            ${formatIQD(
              request.amount
            )}
          </strong>

        </div>


        <div class="info-box">

          <span>
            مدة الاشتراك
          </span>

          <strong>
            ${getDurationText(
              request.duration_days
            )}
          </strong>

        </div>


        <div class="info-box">

          <span>
            طريقة الدفع
          </span>

          <strong>
            ${escapeHtml(
              getPaymentMethodText(
                paymentMethod
              )
            )}
          </strong>

        </div>

      </div>


      <div class="request-extra">

        <div class="extra-box">

          <span>
            رقم العملية
          </span>

          <strong
            class="payment-reference"
          >
            ${escapeHtml(
              paymentReference
            )}
          </strong>

        </div>


        <div class="extra-box">

          <span>
            تاريخ الطلب
          </span>

          <strong>
            ${escapeHtml(date)}
          </strong>

        </div>

      </div>


      ${
        customerNotes
          ? `

            <div class="request-notes">

              <span class="request-notes-title">
                ملاحظات المندوب
              </span>

              ${escapeHtml(
                customerNotes
              )}

            </div>

          `
          : ""
      }


      ${
        status === "pending"
          ? `

            <div class="request-actions">

              <button
                type="button"
                class="
                  action-btn
                  approve-btn
                "
                data-action="approve"
                data-request-id="${escapeHtml(
                  request.id
                )}"
              >
                ✓ الموافقة وتفعيل الاشتراك
              </button>


              <button
                type="button"
                class="
                  action-btn
                  reject-btn
                "
                data-action="reject"
                data-request-id="${escapeHtml(
                  request.id
                )}"
              >
                ✕ رفض الطلب
              </button>

            </div>

          `
          : ""
      }

    </article>

  `;

}


/* =====================================================
   أزرار الطلبات
   ===================================================== */

function setupRequestButtons() {

  const buttons =
    document.querySelectorAll(
      "[data-action]"
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        async () => {

          const action =
            button.dataset.action;


          const requestId =
            button.dataset.requestId;


          if (
            !action ||
            !requestId
          ) {
            return;
          }


          if (
            action === "approve"
          ) {

            await approveRequest(
              requestId,
              button
            );

          }


          if (
            action === "reject"
          ) {

            await rejectRequest(
              requestId,
              button
            );

          }

        }
      );

    }
  );

}


/* =====================================================
   الموافقة
   ===================================================== */

async function approveRequest(
  requestId,
  clickedButton
) {

  const confirmed =
    window.confirm(
      "هل تريد الموافقة على هذا الطلب وتفعيل الاشتراك للمندوب؟"
    );


  if (!confirmed) {
    return;
  }


  setRequestButtonsDisabled(
    clickedButton,
    true
  );


  const {
    data,
    error
  } = await supabaseClient.rpc(
    "approve_subscription_request",
    {
      p_request_id:
        requestId
    }
  );


  if (error) {

    console.error(
      "Approve error:",
      error
    );


    showMessage(
      error.message ||
      "تعذر الموافقة على الطلب.",
      "error"
    );


    setRequestButtonsDisabled(
      clickedButton,
      false
    );


    return;
  }


  console.log(
    "Subscription approved:",
    data
  );


  showMessage(
    "تمت الموافقة على الطلب وتفعيل الاشتراك بنجاح.",
    "success"
  );


  await loadRequests();

}


/* =====================================================
   الرفض
   ===================================================== */

async function rejectRequest(
  requestId,
  clickedButton
) {

  const reason =
    window.prompt(
      "اكتب سبب رفض الطلب (اختياري):"
    );


  if (reason === null) {
    return;
  }


  setRequestButtonsDisabled(
    clickedButton,
    true
  );


  const {
    data,
    error
  } = await supabaseClient.rpc(
    "reject_subscription_request",
    {
      p_request_id:
        requestId,

      p_admin_notes:
        reason.trim() || null
    }
  );


  if (error) {

    console.error(
      "Reject error:",
      error
    );


    showMessage(
      error.message ||
      "تعذر رفض الطلب.",
      "error"
    );


    setRequestButtonsDisabled(
      clickedButton,
      false
    );


    return;
  }


  showMessage(
    "تم رفض طلب الاشتراك.",
    "success"
  );


  await loadRequests();

}


/* =====================================================
   تعطيل أزرار الكرت
   ===================================================== */

function setRequestButtonsDisabled(
  button,
  disabled
) {

  const card =
    button.closest(
      ".request-card"
    );


  if (!card) {
    return;
  }


  const buttons =
    card.querySelectorAll(
      ".action-btn"
    );


  buttons.forEach(
    item => {

      item.disabled =
        disabled;

    }
  );

}


/* =====================================================
   CSS class للحالة
   ===================================================== */

function getStatusClass(
  status
) {

  if (
    status === "approved"
  ) {

    return "approved";

  }


  if (
    status === "rejected"
  ) {

    return "rejected";

  }


  return "pending";

}


/* =====================================================
   اسم الحالة
   ===================================================== */

function getStatusText(
  status
) {

  switch (status) {

    case "approved":

      return "تمت الموافقة";


    case "rejected":

      return "مرفوض";


    case "pending":

    default:

      return "قيد المراجعة";

  }

}


/* =====================================================
   طريقة الدفع
   ===================================================== */

function getPaymentMethodText(
  method
) {

  switch (method) {

    case "zain_cash":

      return "Zain Cash";


    case "manual":

      return "تحويل يدوي";


    case "cash":

      return "نقدي";


    default:

      return method ||
        "غير محددة";

  }

}


/* =====================================================
   مدة الاشتراك
   ===================================================== */

function getDurationText(
  days
) {

  const value =
    Number(days);


  if (value === 30) {

    return "شهر";

  }


  if (value === 365) {

    return "سنة";

  }


  if (!value) {

    return "غير محددة";

  }


  return `${value} يوم`;

}


/* =====================================================
   السعر
   ===================================================== */

function formatIQD(
  value
) {

  const number =
    Number(value);


  if (
    Number.isNaN(number)
  ) {

    return "0 د.ع";

  }


  return (
    number.toLocaleString(
      "en-US"
    ) +
    " د.ع"
  );

}


/* =====================================================
   التاريخ
   ===================================================== */

function formatDate(
  value
) {

  if (!value) {

    return "غير معروف";

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "غير معروف";

  }


  return date.toLocaleString(
    "en-IQ",
    {
      year: "numeric",

      month: "2-digit",

      day: "2-digit",

      hour: "2-digit",

      minute: "2-digit"
    }
  );

}


/* =====================================================
   الحرف الأول
   ===================================================== */

function getInitial(
  name
) {

  if (!name) {

    return "م";

  }


  const cleanName =
    String(name).trim();


  if (!cleanName) {

    return "م";

  }


  return escapeHtml(
    cleanName.charAt(0)
  );

}


/* =====================================================
   حماية HTML
   ===================================================== */

function escapeHtml(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =====================================================
   الرسائل
   ===================================================== */

function showMessage(
  message,
  type = "success"
) {

  const element =
    document.getElementById(
      "adminMessage"
    );


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.className =
    `message show ${type}`;


  window.clearTimeout(
    showMessage.timer
  );


  showMessage.timer =
    window.setTimeout(
      () => {

        element.className =
          "message";

      },
      4500
    );

}