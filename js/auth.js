// =====================================================
// Zain Sales - Authentication
// تسجيل الدخول / تسجيل الخروج / صلاحيات الأدمن
// =====================================================


// =====================================================
// إعدادات عامة
// =====================================================

const ADMIN_PAGE = "admin.html";
const DASHBOARD_PAGE = "dashboard.html";
const SUBSCRIPTION_PAGE = "subscription.html";
const LOGIN_PAGE = "index.html";


// =====================================================
// تسجيل الدخول
// =====================================================

async function login(email, password) {

  email = String(email || "").trim().toLowerCase();

  password = String(password || "");


  // ---------------------------------------------------
  // التحقق الأساسي
  // ---------------------------------------------------

  if (!email) {
    throw new Error("يرجى إدخال البريد الإلكتروني.");
  }


  if (!password) {
    throw new Error("يرجى إدخال كلمة المرور.");
  }


  // ---------------------------------------------------
  // تسجيل الدخول عبر Supabase
  // ---------------------------------------------------

  const {
    data,
    error
  } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });


  // ---------------------------------------------------
  // فشل تسجيل الدخول
  // ---------------------------------------------------

  if (error) {

    console.error(
      "Supabase login error:",
      error
    );


    throw new Error(
      getLoginErrorMessage(error)
    );

  }


  const user = data?.user;


  if (!user) {

    throw new Error(
      "تعذر الحصول على بيانات الحساب. حاول مرة أخرى."
    );

  }


  // ---------------------------------------------------
  // التأكد من البريد الإلكتروني
  // ---------------------------------------------------

  if (!user.email_confirmed_at) {

    /*
     * إذا كان نظامك يعتمد تأكيد البريد الإلكتروني،
     * لا نسمح بالدخول قبل التأكيد.
     */

    await supabaseClient.auth.signOut();

    throw new Error(
      "يجب تأكيد بريدك الإلكتروني أولاً قبل تسجيل الدخول."
    );

  }


  // ---------------------------------------------------
  // توجيه المستخدم
  // ---------------------------------------------------

  await redirectAuthenticatedUser(user);

}


// =====================================================
// معرفة هل المستخدم Admin
// =====================================================
//
// مهم:
// لا نعتمد على الإيميل داخل JavaScript كوسيلة حماية.
//
// يتم الاعتماد على RPC:
// is_admin
//
// ويجب أن تكون هذه الدالة محمية من Supabase
// وتتحقق من user_id الحالي من auth.uid().
// =====================================================

async function isCurrentUserAdmin() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "is_admin"
      );


    if (error) {

      console.error(
        "Admin check error:",
        error
      );

      return false;

    }


    return data === true;

  } catch (error) {

    console.error(
      "Admin check exception:",
      error
    );

    return false;

  }

}


// =====================================================
// توجيه المستخدم بعد تسجيل الدخول
// =====================================================

async function redirectAuthenticatedUser(
  user = null
) {

  // ---------------------------------------------------
  // الحصول على المستخدم الحالي إذا لم يتم تمريره
  // ---------------------------------------------------

  if (!user) {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getUser();


    if (error || !data?.user) {

      window.location.replace(
        LOGIN_PAGE
      );

      return;

    }


    user = data.user;

  }


  // ---------------------------------------------------
  // التأكد من البريد
  // ---------------------------------------------------

  if (!user.email_confirmed_at) {

    await supabaseClient.auth.signOut();

    window.location.replace(
      LOGIN_PAGE
    );

    return;

  }


  // ---------------------------------------------------
  // أول فحص: هل الحساب Admin؟
  // ---------------------------------------------------

  const admin =
    await isCurrentUserAdmin();


  if (admin) {

    window.location.replace(
      ADMIN_PAGE
    );

    return;

  }


  // ---------------------------------------------------
  // الحساب مندوب عادي
  // ---------------------------------------------------

  const hasSubscription =
    await hasActiveSubscription();


  // ---------------------------------------------------
  // لديه اشتراك فعال
  // ---------------------------------------------------

  if (hasSubscription) {

    window.location.replace(
      DASHBOARD_PAGE
    );

    return;

  }


  // ---------------------------------------------------
  // لا يوجد اشتراك فعال
  // ---------------------------------------------------

  window.location.replace(
    SUBSCRIPTION_PAGE
  );

}


// =====================================================
// التحقق من وجود مستخدم مسجل
// =====================================================

async function requireAuth() {

  const {
    data,
    error
  } =
    await supabaseClient.auth.getUser();


  if (
    error ||
    !data?.user
  ) {

    window.location.replace(
      LOGIN_PAGE
    );

    return null;

  }


  return data.user;

}


// =====================================================
// التحقق من الاشتراك الفعال
// =====================================================

async function hasActiveSubscription() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "has_active_subscription"
      );


    if (error) {

      console.error(
        "Subscription check error:",
        error
      );

      return false;

    }


    return data === true;

  } catch (error) {

    console.error(
      "Subscription check exception:",
      error
    );

    return false;

  }

}


// =====================================================
// حماية الصفحات التي تحتاج اشتراك
// =====================================================

async function requireSubscription() {

  const user =
    await requireAuth();


  if (!user) {
    return null;
  }


  // ---------------------------------------------------
  // إذا كان Admin
  // ---------------------------------------------------
  //
  // الأدمن لا يحتاج اشتراك للوصول إلى صفحات
  // الإدارة.
  //
  // لكن إذا دخل صفحة من صفحات البرنامج بالخطأ،
  // نسمح له بالاستمرار فقط إذا كان هذا هو المطلوب
  // من تصميم النظام.
  //
  // حالياً نخليه يتعامل كحساب إداري.
  // ---------------------------------------------------

  const admin =
    await isCurrentUserAdmin();


  if (admin) {

    return user;

  }


  // ---------------------------------------------------
  // حساب مندوب
  // ---------------------------------------------------

  const hasSubscription =
    await hasActiveSubscription();


  if (!hasSubscription) {

    window.location.replace(
      SUBSCRIPTION_PAGE
    );

    return null;

  }


  return user;

}


// =====================================================
// حماية لوحة الإدارة
// =====================================================

async function requireAdmin() {

  const user =
    await requireAuth();


  if (!user) {
    return null;
  }


  const admin =
    await isCurrentUserAdmin();


  if (!admin) {

    /*
     * أي مندوب يحاول فتح:
     *
     * admin.html
     *
     * مباشرة لن يحصل على صلاحية.
     */

    window.location.replace(
      DASHBOARD_PAGE
    );

    return null;

  }


  return user;

}


// =====================================================
// تسجيل الخروج
// =====================================================

async function logout() {

  try {

    const {
      error
    } =
      await supabaseClient.auth.signOut();


    if (error) {

      console.error(
        "Logout error:",
        error
      );


      alert(
        "تعذر تسجيل الخروج، حاول مرة أخرى."
      );

      return;

    }


    // -------------------------------------------------
    // العودة إلى تسجيل الدخول
    // -------------------------------------------------

    window.location.replace(
      LOGIN_PAGE
    );

  } catch (error) {

    console.error(
      "Logout exception:",
      error
    );


    alert(
      "حدث خطأ أثناء تسجيل الخروج."
    );

  }

}


// =====================================================
// رسائل أخطاء تسجيل الدخول
// =====================================================

function getLoginErrorMessage(error) {

  if (!error) {

    return (
      "تعذر تسجيل الدخول. تأكد من بيانات الحساب."
    );

  }


  const message =
    String(
      error.message || ""
    ).toLowerCase();


  // ---------------------------------------------------
  // البريد أو كلمة المرور
  // ---------------------------------------------------

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {

    return (
      "البريد الإلكتروني أو كلمة المرور غير صحيحة."
    );

  }


  // ---------------------------------------------------
  // البريد غير مؤكد
  // ---------------------------------------------------

  if (
    message.includes("email not confirmed") ||
    message.includes("email_not_confirmed")
  ) {

    return (
      "يجب تأكيد بريدك الإلكتروني أولاً."
    );

  }


  // ---------------------------------------------------
  // عدد محاولات كبير
  // ---------------------------------------------------

  if (
    message.includes("too many requests") ||
    message.includes("rate limit")
  ) {

    return (
      "تم تجاوز عدد محاولات تسجيل الدخول. حاول مرة أخرى بعد قليل."
    );

  }


  // ---------------------------------------------------
  // مشكلة في الشبكة
  // ---------------------------------------------------

  if (
    message.includes("network") ||
    message.includes("fetch")
  ) {

    return (
      "تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مرة أخرى."
    );

  }


  // ---------------------------------------------------
  // الرسالة الافتراضية
  // ---------------------------------------------------

  return (
    "تعذر تسجيل الدخول. تأكد من بيانات الحساب وحاول مرة أخرى."
  );

}


// =====================================================
// مراقبة حالة الجلسة
// =====================================================
//
// هذه الدالة اختيارية ومفيدة للصفحات التي تريد
// مراقبة تسجيل الخروج أو انتهاء الجلسة.
// =====================================================

function watchAuthState() {

  if (
    !supabaseClient ||
    !supabaseClient.auth
  ) {

    return;

  }


  supabaseClient.auth.onAuthStateChange(
    (event, session) => {

      console.log(
        "Auth state:",
        event
      );


      // -------------------------------------------------
      // تم تسجيل الخروج
      // -------------------------------------------------

      if (
        event === "SIGNED_OUT" &&
        window.location.pathname.indexOf("index.html") === -1
      ) {

        window.location.replace(
          LOGIN_PAGE
        );

      }

    }
  );

}


// =====================================================
// تصدير / تهيئة مراقبة الجلسة
// =====================================================

try {

  watchAuthState();

} catch (error) {

  console.error(
    "Auth state initialization error:",
    error
  );

}