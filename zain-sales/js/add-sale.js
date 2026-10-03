/* ======================================
   ZAIN SALES - ADD SALE
====================================== */
document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireSubscription();

  if (!user) return;

const saleForm = document.getElementById("saleForm");

const customerName =
  document.getElementById("customerName");

const phoneNumber =
  document.getElementById("phoneNumber");

const saleDate =
  document.getElementById("saleDate");

const lineType =
  document.getElementById("lineType");

const packageId =
  document.getElementById("packageId");

const paymentStatus =
  document.getElementById("paymentStatus");

const paymentMethod =
  document.getElementById("paymentMethod");

const receivedAmount =
  document.getElementById("receivedAmount");

const receivedAmountGroup =
  document.getElementById("receivedAmountGroup");

const saveSaleBtn =
  document.getElementById("saveSaleBtn");

const saleMessage =
  document.getElementById("saleMessage");

let packages = [];
let isSaving = false;

const money = new Intl.NumberFormat("en-IQ");

function formatIQD(amount) {
  return `${money.format(amount)} د.ع`;
}

// Baghdad local date, not UTC.
function getToday() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Baghdad",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function showMessage(message, type = "error") {
  saleMessage.textContent = message;
  saleMessage.className = `sale-message ${type}`;
}

function clearMessage() {
  saleMessage.textContent = "";
  saleMessage.className = "sale-message";
}

// Convert Arabic and Persian numerals.
function normalizeDigits(value) {
  return String(value)
    .replace(/[٠-٩]/g, digit =>
      String(digit.charCodeAt(0) - 1632)
    )
    .replace(/[۰-۹]/g, digit =>
      String(digit.charCodeAt(0) - 1776)
    );
}

// LOAD PACKAGES FROM SUPABASE

async function loadPackages() {
  const { data, error } = await supabaseClient
    .from("packages")
    .select("id,name,price")
    .eq("is_active", true)
    .order("id", { ascending: true });

  if (error) {
    throw new Error("تعذر تحميل الباقات من قاعدة البيانات.");
  }

  packages = data || [];

  packageId.replaceChildren();

  if (packages.length === 0) {
    throw new Error("ماكو باقات مفعلة في قاعدة البيانات.");
  }

  packages.forEach(item => {
    const option = document.createElement("option");

    option.value = item.id;
    option.textContent =
      `${item.name} — ${formatIQD(item.price)}`;

    packageId.appendChild(option);
  });

  packageId.value = String(packages[0].id);
  packageId.disabled = false;

  updatePaymentSummary();
}

// CURRENT PACKAGE

function getSelectedPackage() {
  return packages.find(
    item => String(item.id) === packageId.value
  );
}

// CALCULATE PAYMENT

function calculatePayment() {
  const selected = getSelectedPackage();

  const total = Number(selected?.price || 0);

  let received = 0;

  if (paymentStatus.value === "paid") {
    received = total;
  }

  if (paymentStatus.value === "partial") {
    received = Number(receivedAmount.value || 0);
  }

  return {
    total,
    received,
    remaining: Math.max(0, total - received)
  };
}

// UPDATE SUMMARY

function updatePaymentSummary() {
  const { total, received, remaining } =
    calculatePayment();

  document.getElementById("saleAmount")
    .textContent = money.format(total);

  document.getElementById("summaryTotal")
    .textContent = formatIQD(total);

  document.getElementById("summaryReceived")
    .textContent = formatIQD(received);

  document.getElementById("summaryRemaining")
    .textContent = formatIQD(remaining);

  const isPartial = paymentStatus.value === "partial";
  const isUnpaid = paymentStatus.value === "unpaid";

  receivedAmountGroup.hidden = !isPartial;
  receivedAmount.required = isPartial;

  paymentMethod.disabled = isUnpaid;

  document.getElementById("paymentMethodHint")
    .textContent = isUnpaid
      ? "تحدد طريقة الدفع عند استلام الدين لاحقاً."
      : "طريقة استلام المبلغ من الزبون.";
}

// VALIDATE SALE

function validateSale() {
  const name = customerName.value.trim();

  const phone = normalizeDigits(
    phoneNumber.value.trim()
  );

  const selected = getSelectedPackage();

  const { total, received } = calculatePayment();

  if (name.length < 2) {
    throw new Error("أدخل اسم الزبون بصورة صحيحة.");
  }

  if (!/^078[0-9]{8}$/.test(phone)) {
    throw new Error(
      "رقم الخط يجب أن يبدأ بـ 078 ويتكون من 11 رقماً."
    );
  }

  if (!saleDate.value) {
    throw new Error("حدد تاريخ البيع.");
  }

  if (!selected) {
    throw new Error("اختار إحدى الباقات.");
  }

  if (
    !Number.isFinite(received) ||
    !Number.isInteger(received) ||
    received < 0 ||
    received > total
  ) {
    throw new Error("المبلغ المستلم غير صحيح.");
  }

  if (
    paymentStatus.value === "partial" &&
    (received <= 0 || received >= total)
  ) {
    throw new Error(
      "بالدفع الجزئي، المبلغ المستلم لازم يكون أكبر من صفر وأقل من سعر الباقة."
    );
  }

  return {
    name,
    phone,
    selected,
    received
  };
}

// SAVE SALE USING THE DATABASE FUNCTION

async function saveSale(event) {
  event.preventDefault();

  if (isSaving) return;

  clearMessage();

  let validated;

  try {
    validated = validateSale();
  } catch (error) {
    showMessage(error.message);
    return;
  }

  isSaving = true;
  saveSaleBtn.disabled = true;
  saveSaleBtn.textContent = "جاري حفظ العملية...";

  try {
    const { data, error } = await supabaseClient.rpc(
      "create_sale",
      {
        p_customer_name: validated.name,
        p_phone_number: validated.phone,
        p_package_id: Number(validated.selected.id),
        p_line_type: lineType.value,
        p_sale_date: saleDate.value,
        p_payment_method: paymentMethod.disabled
          ? "cash"
          : paymentMethod.value,
        p_received_amount: validated.received,
        p_notes: document
          .getElementById("saleNotes")
          .value.trim() || null
      }
    );

    if (error) {
      console.error("Save sale error:", error);
      throw new Error(
        "تعذر حفظ العملية. تأكد من الاتصال وصحة البيانات."
      );
    }

    console.log("Created sale:", data);

    showMessage(
      "تم حفظ عملية البيع بنجاح!",
      "success"
    );

    // Clear form only after successful save.
    saleForm.reset();

    saleDate.value = getToday();

    if (packages.length) {
      packageId.value = String(packages[0].id);
    }

    updatePaymentSummary();

    customerName.focus();

  } catch (error) {
    showMessage(error.message);

  } finally {
    isSaving = false;
    saveSaleBtn.disabled = false;
    saveSaleBtn.textContent = "حفظ عملية البيع";
  }
}

// MOBILE SIDEBAR

function initializeSaleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay =
    document.getElementById("sidebarOverlay");
  const menuBtn =
    document.getElementById("menuBtn");

  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  menuBtn.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");

    overlay.classList.toggle("show", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  });

  overlay.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeSidebar();
  });
}

// INITIALIZE PAGE

async function initializeAddSale() {
  const user = await requireAuth();

  if (!user) return;

  document.getElementById("content").hidden = false;

  initializeSaleSidebar();

  document.getElementById("logoutBtn")
    .addEventListener("click", logout);

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  document.getElementById("sidebarUserName")
    .textContent =
      profile?.full_name?.trim()
      || user.email?.split("@")[0]
      || "مندوب المبيعات";

  saleDate.value = getToday();

  phoneNumber.addEventListener("input", () => {
    phoneNumber.value = normalizeDigits(
      phoneNumber.value
    ).replace(/[^0-9]/g, "").slice(0, 11);
  });

  packageId.addEventListener(
    "change",
    updatePaymentSummary
  );

  paymentStatus.addEventListener("change", () => {
    receivedAmount.value = "";
    updatePaymentSummary();
  });

  receivedAmount.addEventListener(
    "input",
    updatePaymentSummary
  );

  saleForm.addEventListener("submit", saveSale);

  try {
    await loadPackages();
    saveSaleBtn.disabled = false;

  } catch (error) {
    console.error(error);
    showMessage(error.message);
  }
}

initializeAddSale().catch(error => {
  console.error("Initialization error:", error);
  showMessage("تعذر تهيئة صفحة إضافة المبيعات.");
});
});