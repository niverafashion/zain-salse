// =====================================================
// Zain Sales - Forgot Password
// استعادة كلمة المرور بواسطة رمز OTP
// =====================================================


// =====================================================
// العناصر
// =====================================================

const forgotPasswordForm =
  document.getElementById("forgotPasswordForm");

const verifyResetForm =
  document.getElementById("verifyResetForm");

const emailInput =
  document.getElementById("email");

const resetOtpInput =
  document.getElementById("resetOtp");

const sendResetBtn =
  document.getElementById("sendResetBtn");

const verifyResetBtn =
  document.getElementById("verifyResetBtn");

const resendResetBtn =
  document.getElementById("resendResetBtn");

const resendCountdown =
  document.getElementById("resendCountdown");

const forgotEmail =
  document.getElementById("forgotEmail");

const messageBox =
  document.getElementById("message");

const otpMessageBox =
  document.getElementById("otpMessage");

const emailStep =
  document.getElementById("emailStep");

const otpStep =
  document.getElementById("otpStep");

const forgotTitle =
  document.getElementById("forgotTitle");

const forgotSubtitle =
  document.getElementById("forgotSubtitle");

const forgotLock =
  document.getElementById("forgotLock");

const forgotLockTime =
  document.getElementById("forgotLockTime");


// =====================================================
// الإعدادات
// =====================================================

const RESEND_SECONDS = 59;

const MAX_ATTEMPTS = 3;

const LOCK_SECONDS = 5 * 60;


// =====================================================
// المتغيرات
// =====================================================

let resendTimer = null;

let lockTimer = null;

let failedAttempts = 0;

let isVerifying = false;

let isLocked = false;

let currentEmail = "";


// =====================================================
// عند تحميل الصفحة
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupEmailForm();

    setupOtpForm();

    setupOtpInput();

    setupResend();

  }
);


// =====================================================
// إعداد نموذج البريد
// =====================================================

function setupEmailForm() {

  if (!forgotPasswordForm) {
    return;
  }


  forgotPasswordForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      await sendResetCode();

    }
  );

}


// =====================================================
// إعداد نموذج OTP
// =====================================================

function setupOtpForm() {

  if (!verifyResetForm) {
    return;
  }


  verifyResetForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      await verifyResetCode();

    }
  );

}


// =====================================================
// إعداد خانة OTP
// =====================================================

function setupOtpInput() {

  if (!resetOtpInput) {
    return;
  }


  resetOtpInput.addEventListener(
    "input",
    () => {

      if (isLocked || isVerifying) {
        return;
      }


      // السماح بالأرقام فقط
      resetOtpInput.value =
        resetOtpInput.value
          .replace(/\D/g, "")
          .slice(0, 6);


      // التحقق تلقائياً عند إدخال الرقم السادس
      if (
        resetOtpInput.value.length === 6
      ) {

        verifyResetCode();

      }

    }
  );


  resetOtpInput.addEventListener(
    "paste",
    () => {

      setTimeout(
        () => {

          if (isLocked || isVerifying) {
            return;
          }


          resetOtpInput.value =
            resetOtpInput.value
              .replace(/\D/g, "")
              .slice(0, 6);


          if (
            resetOtpInput.value.length === 6
          ) {

            verifyResetCode();

          }

        },
        0
      );

    }
  );

}


// =====================================================
// إعداد إعادة الإرسال
// =====================================================

function setupResend() {

  if (!resendResetBtn) {
    return;
  }


  resendResetBtn.addEventListener(
    "click",
    async () => {

      if (
        isLocked ||
        resendResetBtn.disabled
      ) {
        return;
      }


      await resendResetCode();

    }
  );

}


// =====================================================
// إرسال رمز استعادة كلمة المرور
// =====================================================

async function sendResetCode() {

  clearMessage(messageBox);


  const email =
    emailInput.value.trim().toLowerCase();


  if (!email) {

    showMessage(
      messageBox,
      "يرجى إدخال البريد الإلكتروني.",
      "error"
    );

    emailInput.focus();

    return;
  }


  if (!isValidEmail(email)) {

    showMessage(
      messageBox,
      "البريد الإلكتروني غير صالح.",
      "error"
    );

    emailInput.focus();

    return;
  }


  setButtonLoading(
    sendResetBtn,
    "جاري إرسال رمز التحقق..."
  );


  try {

    const { error } =
      await supabaseClient.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            getResetPasswordUrl()
        }
      );


    if (error) {
      throw error;
    }


    currentEmail = email;


    sessionStorage.setItem(
      "zainSalesResetEmail",
      email
    );


    // عرض مرحلة OTP
    showOtpStep();


    // بدء عداد إعادة الإرسال
    startResendTimer();


    showMessage(
      otpMessageBox,
      "تم إرسال رمز التحقق إلى بريدك الإلكتروني.",
      "success"
    );


    // التركيز على خانة الرمز
    setTimeout(
      () => {

        resetOtpInput.focus();

      },
      150
    );


  } catch (error) {

    console.error(
      "Send reset code error:",
      error
    );


    showMessage(
      messageBox,
      getResetErrorMessage(error),
      "error"
    );


  } finally {

    if (sendResetBtn) {

      sendResetBtn.disabled = false;

      sendResetBtn.textContent =
        "إرسال رمز التحقق";

    }

  }

}


// =====================================================
// التحقق من رمز الاستعادة
// =====================================================

async function verifyResetCode() {

  if (isLocked || isVerifying) {
    return;
  }


  const token =
    resetOtpInput.value.trim();


  if (!/^\d{6}$/.test(token)) {

    showMessage(
      otpMessageBox,
      "أدخل رمز التحقق المكوّن من 6 أرقام.",
      "error"
    );

    return;
  }


  isVerifying = true;


  resetOtpInput.disabled = true;

  verifyResetBtn.disabled = true;


  setButtonLoading(
    verifyResetBtn,
    "جاري التحقق..."
  );


  clearMessage(otpMessageBox);


  try {

    const { data, error } =
      await supabaseClient.auth.verifyOtp({
        email: currentEmail,
        token: token,
        type: "recovery"
      });


    if (error) {
      throw error;
    }


    // =================================================
    // نجاح التحقق
    // =================================================

    if (!data || !data.session) {

      throw new Error(
        "لم يتم إنشاء جلسة استعادة كلمة المرور."
      );

    }


    // حفظ علامة نجاح الاستعادة
    sessionStorage.setItem(
      "zainSalesPasswordRecovery",
      "true"
    );


    sessionStorage.setItem(
      "zainSalesResetEmail",
      currentEmail
    );


    clearInterval(resendTimer);

    resendResetBtn.disabled = true;


    showMessage(
      otpMessageBox,
      "تم التحقق من الرمز بنجاح.",
      "success"
    );


    verifyResetBtn.disabled = true;

    verifyResetBtn.textContent =
      "تم التحقق ✓";


    // الانتقال إلى صفحة كلمة السر الجديدة
    setTimeout(
      () => {

        window.location.replace(
          "reset-password.html"
        );

      },
      700
    );


  } catch (error) {

    console.error(
      "Verify reset OTP error:",
      error
    );


    failedAttempts++;


    resetOtpInput.value = "";


    // =================================================
    // الوصول إلى الحد الأقصى للمحاولات
    // =================================================

    if (
      failedAttempts >= MAX_ATTEMPTS
    ) {

      startLock();

      return;

    }


    const remainingAttempts =
      MAX_ATTEMPTS - failedAttempts;


    showMessage(
      otpMessageBox,
      getVerifyErrorMessage(
        error,
        remainingAttempts
      ),
      "error"
    );


    resetOtpInput.focus();


  } finally {

    isVerifying = false;


    if (!isLocked) {

      resetOtpInput.disabled = false;

      verifyResetBtn.disabled = false;

      verifyResetBtn.textContent =
        "تأكيد الرمز";

    }

  }

}


// =====================================================
// إعادة إرسال الرمز
// =====================================================

async function resendResetCode() {

  if (
    isLocked ||
    !currentEmail
  ) {
    return;
  }


  resendResetBtn.disabled = true;


  showMessage(
    otpMessageBox,
    "جاري إرسال رمز التأكيد...",
    "info"
  );


  try {

    const { error } =
      await supabaseClient.auth.resetPasswordForEmail(
        currentEmail,
        {
          redirectTo:
            getResetPasswordUrl()
        }
      );


    if (error) {
      throw error;
    }


    resetOtpInput.value = "";


    showMessage(
      otpMessageBox,
      "تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني.",
      "success"
    );


    startResendTimer();


    resetOtpInput.focus();


  } catch (error) {

    console.error(
      "Resend reset code error:",
      error
    );


    showMessage(
      otpMessageBox,
      getResetErrorMessage(error),
      "error"
    );


    resendResetBtn.disabled = false;

  }

}


// =====================================================
// إظهار صفحة OTP
// =====================================================

function showOtpStep() {

  emailStep.classList.remove("active");

  otpStep.classList.add("active");


  forgotTitle.textContent =
    "أدخل رمز التحقق";


  forgotSubtitle.textContent =
    "أرسلنا رمزاً مكوّناً من 6 أرقام إلى بريدك الإلكتروني.";


  forgotEmail.textContent =
    currentEmail;

}


// =====================================================
// عداد إعادة الإرسال
// =====================================================

function startResendTimer() {

  clearInterval(resendTimer);


  let seconds =
    RESEND_SECONDS;


  resendResetBtn.disabled = true;


  updateResendCountdown(seconds);


  resendTimer = setInterval(
    () => {

      seconds--;


      updateResendCountdown(seconds);


      if (seconds <= 0) {

        clearInterval(resendTimer);

        resendTimer = null;


        if (!isLocked) {

          resendResetBtn.disabled = false;

        }

      }

    },
    1000
  );

}


// =====================================================
// تحديث عداد إعادة الإرسال
// =====================================================

function updateResendCountdown(seconds) {

  if (!resendCountdown) {
    return;
  }


  resendCountdown.textContent =
    seconds;


  if (seconds <= 0) {

    resendCountdown.style.display =
      "none";

  } else {

    resendCountdown.style.display =
      "inline";

  }

}


// =====================================================
// قفل مؤقت بعد 3 محاولات فاشلة
// =====================================================

function startLock() {

  isLocked = true;


  clearInterval(resendTimer);


  resetOtpInput.disabled = true;

  verifyResetBtn.disabled = true;

  resendResetBtn.disabled = true;


  forgotLock.classList.add("show");


  let seconds =
    LOCK_SECONDS;


  updateLockTime(seconds);


  showMessage(
    otpMessageBox,
    "تم إيقاف التحقق مؤقتاً.",
    "error"
  );


  lockTimer = setInterval(
    () => {

      seconds--;


      updateLockTime(seconds);


      if (seconds <= 0) {

        clearInterval(lockTimer);

        lockTimer = null;


        finishLock();

      }

    },
    1000
  );

}


// =====================================================
// انتهاء القفل
// =====================================================

function finishLock() {

  isLocked = false;

  failedAttempts = 0;


  forgotLock.classList.remove("show");


  resetOtpInput.disabled = false;

  verifyResetBtn.disabled = false;


  verifyResetBtn.textContent =
    "تأكيد الرمز";


  resetOtpInput.value = "";


  showMessage(
    otpMessageBox,
    "يمكنك المحاولة مرة أخرى الآن.",
    "info"
  );


  // إعادة تشغيل عداد إعادة الإرسال
  startResendTimer();


  resetOtpInput.focus();

}


// =====================================================
// تحديث وقت القفل
// =====================================================

function updateLockTime(seconds) {

  const minutes =
    Math.floor(seconds / 60);

  const remainingSeconds =
    seconds % 60;


  const formattedMinutes =
    String(minutes).padStart(2, "0");

  const formattedSeconds =
    String(remainingSeconds).padStart(2, "0");


  forgotLockTime.textContent =
    `${formattedMinutes}:${formattedSeconds}`;

}


// =====================================================
// رابط صفحة كلمة المرور الجديدة
// =====================================================

function getResetPasswordUrl() {

  return (
    window.location.origin +
    window.location.pathname
      .replace(
        "forgot-password.html",
        "reset-password.html"
      )
  );

}


// =====================================================
// التحقق من صحة البريد
// =====================================================

function isValidEmail(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );

}


// =====================================================
// Loading للزر
// =====================================================

function setButtonLoading(
  button,
  text
) {

  if (!button) {
    return;
  }


  button.disabled = true;


  button.innerHTML = `
    <span class="forgot-loading">
      <span class="forgot-spinner"></span>
      ${text}
    </span>
  `;

}


// =====================================================
// عرض رسالة
// =====================================================

function showMessage(
  element,
  message,
  type
) {

  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.className =
    "forgot-message show " + type;

}


// =====================================================
// مسح الرسالة
// =====================================================

function clearMessage(element) {

  if (!element) {
    return;
  }


  element.textContent = "";

  element.className =
    "forgot-message";

}


// =====================================================
// رسائل إرسال الرمز
// =====================================================

function getResetErrorMessage(error) {

  const message =
    (error?.message || "").toLowerCase();


  if (
    message.includes("rate limit") ||
    message.includes("too many") ||
    message.includes("over_email_send_rate_limit")
  ) {

    return "تم إرسال عدة طلبات مؤخراً. حاول مرة أخرى بعد قليل.";

  }


  if (
    message.includes("invalid email")
  ) {

    return "البريد الإلكتروني غير صالح.";

  }


  if (
    message.includes("email not confirmed")
  ) {

    return "يجب تأكيد البريد الإلكتروني أولاً.";

  }


  return "تعذر إرسال رمز التحقق. تأكد من البريد الإلكتروني وحاول مرة أخرى.";

}


// =====================================================
// رسائل التحقق
// =====================================================

function getVerifyErrorMessage(
  error,
  remainingAttempts
) {

  const message =
    (error?.message || "").toLowerCase();


  if (
    message.includes("expired") ||
    message.includes("invalid")
  ) {

    return `رمز التحقق غير صحيح أو منتهي الصلاحية. لديك ${remainingAttempts} محاولات متبقية.`;

  }


  if (
    message.includes("rate limit") ||
    message.includes("too many")
  ) {

    return "تم تجاوز عدد المحاولات المسموح بها. حاول مرة أخرى بعد قليل.";

  }


  return `رمز التحقق غير صحيح. لديك ${remainingAttempts} محاولات متبقية.`;

}