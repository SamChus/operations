const form = document.getElementById("userDataForm");
const profilePicInput = document.getElementById("profilePic");
const imagePreview = document.getElementById("imagePreview");

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function buildProfilePayload() {
  const formData = new FormData(form);
  const profilePicFile = profilePicInput.files[0];
  let profilePic = null;

  if (profilePicFile) {
    const base64 = await readFileAsBase64(profilePicFile);
    profilePic = `data:${profilePicFile.type};base64,${base64}`;
  }

  return {
    firstName: formData.get("firstName")?.trim(),
    lastName: formData.get("lastName")?.trim(),
    email: formData.get("email")?.trim(),
    phone: formData.get("phone")?.trim(),
    birthday: formData.get("birthday") || "",
    country: formData.get("country") || "",
    bio: formData.get("bio")?.trim() || "",
    profilePic,
  };
}

async function createUserProfile(payload) {
  const response = await fetch("/api/user-profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to create profile");
  }

  return response.json();
}

async function updateUserProfile(id, payload) {
  const response = await fetch(`/api/user-profile/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update profile");
  }

  return response.json();
}

profilePicInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.src = reader.result;
  };
  reader.readAsDataURL(file);
});

const submitBtn = document.querySelector("button[type='button']");

submitBtn.addEventListener("click", async () => {
  const payload = await buildProfilePayload();

  try {
    const result = await createUserProfile(payload);
    alert(`Profile created with id: ${result.id}`);
    form.reset();
    imagePreview.src = "https://randomuser.me/api/portraits/lego/7.jpg";
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});
