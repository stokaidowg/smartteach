import { Request, Response } from 'express';
import { pool } from '../../db';

// Helper to map DB row to frontend shape
function mapPupil(row: any) {
  return {
    id: row.id,
    studentId: row.student_id,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    preferredName: row.preferred_name,
    dob: row.dob ? row.dob.toISOString().slice(0, 10) : '',
    gender: row.gender,
    nationality: row.nationality,
    countryOfBirth: row.country_of_birth,
    languages: row.languages,
    religion: row.religion,
    ethnicity: row.ethnicity,
    photo: row.photo,
    senStatus: row.sen_status,
    senDetails: row.sen_details,
    behaviourNotes: row.behaviour_notes,
    yearGroup: row.year_group,
    form: row.form,
    house: row.house,
    tutor: row.tutor,
    enrollmentDate: row.enrollment_date ? row.enrollment_date.toISOString().slice(0, 10) : '',
    status: row.status,
    keyStage: row.key_stage,
    leavingDate: row.leaving_date ? row.leaving_date.toISOString().slice(0, 10) : '',
    homeAddress: row.home_address,
    primaryPhone: row.primary_phone,
    email: row.email,
    parents: row.parents || [],
  };
}

// Helper to convert empty string to null for date fields
function toDateOrNull(val: string) {
  return val && val.trim() !== '' ? val : null;
}

// GET all pupils
export async function getAllPupils(req: Request, res: Response) {
  const {
    status, form, yearGroup, house,
    enrolledAfter, enrolledBefore,
    leavingAfter, leavingBefore,
    parentName, text
  } = req.query;

  let query = 'SELECT * FROM pupils';
  const clauses: string[] = [];
  const values: any[] = [];

  if (status) { clauses.push('status ILIKE $' + (values.length + 1)); values.push(`%${status}%`); }
  if (form) { clauses.push('form ILIKE $' + (values.length + 1)); values.push(`%${form}%`); }
  if (yearGroup) { clauses.push('year_group ILIKE $' + (values.length + 1)); values.push(`%${yearGroup}%`); }
  if (house) { clauses.push('house ILIKE $' + (values.length + 1)); values.push(`%${house}%`); }
  if (enrolledAfter) { clauses.push('enrollment_date >= $' + (values.length + 1)); values.push(enrolledAfter); }
  if (enrolledBefore) { clauses.push('enrollment_date <= $' + (values.length + 1)); values.push(enrolledBefore); }
  if (leavingAfter) { clauses.push('leaving_date >= $' + (values.length + 1)); values.push(leavingAfter); }
  if (leavingBefore) { clauses.push('leaving_date <= $' + (values.length + 1)); values.push(leavingBefore); }
  if (parentName) {
    clauses.push(`EXISTS (
      SELECT 1 FROM jsonb_array_elements(parents) p
      WHERE p->>'name' ILIKE $${values.length + 1}
    )`);
    values.push(`%${parentName}%`);
  }
  if (text) {
    clauses.push(`(
      first_name ILIKE $${values.length + 1} OR
      middle_name ILIKE $${values.length + 1} OR
      last_name ILIKE $${values.length + 1} OR
      preferred_name ILIKE $${values.length + 1} OR
      student_id ILIKE $${values.length + 1} OR
      year_group ILIKE $${values.length + 1} OR
      form ILIKE $${values.length + 1} OR
      house ILIKE $${values.length + 1} OR
      tutor ILIKE $${values.length + 1} OR
      status ILIKE $${values.length + 1} OR
      EXISTS (
        SELECT 1 FROM jsonb_array_elements(parents) p
        WHERE p->>'name' ILIKE $${values.length + 1}
      )
    )`);
    values.push(`%${text}%`);
  }

  if (clauses.length > 0) {
    query += ' WHERE ' + clauses.join(' AND ');
  }
  query += ' ORDER BY last_name, first_name';

  const result = await pool.query(query, values);
  res.json(result.rows.map(mapPupil));
}

// POST add pupil
export async function addPupil(req: Request, res: Response) {
  const p = req.body;
  const query = `
    INSERT INTO pupils (
      id, student_id, first_name, middle_name, last_name, preferred_name, dob, gender, nationality, country_of_birth,
      languages, religion, ethnicity, photo, sen_status, sen_details, behaviour_notes, year_group, form, house, tutor,
      enrollment_date, status, key_stage, leaving_date, home_address, primary_phone, email, parents
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
      $22, $23, $24, $25, $26, $27, $28, $29
    ) RETURNING *`;
  const values = [
    p.id, p.studentId, p.firstName, p.middleName, p.lastName, p.preferredName, toDateOrNull(p.dob), p.gender, p.nationality, p.countryOfBirth,
    p.languages, p.religion, p.ethnicity, p.photo, p.senStatus, p.senDetails, p.behaviourNotes, p.yearGroup, p.form, p.house, p.tutor,
    toDateOrNull(p.enrollmentDate), p.status, p.keyStage, toDateOrNull(p.leavingDate), p.homeAddress, p.primaryPhone, p.email, JSON.stringify(p.parents || [])
  ];
  const result = await pool.query(query, values);
  res.status(201).json(mapPupil(result.rows[0]));
}

// PUT update pupil
export async function updatePupil(req: Request, res: Response) {
  const { id } = req.params;
  const p = req.body;
  const query = `
    UPDATE pupils SET
      first_name=$1, middle_name=$2, last_name=$3, preferred_name=$4, dob=$5, gender=$6, nationality=$7, country_of_birth=$8,
      languages=$9, religion=$10, ethnicity=$11, photo=$12, sen_status=$13, sen_details=$14, behaviour_notes=$15,
      year_group=$16, form=$17, house=$18, tutor=$19, enrollment_date=$20, status=$21, key_stage=$22, leaving_date=$23,
      home_address=$24, primary_phone=$25, email=$26, parents=$27
    WHERE id=$28 RETURNING *`;
  const values = [
    p.firstName, p.middleName, p.lastName, p.preferredName, toDateOrNull(p.dob), p.gender, p.nationality, p.countryOfBirth,
    p.languages, p.religion, p.ethnicity, p.photo, p.senStatus, p.senDetails, p.behaviourNotes,
    p.yearGroup, p.form, p.house, p.tutor, toDateOrNull(p.enrollmentDate), p.status, p.keyStage, toDateOrNull(p.leavingDate),
    p.homeAddress, p.primaryPhone, p.email, JSON.stringify(p.parents || []), id
  ];
  const result = await pool.query(query, values);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Pupil not found' });
  res.json(mapPupil(result.rows[0]));
}

// DELETE pupil
export async function deletePupil(req: Request, res: Response) {
  const { id } = req.params;
  await pool.query('DELETE FROM pupils WHERE id=$1', [id]);
  res.status(204).send();
}