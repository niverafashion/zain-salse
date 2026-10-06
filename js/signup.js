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
// إعدادات الصورة
// =====================================================

const AVATAR_MAX_SIZE =
  5 * 1024 * 1024;

const AVATAR_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const AVATAR_BUCKET =
  "avatars";


// =====================================================
// عند تحميل الصفحة
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const signupForm =
      document.getElementById(
        "signupForm"
      );

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

  }
);


// =====================================================
// إعداد الصورة الشخصية
// =====================================================

function setupAvatar() {

  const galleryBtn =
    document.getElementById(
      "galleryBtn"
    );

  const cameraBtn =
    document.getElementById(
      "cameraBtn"
    );

  const removeAvatarBtn =
    document.getElementById(
      "removeAvatarBtn"
    );

  const galleryInput =
    document.getElementById(
      "galleryInput"
    );


  // ---------------------------------------------------
  // فتح الاستديو
  // ---------------------------------------------------

  if (
    galleryBtn &&
    galleryInput
  ) {

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
    document.getElementById(
      "cameraModal"
    );

  const closeButton =
    document.getElementById(
      "closeCameraBtn"
    );

  const captureButton =
    document.getElementById(
      "captureCameraBtn"
    );


  if (!modal) {
    return;
  }


  if (
    modal.dataset.cameraEventsBound ===
    "true"
  ) {

    return;

  }


  modal.dataset.cameraEventsBound =
    "true";


  // ---------------------------------------------------
  // إغلاق الكاميرا
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
  // التقاط الصورة
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
  // الضغط على الخلفية
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


  const modal =
    createCameraModal();


  if (!modal) {

    showMessage(
      "تعذر فتح نافذة الكاميرا.",
      "error"
    );

    return;

  }


  setupCameraEvents();


  if (cameraStream) {

    modal.classList.add(
      "show"
    );

    return;

  }


  const cameraVideo =
    document.getElementById(
      "cameraVideo"
    );


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


  if (captureButton) {

    captureButton.disabled =
      true;

    captureButton.style.opacity =
      "0.6";

  }


  try {

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


    cameraVideo.srcObject =
      cameraStream;

    cameraVideo.muted =
      true;

    cameraVideo.autoplay =
      true;

    cameraVideo.playsInline =
      true;


    cameraVideo.setAttribute(
      "playsinline",
      ""
    );

    cameraVideo.setAttribute(
      "autoplay",
      ""
    );


    modal.classList.add(
      "show"
    );


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


    try {

      await cameraVideo.play();

    } catch (playError) {

      console.warn(
        "Video play warning:",
        playError
      );

    }


    if (captureButton) {

      captureButton.disabled =
        false;

      captureButton.style.opacity =
        "1";

    }

  } catch (error) {

    console.error(
      "Camera error:",
      error
    );


    closeCamera();


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


    if (
      error.name === "NotReadableError"
    ) {

      showMessage(
        "تعذر الوصول إلى الكاميرا. تأكد أن الكاميرا ليست مستخدمة من تطبيق آخر.",
        "error"
      );

      return;

    }


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

  let modal =
    document.getElementById(
      "cameraModal"
    );


  if (modal) {

    setupCameraEvents();

    return modal;

  }


  modal =
    document.createElement(
      "div"
    );


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


  isCapturingPhoto =
    true;


  if (captureButton) {

    captureButton.disabled =
      true;

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

    const canvas =
      document.createElement(
        "canvas"
      );


    const size =
      Math.min(
        video.videoWidth,
        video.videoHeight
      );


    canvas.width =
      size;

    canvas.height =
      size;


    const context =
      canvas.getContext(
        "2d",
        {
          alpha: false
        }
      );


    if (!context) {

      throw new Error(
        "تعذر إنشاء الصورة."
      );

    }


    context.imageSmoothingEnabled =
      true;

    context.imageSmoothingQuality =
      "high";


    const sourceX =
      (
        video.videoWidth -
        size
      ) / 2;


    const sourceY =
      (
        video.videoHeight -
        size
      ) / 2;


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


    const file =
      new File(

        [blob],

        `avatar-${Date.now()}.jpg`,

        {
          type:
            "image/jpeg",

          lastModified:
            Date.now()

        }

      );


    validateAvatarFile(
      file
    );


    selectedAvatarFile =
      file;


    previewAvatar(
      file
    );


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

      captureButton.disabled =
        false;

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

    isCapturingPhoto =
      false;

  }

}


// =====================================================
// إغلاق الكاميرا
// =====================================================

function closeCamera() {

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


    cameraStream =
      null;

  }


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

    video.srcObject =
      null;

  }


  const captureButton =
    document.getElementById(
      "captureCameraBtn"
    );


  if (captureButton) {

    captureButton.disabled =
      false;

    captureButton.style.opacity =
      "1";

    captureButton.innerHTML = `

      <span class="capture-camera-icon">
        📷
      </span>

      <span>
        التقاط الصورة
      </span>

    `;

  }


  isCapturingPhoto =
    false;


  const modal =
    document.getElementById(
      "cameraModal"
    );


  if (modal) {

    modal.classList.remove(
      "show"
    );

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


  try {

    validateAvatarFile(
      file
    );

  } catch (error) {

    showMessage(
      error.message,
      "error"
    );


    event.target.value =
      "";

    return;

  }


  selectedAvatarFile =
    file;


  previewAvatar(
    file
  );


  showMessage(
    "تم اختيار الصورة بنجاح.",
    "success"
  );

}


// =====================================================
// التحقق من ملف الصورة
// =====================================================

function validateAvatarFile(
  file
) {

  if (!file) {

    throw new Error(
      "يرجى تحديد صورة شخصية."
    );

  }


  if (
    !AVATAR_ALLOWED_TYPES.includes(
      file.type
    )
  ) {

    throw new Error(
      "صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WEBP."
    );

  }


  if (
    file.size > AVATAR_MAX_SIZE
  ) {

    throw new Error(
      "حجم الصورة كبير جدًا. الحد الأقصى 5 ميجابايت."
    );

  }

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


  const reader =
    new FileReader();


  reader.onload =
    function () {

      avatarImage.src =
        reader.result;

      avatarImage.hidden =
        false;


      if (
        avatarPlaceholder
      ) {

        avatarPlaceholder.hidden =
          true;

      }


      if (
        removeAvatarBtn
      ) {

        removeAvatarBtn.hidden =
          false;

      }


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

  selectedAvatarFile =
    null;


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


  if (avatarImage) {

    avatarImage.src =
      "";

    avatarImage.hidden =
      true;

  }


  if (
    avatarPlaceholder
  ) {

    avatarPlaceholder.hidden =
      false;

  }


  if (
    removeAvatarBtn
  ) {

    removeAvatarBtn.hidden =
      true;

  }


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


  passwordInput.addEventListener(
    "input",
    updatePasswordStrength
  );


  if (togglePassword) {

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
    input.type ===
    "password";


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


  if (strengthBar) {

    const percentage =
      (
        score / 4
      ) * 100;


    strengthBar.style.width =
      `${percentage}%`;


    strengthBar.classList.remove(
      "strength-weak",
      "strength-medium",
      "strength-good",
      "strength-strong"
    );


    if (!password) {

      strengthBar.style.background =
        "#ddd";

    } else if (score <= 1) {

      strengthBar.style.background =
        "#d32f2f";

    } else if (score === 2) {

      strengthBar.style.background =
        "#f0b400";

    } else if (score === 3) {

      strengthBar.style.background =
        "#62a83d";

    } else {

      strengthBar.style.background =
        "#27853b";

    }

  }


  if (strengthLabel) {

    if (!password) {

      strengthLabel.textContent =
        "أدخل كلمة المرور";

      strengthLabel.style.color =
        "#999";

    } else if (score <= 1) {

      strengthLabel.textContent =
        "ضعيفة";

      strengthLabel.style.color =
        "#d32f2f";

    } else if (score === 2) {

      strengthLabel.textContent =
        "متوسطة";

      strengthLabel.style.color =
        "#c58a00";

    } else if (score === 3) {

      strengthLabel.textContent =
        "جيدة";

      strengthLabel.style.color =
        "#4f9132";

    } else {

      strengthLabel.textContent =
        "قوية";

      strengthLabel.style.color =
        "#27853b";

    }

  }


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
      ".password-rule-icon"
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


  if (!confirmPassword) {

    confirmStatus.textContent =
      "";

    confirmStatus.className =
      "confirm-status";

    return;

  }


  if (
    password &&
    password ===
    confirmPassword
  ) {

    confirmStatus.textContent =
      "✓ كلمتا المرور متطابقتان";

    confirmStatus.className =
      "confirm-status valid";

    return;

  }


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


  if (termsLink) {

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


  if (privacyLink) {

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


  if (termsClose) {

    termsClose.addEventListener(
      "click",
      () => {

        closeModal(
          "termsModal"
        );

      }
    );

  }


  if (privacyClose) {

    privacyClose.addEventListener(
      "click",
      () => {

        closeModal(
          "privacyModal"
        );

      }
    );

  }


  setupModalBackdrop(
    "termsModal"
  );

  setupModalBackdrop(
    "privacyModal"
  );


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !==
        "Escape"
      ) {

        return;

      }


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


  try {

    validateAvatarFile(
      selectedAvatarFile
    );

  } catch (error) {

    showMessage(
      error.message,
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
    password !==
    confirmPassword
  ) {

    showMessage(
      "كلمتا المرور غير متطابقتين.",
      "error"
    );

    confirmPasswordInput.focus();

    return;

  }


  // ===================================================
  // الشروط
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
  // تعطيل الزر
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

        email:
          email,

        password:
          password,

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

          }

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
    // البريد مستخدم
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
    // إذا عندنا Session مباشرة
    // =================================================

    if (data.session) {

      // -------------------------------------------------
      // حفظ بيانات المندوب
      // -------------------------------------------------

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


      if (profileError) {

        console.error(
          "Profile save error:",
          profileError
        );


        throw new Error(
          "تم إنشاء الحساب، لكن تعذر حفظ بيانات المندوب."
        );

      }


      // -------------------------------------------------
      // رفع الصورة
      // -------------------------------------------------

      setSignupButtonLoading(
        signupBtn,
        "جاري رفع الصورة..."
      );


      const avatarResult =
        await uploadAvatar(
          data.user.id,
          selectedAvatarFile
        );


      if (
        !avatarResult ||
        avatarResult.error
      ) {

        console.error(
          "Avatar upload error:",
          avatarResult?.error
        );


        throw new Error(
          getAvatarUploadErrorMessage(
            avatarResult?.error
          )
        );

      }


      // -------------------------------------------------
      // حفظ avatar_url
      // -------------------------------------------------

      const {
        error: avatarProfileError
      } =
        await supabaseClient
          .from("profiles")
          .update({
            avatar_url:
              avatarResult.publicUrl
          })
          .eq(
            "id",
            data.user.id
          );


      if (avatarProfileError) {

        console.error(
          "Avatar profile update error:",
          avatarProfileError
        );


        throw new Error(
          "تم رفع الصورة، لكن تعذر حفظ رابط الصورة."
        );

      }


      // -------------------------------------------------
      // نجاح كامل
      // -------------------------------------------------

      showMessage(
        "تم إنشاء الحساب وحفظ صورة المندوب بنجاح. جاري تحويلك...",
        "success"
      );


      setTimeout(
        () => {

          window.location.replace(
            "subscription.html"
          );

        },
        1000
      );


      return;

    }


    // =================================================
    // تأكيد البريد مطلوب
    // =================================================

    /*
      هنا لا توجد Session بعد.

      لذلك نخزن الصورة مؤقتاً حتى يتم تأكيد
      البريد الإلكتروني وإنشاء Session.

      سيتم استخدام هذه البيانات لاحقاً في
      صفحة verify-email لإكمال رفع الصورة.
    */

    try {

      await savePendingAvatar(
        selectedAvatarFile
      );

    } catch (avatarStorageError) {

      console.error(
        "Pending avatar save error:",
        avatarStorageError
      );

      throw new Error(
        "تم إنشاء الحساب، لكن تعذر حفظ الصورة مؤقتًا. حاول التسجيل مرة أخرى."
      );

    }


    // -------------------------------------------------
    // تخزين بيانات التسجيل
    // -------------------------------------------------

    sessionStorage.setItem(
      "zainSalesSignupEmail",
      email
    );

    sessionStorage.setItem(
      "zainSalesSignupUserId",
      data.user.id
    );


    // -------------------------------------------------
    // تحويل إلى تأكيد الإيميل
    // -------------------------------------------------

    window.location.replace(
      "verify-email.html"
    );

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
// رفع صورة المندوب إلى Supabase Storage
// =====================================================

async function uploadAvatar(
  userId,
  file
) {

  if (!userId) {

    return {
      error:
        new Error(
          "معرف المستخدم غير موجود."
        )
    };

  }


  if (!file) {

    return {
      error:
        new Error(
          "ملف الصورة غير موجود."
        )
    };

  }


  try {

    validateAvatarFile(
      file
    );


    // -------------------------------------------------
    // استخراج الامتداد
    // -------------------------------------------------

    const extension =
      getAvatarExtension(
        file
      );


    // -------------------------------------------------
    // اسم فريد للصورة
    // -------------------------------------------------

    const fileName =
      `${crypto.randomUUID()}.${extension}`;


    // -------------------------------------------------
    // مسار الصورة
    // -------------------------------------------------

    const filePath =
      `${userId}/${fileName}`;


    console.log(
      "Uploading avatar:",
      filePath
    );


    // -------------------------------------------------
    // رفع الصورة
    // -------------------------------------------------

    const {
      data,
      error
    } =
      await supabaseClient
        .storage
        .from(
          AVATAR_BUCKET
        )
        .upload(
          filePath,
          file,
          {

            cacheControl:
              "3600",

            upsert:
              false,

            contentType:
              file.type

          }
        );


    if (error) {

      console.error(
        "Supabase Storage upload error:",
        error
      );


      return {
        data:
          null,

        publicUrl:
          null,

        error
      };

    }


    console.log(
      "Avatar uploaded:",
      data
    );


    // -------------------------------------------------
    // إنشاء الرابط العام
    // -------------------------------------------------

    const {
      data: publicData
    } =
      supabaseClient
        .storage
        .from(
          AVATAR_BUCKET
        )
        .getPublicUrl(
          filePath
        );


    const publicUrl =
      publicData?.publicUrl ||
      null;


    if (!publicUrl) {

      return {
        data,
        publicUrl:
          null,

        error:
          new Error(
            "تعذر إنشاء رابط الصورة."
          )
      };

    }


    return {

      data,

      publicUrl,

      filePath,

      error:
        null

    };

  } catch (error) {

    console.error(
      "Upload avatar error:",
      error
    );


    return {

      data:
        null,

      publicUrl:
        null,

      error

    };

  }

}


// =====================================================
// تحديد امتداد الصورة
// =====================================================

function getAvatarExtension(
  file
) {

  if (
    file.type ===
    "image/png"
  ) {

    return "png";

  }


  if (
    file.type ===
    "image/webp"
  ) {

    return "webp";

  }


  return "jpg";

}


// =====================================================
// حفظ الصورة مؤقتاً في IndexedDB
// =====================================================

async function savePendingAvatar(
  file
) {

  if (!file) {

    throw new Error(
      "الصورة غير موجودة."
    );

  }


  const buffer =
    await file.arrayBuffer();


  const pendingAvatar = {

    id:
      "pending-avatar",

    name:
      file.name,

    type:
      file.type,

    lastModified:
      file.lastModified,

    buffer

  };


  return new Promise(
    (
      resolve,
      reject
    ) => {

      const request =
        indexedDB.open(
          "zainSalesSignupDB",
          1
        );


      request.onupgradeneeded =
        function () {

          const db =
            request.result;


          if (
            !db.objectStoreNames.contains(
              "avatars"
            )
          ) {

            db.createObjectStore(
              "avatars",
              {
                keyPath:
                  "id"
              }
            );

          }

        };


      request.onsuccess =
        function () {

          const db =
            request.result;


          const transaction =
            db.transaction(
              "avatars",
              "readwrite"
            );


          const store =
            transaction.objectStore(
              "avatars"
            );


          store.put(
            pendingAvatar
          );


          transaction.oncomplete =
            function () {

              db.close();

              resolve(true);

            };


          transaction.onerror =
            function () {

              db.close();

              reject(
                transaction.error ||
                new Error(
                  "تعذر حفظ الصورة مؤقتًا."
                )
              );

            };

        };


      request.onerror =
        function () {

          reject(
            request.error ||
            new Error(
              "تعذر فتح التخزين المحلي."
            )
          );

        };

    }
  );

}


// =====================================================
// قراءة الصورة المؤقتة
// =====================================================

async function getPendingAvatar() {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const request =
        indexedDB.open(
          "zainSalesSignupDB",
          1
        );


      request.onupgradeneeded =
        function () {

          const db =
            request.result;


          if (
            !db.objectStoreNames.contains(
              "avatars"
            )
          ) {

            db.createObjectStore(
              "avatars",
              {
                keyPath:
                  "id"
              }
            );

          }

        };


      request.onsuccess =
        function () {

          const db =
            request.result;


          const transaction =
            db.transaction(
              "avatars",
              "readonly"
            );


          const store =
            transaction.objectStore(
              "avatars"
            );


          const getRequest =
            store.get(
              "pending-avatar"
            );


          getRequest.onsuccess =
            function () {

              const data =
                getRequest.result;


              db.close();


              if (!data) {

                resolve(
                  null
                );

                return;

              }


              const file =
                new File(

                  [
                    data.buffer
                  ],

                  data.name,

                  {

                    type:
                      data.type,

                    lastModified:
                      data.lastModified

                  }

                );


              resolve(
                file
              );

            };


          getRequest.onerror =
            function () {

              db.close();

              reject(
                getRequest.error
              );

            };

        };


      request.onerror =
        function () {

          reject(
            request.error
          );

        };

    }
  );

}


// =====================================================
// حذف الصورة المؤقتة
// =====================================================

async function removePendingAvatar() {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const request =
        indexedDB.open(
          "zainSalesSignupDB",
          1
        );


      request.onupgradeneeded =
        function () {

          const db =
            request.result;


          if (
            !db.objectStoreNames.contains(
              "avatars"
            )
          ) {

            db.createObjectStore(
              "avatars",
              {
                keyPath:
                  "id"
              }
            );

          }

        };


      request.onsuccess =
        function () {

          const db =
            request.result;


          const transaction =
            db.transaction(
              "avatars",
              "readwrite"
            );


          const store =
            transaction.objectStore(
              "avatars"
            );


          store.delete(
            "pending-avatar"
          );


          transaction.oncomplete =
            function () {

              db.close();

              resolve(true);

            };


          transaction.onerror =
            function () {

              db.close();

              reject(
                transaction.error
              );

            };

        };


      request.onerror =
        function () {

          reject(
            request.error
          );

        };

    }
  );

}


// =====================================================
// دالة عامة لإكمال رفع الصورة بعد تسجيل الدخول
// =====================================================

async function completePendingAvatarUpload(
  userId
) {

  if (!userId) {

    throw new Error(
      "معرف المستخدم غير موجود."
    );

  }


  try {

    const pendingFile =
      await getPendingAvatar();


    if (!pendingFile) {

      console.log(
        "No pending avatar found."
      );

      return {
        success:
          false,

        reason:
          "no_pending_avatar"

      };

    }


    validateAvatarFile(
      pendingFile
    );


    const avatarResult =
      await uploadAvatar(
        userId,
        pendingFile
      );


    if (
      !avatarResult ||
      avatarResult.error
    ) {

      throw (
        avatarResult?.error ||
        new Error(
          "تعذر رفع الصورة."
        )
      );

    }


    const {
      error
    } =
      await supabaseClient
        .from("profiles")
        .update({

          avatar_url:
            avatarResult.publicUrl

        })
        .eq(
          "id",
          userId
        );


    if (error) {

      console.error(
        "Save avatar URL error:",
        error
      );


      throw error;

    }


    await removePendingAvatar();


    console.log(
      "Pending avatar uploaded successfully."
    );


    return {

      success:
        true,

      publicUrl:
        avatarResult.publicUrl

    };

  } catch (error) {

    console.error(
      "Complete pending avatar upload error:",
      error
    );


    return {

      success:
        false,

      error

    };

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
// تغيير حالة زر التسجيل
// =====================================================

function setSignupButtonLoading(
  button,
  text
) {

  if (!button) {
    return;
  }


  button.disabled =
    true;

  button.textContent =
    text;

}


// =====================================================
// رسالة خطأ رفع الصورة
// =====================================================

function getAvatarUploadErrorMessage(
  error
) {

  const message =
    String(
      error?.message ||
      ""
    ).toLowerCase();


  if (
    message.includes(
      "bucket"
    )
  ) {

    return (
      "تعذر الوصول إلى مساحة تخزين الصور. تأكد أن bucket باسم avatars موجود."
    );

  }


  if (
    message.includes(
      "row-level security"
    ) ||
    message.includes(
      "not authorized"
    ) ||
    message.includes(
      "unauthorized"
    ) ||
    message.includes(
      "permission"
    )
  ) {

    return (
      "ليس لدى الحساب صلاحية رفع الصورة. نحتاج ضبط صلاحيات Storage الخاصة بالصور."
    );

  }


  if (
    message.includes(
      "duplicate"
    )
  ) {

    return (
      "تعذر حفظ الصورة بسبب تكرار اسم الملف. حاول مرة أخرى."
    );

  }


  return (
    error?.message ||
    "تعذر رفع صورة المندوب. حاول مرة أخرى."
  );

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


  if (
    message.includes(
      "invalid email"
    )
  ) {

    return (
      "البريد الإلكتروني غير صحيح."
    );

  }


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


  if (
    message.includes(
      "email provider"
    )
  ) {

    return (
      "تعذر استخدام هذا البريد الإلكتروني حاليًا. حاول باستخدام بريد آخر."
    );

  }


  if (
    message.includes(
      "duplicate"
    )
  ) {

    return (
      "هذه البيانات موجودة مسبقًا."
    );

  }


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


  window.clearTimeout(
    showMessage.timer
  );


  showMessage.timer =
    window.setTimeout(
      () => {

        element.className =
          "message";

      },
      7000
    );

}