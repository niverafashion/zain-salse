/* ZAIN SALES - SALES RECORD */
document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireSubscription();

  if (!user) return;

const $ = id => document.getElementById(id);

const fmt = new Intl.NumberFormat("en-IQ");

const state = {
  user: null,
  sales: [],
  filtered: [],
  packages: [],
  selected: null,
  page: 1,
  pageSize: 10,
  busy: false
};

const labels = {
  paid: "مدفوع بالكامل",
  partial: "مدفوع جزئياً",
  unpaid: "غير مدفوع",
  new: "جديد",
  replacement: "استبدال",
  renewal: "تجديد",
  other: "أخرى",
  cash: "كاش",
  mastercard: "ماستر كارد",
  zain_cash: "زين كاش"
};

function iq(value) {
  return `${fmt.format(Number(value) || 0)} د.ع`;
}

function normalizeDigits(value) {
  return String(value)
    .replace(/[٠-٩]/g, d =>
      String(d.charCodeAt(0) - 1632)
    )
    .replace(/[۰-۹]/g, d =>
      String(d.charCodeAt(0) - 1776)
    );
}

function message(text, error = false, target = "salesMessage") {
  const el = $(target);
  el.textContent = text;
  el.className = "sales-message" +
    (error ? " error" : text ? " success" : "");
}

function node(tag, text, className = "") {
  const el = document.createElement(tag);
  el.textContent = text ?? "";
  if (className) el.className = className;
  return el;
}

function setBusy(value) {
  state.busy = value;

  [
    "toggleEdit",
    "togglePayment",
    "voidSale"
  ].forEach(id => {
    $(id).disabled = value;
  });

  $("editSaleForm")
    .querySelector("button[type=submit]")
    .disabled = value;

  $("paymentForm")
    .querySelector("button[type=submit]")
    .disabled = value;
}

/* SIDEBAR */

function initSidebar() {
  const sidebar = $("sidebar");
  const overlay = $("sidebarOverlay");
  const button = $("menuBtn");

  function close() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    button.setAttribute("aria-expanded", "false");
  }

  button.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");
    overlay.classList.toggle("show", open);
    button.setAttribute("aria-expanded", String(open));
  });

  overlay.addEventListener("click", close);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (!$("saleModal").hidden) closeModal();
      else close();
    }
  });
}

/* LOAD DATA */

async function loadPackages() {
  const { data, error } = await supabaseClient
    .from("packages")
    .select("id,name,price,is_active")
    .order("id");

  if (error) throw error;

  state.packages = data || [];

  for (const selectId of ["filterPackage", "editPackage"]) {
    const select = $(selectId);

    if (selectId === "editPackage") {
      select.replaceChildren();
    }

    state.packages.forEach(pkg => {
      const option = new Option(
        `${pkg.name} — ${iq(pkg.price)}`,
        String(pkg.id)
      );

      if (!pkg.is_active && selectId === "editPackage") {
        option.disabled = true;
      }

      select.appendChild(option);
    });
  }
}

async function loadSales() {
  message("جاري تحميل المبيعات...");

  const all = [];
  const batchSize = 500;
  let from = 0;

  // Retrieve in batches to avoid the default
  // 1,000-row API response limit.
  while (true) {
    const { data, error } = await supabaseClient
      .from("sales_summary")
      .select("*")
      .eq("user_id", state.user.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + batchSize - 1);

    if (error) throw error;

    all.push(...(data || []));

    if (!data || data.length < batchSize) break;

    from += batchSize;
  }

  state.sales = all;
  applyFilters();
  message("");
}

/* FILTERS */

function applyFilters() {
  const search = normalizeDigits(
    $("salesSearch").value.trim()
  ).toLowerCase();

  const pkg = $("filterPackage").value;
  const type = $("filterType").value;
  const status = $("filterStatus").value;
  const from = $("dateFrom").value;
  const to = $("dateTo").value;

  if (from && to && from > to) {
    message("تاريخ البداية لازم يكون قبل تاريخ النهاية.", true);
    return;
  }

  state.filtered = state.sales.filter(sale => {
    const name = sale.customer_name.toLowerCase();

    if (
      search &&
      !name.includes(search) &&
      !sale.phone_number.includes(search)
    ) return false;

    if (pkg && String(sale.package_id) !== pkg) {
      return false;
    }

    if (type && sale.line_type !== type) {
      return false;
    }

    if (status === "debts") {
      if (Number(sale.remaining_amount) <= 0) {
        return false;
      }
    } else if (
      status &&
      sale.payment_status !== status
    ) {
      return false;
    }

    if (from && sale.sale_date < from) return false;
    if (to && sale.sale_date > to) return false;

    return true;
  });

  state.page = 1;
  renderSummary();
  renderTable();
  message("");
}

function resetFilters() {
  $("filterForm").reset();

  if (new URLSearchParams(location.search)
      .get("filter") === "debts") {
    history.replaceState(null, "", "sales.html");
    $("pageTitle").textContent = "سجل المبيعات";
  }

  applyFilters();
}

/* SUMMARY */

function renderSummary() {
  const totals = state.filtered.reduce(
    (acc, sale) => {
      acc.total += Number(sale.sale_amount);
      acc.received += Number(sale.received_amount);
      acc.debts += Number(sale.remaining_amount);
      return acc;
    },
    { total: 0, received: 0, debts: 0 }
  );

  $("salesCount").textContent =
    fmt.format(state.filtered.length);

  $("salesTotal").textContent =
    fmt.format(totals.total);

  $("salesReceived").textContent =
    fmt.format(totals.received);

  $("salesDebts").textContent =
    fmt.format(totals.debts);
}

/* TABLE */

function renderTable() {
  const tbody = $("salesTableBody");
  tbody.replaceChildren();

  const total = state.filtered.length;
  const pages = Math.max(
    1,
    Math.ceil(total / state.pageSize)
  );

  state.page = Math.min(state.page, pages);

  const start = (state.page - 1) * state.pageSize;

  const current = state.filtered.slice(
    start,
    start + state.pageSize
  );

  $("resultsCount").textContent =
    `${fmt.format(total)} عملية مطابقة`;

  $("pageInfo").textContent =
    `صفحة ${state.page} من ${pages}`;

  $("prevPage").disabled = state.page <= 1;
  $("nextPage").disabled = state.page >= pages;

  if (!current.length) {
    const tr = document.createElement("tr");
    const td = node(
      "td",
      "ماكو عمليات بيع مطابقة للبحث.",
      "empty-table"
    );
    td.colSpan = 9;
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  current.forEach(sale => {
    const tr = document.createElement("tr");

    const values = [
      sale.customer_name,
      sale.phone_number,
      sale.package_name,
      sale.sale_date,
      fmt.format(sale.sale_amount),
      fmt.format(sale.received_amount),
      fmt.format(sale.remaining_amount)
    ];

    values.forEach((value, index) => {
      const td = node("td", value);

      if (index === 0) td.className = "customer-name";
      if (index === 1) td.className = "phone-cell";

      tr.appendChild(td);
    });

    const statusCell = document.createElement("td");

    statusCell.appendChild(
      node(
        "span",
        labels[sale.payment_status],
        `payment-badge ${sale.payment_status}`
      )
    );

    tr.appendChild(statusCell);

    const actionsCell = document.createElement("td");

    const detailsButton = node(
      "button",
      "التفاصيل",
      "sales-details-button"
    );

    detailsButton.type = "button";
    detailsButton.addEventListener(
      "click",
      () => openModal(sale.id)
    );

    actionsCell.appendChild(detailsButton);
    tr.appendChild(actionsCell);

    tbody.appendChild(tr);
  });
}

/* SALE DETAILS */

function addDetail(container, label, value) {
  const item = node("div", "", "sales-detail-item");
  item.append(
    node("span", label),
    node("strong", value)
  );
  container.appendChild(item);
}

function renderDetails() {
  const sale = state.selected;
  if (!sale) return;

  const container = $("saleDetails");
  container.replaceChildren();

  const grid = node("div", "", "sales-details-grid");

  [
    ["اسم الزبون", sale.customer_name],
    ["رقم الخط", sale.phone_number],
    ["تاريخ البيع", sale.sale_date],
    ["نوع الخط", labels[sale.line_type]],
    ["الباقة", sale.package_name],
    ["طريقة الدفع", labels[sale.payment_method]],
    ["مبلغ البيع", iq(sale.sale_amount)],
    ["المستلم", iq(sale.received_amount)],
    ["الدين المتبقي", iq(sale.remaining_amount)],
    ["حالة الدفع", labels[sale.payment_status]]
  ].forEach(([label, value]) => {
    addDetail(grid, label, value);
  });

  container.appendChild(grid);

  if (sale.notes) {
    const notes = node(
      "div",
      "",
      "sales-detail-notes"
    );
    notes.append(
      node("strong", "الملاحظات"),
      node("p", sale.notes)
    );
    container.appendChild(notes);
  }

  const hasDebt = Number(sale.remaining_amount) > 0;

  $("togglePayment").hidden = !hasDebt;
  $("paymentForm").hidden = true;
  $("editSaleForm").hidden = true;
}

function openModal(id) {
  state.selected = state.sales.find(
    sale => sale.id === id
  );

  if (!state.selected) return;

  message("", false, "modalMessage");

  renderDetails();

  $("saleModal").hidden = false;
  document.body.classList.add("modal-open");
  $("closeModal").focus();
}

function closeModal() {
  if (state.busy) return;

  $("saleModal").hidden = true;
  document.body.classList.remove("modal-open");
  state.selected = null;
  $("editSaleForm").hidden = true;
  $("paymentForm").hidden = true;
}

function populateEditForm() {
  const s = state.selected;

  $("editCustomer").value = s.customer_name;
  $("editPhone").value = s.phone_number;
  $("editDate").value = s.sale_date;
  $("editType").value = s.line_type;
  $("editPackage").value = String(s.package_id);
  $("editMethod").value = s.payment_method;
  $("editNotes").value = s.notes || "";

  // Preserve a discontinued package on an
  // existing sale until another one is chosen.
  const existing = Array.from(
    $("editPackage").options
  ).find(option => option.value === String(s.package_id));

  if (existing) existing.disabled = false;
}

/* EDIT SALE */

async function saveEdit(event) {
  event.preventDefault();

  if (state.busy || !state.selected) return;

  const name = $("editCustomer").value.trim();
  const phone = normalizeDigits(
    $("editPhone").value.trim()
  );

  if (name.length < 2) {
    message("اسم الزبون قصير جداً.", true, "modalMessage");
    return;
  }

  if (!/^078[0-9]{8}$/.test(phone)) {
    message(
      "رقم الخط يجب أن يبدأ بـ 078 ويتكون من 11 رقماً.",
      true,
      "modalMessage"
    );
    return;
  }

  setBusy(true);

  try {
    const { error } = await supabaseClient
      .from("sales")
      .update({
        customer_name: name,
        phone_number: phone,
        sale_date: $("editDate").value,
        line_type: $("editType").value,
        package_id: Number($("editPackage").value),
        payment_method: $("editMethod").value,
        notes: $("editNotes").value.trim() || null
      })
      .eq("id", state.selected.id)
      .eq("user_id", state.user.id);

    if (error) throw error;

    await loadSales();

    const updated = state.sales.find(
      s => s.id === state.selected.id
    );

    if (updated) {
      state.selected = updated;
      renderDetails();
    } else {
      closeModal();
    }

    message(
      "تم حفظ التعديلات بنجاح.",
      false,
      "modalMessage"
    );

  } catch (error) {
    console.error(error);
    message(
      "تعذر تعديل العملية. تحقق من البيانات والمبالغ المستلمة.",
      true,
      "modalMessage"
    );
  } finally {
    setBusy(false);
  }
}

/* RECEIVE PAYMENT */

async function receivePayment(event) {
  event.preventDefault();

  if (state.busy || !state.selected) return;

  const amount = Number(
    normalizeDigits($("paymentAmount").value)
  );

  const remaining = Number(
    state.selected.remaining_amount
  );

  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    amount > remaining
  ) {
    message(
      `المبلغ يجب أن يكون بين 1 و${iq(remaining)}.`,
      true,
      "modalMessage"
    );
    return;
  }

  setBusy(true);

  try {
    const { error } = await supabaseClient
      .from("payments")
      .insert({
        sale_id: state.selected.id,
        amount,
        payment_method: $("debtPaymentMethod").value,
        notes: $("paymentNotes").value.trim() || null
      });

    if (error) throw error;

    const id = state.selected.id;

    await loadSales();

    const updated = state.sales.find(
      sale => sale.id === id
    );

    if (updated) {
      state.selected = updated;
      renderDetails();
    } else {
      closeModal();
    }

    $("paymentForm").reset();

    message(
      "تم تسجيل المبلغ المستلم وتحديث الدين.",
      false,
      "modalMessage"
    );

  } catch (error) {
    console.error(error);
    message(
      "تعذر تأكيد التسديد. تحقق من سجل الدفعات قبل إعادة المحاولة.",
      true,
      "modalMessage"
    );
  } finally {
    setBusy(false);
  }
}

/* CANCEL SALE */

async function cancelSale() {
  if (state.busy || !state.selected) return;

  if (Number(state.selected.received_amount) > 0) {
    message(
      "هذه العملية تحتوي على مبالغ مستلمة. راجع الدفعات وسوِّ المبالغ قبل إلغائها.",
      true,
      "modalMessage"
    );
    return;
  }

  const reason = prompt(
    "اكتب سبب إلغاء عملية البيع:"
  );

  if (reason === null) return;

  if (!reason.trim()) {
    message(
      "سبب الإلغاء مطلوب.",
      true,
      "modalMessage"
    );
    return;
  }

  if (!confirm(
    "متأكد تريد تلغي العملية؟ راح تختفي من المبيعات النشطة، لكن يبقى سجلها محفوظ."
  )) return;

  setBusy(true);

  try {
    const { error } = await supabaseClient
      .from("sales")
      .update({
        voided_at: new Date().toISOString(),
        void_reason: reason.trim()
      })
      .eq("id", state.selected.id)
      .eq("user_id", state.user.id);

    if (error) throw error;

    setBusy(false);
    closeModal();

    await loadSales();
    message("تم إلغاء العملية والاحتفاظ بسجلها.");

  } catch (error) {
    console.error(error);
    message(
      "تعذر إلغاء العملية.",
      true,
      "modalMessage"
    );
  } finally {
    setBusy(false);
  }
}

/* INITIALIZE */

async function initializeSales() {
  const user = await requireAuth();
  if (!user) return;

  state.user = user;
  $("content").hidden = false;

  initSidebar();

  $("logoutBtn").addEventListener("click", logout);

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  $("sidebarUserName").textContent =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "مندوب المبيعات";

  $("filterForm").addEventListener(
    "submit",
    event => {
      event.preventDefault();
      applyFilters();
    }
  );

  $("resetFilters").addEventListener(
    "click",
    resetFilters
  );

  $("prevPage").addEventListener("click", () => {
    if (state.page > 1) {
      state.page--;
      renderTable();
    }
  });

  $("nextPage").addEventListener("click", () => {
    if (
      state.page * state.pageSize <
      state.filtered.length
    ) {
      state.page++;
      renderTable();
    }
  });

  $("closeModal").addEventListener(
    "click",
    closeModal
  );

  $("modalBackdrop").addEventListener(
    "click",
    closeModal
  );

  $("toggleEdit").addEventListener("click", () => {
    populateEditForm();

    $("editSaleForm").hidden =
      !$("editSaleForm").hidden;

    $("paymentForm").hidden = true;
  });

  $("togglePayment").addEventListener("click", () => {
    $("paymentForm").hidden =
      !$("paymentForm").hidden;

    $("editSaleForm").hidden = true;

    if (state.selected) {
      $("paymentAmount").max =
        state.selected.remaining_amount;
    }
  });

  $("editSaleForm").addEventListener(
    "submit",
    saveEdit
  );

  $("paymentForm").addEventListener(
    "submit",
    receivePayment
  );

  $("voidSale").addEventListener(
    "click",
    cancelSale
  );

  $("editPhone").addEventListener("input", () => {
    $("editPhone").value = normalizeDigits(
      $("editPhone").value
    ).replace(/[^0-9]/g, "").slice(0, 11);
  });

  // Open the debt view when coming from
  // the dashboard's debt shortcut.
  if (
    new URLSearchParams(location.search)
      .get("filter") === "debts"
  ) {
    $("filterStatus").value = "debts";
    $("pageTitle").textContent = "إدارة الديون";
    $("salesNavLink").classList.remove("active");
    $("debtsNavLink").classList.add("active");
  }

  try {
    await loadPackages();
    await loadSales();
  } catch (error) {
    console.error(error);
    message(
      "تعذر تحميل سجل المبيعات. تأكد من الاتصال بقاعدة البيانات.",
      true
    );
  }
}

initializeSales().catch(error => {
  console.error(error);
  message("حدث خطأ أثناء فتح سجل المبيعات.", true);
});
});