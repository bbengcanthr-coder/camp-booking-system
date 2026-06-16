// 1. คอนฟิกของ Firebase ตัวแรก (ตัวเก่าที่โควต้าเต็ม)
const firebaseConfig1 = {
  apiKey: "AIzaSyB2S_qsAQkFiI-v8cnQ9eAjV0r0Ttz_jtg",
  authDomain: "camp-booking-5b648.firebaseapp.com",
  projectId: "camp-booking-5b648",
  storageBucket: "camp-booking-5b648.firebasestorage.app",
  messagingSenderId: "532723833237",
  appId: "1:532723833237:web:ff37b4323544e6b5dfbe9c",
  measurementId: "G-9C7JQ40FNX"
};

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

// Initialize Firebase ตัวแรก (Default App) สำหรับอ่านข้อมูลเก่า
firebase.initializeApp(firebaseConfig1);
const db1 = firebase.firestore();

// Initialize Firebase ตัวที่สอง (ตั้งชื่อแอปว่า "SecondaryApp") สำหรับเซฟข้อมูลใหม่
const app2 = firebase.initializeApp(firebaseConfig2, "SecondaryApp");
const db2 = app2.firestore();

// ตัวแปรเก็บสถานะที่นั่ง (รวมข้อมูลจากทั้ง 2 ฐานข้อมูล)
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

// โหลดข้อมูลแบบ Real-time จากทั้ง 2 ฐานข้อมูล
function listenToBookings() {
    // ดึงข้อมูลจากฐานข้อมูลเก่า (db1) 
    // *ใส่ catch error ไว้ เผื่อโควต้าฝั่งอ่านของตัวเก่าเต็ม ระบบจะได้ไม่พัง
    db1.collection("bookings").onSnapshot((snapshot) => {
        updateSeatsUI(snapshot);
    }, (error) => {
        console.warn("DB1 Error (โควต้าตัวเก่าอาจจะเต็ม):", error);
    });

    // ดึงข้อมูลจากฐานข้อมูลใหม่ (db2)
    db2.collection("bookings").onSnapshot((snapshot) => {
        updateSeatsUI(snapshot);
    }, (error) => {
        console.error("DB2 Error:", error);
    });
}

// ฟังก์ชันแยกสำหรับอัปเดตหน้าจอ (เพื่อให้โค้ดไม่ซ้ำซ้อน)
function updateSeatsUI(snapshot) {
    snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const seatId = change.doc.id;
        const seatElement = document.getElementById(seatId);
        
        if (change.type === "added" || change.type === "modified") {
            bookings[seatId] = data; // เก็บลงตัวแปรกลาง
            if (seatElement) {
                seatElement.classList.remove('male', 'female');
                seatElement.classList.add('booked');
            }
        }
    });
}

// จัดการเมื่อคลิกที่นอน
function handleSeatClick(seatId, zoneName) {
    if (bookings[seatId]) {
        // ถ้าถูกจองแล้ว (ไม่ว่าจะจาก db1 หรือ db2) ให้เปิด Modal แสดงข้อมูล
        showInfoModal(seatId);
    } else {
        // ถ้ายังว่าง ให้เปิด Modal กรอกข้อมูล
        document.getElementById('seat-id').value = seatId;
        document.getElementById('selected-seat-label').innerText = `คุณกำลังจองจุดที่: ${seatId} (โซน${zoneName})`;
        document.getElementById('booking-modal').style.display = 'flex';
    }
}

// บันทึกการจองลง Firebase (ย้ายไปเซฟลงโปรเจกต์ใหม่ db2)
document.getElementById('booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const seatId = document.getElementById('seat-id').value;
    const btnConfirm = document.querySelector('.btn-confirm');
    btnConfirm.innerText = "กำลังประมวลผล...";
    btnConfirm.disabled = true;

    // 1. เช็กซ้ำอีกรอบจากตัวแปร bookings เผื่อมีคนจองไปใน db1
    if (bookings[seatId]) {
        alert("ขออภัย จุดนี้ถูกจองไปแล้ว โปรดเลือกจุดอื่น");
        btnConfirm.innerText = "ยืนยันการจอง (ไม่สามารถยกเลิกได้)";
        btnConfirm.disabled = false;
        return;
    }

    // 2. เตรียมข้อมูลบันทึกลงฐานข้อมูลใหม่ (db2)
    const seatRef = db2.collection("bookings").doc(seatId);
    
    try {
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

// ฟังก์ชัน Modal คงเดิม
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
