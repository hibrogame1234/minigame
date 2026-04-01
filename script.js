const ADMIN_PIN = "171102"; 
const cubes = [document.getElementById('cube1'), document.getElementById('cube2'), document.getElementById('cube3')];
const rollBtn = document.getElementById('roll-btn');

// 1. LẮNG NGHE FIREBASE ĐỂ VẼ BẢNG (Chạy liên tục)
window.dbOnValue(window.dbRef(window.db, 'leaderboard'), (snapshot) => {
    const data = snapshot.val();
    const scoreBody = document.getElementById('score-body');
    scoreBody.innerHTML = ""; 

    if (data) {
        // Chuyển object thành mảng, lọc bỏ các bản ghi lỗi và sắp xếp
        const list = Object.values(data)
            .filter(item => item.username && item.score !== undefined)
            .sort((a, b) => b.score - a.score);
        
        list.slice(0, 10).forEach((item, index) => { // Chỉ lấy Top 10
            scoreBody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.username}</td>
                    <td>${item.score}đ</td>
                </tr>
            `;
        });
    }
});

// 2. LOGIC QUAY XÚC XẮC
rollBtn.addEventListener('click', () => {
    const name = document.getElementById('username').value.trim();
    if (!name) return alert("Nhập tên Ingame!");

    // Kiểm tra xem tên này đã tồn tại trên Firebase chưa (chống quay lại)
    window.dbOnValue(window.dbRef(window.db, 'leaderboard'), (snapshot) => {
        const data = snapshot.val();
        let hasPlayed = false;
        if (data) {
            hasPlayed = Object.values(data).some(item => item.username.toLowerCase() === name.toLowerCase());
        }

        if (hasPlayed) {
            alert("Nhân vật này đã tham gia tuần này rồi!");
        } else {
            startRoll(name);
        }
    }, { onlyOnce: true }); // Quan trọng: chỉ kiểm tra 1 lần rồi thôi
});

function startRoll(name) {
    rollBtn.disabled = true;
    let total = 0;
    
    // Hiệu ứng xoay
    cubes.forEach((cube, i) => {
        const res = Math.floor(Math.random() * 6) + 1;
        total += res;
        const rots = {1:[0,0], 2:[-90,0], 3:[0,-90], 4:[0,90], 5:[90,0], 6:[180,0]};
        setTimeout(() => {
            cube.style.transform = `rotateX(${rots[res][0] + 1800}deg) rotateY(${rots[res][1] + 1800}deg)`;
        }, i * 150);
    });

    // Sau khi xoay xong thì lưu lên Firebase
    setTimeout(() => {
        document.getElementById('total-score').innerText = `Điểm của bạn: ${total}`;
        
        // LƯU LÊN FIREBASE
        const scoresRef = window.dbRef(window.db, 'leaderboard');
        const newScoreRef = window.dbPush(scoresRef);
        window.dbSet(newScoreRef, {
            username: name,
            score: total,
            time: new Date().toLocaleString()
        });
        
        alert(`Chúc mừng ${name} đã nhận được ${total} điểm!`);
    }, 2000);
}

// 3. QUẢN TRỊ ADMIN (Mở Panel)
window.addEventListener('keydown', (e) => {
    // Nhấn phím 'q' (phím tắt cho "Quần què" bạn đặt trong HTML)
    if (e.key.toLowerCase() === 'q') { 
        if (prompt("Nhập mã PIN Admin:") === ADMIN_PIN) {
            document.getElementById('admin-panel').classList.toggle('hidden');
        }
    }
});

// 4. RESET DỮ LIỆU (Xóa sạch Firebase)
document.getElementById('reset-btn').addEventListener('click', () => {
    if(confirm("Xác nhận xóa sạch bảng xếp hạng trên hệ thống?")) {
        window.dbRemove(window.dbRef(window.db, 'leaderboard'))
            .then(() => {
                alert("Đã reset toàn bộ dữ liệu tuần mới!");
                location.reload();
            });
    }
});
// Thay vì gọi trực tiếp, hãy kiểm tra xem Firebase đã sẵn sàng chưa
function checkFirebase() {
    if (window.db) {
        // Chạy các hàm lắng nghe dữ liệu ở đây
        startListening();
    } else {
        setTimeout(checkFirebase, 500); // Thử lại sau 0.5 giây
    }
}