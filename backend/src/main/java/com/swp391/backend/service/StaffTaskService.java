package com.swp391.backend.service;

import com.swp391.backend.dto.StaffTaskCreateRequest;
import com.swp391.backend.dto.StaffTaskResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.entity.Floor;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.Shift;
import com.swp391.backend.entity.StaffShift;
import com.swp391.backend.entity.StaffTask;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.FloorRepository;
import com.swp391.backend.repository.ReservationRepository;
import com.swp391.backend.repository.ShiftRepository;
import com.swp391.backend.repository.StaffShiftRepository;
import com.swp391.backend.repository.StaffTaskRepository;
import com.swp391.backend.repository.StorageUnitRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;

@Service
public class StaffTaskService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String MAINTENANCE = "MAINTENANCE";
    private static final String CHECKOUT_INSPECTION = "CHECKOUT_INSPECTION";

    private final StaffTaskRepository taskRepository;
    private final AccountRepository accountRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final StaffShiftRepository staffShiftRepository;
    private final ShiftRepository shiftRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FloorRepository floorRepository;
    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final StaffShiftService staffShiftService;
    private final StorageService storageService;

    public StaffTaskService(StaffTaskRepository taskRepository,
                            AccountRepository accountRepository,
                            EmployeeProfileRepository employeeProfileRepository,
                            StaffShiftRepository staffShiftRepository,
                            ShiftRepository shiftRepository,
                            StorageUnitRepository storageUnitRepository,
                            FloorRepository floorRepository,
                            ContractRepository contractRepository,
                            ReservationRepository reservationRepository,
                            StaffShiftService staffShiftService,
                            StorageService storageService) {
        this.taskRepository = taskRepository;
        this.accountRepository = accountRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.staffShiftRepository = staffShiftRepository;
        this.shiftRepository = shiftRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.staffShiftService = staffShiftService;
        this.storageService = storageService;
    }

    @Transactional
    public StaffTaskResponse createTask(Integer managerAccountId, Integer requestedFacilityId,
                                        StaffTaskCreateRequest request) {
        if (request == null || request.employeeId() == null || request.date() == null || request.shiftId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cần cung cấp employeeId, date và shiftId.");
        }
        String taskType = normalizeTaskType(request.taskType());
        EmployeeProfile manager = requireAccountProfile(managerAccountId, 3L, "Manager");
        Integer facilityId = manager.getFacilityId();
        if (requestedFacilityId == null || !facilityId.equals(requestedFacilityId)) {
            throw new AccessDeniedException("Cơ sở yêu cầu không thuộc quyền quản lý của tài khoản.");
        }

        EmployeeProfile employee = employeeProfileRepository.findById(request.employeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên."));
        if (!facilityId.equals(employee.getFacilityId())) {
            throw new AccessDeniedException("Nhân viên không thuộc cơ sở của Manager.");
        }
        Account staffAccount = accountRepository.findAccountByAccountId(employee.getAccountId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản nhân viên."));
        if (!Long.valueOf(4L).equals(staffAccount.getRoleId()) || !"ACTIVE".equalsIgnoreCase(staffAccount.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ có thể giao việc cho Staff đang hoạt động.");
        }

        StaffShift assignment = staffShiftRepository
                .findByEmployeeIdAndFacilityIdAndShiftIdAndWorkDate(
                        employee.getEmployeeId(), facilityId, request.shiftId(), request.date())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "Nhân viên chưa được xếp vào ca này."));
        if (!"SCHEDULED".equalsIgnoreCase(assignment.getStatus())
                && !"ATTENDED".equalsIgnoreCase(assignment.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ca của nhân viên đã bị hủy hoặc không hợp lệ.");
        }
        Shift shift = shiftRepository.findById(request.shiftId())
                .filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Ca làm không hoạt động."));

        String unitCode = request.unitCode() == null || request.unitCode().isBlank()
                ? null : request.unitCode().trim();
        Integer contractId = request.contractId();
        if (MAINTENANCE.equals(taskType)) {
            if (unitCode == null || contractId != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Task MAINTENANCE cần unitCode và không nhận contractId.");
            }
            StorageUnit unit = storageUnitRepository.findById(unitCode)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ô kho."));
            if (!facilityId.equals(getUnitFacilityId(unit))) {
                throw new AccessDeniedException("Ô kho không thuộc cơ sở của Manager.");
            }
            if (!"MAINTENANCE".equalsIgnoreCase(unit.getStatus())
                    && !"MAINTENANCE".equalsIgnoreCase(unit.getStatus())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ô kho chưa ở trạng thái bảo trì.");
            }
            if (!taskRepository.findByFacilityIdAndWorkDateAndShiftIdAndTaskTypeAndUnitCodeAndStatus(
                    facilityId, request.date(), request.shiftId(), MAINTENANCE, unitCode, "ASSIGNED").isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Ô kho đã có task bảo trì đang được giao trong ca này.");
            }
        } else {
            if (contractId == null || unitCode != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Task CHECKOUT_INSPECTION cần contractId và không nhận unitCode riêng.");
            }
            Contract contract = contractRepository.findById(contractId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng."));
            Reservation reservation = reservationRepository.findById(contract.getReservationId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đặt chỗ."));
            StorageUnit unit = storageUnitRepository.findById(reservation.getUnitCode())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ô kho."));
            if (!facilityId.equals(getUnitFacilityId(unit))) {
                throw new AccessDeniedException("Hợp đồng không thuộc cơ sở của Manager.");
            }
            if (!"ACTIVE".equalsIgnoreCase(contract.getStatus())
                    && !"OVERDUE".equalsIgnoreCase(contract.getStatus())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Chỉ có thể giao nghiệm thu trả kho cho hợp đồng ACTIVE hoặc OVERDUE.");
            }
            if (!taskRepository.findByContractIdAndTaskTypeAndStatus(
                    contractId, CHECKOUT_INSPECTION, "ASSIGNED").isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Hợp đồng đã có task nghiệm thu trả kho đang được giao.");
            }
            unitCode = unit.getUnitCode();
        }

        StaffTask task = new StaffTask();
        task.setFacilityId(facilityId);
        task.setAssignedEmployeeId(employee.getEmployeeId());
        task.setAssignedByAccountId(managerAccountId);
        task.setTaskType(taskType);
        task.setUnitCode(unitCode);
        task.setContractId(contractId);
        task.setNote(request.note() == null || request.note().isBlank() ? null : request.note().trim());
        task.setStatus("ASSIGNED");
        task.setWorkDate(request.date());
        task.setShiftId(shift.getShiftId());
        task.setCreatedAt(LocalDateTime.now(VIETNAM_ZONE));
        return toResponse(taskRepository.save(task));
    }

    @Transactional(readOnly = true)
    public List<StaffTaskResponse> getFacilityTasks(Integer managerAccountId, Integer requestedFacilityId,
                                                    LocalDate date) {
        EmployeeProfile manager = requireAccountProfile(managerAccountId, 3L, "Manager");
        if (requestedFacilityId == null || !manager.getFacilityId().equals(requestedFacilityId)) {
            throw new AccessDeniedException("Cơ sở yêu cầu không thuộc quyền quản lý của tài khoản.");
        }
        LocalDate workDate = date == null ? LocalDate.now(VIETNAM_ZONE) : date;
        return taskRepository.findByFacilityIdAndWorkDateOrderByCreatedAtDesc(manager.getFacilityId(), workDate)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public StaffTaskResponse cancelTask(Integer managerAccountId, Integer requestedFacilityId, Integer taskId) {
        EmployeeProfile manager = requireAccountProfile(managerAccountId, 3L, "Manager");
        if (requestedFacilityId == null || !manager.getFacilityId().equals(requestedFacilityId)) {
            throw new AccessDeniedException("Cơ sở yêu cầu không thuộc quyền quản lý của tài khoản.");
        }
        StaffTask task = taskRepository.findByIdForUpdate(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy task."));
        if (!manager.getFacilityId().equals(task.getFacilityId())) {
            throw new AccessDeniedException("Task không thuộc cơ sở của Manager.");
        }
        if (!"ASSIGNED".equalsIgnoreCase(task.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ task ASSIGNED mới được hủy.");
        }
        task.setStatus("CANCELLED");
        return toResponse(taskRepository.save(task));
    }

    @Transactional(readOnly = true)
    public List<StaffTaskResponse> getMyTasks(Integer staffAccountId) {
        EmployeeProfile employee = requireAccountProfile(staffAccountId, 4L, "Staff");
        StaffShift currentShift = staffShiftService.requireCurrentAttendedShift(staffAccountId);
        return taskRepository.findByAssignedEmployeeIdAndWorkDateAndShiftIdOrderByCreatedAtDesc(
                        employee.getEmployeeId(), currentShift.getWorkDate(), currentShift.getShiftId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public StaffTaskResponse markDone(Integer staffAccountId, Integer taskId) {
        EmployeeProfile employee = requireAccountProfile(staffAccountId, 4L, "Staff");
        StaffShift currentShift = staffShiftService.requireCurrentAttendedShift(staffAccountId);
        StaffTask task = taskRepository.findByIdForUpdate(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy task."));
        validateCurrentTask(task, employee, currentShift);
        if (!"ASSIGNED".equalsIgnoreCase(task.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ task ASSIGNED mới được đánh dấu hoàn tất.");
        }

        if (MAINTENANCE.equalsIgnoreCase(task.getTaskType())) {
            storageService.completeMaintenance(task.getUnitCode(), employee.getFacilityId(), staffAccountId);
        } else if (CHECKOUT_INSPECTION.equalsIgnoreCase(task.getTaskType())) {
            Contract contract = contractRepository.findById(task.getContractId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng."));
            if (!"TERMINATED".equalsIgnoreCase(contract.getStatus())
                    && !"COMPLETED".equalsIgnoreCase(contract.getStatus())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Task chỉ hoàn tất sau khi luồng xác nhận trả kho đã bàn giao thành công.");
            }
        }

        task.setStatus("DONE");
        task.setDoneAt(LocalDateTime.now(VIETNAM_ZONE));
        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public StorageUnit completeMaintenanceForCurrentStaff(String unitCode, Integer staffAccountId) {
        EmployeeProfile employee = requireAccountProfile(staffAccountId, 4L, "Staff");
        StaffShift currentShift = staffShiftService.requireCurrentAttendedShift(staffAccountId);
        List<StaffTask> maintenanceTasks = taskRepository
                .findByFacilityIdAndWorkDateAndShiftIdAndTaskTypeAndUnitCodeAndStatus(
                        employee.getFacilityId(), currentShift.getWorkDate(), currentShift.getShiftId(),
                        MAINTENANCE, unitCode, "ASSIGNED");
        if (!maintenanceTasks.isEmpty()) {
            StaffTask task = maintenanceTasks.get(0);
            if (!task.getAssignedEmployeeId().equals(employee.getEmployeeId())) {
                throw new AccessDeniedException("Ô kho đang được giao nghiệm thu cho nhân viên khác.");
            }
            markDone(staffAccountId, task.getTaskId());
            return storageUnitRepository.findById(unitCode)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ô kho."));
        }
        return storageService.completeMaintenance(unitCode, employee.getFacilityId(), staffAccountId);
    }

    @Transactional
    public void completeCheckoutTaskForCurrentStaff(Integer contractId, Integer staffAccountId) {
        EmployeeProfile employee = requireAccountProfile(staffAccountId, 4L, "Staff");
        StaffShift currentShift = staffShiftService.requireCurrentAttendedShift(staffAccountId);
        for (StaffTask task : taskRepository.findByContractIdAndTaskTypeAndStatus(
                contractId, CHECKOUT_INSPECTION, "ASSIGNED")) {
            if (task.getAssignedEmployeeId().equals(employee.getEmployeeId())
                    && task.getWorkDate().equals(currentShift.getWorkDate())
                    && task.getShiftId().equals(currentShift.getShiftId())) {
                task.setStatus("DONE");
                task.setDoneAt(LocalDateTime.now(VIETNAM_ZONE));
                taskRepository.save(task);
            }
        }
    }

    private void validateCurrentTask(StaffTask task, EmployeeProfile employee, StaffShift currentShift) {
        if (!task.getAssignedEmployeeId().equals(employee.getEmployeeId())
                || !task.getFacilityId().equals(employee.getFacilityId())) {
            throw new AccessDeniedException("Task không được giao cho Staff này.");
        }
        if (!task.getWorkDate().equals(currentShift.getWorkDate())
                || !task.getShiftId().equals(currentShift.getShiftId())) {
            throw new AccessDeniedException("Task không thuộc ca hiện tại của Staff.");
        }
    }

    private EmployeeProfile requireAccountProfile(Integer accountId, long roleId, String roleName) {
        if (accountId == null) {
            throw new AccessDeniedException("Tài khoản " + roleName + " chưa được xác thực.");
        }
        Account account = accountRepository.findAccountByAccountId(accountId)
                .orElseThrow(() -> new AccessDeniedException("Không tìm thấy tài khoản " + roleName + "."));
        if (!Long.valueOf(roleId).equals(account.getRoleId()) || !"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            throw new AccessDeniedException("Tài khoản không có quyền " + roleName + " hoạt động.");
        }
        return employeeProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new AccessDeniedException("Không tìm thấy hồ sơ " + roleName + "."));
    }

    private String normalizeTaskType(String value) {
        String taskType = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!MAINTENANCE.equals(taskType) && !CHECKOUT_INSPECTION.equals(taskType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "taskType phải là MAINTENANCE hoặc CHECKOUT_INSPECTION.");
        }
        return taskType;
    }

    private Integer getUnitFacilityId(StorageUnit unit) {
        Floor floor = floorRepository.findById(unit.getFloorId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tầng ô kho."));
        return floor.getFacilityId();
    }

    private StaffTaskResponse toResponse(StaffTask task) {
        String employeeName = employeeProfileRepository.findById(task.getAssignedEmployeeId())
                .flatMap(employee -> accountRepository.findAccountByAccountId(employee.getAccountId()))
                .map(Account::getFullName).orElse(null);
        String shiftName = shiftRepository.findById(task.getShiftId()).map(Shift::getShiftName).orElse(null);
        return new StaffTaskResponse(task.getTaskId(), task.getFacilityId(), task.getAssignedEmployeeId(),
                employeeName, task.getAssignedByAccountId(), task.getTaskType(), task.getUnitCode(),
                task.getContractId(), task.getNote(), task.getStatus(), task.getWorkDate(), task.getShiftId(),
                shiftName, task.getCreatedAt(), task.getDoneAt());
    }
}
