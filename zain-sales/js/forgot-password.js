// =====================================================
// Zain Sales - Forgot Password
// استعادة كلمة المرور
// =====================================================

const forgotPasswordForm =
  document.getElementById("forgotPasswordForm");

const emailInput =
  document.getElementById("email");

const sendResetBtn =
  document.getElementById("sendResetBtn");

const messageBox =
  document.getElementById("message");


// =====================================================
// رابط صفحة إعادة تعيين كلمة المرور
// =====================================================

const RESET_PASSWORD_URL =
  "https://niverafashion.github.io/zain-salse/zain-sales/reset-password.html";


// =====================================================
// عرض الرسالة
// =====================================================

function showMessage(message, type) {

  messageBox.textContent = message;

  messageBox.className =
    "forgot-message " + type;

}


// =====================================================
// إرسال طلب إعادة تعيين كلمة المرور
// =====================================================

forgotPasswordForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    showMessage("", "");

    const email =
      emailInput.value.trim();

    if (!email) {

      showMessage(
        "يرجى إدخال البريد الإلكتروني.",
        "error"
      );

      return;
    }


    sendResetBtn.disabled = true;

    sendResetBtn.textContent =
      "جاري الإرسال...";


    try {

      const { error } =
        await supabaseClient.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: RESET_PASSWORD_URL
          }
        );


      if (error) {
        throw error;
      }


      showMessage(
        "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. تحقق من البريد الوارد أو مجلد الرسائل غير المرغوب فيها.",
        "success"
      );


      sendResetBtn.textContent =
        "تم إرسال الرابط";


    } catch (error) {

      console.error(
        "Reset password error:",
        error
      );


      showMessage(
        getResetErrorMessage(error),
        "error"
      );


      sendResetBtn.disabled = false;

      sendResetBtn.textContent =
        "إرسال رابط الاستعادة";

    }

  }
);


// =====================================================
// رسائل الأخطاء
// =====================================================

function getResetErrorMessage(error) {

  const message =
    (error?.message || "").toLowerCase();


  if (
    message.includes("rate limit") ||
    message.includes("too many")
  ) {

    return "تم إرسال عدة طلبات مؤخراً. حاول مرة أخرى بعد قليل.";

  }


  if (
    message.includes("invalid email")
  ) {

    return "البريد الإلكتروني غير صالح.";

  }


  return "تعذر إرسال رابط استعادة كلمة المرور. تأكد من البريد الإلكتروني وحاول مرة أخرى.";

}