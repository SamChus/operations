const API_BASE = "http://localhost:3002";
const form = document.getElementById("userDataForm");
const profilePicInput = document.getElementById("profilePic");
const imagePreview = document.getElementById("imagePreview");
const editProfileBtn = document.getElementById("editProfileBtn");
const newProfileBtn = document.getElementById("newProfileBtn");
const userList = document.getElementById("userList");
const formStatus = document.getElementById("formStatus");
const submitBtn = form.querySelector("button[type='button']");

let selectedUserId = null;
let isEditMode = false;
let currentUser = null;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setFormDisabled(disabled) {
  const inputs = form.querySelectorAll("input, textarea, select");
  inputs.forEach((input) => {
    if (input.type !== "file") {
      input.disabled = disabled;
    }
  });
  profilePicInput.disabled = disabled;
  submitBtn.disabled = disabled;
}

function clearForm() {
  form.reset();
  imagePreview.src = "https://randomuser.me/api/portraits/lego/7.jpg";
  selectedUserId = null;
  currentUser = null;
  isEditMode = true;
  editProfileBtn.disabled = true;
  submitBtn.textContent = "Create Profile";
  formStatus.textContent = "Creating a new profile.";
  setFormDisabled(false);
}

function populateForm(user) {
  form.firstName.value = user.firstName || "";
  form.lastName.value = user.lastName || "";
  form.email.value = user.email || "";
  form.phone.value = user.phone || "";
  form.birthday.value = user.birthday || "";
  form.country.value = user.country || "";
  form.bio.value = user.bio || "";
  if (user.profilePic) {
    imagePreview.src = user.profilePic;
  } else {
    imagePreview.src = "https://randomuser.me/api/portraits/lego/7.jpg";
  }
}

function setSelectedUser(id) {
  selectedUserId = id;
  isEditMode = false;
  editProfileBtn.disabled = false;
  submitBtn.textContent = "Save Profile";
  formStatus.textContent =
    "Profile loaded. Click Edit Profile to make changes.";
  setFormDisabled(true);
  userList.querySelectorAll(".user-item").forEach((item) => {
    item.classList.toggle("selected", item.dataset.id === id);
  });
}

function showStatus(message) {
  formStatus.textContent = message;
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Request failed");
  }
  return response.json();
}

async function loadUserList() {
  try {
    const users = await fetchJson("/api/users");
    renderUserList(users);
  } catch (error) {
    console.error(error);
    showStatus("Unable to load users.");
  }
}

function renderUserList(list) {
  userList.innerHTML = "";
  if (!list.length) {
    userList.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">No profiles found yet.</td>
      </tr>
    `;
    return;
  }

  list.forEach((user) => {
    const row = document.createElement("tr");
    row.dataset.id = user.id;
    row.innerHTML = `
      <td class="truncate">${user.firstName} ${user.lastName}</td>
      <td class="truncate">${user.email}</td>
      <td class="truncate">${user.phone || "—"}</td>
      <td>${user.country || "—"}</td>
      <td>${user.joined || "—"}</td>
    `;

    row.addEventListener("click", () => loadUserDetails(user.id));
    userList.appendChild(row);
  });
}

async function loadUserDetails(id) {
  try {
    const user = await fetchJson(`/api/user-profile/${encodeURIComponent(id)}`);
    currentUser = user;
    populateForm(user);
    setSelectedUser(id);
  } catch (error) {
    console.error(error);
    showStatus("Unable to load the selected profile.");
  }
}

newProfileBtn.addEventListener("click", () => {
  clearForm();
  userList
    .querySelectorAll(".user-item")
    .forEach((item) => item.classList.remove("selected"));
});

editProfileBtn.addEventListener("click", () => {
  if (!selectedUserId) return;
  isEditMode = true;
  setFormDisabled(false);
  showStatus("Editing selected profile. Submit to save changes.");
});

profilePicInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.src = reader.result;
  };
  reader.readAsDataURL(file);
});

async function buildPayload() {
  const formData = new FormData(form);
  const payload = {
    firstName: formData.get("firstName")?.trim(),
    lastName: formData.get("lastName")?.trim(),
    email: formData.get("email")?.trim(),
    phone: formData.get("phone")?.trim() || "",
    birthday: formData.get("birthday") || "",
    country: formData.get("country") || "",
    bio: formData.get("bio")?.trim() || "",
  };

  const file = profilePicInput.files[0];
  if (file) {
    payload.profilePic = await readFileAsDataUrl(file);
  }

  return payload;
}

submitBtn.addEventListener("click", async () => {
  try {
    const payload = await buildPayload();
    if (selectedUserId && currentUser && isEditMode) {
      await fetchJson(
        `/api/user-profile/${encodeURIComponent(selectedUserId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      showStatus("Profile updated successfully.");
    } else {
      const result = await fetchJson("/api/user-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      showStatus(`New profile created: ${result.id}`);
      clearForm();
    }

    await loadUserList();
  } catch (error) {
    console.error(error);
    showStatus(error.message);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  clearForm();
  loadUserList();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
});
