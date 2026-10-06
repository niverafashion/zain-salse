// =====================================================
// Zain Sales - Admin
// لوحة إدارة الاشتراكات
// =====================================================


// =====================================================
// الإعدادات العامة
// =====================================================

const ADMIN_POLL_INTERVAL = 10000;

let currentUser = null;

let allRequests = [];

let currentFilter = "pending";

let searchTerm = "";

let adminPollTimer = null;

let isLoadingRequests = false;

let isProcessingRequest = false;


// =====================================================
// الأيقونات
// =====================================================

const ICONS = {

  plan: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="5" width="17" height="14" rx="2"/>
      <path d="M7 9h10"/>
      <path d="M7 13h5"/>
      <path d="M7 16h3"/>
    </svg>
  `,

  money: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5"/>
      <path d="M12 7.5v9"/>
      <path d="M15 9.5c-.5-1-1.4-1.5-2.8-1.5-1.5 0-2.5.8-2.5 1.8 0 1.2 1.2 1.6 2.6 1.9 1.5.3 2.7.7 2.7 2 0 1.1-1 2-2.7 2-1.4 0-2.4-.5-3-1.5"/>
    </svg>
  `,

  calendar: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="5" width="17" height="15" rx="2"/>
      <path d="M7.5 3.5v3"/>
      <path d="M16.5 3.5v3"/>
      <path d="M3.5 9.5h17"/>
      <path d="M8 13h.01"/>
      <path d="M12 13h.01"/>
      <path d="M16 13h.01"/>
      <path d="M8 16.5h.01"/>
      <path d="M12 16.5h.01"/>
    </svg>
  `,

  clock: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  `,

  card: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="M3 10h18"/>
      <path d="M7 15h3"/>
    </svg>
  `,

  reference: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M8 7h8"/>
      <path d="M8 11h8"/>
      <path d="M8 15h5"/>
      <path d="M5 3.5h14A1.5 1.5 0 0 1 20.5 5v14a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5z"/>
    </svg>
  `,

  note: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M5 4h14v16H5z"/>
      <path d="M8 8h8"/>
      <path d="M8 12h8"/>
      <path d="M8 16h5"/>
    </svg>
  `,

  phone: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M7 4.5l2.2-.5 1.5 4-1.7 1.4a14 14 0 0 0 5.6 5.6l1.4-1.7 4 1.5-.5 2.2a2 2 0 0 1-2.2 1.5C10.3 17.5 6.5 13.7 5.5 6.7A2 2 0 0 1 7 4.5z"/>
    </svg>
  `,

  location: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10.5c0 5.2-8 10-8 10s-8-4.8-8-10a8 8 0 1 1 16 0z"/>
      <circle cx="12" cy="10.5" r="2.5"/>
    </svg>
  `,

  check: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.2 4.2L19 7"/>
    </svg>
  `,

  close: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.9"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12"/>
      <path d="M18 6L6 18"/>
    </svg>
  `,

  shield: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l7 3.5v5.2c0 4.1-2.8 7.4-7 8.3-4.2-.9-7-4.2-7-8.3V6.5L12 3z"/>
      <path d="M9.5 11.8l1.7 1.7 3.5-3.5"/>
    </svg>
  `,

  logout: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10"/>
      <path d="M14 8l4 4-4 4"/>
      <path d="M18 12H9"/>
    </svg>
  `,

  refresh: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11a8 8 0 0 0-14.7-4.2L4 9"/>
      <path d="M4 4v5h5"/>
      <path d="M4 13a8 8 0 0 0 14.7 4.2L20 15"/>
      <path d="M20 20v-5h-5"/>
    </svg>
  `,

  empty: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <path d="M8 9h8"/>
      <path d="M8 13h5"/>
      <path d="M8 16h3"/>
    </svg>
  `,

  user: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.2"/>
      <path d="M5.5 19c.8-3.3 3-5 6.5-5s5.7 1.7 6.5 5"/>
    </svg>
  `

};


// =====================================================
// DOM
// =====================================================

const adminMessage =
  document.getElementById("adminMessage");

const totalRequestsElement =
  document.getElementById("totalRequests");

const pendingRequestsElement =
  document.getElementById("pendingRequests");

const approvedRequestsElement =
  document.getElementById("approvedRequests");

const requestSearch =
  document.getElementById("requestSearch");

const requestFilters =
  document.getElementById("requestFilters");

const requestsContainer =
  document.getElementById("requestsContainer");

const logoutBtn =
  document.getElementById("logoutBtn");

const adminAccountEmail =
  document.getElementById("adminAccountEmail");


// =====================================================
// عند تحميل الصفحة
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  initializeAdmin
);


// =====================================================
// تهيئة لوحة الإدارة
// =====================================================

async function initializeAdmin() {

  try {

    if (!supabaseClient) {

      throw new Error(
        "تعذر الاتصال بقاعدة البيانات."
      );

    }


    // -----------------------------------------------
    // التأكد من تسجيل الدخول
    // -----------------------------------------------

    currentUser =
      await requireAuth();


    if (!currentUser) {
      return;
    }


    // -----------------------------------------------
    // عرض بريد المسؤول
    // -----------------------------------------------

    if (adminAccountEmail) {

      adminAccountEmail.textContent =
        currentUser.email || "حساب المسؤول";

    }


    // -----------------------------------------------
    // التحقق من صلاحية الإدارة
    // -----------------------------------------------

    const {
      data: isAdmin,
      error: adminError
    } =
      await supabaseClient.rpc("is_admin");


    if (adminError) {

      console.error(
        "Admin permission error:",
        adminError
      );

      throw new Error(
        "تعذر التحقق من صلاحية المسؤول."
      );

    }


    if (!isAdmin) {

      showMessage(
        "ليس لديك صلاحية الدخول إلى لوحة الإدارة.",
        "error"
      );


      setTimeout(() => {

        window.location.href =
          "dashboard.html";

      }, 1800);

      return;

    }


    // -----------------------------------------------
    // الأحداث
    // -----------------------------------------------

    setupSearch();

    setupFilters();

    setupLogout();


    // -----------------------------------------------
    // تحميل الطلبات
    // -----------------------------------------------

    await loadRequests();


    // -----------------------------------------------
    // التحديث التلقائي
    // -----------------------------------------------

    startAdminPolling();

  }

  catch (error) {

    console.error(
      "Admin initialization error:",
      error
    );


    showMessage(
      getFriendlyAdminError(error),
      "error"
    );


    if (requestsContainer) {

      requestsContainer.innerHTML = `
        <div class="empty-state">

          <div class="empty-state-icon">
            ${ICONS.shield}
          </div>

          <h3>
            تعذر تحميل لوحة الإدارة
          </h3>

          <p>
            ${escapeHtml(
              getFriendlyAdminError(error)
            )}
          </p>

        </div>
      `;

    }

  }

}


// =====================================================
// البحث المباشر
// =====================================================

function setupSearch() {

  if (!requestSearch) {
    return;
  }


  requestSearch.addEventListener(
    "input",
    () => {

      searchTerm =
        requestSearch.value
          .trim()
          .toLowerCase();


      renderRequests();

    }
  );

}


// =====================================================
// الفلاتر
// =====================================================

function setupFilters() {

  if (!requestFilters) {
    return;
  }


  const buttons =
    requestFilters.querySelectorAll(
      ".filter-btn"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const filter =
          button.dataset.filter;


        if (!filter) {
          return;
        }


        currentFilter = filter;


        buttons.forEach(item => {

          const isActive =
            item.dataset.filter === filter;


          item.classList.toggle(
            "active",
            isActive
          );


          item.setAttribute(
            "aria-selected",
            String(isActive)
          );

        });


        renderRequests();

      }
    );

  });

}


// =====================================================
// تسجيل الخروج
// =====================================================

function setupLogout() {

  if (!logoutBtn) {
    return;
  }


  logoutBtn.addEventListener(
    "click",
    async () => {

      if (isProcessingRequest) {
        return;
      }


      const originalHtml =
        logoutBtn.innerHTML;


      logoutBtn.disabled = true;

      logoutBtn.innerHTML = `
        جاري تسجيل الخروج...
      `;


      stopAdminPolling();


      try {

        await logout();

      }

      catch (error) {

        console.error(
          "Logout error:",
          error
        );


        logoutBtn.disabled = false;

        logoutBtn.innerHTML =
          originalHtml;


        showMessage(
          "تعذر تسجيل الخروج حالياً.",
          "error"
        );

      }

    }
  );

}


// =====================================================
// تحميل الطلبات
// =====================================================

async function loadRequests(
  silent = false
) {

  if (isLoadingRequests) {
    return;
  }


  isLoadingRequests = true;


  if (!silent) {

    showLoadingState();

  }


  try {

    /*
      مهم:

      نستخدم RPC مخصص للمسؤول بدلاً من قراءة
      subscription_payment_requests مباشرة.

      هذا يسمح للمسؤول بمشاهدة الطلبات حتى إذا كانت
      RLS تمنع المستخدم العادي من قراءة طلبات غيره.
    */

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "get_admin_subscription_requests"
      );


    if (error) {

      console.error(
        "Load admin requests error:",
        error
      );

      throw error;

    }


    allRequests =
      Array.isArray(data)
        ? data.map(normalizeRequest)
        : [];


    updateStatistics();

    renderRequests();


  }

  catch (error) {

    console.error(
      "Admin requests error:",
      error
    );


    if (!silent) {

      requestsContainer.innerHTML = `
        <div class="empty-state">

          <div class="empty-state-icon">
            ${ICONS.refresh}
          </div>

          <h3>
            تعذر تحميل الطلبات
          </h3>

          <p>
            ${escapeHtml(
              getFriendlyAdminError(error)
            )}
          </p>

        </div>
      `;

    }

  }

  finally {

    isLoadingRequests = false;

  }

}


// =====================================================
// توحيد بيانات الطلب
// =====================================================

function normalizeRequest(request) {

  return {

    id:
      request?.id || "",

    user_id:
      request?.user_id || "",

    plan_id:
      request?.plan_id || null,

    amount:
      Number(request?.amount || 0),

    payment_method:
      request?.payment_method || "",

    payment_reference:
      request?.payment_reference || "",

    customer_notes:
      request?.customer_notes || "",

    status:
      request?.status || "pending",

    admin_notes:
      request?.admin_notes || "",

    created_at:
      request?.created_at || null,

    reviewed_at:
      request?.reviewed_at || null,

    subscription_id:
      request?.subscription_id || null,

    user_email:
      request?.user_email || "",

    full_name:
      request?.full_name || "",

    phone:
      request?.phone || "",

    governorate:
      request?.governorate || "",

    region:
      request?.region || "",

    avatar_url:
      request?.avatar_url || "",

    plan_code:
      request?.plan_code || "",

    plan_name:
      request?.plan_name || "اشتراك",

    duration_days:
      Number(request?.duration_days || 0)

  };

}


// =====================================================
// الإحصائيات
// =====================================================

function updateStatistics() {

  const total =
    allRequests.length;


  const pending =
    allRequests.filter(
      request =>
        request.status === "pending"
    ).length;


  const approved =
    allRequests.filter(
      request =>
        request.status === "approved"
    ).length;


  if (totalRequestsElement) {

    totalRequestsElement.textContent =
      formatNumber(total);

  }


  if (pendingRequestsElement) {

    pendingRequestsElement.textContent =
      formatNumber(pending);

  }


  if (approvedRequestsElement) {

    approvedRequestsElement.textContent =
      formatNumber(approved);

  }

}


// =====================================================
// فلترة الطلبات
// =====================================================

function getFilteredRequests() {

  let filtered =
    allRequests.filter(
      request =>
        request.status === currentFilter
    );


  if (!searchTerm) {

    return filtered;

  }


  filtered =
    filtered.filter(request => {

      const searchableText = [

        request.full_name,

        request.user_email,

        request.phone,

        request.governorate,

        request.region,

        request.payment_reference,

        request.plan_name,

        request.payment_method,

        request.id

      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


      return searchableText.includes(
        searchTerm
      );

    });


  return filtered;

}


// =====================================================
// عرض الطلبات
// =====================================================

function renderRequests() {

  if (!requestsContainer) {
    return;
  }


  const filteredRequests =
    getFilteredRequests();


  if (!filteredRequests.length) {

    renderEmptyState();

    return;

  }


  requestsContainer.innerHTML = `

    <div class="requests-list">

      ${filteredRequests
        .map(request =>
          renderRequestCard(request)
        )
        .join("")}

    </div>

  `;


  attachRequestActions();

}


// =====================================================
// كارت الطلب
// =====================================================

function renderRequestCard(request) {

  const status =
    normalizeStatus(request.status);


  const statusText =
    getStatusText(status);


  const avatar =
    getAvatarMarkup(request);


  const amount =
    formatCurrency(request.amount);


  const duration =
    request.duration_days > 0
      ? `${formatNumber(request.duration_days)} يوم`
      : "—";


  const paymentMethod =
    getPaymentMethodText(
      request.payment_method
    );


  const createdAt =
    formatDateTime(
      request.created_at
    );


  const phone =
    request.phone || "—";


  const location =
    getLocationText(request);


  const reference =
    request.payment_reference || "—";


  const notes =
    request.customer_notes || "لا توجد ملاحظات";


  const planName =
    request.plan_name || "—";


  const requestNumber =
    request.id || "—";


  const actions =
    renderRequestActions(request);


  return `

    <article
      class="request-card ${status}"
      data-request-id="${escapeAttribute(request.id)}"
    >


      <!-- ===========================================
           TOP
      ============================================ -->

      <div class="request-card-top">


        <div class="request-representative">

          ${avatar}


          <div class="request-representative-info">

            <h3 class="request-representative-name">

              ${escapeHtml(
                request.full_name ||
                "مندوب بدون اسم"
              )}

            </h3>


            <p class="request-representative-email">

              ${escapeHtml(
                request.user_email ||
                "لا يوجد بريد إلكتروني"
              )}

            </p>


          </div>

        </div>

<div class="request-extra-grid">

  <div class="request-extra">

    <div class="request-extra-value reference">
      ${escapeHtml(reference)}
    </div>

  </div>

  <div class="request-status-area">

    <span class="status-badge ${status}">
      ${escapeHtml(statusText)}
    </span>

  </div>

</div>



      <!-- ===========================================
           INFO GRID
      ============================================ -->

      <div class="request-info-grid">


        <div class="request-info-item">

          <div class="request-info-label">

            ${ICONS.plan}

            <span>
              الباقة
            </span>

          </div>

          <div class="request-info-value">

            ${escapeHtml(planName)}

          </div>

        </div>


        <div class="request-info-item">

          <div class="request-info-label">

            ${ICONS.money}

            <span>
              المبلغ
            </span>

          </div>

          <div class="request-info-value amount">

            ${escapeHtml(amount)}

          </div>

        </div>


        <div class="request-info-item">

          <div class="request-info-label">

            ${ICONS.clock}

            <span>
              مدة الاشتراك
            </span>

          </div>

          <div class="request-info-value">

            ${escapeHtml(duration)}

          </div>

        </div>


        <div class="request-info-item">

          <div class="request-info-label">

            ${ICONS.card}

            <span>
              طريقة الدفع
            </span>

          </div>

          <div class="request-info-value">

            ${escapeHtml(paymentMethod)}

          </div>

        </div>


        <div class="request-info-item">

          <div class="request-info-label">

            ${ICONS.calendar}

            <span>
              تاريخ الطلب
            </span>

          </div>

          <div class="request-info-value">

            ${escapeHtml(createdAt)}

          </div>

        </div>


        <div class="request-info-item">

          <div class="request-info-label">

            ${ICONS.phone}

            <span>
              رقم الهاتف
            </span>

          </div>

          <div class="request-info-value">

            ${escapeHtml(phone)}

          </div>

        </div>


        <div class="request-info-item">

          <div class="request-info-label">

            ${ICONS.location}

            <span>
              المحافظة / المنطقة
            </span>

          </div>

          <div class="request-info-value">

            ${escapeHtml(location)}

          </div>

        </div>


        <div class="request-info-item">

          <div class="request-info-label">

            ${ICONS.reference}

            <span>
              حالة الطلب
            </span>

          </div>

          <div class="request-info-value">

            ${escapeHtml(statusText)}

          </div>

        </div>


      </div>


      <!-- ===========================================
           REFERENCE + NOTES
      ============================================ -->

      

        <div class="request-extra">

          <div class="request-extra-label">

            ${ICONS.note}

            <span>
              ملاحظات المندوب
            </span>

          </div>

          <div class="request-extra-value">

            ${escapeHtml(notes)}

          </div>

        </div>


      </div>


      <!-- ===========================================
           ACTIONS
      ============================================ -->

      ${actions}


    </article>

  `;

}


// =====================================================
// صورة المندوب
// =====================================================

function getAvatarMarkup(request) {

  const name =
    request.full_name ||
    "م";


  const initials =
    getInitials(name);


  if (request.avatar_url) {

    return `

      <img
        class="request-avatar"
        src="${escapeAttribute(request.avatar_url)}"
        alt="${escapeAttribute(name)}"
        loading="lazy"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
      >

      <span
        class="request-avatar request-avatar-fallback"
        style="display:none;"
        aria-hidden="true"
      >
        ${escapeHtml(initials)}
      </span>

    `;

  }


  return `

    <span
      class="request-avatar request-avatar-fallback"
      aria-hidden="true"
    >
      ${escapeHtml(initials)}
    </span>

  `;

}


// =====================================================
// أزرار الطلب
// =====================================================

function renderRequestActions(request) {

  if (request.status === "pending") {

    return `

      <div class="request-actions">

        <button
          type="button"
          class="request-action-btn approve-btn"
          data-action="approve"
          data-request-id="${escapeAttribute(request.id)}"
        >

          ${ICONS.check}

          تأكيد الطلب

        </button>


        <button
          type="button"
          class="request-action-btn reject-btn"
          data-action="reject"
          data-request-id="${escapeAttribute(request.id)}"
        >

          ${ICONS.close}

          رفض الطلب

        </button>

      </div>

    `;

  }


  const reviewedDate =
    request.reviewed_at
      ? formatDateTime(request.reviewed_at)
      : "";


  return `

    <div class="request-actions">

      <div class="request-reviewed">

        ${request.status === "approved"
          ? ICONS.check
          : ICONS.close}

        <span>

          ${request.status === "approved"
            ? "تمت الموافقة على الطلب"
            : "تم رفض الطلب"}

          ${reviewedDate
            ? ` — ${escapeHtml(reviewedDate)}`
            : ""}

        </span>

      </div>

    </div>

  `;

}


// =====================================================
// أحداث الأزرار
// =====================================================

function attachRequestActions() {

  const buttons =
    requestsContainer.querySelectorAll(
      "[data-action][data-request-id]"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      async () => {

        const action =
          button.dataset.action;


        const requestId =
          button.dataset.requestId;


        if (!requestId) {
          return;
        }


        if (action === "approve") {

          await approveRequest(
            requestId,
            button
          );

        }


        if (action === "reject") {

          await rejectRequest(
            requestId,
            button
          );

        }

      }
    );

  });

}


// =====================================================
// الموافقة على الطلب
// =====================================================

async function approveRequest(
  requestId,
  button
) {

  if (isProcessingRequest) {
    return;
  }


  const request =
    allRequests.find(
      item =>
        item.id === requestId
    );


  if (!request) {

    showMessage(
      "تعذر العثور على الطلب.",
      "error"
    );

    return;

  }


  const confirmed =
    window.confirm(
      "هل أنت متأكد من تأكيد طلب الاشتراك؟"
    );


  if (!confirmed) {
    return;
  }


  isProcessingRequest = true;


  const originalHtml =
    button.innerHTML;


  button.disabled = true;

  button.innerHTML =
    "جاري التأكيد...";


  try {

    const {
      error
    } =
      await supabaseClient.rpc(
        "approve_subscription_request",
        {
          p_request_id: requestId
        }
      );


    if (error) {

      console.error(
        "Approve request error:",
        error
      );

      throw error;

    }


    showMessage(
      "تم تأكيد طلب الاشتراك بنجاح.",
      "success"
    );


    await loadRequests(true);

  }

  catch (error) {

    console.error(
      "Approve request error:",
      error
    );


    showMessage(
      getFriendlyAdminError(error),
      "error"
    );


    button.disabled = false;

    button.innerHTML =
      originalHtml;

  }

  finally {

    isProcessingRequest = false;

  }

}


// =====================================================
// رفض الطلب
// =====================================================

async function rejectRequest(
  requestId,
  button
) {

  if (isProcessingRequest) {
    return;
  }


  const request =
    allRequests.find(
      item =>
        item.id === requestId
    );


  if (!request) {

    showMessage(
      "تعذر العثور على الطلب.",
      "error"
    );

    return;

  }


  const adminNotes =
    window.prompt(
      "اكتب سبب رفض الطلب أو ملاحظات المسؤول:",
      ""
    );


  if (adminNotes === null) {
    return;
  }


  isProcessingRequest = true;


  const originalHtml =
    button.innerHTML;


  button.disabled = true;

  button.innerHTML =
    "جاري الرفض...";


  try {

    const {
      error
    } =
      await supabaseClient.rpc(
        "reject_subscription_request",
        {
          p_request_id: requestId,
          p_admin_notes:
            adminNotes.trim() || null
        }
      );


    if (error) {

      console.error(
        "Reject request error:",
        error
      );

      throw error;

    }


    showMessage(
      "تم رفض طلب الاشتراك.",
      "success"
    );


    await loadRequests(true);

  }

  catch (error) {

    console.error(
      "Reject request error:",
      error
    );


    showMessage(
      getFriendlyAdminError(error),
      "error"
    );


    button.disabled = false;

    button.innerHTML =
      originalHtml;

  }

  finally {

    isProcessingRequest = false;

  }

}


// =====================================================
// Empty State
// =====================================================

function renderEmptyState() {

  let title =
    "لا توجد طلبات";


  let description =
    "لا توجد طلبات ضمن الحالة أو البحث الحالي.";


  if (searchTerm) {

    title =
      "لم يتم العثور على نتائج";


    description =
      "جرّب البحث باسم مختلف أو بريد إلكتروني أو رقم عملية آخر.";

  }


  if (
    !searchTerm &&
    currentFilter === "pending"
  ) {

    title =
      "لا توجد طلبات قيد المراجعة";


    description =
      "عند إرسال مندوب جديد لطلب اشتراك مدفوع سيظهر هنا مباشرة.";

  }


  requestsContainer.innerHTML = `

    <div class="empty-state">

      <div class="empty-state-icon">

        ${ICONS.empty}

      </div>


      <h3>

        ${escapeHtml(title)}

      </h3>


      <p>

        ${escapeHtml(description)}

      </p>

    </div>

  `;

}


// =====================================================
// Loading State
// =====================================================

function showLoadingState() {

  if (!requestsContainer) {
    return;
  }


  requestsContainer.innerHTML = `

    <div class="loading-state">

      <span class="loading-spinner"></span>

      جاري تحميل الطلبات...

    </div>

  `;

}


// =====================================================
// التحديث التلقائي
// =====================================================

function startAdminPolling() {

  stopAdminPolling();


  adminPollTimer =
    setInterval(
      async () => {

        if (
          document.visibilityState ===
          "hidden"
        ) {
          return;
        }


        if (isProcessingRequest) {
          return;
        }


        await loadRequests(true);

      },
      ADMIN_POLL_INTERVAL
    );

}


// =====================================================
// إيقاف التحديث
// =====================================================

function stopAdminPolling() {

  if (adminPollTimer) {

    clearInterval(
      adminPollTimer
    );

    adminPollTimer = null;

  }

}


// =====================================================
// عند مغادرة الصفحة
// =====================================================

window.addEventListener(
  "beforeunload",
  stopAdminPolling
);


// =====================================================
// حالة الطلب
// =====================================================

function normalizeStatus(status) {

  const value =
    String(status || "")
      .trim()
      .toLowerCase();


  if (
    value === "approved" ||
    value === "rejected" ||
    value === "pending"
  ) {

    return value;

  }


  return "pending";

}


// =====================================================
// نص الحالة
// =====================================================

function getStatusText(status) {

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


// =====================================================
// طريقة الدفع
// =====================================================

function getPaymentMethodText(method) {

  const value =
    String(method || "")
      .trim()
      .toLowerCase();


  switch (value) {

    case "zain_cash":
    case "zain cash":
    case "zaincash":
      return "Zain Cash";


    case "mastercard":
    case "master_card":
    case "master card":
      return "MasterCard";


    case "cash":
      return "نقدي";


    case "bank":
      return "تحويل مصرفي";


    default:
      return method || "—";

  }

}


// =====================================================
// المحافظة / المنطقة
// =====================================================

function getLocationText(request) {

  const governorate =
    request.governorate || "";


  const region =
    request.region || "";


  if (
    governorate &&
    region
  ) {

    return `${governorate} - ${region}`;

  }


  return governorate ||
    region ||
    "—";

}


// =====================================================
// العملة
// =====================================================

function formatCurrency(amount) {

  const value =
    Number(amount || 0);


  return (
    new Intl.NumberFormat(
      "en-IQ",
      {
        maximumFractionDigits: 0
      }
    ).format(value)
    + " د.ع"
  );

}


// =====================================================
// تنسيق الرقم
// =====================================================

function formatNumber(number) {

  return new Intl.NumberFormat(
    "en-US"
  ).format(
    Number(number || 0)
  );

}


// =====================================================
// التاريخ والوقت
// =====================================================

function formatDateTime(value) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "—";

  }


  return new Intl.DateTimeFormat(
    "ar-IQ",
    {
      timeZone: "Asia/Baghdad",

      year: "numeric",

      month: "2-digit",

      day: "2-digit",

      hour: "2-digit",

      minute: "2-digit"
    }
  ).format(date);

}


// =====================================================
// اختصار رقم العملية
// =====================================================

function shortRequestId(id) {

  const value =
    String(id || "");


  if (value.length <= 16) {
    return value;
  }


  return (
    value.substring(0, 8)
    + "..."
    + value.substring(
      value.length - 5
    )
  );

}


// =====================================================
// الأحرف الأولى للصورة البديلة
// =====================================================

function getInitials(name) {

  const value =
    String(name || "")
      .trim();


  if (!value) {
    return "م";
  }


  const parts =
    value.split(/\s+/);


  if (parts.length === 1) {

    return parts[0]
      .substring(0, 2);

  }


  return (
    parts[0].charAt(0)
    +
    parts[1].charAt(0)
  );

}


// =====================================================
// رسالة الإدارة
// =====================================================

function showMessage(
  message,
  type = "success"
) {

  if (!adminMessage) {
    return;
  }


  adminMessage.textContent =
    message || "";


  adminMessage.className =
    "";


  adminMessage.classList.add(
    "show",
    type
  );


  clearTimeout(
    showMessage.timeout
  );


  showMessage.timeout =
    setTimeout(
      () => {

        hideMessage();

      },
      5000
    );

}


// =====================================================
// إخفاء الرسالة
// =====================================================

function hideMessage() {

  if (!adminMessage) {
    return;
  }


  adminMessage.className = "";

  adminMessage.textContent = "";

}


// =====================================================
// أخطاء الإدارة
// =====================================================

function getFriendlyAdminError(error) {

  const rawMessage =
    String(
      error?.message ||
      error?.details ||
      ""
    );


  const message =
    rawMessage.toLowerCase();


  if (
    message.includes(
      "get_admin_subscription_requests"
    )
  ) {

    return (
      "دالة جلب طلبات الإدارة غير موجودة في قاعدة البيانات."
    );

  }


  if (
    message.includes(
      "not authorized"
    ) ||
    message.includes(
      "unauthorized"
    ) ||
    message.includes(
      "permission denied"
    )
  ) {

    return (
      "ليس لديك صلاحية تنفيذ هذا الإجراء."
    );

  }


  if (
    message.includes(
      "already approved"
    )
  ) {

    return (
      "هذا الطلب تمت الموافقة عليه مسبقاً."
    );

  }


  if (
    message.includes(
      "already rejected"
    )
  ) {

    return (
      "هذا الطلب تم رفضه مسبقاً."
    );

  }


  if (
    message.includes(
      "request not found"
    )
  ) {

    return (
      "الطلب غير موجود أو تم حذفه."
    );

  }


  if (
    message.includes(
      "subscription"
    ) &&
    message.includes(
      "constraint"
    )
  ) {

    return (
      "حدث خطأ في إعدادات الاشتراك. راجع قيود جدول الاشتراكات."
    );

  }


  if (rawMessage) {

    return rawMessage;

  }


  return (
    "حدث خطأ غير متوقع. حاول مرة أخرى."
  );

}


// =====================================================
// حماية النصوص HTML
// =====================================================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


// =====================================================
// حماية خصائص HTML
// =====================================================

function escapeAttribute(value) {

  return escapeHtml(value);

}


// =====================================================
// تنظيف عند إغلاق الصفحة
// =====================================================

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.visibilityState ===
      "hidden"
    ) {
      return;
    }


    if (
      currentUser &&
      !isProcessingRequest
    ) {

      loadRequests(true);

    }

  }
);