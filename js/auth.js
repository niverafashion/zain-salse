async function login(email, password) {
  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    throw new Error("تعذر تسجيل الدخول. تأكد من بيانات الحساب.");
  }

  // بعد نجاح تسجيل الدخول نفحص الاشتراك
  const hasSubscription = await hasActiveSubscription();

  if (hasSubscription) {
    window.location.replace("dashboard.html");
  } else {
    window.location.replace("subscription.html");
  }
}


// =====================================================
// تسجيل الخروج
// =====================================================

async function logout() {
  const { error } =
    await supabaseClient.auth.signOut();

  if (error) {
    alert("تعذر تسجيل الخروج، حاول مرة أخرى.");
    return;
  }

  window.location.replace("index.html");
}


// =====================================================
// التحقق من تسجيل الدخول
// =====================================================

async function requireAuth() {
  const { data, error } =
    await supabaseClient.auth.getUser();

  if (error || !data.user) {
    window.location.replace("index.html");
    return null;
  }

  return data.user;
}


// =====================================================
// التحقق من وجود اشتراك فعال
// =====================================================

async function hasActiveSubscription() {
  const { data, error } =
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
}


// =====================================================
// حماية الصفحات التي تحتاج اشتراك
// =====================================================

async function requireSubscription() {
  const user = await requireAuth();

  if (!user) {
    return null;
  }

  const hasSubscription =
    await hasActiveSubscription();

  if (!hasSubscription) {
    window.location.replace("subscription.html");
    return null;
  }

  return user;
}