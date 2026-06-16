// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB2S_qsAQkFiI-v8cnQ9eAjV0r0Ttz_jtg",
  authDomain: "camp-booking-5b648.firebaseapp.com",
  projectId: "camp-booking-5b648",
  storageBucket: "camp-booking-5b648.firebasestorage.app",
  messagingSenderId: "532723833237",
  appId: "1:532723833237:web:ff37b4323544e6b5dfbe9c",
  measurementId: "G-9C7JQ40FNX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ตัวแปรเก็บสถานะที่นั่ง
let bookings = {};

// สร้างจุดจองที่นอน
function generateSeats() {
    const maleContainer = document.getElementById('male-seats');
    const femaleContainer = document.getElementById('female-seats');

    // สร้างโซนชาย 230 ที่
    for (let i = 1; i <= 230; i++) {
        const seatId = `M${i}`;
        const seat = document.createElement('div');
        seat.className = 'seat male';
        seat.id = seatId;
        seat.innerText = i;
        seat.onclick = () => handleSeatClick(seatId, 'ชาย');
        maleContainer.appendChild(seat);
    }

    // สร้างโซนหญิง 160 ที่
    for (let i = 1; i <= 160; i++) {
        const seatId = `F${i}`;
        const seat = document.createElement('div');
        seat.className = 'seat female';
        seat.id = seatId;
        seat.innerText = i;
        seat.onclick = () => handleSeatClick(seatId, 'หญิง');
        femaleContainer.appendChild(seat);
    }
}

// โหลดข้อมูลแบบ Real-time
function listenToBookings() {
    db.collection("bookings").onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const seatId = change.doc.id;
            const seatElement = document.getElementById(seatId);
            
            if (change.type === "added" || change.type === "modified") {
                bookings[seatId] = data;
                if (seatElement) {
                    seatElement.classList.remove('male', 'female');
                    seatElement.classList.add('booked');
                }
            }
        });
    });
}

// จัดการเมื่อคลิกที่นอน
function handleSeatClick(seatId, zoneName) {
    if (bookings[seatId]) {
        // ถ้าถูกจองแล้ว ให้เปิด Modal แสดงข้อมูล
        showInfoModal(seatId);
    } else {
        // ถ้ายังว่าง ให้เปิด Modal กรอกข้อมูล
        document.getElementById('seat-id').value = seatId;
        document.getElementById('selected-seat-label').innerText = `คุณกำลังจองจุดที่: ${seatId} (โซน${zoneName})`;
        document.getElementById('booking-modal').style.display = 'flex';
    }
}

// บันทึกการจองลง Firebase
document.getElementById('booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const seatId = document.getElementById('seat-id').value;
    const btnConfirm = document.querySelector('.btn-confirm');
    btnConfirm.innerText = "กำลังประมวลผล...";
    btnConfirm.disabled = true;

    // ตรวจสอบขั้นสุดท้ายว่ามีคนจองตัดหน้าหรือไม่ (Transaction)
    const seatRef = db.collection("bookings").doc(seatId);
    
    try {
        await db.runTransaction(async (transaction) => {
            const seatDoc = await transaction.get(seatRef);
            if (seatDoc.exists) {
                throw "ขออภัย จุดนี้เพิ่งถูกจองไปเมื่อสักครู่ โปรดเลือกจุดอื่น";
            }

            const bookingData = {
                fullname: document.getElementById('fullname').value,
                nickname: document.getElementById('nickname').value,
                faculty: document.getElementById('faculty').value,
                year: document.getElementById('year').value,
                department: document.getElementById('department').value,
                mixi2: document.getElementById('mixi2').value,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            transaction.set(seatRef, bookingData);
        });

        alert("จองที่นอนสำเร็จ!");
        closeModal();
        document.getElementById('booking-form').reset();
    } catch (error) {
        alert(error);
        closeModal();
    } finally {
        btnConfirm.innerText = "ยืนยันการจอง (ไม่สามารถยกเลิกได้)";
        btnConfirm.disabled = false;
    }
});

// ฟังก์ชัน Modal
function closeModal() {
    document.getElementById('booking-modal').style.display = 'none';
}

function showInfoModal(seatId) {
    const data = bookings[seatId];
    document.getElementById('info-seat-id').innerText = seatId;
    document.getElementById('info-fullname').innerText = data.fullname;
    document.getElementById('info-nickname').innerText = data.nickname;
    document.getElementById('info-faculty').innerText = data.faculty;
    document.getElementById('info-year').innerText = data.year;
    document.getElementById('info-department').innerText = data.department;
    document.getElementById('info-mixi2').innerText = data.mixi2;
    
    document.getElementById('info-modal').style.display = 'flex';
}

function closeInfoModal() {
    document.getElementById('info-modal').style.display = 'none';
}

// เริ่มต้นระบบ
window.onload = () => {
    generateSeats();
    listenToBookings();
};
