import { Request, Response } from 'express';
import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  user: 'school_user',
  host: 'localhost',
  database: 'smartTeach',
  password: '123',
  port: 5432,
});

// GET all staff
export async function getAllStaff(req: Request, res: Response) {
  const result = await pool.query('SELECT * FROM staff ORDER BY last_name, first_name');
  res.json(result.rows);
}

// POST add staff
export async function addStaff(req: Request, res: Response) {
  const {
    id,
    first_name,
    middle_name,
    last_name,
    preferred_name,
    title,
    gender,
    dob,
    national_id,
    staff_id,
    photo,
    nationality,
    languages,
    religion,
    job_title,
    department,
    role_type,
    line_manager,
    start_date,
    employment_type,
    status,
    working_hours,
    teaching_subjects,
    year_responsibility,
    work_email,
    personal_email,
    phone_mobile,
    phone_work,
    phone_home,
    home_address,
    emergency_contact,
    qualifications,
    safeguarding,
    first_aid,
    background_check,
    documents,
    payroll,
    schedule,
    notes,
    is_teaching_staff,
    is_cover_staff,
    max_teaching_hours
  } = req.body;

  await pool.query(
    `INSERT INTO staff (
      id, first_name, middle_name, last_name, preferred_name, title, gender, dob, national_id, staff_id, photo,
      nationality, languages, religion, job_title, department, role_type, line_manager, start_date, employment_type,
      status, working_hours, /* REMOVE location, */ teaching_subjects, year_responsibility, work_email, personal_email,
      phone_mobile, phone_work, phone_home, home_address, emergency_contact, qualifications, safeguarding, first_aid,
      background_check, documents, payroll, schedule, notes, is_teaching_staff, is_cover_staff, max_teaching_hours
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
      $12,$13,$14,$15,$16,$17,$18,$19,$20,
      $21,$22,/* REMOVE $23, */$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42
    )`,
    [
      id, first_name, middle_name, last_name, preferred_name, title, gender, dob || null, national_id, staff_id, photo,
      nationality, languages, religion, job_title, department, role_type, line_manager, start_date || null, employment_type,
      status, working_hours, /* REMOVE location, */ teaching_subjects, year_responsibility, work_email, personal_email,
      phone_mobile, phone_work, phone_home, home_address, emergency_contact ? JSON.stringify(emergency_contact) : null,
      qualifications ? JSON.stringify(qualifications) : null, safeguarding, first_aid, background_check,
      documents ? JSON.stringify(documents) : null, payroll ? JSON.stringify(payroll) : null,
      schedule ? JSON.stringify(schedule) : null, notes, is_teaching_staff, is_cover_staff, max_teaching_hours
    ]
  );
  res.status(201).json({ success: true });
}

// PUT update staff
export async function updateStaff(req: Request, res: Response) {
  const { id } = req.params;
  const {
    first_name,
    middle_name,
    last_name,
    preferred_name,
    title,
    gender,
    dob,
    national_id,
    staff_id,
    photo,
    nationality,
    languages,
    religion,
    job_title,
    department,
    role_type,
    line_manager,
    start_date,
    employment_type,
    status,
    working_hours,
    teaching_subjects,
    year_responsibility,
    work_email,
    personal_email,
    phone_mobile,
    phone_work,
    phone_home,
    home_address,
    emergency_contact,
    qualifications,
    safeguarding,
    first_aid,
    background_check,
    documents,
    payroll,
    schedule,
    notes,
    is_teaching_staff,
    is_cover_staff,
    max_teaching_hours
  } = req.body;

  await pool.query(
    `UPDATE staff SET
      first_name=$1, middle_name=$2, last_name=$3, preferred_name=$4, title=$5, gender=$6, dob=$7, national_id=$8, staff_id=$9, photo=$10,
      nationality=$11, languages=$12, religion=$13, job_title=$14, department=$15, role_type=$16, line_manager=$17, start_date=$18, employment_type=$19,
      status=$20, working_hours=$21, /* REMOVE location=$22, */ teaching_subjects=$22, year_responsibility=$23, work_email=$24, personal_email=$25,
      phone_mobile=$26, phone_work=$27, phone_home=$28, home_address=$29, emergency_contact=$30, qualifications=$31, safeguarding=$32, first_aid=$33,
      background_check=$34, documents=$35, payroll=$36, schedule=$37, notes=$38, is_teaching_staff=$39, is_cover_staff=$40, max_teaching_hours=$41
      WHERE id=$42`,
    [
      first_name, middle_name, last_name, preferred_name, title, gender, dob || null, national_id, staff_id, photo,
      nationality, languages, religion, job_title, department, role_type, line_manager, start_date || null, employment_type,
      status, working_hours, /* REMOVE location, */ teaching_subjects, year_responsibility, work_email, personal_email,
      phone_mobile, phone_work, phone_home, home_address, emergency_contact ? JSON.stringify(emergency_contact) : null,
      qualifications ? JSON.stringify(qualifications) : null, safeguarding, first_aid, background_check,
      documents ? JSON.stringify(documents) : null, payroll ? JSON.stringify(payroll) : null,
      schedule ? JSON.stringify(schedule) : null, notes, is_teaching_staff, is_cover_staff, max_teaching_hours, id
    ]
  );
  res.json({ success: true });
}

// DELETE staff
export async function deleteStaff(req: Request, res: Response) {
  const { id } = req.params;
  await pool.query('DELETE FROM staff WHERE id = $1', [id]);
  res.json({ success: true });
}