const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spin-btn");
const usernameInput = document.getElementById("username");

const prizes = [
    { text: "1M Ngọc", color: "#f1c40f" },
    { text: "Chúc bạn may mắn", color: "#34495e" },
    { text: "500K Ngọc", color: "#e67e22" },
    { text: "Rương B2", color: "#9b59b6" },
    { text: "100K Ngọc", color: "#e74c3c" },
    { text: "Thêm lượt", color: "#2ecc71" }
];

let startAngle = 0;
const arc = Math.PI / (prizes.length / 2);
let spinTimeout = null;
let spinAngleStart = 10;
let spinTime = 0;
let spinTimeTotal = 0;

// Vẽ vòng quay
function drawWheel() {
    prizes.forEach((prize, i) => {
        const angle = startAngle + i * arc;
        ctx.fillStyle = prize.color;
        ctx.beginPath();
        ctx.moveTo(250, 250);
        ctx.arc(250, 250, 240, angle, angle + arc, false);
        ctx.lineTo(250, 250);
        ctx.fill();
        ctx.save();
        ctx.fillStyle = "white";
        ctx.translate(250 + Math.cos(angle + arc / 2) * 160, 250 + Math.sin(angle + arc / 2) * 160);
        ctx.rotate(angle + arc / 2 + Math.PI / 2);
        ctx.fillText(prize.text, -ctx.measureText(prize.text).width / 2, 0);
        ctx.restore();
    });
}

// Xử lý quay
spinBtn.addEventListener("click", () => {
    const name = usernameInput.value.trim();
    if (!name) return alert("Nhập tên Ingame!");
    
    spinBtn.disabled = true;
    spinAngleStart = Math.random() * 10 + 10;
    spinTime = 0;
    spinTimeTotal = Math.random() * 3 + 4 * 1000;
    rotateWheel();
});

function rotateWheel() {
    spinTime += 30;
    if (spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
    }
    const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
    startAngle += (spinAngle * Math.PI) / 180;
    drawWheel();
    spinTimeout = setTimeout(rotateWheel, 30);
}

function stopRotateWheel() {
    clearTimeout(spinTimeout);
    const degrees = (startAngle * 180) / Math.PI + 90;
    const arcd = (arc * 180) / Math.PI;
    const index = Math.floor((360 - (degrees % 360)) / arcd);
    const result = prizes[index].text;
    
    document.getElementById("result-text").innerText = `Kết quả: ${result}`;
    
    // LƯU LỊCH SỬ LÊN FIREBASE
    const historyRef = window.dbRef(window.db, 'wheelHistory');
    window.dbPush(historyRef, {
        username: usernameInput.value.trim(),
        prize: result,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });

    spinBtn.disabled = false;
}

function easeOut(t, b, c, d) {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
}

// LẮNG NGHE LỊCH SỬ TỪ FIREBASE (Đồng bộ mọi máy)
window.dbOnValue(window.dbRef(window.db, 'wheelHistory'), (snapshot) => {
    const data = snapshot.val();
    const historyBody = document.getElementById("history-body");
    historyBody.innerHTML = "";
    if (data) {
        Object.values(data).reverse().forEach(item => {
            historyBody.innerHTML += `
                <tr>
                    <td>${item.time}</td>
                    <td class="history-name">${item.username}</td>
                    <td>${item.prize}</td>
                </tr>
            `;
        });
    }
});

drawWheel();