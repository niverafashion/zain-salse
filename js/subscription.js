// =====================================================
// Zain Sales - Subscription
// إدارة الاشتراك + الدفع + طلب التفعيل
// =====================================================


// =====================================================
// إعدادات الدفع
// =====================================================

const PAYMENT_NUMBER = "07714064135";
const MASTERCARD_NUMBER = "3919886154";


// =====================================================
// إعدادات فحص حالة الطلب
// =====================================================

const STATUS_POLL_MS = 5000;


// =====================================================
// متغيرات عامة
// =====================================================

let currentUser = null;

let plans = [];

let selectedPlan = null;

let selectedPaymentMethod = null;

let currentStep = 1;

let statusCheckTimer = null;

let isStatusChecking = false;

let currentRequestId = null;

let isWaitingForDecision = false;

let isSubmitting = false;


// =====================================================
// عند تحميل الصفحة
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

  try {

    // ---------------------------------------------------
    // التحقق من تسجيل الدخول
    // ---------------------------------------------------

    currentUser = await requireAuth();

    if (!currentUser) {
      return;
    }


    // ---------------------------------------------------
    // إعداد الأحداث
    // ---------------------------------------------------

    setupPlanSelection();

    setupNavigation();

    setupPaymentMethods();

    setupCopyButton();

    setupInputs();

    setupSubmitButton();

    setupNewRequestButton();

    setupLogout();


    // ---------------------------------------------------
    // إخفاء الخطوات مؤقتاً
    // إلى أن نعرف حالة الطلب
    // ---------------------------------------------------

    hideAllSubscriptionSteps();

    hideRequestStatus();


    // ---------------------------------------------------
    // تحميل الخطط
    // ---------------------------------------------------

    await loadSubscriptionPlans();


    // ---------------------------------------------------
    // فحص حالة الاشتراك / آخر طلب
    // ---------------------------------------------------

    await checkSubscriptionAndRequestStatus();


  } catch (error) {

    console.error(
      "Subscription page initialization error:",
      error
    );

    showMessage(
      "حدث خطأ أثناء تحميل صفحة الاشتراك. حاول تحديث الصفحة.",
      "error"
    );

    showStep(1);

  }

});


// =====================================================
// تحميل خطط الاشتراك
// =====================================================

async function loadSubscriptionPlans() {

  const {
    data,
    error
  } = await supabaseClient
    .from("subscription_plans")
    .select(`
      id,
      code,
      name,
      price,
      duration_days
    `)
    .eq("is_active", true)
    .order("price", {
      ascending: true
    });


  if (error) {

    console.error(
      "Load subscription plans error:",
      error
    );

    showMessage(
      "تعذر تحميل خطط الاشتراك حالياً. حاول مرة أخرى.",
      "error"
    );

    return;

  }


  plans = Array.isArray(data)
    ? data
    : [];


  updatePlanCards();

}


// =====================================================
// تحديث كروت الخطط
// =====================================================

function updatePlanCards() {

  const planCards =
    document.querySelectorAll(".plan-card");


  planCards.forEach(card => {

    const code =
      card.dataset.plan;


    const plan =
      plans.find(item =>
        item.code === code
      );


    if (!plan) {
      return;
    }


    // ---------------------------------------------------
    // السعر
    // ---------------------------------------------------

    card.dataset.price =
      String(plan.price);


    const priceElement =
      card.querySelector(".plan-price");


    if (priceElement) {

      priceElement.textContent =
        formatIQD(plan.price);

    }


    // ---------------------------------------------------
    // المدة
    // ---------------------------------------------------

    const durationElement =
      card.querySelector(".plan-duration");


    if (durationElement) {

      durationElement.textContent =
        getDurationText(plan.duration_days);

    }


    // ---------------------------------------------------
    // اسم الخطة
    // ---------------------------------------------------

    const titleElement =
      card.querySelector("h3");


    if (titleElement && plan.name) {

      titleElement.textContent =
        plan.name;

    }

  });

}


// =====================================================
// اختيار الخطة
// =====================================================

function setupPlanSelection() {

  const planCards =
    document.querySelectorAll(".plan-card");

  const nextButton =
    document.getElementById("nextToPaymentBtn");


  planCards.forEach(card => {

    card.addEventListener("click", () => {

      const code =
        card.dataset.plan;


      const plan =
        plans.find(item =>
          item.code === code
        );


      if (!plan) {

        showMessage(
          "هذه الخطة غير متاحة حالياً.",
          "error"
        );

        return;

      }


      // -------------------------------------------------
      // إزالة الاختيار السابق
      // -------------------------------------------------

      planCards.forEach(item => {

        item.classList.remove("selected");

      });


      // -------------------------------------------------
      // تحديد الخطة
      // -------------------------------------------------

      card.classList.add("selected");


      selectedPlan = plan;


      // -------------------------------------------------
      // إظهار زر الاشتراك
      // -------------------------------------------------

      if (nextButton) {

        nextButton.style.display =
          "block";

        nextButton.disabled =
          false;

        nextButton.textContent =
          "اشتراك";

      }


      hideMessage();

    });

  });

}


// =====================================================
// التنقل بين الخطوات
// =====================================================

function setupNavigation() {

  const nextButton =
    document.getElementById("nextToPaymentBtn");

  const paymentDoneButton =
    document.getElementById("paymentDoneBtn");

  const backToPlanButton =
    document.getElementById("backToPlanBtn");

  const backToPaymentButton =
    document.getElementById("backToPaymentBtn");


  // ---------------------------------------------------
  // Step 1 → Step 2
  // ---------------------------------------------------

  if (nextButton) {

    nextButton.addEventListener(
      "click",
      () => {

        if (!selectedPlan) {

          showMessage(
            "اختر خطة الاشتراك أولاً.",
            "warning"
          );

          return;

        }


        preparePaymentStep();

        goToStep(2);

      }
    );

  }


  // ---------------------------------------------------
  // Step 2 → Step 3
  // ---------------------------------------------------

  if (paymentDoneButton) {

    paymentDoneButton.addEventListener(
      "click",
      () => {

        if (!selectedPlan) {

          showMessage(
            "لم يتم تحديد خطة الاشتراك.",
            "error"
          );

          return;

        }


        if (!selectedPaymentMethod) {

          showMessage(
            "اختر طريقة الدفع أولاً.",
            "warning"
          );

          return;

        }


        prepareActivationStep();

        goToStep(3);

      }
    );

  }


  // ---------------------------------------------------
  // Step 2 → Step 1
  // ---------------------------------------------------

  if (backToPlanButton) {

    backToPlanButton.addEventListener(
      "click",
      () => {

        goToStep(1);

      }
    );

  }


  // ---------------------------------------------------
  // Step 3 → Step 2
  // ---------------------------------------------------

  if (backToPaymentButton) {

    backToPaymentButton.addEventListener(
      "click",
      () => {

        goToStep(2);

      }
    );

  }

}


// =====================================================
// الانتقال إلى خطوة
// =====================================================

function goToStep(step) {

  currentStep = step;


  hideRequestStatus();


  const step1 =
    document.getElementById(
      "subscriptionStep1"
    );

  const step2 =
    document.getElementById(
      "subscriptionStep2"
    );

  const step3 =
    document.getElementById(
      "subscriptionStep3"
    );


  if (step1) {

    step1.style.display =
      step === 1
        ? "block"
        : "none";

  }


  if (step2) {

    step2.style.display =
      step === 2
        ? "block"
        : "none";

  }


  if (step3) {

    step3.style.display =
      step === 3
        ? "block"
        : "none";

  }


  updateStepIndicator();

  hideMessage();

}


// =====================================================
// إظهار خطوة
// =====================================================

function showStep(step) {

  goToStep(step);

}


// =====================================================
// تحديث مؤشر الخطوات
// =====================================================

function updateStepIndicator() {

  const step1 =
    document.getElementById("step1");

  const step2 =
    document.getElementById("step2");

  const step3 =
    document.getElementById("step3");


  const line1 =
    document.getElementById("stepLine1");

  const line2 =
    document.getElementById("stepLine2");


  const steps = [
    {
      element: step1,
      number: 1
    },
    {
      element: step2,
      number: 2
    },
    {
      element: step3,
      number: 3
    }
  ];


  steps.forEach(item => {

    if (!item.element) {
      return;
    }


    item.element.classList.remove(
      "active",
      "completed"
    );


    if (currentStep === item.number) {

      item.element.classList.add(
        "active"
      );

    }


    if (currentStep > item.number) {

      item.element.classList.add(
        "completed"
      );

    }

  });


  if (line1) {

    line1.classList.toggle(
      "completed",
      currentStep > 1
    );

  }


  if (line2) {

    line2.classList.toggle(
      "completed",
      currentStep > 2
    );

  }

}


// =====================================================
// تجهيز خطوة الدفع
// =====================================================

function preparePaymentStep() {

  if (!selectedPlan) {
    return;
  }


  const planName =
    document.getElementById(
      "paymentPlanName"
    );

  const planDuration =
    document.getElementById(
      "paymentPlanDuration"
    );

  const planPrice =
    document.getElementById(
      "paymentPlanPrice"
    );


  if (planName) {

    planName.textContent =
      getPlanDisplayName(
        selectedPlan
      );

  }


  if (planDuration) {

    planDuration.textContent =
      getDurationText(
        selectedPlan.duration_days
      );

  }


  if (planPrice) {

    planPrice.textContent =
      formatIQD(
        selectedPlan.price
      );

  }


  // ---------------------------------------------------
  // إعادة ضبط طريقة الدفع
  // ---------------------------------------------------

  resetPaymentSelection();

}


// =====================================================
// إعداد طرق الدفع
// =====================================================

function setupPaymentMethods() {

  const methods =
    document.querySelectorAll(
      ".payment-method"
    );


  methods.forEach(method => {

    method.addEventListener(
      "click",
      () => {

        const paymentMethod =
          method.dataset.method;


        if (!paymentMethod) {
          return;
        }


        selectPaymentMethod(
          paymentMethod
        );

      }
    );

  });

}


// =====================================================
// تحديد طريقة الدفع
// =====================================================

function selectPaymentMethod(
  paymentMethod
) {

  const methods =
    document.querySelectorAll(
      ".payment-method"
    );


  methods.forEach(method => {

    method.classList.toggle(
      "selected",
      method.dataset.method ===
      paymentMethod
    );

  });


  selectedPaymentMethod =
    paymentMethod;


  updatePaymentDetails();

}


// =====================================================
// إعادة ضبط الدفع
// =====================================================

function resetPaymentSelection() {

  selectedPaymentMethod =
    null;


  const methods =
    document.querySelectorAll(
      ".payment-method"
    );


  methods.forEach(method => {

    method.classList.remove(
      "selected"
    );

  });


  const banner =
    document.getElementById(
      "selectedPaymentBanner"
    );


  if (banner) {

    banner.classList.remove(
      "show"
    );

  }


  const bannerText =
    document.getElementById(
      "selectedPaymentBannerText"
    );


  if (bannerText) {

    bannerText.textContent =
      "-";

  }


  const paymentDetails =
    document.getElementById(
      "paymentDetails"
    );


  if (paymentDetails) {

    paymentDetails.classList.remove(
      "show"
    );

  }


  const paymentAccountNumber =
    document.getElementById(
      "paymentAccountNumber"
    );


  if (paymentAccountNumber) {

    paymentAccountNumber.textContent =
      "-";

  }


  const paymentInstruction =
    document.getElementById(
      "paymentInstruction"
    );


  if (paymentInstruction) {

    paymentInstruction.textContent =
      "-";

  }


  const paymentDoneButton =
    document.getElementById(
      "paymentDoneBtn"
    );


  if (paymentDoneButton) {

    paymentDoneButton.disabled =
      true;

    paymentDoneButton.textContent =
      "اختر طريقة الدفع أولاً";

  }

}


// =====================================================
// تحديث تفاصيل الدفع
// =====================================================

function updatePaymentDetails() {

  if (!selectedPaymentMethod) {
    return;
  }


  const banner =
    document.getElementById(
      "selectedPaymentBanner"
    );

  const bannerText =
    document.getElementById(
      "selectedPaymentBannerText"
    );

  const paymentDetails =
    document.getElementById(
      "paymentDetails"
    );

  const paymentDetailsTitle =
    document.getElementById(
      "paymentDetailsTitle"
    );

  const accountNumber =
    document.getElementById(
      "paymentAccountNumber"
    );

  const instruction =
    document.getElementById(
      "paymentInstruction"
    );

  const paymentDoneButton =
    document.getElementById(
      "paymentDoneBtn"
    );


  let methodName =
    "";

  let number =
    "";

  let title =
    "";

  let instructionText =
    "";


  // ---------------------------------------------------
  // ZainCash
  // ---------------------------------------------------

  if (
    selectedPaymentMethod ===
    "zain_cash"
  ) {

    methodName =
      "ZainCash";

    number =
      PAYMENT_NUMBER;

    title =
      "الدفع عبر ZainCash";

    instructionText =
      "قم بتحويل مبلغ الاشتراك إلى الرقم أعلاه، وبعد إتمام التحويل اضغط على زر «تفعيل» للانتقال إلى إدخال رقم العملية.";

  }


  // ---------------------------------------------------
  // MasterCard
  // ---------------------------------------------------

  if (
    selectedPaymentMethod ===
    "mastercard"
  ) {

    methodName =
      "MasterCard";

    number =
      MASTERCARD_NUMBER;

    title =
      "الدفع عبر MasterCard";

    instructionText =
      "قم بإتمام عملية الدفع باستخدام MasterCard، ثم احتفظ برقم العملية أو رقم التحويل لاستخدامه في الخطوة التالية.";

  }


  // ---------------------------------------------------
  // تحديث الواجهة
  // ---------------------------------------------------

  if (banner) {

    banner.classList.add(
      "show"
    );

  }


  if (bannerText) {

    bannerText.textContent =
      methodName;

  }


  if (paymentDetails) {

    paymentDetails.classList.add(
      "show"
    );

  }


  if (paymentDetailsTitle) {

    paymentDetailsTitle.textContent =
      title;

  }


  if (accountNumber) {

    accountNumber.textContent =
      number;

  }


  if (instruction) {

    instruction.textContent =
      instructionText;

  }


  if (paymentDoneButton) {

    paymentDoneButton.disabled =
      false;

    paymentDoneButton.textContent =
      "تفعيل";

  }


  hideMessage();

}


// =====================================================
// زر نسخ رقم الدفع
// =====================================================

function setupCopyButton() {

  const copyButton =
    document.getElementById(
      "copyPaymentNumberBtn"
    );


  if (!copyButton) {
    return;
  }


  copyButton.addEventListener(
    "click",
    async () => {

      if (
        !selectedPaymentMethod
      ) {

        return;

      }


      let number =
        "";


      if (
        selectedPaymentMethod ===
        "zain_cash"
      ) {

        number =
          PAYMENT_NUMBER;

      }


      if (
        selectedPaymentMethod ===
        "mastercard"
      ) {

        number =
          MASTERCARD_NUMBER;

      }


      if (!number) {
        return;
      }


      try {

        await navigator.clipboard.writeText(
          number
        );


        const originalHTML =
          copyButton.innerHTML;


        copyButton.innerHTML = `
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M5 12.5l4 4L19 6.5"></path>
          </svg>
        `;


        copyButton.setAttribute(
          "aria-label",
          "تم نسخ الرقم"
        );


        setTimeout(() => {

          copyButton.innerHTML =
            originalHTML;

          copyButton.setAttribute(
            "aria-label",
            "نسخ رقم الدفع"
          );

        }, 1500);


      } catch (error) {

        console.error(
          "Copy payment number error:",
          error
        );


        // ------------------------------------------------
        // fallback
        // ------------------------------------------------

        try {

          const tempInput =
            document.createElement(
              "input"
            );

          tempInput.value =
            number;

          document.body.appendChild(
            tempInput
          );

          tempInput.select();

          document.execCommand(
            "copy"
          );

          tempInput.remove();


          showMessage(
            "تم نسخ رقم الدفع.",
            "success"
          );


        } catch (fallbackError) {

          console.error(
            "Copy fallback error:",
            fallbackError
          );

          showMessage(
            "تعذر نسخ الرقم تلقائياً. يمكنك نسخه يدوياً.",
            "warning"
          );

        }

      }

    }
  );

}


// =====================================================
// تجهيز خطوة التفعيل
// =====================================================

function prepareActivationStep() {

  if (!selectedPlan) {
    return;
  }


  const activationPlan =
    document.getElementById(
      "activationPlan"
    );

  const activationDuration =
    document.getElementById(
      "activationDuration"
    );

  const activationPaymentMethod =
    document.getElementById(
      "activationPaymentMethod"
    );

  const activationPrice =
    document.getElementById(
      "activationPrice"
    );


  if (activationPlan) {

    activationPlan.textContent =
      getPlanDisplayName(
        selectedPlan
      );

  }


  if (activationDuration) {

    activationDuration.textContent =
      getDurationText(
        selectedPlan.duration_days
      );

  }


  if (activationPaymentMethod) {

    activationPaymentMethod.textContent =
      getPaymentMethodName(
        selectedPaymentMethod
      );

  }


  if (activationPrice) {

    activationPrice.textContent =
      formatIQD(
        selectedPlan.price
      );

  }


  const referenceInput =
    document.getElementById(
      "paymentReference"
    );


  if (referenceInput) {

    referenceInput.value =
      "";

  }


  const notesInput =
    document.getElementById(
      "customerNotes"
    );


  if (notesInput) {

    notesInput.value =
      "";

  }


  hideMessage();

}


// =====================================================
// إعداد الحقول
// =====================================================

function setupInputs() {

  const referenceInput =
    document.getElementById(
      "paymentReference"
    );

  const notesInput =
    document.getElementById(
      "customerNotes"
    );


  // ---------------------------------------------------
  // رقم العملية
  // ---------------------------------------------------

  if (referenceInput) {

    referenceInput.addEventListener(
      "input",
      () => {

        referenceInput.value =
          referenceInput.value
            .replace(
              /[\r\n]/g,
              ""
            )
            .slice(
              0,
              50
            );

      }
    );

  }


  // ---------------------------------------------------
  // الملاحظات
  // ---------------------------------------------------

  if (notesInput) {

    notesInput.addEventListener(
      "input",
      () => {

        if (
          notesInput.value.length >
          300
        ) {

          notesInput.value =
            notesInput.value.slice(
              0,
              300
            );

        }

      }
    );

  }

}


// =====================================================
// إعداد زر إرسال الطلب
// =====================================================

function setupSubmitButton() {

  const submitButton =
    document.getElementById(
      "submitSubscriptionBtn"
    );


  if (!submitButton) {
    return;
  }


  submitButton.addEventListener(
    "click",
    async () => {

      await submitSubscriptionRequest();

    }
  );

}


// =====================================================
// إرسال طلب الاشتراك
// =====================================================

async function submitSubscriptionRequest() {

  if (isSubmitting) {
    return;
  }


  // ---------------------------------------------------
  // التحقق من المستخدم
  // ---------------------------------------------------

  if (!currentUser) {

    showMessage(
      "انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.",
      "error"
    );

    return;

  }


  // ---------------------------------------------------
  // التحقق من الخطة
  // ---------------------------------------------------

  if (!selectedPlan) {

    showMessage(
      "اختر خطة الاشتراك أولاً.",
      "warning"
    );

    return;

  }


  // ---------------------------------------------------
  // التحقق من طريقة الدفع
  // ---------------------------------------------------

  if (!selectedPaymentMethod) {

    showMessage(
      "اختر طريقة الدفع أولاً.",
      "warning"
    );

    goToStep(2);

    return;

  }


  // ---------------------------------------------------
  // رقم العملية
  // ---------------------------------------------------

  const referenceInput =
    document.getElementById(
      "paymentReference"
    );


  const notesInput =
    document.getElementById(
      "customerNotes"
    );


  const paymentReference =
    referenceInput
      ? referenceInput.value.trim()
      : "";


  const customerNotes =
    notesInput
      ? notesInput.value.trim()
      : "";


  if (!paymentReference) {

    showMessage(
      "أدخل رقم العملية أو رقم التحويل أولاً.",
      "warning"
    );

    if (referenceInput) {

      referenceInput.focus();

    }

    return;

  }


  if (paymentReference.length < 3) {

    showMessage(
      "رقم العملية المدخل قصير جداً. تأكد من كتابة الرقم بشكل صحيح.",
      "warning"
    );

    if (referenceInput) {

      referenceInput.focus();

    }

    return;

  }


  if (paymentReference.length > 50) {

    showMessage(
      "رقم العملية طويل جداً.",
      "warning"
    );

    return;

  }


  // ---------------------------------------------------
  // منع الضغط المتكرر
  // ---------------------------------------------------

  isSubmitting =
    true;


  const originalButtonText =
    document.getElementById(
      "submitSubscriptionBtn"
    )?.textContent ||
    "إرسال طلب التفعيل";


  const submitButton =
    document.getElementById(
      "submitSubscriptionBtn"
    );


  if (submitButton) {

    submitButton.disabled =
      true;

    submitButton.textContent =
      "جاري إرسال الطلب...";

  }


  hideMessage();


  try {

    // -------------------------------------------------
    // التحقق من أن الخطة ما زالت فعالة
    // -------------------------------------------------

    const {
      data: freshPlan,
      error: freshPlanError
    } = await supabaseClient
      .from("subscription_plans")
      .select(`
        id,
        code,
        name,
        price,
        duration_days
      `)
      .eq(
        "id",
        selectedPlan.id
      )
      .eq(
        "is_active",
        true
      )
      .maybeSingle();


    if (freshPlanError) {

      console.error(
        "Fresh plan check error:",
        freshPlanError
      );

      throw new Error(
        "تعذر التحقق من خطة الاشتراك."
      );

    }


    if (!freshPlan) {

      throw new Error(
        "الخطة التي اخترتها لم تعد متاحة حالياً."
      );

    }


    // -------------------------------------------------
    // تحديث الخطة المحلية
    // -------------------------------------------------

    selectedPlan =
      freshPlan;


    // -------------------------------------------------
    // التحقق من وجود اشتراك فعال
    // -------------------------------------------------

    const activeSubscription =
      await hasActiveSubscription();


    if (activeSubscription) {

      window.location.replace(
        "dashboard.html"
      );

      return;

    }


    // -------------------------------------------------
    // فحص آخر طلب للمستخدم
    // -------------------------------------------------

    const latestRequest =
      await getLatestSubscriptionRequest();


    if (
      latestRequest &&
      latestRequest.status ===
      "pending"
    ) {

      currentRequestId =
        latestRequest.id;


      showPendingRequestStatus(
        latestRequest
      );


      startStatusPolling();


      return;

    }


    if (
      latestRequest &&
      latestRequest.status ===
      "approved"
    ) {

      window.location.replace(
        "dashboard.html"
      );

      return;

    }


    // -------------------------------------------------
    // إنشاء طلب جديد
    // -------------------------------------------------

    const {
      data,
      error
    } = await supabaseClient
      .from(
        "subscription_payment_requests"
      )
      .insert({
        user_id:
          currentUser.id,

        plan_id:
          selectedPlan.id,

        amount:
          selectedPlan.price,

        payment_method:
          selectedPaymentMethod,

        payment_reference:
          paymentReference,

        customer_notes:
          customerNotes || null,

        status:
          "pending"
      })
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
      .single();


    if (error) {

      console.error(
        "Create subscription request error:",
        error
      );


      // -----------------------------------------------
      // إذا كان السبب تعارض/طلب موجود
      // -----------------------------------------------

      if (
        error.code ===
        "23505"
      ) {

        const existingRequest =
          await getLatestSubscriptionRequest();


        if (
          existingRequest &&
          existingRequest.status ===
          "pending"
        ) {

          currentRequestId =
            existingRequest.id;


          showPendingRequestStatus(
            existingRequest
          );


          startStatusPolling();


          return;

        }

      }


      throw new Error(
        "تعذر إرسال طلب التفعيل. حاول مرة أخرى."
      );

    }


    // -------------------------------------------------
    // حفظ ID الطلب
    // -------------------------------------------------

    currentRequestId =
      data?.id || null;


    // -------------------------------------------------
    // إظهار حالة نجاح + انتظار
    // -------------------------------------------------

    showSubmittedRequestStatus(
      data
    );


    // -------------------------------------------------
    // بدء الفحص التلقائي
    // -------------------------------------------------

    startStatusPolling();


  } catch (error) {

    console.error(
      "Submit subscription request error:",
      error
    );


    showMessage(
      error.message ||
      "حدث خطأ أثناء إرسال الطلب.",
      "error"
    );


    if (submitButton) {

      submitButton.disabled =
        false;

      submitButton.textContent =
        originalButtonText;

    }


  } finally {

    isSubmitting =
      false;

  }

}


// =====================================================
// فحص الاشتراك وآخر طلب
// =====================================================

async function checkSubscriptionAndRequestStatus() {

  // ---------------------------------------------------
  // أولاً: هل عنده اشتراك فعال؟
  // ---------------------------------------------------

  const activeSubscription =
    await hasActiveSubscription();


  if (activeSubscription) {

    stopStatusPolling();

    window.location.replace(
      "dashboard.html"
    );

    return;

  }


  // ---------------------------------------------------
  // جلب آخر طلب
  // ---------------------------------------------------

  const request =
    await getLatestSubscriptionRequest();


  if (!request) {

    // -----------------------------------------------
    // لا يوجد طلب سابق
    // -----------------------------------------------

    isWaitingForDecision =
      false;

    showStep(1);

    return;

  }


  currentRequestId =
    request.id;


  // ---------------------------------------------------
  // Pending
  // ---------------------------------------------------

  if (
    request.status ===
    "pending"
  ) {

    showPendingRequestStatus(
      request
    );

    startStatusPolling();

    return;

  }


  // ---------------------------------------------------
  // Approved
  // ---------------------------------------------------

  if (
    request.status ===
    "approved"
  ) {

    stopStatusPolling();

    window.location.replace(
      "dashboard.html"
    );

    return;

  }


  // ---------------------------------------------------
  // Rejected
  // ---------------------------------------------------

  if (
    request.status ===
    "rejected"
  ) {

    stopStatusPolling();

    showRejectedRequestStatus(
      request
    );

    return;

  }


  // ---------------------------------------------------
  // أي حالة غير معروفة
  // ---------------------------------------------------

  showStep(1);

}


// =====================================================
// جلب آخر طلب اشتراك للمستخدم
// =====================================================

async function getLatestSubscriptionRequest() {

  if (!currentUser) {
    return null;
  }


  const {
    data,
    error
  } = await supabaseClient
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
    .eq(
      "user_id",
      currentUser.id
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    )
    .limit(1)
    .maybeSingle();


  if (error) {

    console.error(
      "Get latest subscription request error:",
      error
    );


    // -------------------------------------------------
    // لا نعتبر عدم وجود طلب خطأ
    // -------------------------------------------------

    if (
      error.code ===
      "PGRST116"
    ) {

      return null;

    }


    showMessage(
      "تعذر التحقق من حالة طلب الاشتراك حالياً.",
      "error"
    );


    return null;

  }


  return data || null;

}


// =====================================================
// بدء فحص حالة الطلب
// =====================================================

function startStatusPolling() {

  stopStatusPolling();


  isWaitingForDecision =
    true;


  statusCheckTimer =
    setInterval(
      async () => {

        await refreshRequestStatus();

      },
      STATUS_POLL_MS
    );

}


// =====================================================
// إيقاف فحص الحالة
// =====================================================

function stopStatusPolling() {

  if (statusCheckTimer) {

    clearInterval(
      statusCheckTimer
    );

    statusCheckTimer =
      null;

  }


  isWaitingForDecision =
    false;

}


// =====================================================
// تحديث حالة الطلب
// =====================================================

async function refreshRequestStatus() {

  if (
    !currentUser ||
    !isWaitingForDecision ||
    isStatusChecking
  ) {

    return;

  }


  isStatusChecking =
    true;


  try {

    // -------------------------------------------------
    // أولاً نتحقق من الاشتراك الفعال
    // -------------------------------------------------

    const activeSubscription =
      await hasActiveSubscription();


    if (activeSubscription) {

      stopStatusPolling();

      window.location.replace(
        "dashboard.html"
      );

      return;

    }


    // -------------------------------------------------
    // جلب آخر طلب
    // -------------------------------------------------

    const request =
      await getLatestSubscriptionRequest();


    if (!request) {

      stopStatusPolling();

      showStep(1);

      return;

    }


    currentRequestId =
      request.id;


    // -------------------------------------------------
    // Pending
    // -------------------------------------------------

    if (
      request.status ===
      "pending"
    ) {

      // -----------------------------------------------
      // تحديث الحالة بدون إزعاج المستخدم
      // -----------------------------------------------

      showPendingRequestStatus(
        request,
        true
      );

      return;

    }


    // -------------------------------------------------
    // Approved
    // -------------------------------------------------

    if (
      request.status ===
      "approved"
    ) {

      stopStatusPolling();


      // -----------------------------------------------
      // نحاول الدخول مباشرة
      // -----------------------------------------------

      window.location.replace(
        "dashboard.html"
      );

      return;

    }


    // -------------------------------------------------
    // Rejected
    // -------------------------------------------------

    if (
      request.status ===
      "rejected"
    ) {

      stopStatusPolling();

      showRejectedRequestStatus(
        request
      );

      return;

    }


  } catch (error) {

    console.error(
      "Refresh subscription status error:",
      error
    );


    // -------------------------------------------------
    // لا نغير واجهة المستخدم عند خطأ مؤقت
    // -------------------------------------------------
    // سيعيد الفحص بعد 5 ثواني


  } finally {

    isStatusChecking =
      false;

  }

}


// =====================================================
// عرض حالة الطلب - Pending
// =====================================================

function showPendingRequestStatus(
  request,
  silent = false
) {

  hideAllSubscriptionSteps();


  const status =
    document.getElementById(
      "requestStatus"
    );


  if (!status) {
    return;
  }


  status.classList.remove(
    "rejected",
    "success"
  );

  status.classList.add(
    "pending",
    "show"
  );


  const title =
    document.getElementById(
      "requestStatusTitle"
    );

  const description =
    document.getElementById(
      "requestStatusDescription"
    );

  const highlightText =
    document.getElementById(
      "requestStatusHighlightText"
    );

  const rejectionReason =
    document.getElementById(
      "rejectionReason"
    );

  const requestMeta =
    document.getElementById(
      "requestMeta"
    );

  const statusAction =
    document.getElementById(
      "requestStatusAction"
    );


  if (title) {

    title.textContent =
      "تم استلام طلبك";

  }


  if (description) {

    description.textContent =
      "تم استلام طلب تفعيل الاشتراك بنجاح، وسيتم مراجعة طلبك من قبل الإدارة في أقرب وقت. نرجو منك التحلي بالصبر، وسيتم تفعيل حسابك مباشرة بعد الموافقة.";

  }


  if (highlightText) {

    highlightText.textContent =
      "طلبك قيد المراجعة";

  }


  if (rejectionReason) {

    rejectionReason.classList.remove(
      "show"
    );

  }


  if (requestMeta) {

    requestMeta.classList.add(
      "show"
    );


    const createdText =
      formatDateTime(
        request?.created_at
      );


    requestMeta.textContent =
      createdText
        ? `تم إرسال الطلب بتاريخ ${createdText}. يتم تحديث حالة الطلب تلقائياً.`
        : "يتم تحديث حالة الطلب تلقائياً.";

  }


  if (statusAction) {

    statusAction.style.display =
      "none";

  }


  updateRequestStatusIcon(
    "pending"
  );


  if (!silent) {

    hideMessage();

  }


  isWaitingForDecision =
    true;

}


// =====================================================
// عرض حالة الطلب - بعد الإرسال
// =====================================================

function showSubmittedRequestStatus(
  request
) {

  hideAllSubscriptionSteps();


  const status =
    document.getElementById(
      "requestStatus"
    );


  if (!status) {
    return;
  }


  status.classList.remove(
    "pending",
    "rejected"
  );

  status.classList.add(
    "success",
    "show"
  );


  const title =
    document.getElementById(
      "requestStatusTitle"
    );

  const description =
    document.getElementById(
      "requestStatusDescription"
    );

  const highlightText =
    document.getElementById(
      "requestStatusHighlightText"
    );

  const rejectionReason =
    document.getElementById(
      "rejectionReason"
    );

  const requestMeta =
    document.getElementById(
      "requestMeta"
    );

  const statusAction =
    document.getElementById(
      "requestStatusAction"
    );


  if (title) {

    title.textContent =
      "تم إرسال طلب التفعيل بنجاح";

  }


  if (description) {

    description.textContent =
      "تم استلام طلب التفعيل ورقم العملية بنجاح. طلبك الآن قيد المراجعة من قبل الإدارة، وسيتم تفعيل اشتراكك مباشرة بعد الموافقة.";

  }


  if (highlightText) {

    highlightText.textContent =
      "طلبك الآن قيد المراجعة";

  }


  if (rejectionReason) {

    rejectionReason.classList.remove(
      "show"
    );

  }


  if (requestMeta) {

    requestMeta.classList.add(
      "show"
    );


    const createdText =
      formatDateTime(
        request?.created_at
      );


    requestMeta.textContent =
      createdText
        ? `تم إرسال الطلب بتاريخ ${createdText}. سيتم تحديث الحالة تلقائياً.`
        : "سيتم تحديث حالة الطلب تلقائياً.";

  }


  if (statusAction) {

    statusAction.style.display =
      "none";

  }


  updateRequestStatusIcon(
    "success"
  );


  hideMessage();


  isWaitingForDecision =
    true;

}


// =====================================================
// عرض حالة الرفض
// =====================================================

function showRejectedRequestStatus(
  request
) {

  hideAllSubscriptionSteps();


  const status =
    document.getElementById(
      "requestStatus"
    );


  if (!status) {
    return;
  }


  status.classList.remove(
    "pending",
    "success"
  );

  status.classList.add(
    "rejected",
    "show"
  );


  const title =
    document.getElementById(
      "requestStatusTitle"
    );

  const description =
    document.getElementById(
      "requestStatusDescription"
    );

  const highlightText =
    document.getElementById(
      "requestStatusHighlightText"
    );

  const rejectionReason =
    document.getElementById(
      "rejectionReason"
    );

  const rejectionReasonText =
    document.getElementById(
      "rejectionReasonText"
    );

  const requestMeta =
    document.getElementById(
      "requestMeta"
    );

  const statusAction =
    document.getElementById(
      "requestStatusAction"
    );


  if (title) {

    title.textContent =
      "عذراً، تم رفض طلب التفعيل";

  }


  if (description) {

    description.textContent =
      "لم تتم الموافقة على طلب تفعيل الاشتراك الحالي. يمكنك الاطلاع على سبب الرفض وإرسال طلب جديد بعد تصحيح البيانات أو إتمام عملية الدفع بالشكل المطلوب.";

  }


  if (highlightText) {

    highlightText.textContent =
      "الطلب مرفوض";

  }


  // ---------------------------------------------------
  // سبب الرفض
  // ---------------------------------------------------

  const reason =
    request?.admin_notes
      ? request.admin_notes.trim()
      : "";


  if (rejectionReason) {

    rejectionReason.classList.add(
      "show"
    );

  }


  if (rejectionReasonText) {

    rejectionReasonText.textContent =
      reason ||
      "لم يتم تسجيل سبب محدد من قبل الإدارة.";

  }


  // ---------------------------------------------------
  // معلومات الطلب
  // ---------------------------------------------------

  if (requestMeta) {

    requestMeta.classList.add(
      "show"
    );


    const reviewedText =
      formatDateTime(
        request?.reviewed_at
      );


    requestMeta.textContent =
      reviewedText
        ? `تمت مراجعة الطلب بتاريخ ${reviewedText}. يمكنك الآن تقديم طلب جديد.`
        : "يمكنك الآن تقديم طلب جديد.";

  }


  // ---------------------------------------------------
  // زر طلب جديد
  // ---------------------------------------------------

  if (statusAction) {

    statusAction.style.display =
      "block";

  }


  updateRequestStatusIcon(
    "rejected"
  );


  hideMessage();


  isWaitingForDecision =
    false;

}


// =====================================================
// تحديث أيقونة حالة الطلب
// =====================================================

function updateRequestStatusIcon(
  type
) {

  const pendingIcon =
    document.getElementById(
      "pendingStatusIcon"
    );

  const rejectedIcon =
    document.getElementById(
      "rejectedStatusIcon"
    );

  const successIcon =
    document.getElementById(
      "successStatusIcon"
    );

  const iconContainer =
    document.getElementById(
      "requestStatusIcon"
    );


  if (pendingIcon) {

    pendingIcon.style.display =
      type === "pending"
        ? "block"
        : "none";

  }


  if (rejectedIcon) {

    rejectedIcon.style.display =
      type === "rejected"
        ? "block"
        : "none";

  }


  if (successIcon) {

    successIcon.style.display =
      type === "success"
        ? "block"
        : "none";

  }


  if (iconContainer) {

    iconContainer.classList.toggle(
      "pending-pulse",
      type === "pending"
    );

  }

}


// =====================================================
// إعداد زر تقديم طلب جديد
// =====================================================

function setupNewRequestButton() {

  const button =
    document.getElementById(
      "newSubscriptionRequestBtn"
    );


  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    async () => {

      // -----------------------------------------------
      // قبل فتح الخطط نتأكد أنه ما صار اشتراك فعال
      // -----------------------------------------------

      const activeSubscription =
        await hasActiveSubscription();


      if (activeSubscription) {

        window.location.replace(
          "dashboard.html"
        );

        return;

      }


      // -----------------------------------------------
      // فحص آخر طلب
      // -----------------------------------------------

      const latestRequest =
        await getLatestSubscriptionRequest();


      if (
        latestRequest &&
        latestRequest.status ===
        "pending"
      ) {

        currentRequestId =
          latestRequest.id;


        showPendingRequestStatus(
          latestRequest
        );


        startStatusPolling();


        return;

      }


      if (
        latestRequest &&
        latestRequest.status ===
        "approved"
      ) {

        window.location.replace(
          "dashboard.html"
        );

        return;

      }


      // -----------------------------------------------
      // السماح بتقديم طلب جديد
      // -----------------------------------------------

      resetSubscriptionFlow();


      hideRequestStatus();

      showStep(1);


      // -----------------------------------------------
      // التمرير إلى أعلى الكارد
      // -----------------------------------------------

      scrollToSubscriptionCard();

    }
  );

}


// =====================================================
// إعادة ضبط عملية الاشتراك
// =====================================================

function resetSubscriptionFlow() {

  stopStatusPolling();


  selectedPlan =
    null;


  selectedPaymentMethod =
    null;


  currentRequestId =
    null;


  // ---------------------------------------------------
  // إزالة تحديد الخطط
  // ---------------------------------------------------

  const planCards =
    document.querySelectorAll(
      ".plan-card"
    );


  planCards.forEach(card => {

    card.classList.remove(
      "selected"
    );

  });


  // ---------------------------------------------------
  // زر الاشتراك
  // ---------------------------------------------------

  const nextButton =
    document.getElementById(
      "nextToPaymentBtn"
    );


  if (nextButton) {

    nextButton.style.display =
      "none";

    nextButton.disabled =
      true;

    nextButton.textContent =
      "اشتراك";

  }


  // ---------------------------------------------------
  // تنظيف الدفع
  // ---------------------------------------------------

  resetPaymentSelection();


  // ---------------------------------------------------
  // تنظيف بيانات التفعيل
  // ---------------------------------------------------

  const referenceInput =
    document.getElementById(
      "paymentReference"
    );

  const notesInput =
    document.getElementById(
      "customerNotes"
    );


  if (referenceInput) {

    referenceInput.value =
      "";

  }


  if (notesInput) {

    notesInput.value =
      "";

  }


  hideMessage();

}


// =====================================================
// إخفاء جميع خطوات الاشتراك
// =====================================================

function hideAllSubscriptionSteps() {

  const step1 =
    document.getElementById(
      "subscriptionStep1"
    );

  const step2 =
    document.getElementById(
      "subscriptionStep2"
    );

  const step3 =
    document.getElementById(
      "subscriptionStep3"
    );


  if (step1) {

    step1.style.display =
      "none";

  }


  if (step2) {

    step2.style.display =
      "none";

  }


  if (step3) {

    step3.style.display =
      "none";

  }

}


// =====================================================
// إظهار حالة الطلب
// =====================================================

function showRequestStatus() {

  const status =
    document.getElementById(
      "requestStatus"
    );


  if (status) {

    status.classList.add(
      "show"
    );

  }

}


// =====================================================
// إخفاء حالة الطلب
// =====================================================

function hideRequestStatus() {

  const status =
    document.getElementById(
      "requestStatus"
    );


  if (status) {

    status.classList.remove(
      "show"
    );

  }

}


// =====================================================
// فحص حالة الاشتراك
// =====================================================

async function hasActiveSubscriptionSafe() {

  try {

    return await hasActiveSubscription();

  } catch (error) {

    console.error(
      "Safe subscription check error:",
      error
    );

    return false;

  }

}


// =====================================================
// تسجيل الخروج
// =====================================================

function setupLogout() {

  const logoutButton =
    document.getElementById(
      "logoutBtn"
    );


  if (!logoutButton) {
    return;
  }


  logoutButton.addEventListener(
    "click",
    async () => {

      logoutButton.disabled =
        true;


      logoutButton.textContent =
        "جاري تسجيل الخروج...";


      stopStatusPolling();


      try {

        await logout();

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );


        logoutButton.disabled =
          false;

        logoutButton.textContent =
          "تسجيل الخروج";

      }

    }
  );

}


// =====================================================
// رسائل الصفحة
// =====================================================

function showMessage(
  message,
  type = "error"
) {

  const messageElement =
    document.getElementById(
      "subscriptionMessage"
    );


  if (!messageElement) {
    return;
  }


  messageElement.textContent =
    message;


  messageElement.className =
    "message show " +
    type;


}


// =====================================================
// إخفاء الرسالة
// =====================================================

function hideMessage() {

  const messageElement =
    document.getElementById(
      "subscriptionMessage"
    );


  if (!messageElement) {
    return;
  }


  messageElement.textContent =
    "";


  messageElement.className =
    "message";

}


// =====================================================
// اسم الخطة
// =====================================================

function getPlanDisplayName(
  plan
) {

  if (!plan) {
    return "-";
  }


  if (plan.name) {

    return plan.name;

  }


  if (
    plan.code ===
    "monthly"
  ) {

    return "الاشتراك الشهري";

  }


  if (
    plan.code ===
    "yearly"
  ) {

    return "الاشتراك السنوي";

  }


  return "-";

}


// =====================================================
// اسم طريقة الدفع
// =====================================================

function getPaymentMethodName(
  method
) {

  if (
    method ===
    "zain_cash"
  ) {

    return "ZainCash";

  }


  if (
    method ===
    "mastercard"
  ) {

    return "MasterCard";

  }


  return "-";

}


// =====================================================
// مدة الاشتراك
// =====================================================

function getDurationText(
  durationDays
) {

  const days =
    Number(durationDays);


  if (!days) {

    return "-";

  }


  if (days === 30) {

    return "لمدة 30 يوم";

  }


  if (days === 365) {

    return "لمدة عام كامل";

  }


  if (
    days === 360
  ) {

    return "لمدة عام كامل";

  }


  if (
    days === 1
  ) {

    return "لمدة يوم واحد";

  }


  if (
    days === 7
  ) {

    return "لمدة 7 أيام";

  }


  if (
    days === 90
  ) {

    return "لمدة 90 يوم";

  }


  if (
    days === 180
  ) {

    return "لمدة 180 يوم";

  }


  return `لمدة ${days} يوم`;

}


// =====================================================
// تنسيق الدينار العراقي
// =====================================================

function formatIQD(
  amount
) {

  const value =
    Number(amount);


  if (
    !Number.isFinite(value)
  ) {

    return "0 د.ع";

  }


  return (
    new Intl.NumberFormat(
      "en-IQ"
    ).format(value) +
    " د.ع"
  );

}


// =====================================================
// تنسيق التاريخ والوقت
// =====================================================

function formatDateTime(
  value
) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  try {

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
          "2-digit"
      }
    ).format(date);

  } catch (error) {

    return "";

  }

}


// =====================================================
// تمرير المستخدم إلى كارد الاشتراك
// =====================================================

function scrollToSubscriptionCard() {

  const card =
    document.querySelector(
      ".subscription-card"
    );


  if (!card) {
    return;
  }


  setTimeout(() => {

    card.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }, 100);

}


// =====================================================
// حماية إضافية عند مغادرة الصفحة
// =====================================================

window.addEventListener(
  "beforeunload",
  () => {

    stopStatusPolling();

  }
);


// =====================================================
// التعامل مع رجوع الصفحة من الخلفية
// =====================================================

document.addEventListener(
  "visibilitychange",
  async () => {

    if (
      document.visibilityState !==
      "visible"
    ) {

      return;

    }


    if (
      !currentUser ||
      !isWaitingForDecision
    ) {

      return;

    }


    // -------------------------------------------------
    // عند رجوع المستخدم للصفحة
    // نفحص الحالة فوراً بدلاً من انتظار 5 ثواني
    // -------------------------------------------------

    await refreshRequestStatus();

  }
);