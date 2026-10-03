// =====================================================
// Zain Sales - Reset Password
// تغيير كلمة المرور
// =====================================================


const resetForm =
  document.getElementById("resetForm");

const loadingMessage =
  document.getElementById("loadingMessage");

const newPasswordInput =
  document.getElementById("newPassword");

const confirmPasswordInput =
  document.getElementById("confirmPassword");

const resetBtn =
  document.getElementById("resetBtn");

const resetMessage =
  document.getElementById("resetMessage");


// =====================================================
// قواعد كلمة المرور
// =====================================================

const ruleLength =
  document.getElementById("ruleLength");

const ruleNumber =
  document.getElementById("ruleNumber");

const ruleUppercase =
  document.getElementById("ruleUppercase");

const ruleSpecial =
  document.getElementById("ruleSpecial");


// =====================================================
// متغير للتأكد من وجود جلسة الاستعادة
// =====================================================

let recoverySessionReady = false;


// =====================================================
// عرض الرسائل
// =====================================================

function showMessage(message, type) {

  resetMessage.textContent = message;

  resetMessage.className =
    "reset-message " + type;

}


// =====================================================
// تحديث قواعد كلمة المرور
// =====================================================

function updatePasswordRules() {

  const password =
    newPasswordInput.value;


  const hasLength =
    password.length >= 6;

  const hasNumber =
    /[0-9]/.test(password);

  const hasUppercase =
    /[A-Z]/.test(password);

  const hasSpecial =
    /[^A-Za-z0-9]/.test(password);


  updateRule(
    ruleLength,
    hasLength
  );

  updateRule(
    ruleNumber,
    hasNumber
  );

  updateRule(
    ruleUppercase,
    hasUppercase
  );

  updateRule(
    ruleSpecial,
    hasSpecial
  );


  return (
    hasLength &&
    hasNumber &&
    hasUppercase &&
    hasSpecial
  );

}


function updateRule(element, valid) {

  element.classList.toggle(
    "valid",
    valid
  );

}


// =====================================================
// مراقبة كلمة المرور
// =====================================================

newPasswordInput.addEventListener(
  "input",
  updatePasswordRules
);


// =====================================================
// التحقق من جلسة استعادة كلمة المرور
// =====================================================

async function initializeResetPassword() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {
      throw error;
    }


    if (data.session) {

      recoverySessionReady = true;

      showResetForm();

      return;

    }


    // ننتظر قليلاً لأن Supabase قد يحتاج
    // وقتاً لمعالجة رابط الاستعادة

    setTimeout(
      async () => {

        const {
          data,
          error
        } =
          await supabaseClient.auth.getSession();


        if (
          !error &&
          data.session
        ) {

          recoverySessionReady = true;

          showResetForm();

        } else {

          showInvalidLink();

        }

      },
      1000
    );


  } catch (error) {

    console.error(
      "Reset session error:",
      error
    );

    showInvalidLink();

  }

}


// =====================================================
// مراقبة أحداث Supabase
// =====================================================

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    if (
      event === "PASSWORD_RECOVERY" &&
      session
    ) {

      recoverySessionReady = true;

      showResetForm();

    }

  }
);


// =====================================================
// إظهار نموذج تغيير كلمة المرور
// =====================================================

function showResetForm() {

  loadingMessage.style.display =
    "none";

  resetForm.style.display =
    "block";

}


// =====================================================
// رابط غير صالح
// =====================================================

function showInvalidLink() {

  loadingMessage.textContent =
    "رابط استعادة كلمة المرور غير صالح أو انتهت صلاحيته. اطلب رابطاً جديداً من صفحة نسيت كلمة المرور.";

  loadingMessage.style.color =
    "#c62828";

}


// =====================================================
// حفظ كلمة المرور الجديدة
// =====================================================

resetForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    if (!recoverySessionReady) {

      showMessage(
        "جلسة استعادة كلمة المرور غير صالحة. اطلب رابطاً جديداً.",
        "error"
      );

      return;

    }


    const password =
      newPasswordInput.value;

    const confirmPassword =
      confirmPasswordInput.value;


    // التحقق من قوة كلمة المرور

    if (!updatePasswordRules()) {

      showMessage(
        "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل، ورقم، وحرف إنجليزي كبير، ورمز خاص.",
        "error"
      );

      return;

    }


    // التحقق من التطابق

    if (
      password !== confirmPassword
    ) {

      showMessage(
        "كلمتا المرور غير متطابقتين.",
        "error"
      );

      return;

    }


    resetBtn.disabled = true;

    resetBtn.textContent =
      "جاري حفظ كلمة المرور...";


    try {

      const {
        error
      } =
        await supabaseClient.auth.updateUser({
          password: password
        });


      if (error) {
        throw error;
      }


      showMessage(
        "تم تغيير كلمة المرور بنجاح. سيتم تحويلك إلى صفحة تسجيل الدخول.",
        "success"
      );


      resetBtn.textContent =
        "تم تغيير كلمة المرور";


      // تسجيل الخروج من جلسة الاستعادة

      setTimeout(
        async () => {

          await supabaseClient.auth.signOut();

          window.location.replace(
            "index.html"
          );

        },
        1800
      );


    } catch (error) {

      console.error(
        "Update password error:",
        error
      );


      showMessage(
        getPasswordUpdateErrorMessage(error),
        "error"
      );


      resetBtn.disabled = false;

      resetBtn.textContent =
        "حفظ كلمة المرور الجديدة";

    }

  }
);


// =====================================================
// رسائل الأخطاء
// =====================================================

function getPasswordUpdateErrorMessage(error) {

  const message =
    (error?.message || "").toLowerCase();


  if (
    message.includes("same password")
  ) {

    return "كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور السابقة.";

  }


  if (
    message.includes("password")
  ) {

    return "كلمة المرور غير مقبولة. تأكد من استيفاء جميع الشروط.";

  }


  return "تعذر تغيير كلمة المرور. قد يكون رابط الاستعادة منتهياً. اطلب رابطاً جديداً وحاول مرة أخرى.";

}


// =====================================================
// تشغيل الصفحة
// =====================================================

initializeResetPassword();