// =====================================================
// Zain Sales - Subscription
// =====================================================
// رقم الدفع الخاص بالإدارة
// غيّره إلى رقم Zain Cash الحقيقي
const PAYMENT_NUMBER = "07714064135";
let currentUser = null;
let plans = [];
let selectedPlan = null;
// =====================================================
// تشغيل الصفحة
// =====================================================
document.addEventListener("DOMContentLoaded", async () => {
  currentUser = await requireAuth();
  if (!currentUser) return;
  // تشغيل الصفحة
  await loadSubscriptionPlans();
  setupPlanSelection();
  setupCopyButton();
  setupLogout();
  setupSubmitButton();
  setupInputs();
  // فحص وجود طلب سابق
  await checkPendingRequest();
});
// =====================================================
// جلب خطط الاشتراك من Supabase
// =====================================================
async function loadSubscriptionPlans() {
  const message =
    document.getElementById("subscriptionMessage");
  try {
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
      console.error(error);
      throw new Error(
        "تعذر تحميل خطط الاشتراك."
      );
    }
    if (!data || data.length === 0) {
      throw new Error(
        "لا توجد خطط اشتراك متاحة حالياً."
      );
    }
    plans = data;
    // تحديث بطاقات الخطط من قاعدة البيانات
    updatePlanCards();
    // رقم الدفع
    document.getElementById(
      "paymentNumber"
    ).textContent = PAYMENT_NUMBER;
  } catch (error) {
    console.error(error);
    showMessage(
      error.message ||
      "حدث خطأ أثناء تحميل الاشتراكات.",
      "error"
    );
  }
}
// =====================================================
// تحديث بطاقات الخطط
// =====================================================
function updatePlanCards() {
  const cards =
    document.querySelectorAll(".plan-card");

  cards.forEach(card => {
    const code = card.dataset.plan;

    const plan = plans.find(
      item => item.code === code
    );

    if (!plan) {
      card.style.display = "none";
      return;
    }

    // السعر
    const priceElement =
      card.querySelector(".plan-price");

    if (priceElement) {
      priceElement.textContent =
        formatIQD(plan.price);
    }

    // المدة
    const durationElement =
      card.querySelector(".plan-duration");

    if (durationElement) {
      if (plan.code === "monthly") {
        durationElement.textContent =
          "صالح لمدة شهر";
      } else if (plan.code === "yearly") {
        durationElement.textContent =
          "صالح لمدة سنة";
      } else {
        durationElement.textContent =
          `صالح لمدة ${plan.duration_days} يوم`;
      }
    }
  });
}
// =====================================================
// اختيار الاشتراك
// =====================================================
function setupPlanSelection() {
  const cards =
    document.querySelectorAll(".plan-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      const code =
        card.dataset.plan;
      const plan =
        plans.find(item =>
          item.code === code
        );
      if (!plan) {
        showMessage(
          "تعذر العثور على هذه الخطة.",
          "error"
        );
        return;
      }
      // حفظ الخطة المختارة
      selectedPlan = plan;
      // إزالة التحديد
      cards.forEach(item => {
        item.classList.remove("selected");
      });
      // تحديد الخطة
      card.classList.add("selected");
      // تحديث المعلومات
      updateSubscriptionSummary();
    });
  });
}
// =====================================================
// تحديث ملخص الاشتراك
// =====================================================
function updateSubscriptionSummary() {
  if (!selectedPlan) return;
  const summaryPlan =
    document.getElementById("summaryPlan");
  const summaryDuration =
    document.getElementById("summaryDuration");
  const summaryPrice =
    document.getElementById("summaryPrice");
  const paymentAmount =
    document.getElementById("paymentAmount");
  const submitButton =
    document.getElementById(
      "submitSubscriptionBtn"
    );
  // اسم الخطة
  summaryPlan.textContent =
    selectedPlan.name;
  // المدة
  summaryDuration.textContent =
    getDurationText(
      selectedPlan.duration_days
    );
  // السعر
  summaryPrice.textContent =
    formatIQD(selectedPlan.price);
  // مبلغ الدفع
  paymentAmount.textContent =
    formatIQD(selectedPlan.price);
  // زر الإرسال
  submitButton.disabled = false;
  submitButton.textContent =
    `إرسال طلب التفعيل - ${formatIQD(selectedPlan.price)}`;
  hideMessage();
}
// =====================================================
// نسخ رقم الدفع
// =====================================================
function setupCopyButton() {
  const button =
    document.getElementById(
      "copyPaymentNumberBtn"
    );
  if (!button) return;
  button.addEventListener(
    "click",
    async () => {
      try {
        await navigator.clipboard.writeText(
          PAYMENT_NUMBER
        );
        const oldText =
          button.textContent;
        button.textContent =
          "تم النسخ ✓";
        setTimeout(() => {
          button.textContent =
            oldText;
        }, 2000);
      } catch (error) {
        console.error(error);
        showMessage(
          "تعذر نسخ الرقم. يمكنك نسخه يدوياً.",
          "warning"
        );
      }
    }
  );
}
// =====================================================
// إعداد تسجيل الخروج
// =====================================================
function setupLogout() {
  const button =
    document.getElementById("logoutBtn");
  if (!button) return;
  button.addEventListener(
    "click",
    logout
  );
}
// =====================================================
// إعداد زر إرسال الطلب
// =====================================================
function setupSubmitButton() {
  const button =
    document.getElementById(
      "submitSubscriptionBtn"
    );
  if (!button) return;
  button.addEventListener(
    "click",
    submitSubscriptionRequest
  );
}
// =====================================================
// إعداد الحقول
// =====================================================
function setupInputs() {
  const referenceInput =
    document.getElementById(
      "paymentReference"
    );
  if (referenceInput) {
    referenceInput.addEventListener(
      "input",
      () => {
        // إزالة المسافات الزائدة
        referenceInput.value =
          referenceInput.value
            .trimStart();
      }
    );
  }
}
// =====================================================
// إرسال طلب الاشتراك
// =====================================================
async function submitSubscriptionRequest() {
  const button =
    document.getElementById(
      "submitSubscriptionBtn"
    );
  const referenceInput =
    document.getElementById(
      "paymentReference"
    );
  const notesInput =
    document.getElementById(
      "customerNotes"
    );
  if (!selectedPlan) {
    showMessage(
      "يرجى اختيار الاشتراك أولاً.",
      "error"
    );
    return;
  }
  const paymentReference =
    referenceInput.value.trim();
  const customerNotes =
    notesInput.value.trim();
  // التحقق من رقم العملية
  if (!paymentReference) {
    showMessage(
      "يرجى إدخال رقم العملية بعد إتمام التحويل.",
      "error"
    );
    referenceInput.focus();
    return;
  }
  if (paymentReference.length < 3) {
    showMessage(
      "رقم العملية غير صحيح.",
      "error"
    );
    referenceInput.focus();
    return;
  }
  // منع الضغط المتكرر
  button.disabled = true;
  button.textContent =
    "جاري إرسال الطلب...";
  hideMessage();
  try {
    // =========================================
    // التأكد من المستخدم
    // =========================================
    const {
      data: {
        user
      },
      error: userError
    } =
      await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error(
        "انتهت جلسة الدخول. يرجى تسجيل الدخول مرة أخرى."
      );
    }
    currentUser = user;
    // =========================================
    // التأكد من عدم وجود طلب معلّق
    // =========================================
    const {
      data: pendingRequest,
      error: pendingError
    } =
      await supabaseClient
        .from(
          "subscription_payment_requests"
        )
        .select("id, status")
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "status",
          "pending"
        )
        .limit(1);
    if (pendingError) {
      console.error(pendingError);
      throw new Error(
        "تعذر التحقق من طلباتك السابقة."
      );
    }
    if (
      pendingRequest &&
      pendingRequest.length > 0
    ) {
      throw new Error(
        "لديك طلب اشتراك قيد المراجعة بالفعل. يرجى الانتظار حتى تتم مراجعته."
      );
    }
    // =========================================
    // إعادة جلب الخطة من قاعدة البيانات
    // =========================================
    const {
      data: plan,
      error: planError
    } =
      await supabaseClient
        .from("subscription_plans")
        .select(`
          id,
          code,
          name,
          price,
          duration_days
        `)
        .eq(
          "code",
          selectedPlan.code
        )
        .eq(
          "is_active",
          true
        )
        .single();
    if (planError || !plan) {
      console.error(planError);
      throw new Error(
        "تعذر التحقق من خطة الاشتراك."
      );
    }
    // =========================================
    // إرسال الطلب
    // =========================================
    const {
      error: insertError
    } =
      await supabaseClient
        .from(
          "subscription_payment_requests"
        )
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          amount: plan.price,
          payment_method: "manual",
          payment_reference:
            paymentReference,
          customer_notes:
            customerNotes || null,
          status: "pending"
        });
    if (insertError) {
      console.error(insertError);
      throw new Error(
        "تعذر إرسال طلب الاشتراك. حاول مرة أخرى."
      );
    }
    // =========================================
    // نجاح
    // =========================================
    showMessage(
      "تم إرسال طلب الاشتراك بنجاح. طلبك الآن بانتظار مراجعة الإدارة وتفعيل الاشتراك.",
      "success"
    );
    button.textContent =
      "تم إرسال الطلب ✓";
    // تعطيل الحقول
    referenceInput.disabled = true;
    notesInput.disabled = true;
    // تعطيل بطاقات الخطط
    document
      .querySelectorAll(".plan-card")
      .forEach(card => {
        card.style.pointerEvents =
          "none";
      });
  } catch (error) {
    console.error(error);
    showMessage(
      error.message ||
      "حدث خطأ أثناء إرسال الطلب.",
      "error"
    );
    button.disabled = false;
    button.textContent =
      `إرسال طلب التفعيل - ${formatIQD(selectedPlan.price)}`;
  }
}
// =====================================================
// فحص وجود طلب قيد المراجعة
// =====================================================
async function checkPendingRequest() {
  if (!currentUser) return;
  try {
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
          amount,
          status,
          created_at,
          payment_reference,
          plan_id
        `)
        .eq(
          "user_id",
          currentUser.id
        )
        .eq(
          "status",
          "pending"
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(1);
    if (error) {
      console.error(
        "Pending request error:",
        error
      );
      return;
    }
    if (
      data &&
      data.length > 0
    ) {
      const request =
        data[0];
      showMessage(
        `لديك طلب اشتراك قيد المراجعة بقيمة ${formatIQD(request.amount)}. يرجى الانتظار حتى تتم مراجعة الطلب وتفعيل الاشتراك.`,
        "warning"
      );
      // منع إرسال طلب ثاني
      const button =
        document.getElementById(
          "submitSubscriptionBtn"
        );
      if (button) {
        button.disabled = true;
        button.textContent =
          "لديك طلب قيد المراجعة";
      }
      // تعطيل الاختيار
      document
        .querySelectorAll(".plan-card")
        .forEach(card => {
          card.style.pointerEvents =
            "none";
        });
      // تعبئة رقم العملية إذا موجود
      const referenceInput =
        document.getElementById(
          "paymentReference"
        );
      if (
        referenceInput &&
        request.payment_reference
      ) {
        referenceInput.value =
          request.payment_reference;
        referenceInput.disabled = true;
      }
      return;
    }
  } catch (error) {
    console.error(error);
  }
}
// =====================================================
// تنسيق الدينار العراقي
// =====================================================
function formatIQD(value) {
  const number =
    Number(value);
  if (Number.isNaN(number)) {
    return "0 د.ع";
  }
  return (
    number.toLocaleString("en-IQ") +
    " د.ع"
  );
}
// =====================================================
// نص مدة الاشتراك
// =====================================================
function getDurationText(days) {
  if (days === 30) {
    return "30 يوم";
  }
  if (days === 365) {
    return "سنة كاملة";
  }
  return `${days} يوم`;
}
// =====================================================
// إظهار رسالة
// =====================================================
function showMessage(
  message,
  type = "warning"
) {
  const element =
    document.getElementById(
      "subscriptionMessage"
    );
  if (!element) return;
  element.textContent =
    message;
  element.className =
    `message show ${type}`;
}
// =====================================================
// إخفاء الرسالة
// =====================================================
function hideMessage() {
  const element =
    document.getElementById(
      "subscriptionMessage"
    );
  if (!element) return;
  element.textContent = "";
  element.className =
    "message";
}