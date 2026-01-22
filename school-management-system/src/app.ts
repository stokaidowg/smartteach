import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as pupilApi from './modules/pupil-management';
import * as staffApi from './modules/staff-management';
import { RegistrationManagement } from './modules/registration-management';
import { RoomManagement } from './modules/room-management';
import { SeatPlanning } from './modules/seat-planning';
import { TimetableManager } from './modules/timetable-manager';
import * as roomApi from './modules/room-management';
import * as teachingApi from './modules/teaching-management';
import * as seatPlanningApi from './modules/seat-planning';
import * as userApi from './modules/user-management';
import * as timetableApi from './modules/timetable-manager';
import * as registrationApi from './modules/registration-management';
import * as coverApi from './modules/cover-management';
import { getPermissions } from './modules/user-management/index';
import jwt from 'jsonwebtoken';
import { getAllRegistrationCodes, postRegistrationCodes } from './modules/registration-management';
import * as globalListsApi from './modules/global-lists';
import * as academicStructureApi from './modules/academic-structure';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const token = auth.slice(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
      if (typeof decoded === 'object' && decoded && 'staff_id' in decoded && 'is_superuser' in decoded) {
        req.user = decoded as { staff_id: string; is_superuser: boolean };
      } else {
        req.user = undefined;
      }
    } catch (e) {
      req.user = undefined;
    }
  }
  next();
});

// Pupil routes
app.get('/pupils', pupilApi.getAllPupils);
app.post('/pupils', pupilApi.addPupil);
app.put('/pupils/:id', pupilApi.updatePupil);
app.delete('/pupils/:id', pupilApi.deletePupil);

// Staff routes
app.get('/staff', staffApi.getAllStaff);
app.post('/staff', staffApi.addStaff);
app.put('/staff/:id', staffApi.updateStaff);
app.delete('/staff/:id', staffApi.deleteStaff);
app.get('/staff-without-user', userApi.getStaffWithoutUser);

// Building routes
app.get('/buildings', roomApi.getAllBuildings);
app.post('/buildings', roomApi.addBuilding);
app.delete('/buildings/:id', roomApi.deleteBuilding);

// Room routes
app.get('/rooms/:buildingId', roomApi.getRoomsByBuilding);
app.post('/rooms', roomApi.addRoom);
app.put('/rooms/:id', roomApi.updateRoom);
app.delete('/rooms/:id', roomApi.deleteRoom);

// Teaching Manager routes
app.get('/subjects', teachingApi.getAllSubjects);
app.post('/subjects', teachingApi.addSubject);
app.get('/sets', teachingApi.getSets);
app.post('/sets', teachingApi.addSet);
app.put('/sets/:id', teachingApi.editSet);
app.delete('/sets/:id', teachingApi.deleteSet);
app.get('/set-teachers', teachingApi.getSetTeachers);
app.post('/set-teachers', teachingApi.addSetTeacher);
app.delete('/set-teachers', teachingApi.deleteSetTeacher);
app.get('/set-pupils', teachingApi.getSetPupils);
app.post('/set-pupils', teachingApi.addSetPupil);
app.delete('/set-pupils', teachingApi.deleteSetPupil);
app.post('/sets/copy-pupils', teachingApi.copySetPupils);
app.post('/assign-room', teachingApi.assignRoomToSet);
app.get('/sets/for-period', teachingApi.getSetsForPeriod);

// Seat Planning routes
app.get('/seat-plan', seatPlanningApi.getSeatPlan);
app.post('/seat-plan', seatPlanningApi.saveSeatPlan);

// Other modules (if needed)
const registrationManagement = new RegistrationManagement();
const roomManagement = new RoomManagement();
const seatPlanning = new SeatPlanning();
const timetableManager = new TimetableManager();

// Timetable routes
app.get('/timetable', timetableApi.getTimetable);
app.post('/timetable', timetableApi.addTimetableEntry);
app.put('/timetable/:id', timetableApi.updateTimetableEntry);
app.delete('/timetable/:id', timetableApi.deleteTimetableEntry);
app.get('/timetable/pupil', timetableManager.getPupilTimetable);
app.get('/timetable/staff', timetableManager.getStaffTimetable);
app.get('/staff-appointments', timetableApi.getStaffAppointments);
app.post('/staff-appointments', timetableApi.addStaffAppointment);
app.delete('/staff-appointments/:id', timetableApi.deleteStaffAppointment);

app.get('/teaching-rooms', roomApi.getTeachingRooms);
app.post('/login', userApi.loginUser);
app.get('/users/:id/permissions', userApi.getUserPermissions);
app.get('/users', userApi.getAllUsers);
app.post('/users', userApi.createUser);
app.put('/users/:id', userApi.updateUser);
app.delete('/users/:id', userApi.deleteUser);
app.get('/permissions', getPermissions);
app.put('/permissions/:id', userApi.updatePermission);
app.get('/users-with-permissions', userApi.getUsersWithPermissions);

// Registration routes
app.get('/registration', registrationApi.getRegistration);
app.post('/registration', registrationApi.saveRegistration);

// Registration Codes routes
app.get('/registration-codes', getAllRegistrationCodes);
app.post('/registration-codes', postRegistrationCodes);

// Cover routes
app.get('/cover', coverApi.getCoverAllocations);
app.post('/cover', coverApi.addCoverAllocation);
app.delete('/cover/:id', coverApi.deleteCoverAllocation);
app.post('/staff-absences', coverApi.addStaffAbsence);
app.get('/staff-absences', coverApi.getStaffAbsences);
app.get('/cover/available-staff', coverApi.getAvailableCoverStaff);
app.delete('/staff-absences/:id', coverApi.deleteStaffAbsence);

// Global Lists routes
app.get('/global-lists/categories', globalListsApi.getAllCategories);
app.get('/global-lists/categories/:key', globalListsApi.getCategoryByKey);
app.get('/global-lists/items', globalListsApi.getAllItems);
app.get('/global-lists/items/:categoryKey', globalListsApi.getItemsByCategory);
app.post('/global-lists/items', globalListsApi.addItem);
app.put('/global-lists/items/:id', globalListsApi.updateItem);
app.delete('/global-lists/items/:id', globalListsApi.deleteItem);
app.post('/global-lists/items/:id/deactivate', globalListsApi.deactivateItem);
app.post('/global-lists/items/:id/reactivate', globalListsApi.reactivateItem);
app.post('/global-lists/items/sort-order', globalListsApi.updateSortOrder);

// Academic Structure routes
// Year Groups
app.get('/year-groups', academicStructureApi.getAllYearGroups);
app.get('/year-groups/:id', academicStructureApi.getYearGroupById);
app.post('/year-groups', academicStructureApi.addYearGroup);
app.put('/year-groups/:id', academicStructureApi.updateYearGroup);
app.delete('/year-groups/:id', academicStructureApi.deleteYearGroup);

// Houses
app.get('/houses', academicStructureApi.getAllHouses);
app.post('/houses', academicStructureApi.addHouse);
app.put('/houses/:id', academicStructureApi.updateHouse);
app.delete('/houses/:id', academicStructureApi.deleteHouse);

// Forms
app.get('/forms', academicStructureApi.getAllForms);
app.post('/forms', academicStructureApi.addForm);
app.put('/forms/:id', academicStructureApi.updateForm);
app.delete('/forms/:id', academicStructureApi.deleteForm);

// Departments
app.get('/departments', academicStructureApi.getAllDepartments);
app.post('/departments', academicStructureApi.addDepartment);
app.put('/departments/:id', academicStructureApi.updateDepartment);
app.delete('/departments/:id', academicStructureApi.deleteDepartment);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
