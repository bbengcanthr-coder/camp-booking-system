// ==========================================
// 1. ตั้งค่า Firebase Project ตัวเก่า (ตัวหลัก - ข้อมูลเดิมของคุณ)
// ==========================================
const firebaseConfig1 = {
  apiKey: "AIzaSyB2S_qsAQkFiI-v8cnQ9eAjV0r0Ttz_jtg",
  authDomain: "camp-booking-5b648.firebaseapp.com",
  projectId: "camp-booking-5b648",
  storageBucket: "camp-booking-5b648.firebasestorage.app",
  messagingSenderId: "532723833237",
  appId: "1:532723833237:web:ff37b4323544e6b5dfbe9c",
  measurementId: "G-9C7JQ40FNX"
};

// ==========================================
// 2. ตั้งค่า Firebase Project ตัวใหม่ (สำรอง - รอคุณนำมาใส่)
// ==========================================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA20Aj2VFtKOMrXiePERGM_rHWLDZIuYWU",
  authDomain: "camp-booking-system-e46de.firebaseapp.com",
  projectId: "camp-booking-system-e46de",
  storageBucket: "camp-booking-system-e46de.firebasestorage.app",
  messagingSenderId: "984095824618",
  appId: "1:984095824618:web:a24a4fb1a0c394b1b45593",
  measurementId: "G-WXH9R1TRKN"
};

// Initialize Firebase (ตัวเก่า)
firebase.initializeApp(firebaseConfig1);
const db1 = firebase.firestore();

// Initialize Firebase (ตัวใหม่)
const app2 = firebase.initializeApp(firebaseConfig2, "Secondary");
const db2 = app2.firestore();

// ตัวแปรเก็บสถานะที่นั่ง (เก็บรวมข้อมูลจากทั้ง 2 DB)
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

// โหลดข้อมูลแบบ Real-time (ดึงจากทั้ง 2 ฐานข้อมูล)
function listenToBookings() {
    const processSnapshot = (snapshot) => {
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
    };

    // ดึงจากฐานข้อมูลเก่า
    db1.collection("bookings").onSnapshot(processSnapshot, (error) => {
        console.warn("แจ้งเตือนจาก DB เก่า:", error);
    });

    // ดึงจากฐานข้อมูลใหม่
    db2.collection("bookings").onSnapshot(processSnapshot, (error) => {
        console.error("แจ้งเตือนจาก DB ใหม่:", error);
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

    // ชี้ไปที่ db2 (ฐานข้อมูลใหม่) เพื่อทำการบันทึกข้อมูลใหม่ทั้งหมด
    const seatRef = db2.collection("bookings").doc(seatId);
    
    try {
        // ตรวจสอบขั้นสุดท้าย ป้องกันคนจองซ้ำ
        if (bookings[seatId]) {
            throw "ขออภัย จุดนี้เพิ่งถูกจองไปเมื่อสักครู่ โปรดเลือกจุดอื่น";
        }

        await db2.runTransaction(async (transaction) => {
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
    document.getElementById('info-fullname').innerText = data.fullname || '-';
    document.getElementById('info-nickname').innerText = data.nickname || '-';
    document.getElementById('info-faculty').innerText = data.faculty || '-';
    document.getElementById('info-year').innerText = data.year || '-';
    document.getElementById('info-department').innerText = data.department || '-';
    document.getElementById('info-mixi2').innerText = data.mixi2 || '-';
    
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
