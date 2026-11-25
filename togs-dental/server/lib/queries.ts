/** Цагийн жагсаалтын нийтлэг SELECT (үйлчлүүлэгч, эмчийн нэртэй) */
export const APPT_SELECT = `
  SELECT a.*, a.end_min - a.start_min AS duration,
         p.last_name AS p_last_name, p.first_name AS p_first_name, p.phone AS p_phone, p.card_no AS p_card_no, p.allergies AS p_allergies,
         u.name AS doctor_name, u.color AS doctor_color
    FROM appointments a
    LEFT JOIN patients p ON p.id = a.patient_id
    LEFT JOIN users u ON u.id = a.doctor_id`
