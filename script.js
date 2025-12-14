const mahasiswa = ["Andi", "Budi", "Citra", "Dewi", "Eka"];

const matkulToKelas = {
  "Pemrograman Web": "Kelas A",
  "Basis Data": "Kelas B",
};

let attendance = JSON.parse(localStorage.getItem("attendance")) || {};

if (Object.keys(attendance).length === 0) {
  Object.values(matkulToKelas).forEach((kelas) => {
    attendance[kelas] = {};
    for (let i = 1; i <= 12; i++) {
      attendance[kelas][i] = {};
      mahasiswa.forEach((nama) => {
        attendance[kelas][i][nama] = false;
      });
    }
  });
  localStorage.setItem("attendance", JSON.stringify(attendance));
}

const pertemuanSelect = document.getElementById("pertemuanSelect");
const pertemuanMhs = document.getElementById("pertemuanMhs");

// Generate pertemuan
for (let i = 1; i <= 12; i++) {
  const opt = new Option(`Pertemuan ${i}`, i);
  pertemuanSelect?.appendChild(opt);
  pertemuanMhs?.appendChild(opt.cloneNode(true));
}

// Halaman Dosen
if (document.getElementById("mahasiswaList")) {
  checkAuth("dosen");
  const kelasSelect = document.getElementById("kelasSelect");
  const list = document.getElementById("mahasiswaList");

  function updateList() {
    const kelas = kelasSelect.value;
    const pertemuan = pertemuanSelect.value;
    list.innerHTML = "";
    mahasiswa.forEach((nama) => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${nama}
        <div>
          <button class="hadir">Hadir</button>
          <button class="tidak">Tidak</button>
        </div>
      `;
      li.querySelector(".hadir").onclick = () => {
        attendance[kelas][pertemuan][nama] = true;
        localStorage.setItem("attendance", JSON.stringify(attendance));
        updatePersentase();
      };
      li.querySelector(".tidak").onclick = () => {
        attendance[kelas][pertemuan][nama] = false;
        localStorage.setItem("attendance", JSON.stringify(attendance));
        updatePersentase();
      };
      list.appendChild(li);
    });
    updatePersentase();
    updateQR();
  }

  function updatePersentase() {
    const kelas = kelasSelect.value;
    const pertemuan = pertemuanSelect.value;
    const hadir = Object.values(attendance[kelas][pertemuan]).filter(
      (v) => v
    ).length;
    const total = mahasiswa.length;
    document.getElementById("persentase").innerText = `${Math.round(
      (hadir / total) * 100
    )}%`;
  }

  function updateQR() {
    const kelas = kelasSelect.value;
    const pertemuan = pertemuanSelect.value;
    new QRious({
      element: document.getElementById("qrDosen"),
      value: `ABSEN-${kelas.replace(" ", "")}-Pertemuan${pertemuan}`,
      size: 200,
    });
  }

  kelasSelect.addEventListener("change", updateList);
  pertemuanSelect.addEventListener("change", updateList);
  updateList();
}

// Halaman Mahasiswa
if (document.getElementById("video")) {
  checkAuth("mahasiswa");
  const matkulSelect = document.getElementById("matkulSelect");
  const statusList = document.getElementById("statusList");
  const nameMap = { mhs1: "Andi" }; // map username to name

  function updateStatusList() {
    const matkul = matkulSelect.value;
    const kelas = matkulToKelas[matkul];
    statusList.innerHTML = "";
    const user = JSON.parse(localStorage.getItem("userLogin"));
    if (!user) return;
    const nama = nameMap[user.username];
    for (let i = 1; i <= 12; i++) {
      const isHadir =
        attendance[kelas] && attendance[kelas][i] && attendance[kelas][i][nama];
      const li = document.createElement("li");
      li.innerHTML = `Pertemuan ${i} <span class="${
        isHadir ? "success" : "tidak"
      }">${isHadir ? "● Hadir" : "● Tidak Hadir"}</span>`;
      statusList.appendChild(li);
    }
  }

  matkulSelect.addEventListener("change", updateStatusList);
  pertemuanMhs.addEventListener("change", updateStatusList);
  updateStatusList();

  const html5QrCode = new Html5Qrcode("video");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (text) => {
      const matkul = matkulSelect.value;
      const pertemuan = pertemuanMhs.value;
      const expected = `ABSEN-${matkulToKelas[matkul].replace(
        " ",
        ""
      )}-Pertemuan${pertemuan}`;
      if (text === expected) {
        const user = JSON.parse(localStorage.getItem("userLogin"));
        const nama = nameMap[user.username];
        attendance[matkulToKelas[matkul]][pertemuan][nama] = true;
        localStorage.setItem("attendance", JSON.stringify(attendance));
        document.getElementById("hasilScan").innerText = "Absensi Berhasil";
        updateStatusList();
        html5QrCode.stop();
      }
    }
  );
}

// Dummy akun
const users = [
  { username: "dosen1", password: "123", role: "dosen" },
  { username: "mhs1", password: "123", role: "mahasiswa", name: "Andi" },
];

function login() {
  const role = document.getElementById("role").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const user = users.find(
    (u) => u.username === username && u.password === password && u.role === role
  );

  if (!user) {
    alert("Login gagal");
    return;
  }

  localStorage.setItem("userLogin", JSON.stringify(user));

  if (role === "dosen") {
    window.location.href = "dosen.html";
  } else {
    window.location.href = "mahasiswa.html";
  }
}

function logout() {
  localStorage.removeItem("userLogin");
  window.location.href = "index.html";
}

function checkAuth(role) {
  const user = JSON.parse(localStorage.getItem("userLogin"));
  if (!user || user.role !== role) {
    window.location.href = "login.html";
  }
}
