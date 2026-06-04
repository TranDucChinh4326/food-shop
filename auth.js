const API_BASE_URL = window.FOODHUB_CONFIG?.API_BASE_URL || "http://localhost:3000/api";
const AUTH_API = `${API_BASE_URL}/auth`;

async function register(event) {
  event.preventDefault();

  const fullname = document.getElementById("fullname").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${AUTH_API}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fullname, email, password })
    });
    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Không thể đăng ký.");
      return;
    }

    alert("Đăng ký thành công. Vui lòng đăng nhập.");
    window.location.href = "login.html";
  } catch (error) {
    alert("Không kết nối được server.");
    console.error(error);
  }
}

async function login(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${AUTH_API}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Không thể đăng nhập.");
      return;
    }

    localStorage.setItem("foodhub_token", data.token);
    localStorage.setItem("foodhub_user", JSON.stringify(data.user));

    alert("Đăng nhập thành công.");
    window.location.href = "index.html";
  } catch (error) {
    alert("Không kết nối được server.");
    console.error(error);
  }
}
