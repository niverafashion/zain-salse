/* ======================================
   ZAIN SALES - ADD SALE
====================================== */

document.addEventListener("DOMContentLoaded", async () => {

  const user = await requireSubscription();

  if (!user) return;


  // ======================================
  // ELEMENTS
  // ======================================

  const saleForm =
    document.getElementById("saleForm");

  const customerName =
    document.getElementById("customerName");

  const phoneNumber =
    document.getElementById("phoneNumber");

  const saleDate =
    document.getElementById("saleDate");

  const saleTime =
    document.getElementById("saleTime");

  const saleArea =
    document.getElementById("saleArea");

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


  // ======================================
  // VARIABLES
  // ======================================

  let packages = [];

  let isSaving = false;

  let currentIdempotencyKey = null;


  // ======================================
  // NUMBER FORMAT
  // ======================================

  const money =
    new Intl.NumberFormat("en-IQ");


  function formatIQD(amount) {
    return `${money.format(amount)} د.ع`;
  }


  // ======================================
  // BAGHDAD DATE
  // ======================================

  function getToday() {

    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Baghdad",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());

  }


  // ======================================
  // BAGHDAD TIME
  // ======================================

  function getCurrentTime() {

    const parts =
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Baghdad",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).formatToParts(new Date());


    const hour =
      parts.find(
        part => part.type === "hour"
      )?.value || "00";


    const minute =
      parts.find(
        part => part.type === "minute"
      )?.value || "00";


    return `${hour}:${minute}`;

  }


  // ======================================
  // SET CURRENT DATE + TIME
  // ======================================

  function setCurrentDateTime() {

    saleDate.value = getToday();

    saleTime.value = getCurrentTime();

  }


  // ======================================
  // CREATE NEW OPERATION KEY
  // ======================================

  function createIdempotencyKey() {

    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {

      return crypto.randomUUID();

    }


    // Fallback for older browsers.

    return [
      Date.now().toString(16),
      Math.random().toString(16).slice(2),
      Math.random().toString(16).slice(2)
    ].join("-");

  }


  // ======================================
  // SAVE MODAL
  // ======================================

  function createSaveModal() {

    if (
      document.getElementById(
        "saleSaveModal"
      )
    ) {

      return;

    }


    const modal =
      document.createElement("div");


    modal.id =
      "saleSaveModal";

    modal.className =
      "sale-save-modal";


    modal.innerHTML = `

      <div
        class="sale-save-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="saleSaveModalTitle"
      >

        <div
          id="saleSaveModalIcon"
          class="sale-save-modal-icon loading"
        >
          <div
            class="sale-save-spinner"
          ></div>
        </div>


        <h3
          id="saleSaveModalTitle"
          class="sale-save-modal-title"
        >
          جاري إضافة العملية
        </h3>


        <p
          id="saleSaveModalText"
          class="sale-save-modal-text"
        >
          يرجى الانتظار...
        </p>

      </div>

    `;


    document.body.appendChild(modal);

  }


  // ======================================
  // SHOW SAVE MODAL
  // ======================================

  function showSaveModal(
    type = "loading",
    title = "",
    message = ""
  ) {

    createSaveModal();


    const modal =
      document.getElementById(
        "saleSaveModal"
      );


    const icon =
      document.getElementById(
        "saleSaveModalIcon"
      );


    const titleElement =
      document.getElementById(
        "saleSaveModalTitle"
      );


    const textElement =
      document.getElementById(
        "saleSaveModalText"
      );


    modal.className =
      "sale-save-modal show";


    if (type === "loading") {

      icon.className =
        "sale-save-modal-icon loading";

      icon.innerHTML = `
        <div
          class="sale-save-spinner"
        ></div>
      `;

      modal.classList.remove(
        "success",
        "error"
      );

    }


    if (type === "success") {

      icon.className =
        "sale-save-modal-icon success";

      icon.innerHTML =
        "✓";

      modal.classList.add(
        "success"
      );

      modal.classList.remove(
        "error"
      );

    }


    if (type === "error") {

      icon.className =
        "sale-save-modal-icon error";

      icon.innerHTML =
        "×";

      modal.classList.add(
        "error"
      );

      modal.classList.remove(
        "success"
      );

    }


    titleElement.textContent =
      title;


    textElement.textContent =
      message;

  }


  // ======================================
  // HIDE SAVE MODAL
  // ======================================

  function hideSaveModal() {

    const modal =
      document.getElementById(
        "saleSaveModal"
      );


    if (!modal) return;


    modal.classList.remove(
      "show"
    );

  }


  // ======================================
  // SHOW MESSAGE
  // ======================================

  function showMessage(
    message,
    type = "error"
  ) {

    saleMessage.textContent =
      message;

    saleMessage.className =
      `sale-message ${type}`;

  }


  // ======================================
  // CLEAR MESSAGE
  // ======================================

  function clearMessage() {

    saleMessage.textContent =
      "";

    saleMessage.className =
      "sale-message";

  }


  // ======================================
  // NORMALIZE DIGITS
  // ======================================

  function normalizeDigits(value) {

    return String(value)

      .replace(/[٠-٩]/g, digit =>
        String(
          digit.charCodeAt(0) - 1632
        )
      )

      .replace(/[۰-۹]/g, digit =>
        String(
          digit.charCodeAt(0) - 1776
        )
      );

  }


  // ======================================
  // LOAD PACKAGES
  // ======================================

  async function loadPackages() {

    const {
      data,
      error
    } =
      await supabaseClient

        .from("packages")

        .select(
          "id,name,price"
        )

        .eq(
          "is_active",
          true
        )

        .order(
          "id",
          {
            ascending: true
          }
        );


    if (error) {

      throw new Error(
        "تعذر تحميل الباقات من قاعدة البيانات."
      );

    }


    packages =
      data || [];


    packageId.replaceChildren();


    if (
      packages.length === 0
    ) {

      throw new Error(
        "ماكو باقات مفعلة في قاعدة البيانات."
      );

    }


    packages.forEach(
      item => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          item.id;


        option.textContent =
          `${item.name} — ${formatIQD(item.price)}`;


        packageId.appendChild(
          option
        );

      }
    );


    packageId.value =
      String(
        packages[0].id
      );


    packageId.disabled =
      false;


    updatePaymentSummary();

  }


  // ======================================
  // GET SELECTED PACKAGE
  // ======================================

  function getSelectedPackage() {

    return packages.find(
      item =>
        String(item.id) ===
        packageId.value
    );

  }


  // ======================================
  // CALCULATE PAYMENT
  // ======================================

  function calculatePayment() {

    const selected =
      getSelectedPackage();


    const total =
      Number(
        selected?.price || 0
      );


    let received = 0;


    if (
      paymentStatus.value ===
      "paid"
    ) {

      received =
        total;

    }


    if (
      paymentStatus.value ===
      "partial"
    ) {

      received =
        Number(
          receivedAmount.value || 0
        );

    }


    return {

      total,

      received,

      remaining:
        Math.max(
          0,
          total - received
        )

    };

  }


  // ======================================
  // UPDATE PAYMENT SUMMARY
  // ======================================

  function updatePaymentSummary() {

    const {
      total,
      received,
      remaining
    } =
      calculatePayment();


    document.getElementById(
      "saleAmount"
    ).textContent =
      money.format(total);


    document.getElementById(
      "summaryTotal"
    ).textContent =
      formatIQD(total);


    document.getElementById(
      "summaryReceived"
    ).textContent =
      formatIQD(received);


    document.getElementById(
      "summaryRemaining"
    ).textContent =
      formatIQD(remaining);


    const isPartial =
      paymentStatus.value ===
      "partial";


    const isUnpaid =
      paymentStatus.value ===
      "unpaid";


    receivedAmountGroup.hidden =
      !isPartial;


    receivedAmount.required =
      isPartial;


    paymentMethod.disabled =
      isUnpaid;


    document.getElementById(
      "paymentMethodHint"
    ).textContent =

      isUnpaid

        ? "تحدد طريقة الدفع عند استلام الدين لاحقاً."

        : "طريقة استلام المبلغ من الزبون.";

  }


  // ======================================
  // VALIDATE SALE
  // ======================================

  function validateSale() {

    const name =
      customerName.value.trim();


    const phone =
      normalizeDigits(
        phoneNumber.value.trim()
      );


    const area =
      saleArea.value.trim();


    const selected =
      getSelectedPackage();


    const {
      total,
      received
    } =
      calculatePayment();


    if (
      name.length < 2
    ) {

      throw new Error(
        "أدخل اسم الزبون بصورة صحيحة."
      );

    }


    if (
      !/^078[0-9]{8}$/.test(phone)
    ) {

      throw new Error(
        "رقم الخط يجب أن يبدأ بـ 078 ويتكون من 11 رقماً."
      );

    }


    if (
      !saleDate.value
    ) {

      throw new Error(
        "حدد تاريخ البيع."
      );

    }


    if (
      !saleTime.value
    ) {

      throw new Error(
        "حدد وقت البيع."
      );

    }


    if (
      area.length < 2
    ) {

      throw new Error(
        "أدخل منطقة البيع."
      );

    }


    if (!selected) {

      throw new Error(
        "اختار إحدى الباقات."
      );

    }


    if (
      !Number.isFinite(received) ||
      !Number.isInteger(received) ||
      received < 0 ||
      received > total
    ) {

      throw new Error(
        "المبلغ المستلم غير صحيح."
      );

    }


    if (
      paymentStatus.value ===
      "partial" &&
      (
        received <= 0 ||
        received >= total
      )
    ) {

      throw new Error(
        "بالدفع الجزئي، المبلغ المستلم لازم يكون أكبر من صفر وأقل من سعر الباقة."
      );

    }


    return {

      name,

      phone,

      area,

      saleDate:
        saleDate.value,

      saleTime:
        saleTime.value,

      selected,

      received

    };

  }


  // ======================================
  // LOCK FORM
  // ======================================

  function setFormSavingState(
    saving
  ) {

    const elements =
      saleForm.querySelectorAll(
        "input, select, textarea, button"
      );


    elements.forEach(
      element => {

        element.disabled =
          saving;

      }
    );


    const cancelLink =
      saleForm.querySelector(
        ".sale-cancel"
      );


    if (cancelLink) {

      cancelLink.style.pointerEvents =
        saving
          ? "none"
          : "";

      cancelLink.style.opacity =
        saving
          ? "0.5"
          : "";

    }


    saveSaleBtn.disabled =
      saving;

  }


  // ======================================
  // SAVE SALE
  // ======================================

  async function saveSale(event) {

    event.preventDefault();


    // ====================================
    // PREVENT DOUBLE SUBMIT
    // ====================================

    if (isSaving) {
      return;
    }


    clearMessage();


    let validated;


    // ====================================
    // VALIDATION
    // ====================================

    try {

      validated =
        validateSale();

    } catch (error) {

      showSaveModal(
        "error",
        "تعذر إضافة العملية",
        error.message
      );


      setTimeout(
        hideSaveModal,
        2200
      );


      return;

    }


    // ====================================
    // CREATE OPERATION KEY
    // ====================================

    currentIdempotencyKey =
      createIdempotencyKey();


    // ====================================
    // START SAVING
    // ====================================

    isSaving =
      true;


    setFormSavingState(
      true
    );


    saveSaleBtn.textContent =
      "جاري الحفظ...";


    showSaveModal(
      "loading",
      "جاري إضافة العملية",
      "يرجى الانتظار حتى تكتمل العملية..."
    );


    try {

      // ==================================
      // CREATE SALE
      // ==================================

      const {
        data,
        error
      } =
        await supabaseClient.rpc(
          "create_sale",
          {

            p_customer_name:
              validated.name,

            p_phone_number:
              validated.phone,

            p_package_id:
              Number(
                validated.selected.id
              ),

            p_line_type:
              lineType.value,

            p_sale_date:
              validated.saleDate,

            p_sale_time:
              validated.saleTime,

            p_sale_area:
              validated.area,

            p_payment_method:
              paymentMethod.disabled
                ? "cash"
                : paymentMethod.value,

            p_received_amount:
              validated.received,

            p_notes:
              document
                .getElementById(
                  "saleNotes"
                )
                .value
                .trim() ||
              null,

            p_idempotency_key:
              currentIdempotencyKey

          }
        );


      // ==================================
      // DATABASE ERROR
      // ==================================

      if (error) {

        console.error(
          "Save sale error:",
          error
        );


        throw new Error(
          "تعذر إضافة العملية. تحقق من الاتصال وحاول مرة أخرى."
        );

      }


      console.log(
        "Created sale:",
        data
      );


      // ==================================
      // SUCCESS MODAL
      // ==================================

      showSaveModal(
        "success",
        "تمت إضافة العملية بنجاح",
        "تم حفظ عملية البيع بنجاح."
      );


      // ==================================
      // RESET FORM
      // ==================================

      saleForm.reset();


      setCurrentDateTime();


      if (
        packages.length
      ) {

        packageId.value =
          String(
            packages[0].id
          );

      }


      paymentStatus.value =
        "paid";


      paymentMethod.value =
        "cash";


      receivedAmount.value =
        "";


      updatePaymentSummary();


      customerName.focus();


      // ==================================
      // CLOSE SUCCESS MODAL
      // ==================================

      setTimeout(
        hideSaveModal,
        1800
      );


    } catch (error) {

      console.error(
        "Create sale error:",
        error
      );


      // ==================================
      // ERROR MODAL
      // ==================================

      showSaveModal(
        "error",
        "تعذر إضافة العملية",
        error.message ||
        "حدث خطأ أثناء حفظ العملية."
      );


      setTimeout(
        hideSaveModal,
        2500
      );


    } finally {

      isSaving =
        false;


      setFormSavingState(
        false
      );


      saveSaleBtn.disabled =
        false;


      saveSaleBtn.textContent =
        "حفظ عملية البيع";


      currentIdempotencyKey =
        null;

    }

  }


  // ======================================
  // MOBILE SIDEBAR
  // ======================================

  function initializeSaleSidebar() {

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

        const open =
          sidebar.classList.toggle(
            "open"
          );


        overlay.classList.toggle(
          "show",
          open
        );


        menuBtn.setAttribute(
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


  // ======================================
  // INITIALIZE PAGE
  // ======================================

  async function initializeAddSale() {

    const user =
      await requireAuth();


    if (!user) {
      return;
    }


    document.getElementById(
      "content"
    ).hidden = false;


    initializeSaleSidebar();


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


    // ==================================
    // LOAD REPRESENTATIVE NAME
    // ==================================

    const {
      data: profile
    } =
      await supabaseClient

        .from("profiles")

        .select(
          "full_name"
        )

        .eq(
          "id",
          user.id
        )

        .maybeSingle();


    const sidebarUserName =
      document.getElementById(
        "sidebarUserName"
      );


    if (sidebarUserName) {

      sidebarUserName.textContent =

        profile?.full_name?.trim()

        ||

        user.email?.split("@")[0]

        ||

        "مندوب المبيعات";

    }


    // ==================================
    // CURRENT DATE + TIME
    // ==================================

    setCurrentDateTime();


    // ==================================
    // PHONE INPUT
    // ==================================

    phoneNumber.addEventListener(
      "input",
      () => {

        phoneNumber.value =
          normalizeDigits(
            phoneNumber.value
          )
            .replace(
              /[^0-9]/g,
              ""
            )
            .slice(
              0,
              11
            );

      }
    );


    // ==================================
    // AREA INPUT
    // ==================================

    saleArea.addEventListener(
      "input",
      () => {

        saleArea.value =
          saleArea.value.slice(
            0,
            150
          );

      }
    );


    // ==================================
    // PACKAGE CHANGE
    // ==================================

    packageId.addEventListener(
      "change",
      updatePaymentSummary
    );


    // ==================================
    // PAYMENT STATUS
    // ==================================

    paymentStatus.addEventListener(
      "change",
      () => {

        receivedAmount.value =
          "";

        updatePaymentSummary();

      }
    );


    // ==================================
    // RECEIVED AMOUNT
    // ==================================

    receivedAmount.addEventListener(
      "input",
      updatePaymentSummary
    );


    // ==================================
    // FORM SUBMIT
    // ==================================

    saleForm.addEventListener(
      "submit",
      saveSale
    );


    // ==================================
    // CREATE MODAL
    // ==================================

    createSaveModal();


    // ==================================
    // LOAD PACKAGES
    // ==================================

    try {

      await loadPackages();


      saveSaleBtn.disabled =
        false;


    } catch (error) {

      console.error(
        error
      );


      showSaveModal(
        "error",
        "تعذر تحميل الصفحة",
        error.message
      );


      setTimeout(
        hideSaveModal,
        2500
      );

    }

  }


  // ======================================
  // START
  // ======================================

  initializeAddSale()
    .catch(
      error => {

        console.error(
          "Initialization error:",
          error
        );


        showSaveModal(
          "error",
          "حدث خطأ",
          "تعذر تهيئة صفحة إضافة المبيعات."
        );


        setTimeout(
          hideSaveModal,
          2500
        );

      }
    );

});