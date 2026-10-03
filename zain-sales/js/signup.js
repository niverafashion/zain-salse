// =====================================================
// Zain Sales - Signup
// إنشاء حساب مندوب جديد
// =====================================================


// =====================================================
// متغيرات عامة
// =====================================================

let selectedAvatarFile = null;

let cameraStream = null;

let isCapturingPhoto = false;


// =====================================================
// عند تحميل الصفحة
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

  const signupForm =
    document.getElementById("signupForm");

  if (!signupForm) {
    return;
  }


  // ---------------------------------------------------
  // نموذج إنشاء الحساب
  // ---------------------------------------------------

  signupForm.addEventListener(
    "submit",
    handleSignup
  );


  // ---------------------------------------------------
  // إعداد الصورة
  // ---------------------------------------------------

  setupAvatar();


  // ---------------------------------------------------
  // إعداد كلمة المرور
  // ---------------------------------------------------

  setupPassword();


  // ---------------------------------------------------
  // إعداد تأكيد كلمة المرور
  // ---------------------------------------------------

  setupConfirmPassword();


  // ---------------------------------------------------
  // إعداد الشروط والخصوصية
  // ---------------------------------------------------

  setupTermsAndPrivacy();

});


// =====================================================
// إعداد الصورة الشخصية
// =====================================================

function setupAvatar() {

  const galleryBtn =
    document.getElementById("galleryBtn");

  const cameraBtn =
    document.getElementById("cameraBtn");

  const removeAvatarBtn =
    document.getElementById("removeAvatarBtn");

  const galleryInput =
    document.getElementById("galleryInput");


  // ---------------------------------------------------
  // فتح الاستديو
  // ---------------------------------------------------

  if (galleryBtn && galleryInput) {

    galleryBtn.addEventListener(
      "click",
      () => {

        galleryInput.click();

      }
    );

  }


  // ---------------------------------------------------
  // فتح الكاميرا
  // ---------------------------------------------------

  if (cameraBtn) {

    cameraBtn.addEventListener(
      "click",
      () => {

        openCamera();

      }
    );

  }


  // ---------------------------------------------------
  // اختيار صورة من الاستديو
  // ---------------------------------------------------

  if (galleryInput) {

    galleryInput.addEventListener(
      "change",
      handleAvatarSelection
    );

  }


  // ---------------------------------------------------
  // حذف الصورة
  // ---------------------------------------------------

  if (removeAvatarBtn) {

    removeAvatarBtn.addEventListener(
      "click",
      removeAvatar
    );

  }


  // ---------------------------------------------------
  // تجهيز أزرار الكاميرا
  // ---------------------------------------------------

  setupCameraEvents();

}


// =====================================================
// تجهيز أحداث الكاميرا
// =====================================================

function setupCameraEvents() {

  const modal =
    document.getElementById("cameraModal");

  const closeButton =
    document.getElementById("closeCameraBtn");

  const captureButton =
    document.getElementById("captureCameraBtn");


  // ---------------------------------------------------
  // إذا النافذة غير موجودة
  // ---------------------------------------------------

  if (!modal) {
    return;
  }


  // ---------------------------------------------------
  // منع تكرار الأحداث
  // ---------------------------------------------------

  if (
    modal.dataset.cameraEventsBound === "true"
  ) {

    return;

  }


  modal.dataset.cameraEventsBound = "true";


  // ---------------------------------------------------
  // زر إغلاق الكاميرا
  // ---------------------------------------------------

  if (closeButton) {

    closeButton.addEventListener(
      "click",
      function (event) {

        event.preventDefault();
        event.stopPropagation();

        closeCamera();

      }
    );

  }


  // ---------------------------------------------------
  // زر التقاط الصورة
  // ---------------------------------------------------

  if (captureButton) {

    captureButton.addEventListener(
      "click",
      function (event) {

        event.preventDefault();
        event.stopPropagation();

        captureCameraPhoto();

      }
    );

  }


  // ---------------------------------------------------
  // الضغط على الخلفية لإغلاق الكاميرا
  // ---------------------------------------------------

  modal.addEventListener(
    "click",
    function (event) {

      if (
        event.target === modal
      ) {

        closeCamera();

      }

    }
  );

}


// =====================================================
// فتح الكاميرا
// =====================================================

async function openCamera() {

  // ---------------------------------------------------
  // التأكد من دعم الكاميرا
  // ---------------------------------------------------

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {

    showMessage(
      "الكاميرا غير مدعومة في هذا المتصفح.",
      "error"
    );

    return;

  }


  // ---------------------------------------------------
  // إنشاء / العثور على Modal
  // ---------------------------------------------------

  const modal =
    createCameraModal();


  if (!modal) {

    showMessage(
      "تعذر فتح نافذة الكاميرا.",
      "error"
    );

    return;

  }


  // ---------------------------------------------------
  // التأكد من ربط الأحداث
  // ---------------------------------------------------

  setupCameraEvents();


  // ---------------------------------------------------
  // إذا الكاميرا مفتوحة مسبقًا
  // ---------------------------------------------------

  if (cameraStream) {

    modal.classList.add("show");

    return;

  }


  const cameraVideo =
    document.getElementById("cameraVideo");


  if (!cameraVideo) {

    showMessage(
      "تعذر العثور على نافذة الكاميرا.",
      "error"
    );

    return;

  }


  const captureButton =
    document.getElementById(
      "captureCameraBtn"
    );


  // ---------------------------------------------------
  // تعطيل الالتقاط أثناء تشغيل الكاميرا
  // ---------------------------------------------------

  if (captureButton) {

    captureButton.disabled = true;

    captureButton.style.opacity = "0.6";

  }


  try {

    // -------------------------------------------------
    // تشغيل الكاميرا الأمامية
    // -------------------------------------------------

    cameraStream =
      await navigator.mediaDevices.getUserMedia({

        video: {

          facingMode: {
            ideal: "user"
          },

          width: {
            ideal: 720
          },

          height: {
            ideal: 720
          }

        },

        audio: false

      });


    // -------------------------------------------------
    // ربط الكاميرا بالفيديو
    // -------------------------------------------------

    cameraVideo.srcObject =
      cameraStream;

    cameraVideo.muted = true;

    cameraVideo.autoplay = true;

    cameraVideo.playsInline = true;


    cameraVideo.setAttribute(
      "playsinline",
      ""
    );

    cameraVideo.setAttribute(
      "autoplay",
      ""
    );


    // -------------------------------------------------
    // إظهار النافذة
    // -------------------------------------------------

    modal.classList.add("show");


    // -------------------------------------------------
    // انتظار جاهزية الفيديو
    // -------------------------------------------------

    await new Promise(
      (resolve) => {

        if (
          cameraVideo.readyState >= 2 &&
          cameraVideo.videoWidth > 0
        ) {

          resolve();

          return;

        }


        cameraVideo.addEventListener(
          "loadedmetadata",
          resolve,
          {
            once: true
          }
        );

      }
    );


    // -------------------------------------------------
    // تشغيل الفيديو
    // -------------------------------------------------

    try {

      await cameraVideo.play();

    } catch (playError) {

      console.warn(
        "Video play warning:",
        playError
      );

    }


    // -------------------------------------------------
    // تفعيل زر الالتقاط
    // -------------------------------------------------

    if (captureButton) {

      captureButton.disabled = false;

      captureButton.style.opacity = "1";

    }

  } catch (error) {

    console.error(
      "Camera error:",
      error
    );


    closeCamera();


    // -------------------------------------------------
    // رفض صلاحية الكاميرا
    // -------------------------------------------------

    if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ) {

      showMessage(
        "لم يتم السماح باستخدام الكاميرا. افتح إعدادات المتصفح واسمح للموقع باستخدام الكاميرا.",
        "error"
      );

      return;

    }


    // -------------------------------------------------
    // لا توجد كاميرا
    // -------------------------------------------------

    if (
      error.name === "NotFoundError" ||
      error.name === "DevicesNotFoundError"
    ) {

      showMessage(
        "لم يتم العثور على كاميرا في هذا الجهاز.",
        "error"
      );

      return;

    }


    // -------------------------------------------------
    // الكاميرا مستخدمة
    // -------------------------------------------------

    if (
      error.name === "NotReadableError"
    ) {

      showMessage(
        "تعذر الوصول إلى الكاميرا. تأكد أن الكاميرا ليست مستخدمة من تطبيق آخر.",
        "error"
      );

      return;

    }


    // -------------------------------------------------
    // مشكلة HTTPS
    // -------------------------------------------------

    if (
      error.name === "SecurityError"
    ) {

      showMessage(
        "تعذر تشغيل الكاميرا بسبب إعدادات الأمان. تأكد أن الموقع يعمل عبر HTTPS.",
        "error"
      );

      return;

    }


    showMessage(
      "تعذر تشغيل الكاميرا. حاول مرة أخرى.",
      "error"
    );

  }

}


// =====================================================
// إنشاء / العثور على نافذة الكاميرا
// =====================================================

function createCameraModal() {

  // ---------------------------------------------------
  // البحث عن Modal الموجود بالـHTML
  // ---------------------------------------------------

  let modal =
    document.getElementById(
      "cameraModal"
    );


  // ---------------------------------------------------
  // إذا موجود، نستخدمه
  // ---------------------------------------------------

  if (modal) {

    setupCameraEvents();

    return modal;

  }


  // ---------------------------------------------------
  // إنشاء Modal إذا غير موجود
  // ---------------------------------------------------

  modal =
    document.createElement("div");


  modal.id =
    "cameraModal";

  modal.className =
    "camera-modal";

  modal.setAttribute(
    "role",
    "dialog"
  );

  modal.setAttribute(
    "aria-modal",
    "true"
  );

  modal.setAttribute(
    "aria-labelledby",
    "cameraModalTitle"
  );


  modal.innerHTML = `

    <div class="camera-modal-content">

      <div class="camera-modal-header">

        <h3 id="cameraModalTitle">
          التقاط صورة
        </h3>

        <button
          type="button"
          id="closeCameraBtn"
          class="camera-close-btn"
          aria-label="إغلاق الكاميرا"
        >
          ×
        </button>

      </div>


      <div class="camera-preview-wrapper">

        <video
          id="cameraVideo"
          class="camera-video"
          autoplay
          playsinline
          muted
        ></video>

      </div>


      <div class="camera-modal-actions">

        <button
          type="button"
          id="captureCameraBtn"
          class="capture-camera-btn"
          disabled
        >

          <span class="capture-camera-icon">
            📷
          </span>

          <span>
            التقاط الصورة
          </span>

        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  // ---------------------------------------------------
  // ربط الأحداث بعد الإنشاء
  // ---------------------------------------------------

  setupCameraEvents();


  return modal;

}


// =====================================================
// التقاط الصورة من الكاميرا
// =====================================================

async function captureCameraPhoto() {

  if (isCapturingPhoto) {
    return;
  }


  const video =
    document.getElementById(
      "cameraVideo"
    );


  const captureButton =
    document.getElementById(
      "captureCameraBtn"
    );


  if (!video) {

    showMessage(
      "تعذر الوصول إلى الكاميرا.",
      "error"
    );

    return;

  }


  if (
    !cameraStream ||
    video.readyState < 2 ||
    !video.videoWidth ||
    !video.videoHeight
  ) {

    showMessage(
      "انتظر لحظة حتى تصبح الكاميرا جاهزة.",
      "error"
    );

    return;

  }


  isCapturingPhoto = true;


  if (captureButton) {

    captureButton.disabled = true;

    captureButton.dataset.originalText =
      captureButton.innerHTML;

    captureButton.innerHTML = `

      <span class="capture-camera-icon">
        ✓
      </span>

      <span>
        جاري الالتقاط...
      </span>

    `;

  }


  try {

    // -------------------------------------------------
    // إنشاء Canvas مربع
    // -------------------------------------------------

    const canvas =
      document.createElement("canvas");


    const size =
      Math.min(
        video.videoWidth,
        video.videoHeight
      );


    canvas.width = size;
    canvas.height = size;


    const context =
      canvas.getContext("2d", {
        alpha: false
      });


    if (!context) {

      throw new Error(
        "تعذر إنشاء الصورة."
      );

    }


    context.imageSmoothingEnabled = true;

    context.imageSmoothingQuality = "high";


    // -------------------------------------------------
    // حساب القص من المنتصف
    // -------------------------------------------------

    const sourceX =
      (
        video.videoWidth - size
      ) / 2;


    const sourceY =
      (
        video.videoHeight - size
      ) / 2;


    // -------------------------------------------------
    // رسم الصورة
    // -------------------------------------------------

    context.drawImage(

      video,

      sourceX,
      sourceY,

      size,
      size,

      0,
      0,
      size,
      size

    );


    // -------------------------------------------------
    // تحويل الصورة إلى JPG
    // -------------------------------------------------

    const blob =
      await new Promise(
        (resolve, reject) => {

          canvas.toBlob(

            (result) => {

              if (result) {

                resolve(result);

              } else {

                reject(
                  new Error(
                    "تعذر إنشاء ملف الصورة."
                  )
                );

              }

            },

            "image/jpeg",

            0.92

          );

        }
      );


    // -------------------------------------------------
    // إنشاء File
    // -------------------------------------------------

    const file =
      new File(

        [blob],

        `avatar-${Date.now()}.jpg`,

        {
          type: "image/jpeg",
          lastModified: Date.now()
        }

      );


    // -------------------------------------------------
    // التحقق من الحجم
    // -------------------------------------------------

    if (
      file.size > 5 * 1024 * 1024
    ) {

      throw new Error(
        "حجم الصورة كبير جدًا. الحد الأقصى 5 ميجابايت."
      );

    }


    // -------------------------------------------------
    // حفظ الصورة
    // -------------------------------------------------

    selectedAvatarFile =
      file;


    // -------------------------------------------------
    // عرض الصورة
    // -------------------------------------------------

    previewAvatar(file);


    // -------------------------------------------------
    // إغلاق الكاميرا
    // -------------------------------------------------

    closeCamera();


    showMessage(
      "تم التقاط الصورة بنجاح.",
      "success"
    );

  } catch (error) {

    console.error(
      "Capture photo error:",
      error
    );


    if (captureButton) {

      captureButton.disabled = false;

      captureButton.innerHTML =
        captureButton.dataset.originalText ||
        `
          <span class="capture-camera-icon">
            📷
          </span>

          <span>
            التقاط الصورة
          </span>
        `;

    }


    showMessage(
      error.message ||
      "تعذر التقاط الصورة. حاول مرة أخرى.",
      "error"
    );

  } finally {

    isCapturingPhoto = false;

  }

}


// =====================================================
// إغلاق الكاميرا
// =====================================================

function closeCamera() {

  // ---------------------------------------------------
  // إيقاف Stream
  // ---------------------------------------------------

  if (cameraStream) {

    cameraStream
      .getTracks()
      .forEach(
        (track) => {

          try {

            track.stop();

          } catch (error) {

            console.warn(
              "Track stop error:",
              error
            );

          }

        }
      );


    cameraStream = null;

  }


  // ---------------------------------------------------
  // إيقاف الفيديو
  // ---------------------------------------------------

  const video =
    document.getElementById(
      "cameraVideo"
    );


  if (video) {

    try {

      video.pause();

    } catch (error) {

      console.warn(
        "Video pause error:",
        error
      );

    }

    video.srcObject = null;

  }


  // ---------------------------------------------------
  // إعادة زر الالتقاط
  // ---------------------------------------------------

  const captureButton =
    document.getElementById(
      "captureCameraBtn"
    );


  if (captureButton) {

    captureButton.disabled = false;

    captureButton.style.opacity = "1";

    captureButton.innerHTML = `

      <span class="capture-camera-icon">
        📷
      </span>

      <span>
        التقاط الصورة
      </span>

    `;

  }


  isCapturingPhoto = false;


  // ---------------------------------------------------
  // إخفاء Modal
  // ---------------------------------------------------

  const modal =
    document.getElementById(
      "cameraModal"
    );


  if (modal) {

    modal.classList.remove("show");

  }

}


// =====================================================
// اختيار الصورة من الاستديو
// =====================================================

function handleAvatarSelection(
  event
) {

  const file =
    event.target.files?.[0];


  if (!file) {

    return;

  }


  // ---------------------------------------------------
  // أنواع الصور المسموحة
  // ---------------------------------------------------

  const allowedTypes = [

    "image/jpeg",

    "image/png",

    "image/webp"

  ];


  if (
    !allowedTypes.includes(
      file.type
    )
  ) {

    showMessage(
      "صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WEBP.",
      "error"
    );


    event.target.value =
      "";


    return;

  }


  // ---------------------------------------------------
  // الحد الأقصى للحجم
  // ---------------------------------------------------

  const maxSize =
    5 * 1024 * 1024;


  if (
    file.size > maxSize
  ) {

    showMessage(
      "حجم الصورة كبير جدًا. الحد الأقصى 5 ميجابايت.",
      "error"
    );


    event.target.value =
      "";


    return;

  }


  // ---------------------------------------------------
  // حفظ الصورة
  // ---------------------------------------------------

  selectedAvatarFile =
    file;


  // ---------------------------------------------------
  // عرض المعاينة
  // ---------------------------------------------------

  previewAvatar(
    file
  );


  showMessage(
    "تم اختيار الصورة بنجاح.",
    "success"
  );

}


// =====================================================
// معاينة الصورة
// =====================================================

function previewAvatar(
  file
) {

  const avatarPreview =
    document.getElementById(
      "avatarPreview"
    );


  const avatarImage =
    document.getElementById(
      "avatarImage"
    );


  const avatarPlaceholder =
    document.getElementById(
      "avatarPlaceholder"
    );


  const removeAvatarBtn =
    document.getElementById(
      "removeAvatarBtn"
    );


  if (
    !avatarPreview ||
    !avatarImage
  ) {

    return;

  }


  // ---------------------------------------------------
  // قراءة الصورة
  // ---------------------------------------------------

  const reader =
    new FileReader();


  reader.onload =
    function () {

      // -----------------------------------------------
      // وضع الصورة
      // -----------------------------------------------

      avatarImage.src =
        reader.result;


      avatarImage.hidden =
        false;


      // -----------------------------------------------
      // إخفاء Placeholder
      // -----------------------------------------------

      if (
        avatarPlaceholder
      ) {

        avatarPlaceholder.hidden =
          true;

      }


      // -----------------------------------------------
      // إظهار زر الحذف
      // -----------------------------------------------

      if (
        removeAvatarBtn
      ) {

        removeAvatarBtn.hidden =
          false;

      }


      // -----------------------------------------------
      // إضافة Class
      // -----------------------------------------------

      avatarPreview.classList.add(
        "has-image"
      );

    };


  reader.onerror =
    function () {

      showMessage(
        "تعذر قراءة الصورة. حاول اختيار صورة أخرى.",
        "error"
      );

    };


  reader.readAsDataURL(
    file
  );

}


// =====================================================
// حذف الصورة
// =====================================================

function removeAvatar() {

  // ---------------------------------------------------
  // حذف الملف من الذاكرة
  // ---------------------------------------------------

  selectedAvatarFile =
    null;


  // ---------------------------------------------------
  // عناصر الصورة
  // ---------------------------------------------------

  const avatarImage =
    document.getElementById(
      "avatarImage"
    );


  const avatarPlaceholder =
    document.getElementById(
      "avatarPlaceholder"
    );


  const removeAvatarBtn =
    document.getElementById(
      "removeAvatarBtn"
    );


  const galleryInput =
    document.getElementById(
      "galleryInput"
    );


  const cameraInput =
    document.getElementById(
      "cameraInput"
    );


  const avatarPreview =
    document.getElementById(
      "avatarPreview"
    );


  // ---------------------------------------------------
  // إخفاء الصورة
  // ---------------------------------------------------

  if (avatarImage) {

    avatarImage.src =
      "";

    avatarImage.hidden =
      true;

  }


  // ---------------------------------------------------
  // إظهار Placeholder
  // ---------------------------------------------------

  if (
    avatarPlaceholder
  ) {

    avatarPlaceholder.hidden =
      false;

  }


  // ---------------------------------------------------
  // إخفاء زر الحذف
  // ---------------------------------------------------

  if (
    removeAvatarBtn
  ) {

    removeAvatarBtn.hidden =
      true;

  }


  // ---------------------------------------------------
  // إعادة حقول الملفات
  // ---------------------------------------------------

  if (
    galleryInput
  ) {

    galleryInput.value =
      "";

  }


  if (
    cameraInput
  ) {

    cameraInput.value =
      "";

  }


  // ---------------------------------------------------
  // إزالة Class
  // ---------------------------------------------------

  if (
    avatarPreview
  ) {

    avatarPreview.classList.remove(
      "has-image"
    );

  }

}


// =====================================================
// إعداد كلمة المرور
// =====================================================

function setupPassword() {

  const passwordInput =
    document.getElementById(
      "password"
    );


  const togglePassword =
    document.getElementById(
      "togglePassword"
    );


  if (!passwordInput) {

    return;

  }


  // ---------------------------------------------------
  // مراقبة كلمة المرور
  // ---------------------------------------------------

  passwordInput.addEventListener(
    "input",
    updatePasswordStrength
  );


  // ---------------------------------------------------
  // إظهار / إخفاء كلمة المرور
  // ---------------------------------------------------

  if (
    togglePassword
  ) {

    togglePassword.addEventListener(
      "click",
      () => {

        togglePasswordVisibility(
          passwordInput,
          togglePassword
        );

      }
    );

  }

}


// =====================================================
// إظهار / إخفاء كلمة المرور
// =====================================================

function togglePasswordVisibility(
  input,
  button
) {

  if (!input) {

    return;

  }


  const isPassword =
    input.type === "password";


  input.type =
    isPassword
      ? "text"
      : "password";


  if (button) {

    button.textContent =
      isPassword
        ? "🙈"
        : "👁";


    button.setAttribute(
      "aria-label",
      isPassword
        ? "إخفاء كلمة المرور"
        : "إظهار كلمة المرور"
    );

  }

}


// =====================================================
// قوة كلمة المرور
// =====================================================

function updatePasswordStrength() {

  const passwordInput =
    document.getElementById(
      "password"
    );


  const strengthBar =
    document.getElementById(
      "strengthBar"
    );


  const strengthLabel =
    document.getElementById(
      "strengthLabel"
    );


  const ruleLength =
    document.getElementById(
      "ruleLength"
    );


  const ruleNumber =
    document.getElementById(
      "ruleNumber"
    );


  const ruleUpper =
    document.getElementById(
      "ruleUpper"
    );


  const ruleSpecial =
    document.getElementById(
      "ruleSpecial"
    );


  if (!passwordInput) {

    return;

  }


  const password =
    passwordInput.value;


  // ---------------------------------------------------
  // القواعد
  // ---------------------------------------------------

  const hasLength =
    password.length >= 6;


  const hasNumber =
    /[0-9]/.test(
      password
    );


  const hasUppercase =
    /[A-Z]/.test(
      password
    );


  const hasSpecial =
    /[^A-Za-z0-9]/.test(
      password
    );


  // ---------------------------------------------------
  // تحديث القواعد
  // ---------------------------------------------------

  updateRule(
    ruleLength,
    hasLength
  );


  updateRule(
    ruleNumber,
    hasNumber
  );


  updateRule(
    ruleUpper,
    hasUppercase
  );


  updateRule(
    ruleSpecial,
    hasSpecial
  );


  // ---------------------------------------------------
  // حساب القوة
  // ---------------------------------------------------

  let score =
    0;


  if (hasLength) {

    score++;

  }


  if (hasNumber) {

    score++;

  }


  if (hasUppercase) {

    score++;

  }


  if (hasSpecial) {

    score++;

  }


  // ---------------------------------------------------
  // تحديث الشريط
  // ---------------------------------------------------

  if (
    strengthBar
  ) {

    const percentage =
      (
        score / 4
      ) * 100;


    strengthBar.style.width =
      `${percentage}%`;

  }


  // ---------------------------------------------------
  // تحديث النص
  // ---------------------------------------------------

  if (
    strengthLabel
  ) {

    if (!password) {

      strengthLabel.textContent =
        "أدخل كلمة المرور";

    }

    else if (
      score === 1
    ) {

      strengthLabel.textContent =
        "ضعيفة";

    }

    else if (
      score === 2
    ) {

      strengthLabel.textContent =
        "متوسطة";

    }

    else if (
      score === 3
    ) {

      strengthLabel.textContent =
        "جيدة";

    }

    else if (
      score === 4
    ) {

      strengthLabel.textContent =
        "قوية";

    }

  }


  // ---------------------------------------------------
  // تحديث تأكيد كلمة المرور
  // ---------------------------------------------------

  updateConfirmPassword();

}


// =====================================================
// تحديث قاعدة من قواعد كلمة المرور
// =====================================================

function updateRule(
  element,
  valid
) {

  if (!element) {

    return;

  }


  element.classList.toggle(
    "valid",
    valid
  );


  const icon =
    element.querySelector(
      ".rule-icon"
    );


  if (icon) {

    icon.textContent =
      valid
        ? "✓"
        : "○";

  }

}


// =====================================================
// إعداد تأكيد كلمة المرور
// =====================================================

function setupConfirmPassword() {

  const confirmPasswordInput =
    document.getElementById(
      "confirmPassword"
    );


  const toggleConfirmPassword =
    document.getElementById(
      "toggleConfirmPassword"
    );


  if (
    confirmPasswordInput
  ) {

    confirmPasswordInput.addEventListener(
      "input",
      updateConfirmPassword
    );

  }


  if (
    toggleConfirmPassword &&
    confirmPasswordInput
  ) {

    toggleConfirmPassword.addEventListener(
      "click",
      () => {

        togglePasswordVisibility(
          confirmPasswordInput,
          toggleConfirmPassword
        );

      }
    );

  }

}


// =====================================================
// فحص تطابق كلمة المرور
// =====================================================

function updateConfirmPassword() {

  const passwordInput =
    document.getElementById(
      "password"
    );


  const confirmPasswordInput =
    document.getElementById(
      "confirmPassword"
    );


  const confirmStatus =
    document.getElementById(
      "confirmStatus"
    );


  if (
    !passwordInput ||
    !confirmPasswordInput ||
    !confirmStatus
  ) {

    return;

  }


  const password =
    passwordInput.value;


  const confirmPassword =
    confirmPasswordInput.value;


  // ---------------------------------------------------
  // لا يوجد إدخال
  // ---------------------------------------------------

  if (!confirmPassword) {

    confirmStatus.textContent =
      "";


    confirmStatus.className =
      "confirm-status";


    return;

  }


  // ---------------------------------------------------
  // متطابقة
  // ---------------------------------------------------

  if (
    password &&
    password === confirmPassword
  ) {

    confirmStatus.textContent =
      "✓ كلمتا المرور متطابقتان";


    confirmStatus.className =
      "confirm-status valid";


    return;

  }


  // ---------------------------------------------------
  // غير متطابقة
  // ---------------------------------------------------

  confirmStatus.textContent =
    "✕ كلمتا المرور غير متطابقتين";


  confirmStatus.className =
    "confirm-status invalid";

}


// =====================================================
// إعداد الشروط والخصوصية
// =====================================================

function setupTermsAndPrivacy() {

  const termsLink =
    document.getElementById(
      "termsLink"
    );


  const privacyLink =
    document.getElementById(
      "privacyLink"
    );


  const termsClose =
    document.getElementById(
      "termsClose"
    );


  const privacyClose =
    document.getElementById(
      "privacyClose"
    );


  // ---------------------------------------------------
  // فتح الشروط
  // ---------------------------------------------------

  if (
    termsLink
  ) {

    termsLink.addEventListener(
      "click",
      (event) => {

        event.preventDefault();

        openModal(
          "termsModal"
        );

      }
    );

  }


  // ---------------------------------------------------
  // فتح الخصوصية
  // ---------------------------------------------------

  if (
    privacyLink
  ) {

    privacyLink.addEventListener(
      "click",
      (event) => {

        event.preventDefault();

        openModal(
          "privacyModal"
        );

      }
    );

  }


  // ---------------------------------------------------
  // إغلاق الشروط
  // ---------------------------------------------------

  if (
    termsClose
  ) {

    termsClose.addEventListener(
      "click",
      () => {

        closeModal(
          "termsModal"
        );

      }
    );

  }


  // ---------------------------------------------------
  // إغلاق الخصوصية
  // ---------------------------------------------------

  if (
    privacyClose
  ) {

    privacyClose.addEventListener(
      "click",
      () => {

        closeModal(
          "privacyModal"
        );

      }
    );

  }


  // ---------------------------------------------------
  // إغلاق عند الضغط خارج النافذة
  // ---------------------------------------------------

  setupModalBackdrop(
    "termsModal"
  );


  setupModalBackdrop(
    "privacyModal"
  );


  // ---------------------------------------------------
  // إغلاق بزر Escape
  // ---------------------------------------------------

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !== "Escape"
      ) {

        return;

      }


      // إغلاق الكاميرا أولاً
      const cameraModal =
        document.getElementById(
          "cameraModal"
        );


      if (
        cameraModal &&
        cameraModal.classList.contains(
          "show"
        )
      ) {

        closeCamera();

        return;

      }


      closeModal(
        "termsModal"
      );


      closeModal(
        "privacyModal"
      );

    }
  );

}


// =====================================================
// فتح Modal
// =====================================================

function openModal(
  modalId
) {

  const modal =
    document.getElementById(
      modalId
    );


  if (!modal) {

    return;

  }


  modal.classList.add(
    "show"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "modal-open"
  );

}


// =====================================================
// إغلاق Modal
// =====================================================

function closeModal(
  modalId
) {

  const modal =
    document.getElementById(
      modalId
    );


  if (!modal) {

    return;

  }


  modal.classList.remove(
    "show"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  const anyModalOpen =
    document.querySelector(
      ".modal.show"
    );


  if (!anyModalOpen) {

    document.body.classList.remove(
      "modal-open"
    );

  }

}


// =====================================================
// إغلاق عند الضغط على الخلفية
// =====================================================

function setupModalBackdrop(
  modalId
) {

  const modal =
    document.getElementById(
      modalId
    );


  if (!modal) {

    return;

  }


  modal.addEventListener(
    "click",
    (event) => {

      if (
        event.target === modal
      ) {

        closeModal(
          modalId
        );

      }

    }
  );

}


// =====================================================
// إنشاء الحساب
// =====================================================

async function handleSignup(
  event
) {

  event.preventDefault();


  // ---------------------------------------------------
  // عناصر الصفحة
  // ---------------------------------------------------

  const fullNameInput =
    document.getElementById(
      "fullName"
    );


  const emailInput =
    document.getElementById(
      "email"
    );


  const phoneInput =
    document.getElementById(
      "phone"
    );


  const governorateInput =
    document.getElementById(
      "governorate"
    );


  const regionInput =
    document.getElementById(
      "region"
    );


  const passwordInput =
    document.getElementById(
      "password"
    );


  const confirmPasswordInput =
    document.getElementById(
      "confirmPassword"
    );


  const termsAccepted =
    document.getElementById(
      "termsAccepted"
    );


  const signupBtn =
    document.getElementById(
      "signupBtn"
    );


  // ---------------------------------------------------
  // قراءة البيانات
  // ---------------------------------------------------

  const fullName =
    fullNameInput.value.trim();


  const email =
    emailInput.value
      .trim()
      .toLowerCase();


  const phone =
    phoneInput.value.trim();


  const governorate =
    governorateInput.value.trim();


  const region =
    regionInput.value.trim();


  const password =
    passwordInput.value;


  const confirmPassword =
    confirmPasswordInput.value;


  // ===================================================
  // الصورة الشخصية
  // ===================================================

  if (!selectedAvatarFile) {

    showMessage(
      "يرجى تحديد صورة شخصية للمندوب قبل إنشاء الحساب.",
      "error"
    );

    return;

  }


  // ===================================================
  // الاسم
  // ===================================================

  if (!fullName) {

    showMessage(
      "يرجى كتابة اسم المندوب.",
      "error"
    );


    fullNameInput.focus();

    return;

  }


  if (
    fullName.length < 2
  ) {

    showMessage(
      "اسم المندوب قصير جدًا.",
      "error"
    );


    fullNameInput.focus();

    return;

  }


  if (
    fullName.length > 100
  ) {

    showMessage(
      "اسم المندوب طويل جدًا.",
      "error"
    );


    fullNameInput.focus();

    return;

  }


  // ===================================================
  // البريد الإلكتروني
  // ===================================================

  if (!email) {

    showMessage(
      "يرجى كتابة البريد الإلكتروني.",
      "error"
    );


    emailInput.focus();

    return;

  }


  if (
    !isValidEmail(email)
  ) {

    showMessage(
      "يرجى إدخال بريد إلكتروني صحيح.",
      "error"
    );


    emailInput.focus();

    return;

  }


  // ===================================================
  // رقم الهاتف
  // ===================================================

  if (!phone) {

    showMessage(
      "يرجى كتابة رقم الهاتف.",
      "error"
    );


    phoneInput.focus();

    return;

  }


  if (
    !/^07[0-9]{9}$/.test(
      phone
    )
  ) {

    showMessage(
      "رقم الهاتف يجب أن يكون 11 رقمًا ويبدأ بـ 07.",
      "error"
    );


    phoneInput.focus();

    return;

  }


  // ===================================================
  // المحافظة
  // ===================================================

  if (!governorate) {

    showMessage(
      "يرجى اختيار المحافظة.",
      "error"
    );


    governorateInput.focus();

    return;

  }


  // ===================================================
  // المنطقة
  // ===================================================

  if (!region) {

    showMessage(
      "يرجى كتابة المنطقة.",
      "error"
    );


    regionInput.focus();

    return;

  }


  if (
    region.length > 100
  ) {

    showMessage(
      "اسم المنطقة طويل جدًا.",
      "error"
    );


    regionInput.focus();

    return;

  }


  // ===================================================
  // كلمة المرور
  // ===================================================

  if (!password) {

    showMessage(
      "يرجى كتابة كلمة المرور.",
      "error"
    );


    passwordInput.focus();

    return;

  }


  if (
    password.length < 6
  ) {

    showMessage(
      "كلمة المرور يجب أن تكون 6 أحرف أو أكثر.",
      "error"
    );


    passwordInput.focus();

    return;

  }


  if (
    !/[0-9]/.test(
      password
    )
  ) {

    showMessage(
      "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل.",
      "error"
    );


    passwordInput.focus();

    return;

  }


  if (
    !/[A-Z]/.test(
      password
    )
  ) {

    showMessage(
      "يجب أن تحتوي كلمة المرور على حرف إنجليزي كبير واحد على الأقل.",
      "error"
    );


    passwordInput.focus();

    return;

  }


  if (
    !/[^A-Za-z0-9]/.test(
      password
    )
  ) {

    showMessage(
      "يجب أن تحتوي كلمة المرور على رمز خاص مثل ! أو @ أو #.",
      "error"
    );


    passwordInput.focus();

    return;

  }


  // ===================================================
  // تأكيد كلمة المرور
  // ===================================================

  if (!confirmPassword) {

    showMessage(
      "يرجى تأكيد كلمة المرور.",
      "error"
    );


    confirmPasswordInput.focus();

    return;

  }


  if (
    password !== confirmPassword
  ) {

    showMessage(
      "كلمتا المرور غير متطابقتين.",
      "error"
    );


    confirmPasswordInput.focus();

    return;

  }


  // ===================================================
  // الموافقة على الشروط
  // ===================================================

  if (
    !termsAccepted ||
    !termsAccepted.checked
  ) {

    showMessage(
      "يجب الموافقة على الشروط والأحكام وسياسة الخصوصية قبل إنشاء الحساب.",
      "error"
    );


    if (termsAccepted) {

      termsAccepted.focus();

    }


    return;

  }


  // ===================================================
  // تعطيل زر إنشاء الحساب
  // ===================================================

  if (signupBtn) {

    signupBtn.disabled =
      true;


    signupBtn.textContent =
      "جاري إنشاء الحساب...";

  }


  try {

    // =================================================
    // إنشاء حساب Supabase
    // =================================================

    const {
      data,
      error
    } =
      await supabaseClient.auth.signUp({

        email: email,

        password: password,

        options: {

          data: {

            full_name:
              fullName,

            phone:
              phone,

            governorate:
              governorate,

            region:
              region

          },


          emailRedirectTo:
            "https://niverafashion.github.io/zain-salse/zain-sales/index.html"

        }

      });


    // =================================================
    // فحص الخطأ
    // =================================================

    if (error) {

      console.error(
        "Supabase signup error:",
        error
      );


      throw new Error(
        getSignupErrorMessage(
          error
        )
      );

    }


    // =================================================
    // التأكد من المستخدم
    // =================================================

    if (
      !data ||
      !data.user
    ) {

      throw new Error(
        "تعذر إنشاء الحساب. حاول مرة أخرى."
      );

    }


    console.log(
      "User created:",
      data.user.id
    );


    // =================================================
    // فحص البريد المكرر
    // =================================================

    if (
      Array.isArray(
        data.user.identities
      ) &&
      data.user.identities.length === 0
    ) {

      showMessage(
        "هذا البريد الإلكتروني مستخدم بالفعل. إذا كان حسابك، يمكنك تسجيل الدخول.",
        "error"
      );


      if (signupBtn) {

        signupBtn.disabled =
          false;


        signupBtn.textContent =
          "إنشاء الحساب";

      }


      return;

    }


    // =================================================
    // إذا تم تسجيل الدخول مباشرة
    // =================================================

    if (data.session) {

      const {
        error: profileError
      } =
        await saveProfile({

          id:
            data.user.id,

          full_name:
            fullName,

          phone:
            phone,

          governorate:
            governorate,

          region:
            region

        });


      // -----------------------------------------------
      // فشل حفظ البيانات
      // -----------------------------------------------

      if (profileError) {

        console.error(
          "Profile save error:",
          profileError
        );


        showMessage(
          "تم إنشاء الحساب، لكن تعذر حفظ بيانات المندوب. حاول تسجيل الدخول مرة أخرى.",
          "error"
        );


        if (signupBtn) {

          signupBtn.disabled =
            false;


          signupBtn.textContent =
            "إنشاء الحساب";

        }


        return;

      }


      // -----------------------------------------------
      // نجاح
      // -----------------------------------------------

      showMessage(
        "تم إنشاء الحساب بنجاح. جاري تحويلك...",
        "success"
      );


      setTimeout(() => {

        window.location.replace(
          "subscription.html"
        );

      }, 1000);


      return;

    }


    // =================================================
    // تأكيد الإيميل مطلوب
    // =================================================

    showMessage(
      "تم إنشاء الحساب بنجاح. أرسلنا رسالة تأكيد إلى بريدك الإلكتروني. افتح الرسالة واضغط رابط التأكيد، ثم سجل الدخول.",
      "success"
    );


    if (signupBtn) {

      signupBtn.disabled =
        false;


      signupBtn.textContent =
        "تم إنشاء الحساب";

    }

  } catch (error) {

    console.error(
      "Create account error:",
      error
    );


    showMessage(
      error.message ||
      "حدث خطأ أثناء إنشاء الحساب.",
      "error"
    );


    if (signupBtn) {

      signupBtn.disabled =
        false;


      signupBtn.textContent =
        "إنشاء الحساب";

    }

  }

}


// =====================================================
// التحقق من البريد الإلكتروني
// =====================================================

function isValidEmail(
  email
) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );

}


// =====================================================
// حفظ بيانات المندوب
// =====================================================

async function saveProfile(
  profileData
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .upsert(
        profileData,
        {
          onConflict:
            "id"
        }
      )
      .select()
      .single();


  return {
    data,
    error
  };

}


// =====================================================
// رسائل أخطاء Supabase
// =====================================================

function getSignupErrorMessage(
  error
) {

  const originalMessage =
    String(
      error?.message ||
      ""
    );


  const message =
    originalMessage.toLowerCase();


  // ---------------------------------------------------
  // البريد مستخدم
  // ---------------------------------------------------

  if (

    message.includes(
      "already registered"
    ) ||

    message.includes(
      "user already registered"
    ) ||

    message.includes(
      "already exists"
    ) ||

    message.includes(
      "email already"
    )

  ) {

    return (
      "هذا البريد الإلكتروني مستخدم بالفعل. إذا كان حسابك، يمكنك تسجيل الدخول."
    );

  }


  // ---------------------------------------------------
  // كلمة المرور
  // ---------------------------------------------------

  if (

    message.includes(
      "password"
    ) &&

    (
      message.includes(
        "weak"
      ) ||

      message.includes(
        "6"
      ) ||

      message.includes(
        "characters"
      )
    )

  ) {

    return (
      "كلمة المرور ضعيفة. استخدم كلمة مرور أقوى."
    );

  }


  // ---------------------------------------------------
  // بريد غير صحيح
  // ---------------------------------------------------

  if (
    message.includes(
      "invalid email"
    )
  ) {

    return (
      "البريد الإلكتروني غير صحيح."
    );

  }


  // ---------------------------------------------------
  // Rate Limit
  // ---------------------------------------------------

  if (

    message.includes(
      "rate limit"
    ) ||

    message.includes(
      "email rate limit"
    )

  ) {

    return (
      "تم إرسال عدد كبير من المحاولات. حاول مرة أخرى بعد قليل."
    );

  }


  // ---------------------------------------------------
  // مزود البريد
  // ---------------------------------------------------

  if (
    message.includes(
      "email provider"
    )
  ) {

    return (
      "تعذر استخدام هذا البريد الإلكتروني حاليًا. حاول باستخدام بريد آخر."
    );

  }


  // ---------------------------------------------------
  // Duplicate
  // ---------------------------------------------------

  if (
    message.includes(
      "duplicate"
    )
  ) {

    return (
      "هذه البيانات موجودة مسبقًا."
    );

  }


  // ---------------------------------------------------
  // خطأ عام
  // ---------------------------------------------------

  return (
    originalMessage ||
    "تعذر إنشاء الحساب. حاول مرة أخرى."
  );

}


// =====================================================
// عرض الرسائل للمستخدم
// =====================================================

function showMessage(
  message,
  type = "success"
) {

  const element =
    document.getElementById(
      "signupMessage"
    );


  if (!element) {

    return;

  }


  element.textContent =
    message;


  element.className =
    `message show ${type}`;


  // ---------------------------------------------------
  // تمرير المستخدم إلى الرسالة
  // ---------------------------------------------------

  setTimeout(() => {

    try {

      element.scrollIntoView({

        behavior:
          "smooth",

        block:
          "nearest"

      });

    } catch (error) {

      console.warn(
        "Scroll error:",
        error
      );

    }

  }, 50);


  // ---------------------------------------------------
  // إخفاء الرسالة
  // ---------------------------------------------------

  window.clearTimeout(
    showMessage.timer
  );


  showMessage.timer =
    window.setTimeout(() => {

      element.className =
        "message";

    }, 7000);

}