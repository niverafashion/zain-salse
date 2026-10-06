// =====================================================
// Zain Sales - Admin
// لوحة إدارة الاشتراكات
// =====================================================


// =====================================================
// الإعدادات
// =====================================================

const ADMIN_POLL_INTERVAL = 10000;


// =====================================================
// الحالة العامة
// =====================================================

let currentUser = null;

let allRequests = [];

let currentFilter = "all";

let currentSearch = "";

let isLoading = false;

let isProcessing = false;

let pollTimer = null;


// =====================================================
// عناصر الصفحة
// =====================================================

const adminMessage =
  document.getElementById("adminMessage");

const pendingCount =
  document.getElementById("pendingCount");

const totalCount =
  document.getElementById("totalCount");

const pendingAmount =
  document.getElementById("pendingAmount");

const requestSearch =
  document.getElementById("requestSearch");

const requestsContainer =
  document.getElementById("requestsContainer");

const logoutBtn =
  document.getElementById("logoutBtn");


const filterButtons =
  document.querySelectorAll(
    "[data-filter]"
  );


const filterAllCount =
  document.getElementById("filterAllCount");

const filterPendingCount =
  document.getElementById("filterPendingCount");

const filterApprovedCount =
  document.getElementById("filterApprovedCount");

const filterRejectedCount =
  document.getElementById("filterRejectedCount");


// =====================================================
// عند تحميل الصفحة
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  initializeAdmin
);


// =====================================================
// التهيئة الرئيسية
// =====================================================

async function initializeAdmin() {

  try {

    if (
      typeof supabaseClient === "undefined"
    ) {
      showMessage(
        "تعذر الاتصال بقاعدة البيانات.",
        "error"
      );

      return;
    }


    if (
      typeof requireAuth === "function"
    ) {
      const authResult =
        await requireAuth();

      if (!authResult) {
        return;
      }
    }


    const {
      data: {
        user
      },
      error: userError
    } =
      await supabaseClient.auth.getUser();


    if (userError) {
      throw userError;
    }


    if (!user) {

      window.location.href =
        "index.html";

      return;
    }


    currentUser = user;


    // ---------------------------------------------
    // التحقق من صلاحية الأدمن
    // ---------------------------------------------

    const {
      data: isAdmin,
      error: adminError
    } =
      await supabaseClient.rpc(
        "is_admin"
      );


    if (adminError) {

      console.error(
        "is_admin error:",
        adminError
      );

      showMessage(
        "تعذر التحقق من صلاحيات الحساب.",
        "error"
      );

      return;
    }


    if (!isAdmin) {

      showMessage(
        "ليس لديك صلاحية الدخول إلى لوحة الإدارة.",
        "error"
      );


      setTimeout(() => {

        window.location.href =
          "index.html";

      }, 1800);


      return;
    }


    // ---------------------------------------------
    // الأحداث
    // ---------------------------------------------

    setupEvents();


    // ---------------------------------------------
    // تحميل الطلبات
    // ---------------------------------------------

    await loadRequests();


    // ---------------------------------------------
    // بدء التحديث التلقائي
    // ---------------------------------------------

    startPolling();


  } catch (error) {

    console.error(
      "Admin initialization error:",
      error
    );


    showMessage(
      getFriendlyError(error),
      "error"
    );
  }
}


// =====================================================
// إعداد الأحداث
// =====================================================

function setupEvents() {


  // ---------------------------------------------
  // تسجيل الخروج
  // ---------------------------------------------

  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      async () => {

        if (
          typeof logout === "function"
        ) {

          await logout();

          return;
        }


        await supabaseClient.auth.signOut();

        window.location.href =
          "index.html";
      }
    );
  }


  // ---------------------------------------------
  // البحث
  // ---------------------------------------------

  if (requestSearch) {

    requestSearch.addEventListener(
      "input",
      event => {

        currentSearch =
          String(
            event.target.value || ""
          )
            .trim()
            .toLowerCase();


        renderRequests();
      }
    );
  }


  // ---------------------------------------------
  // الفلاتر
  // ---------------------------------------------

  filterButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const filter =
            button.dataset.filter ||
            "all";


          currentFilter =
            filter;


          filterButtons.forEach(
            item => {

              item.classList.toggle(
                "active",
                item === button
              );

            }
          );


          renderRequests();
        }
      );

    }
  );
}


// =====================================================
// تحميل الطلبات
// =====================================================

async function loadRequests(
  options = {}
) {

  const silent =
    options.silent === true;


  if (isLoading) {
    return;
  }


  isLoading = true;


  if (!silent) {

    showLoading();
  }


  try {

    // ---------------------------------------------
    // جلب طلبات الاشتراك
    // ---------------------------------------------

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "subscription_payment_requests"
        )
        .select(`
          id,
          user_id,
          plan_id,
          amount,
          payment_method,
          payment_reference,
          customer_notes,
          status,
          admin_notes,
          created_at,
          reviewed_at,
          subscription_id
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    const requests =
      Array.isArray(data)
        ? data
        : [];


    // ---------------------------------------------
    // جلب بيانات المستخدمين
    // ---------------------------------------------

    const userIds = [
      ...new Set(
        requests
          .map(
            request =>
              request.user_id
          )
          .filter(Boolean)
      )
    ];


    let profiles = [];


    if (userIds.length > 0) {

      const {
        data: profileData,
        error: profileError
      } =
        await supabaseClient
          .from("profiles")
          .select(`
            id,
            full_name,
            phone,
            governorate,
            region,
            avatar_url
          `)
          .in(
            "id",
            userIds
          );


      if (profileError) {

        console.warn(
          "Profiles query warning:",
          profileError
        );

      } else {

        profiles =
          Array.isArray(profileData)
            ? profileData
            : [];
      }
    }


    // ---------------------------------------------
    // جلب الخطط
    // ---------------------------------------------

    let plans = [];


    const {
      data: planData,
      error: planError
    } =
      await supabaseClient
        .from("subscription_plans")
        .select(`
          id,
          code,
          name,
          price,
          duration_days,
          is_active
        `);


    if (planError) {

      console.warn(
        "Plans query warning:",
        planError
      );

    } else {

      plans =
        Array.isArray(planData)
          ? planData
          : [];
    }


    // ---------------------------------------------
    // تحويل البيانات إلى شكل واحد
    // ---------------------------------------------

    allRequests =
      requests.map(
        request => {

          const profile =
            profiles.find(
              item =>
                item.id ===
                request.user_id
            ) || null;


          const plan =
            plans.find(
              item =>
                String(item.id) ===
                String(request.plan_id)
            ) || null;


          return {

            ...request,

            profile,

            plan,

            // إذا كان الـ RPC مستقبلاً
            // يرجع user_email سيستخدمه
            user_email:
              request.user_email ||
              request.email ||
              null
          };
        }
      );


    updateStatistics();

    renderRequests();


    if (!silent) {

      hideMessage();
    }


  } catch (error) {

    console.error(
      "Load requests error:",
      error
    );


    if (!silent) {

      showMessage(
        getFriendlyError(error),
        "error"
      );


      showErrorState();
    }


  } finally {

    isLoading = false;
  }
}


// =====================================================
// تحديث الإحصائيات
// =====================================================

function updateStatistics() {

  const total =
    allRequests.length;


  const pending =
    allRequests.filter(
      request =>
        request.status ===
        "pending"
    );


  const approved =
    allRequests.filter(
      request =>
        request.status ===
        "approved"
    );


  const rejected =
    allRequests.filter(
      request =>
        request.status ===
        "rejected"
    );


  const pendingTotal =
    pending.reduce(
      (
        total,
        request
      ) =>
        total +
        Number(
          request.amount || 0
        ),
      0
    );


  if (totalCount) {

    totalCount.textContent =
      formatNumber(total);
  }


  if (pendingCount) {

    pendingCount.textContent =
      formatNumber(
        pending.length
      );
  }


  if (pendingAmount) {

    pendingAmount.textContent =
      formatCurrency(
        pendingTotal
      );
  }


  if (filterAllCount) {

    filterAllCount.textContent =
      formatNumber(total);
  }


  if (filterPendingCount) {

    filterPendingCount.textContent =
      formatNumber(
        pending.length
      );
  }


  if (filterApprovedCount) {

    filterApprovedCount.textContent =
      formatNumber(
        approved.length
      );
  }


  if (filterRejectedCount) {

    filterRejectedCount.textContent =
      formatNumber(
        rejected.length
      );
  }
}


// =====================================================
// عرض الطلبات
// =====================================================

function renderRequests() {

  if (!requestsContainer) {
    return;
  }


  let filtered =
    [...allRequests];


  // ---------------------------------------------
  // الفلترة حسب الحالة
  // ---------------------------------------------

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


  // ---------------------------------------------
  // البحث
  // ---------------------------------------------

  if (currentSearch) {

    filtered =
      filtered.filter(
        request => {

          const profile =
            request.profile || {};


          const searchableText = [

            profile.full_name,

            profile.phone,

            profile.governorate,

            profile.region,

            request.user_email,

            request.payment_reference,

            request.customer_notes,

            request.admin_notes,

            getPlanName(
              request
            ),

            getPaymentMethodName(
              request.payment_method
            ),

            request.status

          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


          return searchableText.includes(
            currentSearch
          );
        }
      );
  }


  // ---------------------------------------------
  // لا توجد نتائج
  // ---------------------------------------------

  if (filtered.length === 0) {

    if (
      allRequests.length === 0
    ) {

      renderEmptyState();

    } else {

      renderFilterEmptyState();
    }


    return;
  }


  // ---------------------------------------------
  // رسم البطاقات
  // ---------------------------------------------

  requestsContainer.innerHTML =
    filtered
      .map(
        request =>
          renderRequestCard(
            request
          )
      )
      .join("");


  bindRequestActions();
}


// =====================================================
// إنشاء بطاقة الطلب
// =====================================================

function renderRequestCard(
  request
) {

  const profile =
    request.profile || {};


  const status =
    request.status || "pending";


  const planName =
    getPlanName(request);


  const paymentMethod =
    getPaymentMethodName(
      request.payment_method
    );


  const userName =
    profile.full_name ||
    "مستخدم بدون اسم";


  const email =
    request.user_email ||
    request.email ||
    "—";


  const phone =
    profile.phone ||
    "—";


  const governorate =
    profile.governorate ||
    "—";


  const region =
    profile.region ||
    "—";


  const avatarUrl =
    profile.avatar_url ||
    "";


  const avatarHtml =
    avatarUrl
      ? `
        <img
          class="request-avatar"
          src="${escapeAttribute(
            avatarUrl
          )}"
          alt="${escapeAttribute(
            userName
          )}"
          loading="lazy"
        >
      `
      : `
        <div
          class="request-avatar request-avatar-placeholder"
          aria-hidden="true"
        >
          ${escapeHtml(
            getInitials(userName)
          )}
        </div>
      `;


  const statusText =
    getStatusName(status);


  const createdAt =
    formatDateTime(
      request.created_at
    );


  const reviewedAt =
    request.reviewed_at
      ? formatDateTime(
          request.reviewed_at
        )
      : "";


  const amount =
    formatCurrency(
      request.amount
    );


  const reference =
    request.payment_reference ||
    "—";


  const notes =
    request.customer_notes ||
    "";


  const adminNotes =
    request.admin_notes ||
    "";


  const cardClass =
    [
      "request-card",
      status
    ]
      .filter(Boolean)
      .join(" ");


  return `
    <article
      class="${cardClass}"
      data-request-id="${escapeAttribute(
        request.id
      )}"
    >

      <div class="request-header">

        <div class="request-user">

          ${avatarHtml}

          <div class="request-user-text">

            <div class="request-user-name">
              ${escapeHtml(
                userName
              )}
            </div>

            <div class="request-email">
              ${escapeHtml(
                email
              )}
            </div>

          </div>

        </div>


        <span
          class="status-badge status-${escapeAttribute(
            status
          )}"
        >
          ${escapeHtml(
            statusText
          )}
        </span>

      </div>


      <div class="request-info">

        <div class="info-box">

          <span class="info-label">
            رقم الهاتف
          </span>

          <strong>
            ${escapeHtml(
              phone
            )}
          </strong>

        </div>


        <div class="info-box">

          <span class="info-label">
            المحافظة
          </span>

          <strong>
            ${escapeHtml(
              governorate
            )}
          </strong>

        </div>


        <div class="info-box">

          <span class="info-label">
            المنطقة
          </span>

          <strong>
            ${escapeHtml(
              region
            )}
          </strong>

        </div>


        <div class="info-box">

          <span class="info-label">
            الخطة
          </span>

          <strong>
            ${escapeHtml(
              planName
            )}
          </strong>

        </div>


        <div class="info-box">

          <span class="info-label">
            طريقة الدفع
          </span>

          <strong>
            ${escapeHtml(
              paymentMethod
            )}
          </strong>

        </div>


        <div class="price-box">

          <span class="info-label">
            المبلغ
          </span>

          <strong>
            ${escapeHtml(
              amount
            )}
          </strong>

        </div>

      </div>


      <div class="request-extra">

        <div class="extra-box">

          <span class="info-label">
            تاريخ الطلب
          </span>

          <strong>
            ${escapeHtml(
              createdAt
            )}
          </strong>

        </div>


        ${
          reviewedAt
            ? `
              <div class="extra-box">

                <span class="info-label">
                  تاريخ المراجعة
                </span>

                <strong>
                  ${escapeHtml(
                    reviewedAt
                  )}
                </strong>

              </div>
            `
            : ""
        }


        <div class="extra-box">

          <span class="info-label">
            رقم العملية
          </span>

          <strong
            class="payment-reference"
          >
            ${escapeHtml(
              reference
            )}
          </strong>

        </div>

      </div>


      ${
        notes
          ? `
            <div class="request-notes">

              <div class="request-notes-title">
                ملاحظات المستخدم
              </div>

              <div>
                ${escapeHtml(
                  notes
                )}
              </div>

            </div>
          `
          : ""
      }


      ${
        adminNotes
          ? `
            <div class="request-notes admin-notes">

              <div class="request-notes-title">
                ملاحظة الإدارة
              </div>

              <div>
                ${escapeHtml(
                  adminNotes
                )}
              </div>

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
                class="action-btn approve-btn"
                data-action="approve"
                data-request-id="${escapeAttribute(
                  request.id
                )}"
              >
                <span>
                  ✓
                </span>

                <span>
                  موافقة
                </span>

              </button>


              <button
                type="button"
                class="action-btn reject-btn"
                data-action="reject"
                data-request-id="${escapeAttribute(
                  request.id
                )}"
              >
                <span>
                  ×
                </span>

                <span>
                  رفض
                </span>

              </button>

            </div>
          `
          : ""
      }

    </article>
  `;
}


// =====================================================
// ربط أزرار الطلبات
// =====================================================

function bindRequestActions() {

  const actionButtons =
    requestsContainer.querySelectorAll(
      "[data-action]"
    );


  actionButtons.forEach(
    button => {

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
              requestId
            );

            return;
          }


          if (action === "reject") {

            await rejectRequest(
              requestId
            );
          }

        }
      );

    }
  );
}


// =====================================================
// الموافقة على الطلب
// =====================================================

async function approveRequest(
  requestId
) {

  if (isProcessing) {
    return;
  }


  const request =
    allRequests.find(
      item =>
        item.id ===
        requestId
    );


  if (!request) {

    showMessage(
      "تعذر العثور على الطلب.",
      "error"
    );

    return;
  }


  if (
    request.status !==
    "pending"
  ) {

    showMessage(
      "هذا الطلب تمت معالجته مسبقاً.",
      "warning"
    );

    return;
  }


  const userName =
    request.profile?.full_name ||
    "هذا المستخدم";


  const confirmed =
    window.confirm(
      `هل أنت متأكد من الموافقة على طلب اشتراك ${userName}؟`
    );


  if (!confirmed) {
    return;
  }


  isProcessing = true;

  setProcessingState(
    requestId,
    "approve"
  );


  try {

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "approve_subscription_request",
        {
          p_request_id:
            requestId
        }
      );


    if (error) {
      throw error;
    }


    console.log(
      "Approve result:",
      data
    );


    showMessage(
      "تمت الموافقة على طلب الاشتراك بنجاح.",
      "success"
    );


    await loadRequests({
      silent: true
    });


  } catch (error) {

    console.error(
      "Approve request error:",
      error
    );


    showMessage(
      getFriendlyError(error),
      "error"
    );


  } finally {

    isProcessing = false;

    clearProcessingState(
      requestId
    );
  }
}


// =====================================================
// رفض الطلب
// =====================================================

async function rejectRequest(
  requestId
) {

  if (isProcessing) {
    return;
  }


  const request =
    allRequests.find(
      item =>
        item.id ===
        requestId
    );


  if (!request) {

    showMessage(
      "تعذر العثور على الطلب.",
      "error"
    );

    return;
  }


  if (
    request.status !==
    "pending"
  ) {

    showMessage(
      "هذا الطلب تمت معالجته مسبقاً.",
      "warning"
    );

    return;
  }


  const userName =
    request.profile?.full_name ||
    "المستخدم";


  const adminNotes =
    window.prompt(
      `اكتب سبب رفض طلب ${userName}:\n\nيمكنك الضغط على إلغاء للرجوع.`,
      ""
    );


  if (adminNotes === null) {
    return;
  }


  const reason =
    adminNotes.trim();


  if (!reason) {

    showMessage(
      "يجب كتابة سبب رفض الطلب.",
      "warning"
    );

    return;
  }


  const confirmed =
    window.confirm(
      "هل أنت متأكد من رفض هذا الطلب؟"
    );


  if (!confirmed) {
    return;
  }


  isProcessing = true;

  setProcessingState(
    requestId,
    "reject"
  );


  try {

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "reject_subscription_request",
        {
          p_request_id:
            requestId,

          p_admin_notes:
            reason
        }
      );


    if (error) {
      throw error;
    }


    console.log(
      "Reject result:",
      data
    );


    showMessage(
      "تم رفض طلب الاشتراك.",
      "success"
    );


    await loadRequests({
      silent: true
    });


  } catch (error) {

    console.error(
      "Reject request error:",
      error
    );


    showMessage(
      getFriendlyError(error),
      "error"
    );


  } finally {

    isProcessing = false;

    clearProcessingState(
      requestId
    );
  }
}


// =====================================================
// حالة معالجة الزر
// =====================================================

function setProcessingState(
  requestId,
  action
) {

  if (!requestsContainer) {
    return;
  }


  const card =
    requestsContainer.querySelector(
      `[data-request-id="${cssEscape(
        requestId
      )}"]`
    );


  if (!card) {
    return;
  }


  const buttons =
    card.querySelectorAll(
      "[data-action]"
    );


  buttons.forEach(
    button => {

      button.disabled = true;

      button.dataset.originalText =
        button.innerText;

    }
  );


  const target =
    card.querySelector(
      `[data-action="${cssEscape(
        action
      )}"]`
    );


  if (target) {

    target.innerText =
      action === "approve"
        ? "جاري الموافقة..."
        : "جاري الرفض...";
  }
}


// =====================================================
// إعادة الأزرار
// =====================================================

function clearProcessingState(
  requestId
) {

  if (!requestsContainer) {
    return;
  }


  const card =
    requestsContainer.querySelector(
      `[data-request-id="${cssEscape(
        requestId
      )}"]`
    );


  if (!card) {
    return;
  }


  const buttons =
    card.querySelectorAll(
      "[data-action]"
    );


  buttons.forEach(
    button => {

      button.disabled = false;


      if (
        button.dataset.originalText
      ) {

        button.innerText =
          button.dataset.originalText;
      }

    }
  );
}


// =====================================================
// Polling
// =====================================================

function startPolling() {

  stopPolling();


  pollTimer =
    setInterval(
      async () => {

        if (
          document.hidden ||
          isProcessing ||
          isLoading
        ) {
          return;
        }


        await loadRequests({
          silent: true
        });

      },
      ADMIN_POLL_INTERVAL
    );
}


// =====================================================
// إيقاف Polling
// =====================================================

function stopPolling() {

  if (pollTimer) {

    clearInterval(
      pollTimer
    );

    pollTimer = null;
  }
}


// =====================================================
// عند مغادرة الصفحة
// =====================================================

window.addEventListener(
  "beforeunload",
  stopPolling
);


// =====================================================
// إظهار رسالة
// =====================================================

function showMessage(
  message,
  type = "info"
) {

  if (!adminMessage) {
    return;
  }


  adminMessage.textContent =
    message;


  adminMessage.className =
    `admin-message ${type}`;


  adminMessage.hidden = false;
}


// =====================================================
// إخفاء الرسالة
// =====================================================

function hideMessage() {

  if (!adminMessage) {
    return;
  }


  adminMessage.hidden = true;

  adminMessage.textContent = "";
}


// =====================================================
// Loading
// =====================================================

function showLoading() {

  if (!requestsContainer) {
    return;
  }


  requestsContainer.innerHTML = `
    <div class="empty-state">

      <div class="empty-state-icon">
        ⏳
      </div>

      <h3>
        جاري تحميل الطلبات
      </h3>

      <p>
        انتظر قليلاً...
      </p>

    </div>
  `;
}


// =====================================================
// Empty state
// =====================================================

function renderEmptyState() {

  requestsContainer.innerHTML = `
    <div class="empty-state">

      <div class="empty-state-icon">
        ✓
      </div>

      <h3>
        لا توجد طلبات اشتراك
      </h3>

      <p>
        لم يتم العثور على أي طلبات حتى الآن.
      </p>

    </div>
  `;
}


// =====================================================
// Filter empty
// =====================================================

function renderFilterEmptyState() {

  const filterName =
    getFilterName(
      currentFilter
    );


  requestsContainer.innerHTML = `
    <div class="filter-empty">

      <div class="filter-empty-icon">
        🔎
      </div>

      <h3>
        لا توجد نتائج
      </h3>

      <p>
        لا توجد طلبات ضمن فلتر ${escapeHtml(
          filterName
        )}${currentSearch
          ? " أو تطابق البحث الحالي"
          : ""}.
      </p>

    </div>
  `;
}


// =====================================================
// Error state
// =====================================================

function showErrorState() {

  if (!requestsContainer) {
    return;
  }


  requestsContainer.innerHTML = `
    <div class="empty-state">

      <div class="empty-state-icon">
        !
      </div>

      <h3>
        تعذر تحميل الطلبات
      </h3>

      <p>
        حاول تحديث الصفحة مرة أخرى.
      </p>

    </div>
  `;
}


// =====================================================
// اسم الخطة
// =====================================================

function getPlanName(
  request
) {

  if (
    request &&
    request.plan &&
    request.plan.name
  ) {

    return request.plan.name;
  }


  if (
    request &&
    request.plan &&
    request.plan.code
  ) {

    return formatPlanCode(
      request.plan.code
    );
  }


  if (
    request &&
    request.plan_id
  ) {

    return `اشتراك #${request.plan_id}`;
  }


  return "غير محددة";
}


// =====================================================
// تنسيق كود الخطة
// =====================================================

function formatPlanCode(
  code
) {

  const value =
    String(
      code || ""
    )
      .trim()
      .toLowerCase();


  if (
    value === "monthly"
  ) {

    return "اشتراك شهري";
  }


  if (
    value === "yearly" ||
    value === "annual"
  ) {

    return "اشتراك سنوي";
  }


  return String(
    code || "غير محددة"
  );
}


// =====================================================
// طريقة الدفع
// =====================================================

function getPaymentMethodName(
  method
) {

  const value =
    String(
      method || ""
    )
      .trim()
      .toLowerCase();


  switch (value) {

    case "zain_cash":
    case "zaincash":
    case "zain cash":

      return "Zain Cash";


    case "mastercard":
    case "master_card":

      return "MasterCard";


    case "cash":

      return "نقدي";


    default:

      return method ||
        "غير محددة";
  }
}


// =====================================================
// اسم الحالة
// =====================================================

function getStatusName(
  status
) {

  switch (status) {

    case "pending":
      return "قيد المراجعة";


    case "approved":
      return "تمت الموافقة";


    case "rejected":
      return "مرفوض";


    default:
      return "غير معروف";
  }
}


// =====================================================
// اسم الفلتر
// =====================================================

function getFilterName(
  filter
) {

  switch (filter) {

    case "pending":
      return "قيد المراجعة";


    case "approved":
      return "تمت الموافقة";


    case "rejected":
      return "المرفوضة";


    default:
      return "الكل";
  }
}


// =====================================================
// تنسيق العملة
// =====================================================

function formatCurrency(
  value
) {

  const amount =
    Number(value || 0);


  return new Intl.NumberFormat(
    "en-IQ"
  ).format(amount) +
    " د.ع";
}


// =====================================================
// تنسيق الأرقام
// =====================================================

function formatNumber(
  value
) {

  return new Intl.NumberFormat(
    "en-US"
  ).format(
    Number(value || 0)
  );
}


// =====================================================
// تنسيق التاريخ والوقت
// =====================================================

function formatDateTime(
  value
) {

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
      timeZone:
        "Asia/Baghdad",

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        true
    }
  ).format(date);
}


// =====================================================
// الأحرف الأولى
// =====================================================

function getInitials(
  name
) {

  const value =
    String(
      name || ""
    ).trim();


  if (!value) {
    return "Z";
  }


  const parts =
    value
      .split(/\s+/)
      .filter(Boolean);


  if (parts.length === 1) {

    return parts[0]
      .slice(0, 2);
  }


  return (
    parts[0][0] +
    parts[1][0]
  );
}


// =====================================================
// حماية HTML
// =====================================================

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
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
// حماية Attribute
// =====================================================

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );
}


// =====================================================
// CSS.escape بديل آمن
// =====================================================

function cssEscape(
  value
) {

  const stringValue =
    String(
      value ?? ""
    );


  if (
    window.CSS &&
    typeof window.CSS.escape ===
      "function"
  ) {

    return window.CSS.escape(
      stringValue
    );
  }


  return stringValue.replace(
    /[^a-zA-Z0-9_-]/g,
    "\\$&"
  );
}


// =====================================================
// الأخطاء المفهومة للمستخدم
// =====================================================

function getFriendlyError(
  error
) {

  if (!error) {

    return "حدث خطأ غير متوقع.";
  }


  const rawMessage =
    String(
      error.message ||
      error.details ||
      error.hint ||
      error
    );


  const message =
    rawMessage.toLowerCase();


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

    return "ليس لديك صلاحية لتنفيذ هذا الإجراء.";
  }


  if (
    message.includes(
      "is_admin"
    )
  ) {

    return "تعذر التحقق من صلاحيات الأدمن.";
  }


  if (
    message.includes(
      "approve_subscription_request"
    )
  ) {

    return "تعذر تنفيذ الموافقة. تأكد من وجود دالة الموافقة في قاعدة البيانات.";
  }


  if (
    message.includes(
      "reject_subscription_request"
    )
  ) {

    return "تعذر تنفيذ الرفض. تأكد من وجود دالة الرفض في قاعدة البيانات.";
  }


  if (
    message.includes(
      "network"
    ) ||
    message.includes(
      "fetch"
    )
  ) {

    return "تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.";
  }


  return rawMessage ||
    "حدث خطأ غير متوقع.";
}


// =====================================================
// حماية إضافية عند إخفاء الصفحة
// =====================================================

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      !document.hidden &&
      currentUser &&
      !isProcessing &&
      !isLoading
    ) {

      loadRequests({
        silent: true
      });
    }

  }
);