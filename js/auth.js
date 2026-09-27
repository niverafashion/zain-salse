async function login(email, password) {
  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    throw new Error("تعذر تسجيل الدخول. تأكد من بيانات الحساب.");
  }

  window.location.replace("dashboard.html");
}

async function logout() {
  const { error } =
    await supabaseClient.auth.signOut();

  if (error) {
    alert("تعذر تسجيل الخروج، حاول مرة أخرى.");
    return;
  }

  window.location.replace("index.html");
}

async function requireAuth() {
  const { data, error } =
    await supabaseClient.auth.getUser();

  if (error || !data.user) {
    window.location.replace("index.html");
    return null;
  }

  return data.user;
}